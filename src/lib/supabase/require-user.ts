import { createClient } from "./server";

/** The signed-in user's client, or null. RLS scopes every query to their rows. */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? { supabase, userId: data.claims.sub } : null;
}
