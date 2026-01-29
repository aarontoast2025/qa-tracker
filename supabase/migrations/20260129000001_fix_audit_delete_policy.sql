-- Allow authenticated users to delete audit evaluations
create policy "Authenticated delete access"
  on public.audit_evaluations
  for delete
  to authenticated
  using (true);
