import { X } from 'lucide-react';
import React, { useState } from 'react';
import { HeaderIconButton } from '../PageHeader/HeaderIconButton';

export type MasterFormStepState = 'default' | 'current' | 'complete' | 'partial' | 'disabled';
export type MasterFormStepperMode = 'expanded' | 'collapsed' | 'drawer';

export type MasterFormStep = {
  id: string;
  label: string;
  description?: string;
  count?: number;
  disabled?: boolean;
  state?: MasterFormStepState;
  icon?: React.ReactNode;
  tooltipLabel?: string;
};

type MasterFormStepperProps = {
  steps: MasterFormStep[];
  activeStepId: string;
  onStepChange?: (stepId: string) => void;
  mode?: MasterFormStepperMode;
  onRequestClose?: () => void;
};

function getStepColors(state: MasterFormStepState, active: boolean) {
  if (active || state === 'current') {
    return {
      border: 'var(--color-primary)',
      dot: 'var(--color-primary)',
      text: 'var(--color-text)',
      bg: 'color-mix(in srgb, var(--color-primary) 7%, var(--color-surface))',
    };
  }
  if (state === 'complete') {
    return {
      border: 'transparent',
      dot: '#16a34a',
      text: 'var(--color-text)',
      bg: 'var(--color-surface)',
    };
  }
  if (state === 'partial') {
    return {
      border: 'transparent',
      dot: '#f59e0b',
      text: 'var(--color-text)',
      bg: 'var(--color-surface)',
    };
  }
  if (state === 'disabled') {
    return {
      border: 'transparent',
      dot: 'var(--color-border)',
      text: 'var(--color-text-muted)',
      bg: 'var(--color-surface)',
    };
  }
  return {
    border: 'transparent',
    dot: 'var(--color-text-muted)',
    text: 'var(--color-text)',
    bg: 'var(--color-surface)',
  };
}

export function MasterFormStepper({
  steps,
  activeStepId,
  onStepChange,
  mode = 'expanded',
  onRequestClose,
}: MasterFormStepperProps) {
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    id: string;
    label: string;
    top: number;
    left: number;
  } | null>(null);

  const showTooltip = (step: MasterFormStep, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();
    setHoveredTooltip({
      id: step.id,
      label: step.tooltipLabel ?? step.label,
      top: rect.top + (rect.height / 2),
      left: rect.right + 12,
    });
  };

  if (mode === 'collapsed') {
    return (
      <>
        <nav
          aria-label="Form sections"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 10px',
          }}
        >
          {steps.map((step, index) => {
            const active = step.id === activeStepId;
            const state: MasterFormStepState = step.disabled ? 'disabled' : (step.state ?? 'default');
            const colors = getStepColors(state, active);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => !step.disabled && onStepChange?.(step.id)}
                disabled={step.disabled}
                aria-current={active ? 'step' : undefined}
                aria-label={step.tooltipLabel ?? step.label}
                onMouseEnter={(event) => showTooltip(step, event.currentTarget)}
                onMouseLeave={() => setHoveredTooltip((current) => (current?.id === step.id ? null : current))}
                onFocus={(event) => showTooltip(step, event.currentTarget)}
                onBlur={() => setHoveredTooltip((current) => (current?.id === step.id ? null : current))}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                style={{
                  width: '48px',
                  height: '48px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  border: active ? `1px solid ${colors.border}` : '1px solid transparent',
                  background: colors.bg,
                  color: colors.text,
                  cursor: step.disabled ? 'not-allowed' : 'pointer',
                  opacity: step.disabled ? 0.72 : 1,
                  flexShrink: 0,
                  transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
                }}
              >
                {step.icon ?? (
                  <span style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>
                    {index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        {hoveredTooltip && (
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              left: hoveredTooltip.left,
              top: hoveredTooltip.top,
              transform: 'translateY(-50%)',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.14)',
              color: 'var(--color-text)',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            {hoveredTooltip.label}
          </div>
        )}
      </>
    );
  }

  return (
    <nav aria-label="Form sections" style={{ padding: mode === 'drawer' ? '0' : '16px 0' }}>
      {mode === 'drawer' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '18px 18px 10px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              Sections
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Jump across applicable form steps.
            </div>
          </div>
          {onRequestClose && (
            <HeaderIconButton
              icon={<X size={18} />}
              onClick={onRequestClose}
              title="Close sections"
            />
          )}
        </div>
      )}
      {steps.map((step, index) => {
        const active = step.id === activeStepId;
        const state: MasterFormStepState = step.disabled ? 'disabled' : (step.state ?? 'default');
        const colors = getStepColors(state, active);

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              if (step.disabled) return;
              onStepChange?.(step.id);
              if (mode === 'drawer') onRequestClose?.();
            }}
            disabled={step.disabled}
            aria-current={active ? 'step' : undefined}
            title={step.tooltipLabel ?? step.label}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 18px',
              background: colors.bg,
              border: 'none',
              borderLeft: `4px solid ${colors.border}`,
              cursor: step.disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              opacity: step.disabled ? 0.72 : 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                marginTop: '2px',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                borderRadius: '8px',
                background: active
                  ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))'
                  : 'var(--color-surface-subtle)',
                color: active ? 'var(--color-primary)' : colors.dot,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step.icon ?? (
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '9999px',
                    background: colors.dot,
                    display: 'inline-block',
                  }}
                />
              )}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: 'rgb(24, 24, 24)',
                      lineHeight: 1.3,
                    }}
                  >
                    {step.label}
                  </span>
                </span>
                {typeof step.count === 'number' && (
                  <span
                    style={{
                      minWidth: '24px',
                      height: '24px',
                      padding: '0 8px',
                      borderRadius: '9999px',
                      border: '1px solid var(--color-border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-surface)',
                      flexShrink: 0,
                    }}
                  >
                    {step.count}
                  </span>
                )}
              </span>
              {step.description && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '4px',
                    fontSize: '12px',
                    lineHeight: 1.45,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {step.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
