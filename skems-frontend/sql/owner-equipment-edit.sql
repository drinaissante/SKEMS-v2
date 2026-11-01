-- ============================================================
-- SKEMS migration: allow equipment owners to edit their equipment
-- Owner matching is case/whitespace-insensitive against
-- profiles.full_name (same pattern as the requests owner policy).
-- ============================================================

drop policy if exists "equipments_update_owner" on equipments;
create policy "equipments_update_owner"
  on equipments for update
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

-- Optional index supporting the policy lookup pattern
create index if not exists equipments_owner_idx
  on equipments (owner);
