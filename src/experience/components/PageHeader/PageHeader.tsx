import type React from 'react';
import type { PageHeaderAction, PageHeaderProps } from './PageHeader.types';

function statusStyle(tone: PageHeaderProps['statusTone'] = 'neutral'): React.CSSProperties {
  if (tone === 'active') return {
    borderColor: 'color-mix(in srgb, #10b981 35%, var(--color-border))',
    background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))',
    color: 'color-mix(in srgb, #10b981 85%, var(--color-text))',
  };
  if (tone === 'draft') return {
    borderColor: 'var(--color-border)',
    background: 'var(--color-surface-subtle)',
    color: 'var(--color-text-muted)',
  };
  if (tone === 'warning') return {
    borderColor: 'color-mix(in srgb, #f59e0b 35%, var(--color-border))',
    background: 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))',
    color: 'color-mix(in srgb, #f59e0b 80%, var(--color-text))',
  };
  if (tone === 'danger') return {
    borderColor: 'color-mix(in srgb, var(--color-danger) 35%, var(--color-border))',
    background: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))',
    color: 'var(--color-danger)',
  };
  return {
    borderColor: 'var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-muted)',
  };
}

function actionClassName(tone: PageHeaderAction['tone'] = 'secondary') {
  if (tone === 'primary') {
    return 'bg-[var(--color-primary)] text-white border-transparent hover:opacity-90';
  }
  if (tone === 'ghost') {
    return 'border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]';
  }
  return 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]';
}

function ActionButton({ action }: { action: PageHeaderAction }) {
  const className = `rounded-lg border px-3.5 py-2 text-sm font-medium transition ${actionClassName(action.tone)}`;

  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  statusLabel,
  statusTone = 'neutral',
  primaryAction,
  secondaryActions = [],
  helpTopicId,
  onHelpClick,
}: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-[var(--color-border)] pb-5">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-[var(--color-text-muted)]">
          {breadcrumbs.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 && <span className="mx-2">/</span>}
              <span>{item}</span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </h1>
            {statusLabel && (
              <span
                className="rounded-full border px-2.5 py-1 text-xs font-medium"
                style={statusStyle(statusTone)}
              >
                {statusLabel}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {helpTopicId && onHelpClick && (
            <button
              type="button"
              onClick={() => onHelpClick(helpTopicId)}
              className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
            >
              How this works
            </button>
          )}
          {secondaryActions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
          {primaryAction && (
            <ActionButton action={{ ...primaryAction, tone: primaryAction.tone ?? 'primary' }} />
          )}
        </div>
      </div>
    </header>
  );
}
