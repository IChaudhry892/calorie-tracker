import { describe, expect, it } from "vitest";
import { ACTIVITY_LEVELS, bmr, dailyTarget, describeBalance, GOAL_KEYS, goalCalories, GOALS, maintenanceCalories } from "./calories";

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

describe("dailyTarget", () => {
  it("is null until maintenance is saved", () => {
    expect(dailyTarget(null, "loss")).toBeNull();
  });

  it("offsets maintenance by the saved goal", () => {
    expect(dailyTarget(2500, "loss")?.calories).toBe(2000);
    expect(dailyTarget(2500, "fast_gain")?.calories).toBe(3500);
    expect(dailyTarget(2500, "loss")?.goal.label).toBe("Weight loss");
  });

  it("treats an unknown or missing goal as maintain", () => {
    expect(dailyTarget(2500, "nope")?.goal.key).toBe("maintain");
    expect(dailyTarget(2500, null)?.calories).toBe(2500);
  });

  it("lists every goal in GOAL_KEYS (the DB check constraint)", () => {
    expect(GOALS.map((g) => g.key)).toEqual([...GOAL_KEYS]);
  });
});

describe("describeBalance", () => {
  it("names a surplus or deficit with the amount", () => {
    expect(describeBalance(402)).toBe("a 402 kcal surplus");
    expect(describeBalance(-250.4)).toBe("a 250 kcal deficit");
  });

  it("uses 'an' where the number is read with a vowel sound", () => {
    expect(describeBalance(8)).toBe("an 8 kcal surplus");
    expect(describeBalance(11)).toBe("an 11 kcal surplus");
    expect(describeBalance(-18)).toBe("an 18 kcal deficit");
    expect(describeBalance(800)).toBe("an 800 kcal surplus");
    expect(describeBalance(11000)).toBe("an 11000 kcal surplus");
    expect(describeBalance(1100)).toBe("a 1100 kcal surplus");
    expect(describeBalance(1800)).toBe("a 1800 kcal surplus");
  });

  it("is null at exactly maintenance", () => {
    expect(describeBalance(0.4)).toBeNull();
  });
});
