"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Food } from "@/lib/db";
import { SERVING_UNITS } from "@/lib/foods";
import { saveFood, type FoodFormState } from "./actions";

export type FoodFormFood = Pick<Food, "id" | "name" | "serving_size" | "serving_unit" | "calories" | "protein_g">;

const unitOptions = SERVING_UNITS.map((unit) => ({ value: unit, label: unit }));

/** Add (no `food`) or edit form. The parent remounts it per open via `key`, so state starts fresh. */
export function FoodForm({ food, onDone }: { food?: FoodFormFood; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FoodFormState, formData: FormData) => {
    const result = await saveFood(prev, formData);
    if (result.ok) onDone();
    return result;
  }, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form
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
      <Input
        label="Name"
        name="name"
        defaultValue={food?.name}
        maxLength={80}
        autoComplete="off"
        autoFocus
        required
        error={errors.name}
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
        />
        <Select
          label="Unit"
          name="serving_unit"
          defaultValue={food?.serving_unit ?? "g"}
          options={unitOptions}
          error={errors.serving_unit}
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
          defaultValue={food?.calories}
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
          defaultValue={food?.protein_g}
          required
          error={errors.protein_g}
        />
      </div>
      {/* Phase 7: the "Estimate with AI" button goes here. */}

      <p aria-live="polite" role="status" className="min-h-5 text-sm text-red-300">
        {state.error}
      </p>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending ? "Saving…" : food ? "Save changes" : "Add food"}
      </Button>
    </form>
  );
}
