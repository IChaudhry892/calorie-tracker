"use client";

import { ErrorView } from "@/components/ErrorView";

// Inside AppShell, so the nav stays usable while a page has failed.
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} />;
}
