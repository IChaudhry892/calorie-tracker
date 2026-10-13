"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { copyName, DietNameSchema, mergeDietAdds, QuantitySchema } from "@/lib/diets";
import { FoodFields, proteinFitsCalories, SERVING_UNITS } from "@/lib/foods";
import { requireUser } from "@/lib/supabase/require-user";

export type DietActionResult = { error?: string };

const IdSchema = z.uuid();
const LOGIN_AGAIN = { error: "Log in again." };

function revalidateDiet(dietId: string) {
  revalidatePath("/diets");
  revalidatePath(`/diets/${dietId}`);
}

const firstError = (error: z.ZodError) => error.issues[0]?.message ?? "Check the value and try again.";

export async function createDiet(_prevState: DietActionResult, formData: FormData): Promise<DietActionResult> {
  const name = DietNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: firstError(name.error) };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { data, error } = await user.supabase.from("diets").insert({ name: name.data }).select("id").single();
  if (error) return { error: "Couldn't create the diet." };

  revalidatePath("/diets");
  redirect(`/diets/${data.id}`);
}

export async function renameDiet(dietId: string, name: string): Promise<DietActionResult> {
  const id = IdSchema.safeParse(dietId);
  const parsed = DietNameSchema.safeParse(name);
  if (!id.success) return { error: "Couldn't rename the diet." };
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { error } = await user.supabase.from("diets").update({ name: parsed.data }).eq("id", id.data);
  if (error) return { error: "Couldn't rename the diet." };

  revalidateDiet(id.data);
  return {};
}

export async function deleteDiet(dietId: string): Promise<DietActionResult> {
  const id = IdSchema.safeParse(dietId);
  if (!id.success) return { error: "Couldn't delete the diet." };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  // diet_items cascade; logged days keep their own snapshots.
  const { error } = await user.supabase.from("diets").delete().eq("id", id.data);
  if (error) return { error: "Couldn't delete the diet." };

  revalidatePath("/diets");
  redirect("/diets");
}

export async function duplicateDiet(dietId: string): Promise<DietActionResult> {
  const id = IdSchema.safeParse(dietId);
  if (!id.success) return { error: "Couldn't duplicate the diet." };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  const { data: source } = await supabase
    .from("diets")
    .select("name, diet_items(food_id, quantity, position)")
    .eq("id", id.data)
    .maybeSingle();
  if (!source) return { error: "Couldn't duplicate the diet." };

  const { data: copy, error } = await supabase
    .from("diets")
    .insert({ name: copyName(source.name) })
    .select("id")
    .single();
  if (error) return { error: "Couldn't duplicate the diet." };

  if (source.diet_items.length > 0) {
    const { error: itemsError } = await supabase
      .from("diet_items")
      .insert(source.diet_items.map((item) => ({ ...item, diet_id: copy.id })));
    if (itemsError) {
      // Two statements, no transaction: undo the empty copy rather than leave it half-made.
      await supabase.from("diets").delete().eq("id", copy.id);
      return { error: "Couldn't duplicate the diet." };
    }
  }

  revalidatePath("/diets");
  redirect(`/diets/${copy.id}`);
}

const DietAddsSchema = z
  .array(z.object({ foodId: IdSchema, quantity: QuantitySchema }))
  .min(1, "Pick a food.")
  .max(100, "Add 100 foods or fewer at a time.");

