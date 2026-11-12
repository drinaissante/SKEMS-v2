-- ============================================================
-- SKEMS migration: return proofs (mandatory proof of return)
-- Members upload/photograph the returned equipment; officers
-- approve/reject before the borrow is marked returned.
-- ============================================================

create table if not exists proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  request_id uuid,
  equipment_id text not null,
  storage_path text not null,
  status text not null default 'pending',
  reject_reason text,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table proofs enable row level security;

create policy "proofs_insert_own"
  on proofs for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "proofs_select_own"
  on proofs for select
  to authenticated
  using (user_id = auth.uid());

create policy "proofs_select_admins"
  on proofs for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

create policy "proofs_update_admins"
  on proofs for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  )
  with check (true);

alter table requests
  add column if not exists returned_proof_id uuid;

create index if not exists proofs_status_idx on proofs (status);

-- Private storage bucket for proof photos
insert into storage.buckets (id, name, public)
values ('return-proofs', 'return-proofs', false)
on conflict (id) do nothing;

-- Objects: upload only into own "<user_id>/..." folder
drop policy if exists "return_proofs_upload_own" on storage.objects;
create policy "return_proofs_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'return-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Objects: read own folder or admins
drop policy if exists "return_proofs_read" on storage.objects;
create policy "return_proofs_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'return-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from profiles p
        where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
      )
    )
  );

-- Objects: admins may remove rejected/duplicate files
drop policy if exists "return_proofs_delete_admins" on storage.objects;
create policy "return_proofs_delete_admins"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'return-proofs'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );
