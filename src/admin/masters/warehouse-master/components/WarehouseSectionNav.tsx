// ─── WarehouseSectionNav ─────────────────────────────────────────────────────
//
// Rich section navigator for the Warehouse Configuration Page.
// Supports 7 status tones (vs AdminConfigShell's 3) to reflect locked,
// approval-pending, warning, and error states in addition to the standard
// complete / partial / empty.
//
// Exported types are used by WarehouseConfigurationPage and its tests.

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  Clock,
  MinusCircle,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WarehouseSectionStatus =
  | 'complete'
  | 'partial'
  | 'warning'
  | 'error'
  | 'locked'
  | 'approval-pending'
  | 'empty';

export interface WarehouseSectionItem {
  key: string;
  label: string;
  description?: string;
  status: WarehouseSectionStatus;
  /** Number of blocking issues to show in the badge */
  issueCount?: number;
  /** When true, clicking the item is disabled */
  disabled?: boolean;
}

export interface WarehouseSectionNavProps {
  sections: WarehouseSectionItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WarehouseSectionStatus,
  {
    icon: React.ElementType;
    iconColor: string;
    badgeBg?: string;
    badgeColor?: string;
  }
> = {
  complete: {
    icon: CheckCircle2,
    iconColor: '#16A34A',
  },
  partial: {
    icon: MinusCircle,
    iconColor: '#D97706',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
  },
  error: {
    icon: AlertCircle,
    iconColor: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeColor: '#991B1B',
  },
  locked: {
    icon: Lock,
    iconColor: 'var(--color-text-muted)',
  },
  'approval-pending': {
    icon: Clock,
    iconColor: '#7C3AED',
    badgeBg: '#F5F3FF',
    badgeColor: '#5B21B6',
  },
  empty: {
    icon: MinusCircle,
    iconColor: 'var(--color-border)',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function WarehouseSectionNav({
  sections,
  activeKey,
  onSelect,
}: WarehouseSectionNavProps) {
  return (
    <aside
      data-testid="warehouse-section-nav"
      style={{
        width: '220px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        borderInlineEnd: '1px solid var(--color-border)',
        overflowY: 'auto',
      }}
    >
      <div style={{ paddingTop: '8px' }}>
        {sections.map((section) => {
          const isActive = section.key === activeKey;
          const cfg = STATUS_CONFIG[section.status];
          const Icon = cfg.icon;
          const hasIssues = (section.issueCount ?? 0) > 0;

          return (
            <button
              key={section.key}
              type="button"
              data-testid={`section-nav-${section.key}`}
              disabled={section.disabled}
              onClick={() => !section.disabled && onSelect(section.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '9px 12px',
                border: 'none',
                background: isActive
                  ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
                  : 'transparent',
                cursor: section.disabled ? 'default' : 'pointer',
                borderInlineStart: `3px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                textAlign: 'left',
                opacity: section.disabled ? 0.45 : 1,
                transition: 'background 0.12s',
              }}
            >
              {/* Status icon */}
              <Icon
                size={14}
                style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : cfg.iconColor }}
              />

              {/* Label + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {section.label}
                </div>
                {section.description && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                      marginTop: '1px',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {section.description}
                  </div>
                )}
              </div>

              {/* Issue badge or chevron */}
              {hasIssues && cfg.badgeBg ? (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: cfg.badgeBg,
                    color: cfg.badgeColor,
                    flexShrink: 0,
                  }}
                >
                  {section.issueCount}
                </span>
              ) : (
                <ChevronRight
                  size={13}
                  style={{
                    flexShrink: 0,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                    strokeWidth: isActive ? 2.5 : 1.5,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
