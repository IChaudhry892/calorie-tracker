import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

// Temporary: replaced by the real daily log in Phase 9. Sign-out moves into the nav in Phase 4.
export default async function LogPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold text-heading">Today</h1>
      <p className="text-lg">
        Signed in as <span className="text-accent">{data?.claims?.email}</span>
      </p>
      <form action={signOut}>
        <button className="rounded-lg border-2 border-accent px-4 py-2 font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          Sign out
        </button>
      </form>
    </main>
  );
}
