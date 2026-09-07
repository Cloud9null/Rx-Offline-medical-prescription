-- Rx Offline EMR v3: additive schema only. Apply first to an isolated Supabase branch.
-- Existing prescription tables, functions, tokens and signed payloads are intentionally untouched.

create table if not exists public.encounters (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  folio text not null,
  encounter_type text not null check (encounter_type in ('first_visit','follow_up','referral')),
  status text not null check (status in ('draft','final')),
  occurred_at timestamptz not null,
  finalized_at timestamptz,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,id),
  unique (user_id,folio),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict
);

create table if not exists public.clinical_notes (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  encounter_id uuid not null,
  patient_id uuid not null,
  note_type text not null check (note_type in ('first_visit','follow_up','referral')),
  status text not null check (status in ('draft','final')),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  canonical_text text,
  seal jsonb,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,id),
  unique (user_id,encounter_id),
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  check ((status='draft' and canonical_text is null and seal is null and finalized_at is null) or
         (status='final' and canonical_text is not null and seal is not null and finalized_at is not null))
);

create table if not exists public.note_versions (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  note_id uuid not null,
  encounter_id uuid not null,
  patient_id uuid not null,
  version_no integer not null check (version_no>0),
  kind text not null check (kind in ('final','addendum')),
  reason text,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  canonical_text text not null,
  seal jsonb not null,
  created_at timestamptz not null,
  primary key (user_id,id),
  unique (user_id,note_id,version_no),
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict
);

create table if not exists public.diagnoses (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid not null,
  note_id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict
);

create table if not exists public.observations (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid not null,
  note_id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict
);

create table if not exists public.allergies (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict
);

create table if not exists public.medications (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid,
  note_id uuid,
  status text not null default 'active' check (status in ('active','inactive','completed','entered_in_error')),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict
);

create table if not exists public.clinical_orders (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid,
  note_id uuid,
  status text not null default 'ordered' check (status in ('draft','ordered','completed','cancelled','entered_in_error')),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict
);

create table if not exists public.documents (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid,
  note_id uuid,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict
);

create table if not exists public.consents (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  patient_id uuid not null,
  encounter_id uuid,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id,id),
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict
);

create table if not exists public.prescription_links (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  encounter_id uuid not null,
  note_id uuid not null,
  patient_id uuid not null,
  rx_id text not null,
  created_at timestamptz not null,
  primary key (user_id,id),
  unique (user_id,rx_id),
  foreign key (user_id,encounter_id) references public.encounters(user_id,id) on delete restrict,
  foreign key (user_id,note_id) references public.clinical_notes(user_id,id) on delete restrict,
  foreign key (user_id,patient_id) references public.patients(user_id,id) on delete restrict,
  foreign key (user_id,rx_id) references public.prescriptions(user_id,rx_id) on delete restrict
);

create table if not exists public.audit_events (
  user_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null,
  primary key (user_id,id)
);

create index if not exists encounters_user_patient_time_idx on public.encounters(user_id,patient_id,occurred_at desc);
create index if not exists clinical_notes_user_patient_time_idx on public.clinical_notes(user_id,patient_id,updated_at desc);
create index if not exists diagnoses_user_patient_idx on public.diagnoses(user_id,patient_id);
create index if not exists observations_user_patient_idx on public.observations(user_id,patient_id);
create index if not exists allergies_user_patient_idx on public.allergies(user_id,patient_id);
create index if not exists medications_user_patient_idx on public.medications(user_id,patient_id,status);
create index if not exists clinical_orders_user_patient_idx on public.clinical_orders(user_id,patient_id,status);
create index if not exists documents_user_patient_idx on public.documents(user_id,patient_id,created_at desc);
create index if not exists audit_events_user_time_idx on public.audit_events(user_id,created_at desc);

alter table public.encounters enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.diagnoses enable row level security;
alter table public.observations enable row level security;
alter table public.allergies enable row level security;
alter table public.medications enable row level security;
alter table public.clinical_orders enable row level security;
alter table public.documents enable row level security;
alter table public.consents enable row level security;
alter table public.prescription_links enable row level security;
alter table public.audit_events enable row level security;

do $policies$
declare t text;
begin
  foreach t in array array['encounters','clinical_notes','diagnoses','observations','allergies','medications','clinical_orders','documents','consents'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t||'_owner_select',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t||'_owner_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_owner_update',t);
  end loop;
end $policies$;

create policy note_versions_owner_select on public.note_versions for select to authenticated using ((select auth.uid())=user_id);
create policy note_versions_owner_insert on public.note_versions for insert to authenticated with check ((select auth.uid())=user_id);
create policy prescription_links_owner_select on public.prescription_links for select to authenticated using ((select auth.uid())=user_id);
create policy prescription_links_owner_insert on public.prescription_links for insert to authenticated with check ((select auth.uid())=user_id);
create policy audit_events_owner_select on public.audit_events for select to authenticated using ((select auth.uid())=user_id);
create policy audit_events_owner_insert on public.audit_events for insert to authenticated with check ((select auth.uid())=user_id);

