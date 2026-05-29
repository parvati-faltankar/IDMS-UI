// ─── Attribute Tagging Grid (Inline Editable) ─────────────────────────────────

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AttributeTagRow } from '../types/serviceTypeMaster.types';
import { MOCK_ATTRIBUTES } from '../constants/serviceTypeMaster.constants';

interface AttributeTaggingGridProps {
  rows: AttributeTagRow[];
  onChange: (rows: AttributeTagRow[]) => void;
  errors?: Record<string, string>;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const cellInput: React.CSSProperties = {
  width: '100%', padding: '4px 6px', fontSize: '12px',
  border: '1px solid var(--color-border)', borderRadius: '6px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const cellRO: React.CSSProperties = { ...cellInput, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'default' };

// Col widths: Select Attribute | Attr Code | Attr Name | Attr Type | Mandatory | Default Value | Validation Rules | Value | Del
const GRID_COLS = '180px 90px 130px 100px 70px 100px 130px 100px 36px';
const HEADERS = ['Select Attribute', 'Code', 'Name', 'Type', 'Mandatory', 'Default Value', 'Validation Rules', 'Value', ''];

// ─── Component ────────────────────────────────────────────────────────────────

export const AttributeTaggingGrid: React.FC<AttributeTaggingGridProps> = ({
  rows, onChange, errors,
}) => {

  function newRow(): AttributeTagRow {
    return {
      id: `attr-${Date.now()}`,
      selectAttribute: '',
      attributeCode: '',
      attributeName: '',
      attributeType: '',
      mandatory: false,
      defaultValue: '',
      validationRules: '',
      value: '',
    };
  }

  function addRow() {
    onChange([...rows, newRow()]);
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof AttributeTagRow, value: string | boolean) {
    onChange(rows.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, [field]: value };
      // Auto-populate code, name, type from selected attribute
      if (field === 'selectAttribute') {
        const found = MOCK_ATTRIBUTES.find((a) => a.code === value);
        next.attributeCode = found ? found.code : '';
        next.attributeName = found ? found.name : '';
        next.attributeType = found ? found.type : '';
      }
      return next;
    }));
  }

  return (
    <div>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', overflowX: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 12px', height: '34px', alignItems: 'center', minWidth: 'max-content' }}>
          {HEADERS.map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h === 'Mandatory' ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            No attributes added. Click &quot;+ Add Attribute&quot; below.
          </div>
        )}

        {/* Rows */}
        {rows.map((row) => (
          <div
            key={row.id}
            style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--color-border)', alignItems: 'center', minWidth: 'max-content' }}
          >
            {/* Select Attribute */}
            <select
              value={row.selectAttribute}
              onChange={(e) => updateRow(row.id, 'selectAttribute', e.target.value)}
              style={errors?.[`${row.id}.selectAttribute`] ? { ...cellInput, border: '1px solid #FCA5A5' } : cellInput}
            >
              <option value="">— Select —</option>
              {MOCK_ATTRIBUTES.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
            </select>

            {/* Code — read-only */}
            <input readOnly value={row.attributeCode} style={cellRO} tabIndex={-1} />

            {/* Name — read-only */}
            <input readOnly value={row.attributeName} style={cellRO} tabIndex={-1} />

            {/* Type — auto */}
            <input readOnly value={row.attributeType} style={cellRO} tabIndex={-1} />

            {/* Mandatory — checkbox */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={row.mandatory}
                onChange={(e) => updateRow(row.id, 'mandatory', e.target.checked)}
                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
              />
            </div>

            {/* Default Value */}
            <input
              value={row.defaultValue}
              onChange={(e) => updateRow(row.id, 'defaultValue', e.target.value)}
              style={cellInput}
              placeholder="—"
            />

            {/* Validation Rules */}
            <input
              value={row.validationRules}
              onChange={(e) => updateRow(row.id, 'validationRules', e.target.value)}
              style={cellInput}
              placeholder="—"
            />

            {/* Value */}
            <input
              value={row.value}
              onChange={(e) => updateRow(row.id, 'value', e.target.value)}
              style={cellInput}
              placeholder="—"
            />

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              title="Remove"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', flexShrink: 0 }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {/* Footer */}
        <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderTop: rows.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
          <button
            type="button"
            onClick={addRow}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'transparent', border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Plus size={12} /> Add Attribute
          </button>
        </div>
      </div>
      {errors?.rows && <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>{errors.rows}</p>}
    </div>
  );
};
