import { z } from "zod";

// Log dates are plain "YYYY-MM-DD" strings. All maths runs in UTC on those strings,
// so there are no DST or timezone shifts; only todayIso() looks at the local clock.

export const DateSchema = z.iso.date();

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

/** The browser's local calendar date. Not toISOString(), which is UTC and gives tomorrow late at night. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** Sunday to Saturday of the week containing `iso`. */
export function weekDays(iso: string): string[] {
  const sunday = addDays(iso, -toDate(iso).getUTCDay()); // Sunday = 0
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const longFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" });

/** "Wed 8 Oct" */
export function formatDay(iso: string): string {
  return dayFormat.format(toDate(iso)).replace(",", "");
}

/** "Wednesday, 8 October 2026" */
export function formatLongDate(iso: string): string {
  return longFormat.format(toDate(iso)).replace(/^(\w+) /, "$1, ");
}

/** "Wed" */
export function formatWeekday(iso: string): string {
  return weekdayFormat.format(toDate(iso));
}

/** Day of the month, e.g. 8. */
export function dayOfMonth(iso: string): number {
  return toDate(iso).getUTCDate();
}
