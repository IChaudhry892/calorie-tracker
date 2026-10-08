"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/** Body of the error.tsx boundaries. The message itself is never shown: in production it's generic anyway. */
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // The digest matches the server-side log entry for this error.
    console.error(error.digest ?? error);
  }, [error]);

  return (
    <EmptyState
      headingLevel="h1"
      title="Something went wrong"
      text="This page couldn't load. Check your connection and try again."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          <Link href="/log" className={buttonClasses({ variant: "secondary" })}>
            Go to Daily Log
          </Link>
        </div>
      }
    />
  );
}
