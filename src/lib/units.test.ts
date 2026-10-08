import { describe, expect, it } from "vitest";
import { cmToFtIn, formatLb, ftInToCm, kgToLb, lbToKg } from "./units";

describe("height", () => {
  it("converts feet and inches to cm", () => {
    expect(ftInToCm(5, 11)).toBeCloseTo(180.34);
  });

  it("converts cm to whole feet and inches", () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, in: 11 });
  });

  it("carries 12 inches into the next foot", () => {
    expect(cmToFtIn(182.88)).toEqual({ ft: 6, in: 0 });
    expect(cmToFtIn(182.5)).toEqual({ ft: 6, in: 0 });
  });
});

describe("weight", () => {
  it("converts lb to kg", () => {
    expect(lbToKg(176)).toBeCloseTo(79.83, 2);
  });

  it("round-trips kg → lb → kg", () => {
    for (const kg of [45, 63.5, 80, 123.4]) {
      expect(Math.abs(lbToKg(Number(formatLb(kgToLb(kg)))) - kg)).toBeLessThan(0.05);
    }
  });

  it("formats lb to one decimal", () => {
    expect(formatLb(kgToLb(80))).toBe("176.4");
    expect(formatLb(176)).toBe("176");
  });
});
