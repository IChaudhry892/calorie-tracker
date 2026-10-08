import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PublicHeader } from "@/components/PublicHeader";
import { buttonClasses } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

// Public route: the full nav when signed in, a minimal header otherwise.
export default async function CalculatorLayout({ children }: LayoutProps<"/calculator">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) return <AppShell>{children}</AppShell>;

  return (
    <>
      <PublicHeader
        action={
          <Link href="/login?next=/calculator" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Log in
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
