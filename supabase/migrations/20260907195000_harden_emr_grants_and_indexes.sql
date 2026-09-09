-- Post-deploy hardening for Rx Offline EMR v3.
-- Additive only: no tables, rows, prescriptions, keys, or verification tokens are removed.

-- Supabase legacy default privileges can include DELETE on newly-created public tables.
-- EMR records use explicit clinical lifecycle states and must not be hard-deleted by clients.
revoke delete on public.encounters,public.clinical_notes,public.note_versions,
  public.diagnoses,public.observations,public.allergies,public.medications,
  public.clinical_orders,public.documents,public.consents,
  public.prescription_links,public.audit_events from authenticated;

-- Append-only evidence tables are never updated by a browser client.
revoke update on public.note_versions,public.prescription_links,public.audit_events
  from authenticated;

-- This event-trigger helper is invoked internally by PostgreSQL. It is not an application RPC.
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;

-- Cover every EMR foreign-key access path used by FK checks and clinical joins.
create index if not exists note_versions_user_encounter_idx on public.note_versions(user_id,encounter_id);
create index if not exists note_versions_user_patient_idx on public.note_versions(user_id,patient_id);
create index if not exists diagnoses_user_encounter_idx on public.diagnoses(user_id,encounter_id);
create index if not exists diagnoses_user_note_idx on public.diagnoses(user_id,note_id);
create index if not exists observations_user_encounter_idx on public.observations(user_id,encounter_id);
create index if not exists observations_user_note_idx on public.observations(user_id,note_id);
create index if not exists medications_user_encounter_idx on public.medications(user_id,encounter_id);
create index if not exists medications_user_note_idx on public.medications(user_id,note_id);
create index if not exists clinical_orders_user_encounter_idx on public.clinical_orders(user_id,encounter_id);
create index if not exists clinical_orders_user_note_idx on public.clinical_orders(user_id,note_id);
create index if not exists documents_user_encounter_idx on public.documents(user_id,encounter_id);
create index if not exists documents_user_note_idx on public.documents(user_id,note_id);
create index if not exists consents_user_patient_idx on public.consents(user_id,patient_id);
create index if not exists consents_user_encounter_idx on public.consents(user_id,encounter_id);
create index if not exists prescription_links_user_patient_idx on public.prescription_links(user_id,patient_id);
create index if not exists prescription_links_user_encounter_idx on public.prescription_links(user_id,encounter_id);
create index if not exists prescription_links_user_note_idx on public.prescription_links(user_id,note_id);
