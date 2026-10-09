"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { DELETE_CONFIRMATION } from "./confirm";

export type DeleteAccountState = { error?: string };

/** Deletes the signed-in user and everything they own, then signs this browser out. */
export async function deleteAccount(_prevState: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  if (formData.get("confirm") !== DELETE_CONFIRMATION) return { error: `Type ${DELETE_CONFIRMATION} to confirm.` };

  const user = await requireUser();
  if (!user) return { error: "Log in again." };

  // Security definer: deletes auth.users for auth.uid() only, and every table cascades from it.
  const { error } = await user.supabase.rpc("delete_my_account");
  if (error) return { error: "Couldn't delete your account. Please try again." };

  // The user no longer exists, so only clear this browser's session cookies.
  await user.supabase.auth.signOut({ scope: "local" });
  redirect("/login?deleted=1");
}
