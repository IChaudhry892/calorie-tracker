-- Diet rows always reference a food (macros are computed live), so a food typed
-- into a diet's Manual tab with "Also save to my foods" unticked is still saved,
-- but unlisted: it's hidden from the Foods page and the pickers.
alter table public.foods
  add column listed boolean not null default true;

-- An unlisted food only exists for its diet rows, so it goes with the last one
-- (a removed row, a deleted diet, or delete_my_account). AFTER ROW triggers run
-- at the end of the statement, so `not exists` sees every row the statement
-- deleted. Log entries keep their snapshot; their food_id is set to null.
create function public.delete_unlisted_food()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.foods f
  where f.id = old.food_id
    and not f.listed
    and not exists (select 1 from public.diet_items d where d.food_id = old.food_id);
  return null;
end;
$$;

create trigger diet_items_delete_unlisted_food
  after delete on public.diet_items
  for each row execute function public.delete_unlisted_food();
