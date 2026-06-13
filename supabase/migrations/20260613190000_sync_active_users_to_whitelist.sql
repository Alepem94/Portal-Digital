insert into public.whitelist (email)
select lower(trim(email))
from public.users
where active is true
  and email is not null
  and trim(email) <> ''
on conflict (email) do nothing;
