// ─── Contract Relation Drawer (Labour + Part) ─────────────────────────────────

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  ContractRelationLabourRow,
  ContractRelationPartRow,
  LogicOp,
  DurationTypeShort,
  CategoryType,
} from '../types/serviceTypeMaster.types';
import {
  LOGIC_OP_OPTIONS,
  DURATION_TYPE_SHORT_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  MOCK_PRODUCTS,
  MOCK_SERVICES,
  MOCK_PARTS,
  MOCK_CONTRACTS,
} from '../constants/serviceTypeMaster.constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CRRowType = 'labour' | 'part';
type AnyRow = ContractRelationLabourRow | ContractRelationPartRow;

interface ContractRelationDrawerProps {
  open: boolean;
  type: CRRowType;
  editRow: AnyRow | null;
  onClose: () => void;
  onSave: (row: AnyRow) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyLabour(): ContractRelationLabourRow {
  return {
    id: `crl-${Date.now()}`,
    productAttribute: '',
    productCodeName: '',
    category: '',
    groupName: '',
    service: '',
    serviceName: '',
    minUsage: '',
    maxUsage: '',
    additionalUsage: '',
    logic: '',
    durationType: '',
    minDuration: '',
    maxDuration: '',
    additionalDuration: '',
    hours: '',
    qty: '0',
    availMultipleTimes: false,
    availLimit: '',
    applicableContract: '',
    autoPopulate: false,
    mandatory: false,
    sequence: '',
    lineServiceType: '',
    atLeast: '',
  };
}

function emptyPart(): ContractRelationPartRow {
  return {
    id: `crp-${Date.now()}`,
    productAttribute: '',
    productCodeName: '',
    category: '',
    groupName: '',
    part: '',
    partName: '',
    minUsage: '',
    maxUsage: '',
    additionalUsage: '',
    logic: '',
    durationType: '',
    minDuration: '',
    maxDuration: '',
    additionalDuration: '',
    qty: '0',
    availMultipleTimes: false,
    availLimit: '',
    applicableContract: '',
    autoPopulate: false,
    autoFetch: false,
    mandatory: false,
    sequence: '',
    lineServiceType: '',
    atLeast: '',
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
const fourCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' };
const fw: React.CSSProperties = { marginBottom: '12px' };
const sectionTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--color-border)' };
const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' };

// ─── Component ────────────────────────────────────────────────────────────────

export const ContractRelationDrawer: React.FC<ContractRelationDrawerProps> = ({
  open, type, editRow, onClose, onSave,
}) => {
  const [labourForm, setLabourForm] = useState<ContractRelationLabourRow>(emptyLabour);
  const [partForm, setPartForm] = useState<ContractRelationPartRow>(emptyPart);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLabour = type === 'labour';

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setErrors({});
    if (isLabour) {
      setLabourForm(editRow ? { ...editRow } as ContractRelationLabourRow : emptyLabour());
    } else {
      setPartForm(editRow ? { ...editRow } as ContractRelationPartRow : emptyPart());
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editRow, isLabour]);

  function setL<K extends keyof ContractRelationLabourRow>(field: K, value: ContractRelationLabourRow[K]) {
    setLabourForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'service') {
        const found = MOCK_SERVICES.find((s) => s.code === value);
        next.serviceName = found ? found.name : '';
      }
      if (field === 'availMultipleTimes' && value === true) { next.availLimit = ''; }
      if (field === 'availLimit' && String(value).trim() !== '') { next.availMultipleTimes = false; }
      return next;
    });
  }

  function setP<K extends keyof ContractRelationPartRow>(field: K, value: ContractRelationPartRow[K]) {
    setPartForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'part') {
        const found = MOCK_PARTS.find((p) => p.code === value);
        next.partName = found ? found.name : '';
      }
      if (field === 'availMultipleTimes' && value === true) { next.availLimit = ''; }
      if (field === 'availLimit' && String(value).trim() !== '') { next.availMultipleTimes = false; }
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (isLabour) {
      if (!labourForm.service) errs.service = 'Service is required';
    } else {
      if (!partForm.part) errs.part = 'Part is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (isLabour) {
      onSave({ ...labourForm });
    } else {
      onSave({ ...partForm });
    }
  }

  if (!open) return null;

  const lf = labourForm;
  const pf = partForm;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 100vw)', background: 'var(--color-surface)', zIndex: 1201, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {editRow ? 'Edit' : 'Add'} {isLabour ? 'Labour Association' : 'Part Association'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {isLabour ? 'Map service/labour items, hours, and availment rules' : 'Map part items, quantities, and availment rules'}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Product Context */}
          <div style={sectionTitle}>Product Context</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Product Attribute</label>
              <select
                value={isLabour ? lf.productAttribute : pf.productAttribute}
                onChange={(e) => isLabour ? setL('productAttribute', e.target.value) : setP('productAttribute', e.target.value)}
                style={inputBase}
              >
                <option value="">— None —</option>
                {MOCK_PRODUCTS.map((p) => <option key={p.code} value={p.code}>{p.code} – {p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Product Code &amp; Name</label>
              <select
                value={isLabour ? lf.productCodeName : pf.productCodeName}
                onChange={(e) => isLabour ? setL('productCodeName', e.target.value) : setP('productCodeName', e.target.value)}
                style={inputBase}
              >
                <option value="">— None —</option>
                {MOCK_PRODUCTS.map((p) => <option key={p.code} value={p.code}>{p.code} – {p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelMuted}>Category</label>
              <select
                value={isLabour ? lf.category : pf.category}
                onChange={(e) => isLabour ? setL('category', e.target.value as CategoryType | '') : setP('category', e.target.value as CategoryType | '')}
                style={inputBase}
              >
                <option value="">— Select —</option>
                {CATEGORY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Group Name</label>
              <input
                value={isLabour ? lf.groupName : pf.groupName}
                onChange={(e) => isLabour ? setL('groupName', e.target.value) : setP('groupName', e.target.value)}
                disabled={(isLabour ? lf.category : pf.category) !== 'Group'}
                style={{ ...inputBase, opacity: (isLabour ? lf.category : pf.category) !== 'Group' ? 0.4 : 1 }}
                placeholder="Group name..."
              />
            </div>
          </div>

          {/* Service / Part */}
          <div style={sectionTitle}>{isLabour ? 'Service' : 'Part'}</div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>{isLabour ? 'Service' : 'Part'} Code <span style={{ color: '#DC2626' }}>*</span></label>
              {isLabour ? (
                <select value={lf.service} onChange={(e) => setL('service', e.target.value)} style={errors.service ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase}>
                  <option value="">— Select —</option>
                  {MOCK_SERVICES.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                </select>
              ) : (
                <select value={pf.part} onChange={(e) => setP('part', e.target.value)} style={errors.part ? { ...inputBase, border: '1px solid #FCA5A5' } : inputBase}>
                  <option value="">— Select —</option>
                  {MOCK_PARTS.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
                </select>
              )}
              {(errors.service || errors.part) && <span style={errTxt}>{errors.service || errors.part}</span>}
            </div>
            <div>
              <label style={labelBase}>{isLabour ? 'Service' : 'Part'} Name</label>
              <input readOnly value={isLabour ? lf.serviceName : pf.partName} style={inputRO} />
            </div>
          </div>

          {/* Usage */}
          <div style={sectionTitle}>Usage</div>
          <div style={{ ...threeCol, ...fw }}>
            <div>
              <label style={labelMuted}>Min Usage</label>
              <input type="number" min={0} value={isLabour ? lf.minUsage : pf.minUsage} onChange={(e) => isLabour ? setL('minUsage', e.target.value) : setP('minUsage', e.target.value)} style={inputBase} placeholder="0" />
            </div>
            <div>
              <label style={labelMuted}>Max Usage</label>
              <input type="number" min={0} value={isLabour ? lf.maxUsage : pf.maxUsage} onChange={(e) => isLabour ? setL('maxUsage', e.target.value) : setP('maxUsage', e.target.value)} style={inputBase} placeholder="0" />
            </div>
            <div>
              <label style={labelMuted}>Additional Usage</label>
              <input type="number" min={0} value={isLabour ? lf.additionalUsage : pf.additionalUsage} onChange={(e) => isLabour ? setL('additionalUsage', e.target.value) : setP('additionalUsage', e.target.value)} style={inputBase} placeholder="0" />
            </div>
          </div>

          {/* Logic */}
          <div style={{ ...fw }}>
            <label style={labelMuted}>Logic</label>
            <select value={isLabour ? lf.logic : pf.logic} onChange={(e) => isLabour ? setL('logic', e.target.value as LogicOp | '') : setP('logic', e.target.value as LogicOp | '')} style={inputBase}>
              <option value="">— Select —</option>
              {LOGIC_OP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div style={sectionTitle}>Duration</div>
          <div style={{ ...fw }}>
            <label style={labelMuted}>Duration Type</label>
            <select value={isLabour ? lf.durationType : pf.durationType} onChange={(e) => isLabour ? setL('durationType', e.target.value as DurationTypeShort | '') : setP('durationType', e.target.value as DurationTypeShort | '')} style={inputBase}>
              <option value="">— Select —</option>
              {DURATION_TYPE_SHORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ ...threeCol, ...fw }}>
            <div>
              <label style={labelMuted}>Min Duration</label>
              <input type="number" min={0} value={isLabour ? lf.minDuration : pf.minDuration} onChange={(e) => isLabour ? setL('minDuration', e.target.value) : setP('minDuration', e.target.value)} style={inputBase} placeholder="0" />
            </div>
            <div>
              <label style={labelMuted}>Max Duration</label>
              <input type="number" min={0} value={isLabour ? lf.maxDuration : pf.maxDuration} onChange={(e) => isLabour ? setL('maxDuration', e.target.value) : setP('maxDuration', e.target.value)} style={inputBase} placeholder="0" />
            </div>
            <div>
              <label style={labelMuted}>Additional Duration</label>
              <input type="number" min={0} value={isLabour ? lf.additionalDuration : pf.additionalDuration} onChange={(e) => isLabour ? setL('additionalDuration', e.target.value) : setP('additionalDuration', e.target.value)} style={inputBase} placeholder="0" />
            </div>
          </div>

          {/* Qty / Hours */}
          <div style={sectionTitle}>Quantity &amp; Availment</div>
          <div style={{ ...fourCol, ...fw }}>
            {isLabour && (
              <div>
                <label style={labelMuted}>Hours</label>
                <input type="number" min={0} value={lf.hours} onChange={(e) => setL('hours', e.target.value)} style={inputBase} placeholder="0" />
              </div>
            )}
            <div>
              <label style={labelMuted}>Qty</label>
              <input type="number" min={0} value={isLabour ? lf.qty : pf.qty} onChange={(e) => isLabour ? setL('qty', e.target.value) : setP('qty', e.target.value)} style={inputBase} placeholder="0" />
            </div>
          </div>

          {/* Availment mutual exclusion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', ...fw }}>
            <label style={checkRow}>
              <input
                type="checkbox"
                checked={isLabour ? lf.availMultipleTimes : pf.availMultipleTimes}
                onChange={(e) => isLabour ? setL('availMultipleTimes', e.target.checked) : setP('availMultipleTimes', e.target.checked)}
                style={{ width: '15px', height: '15px' }}
              />
              Avail Multiple Times
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Avail Limit</label>
              <input
                type="number" min={1}
                disabled={isLabour ? lf.availMultipleTimes : pf.availMultipleTimes}
                value={isLabour ? lf.availLimit : pf.availLimit}
                onChange={(e) => isLabour ? setL('availLimit', e.target.value) : setP('availLimit', e.target.value)}
                style={{ ...inputBase, maxWidth: '80px', opacity: (isLabour ? lf.availMultipleTimes : pf.availMultipleTimes) ? 0.4 : 1 }}
                placeholder="—"
              />
            </div>
          </div>

          {/* Contract */}
          <div style={{ ...fw }}>
            <label style={labelMuted}>Applicable Contract</label>
            <select value={isLabour ? lf.applicableContract : pf.applicableContract} onChange={(e) => isLabour ? setL('applicableContract', e.target.value) : setP('applicableContract', e.target.value)} style={inputBase}>
              <option value="">— None —</option>
              {MOCK_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Flags */}
          <div style={sectionTitle}>Flags &amp; Sequencing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', ...fw }}>
            <label style={checkRow}>
              <input type="checkbox" checked={isLabour ? lf.autoPopulate : pf.autoPopulate} onChange={(e) => isLabour ? setL('autoPopulate', e.target.checked) : setP('autoPopulate', e.target.checked)} style={{ width: '15px', height: '15px' }} />
              Auto Populate
            </label>
            {!isLabour && (
              <label style={checkRow}>
                <input type="checkbox" checked={pf.autoFetch} onChange={(e) => setP('autoFetch', e.target.checked)} style={{ width: '15px', height: '15px' }} />
                Auto Fetch
              </label>
            )}
            <label style={checkRow}>
              <input type="checkbox" checked={isLabour ? lf.mandatory : pf.mandatory} onChange={(e) => isLabour ? setL('mandatory', e.target.checked) : setP('mandatory', e.target.checked)} style={{ width: '15px', height: '15px' }} />
              Mandatory
            </label>
          </div>
          <div style={{ ...threeCol, ...fw }}>
            <div>
              <label style={labelMuted}>Sequence</label>
              <input type="number" min={1} value={isLabour ? lf.sequence : pf.sequence} onChange={(e) => isLabour ? setL('sequence', e.target.value) : setP('sequence', e.target.value)} style={inputBase} placeholder="1" />
            </div>
            <div>
              <label style={labelMuted}>Line Service Type</label>
              <input value={isLabour ? lf.lineServiceType : pf.lineServiceType} onChange={(e) => isLabour ? setL('lineServiceType', e.target.value) : setP('lineServiceType', e.target.value)} style={inputBase} placeholder="—" />
            </div>
            <div>
              <label style={labelMuted}>At Least</label>
              <input value={isLabour ? lf.atLeast : pf.atLeast} onChange={(e) => isLabour ? setL('atLeast', e.target.value) : setP('atLeast', e.target.value)} style={inputBase} placeholder="—" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: 'var(--color-surface)' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </>
  );
};
