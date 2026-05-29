// ─── Product Applicability Drawer ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ProductApplicabilityRow, LogicOp, DurationTypeShort, RelationType } from '../types/serviceTypeMaster.types';
import {
  LOGIC_OP_OPTIONS,
  DURATION_TYPE_SHORT_OPTIONS,
  RELATION_TYPE_OPTIONS,
  MOCK_PRODUCTS,
  MOCK_CONTRACTS,
} from '../constants/serviceTypeMaster.constants';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductApplicabilityDrawerProps {
  open: boolean;
  editRow: ProductApplicabilityRow | null;
  onClose: () => void;
  onSave: (row: ProductApplicabilityRow) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyRow(): ProductApplicabilityRow {
  return {
    id: `pa-${Date.now()}`,
    product: '',
    productName: '',
    productCode: '',
    variantCode: '',
    minUsage: '',
    maxUsage: '',
    additionalUsage: '',
    logic: '',
    durationType: '',
    minDuration: '',
    maxDuration: '',
    additionalDuration: '',
    qty: '',
    availMultipleTimes: false,
    availLimit: '',
    mfgFrom: '',
    mfgTo: '',
    saleFrom: '',
    saleTo: '',
    dispatchFrom: '',
    dispatchTo: '',
    relationType: 'Vehicle Contract Applicable',
    applicableContract: '',
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputRO: React.CSSProperties = { ...inputBase, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' };
const labelBase: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '5px' };
const labelMuted: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' };
const errTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const threeCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' };
const fw: React.CSSProperties = { marginBottom: '12px' };
const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--color-border)' };

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductApplicabilityDrawer: React.FC<ProductApplicabilityDrawerProps> = ({
  open, editRow, onClose, onSave,
}) => {
  const [form, setForm] = useState<ProductApplicabilityRow>(emptyRow);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductApplicabilityRow, string>>>({});

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm(editRow ? { ...editRow } : emptyRow());
      setErrors({});
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, editRow]);

  function set<K extends keyof ProductApplicabilityRow>(field: K, value: ProductApplicabilityRow[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-populate product name from product selection
      if (field === 'product') {
        const found = MOCK_PRODUCTS.find((p) => p.code === value);
        next.productName = found ? found.name : '';
        next.productCode = found ? found.code : '';
        // Default relation type when product selected
        if (!prev.relationType) next.relationType = 'Vehicle Contract Applicable';
      }
      // Mutual exclusion: Avail Multiple Times vs Avail Limit
      if (field === 'availMultipleTimes' && value === true) {
        next.availLimit = '';
      }
      if (field === 'availLimit' && String(value).trim() !== '') {
        next.availMultipleTimes = false;
      }
      return next;
    });
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ProductApplicabilityRow, string>> = {};
    if (!form.product) errs.product = 'Product is required';
    if (!form.minUsage && form.product) errs.minUsage = 'Min Usage is required';
    if (!form.maxUsage && form.product) errs.maxUsage = 'Max Usage is required';
    if (form.minUsage && form.maxUsage && parseFloat(form.minUsage) > parseFloat(form.maxUsage)) {
      errs.maxUsage = 'Max Usage must be ≥ Min Usage';
    }
    if (!form.minDuration && form.product) errs.minDuration = 'Min Duration is required';
    if (!form.maxDuration && form.product) errs.maxDuration = 'Max Duration is required';
    if (form.minDuration && form.maxDuration && parseFloat(form.minDuration) > parseFloat(form.maxDuration)) {
      errs.maxDuration = 'Max Duration must be ≥ Min Duration';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (validate()) onSave({ ...form });
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1200 }}
      />

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', background: 'var(--color-surface)', zIndex: 1201, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {editRow ? 'Edit Product Applicability' : 'Add Product Applicability'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Define product scope, usage, duration, and availment rules
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Product */}
          <div style={sectionTitle}>Product</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Product Code <span style={{ color: '#DC2626' }}>*</span></label>
              <select value={form.product} onChange={(e) => set('product', e.target.value)} style={errors.product ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase}>
                <option value="">— Select Product —</option>
                {MOCK_PRODUCTS.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
              </select>
              {errors.product && <span style={errTxt}>{errors.product}</span>}
            </div>
            <div>
              <label style={labelBase}>Product Name</label>
              <input readOnly value={form.productName} style={inputRO} />
            </div>
          </div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Variant Code</label>
              <select value={form.variantCode} onChange={(e) => set('variantCode', e.target.value)} style={inputBase}>
                <option value="">— All Variants —</option>
                <option value="VAR-A">VAR-A (1 Ton)</option>
                <option value="VAR-B">VAR-B (1.5 Ton)</option>
                <option value="VAR-C">VAR-C (2 Ton)</option>
              </select>
            </div>
          </div>

          {/* Usage */}
          <div style={sectionTitle}>Usage</div>
          <div style={{ ...threeCol, ...fw }}>
            <div>
              <label style={labelBase}>Min Usage <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="number" min={0} value={form.minUsage} onChange={(e) => set('minUsage', e.target.value)} style={errors.minUsage ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase} placeholder="0" />
              {errors.minUsage && <span style={errTxt}>{errors.minUsage}</span>}
            </div>
            <div>
              <label style={labelBase}>Max Usage <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="number" min={0} value={form.maxUsage} onChange={(e) => set('maxUsage', e.target.value)} style={errors.maxUsage ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase} placeholder="0" />
              {errors.maxUsage && <span style={errTxt}>{errors.maxUsage}</span>}
            </div>
            <div>
              <label style={labelMuted}>Additional Usage</label>
              <input type="number" min={0} value={form.additionalUsage} onChange={(e) => set('additionalUsage', e.target.value)} style={inputBase} placeholder="0" />
            </div>
          </div>

          {/* Logic */}
          <div style={{ ...fw }}>
            <label style={labelMuted}>Logic</label>
            <select value={form.logic} onChange={(e) => set('logic', e.target.value as LogicOp | '')} style={inputBase}>
              <option value="">— Select —</option>
              {LOGIC_OP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div style={sectionTitle}>Duration</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Duration Type</label>
              <select value={form.durationType} onChange={(e) => set('durationType', e.target.value as DurationTypeShort | '')} style={inputBase}>
                <option value="">— Select —</option>
                {DURATION_TYPE_SHORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...threeCol, ...fw }}>
            <div>
              <label style={labelBase}>Min Duration <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="number" min={0} value={form.minDuration} onChange={(e) => set('minDuration', e.target.value)} style={errors.minDuration ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase} placeholder="0" />
              {errors.minDuration && <span style={errTxt}>{errors.minDuration}</span>}
            </div>
            <div>
              <label style={labelBase}>Max Duration <span style={{ color: '#DC2626' }}>*</span></label>
              <input type="number" min={0} value={form.maxDuration} onChange={(e) => set('maxDuration', e.target.value)} style={errors.maxDuration ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase} placeholder="0" />
              {errors.maxDuration && <span style={errTxt}>{errors.maxDuration}</span>}
            </div>
            <div>
              <label style={labelMuted}>Additional Duration</label>
              <input type="number" min={0} value={form.additionalDuration} onChange={(e) => set('additionalDuration', e.target.value)} style={inputBase} placeholder="0" />
            </div>
          </div>

          {/* Qty */}
          <div style={{ ...fw }}>
            <label style={labelMuted}>Qty</label>
            <input type="number" min={0} value={form.qty} onChange={(e) => set('qty', e.target.value)} style={inputBase} placeholder="0" />
          </div>

          {/* Availment */}
          <div style={sectionTitle}>Availment</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', ...fw }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.availMultipleTimes} onChange={(e) => set('availMultipleTimes', e.target.checked)} style={{ width: '15px', height: '15px' }} />
              Avail Multiple Times
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Avail Limit</label>
              <input
                type="number"
                min={1}
                disabled={form.availMultipleTimes}
                value={form.availLimit}
                onChange={(e) => set('availLimit', e.target.value)}
                style={{ ...inputBase, maxWidth: '100px', opacity: form.availMultipleTimes ? 0.4 : 1 }}
                placeholder="—"
              />
            </div>
          </div>

          {/* Date Ranges */}
          <div style={sectionTitle}>Date Ranges</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Mfg From</label>
              <input type="date" value={form.mfgFrom} onChange={(e) => set('mfgFrom', e.target.value)} style={inputBase} />
            </div>
            <div>
              <label style={labelMuted}>Mfg To</label>
              <input type="date" value={form.mfgTo} onChange={(e) => set('mfgTo', e.target.value)} style={inputBase} />
            </div>
          </div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Sale From</label>
              <input type="date" value={form.saleFrom} onChange={(e) => set('saleFrom', e.target.value)} style={inputBase} />
            </div>
            <div>
              <label style={labelMuted}>Sale To</label>
              <input type="date" value={form.saleTo} onChange={(e) => set('saleTo', e.target.value)} style={inputBase} />
            </div>
          </div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Dispatch From</label>
              <input type="date" value={form.dispatchFrom} onChange={(e) => set('dispatchFrom', e.target.value)} style={inputBase} />
            </div>
            <div>
              <label style={labelMuted}>Dispatch To</label>
              <input type="date" value={form.dispatchTo} onChange={(e) => set('dispatchTo', e.target.value)} style={inputBase} />
            </div>
          </div>

          {/* Contract */}
          <div style={sectionTitle}>Contract</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Relation Type</label>
              <select value={form.relationType} onChange={(e) => set('relationType', e.target.value as RelationType | '')} style={inputBase}>
                <option value="">— Select —</option>
                {RELATION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Applicable Contract</label>
              <select value={form.applicableContract} onChange={(e) => set('applicableContract', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: 'var(--color-surface)' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>
    </>
  );
};
