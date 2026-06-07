// ─── DerivedValueDisplay ──────────────────────────────────────────────────────
//
// Shows a read-only derived/computed value with an optional source explanation.
// Used wherever a field is automatically computed from user inputs and must
// never be directly edited (e.g. binManaged derived from inventoryControlMode).

import React from 'react';
import { Lock, Info } from 'lucide-react';

export interface DerivedValueDisplayProps {
  /** Displayed field label */
  label: string;
  /** The derived/computed value to display */
  value: React.ReactNode;
  /** Short explanation of how the value is derived */
  derivedFrom?: string;
  /** Optional tooltip/detail to explain the lock reason */
  lockReason?: string;
  /** When true renders in a compact single-row layout */
  compact?: boolean;
  /** Optional testid override */
  testId?: string;
}

export function DerivedValueDisplay({
  label,
  value,
  derivedFrom,
  lockReason,
  compact = false,
  testId,
}: DerivedValueDisplayProps) {
  if (compact) {
    return (
      <div
        data-testid={testId ?? 'derived-value'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          background: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        <Lock size={11} style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{label}:</span>
        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{value}</span>
        {derivedFrom && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            ({derivedFrom})
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid={testId ?? 'derived-value'}
      style={{
        padding: '10px 14px',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '4px',
        }}
      >
        <Lock size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
          }}
        >
          auto-derived
        </span>
      </div>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--color-text)',
          lineHeight: 1.4,
        }}
      >
        {value}
      </div>
      {(derivedFrom || lockReason) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '5px',
            marginTop: '5px',
          }}
        >
          <Info size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
            {derivedFrom}
            {derivedFrom && lockReason && ' — '}
            {lockReason}
          </span>
        </div>
      )}
    </div>
  );
}
