-- Initial schema: profiles, foods, diets, diet_items, log_entries.
-- Every table has RLS; every row is owned by auth.uid().

-- ---------------------------------------------------------------------------
-- Shared helper
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  sex text check (sex in ('male', 'female')),
  age int check (age between 13 and 120),
  height_cm numeric check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  activity_level text check (
    activity_level in ('bmr', 'sedentary', 'light', 'moderate', 'active', 'very_active', 'extra_active')
  ),
  maintenance_calories int check (maintenance_calories > 0),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- foods
-- ---------------------------------------------------------------------------

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  serving_size numeric not null check (serving_size > 0),
  serving_unit text not null check (
    serving_unit in ('g', 'ml', 'oz', 'piece', 'slice', 'cup', 'tbsp', 'tsp')
  ),
  calories numeric not null check (calories >= 0),
  protein_g numeric not null check (protein_g >= 0),
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  -- Target for composite FKs, so child rows can only reference the same user's food.
  unique (id, user_id)
);

create index foods_user_id_name_idx on public.foods (user_id, name);

-- ---------------------------------------------------------------------------
-- diets
-- ---------------------------------------------------------------------------

create table public.diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create trigger diets_set_updated_at
  before update on public.diets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- diet_items (macros computed live from the referenced food)
-- ---------------------------------------------------------------------------

create table public.diet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  diet_id uuid not null,
  food_id uuid not null,
  quantity numeric not null check (quantity > 0),
  position int not null default 0,
  created_at timestamptz not null default now(),
  -- FK checks bypass RLS; carrying user_id stops cross-user references.
  foreign key (diet_id, user_id) references public.diets (id, user_id) on delete cascade,
  foreign key (food_id, user_id) references public.foods (id, user_id) on delete restrict
);

create index diet_items_diet_id_position_idx on public.diet_items (diet_id, position);
create index diet_items_food_id_idx on public.diet_items (food_id);

-- ---------------------------------------------------------------------------
-- log_entries (snapshot of name/macros at log time)
-- ---------------------------------------------------------------------------

create table public.log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  food_id uuid,
  name text not null check (char_length(name) between 1 and 80),
  quantity numeric not null check (quantity > 0),
  unit text not null,
  calories numeric not null check (calories >= 0),
  protein_g numeric not null check (protein_g >= 0),
  source text not null check (source in ('food', 'ai', 'manual')),
  created_at timestamptz not null default now(),
  -- Only food_id is nulled when the food is deleted; user_id stays.
  foreign key (food_id, user_id) references public.foods (id, user_id) on delete set null (food_id)
);

create index log_entries_user_id_log_date_idx on public.log_entries (user_id, log_date);
create index log_entries_food_id_idx on public.log_entries (food_id);

-- ---------------------------------------------------------------------------
-- Grants (RLS decides which rows; anon gets nothing)
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.foods, public.diets, public.diet_items, public.log_entries from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete
  on public.foods, public.diets, public.diet_items, public.log_entries
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.diets enable row level security;
alter table public.diet_items enable row level security;
alter table public.log_entries enable row level security;

-- profiles: no insert (trigger does it), no delete (cascades from auth.users).
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- foods
create policy "foods_select_own" on public.foods
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "foods_insert_own" on public.foods
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "foods_update_own" on public.foods
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "foods_delete_own" on public.foods
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- diets
create policy "diets_select_own" on public.diets
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "diets_insert_own" on public.diets
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "diets_update_own" on public.diets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "diets_delete_own" on public.diets
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- diet_items
create policy "diet_items_select_own" on public.diet_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "diet_items_insert_own" on public.diet_items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "diet_items_update_own" on public.diet_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "diet_items_delete_own" on public.diet_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- log_entries
create policy "log_entries_select_own" on public.log_entries
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "log_entries_insert_own" on public.log_entries
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "log_entries_update_own" on public.log_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "log_entries_delete_own" on public.log_entries
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- New-user trigger: create an empty profile for every sign-up
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill accounts created before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict do nothing;
