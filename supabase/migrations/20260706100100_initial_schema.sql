-- Tavron Project Hub — core schema.
-- Single-org: 2 Project Managers + 16 Engineers. No tenant scoping by design (see DECISIONS.md).
--
-- Entity map (mirrors what the frontend actually uses):
--   profiles         one row per user; role = MANAGER | ENGINEER; discipline = "Mechanical Engineer" etc.
--   projects         PM-owned containers
--   project_members  which engineers are assigned to a project (M:N)
--   milestones       project timeline items, completed with a proof image
--   tasks            work items; project_id NULL = standalone task ("Delegate Work")
--   task_comments    the task discussion threads shown in the Messages view
--   documents        links or uploaded files attached to a project
--   daily_logs       per-engineer daily work log, optionally linked to a project/task

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('MANAGER', 'ENGINEER');
create type public.project_status as enum ('ACTIVE', 'ON_HOLD', 'COMPLETED');
create type public.milestone_status as enum ('PENDING', 'IN_PROGRESS', 'COMPLETED');
create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'DONE');
create type public.document_type as enum ('LINK', 'DOCUMENT');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  -- Engineering specialization shown in the UI ("Mechanical Engineer", ...). Null for managers.
  discipline text,
  role public.app_role not null default 'ENGINEER',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.project_status not null default 'ACTIVE',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Bumped by trigger whenever the project or any child row changes ("Last updated" in the UI).
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create index project_members_profile_id_idx on public.project_members (profile_id);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  status public.milestone_status not null default 'PENDING',
  -- Storage path of the mandatory proof-of-completion image (attachments bucket).
  proof_image_path text,
  created_at timestamptz not null default now()
);
create index milestones_project_id_idx on public.milestones (project_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  -- NULL = standalone task assigned outside any project ("Delegate Work").
  project_id uuid references public.projects (id) on delete cascade,
  assignee_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  status public.task_status not null default 'TODO',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  -- Optional image attachment (attachments bucket, comment-images/ prefix).
  image_path text,
  created_at timestamptz not null default now()
);
create index task_comments_task_id_idx on public.task_comments (task_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  doc_type public.document_type not null,
  url text,       -- for LINK
  file_path text, -- for DOCUMENT (attachments bucket, documents/ prefix)
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint documents_target_check check (
    (doc_type = 'LINK' and url is not null)
    or (doc_type = 'DOCUMENT' and file_path is not null)
  )
);
create index documents_project_id_idx on public.documents (project_id);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null default current_date,
  content text not null,
  -- Optional context links. Multiple entries per day are allowed on purpose.
  project_id uuid references public.projects (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  created_at timestamptz not null default now()
);
create index daily_logs_author_date_idx on public.daily_logs (author_id, log_date desc);

-- ---------------------------------------------------------------------------
-- Triggers: profile auto-creation from auth signups/invites
-- ---------------------------------------------------------------------------
-- Invite metadata (set by the invite-engineer edge function) carries name/discipline/role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, discipline, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'discipline', ''),
    case
      when new.raw_user_meta_data ->> 'role' in ('MANAGER', 'ENGINEER')
        then (new.raw_user_meta_data ->> 'role')::public.app_role
      else 'ENGINEER'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Triggers: keep projects.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- Child changes bump the parent project. SECURITY DEFINER so an engineer updating
-- their task status can bump a project they have no direct UPDATE right on.
create or replace function public.touch_parent_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid;
  tid uuid;
begin
  if tg_table_name = 'task_comments' then
    if tg_op = 'DELETE' then tid := old.task_id; else tid := new.task_id; end if;
    select t.project_id into pid from public.tasks t where t.id = tid;
  else
    if tg_op = 'DELETE' then pid := old.project_id; else pid := new.project_id; end if;
  end if;

  if pid is not null then
    update public.projects set updated_at = now() where id = pid;
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger milestones_touch_project
  after insert or update or delete on public.milestones
  for each row execute function public.touch_parent_project();
create trigger tasks_touch_project
  after insert or update or delete on public.tasks
  for each row execute function public.touch_parent_project();
create trigger documents_touch_project
  after insert or update or delete on public.documents
  for each row execute function public.touch_parent_project();
create trigger task_comments_touch_project
  after insert or update or delete on public.task_comments
  for each row execute function public.touch_parent_project();

-- ---------------------------------------------------------------------------
-- Access helpers, used by RLS policies (next migration) and the guard triggers below.
-- SECURITY DEFINER so they can read profiles/project_members without recursing
-- into those tables' own RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_manager(_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _uid and p.role = 'MANAGER'
  );
$$;

create or replace function public.is_project_member(_project_id uuid, _uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = _project_id and pm.profile_id = _uid
  );
$$;

-- A task is visible to managers, its assignee, and members of its project (if any).
create or replace function public.can_view_task(_task_id uuid, _uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = _task_id
      and (
        t.assignee_id = _uid
        or public.is_manager(_uid)
        or (t.project_id is not null and public.is_project_member(t.project_id, _uid))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers: column-level guards (RLS is row-level; these protect columns)
-- ---------------------------------------------------------------------------
-- Engineers may update their assigned tasks, but only the status column.
create or replace function public.enforce_task_update_rights()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is null for service-role / SQL-editor sessions: let those through.
  if auth.uid() is null or public.is_manager(auth.uid()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.assignee_id is distinct from old.assignee_id
    or new.title is distinct from old.title
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Engineers may only update the status of their tasks';
  end if;

  return new;
end;
$$;

create trigger tasks_enforce_update_rights
  before update on public.tasks
  for each row execute function public.enforce_task_update_rights();

-- Users may edit their own profile, but never their own role (or email, which mirrors auth).
create or replace function public.enforce_profile_update_rights()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_manager(auth.uid()) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only managers can change roles';
  end if;
  if new.email is distinct from old.email then
    raise exception 'Email is managed by the auth system';
  end if;

  return new;
end;
$$;

create trigger profiles_enforce_update_rights
  before update on public.profiles
  for each row execute function public.enforce_profile_update_rights();
