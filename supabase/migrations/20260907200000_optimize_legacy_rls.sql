-- Preserve the existing owner-only behavior while evaluating auth.uid() once
-- per statement. This removes the Supabase auth_rls_initplan warnings without
-- changing any row visibility or mutating clinical data.

alter policy profiles_owner_select on public.profiles
  using ((select auth.uid()) = user_id);
alter policy profiles_owner_insert on public.profiles
  with check ((select auth.uid()) = user_id);
alter policy profiles_owner_update on public.profiles
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy patients_owner_all on public.patients
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy physician_keys_owner_select on public.physician_keys
  using ((select auth.uid()) = user_id);
alter policy physician_keys_owner_insert on public.physician_keys
  with check ((select auth.uid()) = user_id);
alter policy physician_keys_owner_update on public.physician_keys
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy prescriptions_owner_select on public.prescriptions
  using ((select auth.uid()) = user_id);
alter policy prescriptions_owner_insert on public.prescriptions
  with check ((select auth.uid()) = user_id);
alter policy prescriptions_owner_update on public.prescriptions
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy prescription_verifications_owner_select on public.prescription_verifications
  using ((select auth.uid()) = user_id);
alter policy prescription_verifications_owner_insert on public.prescription_verifications
  with check ((select auth.uid()) = user_id);
alter policy prescription_verifications_owner_update on public.prescription_verifications
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists prescriptions_user_patient_idx
  on public.prescriptions (user_id, patient_id);
