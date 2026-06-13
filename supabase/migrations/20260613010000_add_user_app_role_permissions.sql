alter table public.users
add column if not exists app_role text not null default 'member',
add column if not exists permissions jsonb not null default '{}'::jsonb;

update public.users
set app_role = case
    when lower(coalesce(role, '')) in ('administrador', 'head de medios digitales') then 'admin'
    when lower(coalesce(role, '')) like '%admin%' then 'admin'
    else 'member'
  end,
  permissions = case
    when lower(coalesce(role, '')) in ('administrador', 'head de medios digitales')
      or lower(coalesce(role, '')) like '%admin%'
      then '{
        "canManageUsers": true,
        "canEditAccounts": true,
        "canManageTools": true,
        "canViewCredentials": true,
        "canRevealCredentials": true,
        "canViewFinance": true,
        "canEditFinance": true
      }'::jsonb
    when lower(coalesce(role, '')) = 'editor'
      then '{
        "canEditAccounts": true,
        "canManageTools": true,
        "canViewCredentials": true
      }'::jsonb
    else coalesce(nullif(permissions, '{}'::jsonb), '{}'::jsonb)
  end
where app_role is null
   or app_role = 'member'
   or permissions = '{}'::jsonb;
