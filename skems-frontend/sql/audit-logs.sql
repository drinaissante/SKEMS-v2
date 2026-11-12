-- ============================================================
-- SKEMS migration: audit log (receipts/reports/logs)
-- Every user/officer/owner action lands here, readable by admins.
-- ============================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text not null,
  actor_role text not null default 'member',
  action text not null,
  target_summary text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

create policy "audit_logs_insert_authenticated"
  on audit_logs for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "audit_logs_select_admins"
  on audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

create index if not exists audit_logs_created_at_idx
  on audit_logs (created_at desc);
