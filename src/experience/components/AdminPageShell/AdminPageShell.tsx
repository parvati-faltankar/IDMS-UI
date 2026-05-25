import { AlertTriangle, XCircle } from 'lucide-react';
import { PageHeader } from '../PageHeader/PageHeader';
import type { AdminPageShellProps, AdminPageShellSummaryItem, AdminPageShellHealthStatus } from './AdminPageShell.types';

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ items }: { items: AdminPageShellSummaryItem[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--color-text)',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Setup health strip ───────────────────────────────────────────────────────

function HealthStrip({ tone, message, actionLabel, onAction }: AdminPageShellHealthStatus) {
  const isError = tone === 'error';
  const bg = isError
    ? 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))'
    : 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))';
  const borderColor = isError
    ? 'color-mix(in srgb, var(--color-danger) 30%, var(--color-border))'
    : 'color-mix(in srgb, #f59e0b 30%, var(--color-border))';
  const textColor = isError ? 'var(--color-danger)' : '#92400e';
  const Icon = isError ? XCircle : AlertTriangle;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        background: bg,
        marginBottom: '16px',
        fontSize: '13px',
        color: textColor,
      }}
    >
      <Icon size={15} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: textColor,
            background: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            padding: '3px 10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── AdminPageShell ──────────────────────────────────────────────────────────

/**
 * AdminPageShell — the standard layout wrapper for every admin page.
 *
 * Renders the approved layer stack:
 *   PageHeader → [setup health] → [summary strip] → [toolbar] → children
 *
 * Does not render a global header or sidebar — those are owned by AdminShell.
 * Does not render a HelpDrawer — the page must manage help state and render
 * its own HelpDrawer with the provided `onHelpClick` callback.
 */
export function AdminPageShell({
  title,
  description,
  breadcrumbs,
  statusLabel,
  statusTone,
  primaryAction,
  secondaryActions,
  helpTopicId,
  onHelpClick,
  summaryItems,
  setupHealth,
  maxContentWidth,
  toolbar,
  children,
}: AdminPageShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* PageHeader — padded to match px-6 pt-6 page convention */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--color-surface)',
          padding: '24px 24px 0',
        }}
      >
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          statusLabel={statusLabel}
          statusTone={statusTone}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          helpTopicId={helpTopicId}
          onHelpClick={onHelpClick}
        />
      </div>

      {/* Setup health strip — only when a blocking gap exists */}
      {setupHealth && (
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-surface)',
            padding: '0 24px 12px',
          }}
        >
          <HealthStrip {...setupHealth} />
        </div>
      )}

      {/* Summary metric strip — only when items are provided */}
      {summaryItems && summaryItems.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '6px 24px 14px',
          }}
        >
          <SummaryStrip items={summaryItems} />
        </div>
      )}

      {/* Toolbar slot — search, filter chips, quick actions */}
      {toolbar && (
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {toolbar}
        </div>
      )}

      {/* Scrollable main content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px 32px',
        }}
      >
        {maxContentWidth ? (
          <div
            style={{
              maxWidth: maxContentWidth,
              width: '100%',
              margin: '0 auto',
            }}
          >
            {children}
          </div>
        ) : children}
      </div>
    </div>
  );
}
