import { useMemo, useState } from "react";
import type { CommandPaletteProps } from "./CommandPalette.types";

export function CommandPalette({ open, commands, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter((command) => {
      const haystack = [command.label, command.description, ...(command.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(value);
    });
  }, [commands, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-16" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close command palette" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="border-b border-[var(--color-border)] p-4">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or type a command..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length > 0 ? (
            filtered.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() => onExecute(command)}
                className="w-full rounded-xl px-4 py-3 text-left hover:bg-[var(--color-surface-subtle)]"
              >
                <span className="block text-sm font-semibold text-[var(--color-text)]">{command.label}</span>
                {command.description && <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{command.description}</span>}
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No matching command found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
