"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { Food } from "@/lib/db";
import { formatServing } from "@/lib/foods";
import { formatCalories, formatProtein } from "@/lib/macros";
import { deleteFood } from "./actions";
import { FoodForm } from "./FoodForm";

export type FoodListItem = Pick<
  Food,
  "id" | "name" | "serving_size" | "serving_unit" | "calories" | "protein_g" | "source"
>;

type EditorState = { mode: "add"; key: number } | { mode: "edit"; food: FoodListItem };

export function FoodList({ foods }: { foods: FoodListItem[] }) {
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [addCount, setAddCount] = useState(0);
  const [deleting, setDeleting] = useState<FoodListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string>();
  const [deletePending, startDelete] = useTransition();

  // The list is small and already loaded, so search runs on the client.
  const needle = query.trim().toLowerCase();
  const visible = needle ? foods.filter((food) => food.name.toLowerCase().includes(needle)) : foods;

  function openAdd() {
    setAddCount((n) => n + 1);
    setEditor({ mode: "add", key: addCount + 1 });
  }

  function openDelete(food: FoodListItem) {
    setDeleteError(undefined);
    setDeleting(food);
  }

  function confirmDelete() {
    if (!deleting) return;
    startDelete(async () => {
      const result = await deleteFood(deleting.id);
      if (result.error) setDeleteError(result.error);
      else setDeleting(null);
    });
  }

  const addButton = <Button onClick={openAdd}>Add food</Button>;

  return (
    <>
      {foods.length === 0 ? (
        <EmptyState
          title="Add your first food"
          text="Save foods with their calories and protein per serving."
          action={addButton}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Search foods"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            {addButton}
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-4" role="status">
              <p className="text-foreground/70">No foods match &ldquo;{query.trim()}&rdquo;.</p>
              <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="-ml-3">
                Clear search
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Your foods">
              {visible.map((food) => (
                <li
                  key={food.id}
                  className="flex flex-col gap-3 rounded-2xl bg-surface p-4 md:flex-row md:items-center md:gap-6 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium break-words text-heading">
                      {food.name}
                      {food.source === "ai" && (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">AI</span>
                      )}
                    </p>
                    <p className="text-sm text-foreground/70">per {formatServing(food)}</p>
                  </div>
                  <p className="flex gap-6 tabular-nums md:w-52 md:justify-end">
                    <span>
                      <span className="font-semibold text-heading">{formatCalories(food.calories)}</span> kcal
                    </span>
                    <span>
                      <span className="font-semibold text-heading">{formatProtein(food.protein_g)}</span> g protein
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditor({ mode: "edit", food })}
                      aria-label={`Edit ${food.name}`}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openDelete(food)} aria-label={`Delete ${food.name}`}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={editor !== null} onClose={() => setEditor(null)} title={editor?.mode === "edit" ? "Edit food" : "Add food"}>
        {editor && (
          <FoodForm
            key={editor.mode === "edit" ? editor.food.id : `new-${editor.key}`}
            food={editor.mode === "edit" ? editor.food : undefined}
            onDone={() => setEditor(null)}
          />
        )}
      </Dialog>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title={`Delete ${deleting?.name ?? "food"}?`}>
        <p className="text-sm text-foreground/80">
          It will be removed from your food list. Days you&apos;ve already logged keep their entries.
        </p>
        <p role="alert" className="min-h-5 text-sm text-red-300">
          {deleteError}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deletePending}>
            {deletePending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
