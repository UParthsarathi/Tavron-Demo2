-- Remove the legacy storage policies that belonged to the old public buckets
-- (chat-images, project-docs). The buckets themselves must be deleted manually
-- in the dashboard; these policies would otherwise keep granting access to them.

drop policy if exists "Allow authenticated uploads to chat-images" on storage.objects;
drop policy if exists "Allow authenticated uploads to project-docs" on storage.objects;
drop policy if exists "Allow anyone to view chat-images" on storage.objects;
drop policy if exists "Allow anyone to view project-docs" on storage.objects;
