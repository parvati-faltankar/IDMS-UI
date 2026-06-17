import { ChevronDown } from 'lucide-react';
import React from 'react';

export type MasterFormAccordionSectionState = 'default' | 'complete' | 'error' | 'partial';

type MasterFormAccordionSectionProps = {
  title: string;
  description?: string;
  summary?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  state?: MasterFormAccordionSectionState;
};

function getAccentColor(state: MasterFormAccordionSectionState) {
  if (state === 'complete') return '#16a34a';
  if (state === 'error') return '#dc2626';
  if (state === 'partial') return '#d97706';
  return 'var(--color-primary)';
}

export function MasterFormAccordionSection({
  title,
  description,
  summary,
  actions,
  children,
  defaultOpen = false,
  open,
  onToggle,
  state = 'default',
}: MasterFormAccordionSectionProps) {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const accentColor = getAccentColor(state);

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  return (
    <section
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--color-surface)',
        marginBottom: '16px',
        boxShadow: isOpen ? '0 8px 24px rgba(15, 23, 42, 0.05)' : 'none',
      }}
    >
      <div
        style={{
          borderLeft: `3px solid ${isOpen ? accentColor : 'transparent'}`,
          background: 'var(--color-surface)',
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: 0,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: 'var(--color-text)',
                }}
              >
                {title}
              </h2>
              {state !== 'default' && (
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
              )}
            </div>
            {description && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  lineHeight: 1.45,
                  color: 'var(--color-text-muted)',
                }}
              >
                {description}
              </p>
            )}
            {!isOpen && summary && (
              <div style={{ marginTop: '8px', minWidth: 0 }}>
                {summary}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {actions}
            <span
              aria-hidden="true"
              style={{
                width: '28px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text-muted)',
              }}
            >
              <ChevronDown
                size={16}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </span>
          </div>
        </button>
      </div>
      {isOpen && (
        <div
          style={{
            padding: '0 20px 20px',
            background: 'var(--color-surface)',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
