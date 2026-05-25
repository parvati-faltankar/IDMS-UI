import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { SmartDrawer } from '../SmartDrawer/SmartDrawer';
import type { SmartReviewDrawerProps } from './SmartReviewDrawer.types';

export const SmartReviewDrawer: React.FC<SmartReviewDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  description,
  summaryFields = [],
  checklist = [],
  warningText,
  consequenceNote,
  confirmLabel   = 'Confirm & Activate',
  cancelLabel    = 'Cancel',
  onConfirm,
  onCancel,
  confirmDisabled = false,
  loading = false,
}) => {
  const allPassed     = checklist.every(c => c.passed);
  const failCount     = checklist.filter(c => !c.passed).length;
  const handleCancel  = onCancel ?? onClose;

  return (
    <SmartDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width="lg"
      loading={loading}
      footerActions={[
        { label: cancelLabel,  tone: 'outline',  onClick: handleCancel },
        {
          label:    confirmLabel,
          tone:     'primary',
          onClick:  onConfirm,
          disabled: confirmDisabled || !allPassed,
          title:    (!allPassed && checklist.length > 0)
            ? `${failCount} checklist item${failCount !== 1 ? 's' : ''} need attention`
            : undefined,
        },
      ]}
    >
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Description */}
        {description && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>
            {description}
          </p>
        )}

        {/* Summary fields */}
        {summaryFields.length > 0 && (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</span>
            </div>
            <div style={{ padding: '14px 14px', display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '8px', columnGap: '12px' }}>
              {summaryFields.map((f, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{f.label}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{f.value ?? '—'}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              padding: '8px 14px',
              background: 'var(--color-surface-subtle)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Activation Checklist
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: allPassed ? '#15803D' : '#D97706' }}>
                {allPassed
                  ? 'All checks passed'
                  : `${failCount} item${failCount !== 1 ? 's' : ''} need attention`}
              </span>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ flexShrink: 0, marginTop: '1px', color: item.passed ? '#16A34A' : '#D97706' }}>
                    {item.passed ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{item.label}</span>
                    {!item.passed && item.detail && (
                      <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>{item.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning */}
        {warningText && !allPassed && (
          <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={13} style={{ color: '#D97706', marginTop: '1px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.45 }}>{warningText}</span>
          </div>
        )}

        {/* Consequence note */}
        {consequenceNote && (
          <div style={{ padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>{consequenceNote}</span>
          </div>
        )}
      </div>
    </SmartDrawer>
  );
};
