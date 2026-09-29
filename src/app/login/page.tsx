import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-lg sm:p-8">
        <h1 className="text-center text-3xl font-semibold text-heading">Log in</h1>
        <div className="mx-auto mt-3 mb-6 h-1 w-20 rounded-sm bg-linear-to-r from-accent to-accent-secondary" />
        <LoginForm
          next={next}
          initialError={
            error === "auth" ? "That sign-in link is invalid or has expired. Please try again." : undefined
          }
        />
      </div>
    </main>
  );
}
