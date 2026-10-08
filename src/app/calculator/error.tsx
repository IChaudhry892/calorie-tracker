"use client";

import { ErrorView } from "@/components/ErrorView";

// Inside the calculator layout, so its header (or the full nav when signed in) stays usable.
export default function CalculatorError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} />;
}
