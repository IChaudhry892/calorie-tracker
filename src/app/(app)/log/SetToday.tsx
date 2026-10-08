"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { todayIso } from "@/lib/dates";

/** Fills in `?date=` with the browser's local date, which the server can't know. */
export function SetToday() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/log?date=${todayIso()}`);
  }, [router]);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-heading">Daily Log</h1>
      <p className="text-foreground/70" role="status">
        Loading today…
      </p>
    </div>
  );
}
