import type { GlobalHeaderProps } from "./GlobalHeader.types";

export function GlobalHeader({ appName = "IDMS-UI", onOpenCommandPalette, onOpenHelp, rightSlot }: GlobalHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <div className="flex min-w-48 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">ID</div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-text)]">{appName}</div>
          <div className="text-xs text-[var(--color-text-muted)]">Enterprise workspace</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="mx-auto flex w-full max-w-xl items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-2 text-left text-sm text-[var(--color-text-muted)]"
      >
        <span>Search or type a command...</span>
        <span className="rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-xs">Ctrl K</span>
      </button>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenHelp} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]">
          Help
        </button>
        {rightSlot}
      </div>
    </header>
  );
}
