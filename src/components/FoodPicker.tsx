"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { QuantitySchema, type DietFood } from "@/lib/diets";
import { formatServing } from "@/lib/foods";
import { formatCalories, formatQuantity } from "@/lib/macros";

type FoodPickerProps = {
  foods: DietFood[];
  submitLabel: string;
  pendingLabel: string;
  /** Runs inside a transition; return an error to show it under the picker. */
  onSubmit: (food: DietFood, quantity: number) => Promise<{ error?: string }>;
  onDone: () => void;
};

/** Search + radio list of the user's foods, with a quantity in the picked food's unit. */
export function FoodPicker({ foods, submitLabel, pendingLabel, onSubmit, onDone }: FoodPickerProps) {
  const [query, setQuery] = useState("");
  const [foodId, setFoodId] = useState<string>();
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (foods.length === 0) {
    return (
      <EmptyState
        title="Add foods first"
        text="Diets are built from your food list."
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
  const selected = foods.find((food) => food.id === foodId);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected) return setError("Pick a food.");
        const parsed = QuantitySchema.safeParse(quantity);
        if (!parsed.success) return setError(parsed.error.issues[0].message);
        setError(undefined);
        startTransition(async () => {
          const result = await onSubmit(selected, parsed.data);
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
        <legend className="sr-only">Food</legend>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-accent/20 p-1">
          {visible.length === 0 && <p className="px-3 py-2 text-sm text-foreground/70">No foods match.</p>}
          {visible.map((food) => (
            <label
              key={food.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 has-checked:bg-accent/15 has-checked:text-accent has-focus-visible:ring-1 has-focus-visible:ring-inset has-focus-visible:ring-accent"
            >
              <input
                type="radio"
                name="food"
                value={food.id}
                checked={food.id === foodId}
                onChange={() => {
                  setFoodId(food.id);
                  setQuantity(formatQuantity(food.serving_size));
                  setError(undefined);
                }}
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
      <Input
        label={selected ? `Quantity (${selected.serving_unit})` : "Quantity"}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        disabled={!selected}
        hint={selected ? undefined : "Pick a food first."}
      />
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
        {error}
      </p>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
