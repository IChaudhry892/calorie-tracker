import { describe, expect, it } from "vitest";
import { addDays, DateSchema, dayOfMonth, formatDay, formatLongDate, formatWeekday, todayIso, weekDays } from "./dates";

describe("todayIso", () => {
  it("uses the local date, even late at night", () => {
    expect(todayIso(new Date(2026, 9, 8, 23, 30))).toBe("2026-10-08");
    expect(todayIso(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles leap days", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });
});

describe("weekDays", () => {
  it("runs Monday to Sunday", () => {
    // 2026-10-08 is a Thursday.
    expect(weekDays("2026-10-08")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("puts a Sunday at the end of its week", () => {
    expect(weekDays("2026-10-11")[0]).toBe("2026-10-05");
  });

  it("starts on the day itself for a Monday", () => {
    expect(weekDays("2026-10-05")[0]).toBe("2026-10-05");
  });
});

describe("formatting", () => {
  it("formats short and long dates", () => {
    expect(formatDay("2026-10-08")).toBe("Thu 8 Oct");
    expect(formatLongDate("2026-10-08")).toBe("Thursday, 8 October 2026");
    expect(formatWeekday("2026-10-08")).toBe("Thu");
    expect(dayOfMonth("2026-10-08")).toBe(8);
  });
});

describe("DateSchema", () => {
  it("accepts real dates only", () => {
    expect(DateSchema.safeParse("2026-10-08").success).toBe(true);
    expect(DateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(DateSchema.safeParse("tomorrow").success).toBe(false);
  });
});
