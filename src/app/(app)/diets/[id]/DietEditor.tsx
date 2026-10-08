"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { FoodPicker } from "@/components/FoodPicker";
import { QuantityForm } from "@/components/QuantityForm";
import { MacroTable } from "@/components/MacroTable";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { dietRows, DietNameSchema, type DietFood, type DietItemWithFood } from "@/lib/diets";
import { formatCalories, sumMacros } from "@/lib/macros";
import {
  addDietItem,
  deleteDiet,
  duplicateDiet,
  removeDietItem,
  renameDiet,
  updateDietItemQuantity,
} from "../actions";
import { ApplyDietForm } from "../../log/ApplyDietForm";

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
  const [applying, setApplying] = useState(false);
  const router = useRouter();
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
          <Button variant="secondary" onClick={() => setApplying(true)} disabled={items.length === 0}>
            Apply to a day
          </Button>
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
        {adding && (
          <FoodPicker
            key={addCount}
            foods={foods}
            submitLabel="Add to diet"
            pendingLabel="Adding…"
            onSubmit={(food, quantity) => addDietItem(diet.id, food.id, String(quantity))}
            onDone={() => setAdding(false)}
          />
        )}
      </Dialog>

      <Dialog open={applying} onClose={() => setApplying(false)} title={`Apply ${diet.name} to a day`}>
        {applying && (
          <ApplyDietForm
            diets={[{ id: diet.id, name: diet.name, calories: total.calories, itemCount: items.length }]}
            onApplied={(date) => {
              setApplying(false);
              router.push(`/log?date=${date}`);
            }}
          />
        )}
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
