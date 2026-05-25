import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import AppDrawer from '../../../components/app/AppDrawer';
import type { SmartDrawerProps } from './SmartDrawer.types';

// ─── Width map ────────────────────────────────────────────────────────────────

const WIDTH_MAP: Record<NonNullable<SmartDrawerProps['width']>, number> = {
  sm:  400,
  md:  520,
  lg:  680,
  xl:  840,
};

// ─── Status badge style ───────────────────────────────────────────────────────

function statusBadgeStyle(tone: SmartDrawerProps['statusTone']): React.CSSProperties {
  switch (tone) {
    case 'active':   return { background: '#DCFCE7', color: '#15803D', borderColor: '#BBF7D0' };
    case 'draft':    return { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' };
    case 'inactive': return { background: '#F3F4F6', color: '#6B7280', borderColor: '#E5E7EB' };
    case 'warning':  return { background: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' };
    default:         return { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' };
  }
}

// ─── Action button style ──────────────────────────────────────────────────────

function actionBtnStyle(tone: NonNullable<SmartDrawerProps['footerActions']>[0]['tone'] = 'outline'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 600,
    borderRadius: '8px', border: '1px solid', cursor: 'pointer',
    transition: 'opacity 0.12s', whiteSpace: 'nowrap',
  };
  switch (tone) {
    case 'primary':
      return { ...base, background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' };
    case 'danger':
      return { ...base, background: '#DC2626', color: 'white', borderColor: '#DC2626' };
    default: // outline
      return { ...base, background: 'transparent', color: 'var(--color-text)', borderColor: 'var(--color-border)' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SmartDrawer: React.FC<SmartDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  statusLabel,
  statusTone,
  width = 'lg',
  footerActions = [],
  loading = false,
  isDirty = false,
  dirtyWarningText,
  children,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleClose = () => {
    if (isDirty) {
      const message = dirtyWarningText ?? 'You have unsaved changes. Are you sure you want to close without saving?';
      if (!window.confirm(message)) return;
    }
    onClose();
  };

  return (
    <AppDrawer open={open} onClose={handleClose} width={WIDTH_MAP[width]}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-drawer-title"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: '14px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span id="smart-drawer-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
                {title}
              </span>
              {statusLabel && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                  borderRadius: '9999px', border: '1px solid', lineHeight: 1,
                  ...statusBadgeStyle(statusTone),
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', opacity: 0.8, flexShrink: 0 }} />
                  {statusLabel}
                </span>
              )}
            </div>
            {subtitle && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close"
            onClick={handleClose}
            style={{
              flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--color-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[80, 60, 100, 60, 80].map((w, i) => (
                <div key={i} style={{ height: '14px', borderRadius: '6px', background: 'var(--color-surface-subtle)', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            children
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        {footerActions.length > 0 && (
          <div style={{
            flexShrink: 0,
            height: '60px',
            padding: '0 20px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'flex-end',
          }}>
            {footerActions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.title}
                style={{
                  ...actionBtnStyle(action.tone),
                  opacity: action.disabled ? 0.45 : 1,
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppDrawer>
  );
};
