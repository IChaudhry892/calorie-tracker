"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { MacroTable } from "@/components/MacroTable";
import { QuantityForm } from "@/components/QuantityForm";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { fieldClasses } from "@/components/ui/Input";
import { addDays, dayOfMonth, formatDay, formatLongDate, formatWeekday, todayIso } from "@/lib/dates";
import type { DietFood } from "@/lib/diets";
import { dailyTotals, rescaleEntry, weekSummary, type LogRow } from "@/lib/log";
import { formatCalories, sumMacros, type MacroRow } from "@/lib/macros";
import { deleteLogEntry, updateLogEntryQuantity } from "./actions";
import { AddEntryForm } from "./AddEntryForm";
import { ApplyDietForm, type DietOption } from "./ApplyDietForm";

type DailyLogProps = {
  date: string;
  week: string[];
  /** Every entry in `week`; the selected day's rows are filtered from these. */
  entries: LogRow[];
  foods: DietFood[];
  diets: DietOption[];
  maintenance: number | null;
};

type OptimisticChange = { type: "quantity"; id: string; quantity: number } | { type: "remove"; id: string };

function applyChange(entries: LogRow[], change: OptimisticChange): LogRow[] {
  if (change.type === "remove") return entries.filter((entry) => entry.id !== change.id);
  return entries.map((entry) =>
    entry.id === change.id ? { ...entry, quantity: change.quantity, ...rescaleEntry(entry, change.quantity) } : entry,
  );
}

// "Today" only exists in the browser; on the server (and during hydration) it's null.
const subscribeNever = () => () => {};
const useToday = () => useSyncExternalStore(subscribeNever, () => todayIso(), () => null);

