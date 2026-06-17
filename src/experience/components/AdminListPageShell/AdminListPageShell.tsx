import React from 'react';
import { Filter, HelpCircle, X } from 'lucide-react';
import type {
  AdminListPageShellProps,
  AdminListQuickFilter,
  AdminListSummaryItem,
} from './AdminListPageShell.types';
import type { PageHeaderAction } from '../PageHeader/PageHeader.types';

const TONE_COLORS: Record<NonNullable<AdminListSummaryItem['tone']>, string> = {
  neutral: 'var(--color-text)',
  success: 'color-mix(in srgb, #10b981 80%, var(--color-text))',
  warning: 'color-mix(in srgb, #f59e0b 75%, var(--color-text))',
  danger: 'var(--color-danger)',
};

function ActionButton({
  action,
  primary = false,
}: {
  action: PageHeaderAction;
  primary?: boolean;
}) {
  const iconOnly = !primary && action.iconOnly;
  const isActive = !primary && !!action.active;

  const style: React.CSSProperties = primary
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: '36px',
        padding: '0 16px',
        borderRadius: '10px',
        border: '1px solid var(--color-primary)',
        background: 'var(--color-primary)',
        color: 'var(--color-primary-contrast, white)',
        fontSize: '13px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'opacity 0.15s ease',
        flexShrink: 0,
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconOnly ? '0' : '6px',
        height: '36px',
        width: iconOnly ? '36px' : undefined,
        minWidth: iconOnly ? '36px' : undefined,
        padding: iconOnly ? '0' : '0 12px',
        borderRadius: '10px',
        border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isActive
          ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
          : 'var(--color-surface)',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        flexShrink: 0,
      };

  if (action.href) {
    return (
      <a
        href={action.href}
        style={style}
        title={action.title ?? action.label}
        aria-label={action.title ?? action.label}
      >
        {action.icon}
        {!iconOnly && action.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      style={style}
      title={action.title ?? action.label}
      aria-label={action.title ?? action.label}
    >
      {action.icon}
      {!iconOnly && action.label}
    </button>
  );
}

function SummarySegment({ items }: { items: AdminListSummaryItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: '14px',
        rowGap: '6px',
      }}
    >
      {items.map(({ label, value, tone = 'neutral' }) => (
        <span
          key={label}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '5px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              lineHeight: 1,
              color: TONE_COLORS[tone],
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            {label}
          </span>
        </span>
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
        gap: '5px',
        height: '30px',
        padding: '0 12px',
        borderRadius: '9999px',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active
          ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
          : 'var(--color-surface)',
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      {item.label}
      {item.count !== undefined && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            opacity: 0.9,
          }}
        >
          {item.count}
        </span>
      )}
    </button>
  );
}

export function AdminListToolbarButton({
  label,
  onClick,
  icon,
  active = false,
  indicator = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  active?: boolean;
  indicator?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 12px',
        height: '34px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '8px',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: active
          ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
          : 'var(--color-surface)',
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        flexShrink: 0,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {icon}
      <span>{label}</span>
      {indicator ? (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
            opacity: 0.9,
          }}
        />
      ) : null}
    </button>
  );
}

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
  searchPlaceholder = 'Search...',
  onSearchChange,
  quickFilterItems = [],
  activeQuickFilter,
  onQuickFilterChange,
  advancedFilterActive = false,
  onAdvancedFilterClick,
  toolbarActions,
  toolbarActionsPlacement = 'auto',
  children,
  density = 'default',
}: AdminListPageShellProps) {
  const isCompact = density === 'compact';
  const hasSearch = onSearchChange !== undefined || searchValue !== undefined;
  const hasSummary = summaryItems.length > 0;
  const hasQuickFilters = quickFilterItems.length > 0;
  const hasAdvancedFilter = onAdvancedFilterClick !== undefined;
  const hasActionRail = !!primaryAction || secondaryActions.length > 0 || (!!helpTopicId && !!onHelpClick);
  const hasAuxiliaryContent = hasSummary || hasQuickFilters || hasAdvancedFilter;

  const resolvedToolbarActionsPlacement =
    toolbarActionsPlacement === 'auto'
      ? hasAuxiliaryContent
        ? 'toolbar'
        : 'command'
      : toolbarActionsPlacement;

  const commandToolbarActions =
    toolbarActions && resolvedToolbarActionsPlacement === 'command' ? toolbarActions : null;
  const auxiliaryToolbarActions =
    toolbarActions && resolvedToolbarActionsPlacement === 'toolbar' ? toolbarActions : null;

  const hasCommandRow = hasSearch || hasActionRail || !!commandToolbarActions;
  const hasToolbarRow = hasAuxiliaryContent || !!auxiliaryToolbarActions;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderBottom: hasToolbarRow ? 'none' : '1px solid var(--color-border)',
          padding: isCompact ? '12px 24px 10px' : '16px 24px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: description ? '8px' : '6px',
            minWidth: 0,
          }}
        >
          {breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                lineHeight: 1.2,
              }}
            >
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb}-${index}`}>
                  {index > 0 && (
                    <span aria-hidden="true" style={{ opacity: 0.55 }}>
                      /
                    </span>
                  )}
                  <span>{crumb}</span>
                </React.Fragment>
              ))}
            </nav>
          )}

          <h1
            style={{
              margin: 0,
              fontSize: isCompact ? '15px' : '16px',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.45,
                color: 'var(--color-text-muted)',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {hasCommandRow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isCompact ? '12px' : '16px',
              flexWrap: 'wrap',
              marginTop: description ? '12px' : '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: hasSearch ? '1 1 360px' : '1 1 auto',
                minWidth: hasSearch ? '220px' : '0',
              }}
            >
              {hasSearch && (
                <div
                  style={{
                    position: 'relative',
                    flex: '1 1 420px',
                    maxWidth: hasActionRail ? '560px' : '680px',
                    minWidth: '220px',
                  }}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      position: 'absolute',
                      left: '12px',
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
                    onChange={(event) => onSearchChange?.(event.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    style={{
                      width: '100%',
                      height: '36px',
                      paddingLeft: '36px',
                      paddingRight: searchValue ? '34px' : '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      background: 'var(--color-surface-subtle)',
                      color: 'var(--color-text)',
                      fontSize: '13px',
                      lineHeight: 1.2,
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
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                flexWrap: 'wrap',
                marginLeft: 'auto',
                minWidth: 0,
              }}
            >
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
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <HelpCircle size={15} />
                </button>
              )}

              {secondaryActions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}

              {primaryAction && <ActionButton action={primaryAction} primary />}
              {commandToolbarActions}
            </div>
          </div>
        )}
      </div>

      {hasToolbarRow && (
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            padding: isCompact ? '8px 24px' : '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            minHeight: isCompact ? '44px' : '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            {hasSummary && <SummarySegment items={summaryItems} />}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              marginLeft: 'auto',
              minWidth: 0,
            }}
          >
            {hasQuickFilters && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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

            {hasAdvancedFilter && (
              <button
                type="button"
                onClick={onAdvancedFilterClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: `1px solid ${
                    advancedFilterActive ? 'var(--color-primary)' : 'var(--color-border)'
                  }`,
                  background: advancedFilterActive
                    ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
                    : 'var(--color-surface)',
                  color: advancedFilterActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <Filter size={13} />
                Filters
                {advancedFilterActive && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '7px',
                      right: '7px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                    }}
                  />
                )}
              </button>
            )}

            {auxiliaryToolbarActions}
          </div>
        </div>
      )}

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
