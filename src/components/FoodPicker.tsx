"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AmountFields, oneServing, type Amount } from "@/components/AmountFields";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { QuantitySchema, type DietFood } from "@/lib/diets";
import { formatServing } from "@/lib/foods";
import { formatCalories } from "@/lib/macros";

export type FoodPick = { food: DietFood; quantity: number };

type FoodPickerProps = {
  foods: DietFood[];
  submitLabel: string;
  pendingLabel: string;
  /** Checkboxes instead of radios, with an amount for each picked food. */
  multiple?: boolean;
  /** Runs inside a transition; return an error to show it under the picker. Gets one pick unless `multiple`. */
  onSubmit: (picks: FoodPick[]) => Promise<{ error?: string }>;
  onDone: () => void;
};

/** Search + list of the user's foods, with servings or a quantity in each picked food's unit. */
export function FoodPicker({ foods, submitLabel, pendingLabel, multiple = false, onSubmit, onDone }: FoodPickerProps) {
  const [query, setQuery] = useState("");
  // In the order they were picked, so a new pick's amount goes at the bottom.
  const [picked, setPicked] = useState<{ id: string; amount: Amount }[]>([]);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (foods.length === 0) {
    return (
      <EmptyState
        title="Your food list is empty"
        text="Add foods on the Foods page, or use the Manual tab."
        action={
          <Link href="/foods" className="font-medium text-accent hover:text-accent-hover">
            Go to Foods
          </Link>
        }
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const visible = needle ? foods.filter((food) => food.name.toLowerCase().includes(needle)) : foods;
  const selected = picked.flatMap(({ id, amount }) => {
    const food = foods.find((f) => f.id === id);
    return food ? [{ food, amount }] : [];
  });

  function toggle(food: DietFood) {
    setError(undefined);
    const entry = { id: food.id, amount: oneServing(food.serving_size) };
    if (!multiple) return setPicked([entry]);
    setPicked((current) =>
      current.some((p) => p.id === food.id) ? current.filter((p) => p.id !== food.id) : [...current, entry],
    );
  }

  function setAmount(id: string, amount: Amount) {
    setPicked((current) => current.map((p) => (p.id === id ? { id, amount } : p)));
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (selected.length === 0) return setError(multiple ? "Pick at least one food." : "Pick a food.");
        const picks: FoodPick[] = [];
        for (const { food, amount } of selected) {
          const parsed = QuantitySchema.safeParse(amount.quantity);
          if (!parsed.success) {
            const message = parsed.error.issues[0].message;
            return setError(multiple ? `${food.name}: ${message}` : message);
          }
          picks.push({ food, quantity: parsed.data });
        }
        setError(undefined);
        startTransition(async () => {
          const result = await onSubmit(picks);
          if (result.error) setError(result.error);
          else onDone();
        });
      }}
    >
      <Input
        label="Search foods"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">{multiple ? "Foods" : "Food"}</legend>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-accent/20 p-1">
          {visible.length === 0 && <p className="px-3 py-2 text-sm text-foreground/70">No foods match.</p>}
          {visible.map((food) => (
            // `relative` keeps the sr-only (absolutely positioned) input inside its row. Without it,
            // the inputs of rows scrolled below this list escaped it, stretched the dialog, and
            // focusing one on click scrolled the whole dialog down to it.
            <label
              key={food.id}
              className="relative flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 has-checked:bg-accent/15 has-checked:text-accent has-focus-visible:ring-1 has-focus-visible:ring-inset has-focus-visible:ring-accent"
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name="food"
                value={food.id}
                checked={picked.some((p) => p.id === food.id)}
                onChange={() => toggle(food)}
                className="sr-only"
              />
              <span className="min-w-0 break-words">{food.name}</span>
              <span className="shrink-0 text-xs text-foreground/60">
                {formatCalories(food.calories)} kcal / {formatServing(food)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {selected.length === 0 ? (
        <Input
          label="Quantity"
          type="number"
          value=""
          disabled
          hint={multiple ? "Pick one or more foods first." : "Pick a food first."}
          readOnly
        />
      ) : multiple ? (
        <ul aria-label="Amounts" className="flex flex-col gap-3">
          {selected.map(({ food, amount }) => (
            <li key={food.id} className="flex flex-col gap-2 rounded-lg border border-accent/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 font-medium break-words text-heading">{food.name}</span>
                <Button variant="ghost" size="sm" className="-my-1.5 -mr-2" onClick={() => toggle(food)}>
                  Remove<span className="sr-only"> {food.name}</span>
                </Button>
              </div>
              <AmountFields
                unit={food.serving_unit}
                servingSize={food.serving_size}
                value={amount}
                onChange={(next) => setAmount(food.id, next)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <AmountFields
          unit={selected[0].food.serving_unit}
          servingSize={selected[0].food.serving_size}
          value={selected[0].amount}
          onChange={(next) => setAmount(selected[0].food.id, next)}
        />
      )}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
        {error}
      </p>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending ? pendingLabel : selected.length > 1 ? `${submitLabel} (${selected.length})` : submitLabel}
      </Button>
    </form>
  );
}
