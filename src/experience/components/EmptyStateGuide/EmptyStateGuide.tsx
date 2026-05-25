import type { EmptyStateGuideProps } from './EmptyStateGuide.types';

/**
 * EmptyStateGuide — shown when a list, panel, or section has no data yet.
 *
 * Use to communicate what is empty, why it matters, and what the user should
 * do next. Supports an optional compact mode for use inside section tabs.
 *
 * Do not use as a loading skeleton or error state — use dedicated components
 * for those cases.
 */
export function EmptyStateGuide({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}: EmptyStateGuideProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-dashed border-[var(--color-border)]',
        'bg-[var(--color-surface)] text-center',
        compact ? 'p-5' : 'p-8',
      ].join(' ')}
    >
      {/* Icon spot */}
      <div
        className={[
          'mx-auto mb-4 flex items-center justify-center rounded-2xl',
          'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]',
          compact ? 'h-9 w-9 text-base' : 'h-12 w-12 text-xl',
        ].join(' ')}
        aria-hidden="true"
      >
        ✦
      </div>

      {/* Heading */}
      <h3
        className={[
          'font-semibold text-[var(--color-text)]',
          compact ? 'text-sm' : 'text-base',
        ].join(' ')}
      >
        {title}
      </h3>

      {/* Body */}
      <p
        className={[
          'mx-auto mt-2 max-w-xl leading-6 text-[var(--color-text-muted)]',
          compact ? 'text-xs' : 'text-sm',
        ].join(' ')}
      >
        {description}
      </p>

      {/* Actions */}
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className={['flex flex-wrap justify-center gap-2', compact ? 'mt-4' : 'mt-5'].join(' ')}>
          {secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
          {primaryActionLabel && (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-[var(--color-primary-contrast)] hover:opacity-90 transition-opacity"
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
