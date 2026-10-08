import type { Metadata } from "next";
import Link from "next/link";
import { dietTotals, type DietItemWithFood } from "@/lib/diets";
import { formatCalories, formatProtein } from "@/lib/macros";
import { createClient } from "@/lib/supabase/server";
import { NewDietButton } from "./NewDietButton";

export const metadata: Metadata = { title: "Diets" };

export default async function DietsPage() {
  const supabase = await createClient();
  // RLS limits this to the signed-in user's diets.
  const { data } = await supabase
    .from("diets")
    .select("id, name, diet_items(id, quantity, foods(id, name, serving_size, serving_unit, calories, protein_g))")
    .order("created_at", { ascending: false });
  const diets = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-heading">Diets</h1>
        {diets.length > 0 && <NewDietButton />}
      </div>

      {diets.length === 0 ? (
        <NewDietButton empty />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {diets.map((diet) => {
            const items: DietItemWithFood[] = diet.diet_items;
            const total = dietTotals(items);
            return (
              <li key={diet.id}>
                <Link
                  href={`/diets/${diet.id}`}
                  className="flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 transition-colors hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:p-6"
                >
                  <span className="font-semibold break-words text-heading">{diet.name}</span>
                  <span className="text-sm text-foreground/70">
                    {items.length} {items.length === 1 ? "food" : "foods"}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-xl font-semibold text-accent">{formatCalories(total.calories)}</span> kcal ·{" "}
                    <span className="font-semibold text-heading">{formatProtein(total.protein_g)}</span> g protein
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
