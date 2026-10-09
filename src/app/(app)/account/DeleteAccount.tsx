"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { deleteAccount } from "./actions";
import { DELETE_CONFIRMATION } from "./confirm";

/** Danger button + a confirm dialog that needs the word typed in, since there's no undo. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState(deleteAccount, {});

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
      >
        Delete account
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form action={action} className="flex flex-col gap-4">
          <p className="text-sm text-foreground/80">
            Everything is deleted straight away and can&apos;t be recovered.
          </p>
          <Input
            label={`Type ${DELETE_CONFIRMATION} to confirm`}
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-300">
            {state.error}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={pending || typed !== DELETE_CONFIRMATION}>
              {pending ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
