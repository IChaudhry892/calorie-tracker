"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";

const icon = (path: ReactNode) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const TABS = [
  {
    href: "/log",
    label: "Today",
    icon: icon(
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>,
    ),
  },
  {
    href: "/foods",
    label: "Foods",
    icon: icon(
      <>
        <path d="M12 7c-2-2.5-7-2-7 3.5 0 4 3 9.5 7 9.5s7-5.5 7-9.5C19 5 14 4.5 12 7z" />
        <path d="M12 7c0-2 1-3.5 3-4" />
      </>,
    ),
  },
  {
    href: "/diets",
    label: "Diets",
    icon: icon(
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
      </>,
    ),
  },
  {
    href: "/calculator",
    label: "Calculator",
    icon: icon(
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
      </>,
    ),
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Brand() {
  return (
    <Link href="/log" className={`rounded-lg text-lg font-semibold text-heading ${focusRing}`}>
      Calorie Tracker
    </Link>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: top bar with tabs */}
      <header className="sticky top-0 z-20 hidden bg-surface shadow-md md:block">
        <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-3">
          <Brand />
          <nav aria-label="Main" className="flex-1">
            <ul className="flex gap-6">
              {TABS.map((tab) => {
                const active = isActive(pathname, tab.href);
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg py-1 font-medium transition-colors ${focusRing} ${
                        active ? "text-accent" : "text-foreground/70 hover:text-accent-hover"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <SignOutButton />
        </div>
      </header>

      {/* Mobile: slim top header + fixed bottom tab bar */}
      <header className="flex items-center justify-between bg-surface px-4 py-2 md:hidden">
        <Brand />
        <SignOutButton />
      </header>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-accent/20 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                    active ? "text-accent" : "text-foreground/70 hover:text-accent-hover"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
