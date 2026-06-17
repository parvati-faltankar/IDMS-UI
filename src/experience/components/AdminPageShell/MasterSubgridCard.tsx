import type React from 'react';
import type { MasterFormAccordionSectionState } from './MasterFormAccordionSection';
import { MasterFormSectionSummary } from './MasterFormSectionSummary';

type MasterSubgridCardProps = {
  title: string;
  emptyText: string;
  addLabel?: string;
  onAdd?: () => void;
  isEmpty: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  state?: MasterFormAccordionSectionState;
  summaryItems?: Array<React.ReactNode | null | undefined | false>;
  children?: React.ReactNode;
};

export function MasterSubgridCard({
  title,
  emptyText,
  addLabel,
  onAdd,
  isEmpty,
  open,
  onToggle,
  state = 'default',
  summaryItems = [],
  children,
}: MasterSubgridCardProps) {
  const derivedSummary = summaryItems.length > 0
    ? summaryItems
    : [
        'Review and manage entries.',
      ];
  void open;
  void onToggle;

  const accentColor =
    state === 'complete'
      ? '#16a34a'
      : state === 'error'
        ? '#dc2626'
        : state === 'partial'
          ? '#d97706'
          : 'var(--color-primary)';

  return (
    <section
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        background: 'var(--color-surface)',
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          padding: '14px 18px 10px',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  lineHeight: 1.35,
                }}
              >
                {title}
              </h2>
              <span
                aria-hidden="true"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: accentColor,
                  flexShrink: 0,
                }}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <MasterFormSectionSummary items={derivedSummary} />
            </div>
          </div>
          {onAdd && addLabel && (
            <button
              type="button"
              onClick={onAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0',
                height: '24px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '0',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span aria-hidden="true">+</span>
              {addLabel}
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
      {isEmpty ? (
        <div style={{ padding: '24px 0 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {emptyText}
        </div>
      ) : (
        <div>{children}</div>
      )}
      </div>
    </section>
  );
}
