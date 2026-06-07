// ─── ConfigurationImpactBanner ────────────────────────────────────────────────
//
// Displays a contextual impact warning when a high-consequence configuration
// choice is about to change (e.g. switching inventory control mode after data
// exists). Renders a banner with a severity indicator, a headline, and bullet
// impact points. The caller must confirm before the change is applied.

import React from 'react';
import { AlertTriangle, AlertCircle, Info, X, CheckCircle2 } from 'lucide-react';

export type ImpactTone = 'warning' | 'danger' | 'info' | 'success';

export interface ImpactPoint {
  /** Short description of the impact */
  text: string;
  /** Optional — whether this impact is reversible */
  reversible?: boolean;
}

export interface ConfigurationImpactBannerProps {
  /** Severity tone of the banner */
  tone: ImpactTone;
  /** Main headline / title */
  title: string;
  /** Optional longer explanation */
  description?: string;
  /** Bullet list of specific impact points */
  impacts?: ImpactPoint[];
  /** When true, renders dismiss button */
  onDismiss?: () => void;
  /** Optional testid */
  testId?: string;
}

const TONE_CONFIG: Record<
  ImpactTone,
  { bg: string; border: string; icon: React.ElementType; iconColor: string; titleColor: string }
> = {
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: AlertTriangle,
    iconColor: '#D97706',
    titleColor: '#92400E',
  },
  danger: {
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: AlertCircle,
    iconColor: '#DC2626',
    titleColor: '#991B1B',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: Info,
    iconColor: '#2563EB',
    titleColor: '#1E40AF',
  },
  success: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: CheckCircle2,
    iconColor: '#16A34A',
    titleColor: '#14532D',
  },
};

export function ConfigurationImpactBanner({
  tone,
  title,
  description,
  impacts,
  onDismiss,
  testId,
}: ConfigurationImpactBannerProps) {
  const cfg = TONE_CONFIG[tone];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={testId ?? `impact-banner-${tone}`}
      role="alert"
      style={{
        padding: '12px 16px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '10px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <Icon size={16} style={{ color: cfg.iconColor, flexShrink: 0, marginTop: '1px' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: cfg.titleColor,
              lineHeight: 1.35,
            }}
          >
            {title}
          </p>
          {description && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: cfg.titleColor,
                lineHeight: 1.5,
                opacity: 0.85,
              }}
            >
              {description}
            </p>
          )}
          {impacts && impacts.length > 0 && (
            <ul
              style={{
                margin: '8px 0 0',
                padding: '0 0 0 16px',
                listStyle: 'disc',
              }}
            >
              {impacts.map((pt, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '12px',
                    color: cfg.titleColor,
                    opacity: 0.85,
                    marginBottom: '3px',
                    lineHeight: 1.4,
                  }}
                >
                  {pt.text}
                  {pt.reversible === false && (
                    <span
                      style={{
                        marginLeft: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: tone === 'danger' ? '#FECACA' : '#FDE68A',
                        color: tone === 'danger' ? '#991B1B' : '#92400E',
                      }}
                    >
                      irreversible
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            title="Dismiss"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: cfg.iconColor,
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
