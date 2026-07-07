-- Backfill profiles for auth users that existed before the profile trigger.
-- parthu3915@gmail.com is the Project Manager (was hardcoded in the old
-- frontend's roles.ts); every other pre-existing account is an engineer.
-- Idempotent: skips users that already have a profile.

insert into public.profiles (id, email, name, discipline, role)
select
  u.id,
  u.email,
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
  nullif(u.raw_user_meta_data ->> 'discipline', ''),
  case when u.email = 'parthu3915@gmail.com' then 'MANAGER'::public.app_role
       else 'ENGINEER'::public.app_role
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
