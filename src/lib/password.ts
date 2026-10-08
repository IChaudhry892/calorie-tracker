// Mirrors Supabase Auth → Providers → Email → Password requirements
// ("Lowercase, uppercase letters, digits and symbols") and the minimum length.
// Supabase only enforces these on sign-up and password changes, never on sign-in.

export const MIN_PASSWORD_LENGTH = 6;

// Supabase's symbol set for the "symbols" requirement.
const SYMBOLS = "!@#$%^&*()_+-=[]{};'\:\"|<>?,./`~";

// `label` is the checklist line; `needs` is the phrase used in the sign-up error.
export const PASSWORD_RULES = [
  {
    key: "length",
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    needs: `at least ${MIN_PASSWORD_LENGTH} characters`,
    test: (p: string) => p.length >= MIN_PASSWORD_LENGTH,
  },
  { key: "lower", label: "A lowercase letter", needs: "a lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { key: "upper", label: "An uppercase letter", needs: "an uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "digit", label: "A number", needs: "a number", test: (p: string) => /[0-9]/.test(p) },
  {
    key: "symbol",
    label: "A symbol, e.g. ! ? # @",
    needs: "a symbol",
    test: (p: string) => [...p].some((c) => SYMBOLS.includes(c)),
  },
] as const;

/** Sign-up error for `password`, e.g. "Password needs a number and a symbol.", or null if it meets every rule. */
export function passwordError(password: string): string | null {
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.needs);
  if (missing.length === 0) return null;
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;
  return `Password needs ${list}.`;
}
