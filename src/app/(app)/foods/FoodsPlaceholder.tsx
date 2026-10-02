"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";

// Temporary: exercises the shared Dialog until Phase 6 builds the real Add Food form.
export function FoodsPlaceholder() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <EmptyState
        title="Add your first food"
        text="Save foods with their calories and protein per serving."
        action={<Button onClick={() => setOpen(true)}>Add food</Button>}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="Add food">
        <p>Adding foods is coming soon.</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </>
  );
}
