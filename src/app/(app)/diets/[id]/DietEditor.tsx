"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { MacroTable } from "@/components/MacroTable";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { dietRows, DietNameSchema, QuantitySchema, type DietFood, type DietItemWithFood } from "@/lib/diets";
import { formatServing } from "@/lib/foods";
import { formatCalories, formatQuantity, sumMacros } from "@/lib/macros";
import {
  addDietItem,
  deleteDiet,
  duplicateDiet,
  removeDietItem,
  renameDiet,
  updateDietItemQuantity,
} from "../actions";

type DietEditorProps = {
  diet: { id: string; name: string; items: DietItemWithFood[] };
  foods: DietFood[];
  maintenance: number | null;
};

type OptimisticChange = { type: "quantity"; id: string; quantity: number } | { type: "remove"; id: string };

function applyChange(items: DietItemWithFood[], change: OptimisticChange): DietItemWithFood[] {
  if (change.type === "remove") return items.filter((item) => item.id !== change.id);
  return items.map((item) => (item.id === change.id ? { ...item, quantity: change.quantity } : item));
}

export function DietEditor({ diet, foods, maintenance }: DietEditorProps) {
  // Quantity edits and removals show instantly; the server copy replaces this once revalidated.
  const [items, applyOptimistic] = useOptimistic(diet.items, applyChange);
  const [rowError, setRowError] = useState<string>();
  const [, startRowChange] = useTransition();

  const [editing, setEditing] = useState<DietItemWithFood | null>(null);
  const [adding, setAdding] = useState(false);
  const [addCount, setAddCount] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [headerError, setHeaderError] = useState<string>();
  const [headerPending, startHeaderAction] = useTransition();

  const rows = dietRows(items);
  const total = sumMacros(rows);

  function changeRow(change: OptimisticChange, run: () => Promise<{ error?: string }>) {
    setRowError(undefined);
    startRowChange(async () => {
      applyOptimistic(change);
      const result = await run();
      if (result.error) setRowError(result.error);
    });
  }

  function openAdd() {
    setAddCount((n) => n + 1);
    setAdding(true);
  }

  function runHeaderAction(action: () => Promise<{ error?: string }>) {
    setHeaderError(undefined);
    startHeaderAction(async () => {
      // On success these redirect, so only errors come back.
      const result = await action();
      if (result?.error) setHeaderError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link href="/diets" className="self-start text-sm text-foreground/70 hover:text-accent-hover">
          ← All diets
        </Link>
        <DietName dietId={diet.id} name={diet.name} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAdd}>Add food</Button>
          <Button
            variant="secondary"
            onClick={() => runHeaderAction(() => duplicateDiet(diet.id))}
            disabled={headerPending}
          >
            Duplicate
          </Button>
          <Button variant="danger" onClick={() => setConfirmingDelete(true)} disabled={headerPending}>
            Delete
          </Button>
        </div>
        {headerError && (
          <p role="alert" className="text-sm text-red-300">
            {headerError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p role="status" aria-live="polite" className="text-sm text-red-300 empty:hidden">
          {rowError}
        </p>
        <MacroTable
          rows={rows}
          caption={`Foods in ${diet.name}`}
          emptyState={
            <EmptyState
              title="No foods yet"
              text="Add foods from your list to see this diet's totals."
              action={<Button onClick={openAdd}>Add food</Button>}
            />
          }
          renderActions={(row) => {
            const item = items.find((i) => i.id === row.id)!;
            return (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditing(item)} aria-label={`Edit ${row.name}`}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label={`Remove ${row.name}`}
                  onClick={() => changeRow({ type: "remove", id: row.id }, () => removeDietItem(diet.id, row.id))}
                >
                  Remove
                </Button>
              </div>
            );
          }}
        />
        {rows.length > 0 && <MaintenanceLine total={total.calories} maintenance={maintenance} />}
      </div>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={`Edit ${editing?.foods.name ?? "food"}`}>
        {editing && (
          <QuantityForm
            key={editing.id}
            unit={editing.foods.serving_unit}
            initial={editing.quantity}
            onSubmit={(quantity) => {
              setEditing(null);
              changeRow({ type: "quantity", id: editing.id, quantity }, () =>
                updateDietItemQuantity(diet.id, editing.id, String(quantity)),
              );
            }}
          />
        )}
      </Dialog>

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add food">
        {adding && <AddFoodForm key={addCount} dietId={diet.id} foods={foods} onDone={() => setAdding(false)} />}
      </Dialog>

      <Dialog open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title={`Delete ${diet.name}?`}>
        <p className="text-sm text-foreground/80">Days you&apos;ve already logged keep their entries.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={headerPending}
            onClick={() => {
              setConfirmingDelete(false);
              runHeaderAction(() => deleteDiet(diet.id));
            }}
          >
            {headerPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/** The heading, which swaps to an input while renaming. */
function DietName({ dietId, name }: { dietId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold break-words text-heading">{name}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(name);
            setError(undefined);
            setEditing(true);
          }}
        >
          Rename
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = DietNameSchema.safeParse(draft);
        if (!parsed.success) return setError(parsed.error.issues[0].message);
        startTransition(async () => {
          const result = await renameDiet(dietId, parsed.data);
          if (result.error) setError(result.error);
          else setEditing(false);
        });
      }}
    >
      <div className="flex-1">
        <Input
          label="Diet name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          maxLength={80}
          autoFocus
          error={error}
        />
      </div>
      <div className="flex gap-2 sm:pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function QuantityForm({
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

function AddFoodForm({ dietId, foods, onDone }: { dietId: string; foods: DietFood[]; onDone: () => void }) {
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
          const result = await addDietItem(dietId, selected.id, String(parsed.data));
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
        {pending ? "Adding…" : "Add to diet"}
      </Button>
    </form>
  );
}

function MaintenanceLine({ total, maintenance }: { total: number; maintenance: number | null }) {
  if (maintenance == null) {
    return (
      <p className="text-sm text-foreground/70">
        <Link href="/calculator" className="text-accent hover:text-accent-hover">
          Set your maintenance calories in the Calculator
        </Link>{" "}
        to compare this diet against them.
      </p>
    );
  }
  const diff = Math.round(total) - maintenance;
  const comparison = diff === 0 ? "exactly your" : `${formatCalories(Math.abs(diff))} kcal ${diff < 0 ? "under" : "over"} your`;
  return (
    <p aria-live="polite" className="text-sm text-foreground/70">
      {formatCalories(total)} kcal · {comparison} {maintenance} kcal maintenance
    </p>
  );
}
