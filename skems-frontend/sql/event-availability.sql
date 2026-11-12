-- ============================================================
-- SKEMS migration: event equipment availability
-- Event folders gain a borrow/return window; assigned equipment
-- is marked 'Unavailable' while the window is active and
-- restored to its after-condition when items are returned.
-- Requires: pg_cron (already enabled by notifications-cleanup.sql)
-- ============================================================

alter table event_folders
  add column if not exists borrow_time timestamptz,
  add column if not exists return_time timestamptz;

create or replace function skems_event_equipment_sweep() returns void as $$
begin
  -- Activate: open event windows whose borrow_time has started and
  -- return_time has not passed; equipment not already Borrowed/Unavailable.
  update equipments e
    set condition = 'Unavailable'
    from event_items ei
    join event_folders ef on ef.id = ei.folder_id
    where ei.equipment_id = e.equipment_id
      and ef.status = 'open'
      and ei.returned = false
      and ef.borrow_time is not null
      and ef.return_time is not null
      and ef.borrow_time <= now()
      and ef.return_time >= now()
      and e.condition not in ('Borrowed', 'Unavailable');

  -- Restore: equipment of returned event items still parked at
  -- 'Unavailable' goes back to its after-condition.
  update equipments e
    set condition = coalesce(ei.after_condition, 'Working')
    from event_items ei
    where ei.equipment_id = e.equipment_id
      and ei.returned = true
      and e.condition = 'Unavailable';
end;
$$ language plpgsql;

-- Hourly sweep so the availability window flips on time.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'skems-event-equipment-sweep') then
    perform cron.unschedule('skems-event-equipment-sweep');
  end if;
end $$;

select cron.schedule(
  'skems-event-equipment-sweep',
  '0 * * * *',
  $$ select skems_event_equipment_sweep(); $$
);
