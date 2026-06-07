import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ValidationIssue } from '../types/warehouse.types';

interface ValidationIssuePanelProps {
  issues: ValidationIssue[];
  title?: string;
  compact?: boolean;
  maxVisible?: number;
}

type SevStyle = { color: string; bg: string; border: string };

const SEV_MAP: Record<'error' | 'warning' | 'info', { icon: React.ComponentType<{ size: number }> } & SevStyle> = {
  error:   { icon: AlertCircle,   color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
  warning: { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  info:    { icon: Info,          color: '#0369A1', bg: '#EFF6FF', border: '#BAE6FD' },
};

export const ValidationIssuePanel: React.FC<ValidationIssuePanelProps> = ({
  issues,
  title,
  compact = false,
  maxVisible,
}) => {
  if (issues.length === 0) return null;

  const errors   = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos    = issues.filter((i) => i.severity === 'info');
  const ordered  = [...errors, ...warnings, ...infos];
  const visible  = maxVisible != null ? ordered.slice(0, maxVisible) : ordered;
  const hidden   = ordered.length - visible.length;

  if (compact) {
    const worst = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'info';
    const { icon: Icon, color, bg, border } = SEV_MAP[worst];
    const label =
      errors.length > 0
        ? `${errors.length} blocking issue${errors.length > 1 ? 's' : ''}`
        : `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: bg,
          border: `1px solid ${border}`,
          fontSize: '12px',
          color,
        }}
      >
        <Icon size={13} />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--color-text-muted)',
            marginBottom: '8px',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visible.map((issue, idx) => {
          const { icon: Icon, color, bg, border } = SEV_MAP[issue.severity as 'error' | 'warning' | 'info'] ?? SEV_MAP.info;
          return (
            <div
              key={`${issue.section ?? ''}-${issue.field ?? ''}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: bg,
                border: `1px solid ${border}`,
                fontSize: '12px',
                color,
                lineHeight: 1.5,
              }}
            >
              <Icon size={14} />
              <div>
                <span style={{ fontWeight: 600 }}>{issue.message}</span>
                {issue.field && (
                  <span style={{ marginLeft: '6px', opacity: 0.7, fontWeight: 400 }}>
                    ({issue.field})
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {hidden > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingLeft: '4px' }}>
            +{hidden} more issue{hidden > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
