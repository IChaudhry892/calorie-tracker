import { describe, expect, it } from "vitest";
import { copyName, dietRows, dietTotals, mergeDietAdds, QuantitySchema, type DietItemWithFood } from "./diets";

const chicken = { id: "f1", name: "Chicken breast", serving_size: 100, serving_unit: "g", calories: 165, protein_g: 31 };
const banana = { id: "f2", name: "Banana", serving_size: 1, serving_unit: "piece", calories: 105, protein_g: 1.3 };
const items: DietItemWithFood[] = [
  { id: "i1", quantity: 250, foods: chicken },
  { id: "i2", quantity: 2, foods: banana },
];

describe("dietRows", () => {
  it("scales each food by its quantity", () => {
    const [c, b] = dietRows(items);
    expect(c).toMatchObject({ id: "i1", name: "Chicken breast", quantity: 250, unit: "g" });
    expect(c.calories).toBeCloseTo(412.5);
    expect(c.protein_g).toBeCloseTo(77.5);
    expect(b.calories).toBeCloseTo(210);
    expect(b.protein_g).toBeCloseTo(2.6);
  });
});

describe("dietTotals", () => {
  it("sums the scaled rows", () => {
    const total = dietTotals(items);
    expect(total.calories).toBeCloseTo(622.5);
    expect(total.protein_g).toBeCloseTo(80.1);
  });

  it("is zero for an empty diet", () => {
    expect(dietTotals([])).toEqual({ calories: 0, protein_g: 0 });
  });
});

describe("copyName", () => {
  it("appends (copy)", () => {
    expect(copyName("Bulk")).toBe("Bulk (copy)");
  });

  it("stays within 80 characters", () => {
    const copy = copyName("x".repeat(80));
    expect(copy.length).toBeLessThanOrEqual(80);
    expect(copy.endsWith(" (copy)")).toBe(true);
  });
});

describe("QuantitySchema", () => {
  it("rejects blank, zero and negative quantities", () => {
    for (const value of ["", "0", "-1"]) expect(QuantitySchema.safeParse(value).success).toBe(false);
  });

  it("accepts decimals", () => {
    expect(QuantitySchema.parse("1.5")).toBe(1.5);
  });
});

describe("mergeDietAdds", () => {
  const existing = [
    { id: "i1", food_id: "burger", quantity: 1 },
    { id: "i2", food_id: "rice", quantity: 200 },
    { id: "i3", food_id: "burger", quantity: 3 },
  ];

  it("tops up the first existing row instead of adding a second", () => {
    expect(mergeDietAdds(existing, [{ foodId: "burger", quantity: 1 }])).toEqual({
      updates: [{ id: "i1", quantity: 2 }],
      inserts: [],
      overLimit: [],
    });
  });

  it("inserts new foods and combines repeats within one add", () => {
    const result = mergeDietAdds(existing, [
      { foodId: "egg", quantity: 1 },
      { foodId: "rice", quantity: 50 },
      { foodId: "egg", quantity: 2 },
    ]);
    expect(result.inserts).toEqual([{ foodId: "egg", quantity: 3 }]);
    expect(result.updates).toEqual([{ id: "i2", quantity: 250 }]);
  });

  it("flags foods whose combined quantity would pass 10,000", () => {
    const result = mergeDietAdds(existing, [{ foodId: "rice", quantity: 9900 }]);
    expect(result.overLimit).toEqual(["rice"]);
    expect(result.updates).toEqual([]);
  });
});
