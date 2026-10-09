"use client";

import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Food } from "@/lib/db";
import { formatServing, SERVING_UNITS, sourceFor, type AiValues, type ServingUnit } from "@/lib/foods";
import { estimateFood, saveFood, type FoodFormState } from "./actions";

export type FoodFormFood = Pick<
  Food,
  "id" | "name" | "serving_size" | "serving_unit" | "calories" | "protein_g" | "source"
>;

const unitOptions = SERVING_UNITS.map((unit) => ({ value: unit, label: unit }));

/** Add (no `food`) or edit form. The parent remounts it per open via `key`, so state starts fresh. */
export function FoodForm({ food, onDone }: { food?: FoodFormFood; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FoodFormState, formData: FormData) => {
    const result = await saveFood(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const errors = state.fieldErrors ?? {};

  const formRef = useRef<HTMLFormElement>(null);
  const [hasName, setHasName] = useState(Boolean(food?.name));
  // Controlled so an AI estimate can fill them; the other fields stay uncontrolled.
  const [calories, setCalories] = useState(food?.calories.toString() ?? "");
  const [protein, setProtein] = useState(food?.protein_g.toString() ?? "");
  // The AI's numbers (the saved ones when editing an AI food). The tag stays while
  // either field still holds one, and goes once the user has replaced both.
  const [aiValues, setAiValues] = useState<AiValues | null>(
    food?.source === "ai" ? { calories: food.calories, protein_g: food.protein_g } : null,
  );
  const source = sourceFor(aiValues, calories, protein);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [estimating, startEstimate] = useTransition();

  function estimate() {
    const formData = new FormData(formRef.current!);
    const input = {
      name: String(formData.get("name") ?? ""),
      serving_size: String(formData.get("serving_size") ?? ""),
      serving_unit: String(formData.get("serving_unit") ?? ""),
    };
    startEstimate(async () => {
      const result = await estimateFood(input);
      if (!result.ok) {
        setNote({ text: result.error, error: true });
        return;
      }
      const estimate = { calories: Math.round(result.data.calories), protein_g: Number(result.data.protein_g.toFixed(1)) };
      setCalories(String(estimate.calories));
      setProtein(String(estimate.protein_g));
      setAiValues(estimate);
      const serving = formatServing({
        serving_size: Number(input.serving_size),
        serving_unit: input.serving_unit as ServingUnit,
      });
      setNote({ text: `AI estimate for ${serving}: ${result.data.assumption}. Check the values before saving.` });
    });
  }

  // The note describes the name and serving it was made for, so editing them makes it stale.
  const clearNote = () => setNote(null);

  return (
    <form
      ref={formRef}
      // Not `action={action}`: React resets a form after its action runs, which
      // would wipe what the user typed whenever validation fails.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      {food && <input type="hidden" name="id" value={food.id} />}
      <input type="hidden" name="source" value={source} />
      <Input
        label="Name"
        name="name"
        defaultValue={food?.name}
        maxLength={80}
        autoComplete="off"
        autoFocus
        required
        error={errors.name}
        onChange={(e) => {
          setHasName(e.target.value.trim() !== "");
          clearNote();
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Serving size"
          name="serving_size"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          defaultValue={food?.serving_size ?? 100}
          required
          error={errors.serving_size}
          onChange={clearNote}
        />
        <Select
          label="Unit"
          name="serving_unit"
          defaultValue={food?.serving_unit ?? "g"}
          options={unitOptions}
          error={errors.serving_unit}
          onChange={clearNote}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Calories (kcal)"
          name="calories"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          required
          error={errors.calories}
        />
        <Input
          label="Protein (g)"
          name="protein_g"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          required
          error={errors.protein_g}
        />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" size="sm" onClick={estimate} disabled={!hasName || estimating}>
          {estimating ? "Estimating…" : "Estimate with AI"}
        </Button>
        <p aria-live="polite" className={`text-sm ${note?.error ? "text-red-300" : "text-foreground/70"}`}>
          {note?.text}
        </p>
      </div>

      <p aria-live="polite" role="status" className="min-h-5 text-sm text-red-300">
        {state.error}
      </p>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending ? "Saving…" : food ? "Save changes" : "Add food"}
      </Button>
    </form>
  );
}
