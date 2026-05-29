// ─── Product Applicability Grid ───────────────────────────────────────────────

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProductApplicabilityRow } from '../types/serviceTypeMaster.types';
import { ProductApplicabilityDrawer } from './ProductApplicabilityDrawer';

interface ProductApplicabilityGridProps {
  rows: ProductApplicabilityRow[];
  onChange: (rows: ProductApplicabilityRow[]) => void;
  error?: string;
}

const GRID_COLS = '100px 1fr 80px 80px 120px 120px 40px';
const COL_HEADERS = ['Product Code', 'Product Name', 'Min Usage', 'Max Usage', 'Duration', 'Relation Type', ''];

export const ProductApplicabilityGrid: React.FC<ProductApplicabilityGridProps> = ({
  rows, onChange, error,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRow, setEditRow] = useState<ProductApplicabilityRow | null>(null);

  function openAdd() {
    setEditRow(null);
    setDrawerOpen(true);
  }

  function openEdit(row: ProductApplicabilityRow) {
    setEditRow(row);
    setDrawerOpen(true);
  }

  function handleSave(row: ProductApplicabilityRow) {
    if (editRow) {
      onChange(rows.map((r) => (r.id === row.id ? row : r)));
    } else {
      onChange([...rows, row]);
    }
    setDrawerOpen(false);
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  function durationLabel(row: ProductApplicabilityRow): string {
    if (!row.durationType && !row.minDuration) return '—';
    const parts: string[] = [];
    if (row.minDuration || row.maxDuration) {
      parts.push(`${row.minDuration || '0'}–${row.maxDuration || '∞'}`);
    }
    if (row.durationType) parts.push(row.durationType);
    return parts.join(' ') || '—';
  }

  return (
    <>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 14px', height: '34px', alignItems: 'center' }}>
          {COL_HEADERS.map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {rows.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            No products added. Click &quot;+ Add Product&quot; below.
          </div>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px', padding: '0 14px', height: '44px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.1s' }}
            onClick={() => openEdit(row)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{row.productCode || row.product}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.productName || '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>{row.minUsage || '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>{row.maxUsage || '—'}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{durationLabel(row)}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.relationType || '—'}</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: '1px solid #FCA5A5', background: '#FEF2F2', borderRadius: '6px', cursor: 'pointer', color: '#DC2626' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: 'var(--color-surface)', borderTop: rows.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
          <button
            type="button"
            onClick={openAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'transparent', border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Plus size={12} /> Add Product
          </button>
          {error && <span style={{ marginLeft: '12px', fontSize: '11px', color: '#DC2626' }}>{error}</span>}
        </div>
      </div>

      <ProductApplicabilityDrawer
        open={drawerOpen}
        editRow={editRow}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};
