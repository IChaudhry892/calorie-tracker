-- Per-user daily cap on AI estimates, so a leaked session can't burn through
-- the shared free-tier Gemini quota. Users can read their own count but never
-- write it: the only way to change it is consume_ai_quota(), which only counts up.

create table public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  count int not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

create policy "ai_usage: select own"
  on public.ai_usage for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Supabase's default privileges grant everything on new tables; take it back.
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

-- Counts one estimate for the calling user (UTC day). Returns false once the
-- day's limit is reached. The limit is fixed here rather than a parameter, so a
-- caller can't raise it.
create function public.consume_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  consumed boolean;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.ai_usage as u (user_id, day, count)
  values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < 50
  returning true into consumed;

  return coalesce(consumed, false);
end;
$$;

revoke execute on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
