"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DateSchema } from "@/lib/dates";
import { QuantitySchema, type DietItemWithFood } from "@/lib/diets";
import { FoodFields, proteinFitsCalories, SERVING_UNITS } from "@/lib/foods";
import { entriesFromDiet, entryFromFood, rescaleEntry, type LogInsert } from "@/lib/log";
import { requireUser } from "@/lib/supabase/require-user";

export type LogActionResult = { error?: string };
export type ApplyDietResult = { error?: string; ok?: boolean; needsConfirm?: boolean; dietName?: string };

const IdSchema = z.uuid();
const LOGIN_AGAIN = { error: "Log in again." };
const FOOD_COLUMNS = "id, name, serving_size, serving_unit, calories, protein_g";
const { name: NameSchema, calories: CaloriesSchema, protein_g: ProteinSchema } = FoodFields.shape;

const AddEntrySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("food"), date: DateSchema, foodId: IdSchema, quantity: QuantitySchema }),
  // Typed in by the user, optionally filled by an AI estimate first (source "ai").
  z.object({
    kind: z.literal("custom"),
    date: DateSchema,
    name: NameSchema,
    quantity: QuantitySchema,
    unit: z.enum(SERVING_UNITS),
    calories: CaloriesSchema,
    protein_g: ProteinSchema,
    source: z.enum(["manual", "ai"]),
    saveToFoods: z.boolean(),
  }),
]);

export type AddEntryInput = z.input<typeof AddEntrySchema>;

const PROTEIN_TOO_HIGH = "Protein can't supply more calories than the total.";

export async function addLogEntry(input: AddEntryInput): Promise<LogActionResult> {
  const parsed = AddEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  const entry = parsed.data;
  if (entry.kind === "custom" && !proteinFitsCalories(entry)) return { error: PROTEIN_TOO_HIGH };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  let row: LogInsert;
  let savedFoodId: string | undefined;

  if (entry.kind === "food") {
    // Re-read the food so the snapshot comes from the database, not the client.
    const { data: food } = await supabase.from("foods").select(FOOD_COLUMNS).eq("id", entry.foodId).maybeSingle();
    if (!food) return { error: "That food no longer exists." };
    row = entryFromFood(food, entry.quantity, entry.date);
  } else {
    const { date, name, quantity, unit, calories, protein_g, source } = entry;
    if (entry.saveToFoods) {
      const { data: food, error } = await supabase
        .from("foods")
        .insert({ name, serving_size: quantity, serving_unit: unit, calories, protein_g, source })
        .select("id")
        .single();
      if (error) return { error: "Couldn't save it to your foods." };
      savedFoodId = food.id;
    }
    row = { log_date: date, food_id: savedFoodId, name, quantity, unit, calories, protein_g, source };
  }

  const { error } = await supabase.from("log_entries").insert(row);
  if (error) {
    // Two statements, no transaction: don't leave a food behind for an entry that wasn't logged.
    if (savedFoodId) await supabase.from("foods").delete().eq("id", savedFoodId);
    return { error: "Couldn't add the entry." };
  }

  revalidatePath("/log");
  if (savedFoodId) revalidatePath("/foods");
  return {};
}

export async function updateLogEntryQuantity(entryId: string, quantity: string): Promise<LogActionResult> {
  const id = IdSchema.safeParse(entryId);
  if (!id.success) return { error: "Couldn't update the quantity." };
  const parsed = QuantitySchema.safeParse(quantity);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { data: entry } = await user.supabase
    .from("log_entries")
    .select("quantity, calories, protein_g")
    .eq("id", id.data)
    .maybeSingle();
  if (!entry) return { error: "Couldn't update the quantity." };

  const { error } = await user.supabase
    .from("log_entries")
    .update({ quantity: parsed.data, ...rescaleEntry(entry, parsed.data) })
    .eq("id", id.data);
  if (error) return { error: "Couldn't update the quantity." };

  revalidatePath("/log");
  return {};
}

export async function deleteLogEntry(entryId: string): Promise<LogActionResult> {
  const id = IdSchema.safeParse(entryId);
  if (!id.success) return { error: "Couldn't delete the entry." };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { error } = await user.supabase.from("log_entries").delete().eq("id", id.data);
  if (error) return { error: "Couldn't delete the entry." };

  revalidatePath("/log");
  return {};
}

const ApplyDietSchema = z.object({ dietId: IdSchema, date: DateSchema, force: z.boolean().default(false) });

/** Copies every row of a diet into a day as snapshot entries, in one insert (all rows or none). */
export async function applyDiet(input: z.input<typeof ApplyDietSchema>): Promise<ApplyDietResult> {
  const parsed = ApplyDietSchema.safeParse(input);
  if (!parsed.success) return { error: "Pick a diet and a date." };
  const { dietId, date, force } = parsed.data;

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  const { data: diet } = await supabase
    .from("diets")
    .select(`name, diet_items(id, quantity, foods(${FOOD_COLUMNS}))`)
    .eq("id", dietId)
    .order("position", { referencedTable: "diet_items" })
    .maybeSingle();
  if (!diet) return { error: "That diet no longer exists." };
  const items: DietItemWithFood[] = diet.diet_items;
  if (items.length === 0) return { error: "This diet has no foods yet." };

  if (!force) {
    const { count } = await supabase
      .from("log_entries")
      .select("id", { count: "exact", head: true })
      .eq("diet_id", dietId)
      .eq("log_date", date);
    if (count) return { needsConfirm: true, dietName: diet.name };
  }

  const { error } = await supabase.from("log_entries").insert(entriesFromDiet(items, date, dietId));
  if (error) return { error: "Couldn't apply the diet." };

  revalidatePath("/log");
  return { ok: true, dietName: diet.name };
}
