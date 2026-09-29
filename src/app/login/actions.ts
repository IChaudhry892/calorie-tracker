"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const CredentialsSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

function parseCredentials(formData: FormData) {
  return CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

/** Absolute URL of `/auth/callback`, carrying the post-login destination. */
async function callbackUrl(next: string) {
  const h = await headers();
  const origin =
    h.get("origin") ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await callbackUrl(next) },
  });
  if (error) return { error: error.message };

  // With "Confirm email" on, there is no session until the link is clicked.
  if (!data.session) {
    return { message: "Check your inbox to confirm your email." };
  }
  redirect(next);
}

export async function signInWithGoogle(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error) return { error: error.message };

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
