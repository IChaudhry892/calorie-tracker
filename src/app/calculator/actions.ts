"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACTIVITY_LEVELS, maintenanceCalories, SEXES } from "@/lib/calories";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; message?: string };

// Metric only: the form converts imperial values before submitting.
const ProfileSchema = z.object({
  unit_system: z.enum(["metric", "imperial"]),
  sex: z.enum(SEXES),
  age: z.coerce.number().int().min(13).max(120),
  height_cm: z.coerce.number().min(50).max(275),
  weight_kg: z.coerce.number().min(20).max(550),
  activity_level: z.enum(ACTIVITY_LEVELS),
});

export async function saveProfile(_prevState: SaveState, formData: FormData): Promise<SaveState> {
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check your details and try again." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Log in to save." };

  const { sex, age, height_cm, weight_kg, activity_level } = parsed.data;
  // Computed here rather than trusted from the client.
  const maintenance_calories = Math.round(
    maintenanceCalories({ sex, age, heightCm: height_cm, weightKg: weight_kg }, activity_level),
  );

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, maintenance_calories })
    .eq("id", data.claims.sub);
  if (error) return { error: "Couldn't save. Please try again." };

  revalidatePath("/calculator");
  return { message: "Saved." };
}
