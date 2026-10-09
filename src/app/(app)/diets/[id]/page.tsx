import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { dailyTarget } from "@/lib/calories";
import type { DietItemWithFood } from "@/lib/diets";
import { createClient } from "@/lib/supabase/server";
import { DietEditor } from "./DietEditor";

const FOOD_COLUMNS = "id, name, serving_size, serving_unit, calories, protein_g";

export async function generateMetadata({ params }: PageProps<"/diets/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return { title: "Diet not found" };
  const supabase = await createClient();
  const { data } = await supabase.from("diets").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Diet not found" };
}

export default async function DietPage({ params }: PageProps<"/diets/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: diet }, { data: foods }, { data: claims }] = await Promise.all([
    supabase
      .from("diets")
      .select(`id, name, diet_items(id, quantity, foods(${FOOD_COLUMNS}))`)
      .eq("id", id)
      .order("position", { referencedTable: "diet_items" })
      .maybeSingle(),
    supabase.from("foods").select(FOOD_COLUMNS).order("name"),
    supabase.auth.getClaims(),
  ]);
  // RLS makes another user's diet look exactly like a missing one.
  if (!diet) notFound();

  const { data: profile } = claims?.claims
    ? await supabase.from("profiles").select("maintenance_calories, goal").eq("id", claims.claims.sub).maybeSingle()
    : { data: null };

  const items: DietItemWithFood[] = diet.diet_items;
  return (
    <DietEditor
      diet={{ id: diet.id, name: diet.name, items }}
      foods={foods ?? []}
      target={dailyTarget(profile?.maintenance_calories ?? null, profile?.goal)}
    />
  );
}
