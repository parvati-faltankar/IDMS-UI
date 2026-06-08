import React from 'react';
import { Filter, HelpCircle, X } from 'lucide-react';
import type {
  AdminListPageShellProps,
  AdminListSummaryItem,
  AdminListQuickFilter,
} from './AdminListPageShell.types';
import type { PageHeaderAction } from '../PageHeader/PageHeader.types';

// ─── Tone palette for summary item values ─────────────────────────────────────

const TONE_COLORS: Record<NonNullable<AdminListSummaryItem['tone']>, string> = {
  neutral: 'var(--color-text)',
  success: 'color-mix(in srgb, #10b981 80%, var(--color-text))',
  warning: 'color-mix(in srgb, #f59e0b 75%, var(--color-text))',
  danger:  'var(--color-danger)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({
  action,
  primary = false,
}: {
  action: PageHeaderAction;
  primary?: boolean;
}) {
  const style: React.CSSProperties = primary
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '32px',
        padding: '0 14px',
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: '8px',
        border: 'none',
        background: 'var(--color-primary)',
        color: 'var(--color-primary-contrast, white)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
        textDecoration: 'none',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '32px',
        padding: '0 12px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        background: 'transparent',
        color: 'var(--color-text)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
        textDecoration: 'none',
      };

  if (action.href) {
    return (
      <a href={action.href} style={style}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} style={style}>
      {action.label}
    </button>
  );
}

function SummarySegment({ items }: { items: AdminListSummaryItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        flexWrap: 'wrap',
        rowGap: '4px',
      }}
    >
      {items.map(({ label, value, tone = 'neutral' }, i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <span
              aria-hidden="true"
              style={{
                margin: '0 10px',
                color: 'var(--color-border)',
                fontWeight: 400,
                fontSize: '13px',
                userSelect: 'none',
              }}
            >
              ·
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: TONE_COLORS[tone],
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
                letterSpacing: '0.03em',
              }}
            >
              {label}
            </span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function QuickFilterChip({
  item,
  active,
  onClick,
}: {
  item: AdminListQuickFilter;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 11px',
        height: '28px',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        borderRadius: '9999px',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active
          ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))'
          : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {item.label}
      {item.count !== undefined && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            opacity: 0.85,
          }}
        >
          {item.count}
        </span>
      )}
    </button>
  );
}

// ─── AdminListPageShell ───────────────────────────────────────────────────────

/**
 * AdminListPageShell — compact, productivity-first layout for admin list/table pages.
 *
 * Renders the approved compact stack:
 *   PageBar (breadcrumbs → title + actions → optional description)
 *   SmartToolbar (summary stats | search + filters + toolbar actions)
 *   Scrollable content area (table / children)
 *
 * Design targets:
 * - On a 1366 × 768 viewport the user sees: title, toolbar, table header, and
 *   at least 4 data rows — without any visible scroll.
 * - Total height consumed before the table: ≤ 130px above the content area.
 *
 * Does NOT render:
 * - Global header or admin sidebar (those are owned by AdminShell)
 * - HelpDrawer (caller manages help state and renders its own HelpDrawer)
 * - CommandPalette
 * - Large marketing-style title blocks
 */
export function AdminListPageShell({
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  secondaryActions = [],
  helpTopicId,
  onHelpClick,
  summaryItems = [],
  searchValue,
  searchPlaceholder = 'Search…',
  onSearchChange,
  quickFilterItems = [],
  activeQuickFilter,
  onQuickFilterChange,
  advancedFilterActive = false,
  onAdvancedFilterClick,
  toolbarActions,
  children,
  density = 'default',
}: AdminListPageShellProps) {
  const isCompact = density === 'compact';

  // ─── PageBar ──────────────────────────────────────────────────────────────

  const pagebar = (
    <div
      style={{
        flexShrink: 0,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: isCompact ? '8px 24px 8px' : '12px 24px 10px',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            marginBottom: '4px',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap',
          }}
        >
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`${crumb}-${i}`}>
              {i > 0 && (
                <span aria-hidden="true" style={{ opacity: 0.5 }}>
                  /
                </span>
              )}
              <span>{crumb}</span>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row: heading + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        {/* Heading */}
        <h1
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            fontSize: isCompact ? '15px' : '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: '1.25',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>

        {/* Action group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {/* Help button */}
          {helpTopicId && onHelpClick && (
            <button
              type="button"
              title="How this works"
              aria-label="Open help"
              onClick={() => onHelpClick(helpTopicId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              <HelpCircle size={14} />
            </button>
          )}

          {/* Secondary actions */}
          {secondaryActions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}

          {/* Primary action */}
          {primaryAction && <ActionButton action={primaryAction} primary />}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            marginTop: '3px',
            marginBottom: 0,
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: '1.5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );

  // ─── SmartToolbar ─────────────────────────────────────────────────────────

  const hasToolbar =
    summaryItems.length > 0 ||
    onSearchChange !== undefined ||
    searchValue !== undefined ||
    quickFilterItems.length > 0 ||
    onAdvancedFilterClick !== undefined ||
    toolbarActions !== undefined;

  const toolbar = hasToolbar ? (
    <div
      style={{
        flexShrink: 0,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: isCompact ? '6px 24px' : '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        minHeight: isCompact ? '40px' : '44px',
      }}
    >
      {/* Left: summary segment */}
      {summaryItems.length > 0 && (
        <>
          <SummarySegment items={summaryItems} />
          {/* Divider between summary and search/filter segments */}
          {(onSearchChange !== undefined ||
            searchValue !== undefined ||
            quickFilterItems.length > 0 ||
            onAdvancedFilterClick !== undefined ||
            toolbarActions !== undefined) && (
            <div
              aria-hidden="true"
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--color-border)',
                flexShrink: 0,
              }}
            />
          )}
        </>
      )}

      {/* Right: search + filters + actions — pushes to the right when there's a summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          flex: summaryItems.length > 0 ? '1 1 auto' : undefined,
          justifyContent: summaryItems.length > 0 ? 'flex-end' : undefined,
        }}
      >
        {/* Search input */}
        {(onSearchChange !== undefined || searchValue !== undefined) && (
          <div style={{ position: 'relative', flex: '0 1 240px', minWidth: '140px' }}>
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              style={{
                width: '100%',
                height: '30px',
                paddingLeft: '28px',
                paddingRight: searchValue ? '28px' : '10px',
                fontSize: '12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 0,
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {/* Quick filter chips */}
        {quickFilterItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
            }}
          >
            {quickFilterItems.map((item) => (
              <QuickFilterChip
                key={item.key}
                item={item}
                active={activeQuickFilter === item.key}
                onClick={() => onQuickFilterChange?.(item.key)}
              />
            ))}
          </div>
        )}

        {/* Advanced filter button */}
        {onAdvancedFilterClick && (
          <button
            type="button"
            onClick={onAdvancedFilterClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              height: '30px',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '8px',
              border: `1px solid ${advancedFilterActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: advancedFilterActive
                ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
                : 'transparent',
              color: advancedFilterActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            <Filter size={11} />
            Filters
            {advancedFilterActive && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                }}
              />
            )}
          </button>
        )}

        {/* Extra toolbar actions */}
        {toolbarActions}
      </div>
    </div>
  ) : null;

  // ─── Root ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {pagebar}
      {toolbar}

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isCompact ? '12px 24px 24px' : '16px 24px 32px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
