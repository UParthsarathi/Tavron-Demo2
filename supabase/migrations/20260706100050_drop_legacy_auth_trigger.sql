-- The legacy backend also left a trigger on auth.users (table drops don't cascade
-- to it). Drop it and its function so the new schema can recreate both cleanly.
-- (The 'ensure_rls' event trigger + rls_auto_enable() are intentionally kept:
-- they auto-enable RLS on any new table — a useful safety net.)

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
