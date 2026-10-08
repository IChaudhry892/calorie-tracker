import { z } from "zod";
import { proteinFitsCalories } from "../foods";

// Pure (no "server-only"), so the parsing can be unit tested. Bounds match FoodSchema.
export const EstimateSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  assumption: z.string().max(200),
});

export type Estimate = z.infer<typeof EstimateSchema>;
export type EstimateResult = { ok: true; data: Estimate } | { ok: false; error: string };

export const ESTIMATE_FAILED = "Couldn't estimate. Enter the values yourself.";
/** The system instruction asks for this exact assumption when the input isn't a food. */
export const NOT_A_FOOD = "not a food";

/** Validates the model's JSON text. Empty text means a safety block or an empty candidate. */
export function parseEstimate(text: string | undefined): EstimateResult {
  if (!text?.trim()) return { ok: false, error: ESTIMATE_FAILED };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: ESTIMATE_FAILED };
  }
  const parsed = EstimateSchema.safeParse(json);
  if (!parsed.success || !proteinFitsCalories(parsed.data)) return { ok: false, error: ESTIMATE_FAILED };
  if (parsed.data.assumption.trim().toLowerCase().startsWith(NOT_A_FOOD)) {
    return { ok: false, error: "That doesn't look like a food. Check the name, or enter the values yourself." };
  }
  return { ok: true, data: parsed.data };
}
