import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import type { SetupHealthTone } from '../types/warehouse.enums';

interface WarehouseSetupHealthProps {
  tone: SetupHealthTone;
  blockingCount?: number;
  showLabel?: boolean;
  compact?: boolean;
}

type ToneConfig = {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  label: string;
};

const TONE_CONFIG: Record<SetupHealthTone, ToneConfig> = {
  empty:    { icon: MinusCircle,   color: '#94A3B8', bg: '#F1F5F9', label: 'Not configured' },
  partial:  { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', label: 'Partial' },
  complete: { icon: CheckCircle2,  color: '#15803D', bg: '#DCFCE7', label: 'Complete' },
  error:    { icon: AlertCircle,   color: '#DC2626', bg: '#FEF2F2', label: 'Has issues' },
};

export const WarehouseSetupHealth: React.FC<WarehouseSetupHealthProps> = ({
  tone,
  blockingCount,
  showLabel = true,
  compact = false,
}) => {
  const { icon: Icon, color, bg, label } = TONE_CONFIG[tone] ?? TONE_CONFIG.empty;

  if (compact) {
    return (
      <Icon
        size={16}
        style={{ color, flexShrink: 0 }}
      />
    );
  }

  return (
    <span
      data-testid={`setup-health-${tone}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '6px',
        background: bg,
        color,
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} style={{}} />
      {showLabel && label}
      {typeof blockingCount === 'number' && blockingCount > 0 && (
        <span style={{ fontSize: '10px', fontWeight: 700 }}>({blockingCount})</span>
      )}
    </span>
  );
};
