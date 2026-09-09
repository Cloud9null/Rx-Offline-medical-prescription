-- Rx Offline EMR v3.1: E2EE document storage and recoverable vault key.
-- Additive only. No clinical or prescription rows are changed or removed.

create table if not exists public.vault_key_envelopes (
  user_id uuid primary key references auth.users(id) on delete restrict,
  key_id text not null check (char_length(key_id) between 32 and 128),
  envelope jsonb not null check (jsonb_typeof(envelope) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vault_key_envelopes enable row level security;

create policy vault_key_envelopes_owner_select
  on public.vault_key_envelopes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy vault_key_envelopes_owner_insert
  on public.vault_key_envelopes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy vault_key_envelopes_owner_update
  on public.vault_key_envelopes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select,insert,update on public.vault_key_envelopes to authenticated;
revoke all on public.vault_key_envelopes from anon;
revoke delete on public.vault_key_envelopes from authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('rx-emr-private-v1','rx-emr-private-v1',false,6291456,array['application/json'])
on conflict (id) do nothing;

create policy rx_emr_private_owner_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'rx-emr-private-v1'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy rx_emr_private_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'rx-emr-private-v1'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy rx_emr_private_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'rx-emr-private-v1'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'rx-emr-private-v1'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

comment on table public.vault_key_envelopes is
  'Owner-scoped recovery envelopes. Ciphertext only; recovery codes and plaintext vault keys are never stored.';
