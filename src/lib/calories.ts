// Mifflin-St Jeor BMR, activity multipliers and goal offsets, matching
// calculator.net's calorie calculator. Pure: values are unrounded.

export const SEXES = ["male", "female"] as const;
export type Sex = (typeof SEXES)[number];

export const ACTIVITY_LEVELS = ["bmr", "sedentary", "light", "moderate", "active", "very_active", "extra_active"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY: Record<ActivityLevel, { label: string; description: string; multiplier: number }> = {
  bmr: { label: "Basal Metabolic Rate (BMR)", description: "no activity", multiplier: 1.0 },
  sedentary: { label: "Sedentary", description: "little or no exercise", multiplier: 1.2 },
  light: { label: "Light", description: "exercise 1–3 times/week", multiplier: 1.375 },
  moderate: { label: "Moderate", description: "exercise 4–5 times/week", multiplier: 1.465 },
  active: { label: "Active", description: "daily exercise or intense exercise 3–4 times/week", multiplier: 1.55 },
  very_active: { label: "Very Active", description: "intense exercise 6–7 times/week", multiplier: 1.725 },
  extra_active: { label: "Extra Active", description: "very intense exercise daily, or physical job", multiplier: 1.9 },
};

export type BodyInput = { sex: Sex; age: number; heightCm: number; weightKg: number };

/** Mifflin-St Jeor basal metabolic rate in kcal/day. */
export function bmr({ sex, age, heightCm, weightKg }: BodyInput): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

/** Calories to maintain the current weight at the given activity level. */
export function maintenanceCalories(input: BodyInput, activity: ActivityLevel): number {
  return bmr(input) * ACTIVITY[activity].multiplier;
}

// Matches the `profiles.goal` check constraint.
export const GOAL_KEYS = ["maintain", "mild_loss", "loss", "extreme_loss", "mild_gain", "gain", "fast_gain"] as const;
export type GoalKey = (typeof GOAL_KEYS)[number];

/** `rateKg` / `rateLb` are the weekly weight change shown next to each goal. */
export type Goal = { key: GoalKey; label: string; rateKg: number; rateLb: number; delta: number };

export const GOALS: readonly Goal[] = [
  { key: "maintain", label: "Maintain weight", rateKg: 0, rateLb: 0, delta: 0 },
  { key: "mild_loss", label: "Mild weight loss", rateKg: 0.25, rateLb: 0.5, delta: -250 },
  { key: "loss", label: "Weight loss", rateKg: 0.5, rateLb: 1, delta: -500 },
  { key: "extreme_loss", label: "Extreme weight loss", rateKg: 1, rateLb: 2, delta: -1000 },
  { key: "mild_gain", label: "Mild weight gain", rateKg: 0.25, rateLb: 0.5, delta: 250 },
  { key: "gain", label: "Weight gain", rateKg: 0.5, rateLb: 1, delta: 500 },
  { key: "fast_gain", label: "Fast weight gain", rateKg: 1, rateLb: 2, delta: 1000 },
];

export function goalCalories(maintenance: number) {
  return GOALS.map((g) => ({ ...g, calories: maintenance + g.delta }));
}

/** The saved goal (a plain text column), falling back to "maintain" for anything unknown. */
export function goalFor(key: string | null | undefined): Goal {
  return GOALS.find((g) => g.key === key) ?? GOALS[0];
}

export type DailyTarget = { calories: number; maintenance: number; goal: Goal };

/** Daily calorie target for a saved maintenance + goal, or null before the calculator is saved. */
export function dailyTarget(maintenance: number | null, goal: string | null | undefined): DailyTarget | null {
  if (maintenance == null) return null;
  const g = goalFor(goal);
  return { calories: maintenance + g.delta, maintenance, goal: g };
}

/** Below these daily intakes calculator.net warns that a diet is unsafe. */
export const MIN_SAFE_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

/** "a" or "an" for a whole number read aloud: an 8, an 11, an 18, an 800, an 11000, but a 1100 or a 402. */
function article(n: number): "a" | "an" {
  const digits = String(Math.abs(Math.round(n)));
  // The leading group of up to 3 digits is what's spoken first ("eleven thousand", "eight hundred").
  const lead = digits.slice(0, digits.length % 3 || 3);
  return lead.startsWith("8") || lead === "11" || lead === "18" ? "an" : "a";
}

/** "a 402 kcal surplus", "an 800 kcal deficit", or null at exactly 0. */
export function describeBalance(kcal: number): string | null {
  const rounded = Math.round(kcal);
  if (rounded === 0) return null;
  const amount = Math.abs(rounded);
  return `${article(amount)} ${amount} kcal ${rounded > 0 ? "surplus" : "deficit"}`;
}
