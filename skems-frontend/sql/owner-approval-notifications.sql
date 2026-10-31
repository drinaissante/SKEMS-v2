-- ============================================================
-- SKEMS migration: owner pre-approval + notification system
-- Run once in the Supabase SQL editor.
-- ============================================================

-- 1) Two-step approval columns
alter table requests
  add column if not exists owner_status text not null default 'pending',
  add column if not exists owner_reason text;

-- 2) Notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  request_id uuid,
  equipment_id text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

-- Users manage their own rows
create policy "notifications_select_own"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update
  to authenticated
  using (user_id = auth.uid());

-- Any authenticated user may create notifications (client-side inserts
-- fan out to other users: owners, admins, borrowers).
create policy "notifications_insert_authenticated"
  on notifications for insert
  to authenticated
  with check (auth.role() = 'authenticated');

-- Admins can read everything (admins are profiles with is_admin)
create policy "notifications_select_admins"
  on notifications for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

-- 3) Owners can read requests for equipment they own (owner name matching).
--    Matching is case/whitespace-insensitive against profiles.full_name.
create policy "requests_select_equipment_owner"
  on requests for select
  to authenticated
  using (
    owner is not null
    and regexp_replace(lower(owner), '\s+', ' ', 'g') =
        regexp_replace(
          lower(coalesce(
            (select full_name from profiles where id = auth.uid()),
            ''
          )),
          '\s+', ' ', 'g'
        )
  );

-- 4) Owners can update ONLY the owner-decision columns of matching requests.
create policy "requests_update_owner_decision"
  on requests for update
  to authenticated
  using (
    owner is not null
    and regexp_replace(lower(owner), '\s+', ' ', 'g') =
        regexp_replace(
          lower(coalesce(
            (select full_name from profiles where id = auth.uid()),
            ''
          )),
          '\s+', ' ', 'g'
        )
  )
  with check (true);

-- 5) Realtime for notifications
alter publication supabase_realtime add table notifications;

-- 6) Helpful index for owner slot lookups
create index if not exists requests_equipment_status_idx
  on requests (equipment_id, status);
