"use client";

import { ErrorView } from "@/components/ErrorView";

// Landing and login pages; (app) and calculator have their own boundaries inside their layouts.
export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12">
      <ErrorView {...props} />
    </main>
  );
}
