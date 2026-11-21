-- ============================================================
-- SKEMS migration: members read their own audit log entries
-- (powers the member-facing Logs page)
-- ============================================================

drop policy if exists "audit_logs_select_own" on audit_logs;
create policy "audit_logs_select_own"
  on audit_logs for select
  to authenticated
  using (actor_id = auth.uid());
