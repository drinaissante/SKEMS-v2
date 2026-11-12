-- ============================================================
-- SKEMS migration: registration approval system
-- New accounts start 'pending'; SuperAdmins approve/reject.
-- Only 'approved' accounts may authenticate.
-- ============================================================

alter table profiles
  add column if not exists approval_status text not null default 'pending';

-- Grandfather existing accounts
update profiles
  set approval_status = 'approved'
  where approval_status = 'pending';

-- SuperAdmins manage approval decisions
drop policy if exists "profiles_update_approval_superadmin" on profiles;
create policy "profiles_update_approval_superadmin"
  on profiles for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.is_superadmin
    )
  )
  with check (true);

create index if not exists profiles_approval_status_idx
  on profiles (approval_status);
