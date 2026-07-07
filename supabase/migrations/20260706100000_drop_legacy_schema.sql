-- Drop the legacy ad-hoc schema (verified: all 7 tables at 0 rows, owner confirmed disposable).
-- Legacy tables were created without migration history; this brings the project under
-- migration control with a clean slate.
--
-- Note: the two legacy public buckets (chat-images, project-docs) cannot be dropped
-- from SQL (storage.protect_delete). They are empty; delete them manually in the
-- dashboard (Storage section). The new schema uses the private 'attachments' bucket.

drop table if exists public.messages cascade;
drop table if exists public.documents cascade;
drop table if exists public.tasks cascade;
drop table if exists public.milestones cascade;
drop table if exists public.project_members cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;
