-- Allow an authenticated owner to restore the legacy Rx bundle before first sync.
-- Existing owner-scoped RLS policies remain the authorization boundary.

grant select on public.profiles,public.patients,public.prescriptions to authenticated;
revoke all on public.profiles,public.patients,public.prescriptions from anon;
