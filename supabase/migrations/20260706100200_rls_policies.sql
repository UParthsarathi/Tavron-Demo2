-- Tavron Project Hub — row-level security.
--
-- Access matrix (see DECISIONS.md):
--   entity          | MANAGER            | ENGINEER
--   ----------------|--------------------|------------------------------------------
--   profiles        | read all, update   | read all, update own (role/email guarded)
--   projects        | full CRUD          | read where member
--   project_members | full CRUD          | read own rows + rosters of own projects
--   milestones      | full CRUD          | read (own projects)
--   tasks           | full CRUD          | read (own projects + assigned); update own
--   task_comments   | read/write all     | read/write where task visible, author = self
--   documents       | full CRUD          | read (own projects)
--   daily_logs      | read all           | CRUD own
--
-- All policies target the `authenticated` role only; anon gets nothing.
-- Column-level restrictions (task status only, no self role changes) are enforced
-- by BEFORE UPDATE triggers in the schema migration — RLS alone is row-level.

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.documents enable row level security;
alter table public.daily_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles — the org is one team of 18; everyone can see the directory.
-- Inserts happen only via the on_auth_user_created trigger (SECURITY DEFINER),
-- deletes only via auth admin (cascade) — so neither gets a client policy.
-- ---------------------------------------------------------------------------
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles_update_self_or_manager" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_manager())
  with check (id = (select auth.uid()) or public.is_manager());

-- ---------------------------------------------------------------------------
-- projects — engineers only see projects they're assigned to.
-- ---------------------------------------------------------------------------
create policy "projects_select_manager_or_member" on public.projects
  for select to authenticated
  using (public.is_manager() or public.is_project_member(id));

create policy "projects_insert_manager" on public.projects
  for insert to authenticated
  with check (public.is_manager());

create policy "projects_update_manager" on public.projects
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "projects_delete_manager" on public.projects
  for delete to authenticated
  using (public.is_manager());

-- ---------------------------------------------------------------------------
-- project_members — engineers can see who else is on their projects
-- (the Engineers tab in ProjectDetails).
-- ---------------------------------------------------------------------------
create policy "project_members_select" on public.project_members
  for select to authenticated
  using (
    public.is_manager()
    or profile_id = (select auth.uid())
    or public.is_project_member(project_id)
  );

create policy "project_members_insert_manager" on public.project_members
  for insert to authenticated
  with check (public.is_manager());

create policy "project_members_delete_manager" on public.project_members
  for delete to authenticated
  using (public.is_manager());

-- ---------------------------------------------------------------------------
-- milestones — engineers read; managers write (incl. completing with proof).
-- ---------------------------------------------------------------------------
create policy "milestones_select" on public.milestones
  for select to authenticated
  using (public.is_manager() or public.is_project_member(project_id));

create policy "milestones_insert_manager" on public.milestones
  for insert to authenticated
  with check (public.is_manager());

create policy "milestones_update_manager" on public.milestones
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "milestones_delete_manager" on public.milestones
  for delete to authenticated
  using (public.is_manager());

-- ---------------------------------------------------------------------------
-- tasks — assignees can update (status only, per trigger guard).
-- Standalone tasks (project_id is null) are visible to managers + assignee.
-- ---------------------------------------------------------------------------
create policy "tasks_select" on public.tasks
  for select to authenticated
  using (
    public.is_manager()
    or assignee_id = (select auth.uid())
    or (project_id is not null and public.is_project_member(project_id))
  );

create policy "tasks_insert_manager" on public.tasks
  for insert to authenticated
  with check (public.is_manager());

create policy "tasks_update_manager_or_assignee" on public.tasks
  for update to authenticated
  using (public.is_manager() or assignee_id = (select auth.uid()))
  with check (public.is_manager() or assignee_id = (select auth.uid()));

create policy "tasks_delete_manager" on public.tasks
  for delete to authenticated
  using (public.is_manager());

-- ---------------------------------------------------------------------------
-- task_comments — anyone who can see the task can read and post.
-- Comments are immutable from the client (no update/delete policies) — the
-- discussion is the audit trail. Managers can clean up via the dashboard.
-- ---------------------------------------------------------------------------
create policy "task_comments_select" on public.task_comments
  for select to authenticated
  using (public.can_view_task(task_id));

create policy "task_comments_insert" on public.task_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.can_view_task(task_id)
  );

-- ---------------------------------------------------------------------------
-- documents — engineers read docs of their projects; managers manage.
-- ---------------------------------------------------------------------------
create policy "documents_select" on public.documents
  for select to authenticated
  using (public.is_manager() or public.is_project_member(project_id));

create policy "documents_insert_manager" on public.documents
  for insert to authenticated
  with check (public.is_manager());

create policy "documents_update_manager" on public.documents
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "documents_delete_manager" on public.documents
  for delete to authenticated
  using (public.is_manager());

-- ---------------------------------------------------------------------------
-- daily_logs — engineers own their logs; managers read everything.
-- ---------------------------------------------------------------------------
create policy "daily_logs_select" on public.daily_logs
  for select to authenticated
  using (public.is_manager() or author_id = (select auth.uid()));

create policy "daily_logs_insert_own" on public.daily_logs
  for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "daily_logs_update_own" on public.daily_logs
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "daily_logs_delete_own" on public.daily_logs
  for delete to authenticated
  using (author_id = (select auth.uid()));
