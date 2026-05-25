import { useEffect, useRef, useState } from 'react';
import type { FieldHelpPopoverProps } from './FieldHelpPopover.types';

/**
 * FieldHelpPopover — a small inline "?" button that opens a contextual
 * explanation popover next to a complex form field.
 *
 * Use only for fields that genuinely need explanation (regex, attachment rules,
 * entity type, series type, etc.). Do not add to every field.
 */
export function FieldHelpPopover({ title, description, example }: FieldHelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLSpanElement>(null);

  // Close on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  return (
    <span ref={popoverRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={`Help: ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] transition-colors"
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-7 z-30 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left shadow-lg"
        >
          <span className="block text-sm font-semibold text-[var(--color-text)]">{title}</span>
          <span className="mt-1 block text-sm leading-5 text-[var(--color-text-muted)]">
            {description}
          </span>
          {example && (
            <span className="mt-2 block rounded-lg bg-[var(--color-surface-subtle)] p-2 text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Example: </span>
              {example}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
