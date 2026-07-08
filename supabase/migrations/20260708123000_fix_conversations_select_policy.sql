-- Fix: creating a DM failed with an RLS violation.
--
-- conversations_select used can_view_conversation(id), which re-queries the
-- conversations table. During INSERT ... RETURNING the new row is not yet
-- visible to the statement's own snapshot, so the lookup found nothing and
-- the RETURNING select check failed. Express the policy inline over the
-- row's own columns instead (the helpers only touch OTHER tables).
-- can_view_conversation stays for messages/conversation_reads policies,
-- where the conversation row always pre-exists.

drop policy "conversations_select" on public.conversations;

create policy "conversations_select" on public.conversations
  for select to authenticated
  using (
    (type = 'DM' and auth.uid() in (dm_a, dm_b))
    or (type = 'TASK' and public.can_view_task(task_id))
    or (type in ('MILESTONE', 'PROJECT')
        and (public.is_manager() or public.is_project_member(project_id)))
  );
