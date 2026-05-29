import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import AppDialog from '../../../../components/app/AppDialog';
import type { BPItemMapping, MaxQtyScope } from '../types/supplierMaster.types';
import {
  MOCK_ITEMS,
  ITEM_CATEGORIES,
  MAX_QTY_SCOPES,
} from '../constants/supplierMaster.constants';

// ─── Internal types ────────────────────────────────────────────────────────────

interface RowConfig {
  orderUom: string;
  orderMultiple: number;
  minOrderQty: number;
  maxOrderQty: number;
  maxQtyScope: MaxQtyScope;
  stdLeadTimeDays: number;
  minLeadTimeDays: number;
  maxLeadTimeDays: number;
  isReturnable: boolean;
  returnPeriodDays: number;
  effectiveFromDate: string;
  effectiveToDate: string;
}

type ColKey = keyof RowConfig;

interface FillState {
  col: ColKey;
  label: string;
  inputType: 'dropdown' | 'number' | 'date';
  options?: string[];
  value: string;
}

const DEFAULT_ROW: RowConfig = {
  orderUom: '',
  orderMultiple: 0,
  minOrderQty: 0,
  maxOrderQty: 0,
  maxQtyScope: 'Per Order',
  stdLeadTimeDays: 7,
  minLeadTimeDays: 0,
  maxLeadTimeDays: 0,
  isReturnable: false,
  returnPeriodDays: 0,
  effectiveFromDate: '',
  effectiveToDate: '',
};

