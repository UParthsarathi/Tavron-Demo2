-- Hardening pass driven by Supabase security advisors (2026-07-06).
--
-- 1. Trigger functions must not be callable through the REST RPC surface.
--    Triggers don't need EXECUTE grants to fire, so revoking is safe.
-- 2. RLS helper functions keep EXECUTE for `authenticated` (policies evaluate
--    them as the querying user) but lose it for `anon`/`public`.
-- 3. handle_updated_at gets a pinned search_path like every other function.
--
-- Remaining advisor item that has no SQL fix: "Leaked Password Protection
-- Disabled" — enable in Dashboard → Auth → Passwords (manual step, DECISIONS.md).

-- 1. Trigger functions: no API-role execution.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.handle_updated_at() from anon, authenticated, public;
revoke execute on function public.touch_parent_project() from anon, authenticated, public;
revoke execute on function public.enforce_task_update_rights() from anon, authenticated, public;
revoke execute on function public.enforce_profile_update_rights() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- 2. RLS helpers: authenticated only.
revoke execute on function public.is_manager(uuid) from anon, public;
revoke execute on function public.is_project_member(uuid, uuid) from anon, public;
revoke execute on function public.can_view_task(uuid, uuid) from anon, public;

-- 3. Pin search_path on the one function that was created without it.
alter function public.handle_updated_at() set search_path = '';
