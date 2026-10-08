"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { copyName, DietNameSchema, QuantitySchema } from "@/lib/diets";
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

export async function addDietItem(dietId: string, foodId: string, quantity: string): Promise<DietActionResult> {
  const ids = z.object({ dietId: IdSchema, foodId: IdSchema }).safeParse({ dietId, foodId });
  if (!ids.success) return { error: "Pick a food." };
  const parsed = QuantitySchema.safeParse(quantity);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await requireUser();
  if (!user) return LOGIN_AGAIN;
  const { supabase } = user;

  const { data: last } = await supabase
    .from("diet_items")
    .select("position")
    .eq("diet_id", ids.data.dietId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  // The composite FKs reject another user's diet or food.
  const { error } = await supabase.from("diet_items").insert({
    diet_id: ids.data.dietId,
    food_id: ids.data.foodId,
    quantity: parsed.data,
    position: (last?.position ?? -1) + 1,
  });
  if (error) return { error: "Couldn't add the food." };

  revalidateDiet(ids.data.dietId);
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
