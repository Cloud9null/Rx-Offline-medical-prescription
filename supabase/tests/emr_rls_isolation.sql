-- Ejecutar exclusivamente en staging con dos UUID de usuarios sintéticos existentes.
-- Sustituir los UUID marcados y ejecutar como administrador; la transacción no escribe datos.
begin;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.encounters where user_id='00000000-0000-0000-0000-000000000002'::uuid) then
    raise exception 'RLS failure: user A can read user B encounters';
  end if;
  if exists(select 1 from public.clinical_notes where user_id='00000000-0000-0000-0000-000000000002'::uuid) then
    raise exception 'RLS failure: user A can read user B notes';
  end if;
  if exists(select 1 from public.documents where user_id='00000000-0000-0000-0000-000000000002'::uuid) then
    raise exception 'RLS failure: user A can read user B documents';
  end if;
end $$;

rollback;
