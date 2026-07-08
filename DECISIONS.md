# Tavron Backend — Decisions Log

One line per decision. Update lines in place; don't duplicate.

## Confirmed by owner (2026-07-06)
- `daily_logs` = per-engineer daily work log; optional links to project and/or task; PMs read all, engineers read/write their own; new screens for both roles.
- Tasks can be standalone: `tasks.project_id` is nullable; PM creates/deletes, assignee updates status; same TODO/IN_PROGRESS/DONE lifecycle.
- Single-org: no `org_id`, no tenant-isolation RLS. 2 PMs + 16 engineers.
- Engineer write rights: update status of **own** tasks + comment on task discussions + own daily logs. Everything else PM-only.
- Auth: PM invites engineers via Edge Function (`inviteUserByEmail`); self-signup to be disabled; role/discipline carried in invite metadata → profile created by trigger.
- No direct messages: Messages view stays task-discussion-only; "Direct Messages" quick action label to be adjusted.

## Independent decisions (schema/infra)
- Old backend on main is disposable (all 7 tables at 0 rows, both legacy buckets unused); nothing on the project is touched until owner approves applying the migrations.
- Supabase branching unavailable (MCP is project-scoped → no confirm_cost tool; Pro plan required anyway). Owner chose: migrations written locally in `supabase/migrations/`, reviewed, then applied to the project directly — the review replaces the branch (2026-07-06).
- Comments are immutable from the client (no update/delete policies) — the discussion is the audit trail.
- No client-side profile deletes; engineer removal happens via auth admin (dashboard), profile row cascades.
- Storage reads open to all authenticated users (18-person single team); writes path-scoped: engineers only under `comment-images/`.
- No realtime subscriptions in v1 — mutations refetch; simplest model for a handoff.
- Enums over check constraints for statuses (`project_status`, `milestone_status`, `task_status`, `doc_type`, `app_role`) — typed contracts pick them up.
- `messages` table renamed concept → `task_comments` (matches what the frontend actually does).
- `profiles.discipline` holds "Mechanical Engineer" etc. (frontend's `Engineer.role`); `profiles.role` is the app role (MANAGER/ENGINEER).
- Child mutations (milestones/tasks/documents) bump parent `projects.updated_at` via trigger — frontend shows "last updated".
- `daily_logs`: multiple entries per engineer per day allowed (no unique constraint) — simpler, covers editing habits.
- Storage: single private bucket `attachments` with path prefixes (`milestone-proofs/`, `comment-images/`, `documents/`); data layer serves signed URLs.
- RLS helpers `is_manager()` / `is_project_member(uuid)` as SECURITY DEFINER functions to avoid policy recursion.
- Column-level guards (assignee may only change task `status`; users can't change own `role`) enforced by BEFORE UPDATE triggers, not RLS.
- Frontend data layer: `src/lib/api/` (one module per entity) + generated `src/types/database.ts` from Supabase schema; `useProjects` keeps its exact API surface but delegates to the data layer.

## Access matrix (target for RLS + subagent verification)
| Entity | MANAGER | ENGINEER |
|---|---|---|
| profiles | read all; update any | read all; update own (not role) |
| projects | full CRUD | read only where member |
| project_members | full CRUD | read own memberships + rosters of own projects |
| milestones | full CRUD | read (own projects) |
| tasks | full CRUD | read (own projects + assigned); update **status** of own |
| task_comments | read/write on all | read/write where task visible; author = self |
| documents | full CRUD | read (own projects) |
| daily_logs | read all | CRUD own |
| storage `attachments` | read/write all | read; write only `comment-images/` |

## Frontend wiring decisions (Phase 4)
- Data layer at `src/lib/api/` (one module per entity); components/hooks never import the Supabase client directly. `useProjects` keeps its role as the single state hub; mutations = await API → refetch (data volumes are tiny).
- Mock-era "Undo" toast button removed: server-side undo of cascading deletes is real scope; toast (with error variant) retained. Owner can veto.
- Mock-era "Simulate Engineer Reply" buttons removed everywhere — messages now send as the signed-in user.
- Open sign-up removed from AuthScreen (invite-only auth); invited users get a set-password screen (`type=invite` in URL hash).
- Signed URLs (1h TTL) resolved in one batch per fetch; UI components stay URL-based like the mock.
- New views matching existing design: `TasksView` (PM: Delegate Work / Engineer: My Tasks) and `DailyLogsView` (engineer writes own; PM reads all with author filter).
- "Direct Messages" quick action renamed to "Task Discussions" (DMs dropped by owner decision).
- `npm run gen:types` regenerates `src/types/database.ts` from the live schema.

## Applied state (2026-07-06, owner approved)
- 8 migrations applied to `oetjscpamsvgtwaeuzfg`: drop_legacy_schema, drop_legacy_auth_trigger, initial_schema, rls_policies, storage, seed_existing_users, drop_legacy_storage_policies, security_hardening. Local files in `supabase/migrations/` mirror them 1:1.
- Edge function `invite-engineer` deployed (v1, verify_jwt on).
- Security advisors: 18 warnings → 4; remaining 4 accepted: 3× RLS helpers executable by `authenticated` (required for policy evaluation; expose only booleans), 1× leaked-password protection (manual dashboard toggle).
- Legacy `ensure_rls` event trigger kept intentionally: auto-enables RLS on any new table.
- `src/types/database.ts` generated from the live schema; regenerate after every migration.
- RLS verified by an independent subagent (2026-07-07): 72/72 access-matrix assertions PASS, including anon-role sweep and non-member engineer cells; all tests ran in rolled-back transactions. Caveat noted: task_comments immutability relies on the absence of UPDATE/DELETE policies — don't add broad policies there later.

## Realtime & chat responsiveness (2026-07-08)
- App tables added to the `supabase_realtime` publication; the frontend subscribes to
  `postgres_changes` (`src/lib/api/realtime.ts`). Events from other clients drive updates.
- Chat is the one deliberate exception to the "mutate → refetch everything" rule:
  - Sends are optimistic (message renders at tap time with a temp id; the confirmed row
    replaces it; failures stay flagged in the thread so the text isn't lost).
  - Incoming message INSERT events patch one fetched row into state instead of triggering
    a refetch (single-row read under the reader's own RLS).
  - Structural changes still use the debounced refetch-everything model in `useProjects`;
    chat tables are excluded from that lane so chat volume never causes full refetches.
- Trade-off accepted: optimistic UI adds failure-handling complexity, but chat is where
  latency is felt; all other mutations keep the simple await-then-refetch model.

## Messages inbox redesign (2026-07-08) — goal: replace the team's WhatsApp
- Owner's product goal: Tavron replaces WhatsApp for *work* communication (16 engineers,
  2 managers, 4–5 concurrent projects). DMs and social chatter deliberately NOT replicated
  beyond 1:1 — see below.
- Unified conversation model (`conversations` + `messages` + `conversation_reads`), replacing
  `task_comments` (rows migrated, ids/timestamps preserved, table dropped):
  - Types: TASK (per task), MILESTONE (per milestone), PROJECT ("General" channel), DM (1:1).
  - Entity conversations are created by DB triggers on project/task/milestone insert;
    DMs are created by the client (`startDm`, ordered pair + unique index handles races).
  - `fetch_inbox()` RPC (SECURITY INVOKER) returns every visible conversation with last-message
    preview and unread count in one round trip. `conversation_reads` powers unread badges.
  - Messages no longer bump `projects.updated_at`; the inbox sorts on
    `conversations.last_message_at` (trigger-maintained).
- 1:1 DMs reversed the earlier "no DMs" decision *because* the goal changed to replacing
  WhatsApp: if Tavron can't host private work chat, WhatsApp survives and pulls everything
  back. Guardrails: 1:1 only (no group DMs — project channels are the groups), culture rule
  that task decisions get repeated in the task thread.
- Threading: reply-quotes (`messages.reply_to`, WhatsApp-style) instead of Slack-style nested
  threads — the team's mental model, and unread/push logic stays simple. Topic drift in
  General should become a task/milestone thread, not a nested chat.
- UI: inbox sidebar grouped by project (General pinned first), activity-sorted with previews
  and unread badges (rolled up on collapsed sections + the Comm nav tab), DM section with
  team picker, DONE-task threads auto-archive. Empty task/milestone threads are hidden in the
  sidebar and reachable from their entity's "Discuss" button. ProjectDetails' inline task chat
  was removed — Messages is the single chat surface.
- Two RLS/PostgREST gotchas fixed during verification (machine-verified end-to-end):
  - `conversations` SELECT policy must be inline over row columns, not a self-querying helper —
    INSERT ... RETURNING can't see its own row through a function's snapshot.
  - Self-referencing embed must be spelled `reply:reply_to(...)`; `messages!reply_to` resolves
    to the child direction.
- Next phases agreed with owner: PWA + Web Push notifications (adoption-critical), voice notes.

## Open questions
- (none currently)

## Pending manual steps (need owner, dashboard-only)
- Disable email self-signup: Dashboard → Auth → Sign In / Up → Email.
- Enable leaked password protection: Dashboard → Auth → Passwords.
- Delete empty legacy buckets `chat-images` and `project-docs`: Dashboard → Storage (SQL deletion is blocked by storage.protect_delete).
- Set Auth Site URL (Dashboard → Auth → URL Configuration) to the deployed app URL so invite-email links land on the app, not localhost.
- Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in deployment env (local `.env` already written).
