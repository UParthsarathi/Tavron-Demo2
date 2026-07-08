-- Realtime change notifications.
--
-- Adds the app tables to the `supabase_realtime` publication so clients can
-- subscribe to postgres_changes events. The frontend uses these events only
-- as a "something changed" signal and refetches through the normal
-- RLS-enforced API (src/lib/api/realtime.ts) — payloads are ignored.
--
-- Delivery of INSERT/UPDATE events is authorized per-subscriber against the
-- tables' RLS select policies (e.g. engineers only receive task_comments
-- events for tasks they can view). DELETE events carry only the primary key
-- and are not RLS-filtered — acceptable, since they leak no row content and
-- the refetch itself is RLS-enforced.

alter publication supabase_realtime add table
  public.profiles,
  public.projects,
  public.project_members,
  public.milestones,
  public.tasks,
  public.task_comments,
  public.documents,
  public.daily_logs;
