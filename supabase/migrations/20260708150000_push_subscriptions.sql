-- Web Push notifications (Phase 2, 2026-07-08).
--
-- push_subscriptions: one row per browser/device push registration. A user
-- can have several (phone + desktop); a device has exactly one endpoint.
-- The send-push edge function reads these with the service role and prunes
-- rows the push service reports gone (404/410).
--
-- VAPID keys live in Supabase Vault (secret name 'vapid_keys', inserted
-- outside this migration so the private key never lands in git). Only the
-- service role can read them, via get_vapid_keys() below.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

-- Reads/deletes are per-owner; inserts go through save_push_subscription()
-- (no INSERT/UPDATE policies) so an endpoint can move between accounts on a
-- shared device.
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using (profile_id = (select auth.uid()));

-- The browser only hands a push subscription to the page that owns it, so
-- possession of the endpoint proves ownership: re-home it if another account
-- registered it earlier (shared device, no clean logout).
create or replace function public.save_push_subscription(
  _endpoint text,
  _p256dh text,
  _auth text,
  _user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from public.push_subscriptions where endpoint = _endpoint;
  insert into public.push_subscriptions (profile_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), _endpoint, _p256dh, _auth, _user_agent);
end;
$$;
revoke execute on function public.save_push_subscription(text, text, text, text) from anon, public;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- Vault accessor for the edge function. Service role only: the JWK pair must
-- never reach a client.
create or replace function public.get_vapid_keys()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_keys';
$$;
revoke execute on function public.get_vapid_keys() from anon, authenticated, public;
grant execute on function public.get_vapid_keys() to service_role;
