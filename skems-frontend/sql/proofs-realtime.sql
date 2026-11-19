-- ============================================================
-- SKEMS migration: realtime for return proofs
-- Enables postgres_changes events for the proofs table so the
-- officer proof queue and member proof statuses update live.
-- ============================================================

-- Idempotent: skip if the table is already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'proofs'
  ) then
    alter publication supabase_realtime add table proofs;
  end if;
end $$;
