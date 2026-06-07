import React from 'react';
import type { InventoryControlMode } from '../types/warehouse.enums';

interface WarehouseModeBadgeProps {
  mode: InventoryControlMode;
  size?: 'sm' | 'md';
}

const MODE_MAP: Record<InventoryControlMode, { bg: string; color: string; short: string }> = {
  'Warehouse-Level':   { bg: '#EEF2FF', color: '#3730A3', short: 'WH-Level' },
  'Location-BIN-Level': { bg: '#ECFDF5', color: '#065F46', short: 'BIN-Level' },
};

export const WarehouseModeBadge: React.FC<WarehouseModeBadgeProps> = ({ mode, size = 'md' }) => {
  const { bg, color, short } = MODE_MAP[mode] ?? MODE_MAP['Warehouse-Level'];
  const label = size === 'sm' ? short : mode;
  return (
    <span
      data-testid={`mode-badge-${mode}`}
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
      {label}
    </span>
  );
};
