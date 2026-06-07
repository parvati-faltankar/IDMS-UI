import React from 'react';
import type { WarehouseOwnershipScope } from '../types/warehouse.enums';

interface WarehouseScopeBadgeProps {
  scope: WarehouseOwnershipScope;
  size?: 'sm' | 'md';
}

const SCOPE_MAP: Record<WarehouseOwnershipScope, { bg: string; color: string }> = {
  Organization: { bg: '#EFF6FF', color: '#1D4ED8' },
  Branch:       { bg: '#F5F3FF', color: '#6D28D9' },
};

export const WarehouseScopeBadge: React.FC<WarehouseScopeBadgeProps> = ({ scope, size = 'md' }) => {
  const { bg, color } = SCOPE_MAP[scope] ?? SCOPE_MAP.Branch;
  return (
    <span
      data-testid={`scope-badge-${scope}`}
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
      {scope}
    </span>
  );
};