grant select,insert,update on public.encounters,public.clinical_notes,public.diagnoses,public.observations,public.allergies,public.medications,public.clinical_orders,public.documents,public.consents to authenticated;
grant select,insert on public.note_versions,public.prescription_links,public.audit_events to authenticated;
revoke all on public.encounters,public.clinical_notes,public.note_versions,public.diagnoses,public.observations,public.allergies,public.medications,public.clinical_orders,public.documents,public.consents,public.prescription_links,public.audit_events from anon;

create or replace function public.emr_guard_final_note()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.status='final' and new is distinct from old then
    raise exception 'Finalized clinical notes are immutable; create an addendum' using errcode='55000';
  end if;
  return new;
end $$;

create or replace function public.emr_guard_final_encounter()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.status='final' and new is distinct from old then
    raise exception 'Finalized encounters are immutable' using errcode='55000';
  end if;
  return new;
end $$;

drop trigger if exists emr_clinical_notes_immutable on public.clinical_notes;
create trigger emr_clinical_notes_immutable before update or delete on public.clinical_notes for each row execute function public.emr_guard_final_note();
drop trigger if exists emr_encounters_immutable on public.encounters;
create trigger emr_encounters_immutable before update or delete on public.encounters for each row execute function public.emr_guard_final_encounter();
revoke execute on function public.emr_guard_final_note() from public,anon,authenticated;
revoke execute on function public.emr_guard_final_encounter() from public,anon,authenticated;

