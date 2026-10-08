import { z } from "zod";
import type { Food } from "./db";
import { blankToUndefined } from "./foods";
import { scaleMacros, sumMacros, type MacroRow } from "./macros";

const MAX_NAME = 80; // Matches the diets.name check constraint.

export const DietNameSchema = z.string().trim().min(1, "Enter a name.").max(MAX_NAME, "Use 80 characters or fewer.");

export const QuantitySchema = z.preprocess(
  blankToUndefined,
  z.coerce
    .number({ error: "Enter a quantity." })
    .positive("Must be more than 0.")
    .max(10000, "Must be 10,000 or less."),
);

export type DietFood = Pick<Food, "id" | "name" | "serving_size" | "serving_unit" | "calories" | "protein_g">;

/** A diet row joined to its food. Macros are always computed live from the food. */
export type DietItemWithFood = { id: string; quantity: number; foods: DietFood };

export function dietRows(items: DietItemWithFood[]): MacroRow[] {
  return items.map(({ id, quantity, foods }) => ({
    id,
    name: foods.name,
    quantity,
    unit: foods.serving_unit,
    ...scaleMacros(foods, quantity),
  }));
}

export function dietTotals(items: DietItemWithFood[]) {
  return sumMacros(dietRows(items));
}

/** "Bulk" → "Bulk (copy)", shortened so it still fits the 80-character limit. */
export function copyName(name: string): string {
  const suffix = " (copy)";
  return `${name.slice(0, MAX_NAME - suffix.length).trimEnd()}${suffix}`;
}
