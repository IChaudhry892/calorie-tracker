"use client";

import { useState } from "react";
import { AmountFields, amountFromQuantity } from "@/components/AmountFields";
import { Button } from "@/components/ui/Button";
import { QuantitySchema } from "@/lib/diets";

/** Servings or a quantity (in `unit`), validated before `onSubmit`. Servings show when `servingSize` is known. */
export function QuantityForm({
  unit,
  servingSize,
  initial,
  submitLabel = "Save",
  onSubmit,
}: {
  unit: string;
  servingSize?: number;
  initial: number;
  submitLabel?: string;
  onSubmit: (quantity: number) => void;
}) {
  const [amount, setAmount] = useState(() => amountFromQuantity(initial, servingSize));
  const [error, setError] = useState<string>();

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = QuantitySchema.safeParse(amount.quantity);
        if (!parsed.success) return setError(parsed.error.issues[0].message);
        onSubmit(parsed.data);
      }}
    >
      <AmountFields
        unit={unit}
        servingSize={servingSize}
        value={amount}
        onChange={(next) => {
          setAmount(next);
          setError(undefined);
        }}
        error={error}
        autoFocus
      />
      <Button type="submit" className="w-full sm:w-auto sm:self-end">
        {submitLabel}
      </Button>
    </form>
  );
}
