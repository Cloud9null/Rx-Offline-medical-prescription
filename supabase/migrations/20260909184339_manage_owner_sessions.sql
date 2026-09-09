-- Owner-only session inventory and revocation for Rx Offline EMR.
-- Additive: clinical records, prescriptions and stored files are untouched.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.rx_current_session_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions s
    where s.id = nullif(auth.jwt()->>'session_id','')::uuid
      and s.user_id = auth.uid()
  );
$$;

revoke all on function private.rx_current_session_is_active() from public, anon;
grant execute on function private.rx_current_session_is_active() to authenticated;

drop policy if exists app_authorized_users_self_select on public.app_authorized_users;
create policy app_authorized_users_self_select
on public.app_authorized_users
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and enabled is true
  and (select private.rx_current_session_is_active())
);

create or replace function public.rx_list_my_sessions()
returns table (
  session_id uuid,
  created_at timestamptz,
  last_active_at timestamptz,
  user_agent text,
  ip_address text,
  is_current boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id as session_id,
    s.created_at as created_at,
    coalesce(s.refreshed_at at time zone 'UTC',s.updated_at,s.created_at) as last_active_at,
    coalesce(s.user_agent,'') as user_agent,
    coalesce(host(s.ip),'') as ip_address,
    s.id = nullif(auth.jwt()->>'session_id','')::uuid as is_current
  from auth.sessions s
  where s.user_id = auth.uid()
    and exists (
      select 1
      from public.app_authorized_users a
      where a.user_id = auth.uid()
        and a.enabled is true
    )
  order by is_current desc,last_active_at desc;
$$;

revoke all on function public.rx_list_my_sessions() from public, anon;
grant execute on function public.rx_list_my_sessions() to authenticated;

create or replace function public.rx_revoke_my_session(p_session_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_session uuid := nullif(auth.jwt()->>'session_id','')::uuid;
  v_deleted uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.app_authorized_users a
    where a.user_id = v_user_id and a.enabled is true
  ) then
    raise exception 'account not authorized' using errcode = '42501';
  end if;

  if p_session_id is null then
    raise exception 'session id required' using errcode = '22023';
  end if;

  if p_session_id = v_current_session then
    raise exception 'use local sign out for the current session' using errcode = '22023';
  end if;

  delete from auth.sessions
  where id = p_session_id and user_id = v_user_id
  returning id into v_deleted;

  return jsonb_build_object('ok',v_deleted is not null,'session_id',p_session_id);
end;
$$;

revoke all on function public.rx_revoke_my_session(uuid) from public, anon;
grant execute on function public.rx_revoke_my_session(uuid) to authenticated;

comment on function public.rx_list_my_sessions() is
'Lists only the authenticated authorized owner sessions with minimal device metadata.';
comment on function public.rx_revoke_my_session(uuid) is
'Revokes one other Auth session owned by the authenticated authorized owner.';
