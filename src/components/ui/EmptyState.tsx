import type { ReactNode } from "react";

type EmptyStateProps = { title: string; text?: string; action?: ReactNode };

export function EmptyState({ title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent/30 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      {text && <p className="max-w-sm text-sm text-foreground/70">{text}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
