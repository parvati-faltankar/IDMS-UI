import { ArrowLeft, HelpCircle } from 'lucide-react';
import type React from 'react';
import { HeaderIconButton } from './HeaderIconButton';
import type { PageHeaderAction, PageHeaderBadge, PageHeaderProps } from './PageHeader.types';

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
  if (tone === 'danger') {
    return 'border-[color:color-mix(in_srgb,var(--color-danger)_35%,var(--color-border))] text-[var(--color-danger)] hover:bg-[color:color-mix(in_srgb,var(--color-danger)_8%,var(--color-surface))]';
  }
  if (tone === 'ghost') {
    return 'border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]';
  }
  return 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]';
}

function ActionButton({ action }: { action: PageHeaderAction }) {
  if (action.iconOnly && action.icon) {
    return (
      <HeaderIconButton
        icon={action.icon}
        onClick={action.onClick}
        href={action.href}
        title={action.title ?? action.label}
        active={action.active}
      />
    );
  }

  const className = `rounded-[8px] border px-3.5 py-2 text-sm font-medium transition ${actionClassName(action.tone)}`;

  if (action.href) {
    return (
      <a href={action.href} className={className} title={action.title}>
        <span className="inline-flex items-center gap-1.5">
          {action.icon}
          <span>{action.label}</span>
        </span>
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className} title={action.title}>
      <span className="inline-flex items-center gap-1.5">
        {action.icon}
        <span>{action.label}</span>
      </span>
    </button>
  );
}

function Badge({
  badge,
}: {
  badge: PageHeaderBadge;
}) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-xs font-medium"
      style={badge.style ?? statusStyle(badge.tone)}
    >
      {badge.label}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  statusLabel,
  statusTone = 'neutral',
  badges = [],
  backAction,
  primaryAction,
  secondaryActions = [],
  helpTopicId,
  onHelpClick,
  compact = false,
  helpIconOnly = false,
  headerVariant = 'default',
}: PageHeaderProps) {
  const isAppBar = headerVariant === 'appbar';
  const titleClassName = compact
    ? 'text-[18px] font-semibold tracking-tight text-[var(--color-text)]'
    : 'text-2xl font-semibold tracking-tight text-[var(--color-text)]';
  const headerClassName = compact
    ? 'mb-3 border-b border-[var(--color-border)] pb-3'
    : 'mb-6 border-b border-[var(--color-border)] pb-5';
  const breadcrumbClassName = compact
    ? 'mb-0.5 text-xs text-[var(--color-text-muted)]'
    : 'mb-2 text-sm text-[var(--color-text-muted)]';
  const layoutClassName = compact
    ? 'flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between'
    : 'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between';
  const descriptionClassName = compact
    ? 'mt-0 max-w-3xl text-sm leading-5 text-[var(--color-text-muted)]'
    : 'mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]';
  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {helpTopicId && onHelpClick && (
        helpIconOnly ? (
          <HeaderIconButton
            icon={<HelpCircle size={16} />}
            onClick={() => onHelpClick(helpTopicId)}
            title="How this works"
          />
        ) : (
          <button
            type="button"
            onClick={() => onHelpClick(helpTopicId)}
            className="rounded-[8px] border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
          >
            How this works
          </button>
        )
      )}
      {secondaryActions.map((action) => (
        <ActionButton key={action.title ?? action.label} action={action} />
      ))}
      {primaryAction && (
        <ActionButton action={{ ...primaryAction, tone: primaryAction.tone ?? 'primary' }} />
      )}
    </div>
  );

  if (isAppBar) {
    return (
      <header className="m-0 p-0">
        <div className="flex min-h-[36px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {backAction && (
              backAction.href ? (
                <a
                  href={backAction.href}
                  title={backAction.title ?? backAction.label}
                  aria-label={backAction.title ?? backAction.label}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                >
                  <ArrowLeft size={20} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={backAction.onClick}
                  title={backAction.title ?? backAction.label}
                  aria-label={backAction.title ?? backAction.label}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] border-none bg-transparent p-0 text-[var(--color-text)] transition hover:bg-[var(--color-surface-subtle)]"
                >
                  <ArrowLeft size={20} />
                </button>
              )
            )}
            <div className="min-w-0">
              {breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-0.5 text-xs text-[var(--color-text-muted)]">
                  {breadcrumbs.map((item, index) => (
                    <span key={`${item}-${index}`}>
                      {index > 0 && <span className="mx-1.5">/</span>}
                      <span>{item}</span>
                    </span>
                  ))}
                </nav>
              )}
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1
                  className="font-semibold leading-7 text-[var(--color-text)]"
                  style={{ fontSize: '20px' }}
                >
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
                {badges.map((badge) => (
                  <Badge key={badge.label} badge={badge} />
                ))}
              </div>
            </div>
          </div>

          {actions}
        </div>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </header>
    );
  }

  return (
    <header className={headerClassName}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={breadcrumbClassName}>
          {breadcrumbs.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 && <span className="mx-2">/</span>}
              <span>{item}</span>
            </span>
          ))}
        </nav>
      )}

      <div className={layoutClassName}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={titleClassName}>
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
          {badges.map((badge) => (
            <Badge key={badge.label} badge={badge} />
          ))}
        </div>
          {description && (
            <p className={descriptionClassName}>
              {description}
            </p>
          )}
        </div>

        {actions}
      </div>
    </header>
  );
}
