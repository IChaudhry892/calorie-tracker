import { describe, expect, it } from "vitest";
import { formatCalories, formatProtein, formatQuantity, scaleMacros, sumMacros } from "./macros";

const chicken = { serving_size: 100, calories: 165, protein_g: 31 };
const banana = { serving_size: 1, calories: 105, protein_g: 1.3 };

describe("scaleMacros", () => {
  it("scales a gram-based food", () => {
    const m = scaleMacros(chicken, 250);
    expect(m.calories).toBeCloseTo(412.5);
    expect(m.protein_g).toBeCloseTo(77.5);
  });

  it("scales a piece-based food", () => {
    const m = scaleMacros(banana, 2);
    expect(m.calories).toBeCloseTo(210);
    expect(m.protein_g).toBeCloseTo(2.6);
  });

  it("returns the food's own values for one serving", () => {
    expect(scaleMacros(chicken, 100)).toEqual({ calories: 165, protein_g: 31 });
  });

  it("throws when serving_size is not positive", () => {
    expect(() => scaleMacros({ ...chicken, serving_size: 0 }, 1)).toThrow();
  });
});

describe("sumMacros", () => {
  it("returns zeros for no rows", () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein_g: 0 });
  });

  it("sums unrounded values and rounds only for display", () => {
    const row = { calories: 33.33, protein_g: 0.25 };
    const total = sumMacros([row, row, row]);
    expect(total.calories).toBeCloseTo(99.99);
    expect(formatCalories(total.calories)).toBe("100");
    expect(formatProtein(total.protein_g)).toBe("0.8");
  });
});

describe("formatting", () => {
  it("formats calories as whole numbers", () => {
    expect(formatCalories(412.5)).toBe("413");
    expect(formatCalories(-0.2)).toBe("0");
  });

  it("formats protein to one decimal", () => {
    expect(formatProtein(1.25)).toBe("1.3");
    expect(formatProtein(0)).toBe("0.0");
    expect(formatProtein(-0.01)).toBe("0.0");
  });

  it("formats quantities without float noise", () => {
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(1.5)).toBe("1.5");
    expect(formatQuantity(0.1 + 0.2)).toBe("0.3");
  });
});
