import { DateSchema, weekDays } from "@/lib/dates";
import { dietTotals, type DietItemWithFood } from "@/lib/diets";
import { createClient } from "@/lib/supabase/server";
import { DailyLog } from "./DailyLog";
import { SetToday } from "./SetToday";

const FOOD_COLUMNS = "id, name, serving_size, serving_unit, calories, protein_g";

export default async function LogPage({ searchParams }: PageProps<"/log">) {
  const { date } = await searchParams;
  // The browser decides "today" (the server runs in UTC), so a missing date is filled in client-side.
  const parsed = DateSchema.safeParse(date);
  if (!parsed.success) return <SetToday />;

  const day = parsed.data;
  const week = weekDays(day);
  const supabase = await createClient();

  // One range query covers the week strip and the selected day.
  const [{ data: entries }, { data: foods }, { data: diets }, { data: claims }] = await Promise.all([
    supabase
      .from("log_entries")
      .select("id, log_date, name, quantity, unit, calories, protein_g, source, diet_id, diets(name)")
      .gte("log_date", week[0])
      .lte("log_date", week[6])
      .order("created_at"),
    supabase.from("foods").select(FOOD_COLUMNS).order("name"),
    supabase.from("diets").select(`id, name, diet_items(id, quantity, foods(${FOOD_COLUMNS}))`).order("name"),
    supabase.auth.getClaims(),
  ]);

  const { data: profile } = claims?.claims
    ? await supabase.from("profiles").select("maintenance_calories").eq("id", claims.claims.sub).maybeSingle()
    : { data: null };

  const dietOptions = (diets ?? []).map((diet) => {
    const items: DietItemWithFood[] = diet.diet_items;
    return { id: diet.id, name: diet.name, calories: dietTotals(items).calories, itemCount: items.length };
  });

  return (
    <DailyLog
      key={day}
      date={day}
      week={week}
      entries={entries ?? []}
      foods={foods ?? []}
      diets={dietOptions}
      maintenance={profile?.maintenance_calories ?? null}
    />
  );
}