export function DailyLog({ date, week, entries, foods, diets, maintenance }: DailyLogProps) {
  const router = useRouter();
  const today = useToday();

  // Quantity edits and deletes show instantly, in the table and the week strip.
  const [optimisticEntries, applyOptimistic] = useOptimistic(entries, applyChange);
  const [rowError, setRowError] = useState<string>();
  const [, startRowChange] = useTransition();

  const [editing, setEditing] = useState<LogRow | null>(null);
  const [dialog, setDialog] = useState<"add" | "apply" | null>(null);
  const [dialogCount, setDialogCount] = useState(0);

  const dayEntries = optimisticEntries.filter((entry) => entry.log_date === date);
  const rows: MacroRow[] = dayEntries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    quantity: entry.quantity,
    unit: entry.unit,
    calories: entry.calories,
    protein_g: entry.protein_g,
    tag: entry.diets ? `from ${entry.diets.name}` : undefined,
  }));
  const total = sumMacros(rows);
  const totals = dailyTotals(optimisticEntries, week);
  const summary = weekSummary(optimisticEntries);
  const hasDiets = diets.some((diet) => diet.itemCount > 0);

  function changeRow(change: OptimisticChange, run: () => Promise<{ error?: string }>) {
    setRowError(undefined);
    startRowChange(async () => {
      applyOptimistic(change);
      const result = await run();
      if (result.error) setRowError(result.error);
    });
  }

  function openDialog(kind: "add" | "apply") {
    setDialogCount((n) => n + 1);
    setDialog(kind);
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => openDialog("add")}>Add entry</Button>
      <Button variant="secondary" onClick={() => openDialog("apply")} disabled={!hasDiets}>
        Apply diet
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-heading md:text-3xl">{formatLongDate(date)}</h1>
        <nav aria-label="Change day" className="flex items-center gap-2">
          <Link
            href={`/log?date=${addDays(date, -1)}`}
            aria-label="Previous day"
            className="rounded-lg border border-accent/40 px-3 py-2 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            ◀
          </Link>
          <input
            type="date"
            aria-label="Pick a day"
            value={date}
            onChange={(e) => e.target.value && router.push(`/log?date=${e.target.value}`)}
            // fieldClasses sets w-full; let the input shrink to share the row with the arrows.
            className={`${fieldClasses} min-w-0 flex-1 sm:w-auto sm:flex-none`}
          />
          <Link
            href={`/log?date=${addDays(date, 1)}`}
            aria-label="Next day"
            className="rounded-lg border border-accent/40 px-3 py-2 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            ▶
          </Link>
          {today && today !== date && (
            <Link href={`/log?date=${today}`} className="px-2 py-2 text-sm text-accent hover:text-accent-hover">
              Today
            </Link>
          )}
        </nav>
      </header>

      <section aria-label="This week" className="flex flex-col gap-2">
        <ol className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const kcal = totals[day].calories;
            const selected = day === date;
            return (
              <li key={day}>
                <Link
                  href={`/log?date=${day}`}
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${formatDay(day)}: ${formatCalories(kcal)} kcal`}
                  className={`flex flex-col items-center rounded-lg border-2 px-0.5 py-2 text-center transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent ${
                    selected ? "border-accent bg-surface" : "border-transparent bg-surface/60"
                  } ${kcal === 0 && !selected ? "text-foreground/50" : ""}`}
                >
                  <span className="text-xs">{formatWeekday(day)}</span>
                  <span className="font-semibold">{dayOfMonth(day)}</span>
                  <span className="text-[0.7rem] tabular-nums sm:text-xs">{kcal ? formatCalories(kcal) : "–"}</span>
                  {day === today && <span className="sr-only">(today)</span>}
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-foreground/70">
          Week: {formatCalories(summary.total.calories)} kcal
          {summary.average &&
            ` · avg ${formatCalories(summary.average.calories)} kcal over ${summary.loggedDays} logged ${
              summary.loggedDays === 1 ? "day" : "days"
            }`}
        </p>
      </section>

      {rows.length > 0 && actions}

      <div className="flex flex-col gap-3">
        <p role="status" aria-live="polite" className="text-sm text-red-300 empty:hidden">
          {rowError}
        </p>
        <MacroTable
          rows={rows}
          caption={`Entries for ${formatDay(date)}`}
          emptyState={
            <EmptyState
              title={`Nothing logged on ${formatDay(date)}`}
              text={hasDiets ? "Add what you ate, or apply one of your diets." : "Add what you ate to see your totals."}
              action={actions}
            />
          }
          renderActions={(row) => {
            const entry = dayEntries.find((e) => e.id === row.id)!;
            return (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(entry)} aria-label={`Edit ${row.name}`}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => changeRow({ type: "remove", id: row.id }, () => deleteLogEntry(row.id))}
                >
                  Delete
                </Button>
              </div>
            );
          }}
        />
        <Progress total={total.calories} maintenance={maintenance} />
      </div>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? "entry"}`}>
        {editing && (
          <QuantityForm
            key={editing.id}
            unit={editing.unit}
            initial={editing.quantity}
            onSubmit={(quantity) => {
              setEditing(null);
              changeRow({ type: "quantity", id: editing.id, quantity }, () =>
                updateLogEntryQuantity(editing.id, String(quantity)),
              );
            }}
          />
        )}
      </Dialog>

      <Dialog open={dialog === "add"} onClose={() => setDialog(null)} title={`Add to ${formatDay(date)}`}>
        {dialog === "add" && <AddEntryForm key={dialogCount} date={date} foods={foods} onDone={() => setDialog(null)} />}
      </Dialog>

      <Dialog open={dialog === "apply"} onClose={() => setDialog(null)} title={`Apply a diet to ${formatDay(date)}`}>
        {dialog === "apply" && (
          <ApplyDietForm key={dialogCount} diets={diets} date={date} onApplied={() => setDialog(null)} />
        )}
      </Dialog>
    </div>
  );
}

function Progress({ total, maintenance }: { total: number; maintenance: number | null }) {
  if (maintenance == null) {
    return (
      <p className="text-sm text-foreground/70">
        <Link href="/calculator" className="text-accent hover:text-accent-hover">
          Set your maintenance calories
        </Link>{" "}
        to track the day against them.
      </p>
    );
  }
  const rounded = Math.round(total);
  const over = rounded > maintenance;
  const percent = Math.min(rounded / maintenance, 1) * 100;
  const remaining = Math.abs(maintenance - rounded);

  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label="Calories vs maintenance"
        aria-valuemin={0}
        aria-valuemax={maintenance}
        aria-valuenow={rounded}
        className="h-3 overflow-hidden rounded-full bg-surface"
      >
        <div
          // Same light-to-dark blue as the bar under the login heading; solid red once over.
          className={`h-full rounded-full transition-[width] ${
            over ? "bg-red-300" : "bg-linear-to-r from-accent to-accent-secondary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p aria-live="polite" className="text-sm tabular-nums">
        {formatCalories(total)} / {maintenance} kcal ·{" "}
        <span className={over ? "text-red-300" : "text-foreground/70"}>
          {formatCalories(remaining)} {over ? "over" : "left"}
        </span>
      </p>
    </div>
  );
}
