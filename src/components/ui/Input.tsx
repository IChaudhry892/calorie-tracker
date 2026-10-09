import { useId, type ComponentProps, type ReactNode } from "react";

// The focus ring is inset: an outer box-shadow can leave a 1px sliver behind
// on blur at fractional display scaling (e.g. 125%), where Chrome under-repaints.
export const fieldClasses =
  "w-full rounded-lg border-2 border-accent/40 bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-inset focus:ring-accent aria-invalid:border-red-300";

export type FieldExtras = { label: string; hint?: string; error?: string };

/** Label + hint/error wiring shared by Input and Select. */
export function useFieldIds(id: string | undefined, hint?: string, error?: string) {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

export function FieldShell({
  fieldId,
  label,
  hint,
  hintId,
  error,
  errorId,
  children,
}: FieldExtras & { fieldId: string; hintId?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-foreground/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, hint, error, id, className = "", ...props }: ComponentProps<"input"> & FieldExtras) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldShell label={label} hint={hint} error={error} {...ids}>
      <input
        id={ids.fieldId}
        aria-describedby={ids.describedBy}
        aria-invalid={error ? true : undefined}
        className={`${fieldClasses} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
