import type { ComponentProps } from "react";
import { FieldShell, fieldClasses, useFieldIds, type FieldExtras } from "./Input";

export type SelectOption = { value: string; label: string };

export function Select({
  label,
  hint,
  error,
  id,
  options,
  className = "",
  ...props
}: ComponentProps<"select"> & FieldExtras & { options: SelectOption[] }) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell label={label} hint={hint} error={error} {...ids}>
      <select
        id={ids.fieldId}
        aria-describedby={ids.describedBy}
        aria-invalid={error ? true : undefined}
        className={`${fieldClasses} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
