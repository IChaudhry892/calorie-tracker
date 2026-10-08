"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FoodSchema, type FoodField } from "@/lib/foods";
import { createClient } from "@/lib/supabase/server";

export type FoodFormState = {
  error?: string;
  fieldErrors?: Partial<Record<FoodField, string>>;
  ok?: boolean;
};

export type DeleteFoodResult = { error?: string };

const IdSchema = z.uuid();

/** The signed-in user's client, or null. RLS scopes every query to their rows. */
async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? { supabase, userId: data.claims.sub } : null;
}

export async function saveFood(_prevState: FoodFormState, formData: FormData): Promise<FoodFormState> {
  const user = await requireUser();
  if (!user) return { error: "Log in again." };

  const parsed = FoodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: FoodFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FoodField;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const id = IdSchema.safeParse(formData.get("id"));
  const { error } = id.success
    ? await user.supabase.from("foods").update(parsed.data).eq("id", id.data)
    : await user.supabase.from("foods").insert(parsed.data);
  if (error) return { error: "Couldn't save the food." };

  revalidatePath("/foods");
  return { ok: true };
}

export async function deleteFood(id: string): Promise<DeleteFoodResult> {
  const user = await requireUser();
  if (!user) return { error: "Log in again." };

  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) return { error: "Couldn't delete the food." };

  const { error } = await user.supabase.from("foods").delete().eq("id", parsedId.data);
  if (error?.code === "23503") {
    // diet_items.food_id is `on delete restrict`. Log entries keep their snapshot instead.
    const { data } = await user.supabase.from("diet_items").select("diets(name)").eq("food_id", parsedId.data);
    const names = [...new Set((data ?? []).map((row) => row.diets?.name).filter(Boolean))];
    return {
      error: names.length
        ? `Used in ${names.join(", ")}. Remove it from ${names.length === 1 ? "that diet" : "these diets"} first.`
        : "This food is used in a diet. Remove it from the diet first.",
    };
  }
  if (error) return { error: "Couldn't delete the food." };

  revalidatePath("/foods");
  return {};
}
