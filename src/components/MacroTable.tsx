import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { formatCalories, formatProtein, formatQuantity, sumMacros } from "@/lib/macros";

export type MacroRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
};

type MacroTableProps = {
  rows: MacroRow[];
  caption?: string;
  renderActions?: (row: MacroRow) => ReactNode;
  emptyState?: ReactNode;
};

/** Rows + totals. A table on desktop, stacked cards on mobile. Shared by diets and the daily log. */
export function MacroTable({ rows, caption = "Foods", renderActions, emptyState }: MacroTableProps) {
  if (rows.length === 0) return <>{emptyState ?? null}</>;

  const total = sumMacros(rows);
  const numCell = "px-4 py-3 text-right tabular-nums";

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-surface md:block">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-sm text-foreground/70">
            <tr className="border-b border-accent/20">
              <th scope="col" className="px-4 py-3 font-medium">Food</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Qty</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Calories</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Protein</th>
              {renderActions && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-foreground/10 last:border-b-0">
                <td className="px-4 py-3">{row.name}</td>
                <td className={numCell}>
                  {formatQuantity(row.quantity)} {row.unit}
                </td>
                <td className={numCell}>{formatCalories(row.calories)} kcal</td>
                <td className={numCell}>{formatProtein(row.protein_g)} g</td>
                {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot aria-live="polite" className="border-t border-accent/30 font-semibold text-heading">
            <tr>
              <th scope="row" className="px-4 py-3 text-left">Total</th>
              <td className={numCell} />
              <td className={numCell}>{formatCalories(total.calories)} kcal</td>
              <td className={numCell}>{formatProtein(total.protein_g)} g</td>
              {renderActions && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        <ul aria-label={caption} className="flex flex-col gap-2">
          {rows.map((row) => (
            <Card as="li" key={row.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-heading">
                  {row.name}{" "}
                  <span className="font-normal text-foreground/70">
                    · {formatQuantity(row.quantity)} {row.unit}
                  </span>
                </p>
                <p className="text-sm tabular-nums">
                  {formatCalories(row.calories)} kcal · {formatProtein(row.protein_g)} g protein
                </p>
              </div>
              {renderActions && <div className="shrink-0">{renderActions(row)}</div>}
            </Card>
          ))}
        </ul>
        <div aria-live="polite" className="rounded-2xl border border-accent/30 px-4 py-3 font-semibold text-heading">
          Total: <span className="tabular-nums">{formatCalories(total.calories)} kcal · {formatProtein(total.protein_g)} g protein</span>
        </div>
      </div>
    </>
  );
}
