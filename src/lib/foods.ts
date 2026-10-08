import { z } from "zod";
import type { Food } from "@/lib/db";
import { formatQuantity } from "./macros";

// Matches the `foods.serving_unit` check constraint.
export const SERVING_UNITS = ["g", "ml", "oz", "piece", "slice", "cup", "tbsp", "tsp"] as const;
export type ServingUnit = (typeof SERVING_UNITS)[number];

// Count units take a plural above 1 ("2 slices", but "0.5 cup"); g, ml, oz, tbsp and tsp never change.
const PLURALS: Partial<Record<ServingUnit, string>> = { piece: "pieces", slice: "slices", cup: "cups" };

/** "100 g", "1 piece", "2 slices", "0.5 cup". */
export function formatServing({ serving_size, serving_unit }: Pick<Food, "serving_size" | "serving_unit">): string {
  const plural = serving_size > 1 ? PLURALS[serving_unit as ServingUnit] : undefined;
  return `${formatQuantity(serving_size)} ${plural ?? serving_unit}`;
}

/** Blank form fields become undefined, so they fail as "required" instead of coercing to 0. */
export const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const number = (message: string) => z.coerce.number({ error: message });

/** The plain fields. Kept separate because zod can't `.pick()` from a refined object. */
export const FoodFields = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80, "Use 80 characters or fewer."),
  serving_size: z.preprocess(
    blankToUndefined,
    number("Enter a serving size.").positive("Must be more than 0.").max(10000, "Must be 10,000 or less."),
  ),
  serving_unit: z.enum(SERVING_UNITS, { error: "Pick a unit." }),
  calories: z.preprocess(
    blankToUndefined,
    number("Enter the calories.").min(0, "Can't be negative.").max(10000, "Must be 10,000 or less."),
  ),
  protein_g: z.preprocess(
    blankToUndefined,
    number("Enter the protein.").min(0, "Can't be negative.").max(1000, "Must be 1,000 or less."),
  ),
  source: z.enum(["manual", "ai"]).default("manual"),
});

/** True when the protein (4 kcal/g) fits inside the calories; the +5 slack absorbs label rounding. */
export function proteinFitsCalories({ calories, protein_g }: { calories: number; protein_g: number }) {
  return protein_g * 4 <= calories + 5;
}

export const FoodSchema = FoodFields
  // Only checked once every field is valid, so a negative calorie count doesn't also flag protein.
  .refine(proteinFitsCalories, {
    message: "Protein can't supply more calories than the total.",
    path: ["protein_g"],
    when: (payload) => payload.issues.length === 0,
  });

export type FoodInput = z.infer<typeof FoodSchema>;
export type FoodField = keyof FoodInput;
