"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PASSWORD_RULES } from "@/lib/password";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [signInState, signInAction, signInPending] = useActionState(signIn, {});
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, {});
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, {});

  // Show feedback only for the most recently submitted action, so a stale
  // message from an earlier attempt doesn't linger.
  const [last, setLast] = useState<"signIn" | "signUp" | "google" | null>(null);
  // Controlled, so React's reset after a form action doesn't wipe them when sign-in fails.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pending = signInPending || signUpPending || googlePending;
  const states = { signIn: signInState, signUp: signUpState, google: googleState };
  const feedback: AuthState = last ? states[last] : { error: initialError };

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={password ? "password-rules" : undefined}
        />
        {password && <PasswordRules password={password} />}
        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" formAction={signInAction} onClick={() => setLast("signIn")} disabled={pending} className="w-full">
            {signInPending ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="submit"
            variant="secondary"
            formAction={signUpAction}
            onClick={() => setLast("signUp")}
            disabled={pending}
            className="w-full"
          >
            {signUpPending ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </form>

      <div className="flex items-center gap-3 text-sm text-foreground/60">
        <span className="h-px flex-1 bg-foreground/20" />
        or
        <span className="h-px flex-1 bg-foreground/20" />
      </div>

      <form action={googleAction} onSubmit={() => setLast("google")}>
        <input type="hidden" name="next" value={next} />
        {/* Google's branding guidelines: white button, dark text, the multicolour "G" on the left. */}
        <button
          type="submit"
          disabled={pending}
          className="relative flex w-full items-center justify-center rounded-lg border border-[#747775] bg-white px-4 py-2 font-medium text-[#1f1f1f] transition hover:bg-[#f2f2f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon className="absolute left-4 size-5" />
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

/** Live checklist for sign-up. Sign-in ignores it: older accounts may predate these rules. */
function PasswordRules({ password }: { password: string }) {
  return (
    <div id="password-rules" className="-mt-2 text-xs">
      <p className="text-foreground/70">New accounts need:</p>
      <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.key} className={`flex items-center gap-1.5 ${met ? "text-accent" : "text-foreground/70"}`}>
              <span aria-hidden className="w-3 text-center">
                {met ? "✓" : "○"}
              </span>
              {rule.label}
              <span className="sr-only">{met ? "(done)" : "(missing)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
