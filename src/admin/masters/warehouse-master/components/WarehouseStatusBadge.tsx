import React from 'react';
import type { WarehouseStatus } from '../types/warehouse.enums';

interface WarehouseStatusBadgeProps {
  status: WarehouseStatus;
  size?: 'sm' | 'md';
}

const STATUS_MAP: Record<WarehouseStatus, { bg: string; color: string }> = {
  Draft:    { bg: '#F1F5F9', color: '#475569' },
  Active:   { bg: '#DCFCE7', color: '#15803D' },
  Blocked:  { bg: '#FEF3C7', color: '#92400E' },
  Inactive: { bg: '#FEF2F2', color: '#DC2626' },
};

export const WarehouseStatusBadge: React.FC<WarehouseStatusBadgeProps> = ({ status, size = 'md' }) => {
  const { bg, color } = STATUS_MAP[status] ?? STATUS_MAP.Draft;
  return (
    <span
      data-testid={`status-badge-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        background: bg,
        color,
      }}
    >
      {status}
    </span>
  );
};
