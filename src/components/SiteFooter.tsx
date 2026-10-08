import Link from "next/link";

/** Privacy and terms links for the signed-out pages (Google's OAuth review checks the homepage links them). */
export function SiteFooter() {
  return (
    <footer className="px-4 py-6 text-center text-sm text-foreground/70">
      <nav aria-label="Legal" className="flex justify-center gap-4">
        <Link href="/privacy" className="rounded hover:text-accent-hover">
          Privacy Policy
        </Link>
        <Link href="/terms" className="rounded hover:text-accent-hover">
          Terms of Service
        </Link>
      </nav>
    </footer>
  );
}
