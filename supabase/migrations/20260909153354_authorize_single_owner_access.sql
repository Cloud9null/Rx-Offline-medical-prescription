-- Private application access gate for the current single-owner deployment.
-- Additive only: no clinical or prescription data is modified.

create table if not exists public.app_authorized_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null default 'authorized' check (role in ('owner','authorized')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_authorized_users enable row level security;

revoke all on public.app_authorized_users from anon;
revoke all on public.app_authorized_users from authenticated;
grant select on public.app_authorized_users to authenticated;

drop policy if exists app_authorized_users_self_select on public.app_authorized_users;
create policy app_authorized_users_self_select
on public.app_authorized_users
for select
to authenticated
using ((select auth.uid()) = user_id and enabled is true);

-- This project currently has exactly one non-anonymous active Auth user.
-- The guard prevents accidentally authorizing multiple accounts if reused later.
insert into public.app_authorized_users (user_id,role,enabled)
select id,'owner',true
from auth.users
where deleted_at is null
  and coalesce(is_anonymous,false) is false
  and (select count(*) from auth.users where deleted_at is null and coalesce(is_anonymous,false) is false) = 1
on conflict (user_id) do nothing;

comment on table public.app_authorized_users is
'Server-side allowlist for Rx Offline EMR access. Rows are provisioned administratively; clients can only read their own enabled authorization.';
