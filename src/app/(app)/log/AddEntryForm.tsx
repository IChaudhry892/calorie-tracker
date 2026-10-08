"use client";

import { useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { FoodPicker } from "@/components/FoodPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DietFood } from "@/lib/diets";
import { formatServing, SERVING_UNITS, type ServingUnit } from "@/lib/foods";
import { estimateFood } from "../foods/actions";
import { addLogEntry } from "./actions";

const TABS = [
  { key: "food", label: "My foods" },
  { key: "manual", label: "Manual" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const unitOptions = SERVING_UNITS.map((unit) => ({ value: unit, label: unit }));

/** The Add entry dialog body: three ways to log something on `date`. */
export function AddEntryForm({ date, foods, onDone }: { date: string; foods: DietFood[]; onDone: () => void }) {
  const [tab, setTab] = useState<TabKey>(foods.length > 0 ? "food" : "manual");
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ food: null, manual: null });
  const baseId = useId();

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  function onTabKeyDown(event: KeyboardEvent) {
    const index = TABS.findIndex((t) => t.key === tab);
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length].key;
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="How to add" className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1" onKeyDown={onTabKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[t.key] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`${baseId}-panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            onClick={() => setTab(t.key)}
            className="rounded-md px-2 py-2 text-sm font-medium text-foreground/70 transition hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent aria-selected:bg-surface aria-selected:text-accent"
          >
            {t.label}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${baseId}-panel-${t.key}`}
          aria-labelledby={`${baseId}-tab-${t.key}`}
          hidden={tab !== t.key}
        >
          {t.key === "food" && (
            <FoodPicker
              foods={foods}
              submitLabel="Add to day"
              pendingLabel="Adding…"
              onSubmit={(food, quantity) => addLogEntry({ kind: "food", date, foodId: food.id, quantity })}
              onDone={onDone}
            />
          )}
          {t.key === "manual" && <ManualEntryForm date={date} onDone={onDone} />}
        </div>
      ))}
    </div>
  );
}

/** Name + amount, with calories/protein typed in or filled by an AI estimate (like the Add food dialog). */
function ManualEntryForm({ date, onDone }: { date: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<ServingUnit>("piece");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [saveToFoods, setSaveToFoods] = useState(false);
  // "ai" once an estimate is applied, even if the numbers are then tweaked.
  const [source, setSource] = useState<"manual" | "ai">("manual");
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [error, setError] = useState<string>();
  const [estimating, startEstimate] = useTransition();
  const [saving, startSave] = useTransition();

  const clearNote = () => setNote(null);

  function estimate() {
    setError(undefined);
    startEstimate(async () => {
      const result = await estimateFood({ name, serving_size: quantity, serving_unit: unit });
      if (!result.ok) return setNote({ text: result.error, error: true });
      setCalories(String(Math.round(result.data.calories)));
      setProtein(String(Number(result.data.protein_g.toFixed(1))));
      setSource("ai");
      const amount = formatServing({ serving_size: Number(quantity), serving_unit: unit });
      setNote({ text: `AI estimate for ${amount}: ${result.data.assumption}. Check the values before adding.` });
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(undefined);
        startSave(async () => {
          const result = await addLogEntry({
            kind: "custom",
            date,
            name,
            quantity,
            unit,
            calories,
            protein_g: protein,
            source,
            saveToFoods,
          });
          if (result.error) setError(result.error);
          else onDone();
        });
      }}
    >
      <Input
        label="What did you eat?"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          clearNote();
        }}
        maxLength={80}
        autoComplete="off"
        placeholder="e.g. apple"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Quantity"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            clearNote();
          }}
        />
        <Select
          label="Unit"
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value as ServingUnit);
            clearNote();
          }}
          options={unitOptions}
        />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" size="sm" onClick={estimate} disabled={!name.trim() || estimating}>
          {estimating ? "Estimating…" : "Estimate with AI"}
        </Button>
        <p aria-live="polite" className={`text-sm ${note?.error ? "text-red-300" : "text-foreground/70"}`}>
          {note?.text}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Calories (kcal)"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <Input
          label="Protein (g)"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saveToFoods}
          onChange={(e) => setSaveToFoods(e.target.checked)}
          className="size-4 accent-accent"
        />
        Also save to my foods
      </label>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
        {error}
      </p>
      <Button type="submit" disabled={saving || !calories} className="w-full sm:w-auto sm:self-end">
        {saving ? "Adding…" : "Add to day"}
      </Button>
    </form>
  );
}
