// ─── Service Type Billing Ratio — Inline Editable Grid ───────────────────────

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BillingRatioRow, BillingRatioType, PostingType, AllocationType } from '../types/serviceTypeMaster.types';
import {
  POSTING_TYPE_OPTIONS,
  ALLOCATION_TYPE_OPTIONS,
  MOCK_SERVICE_TYPES,
} from '../constants/serviceTypeMaster.constants';

interface BillingRatioGridProps {
  isEnabled: boolean;
  billingRatioType: BillingRatioType | '';
  onBillingRatioTypeChange: (value: BillingRatioType | '') => void;
  rows: BillingRatioRow[];
  onChange: (rows: BillingRatioRow[]) => void;
  errors?: { billingRatioType?: string; rows?: string; orderDuplicate?: string };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cellInput: React.CSSProperties = {
  width: '100%', padding: '4px 6px', fontSize: '12px',
  border: '1px solid var(--color-border)', borderRadius: '6px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

const cellSelect: React.CSSProperties = { ...cellInput, cursor: 'pointer' };
const cellReadOnly: React.CSSProperties = { ...cellInput, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'default' };
const disabledOverlay: React.CSSProperties = { opacity: 0.45, pointerEvents: 'none' };

const GRID_COLS = '1fr 140px 120px 64px 110px 80px 80px 80px 36px';

function ColHead({ label, center }: { label: string; center?: boolean }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BillingRatioGrid: React.FC<BillingRatioGridProps> = ({
  isEnabled,
  billingRatioType,
  onBillingRatioTypeChange,
  rows,
  onChange,
  errors,
}) => {

  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string } | null>(null);

  function newRow(): BillingRatioRow {
    return {
      id: `br-${Date.now()}`,
      serviceTypeRef: '',
      displayName: '',
      accountPostingType: '',
      order: String(rows.length + 1),
      allocationType: '',
      value: '',
      minAllowedValue: '',
      maxAllowedValue: '',
    };
  }

  function addRow() {
    onChange([...rows, newRow()]);
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof BillingRatioRow, value: string | boolean) {
    onChange(rows.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Auto-populate displayName from selected service type
      if (field === 'serviceTypeRef') {
        const found = MOCK_SERVICE_TYPES.find((s) => s.code === value);
        updated.displayName = found ? found.name : '';
      }
      return updated;
    }));
  }

  function isEditing(id: string, field: string) {
    return inlineEdit?.id === id && inlineEdit.field === field;
  }

  const containerStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  return (
    <div style={isEnabled ? {} : disabledOverlay}>
      {/* Grid */}
      <div style={containerStyle}>
        {/* Toolbar: Ratio Type (left) + Add Row (right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 12px', height: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Ratio Type</span>
            <select
              disabled={!isEnabled}
              value={billingRatioType}
              onChange={(e) => onBillingRatioTypeChange(e.target.value as BillingRatioType | '')}
              style={{ ...cellSelect, width: '140px', height: '26px', padding: '2px 6px', fontSize: '12px' }}
            >
              <option value="">— Select —</option>
              {['Percentage', 'Amount'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors?.billingRatioType && (
              <span style={{ fontSize: '11px', color: '#DC2626' }}>{errors.billingRatioType}</span>
            )}
          </div>
          <button
            type="button"
            onClick={addRow}
            disabled={!isEnabled}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'transparent', border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: isEnabled ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          >
            <Plus size={12} /> Add Row
          </button>
        </div>

        {/* Column Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 12px', height: '34px', alignItems: 'center' }}>
          <ColHead label="Service Type" />
          <ColHead label="Display Name" />
          <ColHead label="Acct. Posting Type" />
          <ColHead label="Order" center />
          <ColHead label="Allocation Type" />
          <ColHead label="Value" center />
          <ColHead label="Min Value" center />
          <ColHead label="Max Value" center />
          <div style={{ width: '36px' }} />
        </div>

        {/* Rows */}
        {rows.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            No rows added. Click &quot;+ Add Row&quot; above to begin.
          </div>
        )}
        {rows.map((row) => (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>

            {/* Service Type */}
            <select
              value={row.serviceTypeRef}
              onChange={(e) => updateRow(row.id, 'serviceTypeRef', e.target.value)}
              style={cellSelect}
            >
              <option value="">— Select —</option>
              {MOCK_SERVICE_TYPES.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>

            {/* Display Name — read-only */}
            <input
              readOnly
              value={row.displayName}
              style={cellReadOnly}
              tabIndex={-1}
            />

            {/* Account Posting Type */}
            <select
              value={row.accountPostingType}
              onChange={(e) => updateRow(row.id, 'accountPostingType', e.target.value as PostingType | '')}
              style={cellSelect}
            >
              <option value="">— Select —</option>
              {POSTING_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            {/* Order */}
            <input
              type="number"
              min={1}
              value={row.order}
              onChange={(e) => updateRow(row.id, 'order', e.target.value)}
              onClick={() => setInlineEdit({ id: row.id, field: 'order' })}
              onBlur={() => setInlineEdit(null)}
              style={{ ...cellInput, textAlign: 'center' }}
              placeholder="1"
            />

            {/* Allocation Type */}
            <select
              value={row.allocationType}
              onChange={(e) => updateRow(row.id, 'allocationType', e.target.value as AllocationType | '')}
              style={cellSelect}
            >
              <option value="">— Select —</option>
              {ALLOCATION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            {/* Value */}
            <input
              type="number"
              min={0}
              value={row.value}
              onChange={(e) => updateRow(row.id, 'value', e.target.value)}
              onClick={() => setInlineEdit({ id: row.id, field: 'value' })}
              onBlur={() => setInlineEdit(null)}
              style={{ ...cellInput, textAlign: 'center' }}
              placeholder={billingRatioType === 'Percentage' ? '%' : '₹'}
            />

            {/* Min Allowed Value */}
            <input
              type="number"
              min={0}
              value={row.minAllowedValue}
              onChange={(e) => updateRow(row.id, 'minAllowedValue', e.target.value)}
              style={{ ...cellInput, textAlign: 'center' }}
              placeholder="0"
            />

            {/* Max Allowed Value */}
            <input
              type="number"
              min={0}
              value={row.maxAllowedValue}
              onChange={(e) => updateRow(row.id, 'maxAllowedValue', e.target.value)}
              style={{ ...cellInput, textAlign: 'center' }}
              placeholder="—"
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              title="Remove row"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', flexShrink: 0 }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {errors?.rows && (
          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '11px', color: '#DC2626' }}>{errors.rows}</span>
          </div>
        )}
      </div>

      {/* Validation note */}
      {isEnabled && billingRatioType === 'Percentage' && (
        <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          Percentage values should not exceed 100 unless overridden by configuration.
        </p>
      )}

      {/* Suppress unused variable warnings */}
      {isEditing('x', 'x') && null}
    </div>
  );
};
