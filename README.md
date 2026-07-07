# Tavron Project Hub

Internal project management for one organization: **2 Project Managers + 16 Engineers**.
React (Vite) frontend on a Supabase backend (Postgres + Auth + Storage + Edge Functions).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://oetjscpamsvgtwaeuzfg.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key from Dashboard → Settings → API>
```

## How the code is organized

```
src/
  lib/api/          ← THE data-access layer. One module per entity.
                      Components never call the Supabase client directly.
  lib/supabase.ts   ← the single typed client
  types.ts          ← UI-facing domain types (what components consume)
  types/database.ts ← GENERATED from the DB schema (npm run gen:types)
  hooks/useProjects.ts ← single state hub; mutations = await API → refetch
  contexts/AuthContext.tsx ← session + profile (role comes from profiles.role)
  components/<feature>/    ← auth, layout, projects, dashboard, messages,
                             tasks, logs, actions, account, ui
supabase/
  migrations/       ← full schema history (source of truth for the DB)
  functions/invite-engineer/ ← manager-only email invitations
```

Read `DECISIONS.md` first — every schema, RLS, and wiring decision is recorded
there, one line each, including the access matrix.

## Roles

- **MANAGER** — full CRUD on projects/milestones/tasks/documents/members; invites engineers; reads all daily logs.
- **ENGINEER** — sees only assigned projects; updates the status of own tasks; participates in task discussions; owns their daily logs.

Enforced by Postgres RLS (see `supabase/migrations/*_rls_policies.sql`), not by the UI.
The UI's read-only modes are convenience, not security.

## Common maintenance tasks

| Task | How |
|---|---|
| Change the schema | Add a migration in `supabase/migrations/`, apply it (Supabase MCP `apply_migration` or `npx supabase db push`), then `npm run gen:types` |
| Typecheck | `npm run lint` |
| Deploy | `npm run build` → Vercel (set the two `VITE_*` env vars) |
| Invite an engineer | In-app: Quick Actions → Add Engineer (manager account) |
| Promote someone to manager | `update public.profiles set role = 'MANAGER' where email = '...'` (SQL editor) |

## Auth flow

Invite-only. A manager invites via the app → Supabase emails an invite link →
the invitee lands on the app, sets a password, and their profile row (role
ENGINEER, discipline from the invite) is created by a DB trigger. Self-signup
is disabled by design.
