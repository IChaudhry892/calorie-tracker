import { describe, expect, it } from "vitest";
import { dailyTotals, entriesFromDiet, entryFromFood, rescaleEntry, weekSummary } from "./log";
import { sumMacros } from "./macros";

const chicken = { id: "f1", name: "Chicken breast", serving_size: 100, serving_unit: "g", calories: 165, protein_g: 31 };
const banana = { id: "f2", name: "Banana", serving_size: 1, serving_unit: "piece", calories: 105, protein_g: 1.3 };

describe("entryFromFood", () => {
  it("snapshots the scaled food", () => {
    expect(entryFromFood(banana, 2, "2026-10-08")).toEqual({
      log_date: "2026-10-08",
      food_id: "f2",
      name: "Banana",
      quantity: 2,
      unit: "piece",
      calories: 210,
      protein_g: 2.6,
      source: "food",
    });
  });
});

describe("entriesFromDiet", () => {
  it("makes one diet-tagged entry per row", () => {
    const rows = entriesFromDiet(
      [
        { id: "i1", quantity: 250, foods: chicken },
        { id: "i2", quantity: 2, foods: banana },
      ],
      "2026-10-09",
      "d1",
    );
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.source === "diet" && row.diet_id === "d1" && row.log_date === "2026-10-09")).toBe(true);
    const total = sumMacros(rows);
    expect(total.calories).toBeCloseTo(622.5);
    expect(total.protein_g).toBeCloseTo(80.1);
  });
});

describe("rescaleEntry", () => {
  it("scales the snapshot", () => {
    expect(rescaleEntry({ quantity: 300, calories: 495, protein_g: 93 }, 150)).toEqual({ calories: 247.5, protein_g: 46.5 });
  });
});

const entries = [
  { log_date: "2026-10-06", calories: 500, protein_g: 30 },
  { log_date: "2026-10-06", calories: 250, protein_g: 10 },
  { log_date: "2026-10-08", calories: 1000, protein_g: 60 },
];

describe("dailyTotals", () => {
  it("totals each day and zero-fills empty days", () => {
    const totals = dailyTotals(entries, ["2026-10-06", "2026-10-07", "2026-10-08"]);
    expect(totals["2026-10-06"]).toEqual({ calories: 750, protein_g: 40 });
    expect(totals["2026-10-07"]).toEqual({ calories: 0, protein_g: 0 });
    expect(totals["2026-10-08"]).toEqual({ calories: 1000, protein_g: 60 });
  });
});

describe("weekSummary", () => {
  it("averages over logged days only", () => {
    expect(weekSummary(entries)).toEqual({
      total: { calories: 1750, protein_g: 100 },
      loggedDays: 2,
      average: { calories: 875, protein_g: 50 },
    });
  });

  it("has no average for an empty week", () => {
    expect(weekSummary([]).average).toBeNull();
  });
});
