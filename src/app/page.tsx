import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/log");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold text-heading">Calorie Tracker</h1>
      <div className="h-1 w-28 rounded-sm bg-linear-to-r from-accent to-accent-secondary" />
      <p className="max-w-md text-lg">
        Track calories and protein, build diet plans, and calculate your daily needs.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-accent-secondary px-6 py-2 font-medium text-heading transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Log in
      </Link>
    </main>
  );
}