create or replace function public.emr_sync_bundle(p_bundle jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  v_uid uuid := (select auth.uid());
  r jsonb;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if jsonb_typeof(coalesce(p_bundle,'{}'::jsonb)) <> 'object' then raise exception 'Bundle must be an object'; end if;

  for r in select value from jsonb_array_elements(coalesce(p_bundle->'encounters','[]'::jsonb)) loop
    insert into public.encounters(user_id,id,patient_id,folio,encounter_type,status,occurred_at,finalized_at,payload,created_at,updated_at)
    values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,r->>'folio',r->>'type',case when r->>'status'='final' then 'final' else 'draft' end,(r->>'occurredAt')::timestamptz,nullif(r->>'finalizedAt','')::timestamptz,r,coalesce(nullif(r->>'createdAt','')::timestamptz,now()),coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,status=excluded.status,finalized_at=excluded.finalized_at,updated_at=excluded.updated_at
      where public.encounters.status='draft' and excluded.updated_at>=public.encounters.updated_at;
  end loop;

  for r in select value from jsonb_array_elements(coalesce(p_bundle->'clinicalNotes','[]'::jsonb)) loop
    insert into public.clinical_notes(user_id,id,encounter_id,patient_id,note_type,status,payload,canonical_text,seal,finalized_at,created_at,updated_at)
    values(
      v_uid,
      (r->>'id')::uuid,
      (r->>'encounterId')::uuid,
      (r->>'patientId')::uuid,
      r->>'noteType',
      case when r->>'status'='final' then 'final' else 'draft' end,
      r,
      case when r->>'status'='final' then nullif(r->>'canonicalText','') else null end,
      case when r->>'status'='final' then r->'seal' else null end,
      case when r->>'status'='final' then nullif(r->>'finalizedAt','')::timestamptz else null end,
      coalesce(nullif(r->>'createdAt','')::timestamptz,now()),
      coalesce(nullif(r->>'updatedAt','')::timestamptz,now())
    )
    on conflict(user_id,id) do update set payload=excluded.payload,status=excluded.status,canonical_text=excluded.canonical_text,seal=excluded.seal,finalized_at=excluded.finalized_at,updated_at=excluded.updated_at
      where public.clinical_notes.status='draft' and excluded.updated_at>=public.clinical_notes.updated_at;
  end loop;

  for r in select value from jsonb_array_elements(coalesce(p_bundle->'noteVersions','[]'::jsonb)) loop
    insert into public.note_versions(user_id,id,note_id,encounter_id,patient_id,version_no,kind,reason,payload,canonical_text,seal,created_at)
    values(v_uid,(r->>'id')::uuid,(r->>'noteId')::uuid,(r->>'encounterId')::uuid,(r->>'patientId')::uuid,(r->>'versionNo')::integer,r->>'kind',nullif(r->>'reason',''),r,r->>'canonicalText',r->'seal',(r->>'createdAt')::timestamptz)
    on conflict(user_id,id) do nothing;
  end loop;

  for r in select value from jsonb_array_elements(coalesce(p_bundle->'diagnoses','[]'::jsonb)) loop
    insert into public.diagnoses(user_id,id,patient_id,encounter_id,note_id,payload,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,(r->>'encounterId')::uuid,(r->>'noteId')::uuid,r,coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=public.diagnoses.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'observations','[]'::jsonb)) loop
    insert into public.observations(user_id,id,patient_id,encounter_id,note_id,payload,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,(r->>'encounterId')::uuid,(r->>'noteId')::uuid,r,coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=public.observations.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'allergies','[]'::jsonb)) loop
    insert into public.allergies(user_id,id,patient_id,payload,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,r,coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=public.allergies.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'medications','[]'::jsonb)) loop
    insert into public.medications(user_id,id,patient_id,encounter_id,note_id,status,payload,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,nullif(r->>'encounterId','')::uuid,nullif(r->>'noteId','')::uuid,coalesce(nullif(r->>'status',''),'active'),r,coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,status=excluded.status,updated_at=excluded.updated_at where excluded.updated_at>=public.medications.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'orders','[]'::jsonb)) loop
    insert into public.clinical_orders(user_id,id,patient_id,encounter_id,note_id,status,payload,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,nullif(r->>'encounterId','')::uuid,nullif(r->>'noteId','')::uuid,coalesce(nullif(r->>'status',''),'ordered'),r,coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,status=excluded.status,updated_at=excluded.updated_at where excluded.updated_at>=public.clinical_orders.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'documents','[]'::jsonb)) loop
    insert into public.documents(user_id,id,patient_id,encounter_id,note_id,payload,created_at,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,nullif(r->>'encounterId','')::uuid,nullif(r->>'noteId','')::uuid,r,coalesce(nullif(r->>'createdAt','')::timestamptz,now()),coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=public.documents.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'consents','[]'::jsonb)) loop
    insert into public.consents(user_id,id,patient_id,encounter_id,payload,created_at,updated_at) values(v_uid,(r->>'id')::uuid,(r->>'patientId')::uuid,nullif(r->>'encounterId','')::uuid,r,coalesce(nullif(r->>'createdAt','')::timestamptz,now()),coalesce(nullif(r->>'updatedAt','')::timestamptz,now()))
    on conflict(user_id,id) do update set payload=excluded.payload,updated_at=excluded.updated_at where excluded.updated_at>=public.consents.updated_at;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'prescriptionLinks','[]'::jsonb)) loop
    insert into public.prescription_links(user_id,id,encounter_id,note_id,patient_id,rx_id,created_at) values(v_uid,(r->>'id')::uuid,(r->>'encounterId')::uuid,(r->>'noteId')::uuid,(r->>'patientId')::uuid,r->>'rxId',(r->>'createdAt')::timestamptz)
    on conflict(user_id,id) do nothing;
  end loop;
  for r in select value from jsonb_array_elements(coalesce(p_bundle->'auditEvents','[]'::jsonb)) loop
    insert into public.audit_events(user_id,id,action,entity_type,entity_id,payload,created_at) values(v_uid,(r->>'id')::uuid,r->>'action',r->>'entityType',r->>'entityId',r,(r->>'createdAt')::timestamptz)
    on conflict(user_id,id) do nothing;
  end loop;

  return jsonb_build_object('ok',true,'schema_version',3,
    'encounters',coalesce((select jsonb_agg(payload order by occurred_at desc) from public.encounters where user_id=v_uid),'[]'::jsonb),
    'clinicalNotes',coalesce((select jsonb_agg(payload order by updated_at desc) from public.clinical_notes where user_id=v_uid),'[]'::jsonb),
    'noteVersions',coalesce((select jsonb_agg(payload order by created_at) from public.note_versions where user_id=v_uid),'[]'::jsonb),
    'diagnoses',coalesce((select jsonb_agg(payload) from public.diagnoses where user_id=v_uid),'[]'::jsonb),
    'observations',coalesce((select jsonb_agg(payload) from public.observations where user_id=v_uid),'[]'::jsonb),
    'allergies',coalesce((select jsonb_agg(payload) from public.allergies where user_id=v_uid),'[]'::jsonb),
    'medications',coalesce((select jsonb_agg(payload) from public.medications where user_id=v_uid),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(payload) from public.clinical_orders where user_id=v_uid),'[]'::jsonb),
    'documents',coalesce((select jsonb_agg(payload) from public.documents where user_id=v_uid),'[]'::jsonb),
    'consents',coalesce((select jsonb_agg(payload) from public.consents where user_id=v_uid),'[]'::jsonb),
    'prescriptionLinks',coalesce((select jsonb_agg(jsonb_build_object('id',id,'encounterId',encounter_id,'noteId',note_id,'patientId',patient_id,'rxId',rx_id,'createdAt',created_at)) from public.prescription_links where user_id=v_uid),'[]'::jsonb),
    'auditEvents',coalesce((select jsonb_agg(payload order by created_at) from public.audit_events where user_id=v_uid),'[]'::jsonb));
end $$;

revoke all on function public.emr_sync_bundle(jsonb) from public,anon;
grant execute on function public.emr_sync_bundle(jsonb) to authenticated;

comment on function public.emr_sync_bundle(jsonb) is 'Owner-scoped, additive EMR sync. Runs as invoker and relies on RLS; final notes are immutable.';
