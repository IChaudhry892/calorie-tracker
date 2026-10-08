import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { buttonClasses } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  { title: "Calorie calculator", text: "Find your maintenance calories, then targets to lose or gain weight." },
  { title: "Your food list", text: "Save foods with their calories and protein, or let AI estimate them." },
  { title: "Diets and a daily log", text: "Plan days you repeat, log what you ate, and see each week at a glance." },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/log");

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <h1 className="text-4xl font-semibold text-heading">Calorie Tracker</h1>
        <div className="h-1 w-28 rounded-sm bg-linear-to-r from-accent to-accent-secondary" />
        <p className="max-w-md text-lg">
          Track calories and protein, build diet plans, and calculate your daily needs.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className={`${buttonClasses()} px-6`}>
            Log in
          </Link>
          <Link href="/calculator" className={buttonClasses({ variant: "secondary" })}>
            Try the calculator
          </Link>
        </div>
        <ul className="mt-4 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="rounded-2xl bg-surface p-4">
              <h2 className="font-semibold text-heading">{feature.title}</h2>
              <p className="mt-1 text-sm text-foreground/80">{feature.text}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
