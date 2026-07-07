-- Tavron Project Hub — storage.
--
-- One private bucket, `attachments`, with path prefixes instead of multiple buckets:
--   milestone-proofs/<milestone_id>/...   proof-of-completion images (manager writes)
--   comment-images/<task_id>/...          task discussion images (any participant writes)
--   documents/<project_id>/...            uploaded project documents (manager writes)
--
-- The bucket is private: the frontend data layer serves files via signed URLs,
-- so nothing leaks to unauthenticated visitors. Reads are open to all
-- authenticated users (one 18-person team; path-scoped reads add complexity
-- without a real threat model here — see DECISIONS.md).

insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760) -- 10 MB, matches the UI hint
on conflict (id) do nothing;

-- Reads: any authenticated user.
create policy "attachments_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments');

-- Writes: managers anywhere; engineers only under comment-images/.
create policy "attachments_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (
      public.is_manager()
      or (storage.foldername(name))[1] = 'comment-images'
    )
  );

-- Updates/deletes: managers only (files are otherwise immutable once uploaded).
create policy "attachments_update_manager" on storage.objects
  for update to authenticated
  using (bucket_id = 'attachments' and public.is_manager())
  with check (bucket_id = 'attachments' and public.is_manager());

create policy "attachments_delete_manager" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and public.is_manager());
