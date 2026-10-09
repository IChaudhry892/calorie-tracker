import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccount } from "./DeleteAccount";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Account</h1>
      {email && (
        <Card>
          <p className="text-sm text-foreground/70">Signed in as</p>
          <p className="font-medium break-words text-heading">{email}</p>
        </Card>
      )}
      <Card className="flex flex-col items-start gap-3 border-2 border-red-300/40">
        <h2 className="text-lg font-semibold text-heading">Delete account</h2>
        <p className="text-sm text-foreground/80">
          Permanently deletes your account and everything in it: your saved calculator details, foods, diets and daily
          log. This can&apos;t be undone.
        </p>
        <DeleteAccount />
      </Card>
    </div>
  );
}
