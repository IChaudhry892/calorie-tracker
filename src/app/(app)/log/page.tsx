import { createClient } from "@/lib/supabase/server";

// Temporary: replaced by the real Daily Log (date navigation, entries, apply a diet) in Phase 9.
export default async function LogPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-heading">Daily Log</h1>
      <p>
        Signed in as <span className="text-accent">{data?.claims?.email}</span>
      </p>
    </div>
  );
}
