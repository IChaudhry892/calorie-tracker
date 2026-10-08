"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuantitySchema } from "@/lib/diets";
import { formatQuantity } from "@/lib/macros";

/** A single quantity field, labelled with its unit and validated before `onSubmit`. */
export function QuantityForm({
  unit,
  initial,
  submitLabel = "Save",
  onSubmit,
}: {
  unit: string;
  initial?: number;
  submitLabel?: string;
  onSubmit: (quantity: number) => void;
}) {
  const [value, setValue] = useState(initial != null ? formatQuantity(initial) : "");
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = QuantitySchema.safeParse(value);
        if (!parsed.success) return setError(parsed.error.issues[0].message);
        onSubmit(parsed.data);
      }}
    >
      <Input
        label={`Quantity (${unit})`}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        error={error}
      />
      <Button type="submit" className="w-full sm:w-auto sm:self-end">
        {submitLabel}
      </Button>
    </form>
  );
}
