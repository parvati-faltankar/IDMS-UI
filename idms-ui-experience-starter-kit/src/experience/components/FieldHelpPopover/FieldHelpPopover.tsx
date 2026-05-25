import { useState } from "react";
import type { FieldHelpPopoverProps } from "./FieldHelpPopover.types";

export function FieldHelpPopover({ title, description, example }: FieldHelpPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`Help: ${title}`}
        onClick={() => setOpen((value) => !value)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-0 top-7 z-20 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-lg">
          <span className="block text-sm font-semibold text-[var(--color-text)]">{title}</span>
          <span className="mt-1 block text-sm leading-5 text-[var(--color-text-muted)]">{description}</span>
          {example && <span className="mt-2 block rounded-lg bg-[var(--color-surface-subtle)] p-2 text-xs text-[var(--color-text-muted)]">Example: {example}</span>}
        </span>
      )}
    </span>
  );
}