// Grid template: Item | MinQty | MaxQty | Scope | StdLead | Returnable | expand | remove
const GRID_TPL = 'minmax(130px,1fr) 58px 58px 80px 56px 65px 28px 28px';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ItemSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  existingMappingCodes: string[];
  onConfirm: (newMappings: BPItemMapping[]) => void;
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const sLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)',
  display: 'block', marginBottom: '3px',
};
const sCell: React.CSSProperties = {
  fontSize: '11px', color: 'var(--color-text-muted)', padding: '0 2px',
};
const sInput: React.CSSProperties = {
  width: '100%', padding: '4px 6px', fontSize: '12px',
  border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none',
  background: 'var(--color-surface)', color: 'var(--color-text)', boxSizing: 'border-box',
};
const sFillBtn = (primary: boolean): React.CSSProperties => ({
  fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
  border: primary ? 'none' : '1px solid #1D4ED8',
  background: primary ? '#1D4ED8' : '#fff',
  color: primary ? '#fff' : '#1D4ED8',
  cursor: 'pointer', whiteSpace: 'nowrap',
});
const sColFill: React.CSSProperties = {
  fontSize: '9px', padding: '1px 3px', borderRadius: '3px',
  border: '1px solid var(--color-border)', background: 'transparent',
  cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1,
};
const sIconBtn = (danger?: boolean): React.CSSProperties => ({
  width: '24px', height: '24px', border: '1px solid var(--color-border)',
  borderRadius: '4px', background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: danger ? '#DC2626' : 'var(--color-text-muted)', flexShrink: 0,
  padding: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────

export function ItemSelectorDialog({
  open, onClose, existingMappingCodes, onConfirm,
}: ItemSelectorDialogProps) {
  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [rowData, setRowData]             = useState<Record<string, RowConfig>>({});
  const [expandedRows, setExpandedRows]   = useState<Set<string>>(new Set());
  const [fill, setFill]                   = useState<FillState | null>(null);

  const gridBodyRef = useRef<HTMLDivElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const mappedSet       = new Set(existingMappingCodes);
  const filtered        = MOCK_ITEMS.filter((item) => {
    const q = search.toLowerCase();
    return (
      (!q || item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)) &&
      (!category || item.category === category)
    );
  });
  const selectable      = filtered.filter((i) => !mappedSet.has(i.code));
  const allChecked      = selectable.length > 0 && selectable.every((i) => selectedCodes.includes(i.code));
  const someChecked     = selectable.some((i) => selectedCodes.includes(i.code));
  const canConfirm      = selectedCodes.length > 0;

  // ── Row toggles ──────────────────────────────────────────────────────────────
  function toggleItem(code: string) {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        setRowData((rd) => { const n = { ...rd }; delete n[code]; return n; });
        setExpandedRows((er) => { const s = new Set(er); s.delete(code); return s; });
        return prev.filter((c) => c !== code);
      }
      const item = MOCK_ITEMS.find((i) => i.code === code);
      setRowData((rd) => ({ ...rd, [code]: { ...DEFAULT_ROW, orderUom: item?.uom ?? '' } }));
      return [...prev, code];
    });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      const toAdd = selectable.filter((i) => !selectedCodes.includes(i.code)).map((i) => i.code);
      setSelectedCodes((prev) => [...prev, ...toAdd]);
      setRowData((rd) => {
        const n = { ...rd };
        toAdd.forEach((c) => {
          if (!n[c]) {
            const it = MOCK_ITEMS.find((i) => i.code === c);
            n[c] = { ...DEFAULT_ROW, orderUom: it?.uom ?? '' };
          }
        });
        return n;
      });
    } else {
      const codes = new Set(selectable.map((i) => i.code));
      setSelectedCodes((prev) => prev.filter((c) => !codes.has(c)));
      setRowData((rd) => { const n = { ...rd }; [...codes].forEach((c) => delete n[c]); return n; });
      setExpandedRows((er) => { const s = new Set(er); [...codes].forEach((c) => s.delete(c)); return s; });
    }
  }

  // ── Field update ─────────────────────────────────────────────────────────────
  function updateField<K extends ColKey>(code: string, field: K, value: RowConfig[K]) {
    setRowData((rd) => ({ ...rd, [code]: { ...rd[code], [field]: value } }));
  }

  // ── Copy from above ───────────────────────────────────────────────────────────
  function copyFromAbove(code: string) {
    const idx = selectedCodes.indexOf(code);
    if (idx > 0) {
      const above = selectedCodes[idx - 1];
      setRowData((rd) => ({ ...rd, [code]: { ...rd[above] } }));
    }
  }

  // ── Fill column ───────────────────────────────────────────────────────────────
  function openFill(col: ColKey, label: string, inputType: FillState['inputType'], options?: string[]) {
    setFill({ col, label, inputType, options, value: '' });
  }

  function applyFill(mode: 'all' | 'empty') {
    if (!fill) return;
    const { col, value, inputType } = fill;
    const coerced: string | number | boolean =
      inputType === 'number'  ? (Number(value) || 0) :
      col === 'isReturnable'  ? (value === 'true')   : value;

    setRowData((rd) => {
      const n = { ...rd };
      selectedCodes.forEach((code) => {
        const cur = n[code]?.[col];
        const isEmpty = cur === '' || cur === undefined || cur === null;
        if (mode === 'all' || isEmpty) {
          n[code] = { ...n[code], [col]: coerced as RowConfig[typeof col] };
        }
      });
      return n;
    });
    setFill(null);
  }

  // ── Keyboard nav ─────────────────────────────────────────────────────────────
  function onCellKeyDown(e: React.KeyboardEvent<HTMLElement>, rowIdx: number, colKey: string) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'SELECT') return;
    e.preventDefault();
    const dir = e.key === 'ArrowUp' ? -1 : 1;
    const target = gridBodyRef.current?.querySelector<HTMLElement>(
      `[data-row="${rowIdx + dir}"][data-col="${colKey}"]`,
    );
    target?.focus();
  }

  // ── Confirm & reset ──────────────────────────────────────────────────────────
  function handleConfirm() {
    const ts = Date.now();
    const newMappings: BPItemMapping[] = selectedCodes.map((code, i) => {
      const item = MOCK_ITEMS.find((it) => it.code === code);
      const cfg  = rowData[code] ?? DEFAULT_ROW;
      return {
        id: `BPIM-${ts}-${i}`,
        itemCode: code,
        itemName: item?.name ?? code,
        orderUom: cfg.orderUom,
        orderMultiple: cfg.orderMultiple,
        minOrderQty: cfg.minOrderQty,
        maxOrderQty: cfg.maxOrderQty,
        maxQtyScope: cfg.maxQtyScope,
        stdLeadTimeDays: cfg.stdLeadTimeDays,
        minLeadTimeDays: cfg.minLeadTimeDays,
        maxLeadTimeDays: cfg.maxLeadTimeDays,
        isReturnable: cfg.isReturnable,
        returnPeriodDays: cfg.returnPeriodDays,
        effectiveFromDate: cfg.effectiveFromDate,
        effectiveToDate: cfg.effectiveToDate,
        status: 'Active',
      };
    });
    onConfirm(newMappings);
    resetState();
  }

  function handleClose() { resetState(); onClose(); }

  function resetState() {
    setSearch(''); setCategory(''); setSelectedCodes([]); setRowData({});
    setExpandedRows(new Set()); setFill(null);
  }

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusText =
    selectedCodes.length === 0
      ? 'No items selected'
      : `${selectedCodes.length} item${selectedCodes.length !== 1 ? 's' : ''} selected ✓`;
  const statusColor = selectedCodes.length === 0 ? 'var(--color-text-muted)' : '#15803D';

  // ── Header fill button helper ─────────────────────────────────────────────────
  function FillBtn({ col, label, inputType, options }: { col: ColKey; label: string; inputType: FillState['inputType']; options?: string[] }) {
    return (
      <button
        type="button" title={`Fill all rows: ${label}`}
        onClick={() => openFill(col, label, inputType, options)}
        style={{ ...sColFill, background: fill?.col === col ? '#EFF6FF' : 'transparent' }}
      >↓</button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title="Add Items"
      showCloseButton
      width={1100}
      paperSx={{ '& .MuiDialogContent-root': { overflow: 'hidden', padding: 0 } }}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: statusColor }}>
            {statusText}
          </span>
          <button
            type="button" onClick={handleClose}
            style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}
          >Cancel</button>
          <button
            type="button" onClick={handleConfirm} disabled={!canConfirm}
            style={{ padding: '7px 18px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: canConfirm ? 'var(--color-primary)' : '#9CA3AF', color: '#fff', cursor: canConfirm ? 'pointer' : 'not-allowed' }}
          >
            Add {selectedCodes.length > 0 ? `${selectedCodes.length} ` : ''}Item{selectedCodes.length !== 1 ? 's' : ''}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '520px', overflow: 'hidden' }}>

        {/* ── Left: catalogue browser ─────────────────────────────────────── */}
        <div style={{ flex: '0 0 390px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Search + filter */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '8px', background: 'var(--color-surface)' }}>
            <input
              type="search" placeholder="Search by code or name…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, fontSize: '13px', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-text)', minWidth: '120px' }}
            >
              <option value="">All categories</option>
              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 78px 1fr 90px 46px', padding: '0 12px', height: '28px', alignItems: 'center', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
            <input
              type="checkbox" checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
              onChange={(e) => toggleAll(e.target.checked)}
              style={{ width: '13px', height: '13px', cursor: 'pointer' }}
            />
            <span style={{ ...sCell, fontWeight: 600 }}>Code</span>
            <span style={{ ...sCell, fontWeight: 600 }}>Name</span>
            <span style={{ ...sCell, fontWeight: 600 }}>Category</span>
            <span style={{ ...sCell, fontWeight: 600 }}>UOM</span>
          </div>

          {/* Item list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No items match your search.
              </div>
            ) : filtered.map((item) => {
              const alreadyMapped = mappedSet.has(item.code);
              const checked       = selectedCodes.includes(item.code);
              return (
                <div
                  key={item.code}
                  onClick={() => { if (!alreadyMapped) toggleItem(item.code); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '32px 78px 1fr 90px 46px',
                    padding: '0 12px', height: '34px', alignItems: 'center',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: alreadyMapped ? 'default' : 'pointer',
                    background: checked ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
                    opacity: alreadyMapped ? 0.5 : 1,
                  }}
                >
                  <input
                    type="checkbox" checked={checked} disabled={alreadyMapped}
                    onChange={() => {}} onClick={(e) => e.stopPropagation()}
                    style={{ width: '13px', height: '13px', cursor: alreadyMapped ? 'not-allowed' : 'pointer' }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>{item.code}</span>
                  <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                    {item.name}
                    {alreadyMapped && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: '4px' }}>
                        Added
                      </span>
                    )}
                  </span>
                  <span style={{ ...sCell, fontSize: '11px' }}>{item.category}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 5px',
                    borderRadius: '4px', background: '#F0F9FF', color: '#0369A1',
                    alignSelf: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{item.uom}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: configure items ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Right panel header */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>Configure Items</span>
            {selectedCodes.length > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                background: '#DCFCE7', color: '#15803D',
              }}>
                {selectedCodes.length} selected
              </span>
            )}
            <span style={{ flex: 1 }} />
            {selectedCodes.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                ↓ fills all rows in column  ·  ↑ copies row above
              </span>
            )}
          </div>

          {/* Fill banner */}
          {fill && (
            <div style={{ padding: '7px 14px', background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap' }}>
                Fill: {fill.label}
              </span>
              {fill.inputType === 'dropdown' && fill.options ? (
                <select
                  value={fill.value}
                  onChange={(e) => setFill((f) => f ? { ...f, value: e.target.value } : null)}
                  style={{ ...sInput, maxWidth: '160px', padding: '4px 6px' }}
                >
                  <option value="">Select…</option>
                  {fill.options.map((o) => (
                    <option key={o} value={o}>
                      {o === 'true' ? 'Returnable' : o === 'false' ? 'Not Returnable' : o}
                    </option>
                  ))}
                </select>
              ) : fill.inputType === 'number' ? (
                <input
                  type="number" min="0" value={fill.value} placeholder="0"
                  onChange={(e) => setFill((f) => f ? { ...f, value: e.target.value } : null)}
                  style={{ ...sInput, maxWidth: '100px', padding: '4px 6px' }}
                />
              ) : (
                <input
                  type="date" value={fill.value}
                  onChange={(e) => setFill((f) => f ? { ...f, value: e.target.value } : null)}
                  style={{ ...sInput, maxWidth: '150px', padding: '4px 6px' }}
                />
              )}
              <button
                type="button"
                disabled={fill.inputType !== 'number' && !fill.value}
                onClick={() => applyFill('all')}
                style={sFillBtn(true)}
              >
                Apply to all rows
              </button>
              <button
                type="button"
                disabled={fill.inputType !== 'number' && !fill.value}
                onClick={() => applyFill('empty')}
                style={sFillBtn(false)}
              >
                Empty rows only
              </button>
              <button
                type="button" onClick={() => setFill(null)}
                style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Empty state */}
          {selectedCodes.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', gap: '10px', padding: '24px' }}>
              <div style={{ fontSize: '36px', lineHeight: 1 }}>☑</div>
              <div style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', color: 'var(--color-text)' }}>
                Tick items from the catalogue to configure them here
              </div>
              <div style={{ fontSize: '12px', textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>
                Each item gets its own quantities, lead times, and more.
                Use the ↓ icon on any column header to fill all rows at once.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} ref={gridBodyRef}>

              {/* Grid column header (sticky) */}
              <div style={{
                display: 'grid', gridTemplateColumns: GRID_TPL, columnGap: '4px',
                padding: '0 10px', height: '30px', alignItems: 'center',
                background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)',
                position: 'sticky', top: 0, zIndex: 2, flexShrink: 0,
              }}>
                <span style={{ ...sCell, fontWeight: 600 }}>Item</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ ...sCell, fontWeight: 600 }}>Min</span>
                  <FillBtn col="minOrderQty" label="Min Order Qty" inputType="number" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ ...sCell, fontWeight: 600 }}>Max</span>
                  <FillBtn col="maxOrderQty" label="Max Order Qty" inputType="number" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ ...sCell, fontWeight: 600 }}>Scope</span>
                  <FillBtn col="maxQtyScope" label="Max Qty Scope" inputType="dropdown" options={MAX_QTY_SCOPES} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ ...sCell, fontWeight: 600 }}>Lead</span>
                  <FillBtn col="stdLeadTimeDays" label="Std Lead (days)" inputType="number" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ ...sCell, fontWeight: 600 }}>Ret.</span>
                  <FillBtn col="isReturnable" label="Returnable" inputType="dropdown" options={['true', 'false']} />
                </div>

                <span />
                <span />
              </div>

              {/* Item rows */}
              {selectedCodes.map((code, rowIdx) => {
                const item     = MOCK_ITEMS.find((i) => i.code === code);
                const cfg      = rowData[code] ?? DEFAULT_ROW;
                const expanded = expandedRows.has(code);
                const rowBg  = rowIdx % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--color-surface-subtle) 60%, transparent)';

                return (
                  <div key={code} style={{ borderBottom: '1px solid var(--color-border)', background: rowBg }}>

                    {/* Primary row */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: GRID_TPL, columnGap: '4px',
                      padding: '5px 10px', alignItems: 'center', minHeight: '42px',
                    }}>

                      {/* Item identifier */}
                      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '1px', paddingRight: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {rowIdx > 0 && (
                            <button
                              type="button"
                              title="Copy all values from the row above"
                              onClick={() => copyFromAbove(code)}
                              style={{
                                flexShrink: 0, width: '15px', height: '15px', fontSize: '9px',
                                borderRadius: '3px', border: '1px solid var(--color-border)',
                                background: 'transparent', cursor: 'pointer',
                                color: 'var(--color-text-muted)', padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >↑</button>
                          )}
                          <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {code}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item?.name ?? code}
                        </span>
                      </div>

                      {/* Min Qty */}
                      <input
                        type="number" min="0" value={cfg.minOrderQty}
                        data-row={rowIdx} data-col="minOrderQty"
                        onChange={(e) => updateField(code, 'minOrderQty', Number(e.target.value))}
                        onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'minOrderQty')}
                        style={sInput}
                      />

                      {/* Max Qty */}
                      <input
                        type="number" min="0" value={cfg.maxOrderQty}
                        data-row={rowIdx} data-col="maxOrderQty"
                        onChange={(e) => updateField(code, 'maxOrderQty', Number(e.target.value))}
                        onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'maxOrderQty')}
                        style={sInput}
                      />

                      {/* Scope */}
                      <select
                        value={cfg.maxQtyScope}
                        data-row={rowIdx} data-col="maxQtyScope"
                        onChange={(e) => updateField(code, 'maxQtyScope', e.target.value as MaxQtyScope)}
                        onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'maxQtyScope')}
                        style={sInput}
                      >
                        {MAX_QTY_SCOPES.map((s) => (
                          <option key={s} value={s}>{s.replace('Per ', '')}</option>
                        ))}
                      </select>

                      {/* Std Lead */}
                      <input
                        type="number" min="0" value={cfg.stdLeadTimeDays}
                        data-row={rowIdx} data-col="stdLeadTimeDays"
                        onChange={(e) => updateField(code, 'stdLeadTimeDays', Number(e.target.value))}
                        onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'stdLeadTimeDays')}
                        style={sInput}
                      />

                      {/* Returnable checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox" checked={cfg.isReturnable}
                          onChange={(e) => updateField(code, 'isReturnable', e.target.checked)}
                          style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                      </label>

                      {/* Expand toggle */}
                      <button
                        type="button"
                        title={expanded ? 'Hide more fields' : 'More fields (lead min/max, dates…)'}
                        onClick={() => setExpandedRows((s) => {
                          const n = new Set(s);
                          n.has(code) ? n.delete(code) : n.add(code);
                          return n;
                        })}
                        style={{ ...sIconBtn(), background: expanded ? 'var(--color-surface-subtle)' : 'transparent' }}
                      >
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Remove */}
                      <button
                        type="button" title="Remove from selection"
                        onClick={() => toggleItem(code)}
                        style={sIconBtn(true)}
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Secondary row (expanded) */}
                    {expanded && (
                      <div style={{ padding: '6px 10px 10px 10px', background: 'color-mix(in srgb, var(--color-surface-subtle) 50%, transparent)', borderTop: '1px dashed var(--color-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
                          <div>
                            <label style={sLabel}>Order Multiple</label>
                            <input
                              type="number" min="0" value={cfg.orderMultiple}
                              data-row={rowIdx} data-col="orderMultiple"
                              onChange={(e) => updateField(code, 'orderMultiple', Number(e.target.value))}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'orderMultiple')}
                              style={sInput}
                            />
                          </div>
                          <div>
                            <label style={sLabel}>Min Lead (d)</label>
                            <input
                              type="number" min="0" value={cfg.minLeadTimeDays}
                              data-row={rowIdx} data-col="minLeadTimeDays"
                              onChange={(e) => updateField(code, 'minLeadTimeDays', Number(e.target.value))}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'minLeadTimeDays')}
                              style={sInput}
                            />
                          </div>
                          <div>
                            <label style={sLabel}>Max Lead (d)</label>
                            <input
                              type="number" min="0" value={cfg.maxLeadTimeDays}
                              data-row={rowIdx} data-col="maxLeadTimeDays"
                              onChange={(e) => updateField(code, 'maxLeadTimeDays', Number(e.target.value))}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'maxLeadTimeDays')}
                              style={sInput}
                            />
                          </div>
                          <div>
                            <label style={sLabel}>Return Period (d)</label>
                            <input
                              type="number" min="0" value={cfg.returnPeriodDays}
                              disabled={!cfg.isReturnable}
                              data-row={rowIdx} data-col="returnPeriodDays"
                              onChange={(e) => updateField(code, 'returnPeriodDays', Number(e.target.value))}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'returnPeriodDays')}
                              style={{ ...sInput, ...(cfg.isReturnable ? {} : { opacity: 0.4, pointerEvents: 'none' }) }}
                            />
                          </div>
                          <div>
                            <label style={sLabel}>Eff. From</label>
                            <input
                              type="date" value={cfg.effectiveFromDate}
                              data-row={rowIdx} data-col="effectiveFromDate"
                              onChange={(e) => updateField(code, 'effectiveFromDate', e.target.value)}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'effectiveFromDate')}
                              style={sInput}
                            />
                          </div>
                          <div>
                            <label style={sLabel}>Eff. To</label>
                            <input
                              type="date" value={cfg.effectiveToDate}
                              data-row={rowIdx} data-col="effectiveToDate"
                              onChange={(e) => updateField(code, 'effectiveToDate', e.target.value)}
                              onKeyDown={(e) => onCellKeyDown(e, rowIdx, 'effectiveToDate')}
                              style={sInput}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppDialog>
  );
}
