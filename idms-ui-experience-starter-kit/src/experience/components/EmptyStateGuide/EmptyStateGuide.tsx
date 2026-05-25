import type { EmptyStateGuideProps } from "./EmptyStateGuide.types";

export function EmptyStateGuide({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateGuideProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-xl">
        ✦
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {secondaryActionLabel && (
            <button type="button" onClick={onSecondaryAction} className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium">
              {secondaryActionLabel}
            </button>
          )}
          {primaryActionLabel && (
            <button type="button" onClick={onPrimaryAction} className="rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-white">
              {primaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
