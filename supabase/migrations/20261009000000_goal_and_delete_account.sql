-- Calorie goal picked on the calculator (one of its 7 cards). The Daily Log
-- tracks against maintenance_calories + the goal's offset.
alter table public.profiles
  add column goal text not null default 'maintain' check (
    goal in ('maintain', 'mild_loss', 'loss', 'extreme_loss', 'mild_gain', 'gain', 'fast_gain')
  );

-- In-app account deletion. Deleting the auth.users row cascades to every table
-- (profiles, foods, diets, diet_items, log_entries, ai_usage). diet_items go
-- first: their food FK is `on delete restrict`, and the cascade order between
-- foods and diet_items isn't guaranteed.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.diet_items where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
