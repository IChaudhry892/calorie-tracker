"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDay, todayIso } from "@/lib/dates";
import { formatCalories } from "@/lib/macros";
import { applyDiet } from "./actions";

export type DietOption = { id: string; name: string; calories: number; itemCount: number };

type ApplyDietFormProps = {
  /** One diet (from the diet page) hides the picker; several show a Select. */
  diets: DietOption[];
  /** Fixed date (from the log); without it the form asks for one, defaulting to today. */
  date?: string;
  onApplied: (date: string) => void;
};

/** Copies a diet into a day. Asks before applying the same diet to the same day twice. */
export function ApplyDietForm({ diets, date: fixedDate, onApplied }: ApplyDietFormProps) {
  const usable = diets.filter((diet) => diet.itemCount > 0);
  const [dietId, setDietId] = useState(usable[0]?.id ?? "");
  // Computed once on mount, in the browser, so "today" is the user's local date.
  const [date, setDate] = useState(() => fixedDate ?? todayIso());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (usable.length === 0) {
    return <p className="text-sm text-foreground/70">Add foods to a diet first, then apply it to a day.</p>;
  }

  function apply(force: boolean) {
    setError(undefined);
    startTransition(async () => {
      const result = await applyDiet({ dietId, date, force });
      if (result.needsConfirm) setConfirming(result.dietName ?? "This diet");
      else if (result.error) setError(result.error);
      else onApplied(date);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-4">
        <p>
          {confirming} is already on {formatDay(date)}. Add it again?
        </p>
        <p role="alert" className="min-h-5 text-sm text-red-300">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
          <Button onClick={() => apply(true)} disabled={pending}>
            {pending ? "Adding…" : "Add again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        apply(false);
      }}
    >
      {usable.length > 1 ? (
        <Select
          label="Diet"
          value={dietId}
          onChange={(e) => setDietId(e.target.value)}
          options={usable.map((diet) => ({
            value: diet.id,
            label: `${diet.name} · ${formatCalories(diet.calories)} kcal`,
          }))}
        />
      ) : (
        <p className="text-sm text-foreground/80">
          {usable[0].name} · {formatCalories(usable[0].calories)} kcal
        </p>
      )}
      {fixedDate ? (
        <p className="text-sm text-foreground/70">Adds every food in the diet to {formatDay(fixedDate)}.</p>
      ) : (
        <Input label="Day" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      )}
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
        {error}
      </p>
      <Button type="submit" disabled={pending || !date} className="w-full sm:w-auto sm:self-end">
        {pending ? "Applying…" : "Apply diet"}
      </Button>
    </form>
  );
}
