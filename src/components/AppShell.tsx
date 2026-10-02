import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

/** Signed-in chrome: nav + a content column padded clear of the mobile tab bar. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
    </>
  );
}
