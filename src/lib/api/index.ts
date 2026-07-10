// DEMO BRANCH: the data-access layer is served entirely from the in-memory
// mock in src/lib/demo — no Supabase, no network, no env vars. Components
// and hooks import from `@/lib/api` exactly as on main; only this file and
// the demo folder differ. The real Supabase-backed modules still live next
// to this file, unreferenced on this branch.

export {
  profiles,
  projects,
  milestones,
  tasks,
  documents,
  dailyLogs,
  storage,
  realtime,
  conversations,
  push,
} from '../demo/api';
