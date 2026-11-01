-- ============================================================
-- SKEMS one-time repair: correct request/borrow timestamps that
-- were stored before the submission path normalized naive local
-- times. Values like "2026-11-01T21:32" (Philippines wall time)
-- were interpreted by Postgres as UTC, skewing every stored
-- date_borrowed/date_due +8 hours. Shift them back once.
--
-- Run once in a quiet window (no requests being approved at the
-- same moment). After this, new submissions are already correct.
-- ============================================================

update requests
  set date_borrowed = date_borrowed - interval '8 hours',
      date_due      = date_due - interval '8 hours';

-- borrow_records copied their values from requests at approval time,
-- so historical borrowed rows are skewed the same way.
update borrow_records
  set date_time_borrowing = date_time_borrowing - interval '8 hours',
      date_time_return    = date_time_return - interval '8 hours';

-- If borrow_records.date is a date-only COPY of the borrowing day and
-- any rows crossed midnight due to the skew, that day was already
-- computed from the (now-correct) source; recompute it from the shift:
update borrow_records
  set date = (date_time_borrowing at time zone 'Asia/Manila')::date;
