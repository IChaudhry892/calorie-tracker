import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { buttonClasses } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

// Public route: the full nav when signed in, a minimal header otherwise.
export default async function CalculatorLayout({ children }: LayoutProps<"/calculator">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) return <AppShell>{children}</AppShell>;

  return (
    <>
      <header className="bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 md:px-6 md:py-3">
          <Link
            href="/"
            className="rounded-lg text-lg font-semibold text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Calorie Tracker
          </Link>
          <Link href="/login?next=/calculator" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Log in
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
