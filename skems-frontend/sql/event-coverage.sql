-- ============================================================
-- SKEMS migration: event coverage checklist
-- Officers create folders per event, insert manually borrowed
-- equipment, review return proofs, and close out the event.
-- ============================================================

create table if not exists event_folders (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  status text not null default 'open',
  created_by uuid,
  created_at timestamptz not null default now(),
  returned_at timestamptz
);

create table if not exists event_items (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references event_folders(id) on delete cascade,
  equipment_id text not null,
  equipment_name text,
  borrower_id uuid references profiles(id) on delete set null,
  borrower_name text not null,
  borrow_time timestamptz not null default now(),
  return_time timestamptz,
  after_condition text,
  returned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table event_folders enable row level security;
alter table event_items enable row level security;

-- Members may browse folders (names only needed for their items)
create policy "event_folders_select_authenticated"
  on event_folders for select
  to authenticated
  using (true);

create policy "event_folders_write_admins"
  on event_folders for all
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

-- Members read their own event items; admins read all
create policy "event_items_select"
  on event_items for select
  to authenticated
  using (
    borrower_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

create policy "event_items_write_admins"
  on event_items for all
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin or p.is_superadmin)
    )
  );

-- Proofs can be tied to an event item instead of a request
alter table proofs
  add column if not exists event_item_id uuid;

create index if not exists event_items_folder_idx on event_items (folder_id);
create index if not exists event_items_borrower_idx on event_items (borrower_id);
