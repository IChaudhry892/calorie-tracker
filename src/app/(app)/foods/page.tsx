import { createClient } from "@/lib/supabase/server";
import { FoodList } from "./FoodList";

export default async function FoodsPage() {
  const supabase = await createClient();
  // RLS limits this to the signed-in user's foods.
  const { data: foods } = await supabase
    .from("foods")
    .select("id, name, serving_size, serving_unit, calories, protein_g, source")
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Foods</h1>
      <FoodList foods={foods ?? []} />
    </div>
  );
}
