-- Unified messaging model (Messages inbox redesign, 2026-07-08).
--
-- Every conversation is attached to something:
--   TASK      one thread per task (replaces task_comments)
--   MILESTONE one thread per milestone
--   PROJECT   the project's "General" channel
--   DM        1:1 between two people (dm_a < dm_b, unique pair)
-- Task/milestone/project conversations are created by triggers when their
-- entity is created; DMs are created by the client on demand.
-- conversation_reads powers the unread badges.
--
-- Replaces task_comments: rows are migrated into messages (ids preserved),
-- then the table is dropped (its policies/triggers/publication membership
-- go with it). Messages deliberately do NOT bump projects.updated_at — the
-- inbox sorts on conversations.last_message_at instead.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create type public.conversation_type as enum ('TASK', 'MILESTONE', 'PROJECT', 'DM');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  project_id uuid references public.projects (id) on delete cascade,
  task_id uuid unique references public.tasks (id) on delete cascade,
  milestone_id uuid unique references public.milestones (id) on delete cascade,
  dm_a uuid references public.profiles (id) on delete cascade,
  dm_b uuid references public.profiles (id) on delete cascade,
  -- Denormalized for inbox ordering; maintained by trigger on messages.
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_shape check (
    (type = 'TASK' and task_id is not null and milestone_id is null and dm_a is null and dm_b is null)
    or (type = 'MILESTONE' and milestone_id is not null and project_id is not null and task_id is null and dm_a is null and dm_b is null)
    or (type = 'PROJECT' and project_id is not null and task_id is null and milestone_id is null and dm_a is null and dm_b is null)
    or (type = 'DM' and dm_a is not null and dm_b is not null and dm_a < dm_b
        and project_id is null and task_id is null and milestone_id is null)
  )
);
create unique index conversations_dm_pair_idx on public.conversations (dm_a, dm_b) where type = 'DM';
create unique index conversations_project_general_idx on public.conversations (project_id) where type = 'PROJECT';
create index conversations_project_idx on public.conversations (project_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '',
  image_path text,
  reply_to uuid references public.messages (id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

-- ---------------------------------------------------------------------------
-- Access helper (mirrors the style of is_manager / can_view_task)
-- ---------------------------------------------------------------------------
create or replace function public.can_view_conversation(_conversation_id uuid, _uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = _conversation_id
      and (
        (c.type = 'TASK' and public.can_view_task(c.task_id, _uid))
        or (c.type in ('MILESTONE', 'PROJECT')
            and (public.is_manager(_uid) or public.is_project_member(c.project_id, _uid)))
        or (c.type = 'DM' and _uid in (c.dm_a, c.dm_b))
      )
  );
$$;
revoke execute on function public.can_view_conversation(uuid, uuid) from anon, public;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy "conversations_select" on public.conversations
  for select to authenticated
  using (public.can_view_conversation(id));

-- Only DMs are client-created; entity conversations come from triggers.
create policy "conversations_insert_dm" on public.conversations
  for insert to authenticated
  with check (type = 'DM' and auth.uid() in (dm_a, dm_b));

create policy "messages_select" on public.messages
  for select to authenticated
  using (public.can_view_conversation(conversation_id));

create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_conversation(conversation_id));

-- No UPDATE/DELETE policies on messages: history is immutable, like the old
-- task_comments (see DECISIONS.md RLS audit caveat).

create policy "conversation_reads_select" on public.conversation_reads
  for select to authenticated
  using (profile_id = auth.uid());

create policy "conversation_reads_insert" on public.conversation_reads
  for insert to authenticated
  with check (profile_id = auth.uid() and public.can_view_conversation(conversation_id));

create policy "conversation_reads_update" on public.conversation_reads
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Triggers: entity conversations auto-created; last_message_at maintained.
-- SECURITY DEFINER because the acting user has no INSERT/UPDATE right on
-- conversations (same pattern as touch_parent_project).
-- ---------------------------------------------------------------------------
create or replace function public.create_entity_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'projects' then
    insert into public.conversations (type, project_id) values ('PROJECT', new.id);
  elsif tg_table_name = 'tasks' then
    insert into public.conversations (type, project_id, task_id) values ('TASK', new.project_id, new.id);
  elsif tg_table_name = 'milestones' then
    insert into public.conversations (type, project_id, milestone_id) values ('MILESTONE', new.project_id, new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.create_entity_conversation() from anon, authenticated, public;

create trigger projects_create_conversation
  after insert on public.projects
  for each row execute function public.create_entity_conversation();
create trigger tasks_create_conversation
  after insert on public.tasks
  for each row execute function public.create_entity_conversation();
create trigger milestones_create_conversation
  after insert on public.milestones
  for each row execute function public.create_entity_conversation();

create or replace function public.bump_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;
revoke execute on function public.bump_conversation() from anon, authenticated, public;

create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------------------------------------------------------------------------
-- Backfill existing entities, migrate task_comments, drop the old table
-- ---------------------------------------------------------------------------
insert into public.conversations (type, project_id)
select 'PROJECT', p.id from public.projects p;

insert into public.conversations (type, project_id, task_id)
select 'TASK', t.project_id, t.id from public.tasks t;

insert into public.conversations (type, project_id, milestone_id)
select 'MILESTONE', m.project_id, m.id from public.milestones m;

insert into public.messages (id, conversation_id, author_id, content, image_path, created_at)
select tc.id, c.id, tc.author_id, tc.content, tc.image_path, tc.created_at
from public.task_comments tc
join public.conversations c on c.task_id = tc.task_id;

update public.conversations c
set last_message_at = agg.latest
from (
  select m.conversation_id, max(m.created_at) as latest
  from public.messages m
  group by m.conversation_id
) agg
where agg.conversation_id = c.id;

drop table public.task_comments;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.conversations,
  public.messages,
  public.conversation_reads;

-- ---------------------------------------------------------------------------
-- Inbox RPC: every visible conversation with last-message preview and unread
-- count, in one round trip. SECURITY INVOKER — RLS on the underlying tables
-- scopes the result to the caller.
-- ---------------------------------------------------------------------------
create or replace function public.fetch_inbox()
returns table (
  conversation_id uuid,
  type public.conversation_type,
  project_id uuid,
  project_name text,
  task_id uuid,
  task_title text,
  task_status public.task_status,
  milestone_id uuid,
  milestone_title text,
  dm_partner_id uuid,
  dm_partner_name text,
  last_message_at timestamptz,
  last_author_id uuid,
  last_author_name text,
  last_content text,
  last_has_image boolean,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.type,
    c.project_id,
    p.name,
    c.task_id,
    t.title,
    t.status,
    c.milestone_id,
    ms.title,
    dmp.id,
    dmp.name,
    c.last_message_at,
    ap.id,
    ap.name,
    lm.content,
    (lm.image_path is not null),
    coalesce((
      select count(*)
      from public.messages m
      where m.conversation_id = c.id
        and m.author_id <> auth.uid()
        and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
    ), 0)
  from public.conversations c
  left join public.projects p on p.id = c.project_id
  left join public.tasks t on t.id = c.task_id
  left join public.milestones ms on ms.id = c.milestone_id
  left join public.profiles dmp
    on c.type = 'DM'
   and dmp.id = case when c.dm_a = auth.uid() then c.dm_b else c.dm_a end
  left join public.conversation_reads r
    on r.conversation_id = c.id and r.profile_id = auth.uid()
  left join lateral (
    select m.author_id, m.content, m.image_path
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  left join public.profiles ap on ap.id = lm.author_id
$$;
revoke execute on function public.fetch_inbox() from anon, public;
grant execute on function public.fetch_inbox() to authenticated;
