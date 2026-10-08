import Link from "next/link";
import type { ReactNode } from "react";

/** Signed-out top bar: the brand links back to the landing page, `action` sits on the right. */
export function PublicHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 md:px-6 md:py-3">
        <Link href="/" className="rounded-lg text-lg font-semibold text-heading">
          Calorie Tracker
        </Link>
        {action}
      </div>
    </header>
  );
}
