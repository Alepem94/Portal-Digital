update public.users
set permissions = coalesce(permissions, '{}'::jsonb) || jsonb_build_object('canViewAllAccounts', true)
where active is true
  and coalesce((permissions->>'canViewAllAccounts')::boolean, false) is false;
