"use client";

import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-accent/40 bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/50";
const primaryButton =
  "w-full rounded-lg bg-accent-secondary px-4 py-2 font-medium text-heading transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
const secondaryButton =
  "w-full rounded-lg border-2 border-accent px-4 py-2 font-medium text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [signInState, signInAction, signInPending] = useActionState(signIn, {});
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, {});
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, {});

  // Show feedback only for the most recently submitted action, so a stale
  // message from an earlier attempt doesn't linger.
  const [last, setLast] = useState<"signIn" | "signUp" | "google" | null>(null);

  const pending = signInPending || signUpPending || googlePending;
  const states = { signIn: signInState, signUp: signUpState, google: googleState };
  const feedback: AuthState = last ? states[last] : { error: initialError };

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={6}
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button formAction={signInAction} onClick={() => setLast("signIn")} disabled={pending} className={primaryButton}>
            {signInPending ? "Signing in…" : "Sign in"}
          </button>
          <button formAction={signUpAction} onClick={() => setLast("signUp")} disabled={pending} className={secondaryButton}>
            {signUpPending ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-3 text-sm text-foreground/60">
        <span className="h-px flex-1 bg-foreground/20" />
        or
        <span className="h-px flex-1 bg-foreground/20" />
      </div>

      <form action={googleAction} onSubmit={() => setLast("google")}>
        <input type="hidden" name="next" value={next} />
        <button disabled={pending} className={secondaryButton}>
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </button>
      </form>

      <p aria-live="polite" role="status" className="min-h-6 text-center text-sm">
        {feedback.error && <span className="text-red-300">{feedback.error}</span>}
        {feedback.message && <span className="text-accent">{feedback.message}</span>}
      </p>
    </div>
  );
}
