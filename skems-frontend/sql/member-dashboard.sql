-- ============================================================
-- SKEMS migration: member dashboard data access
-- Members may read their own borrow_records (active + returned
-- history) to power the member dashboard sections.
-- ============================================================

drop policy if exists "borrow_records_select_own" on borrow_records;
create policy "borrow_records_select_own"
  on borrow_records for select
  to authenticated
  using (user_id = auth.uid());
