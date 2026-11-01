-- ============================================================
-- SKEMS migration: auto-clear read notifications after 7 days
-- Run once in the Supabase SQL editor (needs pg_cron extension;
-- enable it first via Database -> Extensions if not present).
-- ============================================================

-- 1) Track when each notification was read
alter table notifications
  add column if not exists read_at timestamptz;

-- Backfill: rows already marked read (from before this migration)
update notifications
  set read_at = created_at
  where read = true and read_at is null;

-- 2) Allow users to delete only their own, already-read, expired rows
drop policy if exists "notifications_delete_expired_own" on notifications;
create policy "notifications_delete_expired_own"
  on notifications for delete
  to authenticated
  using (
    user_id = auth.uid()
    and read = true
    and read_at < now() - interval '7 days'
  );

-- 3) Daily scheduled cleanup at 04:00 UTC
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'skems-clear-read-notifications') then
    perform cron.unschedule('skems-clear-read-notifications');
  end if;
end $$;

select cron.schedule(
  'skems-clear-read-notifications',
  '0 4 * * *',
  $$ delete from notifications where read = true and read_at < now() - interval '7 days' $$
);
