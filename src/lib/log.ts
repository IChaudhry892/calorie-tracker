import type { TablesInsert } from "./database.types";
import type { LogEntry } from "./db";
import type { DietFood, DietItemWithFood } from "./diets";
import { scaleMacros, sumMacros, type Macros } from "./macros";

// Log entries are snapshots: name, amount and macros are copied in when logged,
// so later edits to a food or diet never rewrite a past day.

export type LogRow = Pick<
  LogEntry,
  "id" | "log_date" | "name" | "quantity" | "unit" | "calories" | "protein_g" | "source" | "diet_id"
> & {
  diets: { name: string } | null;
  /** The food it was logged from, while it still exists: only used to offer servings when editing. */
  foods: Pick<DietFood, "serving_size" | "serving_unit"> | null;
};

export type LogInsert = TablesInsert<"log_entries">;

export function entryFromFood(food: DietFood, quantity: number, date: string): LogInsert {
  return {
    log_date: date,
    food_id: food.id,
    name: food.name,
    quantity,
    unit: food.serving_unit,
    ...scaleMacros(food, quantity),
    source: "food",
  };
}

/** One entry per diet row, all tagged with the diet, for a single bulk insert. */
export function entriesFromDiet(items: DietItemWithFood[], date: string, dietId: string): LogInsert[] {
  return items.map(({ foods, quantity }) => ({
    ...entryFromFood(foods, quantity, date),
    source: "diet",
    diet_id: dietId,
  }));
}

/** New macros for a changed quantity, scaled from the snapshot rather than the (possibly edited) food. */
export function rescaleEntry(entry: Pick<LogEntry, "quantity" | "calories" | "protein_g">, quantity: number): Macros {
  const factor = quantity / entry.quantity;
  return { calories: entry.calories * factor, protein_g: entry.protein_g * factor };
}

/** Totals per day for `days`, with zeros for days that have no entries. */
export function dailyTotals(entries: Pick<LogRow, "log_date" | "calories" | "protein_g">[], days: string[]) {
  return Object.fromEntries(
    days.map((day) => [day, sumMacros(entries.filter((entry) => entry.log_date === day))]),
  ) as Record<string, Macros>;
}

/** Week total, and the average over days that have at least one entry. */
export function weekSummary(entries: Pick<LogRow, "log_date" | "calories" | "protein_g">[]) {
  const total = sumMacros(entries);
  const loggedDays = new Set(entries.map((entry) => entry.log_date)).size;
  return {
    total,
    loggedDays,
    average: loggedDays ? { calories: total.calories / loggedDays, protein_g: total.protein_g / loggedDays } : null,
  };
}
