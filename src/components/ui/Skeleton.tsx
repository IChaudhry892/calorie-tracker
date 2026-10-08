import type { ReactNode } from "react";

/** A pulsing placeholder block. Size and shape come from `className`. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-surface motion-reduce:animate-none ${className}`} />;
}

/** Wraps a page skeleton so screen readers hear "Loading…" once, not every block. */
export function SkeletonPage({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}
