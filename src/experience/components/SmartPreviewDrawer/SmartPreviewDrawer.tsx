import React from 'react';
import { SmartDrawer } from '../SmartDrawer/SmartDrawer';
import type { SmartDrawerAction } from '../SmartDrawer/SmartDrawer.types';
import type { SmartPreviewDrawerProps, PreviewField } from './SmartPreviewDrawer.types';

// ─── Field grid ───────────────────────────────────────────────────────────────

const FieldGrid: React.FC<{ fields: PreviewField[] }> = ({ fields }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
    {fields.map((f, i) => (
      <div key={i} style={{ gridColumn: f.span === 2 ? 'span 2' : undefined }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {f.label}
        </div>
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: f.muted ? 'var(--color-text-muted)' : 'var(--color-text)',
          fontFamily: f.mono ? 'monospace' : undefined,
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}>
          {f.value ?? '—'}
        </div>
      </div>
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const SmartPreviewDrawer: React.FC<SmartPreviewDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  statusLabel,
  statusTone,
  summaryFields = [],
  sections = [],
  primaryAction,
  secondaryActions = [],
  dangerAction,
  loading = false,
  emptyLabel = 'No details available.',
}) => {
  // Build footer actions: secondary ... [danger] ... [primary]
  const footerActions: SmartDrawerAction[] = [
    ...secondaryActions,
    ...(dangerAction ? [{ ...dangerAction, tone: 'danger' as const }] : []),
    ...(primaryAction ? [{ ...primaryAction, tone: 'primary' as const }] : []),
    ...(!primaryAction && !dangerAction && secondaryActions.length === 0
      ? [{ label: 'Close', tone: 'outline' as const, onClick: onClose }]
      : []),
  ];

  const isEmpty = !loading && summaryFields.length === 0 && sections.length === 0;

  return (
    <SmartDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      statusLabel={statusLabel}
      statusTone={statusTone}
      width="lg"
      loading={loading}
      footerActions={footerActions}
    >
      {isEmpty ? (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{emptyLabel}</div>
        </div>
      ) : (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary fields */}
          {summaryFields.length > 0 && (
            <FieldGrid fields={summaryFields} />
          )}

          {/* Sections */}
          {sections.map((section, si) => (
            <div key={si} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                padding: '9px 16px',
                background: 'var(--color-surface-subtle)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {section.title}
                </span>
              </div>
              <div style={{ padding: '16px' }}>
                <FieldGrid fields={section.fields} />
                {section.note && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {section.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SmartDrawer>
  );
};
