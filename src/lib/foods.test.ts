import { describe, expect, it } from "vitest";
import { FoodSchema, formatServing, sourceFor } from "./foods";

describe("formatServing", () => {
  it("formats weight units without a plural", () => {
    expect(formatServing({ serving_size: 100, serving_unit: "g" })).toBe("100 g");
  });

  it("pluralises count units above 1", () => {
    expect(formatServing({ serving_size: 1, serving_unit: "piece" })).toBe("1 piece");
    expect(formatServing({ serving_size: 2, serving_unit: "slice" })).toBe("2 slices");
    expect(formatServing({ serving_size: 0.5, serving_unit: "cup" })).toBe("0.5 cup");
  });
});

describe("FoodSchema", () => {
  // Form values arrive as strings.
  const valid = { name: " Chicken breast ", serving_size: "100", serving_unit: "g", calories: "165", protein_g: "31" };
  const errorFor = (input: object) => {
    const result = FoodSchema.safeParse({ ...valid, ...input });
    return result.success ? null : result.error.issues.map((i) => i.path[0]);
  };

  it("accepts and coerces a valid food", () => {
    expect(FoodSchema.parse(valid)).toEqual({
      name: "Chicken breast",
      serving_size: 100,
      serving_unit: "g",
      calories: 165,
      protein_g: 31,
      source: "manual",
    });
  });

  it("keeps an AI source", () => {
    expect(FoodSchema.parse({ ...valid, source: "ai" }).source).toBe("ai");
    expect(errorFor({ source: "robot" })).toEqual(["source"]);
  });

  it("rejects an empty name", () => {
    expect(errorFor({ name: "   " })).toEqual(["name"]);
  });

  it("rejects a zero serving size", () => {
    expect(errorFor({ serving_size: "0" })).toEqual(["serving_size"]);
  });

  it("rejects blank numbers instead of treating them as 0", () => {
    expect(errorFor({ calories: "" })).toEqual(["calories"]);
  });

  it("rejects negative calories", () => {
    expect(errorFor({ calories: "-1" })).toEqual(["calories"]);
  });

  it("rejects an unknown unit", () => {
    expect(errorFor({ serving_unit: "bowl" })).toEqual(["serving_unit"]);
  });

  it("rejects more protein than the calories allow", () => {
    expect(errorFor({ calories: "50", protein_g: "100" })).toEqual(["protein_g"]);
    expect(errorFor({ calories: "100", protein_g: "26" })).toBeNull(); // 104 kcal is within the 5 kcal slack
  });
});

describe("sourceFor", () => {
  const ai = { calories: 105, protein_g: 1.3 };

  it("is manual without an estimate", () => {
    expect(sourceFor(null, "105", "1.3")).toBe("manual");
  });

  it("stays ai while either value is the estimate", () => {
    expect(sourceFor(ai, "105", "1.3")).toBe("ai");
    expect(sourceFor(ai, "110", "1.3")).toBe("ai");
    expect(sourceFor(ai, "105.0", "2")).toBe("ai");
  });

  it("becomes manual once both values are replaced", () => {
    expect(sourceFor(ai, "110", "2")).toBe("manual");
  });

  it("doesn't count cleared fields as the estimate", () => {
    expect(sourceFor(ai, "", "")).toBe("manual");
    expect(sourceFor({ calories: 0, protein_g: 0 }, " ", "")).toBe("manual");
  });
});
