-- rls_auto_enable() is Supabase's event-trigger function behind `ensure_rls`
-- (turns on RLS for every new table). Event triggers don't check EXECUTE, so
-- the trigger keeps working; this only closes /rest/v1/rpc/rls_auto_enable,
-- which the advisors flag as a security-definer function callable by clients.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
