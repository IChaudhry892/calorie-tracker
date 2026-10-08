import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
      <EmptyState
        headingLevel="h1"
        title="Page not found"
        text="That page doesn't exist. It may have moved, or the link is wrong."
        action={
          <Link href="/log" className={buttonClasses()}>
            Go to Daily Log
          </Link>
        }
      />
    </main>
  );
}
