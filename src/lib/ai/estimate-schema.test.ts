import { describe, expect, it } from "vitest";
import { parseEstimate } from "./estimate-schema";

describe("parseEstimate", () => {
  it("accepts valid JSON", () => {
    expect(parseEstimate('{"calories":105,"protein_g":1.3,"assumption":"medium banana, raw"}')).toEqual({
      ok: true,
      data: { calories: 105, protein_g: 1.3, assumption: "medium banana, raw" },
    });
  });

  it("fails on empty text", () => {
    expect(parseEstimate(undefined).ok).toBe(false);
    expect(parseEstimate("").ok).toBe(false);
  });

  it("fails on invalid JSON", () => {
    expect(parseEstimate("not json").ok).toBe(false);
  });

  it("fails on values outside the schema", () => {
    expect(parseEstimate('{"calories":-5,"protein_g":1,"assumption":"x"}').ok).toBe(false);
    expect(parseEstimate('{"calories":100,"protein_g":1}').ok).toBe(false);
  });

  it("fails when protein supplies more calories than the total", () => {
    expect(parseEstimate('{"calories":50,"protein_g":100,"assumption":"x"}').ok).toBe(false);
  });

  it("fails when the model says the input isn't a food", () => {
    const result = parseEstimate('{"calories":0,"protein_g":0,"assumption":"not a food"}');
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("doesn't look like a food") });
  });
});
