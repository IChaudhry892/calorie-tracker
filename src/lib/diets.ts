import { z } from "zod";
import type { Food } from "./db";
import { blankToUndefined } from "./foods";
import { scaleMacros, sumMacros, type MacroRow } from "./macros";

const MAX_NAME = 80; // Matches the diets.name check constraint.
export const MAX_QUANTITY = 10000;

export const DietNameSchema = z.string().trim().min(1, "Enter a name.").max(MAX_NAME, "Use 80 characters or fewer.");

export const QuantitySchema = z.preprocess(
  blankToUndefined,
  z.coerce
    .number({ error: "Enter a quantity." })
    .positive("Must be more than 0.")
    .max(MAX_QUANTITY, "Must be 10,000 or less."),
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

export type DietAdd = { foodId: string; quantity: number };
export type ExistingDietItem = { id: string; food_id: string; quantity: number };

/**
 * Adding a food that's already in the diet tops up its row instead of adding a second one:
 * 1 burger + 1 burger = one row of 2. Repeats within `adds` are combined too. If a diet
 * already has two rows of a food, the first (by position) is the one topped up.
 */
export function mergeDietAdds(
  existing: ExistingDietItem[],
  adds: DietAdd[],
): { updates: { id: string; quantity: number }[]; inserts: DietAdd[]; overLimit: string[] } {
  const combined = new Map<string, number>();
  for (const { foodId, quantity } of adds) combined.set(foodId, (combined.get(foodId) ?? 0) + quantity);

  const updates: { id: string; quantity: number }[] = [];
  const inserts: DietAdd[] = [];
  const overLimit: string[] = [];
  for (const [foodId, quantity] of combined) {
    const row = existing.find((item) => item.food_id === foodId);
    const total = (row?.quantity ?? 0) + quantity;
    if (total > MAX_QUANTITY) overLimit.push(foodId);
    else if (row) updates.push({ id: row.id, quantity: total });
    else inserts.push({ foodId, quantity });
  }
  return { updates, inserts, overLimit };
}
