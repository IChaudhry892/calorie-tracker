import { describe, expect, it } from "vitest";
import { ACTIVITY_LEVELS, bmr, goalCalories, GOALS, maintenanceCalories } from "./calories";

const man = { sex: "male", age: 25, heightCm: 180, weightKg: 80 } as const;
const woman = { sex: "female", age: 30, heightCm: 165, weightKg: 60 } as const;

describe("bmr", () => {
  it("uses Mifflin-St Jeor for men", () => {
    expect(bmr(man)).toBeCloseTo(1805);
  });

  it("uses Mifflin-St Jeor for women", () => {
    expect(bmr(woman)).toBeCloseTo(1320.25);
  });
});

describe("maintenanceCalories", () => {
  it("applies the activity multiplier", () => {
    expect(maintenanceCalories(man, "moderate")).toBeCloseTo(2644.325);
    expect(maintenanceCalories(woman, "sedentary")).toBeCloseTo(1584.3);
    expect(maintenanceCalories({ sex: "male", age: 40, heightCm: 175, weightKg: 90 }, "active")).toBeCloseTo(2788.0625);
  });

  it("equals BMR for the bmr activity level", () => {
    expect(maintenanceCalories(man, "bmr")).toBe(bmr(man));
  });

  it("increases with each activity level", () => {
    const values = ACTIVITY_LEVELS.map((a) => maintenanceCalories(man, a));
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});

describe("goalCalories", () => {
  it("offsets maintenance by each goal's delta", () => {
    const goals = goalCalories(2644.325);
    expect(goals).toHaveLength(GOALS.length);
    expect(goals.find((g) => g.key === "maintain")?.calories).toBeCloseTo(2644.325);
    expect(goals.find((g) => g.key === "loss")?.calories).toBeCloseTo(2144.325);
    expect(goals.find((g) => g.key === "fast_gain")?.calories).toBeCloseTo(3644.325);
  });
});
