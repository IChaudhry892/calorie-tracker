-- Applying a diet to a day (R9): log entries remember which diet they came from.
-- Entries are snapshots, so deleting the diet only clears the link.

alter table public.log_entries add column diet_id uuid;

-- Carrying user_id stops an entry pointing at another user's diet (FK checks bypass RLS).
alter table public.log_entries
  add constraint log_entries_diet_id_user_id_fkey
  foreign key (diet_id, user_id) references public.diets (id, user_id)
  on delete set null (diet_id);

create index log_entries_diet_id_idx on public.log_entries (diet_id);

alter table public.log_entries drop constraint log_entries_source_check;
alter table public.log_entries
  add constraint log_entries_source_check check (source in ('food', 'ai', 'manual', 'diet'));
