// ─── Employee Tag Chips ───────────────────────────────────────────────────────
// Read-only display of auto-tagged employees + reassign trigger

import React from 'react';
import { RefreshCw, User } from 'lucide-react';
import type { TaggedEmployee } from '../types/slotMaster.types';
import { MOCK_ROLES } from '../constants/slotMaster.constants';

export interface EmployeeTagChipsProps {
  employees: TaggedEmployee[];
  onReassign: () => void;
  isViewOnly?: boolean;
}

export const EmployeeTagChips: React.FC<EmployeeTagChipsProps> = ({
  employees, onReassign, isViewOnly = false,
}) => {
  if (employees.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
        borderRadius: '8px', border: '1px dashed var(--color-border)',
        color: 'var(--color-text-muted)', fontSize: '12px',
      }}>
        <User size={13} />
        <span>No employees tagged — select a role above to auto-tag</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {employees.map((e) => {
        const roleName = MOCK_ROLES.find((r) => r.id === e.role)?.name ?? e.role;
        return (
          <div
            key={e.employeeId}
            title={`${e.employeeName} · ${roleName}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '20px',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              fontSize: '12px', fontWeight: 600, color: '#1D4ED8',
            }}
          >
            <span style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#BFDBFE', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0,
            }}>
              {e.employeeName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </span>
            {e.employeeName}
          </div>
        );
      })}
      {!isViewOnly && (
        <button
          type="button"
          onClick={onReassign}
          title="Re-run round-robin assignment"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '20px',
            background: 'transparent', border: '1px solid var(--color-border)',
            fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={11} />
          Reassign
        </button>
      )}
    </div>
  );
};