/** Adds the picked foods. A food already in the diet gets its quantity topped up instead of a second row. */
export async function addDietItems(
  dietId: string,
  adds: z.input<typeof DietAddsSchema>,
): Promise<DietActionResult> {
  const id = IdSchema.safeParse(dietId);
  if (!id.success) return { error: "Couldn't add the food." };
  const parsed = DietAddsSchema.safeParse(adds);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  const { data: existing, error: readError } = await supabase
    .from("diet_items")
    .select("id, food_id, quantity, position")
    .eq("diet_id", id.data)
    .order("position");
  if (readError) return { error: "Couldn't add the food." };

  const { updates, inserts, overLimit } = mergeDietAdds(existing, parsed.data);
  if (overLimit.length > 0) {
    return { error: "That would take a food in this diet past 10,000. Edit its row instead." };
  }

  // One statement per topped-up row (usually one or two), then one insert for the new rows.
  for (const update of updates) {
    const { error } = await supabase
      .from("diet_items")
      .update({ quantity: update.quantity })
      .eq("id", update.id)
      .eq("diet_id", id.data);
    if (error) return { error: "Couldn't add the food." };
  }

  if (inserts.length > 0) {
    const nextPosition = Math.max(-1, ...existing.map((item) => item.position)) + 1;
    // The composite FKs reject another user's diet or food.
    const { error } = await supabase.from("diet_items").insert(
      inserts.map((add, index) => ({
        diet_id: id.data,
        food_id: add.foodId,
        quantity: add.quantity,
        position: nextPosition + index,
      })),
    );
    if (error) {
      revalidateDiet(id.data); // Any top-ups above did land.
      return { error: "Couldn't add the food." };
    }
  }

  revalidateDiet(id.data);
  return {};
}

const ManualItemSchema = z.object({
  name: FoodFields.shape.name,
  quantity: QuantitySchema,
  unit: z.enum(SERVING_UNITS),
  calories: FoodFields.shape.calories,
  protein_g: FoodFields.shape.protein_g,
  source: z.enum(["manual", "ai"]),
  saveToFoods: z.boolean(),
});

/**
 * Manual tab: diet rows always point at a food, so this saves one (this amount = one serving) and adds it.
 * Without `saveToFoods` the food is unlisted: hidden from the Foods page and pickers, and deleted with its last row.
 */
export async function addManualDietItem(
  dietId: string,
  input: z.input<typeof ManualItemSchema>,
): Promise<DietActionResult> {
  const id = IdSchema.safeParse(dietId);
  if (!id.success) return { error: "Couldn't add the food." };
  const parsed = ManualItemSchema.safeParse(input);
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!proteinFitsCalories(parsed.data)) return { error: "Protein can't supply more calories than the total." };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  const { name, quantity, unit, calories, protein_g, source, saveToFoods } = parsed.data;
  const { data: food, error: foodError } = await supabase
    .from("foods")
    .insert({ name, serving_size: quantity, serving_unit: unit, calories, protein_g, source, listed: saveToFoods })
    .select("id")
    .single();
  if (foodError) return { error: "Couldn't add the food." };

  const result = await addDietItems(id.data, [{ foodId: food.id, quantity }]);
  if (result.error) {
    // Two statements, no transaction: don't leave a food behind for a row that wasn't added.
    await supabase.from("foods").delete().eq("id", food.id);
    return result;
  }

  if (saveToFoods) revalidatePath("/foods");
  return {};
}

export async function updateDietItemQuantity(
  dietId: string,
  itemId: string,
  quantity: string,
): Promise<DietActionResult> {
  const ids = z.object({ dietId: IdSchema, itemId: IdSchema }).safeParse({ dietId, itemId });
  if (!ids.success) return { error: "Couldn't update the quantity." };
  const parsed = QuantitySchema.safeParse(quantity);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { error } = await user.supabase
    .from("diet_items")
    .update({ quantity: parsed.data })
    .eq("id", ids.data.itemId)
    .eq("diet_id", ids.data.dietId);
  if (error) return { error: "Couldn't update the quantity." };

  revalidateDiet(ids.data.dietId);
  return {};
}

export async function removeDietItem(dietId: string, itemId: string): Promise<DietActionResult> {
  const ids = z.object({ dietId: IdSchema, itemId: IdSchema }).safeParse({ dietId, itemId });
  if (!ids.success) return { error: "Couldn't remove the food." };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;

  const { error } = await user.supabase
    .from("diet_items")
    .delete()
    .eq("id", ids.data.itemId)
    .eq("diet_id", ids.data.dietId);
  if (error) return { error: "Couldn't remove the food." };

  revalidateDiet(ids.data.dietId);
  return {};
}
