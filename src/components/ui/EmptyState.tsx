import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  text?: string;
  action?: ReactNode;
  /** h1 when the empty state is the whole page (404, errors). */
  headingLevel?: "h1" | "h2";
};

export function EmptyState({ title, text, action, headingLevel: Heading = "h2" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent/30 px-6 py-10 text-center">
      <Heading className="text-lg font-semibold text-heading">{title}</Heading>
      {text && <p className="max-w-sm text-sm text-foreground/70">{text}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
