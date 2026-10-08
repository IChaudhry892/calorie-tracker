"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { createDiet } from "./actions";

/** "New diet" button + name dialog. `empty` renders it inside the no-diets empty state. */
export function NewDietButton({ empty = false }: { empty?: boolean }) {
  const [open, setOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  function show() {
    setOpenCount((n) => n + 1);
    setOpen(true);
  }

  const button = <Button onClick={show}>New diet</Button>;

  return (
    <>
      {empty ? (
        <EmptyState
          title="Create your first diet"
          text="Build a plan from your food list and see its calories and protein add up."
          action={button}
        />
      ) : (
        button
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="New diet">
        {open && <NewDietForm key={openCount} />}
      </Dialog>
    </>
  );
}

function NewDietForm() {
  // On success the action redirects to the new diet, so only errors come back.
  const [state, action, pending] = useActionState(createDiet, {});

  return (
    <form
      // Not `action={action}`: React resets the form after its action runs, wiping the name on an error.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <Input label="Name" name="name" maxLength={80} autoComplete="off" autoFocus required error={state.error} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:self-end">
        {pending ? "Creating…" : "Create diet"}
      </Button>
    </form>
  );
}
