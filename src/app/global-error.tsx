"use client";

import { useEffect } from "react";
import "./globals.css";

// Replaces the root layout when it fails, so it brings its own <html>, styles and title.
// No next/font here: a plain stack keeps this page independent of anything that might be broken.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 px-4 text-center font-[Arial,sans-serif]">
        <title>Something went wrong · Calorie Tracker</title>
        <h1 className="text-3xl font-semibold text-heading">Something went wrong</h1>
        <p className="max-w-sm text-foreground/80">Calorie Tracker couldn&apos;t load. Please try again.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-accent-secondary px-4 py-2 font-medium text-background hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
