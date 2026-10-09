"use client";

import { Input } from "@/components/ui/Input";
import { formatServing } from "@/lib/foods";
import { formatQuantity } from "@/lib/macros";

/** Both fields as typed. `quantity` (in the food's unit) is what gets submitted. */
export type Amount = { quantity: string; servings: string };

/** One serving of a food, as the starting amount. */
export function oneServing(servingSize: number): Amount {
  return { quantity: formatQuantity(servingSize), servings: "1" };
}

/** An existing quantity, with the servings it works out to. */
export function amountFromQuantity(quantity: number, servingSize?: number): Amount {
  return { quantity: formatQuantity(quantity), servings: servingSize ? formatQuantity(quantity / servingSize) : "" };
}

/** A number from a field, or null while it's blank or half-typed. */
function parse(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type AmountFieldsProps = {
  unit: string;
  /** The food's serving size in `unit`. Without one (or when it's 1, so servings = quantity) only Quantity shows. */
  servingSize?: number;
  value: Amount;
  onChange: (amount: Amount) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

/**
 * Servings and Quantity, kept in step: 3 servings of a 16 g food fills in 48 g,
 * and typing 40 g shows 2.5 servings.
 */
export function AmountFields({ unit, servingSize, value, onChange, error, hint, disabled, autoFocus }: AmountFieldsProps) {
  const quantityField = (
    <Input
      label={`Quantity (${unit})`}
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      value={value.quantity}
      onChange={(e) => {
        const n = parse(e.target.value);
        onChange({
          quantity: e.target.value,
          servings: n === null || !servingSize ? "" : formatQuantity(n / servingSize),
        });
      }}
      disabled={disabled}
      autoFocus={autoFocus && !(servingSize && servingSize !== 1)}
      error={error}
      hint={hint}
    />
  );

  if (!servingSize || servingSize === 1) return quantityField;

  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <Input
        label="Servings"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value.servings}
        onChange={(e) => {
          const n = parse(e.target.value);
          onChange({ servings: e.target.value, quantity: n === null ? "" : formatQuantity(n * servingSize) });
        }}
        disabled={disabled}
        autoFocus={autoFocus}
        hint={`1 serving = ${formatServing({ serving_size: servingSize, serving_unit: unit })}`}
      />
      {quantityField}
    </div>
  );
}
