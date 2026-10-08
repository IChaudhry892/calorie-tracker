import type { Food } from "@/lib/db";

export type Macros = { calories: number; protein_g: number };

/** One row of a diet or day: what MacroTable renders. */
export type MacroRow = Macros & {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  /** Optional small label after the name, e.g. "from Lean bulk". */
  tag?: string;
};

/** Macros for `quantity` of a food, in the food's own serving unit. Unrounded. */
export function scaleMacros(
  food: Pick<Food, "calories" | "protein_g" | "serving_size">,
  quantity: number,
): Macros {
  if (!(food.serving_size > 0)) throw new Error("serving_size must be greater than 0");
  const factor = quantity / food.serving_size;
  return { calories: food.calories * factor, protein_g: food.protein_g * factor };
}

/** Sums unrounded macros; round only when displaying. */
export function sumMacros(rows: Macros[]): Macros {
  return rows.reduce(
    (total, row) => ({ calories: total.calories + row.calories, protein_g: total.protein_g + row.protein_g }),
    { calories: 0, protein_g: 0 },
  );
}

/** Whole kcal for display. */
export function formatCalories(n: number): string {
  const rounded = Math.round(n);
  return (Object.is(rounded, -0) ? 0 : rounded).toString();
}

/** Protein to one decimal for display. */
export function formatProtein(n: number): string {
  const s = n.toFixed(1);
  return s === "-0.0" ? "0.0" : s;
}

/** Quantity without float noise or trailing zeros (2 → "2", 1.5 → "1.5", 0.1 + 0.2 → "0.3"). */
export function formatQuantity(n: number): string {
  return Number(n.toFixed(2)).toString();
}
