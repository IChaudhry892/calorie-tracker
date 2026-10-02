"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

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
        <Input label="Email" id="email" name="email" type="email" autoComplete="email" required />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
        />
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
        <Button type="submit" variant="secondary" disabled={pending} className="w-full">
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </Button>
      </form>

      <p aria-live="polite" role="status" className="min-h-6 text-center text-sm">
        {feedback.error && <span className="text-red-300">{feedback.error}</span>}
        {feedback.message && <span className="text-accent">{feedback.message}</span>}
      </p>
    </div>
  );
}
