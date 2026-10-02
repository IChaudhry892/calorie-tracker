"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Native modal `<dialog>`: the browser traps focus, makes the page inert and
 * restores focus to the trigger on close. Bottom sheet on mobile, centered on desktop.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Fires on Esc and on programmatic close; onClose must be idempotent.
      onClose={onClose}
      // The inner div fills the dialog, so a click whose target is the dialog itself hit the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      // Tailwind preflight zeroes margins, so m-auto restores native centering.
      className="m-auto bg-surface p-0 text-foreground backdrop:bg-black/60 max-md:mx-0 max-md:mt-auto max-md:mb-0 max-md:w-full max-md:max-w-full max-md:rounded-t-2xl md:w-full md:max-w-md md:rounded-2xl"
    >
      <div className="flex flex-col gap-4 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold text-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2 rounded-lg p-2 text-foreground/70 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
