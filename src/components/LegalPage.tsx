import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_UPDATED } from "@/lib/site";

/** Shell for /privacy and /terms: a readable prose column under the public header. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-semibold text-heading">{title}</h1>
        <p className="mt-2 text-sm text-foreground/70">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-6 flex flex-col gap-6 leading-relaxed [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-accent-hover [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-heading [&_li]:ml-5 [&_li]:list-disc [&_section]:flex [&_section]:flex-col [&_section]:gap-2">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
