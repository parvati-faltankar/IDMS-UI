import { AlertTriangle, ChevronLeft, ChevronRight, PanelLeftOpen, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader';
import { HeaderIconButton } from '../PageHeader/HeaderIconButton';
import type {
  AdminPageShellHealthStatus,
  AdminPageShellNavigationMode,
  AdminPageShellNavigationRenderProps,
  AdminPageShellProps,
  AdminPageShellSummaryItem,
} from './AdminPageShell.types';

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

export function AdminPageShell({
  title,
  description,
  breadcrumbs,
  statusLabel,
  statusTone,
  backAction,
  primaryAction,
  secondaryActions,
  helpTopicId,
  onHelpClick,
  summaryItems,
  setupHealth,
  maxContentWidth,
  variant = 'default',
  navigationSlot,
  navigationWidth = 240,
  collapsedNavigationWidth = 76,
  navigationPersistenceKey,
  footer,
  contentPadding,
  contentBackground,
  compactHeader,
  helpIconOnly,
  headerVariant,
  toolbar,
  children,
}: AdminPageShellProps) {
  const isMasterForm = variant === 'master-form';
  const isAppBarHeader = headerVariant === 'appbar';
  const useCompactHeader = compactHeader ?? isMasterForm;
  const useHelpIconOnly = helpIconOnly ?? isMasterForm;
  const hasNavigation = Boolean(navigationSlot);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState(false);
  const [isNarrowNavigation, setIsNarrowNavigation] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 1100 : false
  ));
  const resolvedContentPadding = contentPadding ?? (isMasterForm ? '20px 24px 28px' : '16px 24px 32px');
  const resolvedContentBackground = contentBackground
    ?? (isMasterForm ? 'var(--color-surface-subtle)' : 'transparent');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setIsNarrowNavigation(window.innerWidth < 1100);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!navigationPersistenceKey || typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(`admin-page-shell:${navigationPersistenceKey}`);
    if (stored === 'collapsed') {
      setIsNavigationCollapsed(true);
    }
  }, [navigationPersistenceKey]);

  useEffect(() => {
    if (!navigationPersistenceKey || typeof window === 'undefined') return;
    window.localStorage.setItem(
      `admin-page-shell:${navigationPersistenceKey}`,
      isNavigationCollapsed ? 'collapsed' : 'expanded',
    );
  }, [isNavigationCollapsed, navigationPersistenceKey]);

  useEffect(() => {
    if (isNarrowNavigation) {
      setIsNavigationDrawerOpen(false);
    }
  }, [isNarrowNavigation]);

  const navigationMode: AdminPageShellNavigationMode | null = hasNavigation
    ? (isNarrowNavigation ? 'drawer' : isNavigationCollapsed ? 'collapsed' : 'expanded')
    : null;

  const renderNavigation = (mode: AdminPageShellNavigationMode) => {
    if (!navigationSlot) return null;

    if (typeof navigationSlot === 'function') {
      const navigationRenderProps: AdminPageShellNavigationRenderProps = {
        mode,
        closeNavigation: mode === 'drawer' ? () => setIsNavigationDrawerOpen(false) : undefined,
      };

      return navigationSlot(navigationRenderProps);
    }

    return navigationSlot;
  };

  const content = maxContentWidth ? (
    <div
      style={{
        maxWidth: maxContentWidth,
        width: '100%',
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  ) : children;

  const body = hasNavigation ? (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden',
        background: resolvedContentBackground,
      }}
    >
      {!isNarrowNavigation && (
        <div
          style={{
            position: 'relative',
            width: isNavigationCollapsed ? collapsedNavigationWidth : navigationWidth,
            minWidth: isNavigationCollapsed ? collapsedNavigationWidth : navigationWidth,
            transition: 'width 0.18s ease, min-width 0.18s ease',
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '-15px',
              transform: 'translateY(-50%)',
              zIndex: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setIsNavigationCollapsed((collapsed) => !collapsed)}
              title={isNavigationCollapsed ? 'Expand sections' : 'Collapse sections'}
              aria-label={isNavigationCollapsed ? 'Expand sections' : 'Collapse sections'}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '9999px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
              }}
            >
              {isNavigationCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <aside
            style={{
              width: '100%',
              minWidth: '100%',
              height: '100%',
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              overflowY: 'auto',
            }}
          >
          {renderNavigation(isNavigationCollapsed ? 'collapsed' : 'expanded')}
          </aside>
        </div>
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: resolvedContentPadding,
          }}
        >
          {content}
        </div>
        {footer && (
          <div
            style={{
              flexShrink: 0,
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {footer}
          </div>
        )}
      </div>

      {isNarrowNavigation && isNavigationDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.32)',
          }}
          onClick={() => setIsNavigationDrawerOpen(false)}
        >
          <aside
            style={{
              width: 'min(320px, 88vw)',
              maxWidth: '88vw',
              height: '100%',
              background: 'var(--color-surface)',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
              overflowY: 'auto',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {renderNavigation('drawer')}
          </aside>
        </div>
      )}
    </div>
  ) : (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: resolvedContentPadding,
        background: resolvedContentBackground,
      }}
    >
      {content}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          background: 'var(--color-surface)',
          padding: isAppBarHeader
            ? '10px 20px'
            : useCompactHeader
              ? '16px 24px 0'
              : '24px 24px 0',
          boxShadow: isAppBarHeader ? '0 2px 10px rgba(15, 23, 42, 0.08)' : undefined,
          position: isAppBarHeader ? 'relative' : undefined,
          zIndex: isAppBarHeader ? 1 : undefined,
        }}
      >
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          statusLabel={statusLabel}
          statusTone={statusTone}
          backAction={backAction}
          primaryAction={primaryAction}
          secondaryActions={secondaryActions}
          helpTopicId={helpTopicId}
          onHelpClick={onHelpClick}
          compact={useCompactHeader}
          helpIconOnly={useHelpIconOnly}
          headerVariant={headerVariant}
        />
      </div>

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

      {isNarrowNavigation && hasNavigation && !isNavigationDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            left: '16px',
            top: isAppBarHeader ? '72px' : '88px',
            zIndex: 30,
          }}
        >
          <HeaderIconButton
            icon={<PanelLeftOpen size={18} />}
            onClick={() => setIsNavigationDrawerOpen(true)}
            title="Open sections"
          />
        </div>
      )}

      {body}
    </div>
  );
}
