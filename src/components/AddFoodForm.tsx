"use client";

import { useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { estimateFood } from "@/app/(app)/foods/actions";
import { FoodPicker } from "@/components/FoodPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DietFood } from "@/lib/diets";
import { formatServing, SERVING_UNITS, sourceFor, type AiValues, type ServingUnit } from "@/lib/foods";

const TABS = [
  { key: "food", label: "My foods" },
  { key: "manual", label: "Manual" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const unitOptions = SERVING_UNITS.map((unit) => ({ value: unit, label: unit }));

/** What the Manual tab submits. `saveToFoods` is always true when the form says `manualSavesFood`. */
export type ManualFoodInput = {
  name: string;
  quantity: string;
  unit: ServingUnit;
  calories: string;
  protein_g: string;
  source: "manual" | "ai";
  saveToFoods: boolean;
};

type Result = Promise<{ error?: string }>;

type AddFoodFormProps = {
  foods: DietFood[];
  submitLabel: string;
  /** Runs inside a transition; return an error to show it in the form. */
  onAddFood: (food: DietFood, quantity: number) => Result;
  onAddManual: (input: ManualFoodInput) => Result;
  /** Diets only hold foods from the list, so a manual diet row is always saved to it. */
  manualSavesFood?: boolean;
  onDone: () => void;
};

/** The Add dialog body for the Daily Log and diets: pick from My foods, or type one in (optionally AI-estimated). */
export function AddFoodForm({ foods, submitLabel, onAddFood, onAddManual, manualSavesFood = false, onDone }: AddFoodFormProps) {
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
              submitLabel={submitLabel}
              pendingLabel="Adding…"
              onSubmit={onAddFood}
              onDone={onDone}
            />
          )}
          {t.key === "manual" && (
            <ManualFoodForm
              submitLabel={submitLabel}
              savesFood={manualSavesFood}
              onSubmit={onAddManual}
              onDone={onDone}
            />
          )}
        </div>
      ))}
    </div>
  );
}

type ManualFoodFormProps = {
  submitLabel: string;
  savesFood: boolean;
  onSubmit: (input: ManualFoodInput) => Result;
  onDone: () => void;
};

/** Name + amount, with calories/protein typed in or filled by an AI estimate (like the Add food dialog). */
function ManualFoodForm({ submitLabel, savesFood, onSubmit, onDone }: ManualFoodFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<ServingUnit>("piece");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [saveToFoods, setSaveToFoods] = useState(savesFood);
  // "ai" while either number is still the estimate; replacing both makes it the user's own.
  const [aiValues, setAiValues] = useState<AiValues | null>(null);
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
      const values = { calories: Math.round(result.data.calories), protein_g: Number(result.data.protein_g.toFixed(1)) };
      setCalories(String(values.calories));
      setProtein(String(values.protein_g));
      setAiValues(values);
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
          const result = await onSubmit({
            name,
            quantity,
            unit,
            calories,
            protein_g: protein,
            source: sourceFor(aiValues, calories, protein),
            saveToFoods: savesFood || saveToFoods,
          });
          if (result.error) setError(result.error);
          else onDone();
        });
      }}
    >
      <Input
        label="Food name"
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
      {savesFood ? (
        <p className="text-sm text-foreground/70">
          It&apos;s also saved to your foods, with this amount as one serving.
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveToFoods}
            onChange={(e) => setSaveToFoods(e.target.checked)}
            className="size-4 accent-accent"
          />
          Also save to my foods
        </label>
      )}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
        {error}
      </p>
      <Button type="submit" disabled={saving || !calories} className="w-full sm:w-auto sm:self-end">
        {saving ? "Adding…" : submitLabel}
      </Button>
    </form>
  );
}
