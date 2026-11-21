-- ============================================================
-- SKEMS migration: optional event tag on borrow requests
-- Members may tag a request with an open event (informational;
-- officers add the equipment to the event folder manually).
-- ============================================================

alter table requests
  add column if not exists event_id uuid references event_folders(id) on delete set null,
  add column if not exists event_name text;
