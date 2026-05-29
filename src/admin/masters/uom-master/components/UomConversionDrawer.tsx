import React, { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { UomConversion, ConversionFormErrors } from '../types/uomMaster.types';
import { ROUNDING_RULES, DECIMAL_PRECISION_OPTIONS, MOCK_UOMS } from '../constants/uomMaster.constants';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UomConversionDrawerProps {
  open: boolean;
  onClose: () => void;
  /** The UOM currently being edited (pre-fills From Unit) */
  currentUnitCode: string;
  currentUnitName: string;
  /** All conversions already on this UOM — used for duplicate check */
  existingConversions: UomConversion[];
  /** null = add mode; non-null = edit mode */
  editingConversion: UomConversion | null;
  onSave: (conversion: UomConversion, autoReverse: UomConversion | null) => void;
}

// ─── Local form state ─────────────────────────────────────────────────────────

interface ConversionForm {
  fromUnitCode: string;
  fromUnitName: string;
  toUnitCode: string;
  toUnitName: string;
  conversionFactor: string;
  decimalPrecision: string;
  roundingRule: string;
}

const EMPTY_FORM: ConversionForm = {
  fromUnitCode:    '',
  fromUnitName:    '',
  toUnitCode:      '',
  toUnitName:      '',
  conversionFactor: '',
  decimalPrecision: '',
  roundingRule:     '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UomConversionDrawer({
  open,
  onClose,
  currentUnitCode,
  currentUnitName,
  existingConversions,
  editingConversion,
  onSave,
}: UomConversionDrawerProps) {
  const [form,         setForm]         = useState<ConversionForm>(EMPTY_FORM);
  const [autoReverse,  setAutoReverse]  = useState(true);
  const [errors,       setErrors]       = useState<ConversionFormErrors>({});

  const isEditMode = editingConversion !== null;

  // Reset form every time drawer opens
  useEffect(() => {
    if (!open) return;
    if (editingConversion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        fromUnitCode:     editingConversion.fromUnitCode,
        fromUnitName:     editingConversion.fromUnitName,
        toUnitCode:       editingConversion.toUnitCode,
        toUnitName:       editingConversion.toUnitName,
        conversionFactor: String(editingConversion.conversionFactor),
        decimalPrecision: editingConversion.decimalPrecision !== null
          ? String(editingConversion.decimalPrecision)
          : '',
        roundingRule: editingConversion.roundingRule,
      });
      setAutoReverse(false); // existing conversion — no re-creation of reverse
    } else {
      setForm({
        ...EMPTY_FORM,
        fromUnitCode: currentUnitCode,
        fromUnitName: currentUnitName,
      });
      setAutoReverse(true);
    }
    setErrors({});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed ───────────────────────────────────────────────────────────────

  const availableUnits = MOCK_UOMS.filter((u) => u.unitCode !== form.fromUnitCode);

  const reversePreview: string | null = (() => {
    if (!autoReverse || !form.toUnitCode || !form.conversionFactor) return null;
    const factor = parseFloat(form.conversionFactor);
    if (!isFinite(factor) || factor <= 0) return null;
    const reverse = parseFloat((1 / factor).toFixed(8));
    return `${form.toUnitName || form.toUnitCode} → ${form.fromUnitName || form.fromUnitCode} = ${reverse}`;
  })();

  // ── Handlers ───────────────────────────────────────────────────────────────

  function setField(field: keyof ConversionForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ConversionFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleToUnitChange(code: string) {
    const uom = MOCK_UOMS.find((u) => u.unitCode === code);
    setForm((prev) => ({
      ...prev,
      toUnitCode: code,
      toUnitName: uom?.unitName ?? '',
    }));
    setErrors((prev) => ({ ...prev, toUnitCode: undefined }));
  }

  function validate(): boolean {
    const errs: ConversionFormErrors = {};
    if (!form.toUnitCode) errs.toUnitCode = 'To Unit is required.';
    if (form.fromUnitCode && form.toUnitCode && form.fromUnitCode === form.toUnitCode) {
      errs.toUnitCode = 'From Unit and To Unit cannot be the same.';
    }
    const factor = parseFloat(form.conversionFactor);
    if (!form.conversionFactor || isNaN(factor)) {
      errs.conversionFactor = 'Conversion Factor is required.';
    } else if (factor <= 0) {
      errs.conversionFactor = 'Conversion Factor must be greater than 0.';
    }
    // Duplicate check (skip in edit mode for the same conversion)
    if (!isEditMode && form.fromUnitCode && form.toUnitCode) {
      const duplicate = existingConversions.find(
        (c) => c.fromUnitCode === form.fromUnitCode && c.toUnitCode === form.toUnitCode
      );
      if (duplicate) {
        errs.general = `Conversion ${form.fromUnitName} → ${form.toUnitName} already exists.`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now    = Date.now();
    const factor = parseFloat(form.conversionFactor);

    const conversion: UomConversion = {
      id:               editingConversion?.id ?? `c-${now}`,
      fromUnitCode:     form.fromUnitCode,
      fromUnitName:     form.fromUnitName,
      toUnitCode:       form.toUnitCode,
      toUnitName:       form.toUnitName,
      conversionFactor: factor,
      decimalPrecision: form.decimalPrecision !== '' ? parseInt(form.decimalPrecision, 10) : null,
      roundingRule:     form.roundingRule,
      isAutoReverse:    false,
      status:           'Active',
    };

    let reverseConversion: UomConversion | null = null;
    if (autoReverse && !isEditMode) {
      const reverseFactor = parseFloat((1 / factor).toFixed(8));
      reverseConversion = {
        id:               `c-${now}-rev`,
        fromUnitCode:     form.toUnitCode,
        fromUnitName:     form.toUnitName,
        toUnitCode:       form.fromUnitCode,
        toUnitName:       form.fromUnitName,
        conversionFactor: reverseFactor,
        decimalPrecision: form.decimalPrecision !== '' ? parseInt(form.decimalPrecision, 10) : null,
        roundingRule:     form.roundingRule,
        isAutoReverse:    true,
        status:           'Active',
      };
    }

    onSave(conversion, reverseConversion);
  }

  if (!open) return null;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.32)',
    zIndex: 1299,
  };

  const drawer: React.CSSProperties = {
    position: 'fixed', right: 0, top: 0, bottom: 0,
    width: '480px', maxWidth: '96vw',
    background: 'var(--color-surface, #fff)',
    zIndex: 1300,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.14)',
  };

  const header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border, #E5E7EB)',
    flexShrink: 0,
  };

  const body: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '24px 20px',
    display: 'flex', flexDirection: 'column', gap: '18px',
  };

  const footer: React.CSSProperties = {
    padding: '14px 20px',
    borderTop: '1px solid var(--color-border, #E5E7EB)',
    display: 'flex', gap: '10px', justifyContent: 'flex-end',
    flexShrink: 0,
  };

  const label: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--color-text-secondary, #6B7280)',
    marginBottom: '5px', letterSpacing: '0.02em',
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: '1px solid var(--color-border, #E5E7EB)',
    borderRadius: '8px', fontSize: '14px',
    background: 'var(--color-surface, #fff)',
    color: 'var(--color-text, #111827)',
    outline: 'none', boxSizing: 'border-box',
  };

  const errorMsg: React.CSSProperties = {
    fontSize: '11px', color: '#DC2626', marginTop: '4px',
  };

  const primaryBtn: React.CSSProperties = {
    padding: '8px 20px', borderRadius: '8px', border: 'none',
    background: '#111827', color: '#fff', fontWeight: 600,
    fontSize: '13px', cursor: 'pointer',
  };

  const ghostBtn: React.CSSProperties = {
    padding: '8px 18px', borderRadius: '8px',
    border: '1px solid var(--color-border, #E5E7EB)',
    background: 'transparent', color: 'var(--color-text, #111827)',
    fontWeight: 500, fontSize: '13px', cursor: 'pointer',
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px', display: 'flex', alignItems: 'center',
    color: 'var(--color-text-secondary, #6B7280)', borderRadius: '6px',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={overlay} onClick={onClose} />
      <div style={drawer}>
        {/* Header */}
        <div style={header}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text, #111827)' }}>
              {isEditMode ? 'Edit Conversion' : 'Add Unit Conversion'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6B7280)', marginTop: '2px' }}>
              Define how this unit converts to another
            </div>
          </div>
          <button style={iconBtnStyle} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={body}>

          {/* General error */}
          {errors.general && (
            <div style={{
              padding: '10px 14px',
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: '8px', fontSize: '13px', color: '#DC2626',
            }}>
              {errors.general}
            </div>
          )}

          {/* Row: To Unit */}
          <div>
            <label style={label}>To Unit <span style={{ color: '#DC2626' }}>*</span></label>
            <select
              value={form.toUnitCode}
              onChange={(e) => handleToUnitChange(e.target.value)}
              style={{ ...inputBase, borderColor: errors.toUnitCode ? '#DC2626' : undefined }}
            >
              <option value="">Select unit…</option>
              {availableUnits.map((u) => (
                <option key={u.unitCode} value={u.unitCode}>
                  {u.unitName} ({u.unitSymbol})
                </option>
              ))}
            </select>
            {errors.toUnitCode && <div style={errorMsg}>{errors.toUnitCode}</div>}
          </div>

          {/* Row: Conversion Factor */}
          <div>
            <label style={label}>
              Conversion Factor <span style={{ color: '#DC2626' }}>*</span>
              {form.fromUnitCode && form.toUnitCode && (
                <span style={{ fontWeight: 400, marginLeft: '8px', color: '#9CA3AF' }}>
                  1 {form.fromUnitName || form.fromUnitCode} =
                </span>
              )}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="0"
                step="any"
                value={form.conversionFactor}
                onChange={(e) => setField('conversionFactor', e.target.value)}
                placeholder="e.g. 1000"
                style={{ ...inputBase, borderColor: errors.conversionFactor ? '#DC2626' : undefined }}
              />
              {form.toUnitCode && (
                <span style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {form.toUnitName || form.toUnitCode}
                </span>
              )}
            </div>
            {errors.conversionFactor && <div style={errorMsg}>{errors.conversionFactor}</div>}
          </div>

          {/* Row: Decimal Precision + Rounding Rule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={label}>Decimal Precision</label>
              <select
                value={form.decimalPrecision}
                onChange={(e) => setField('decimalPrecision', e.target.value)}
                style={inputBase}
              >
                <option value="">— optional —</option>
                {DECIMAL_PRECISION_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Rounding Rule</label>
              <select
                value={form.roundingRule}
                onChange={(e) => setField('roundingRule', e.target.value)}
                style={inputBase}
              >
                <option value="">— optional —</option>
                {ROUNDING_RULES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-reverse toggle */}
          {!isEditMode && (
            <div style={{
              padding: '14px 16px',
              background: autoReverse ? '#F0FDF4' : 'var(--color-bg-subtle, #F9FAFB)',
              border: `1px solid ${autoReverse ? '#86EFAC' : 'var(--color-border, #E5E7EB)'}`,
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={15} color={autoReverse ? '#16A34A' : '#9CA3AF'} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text, #111827)' }}>
                      Auto-create reverse conversion
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6B7280)', marginTop: '1px' }}>
                      Saves you from adding the inverse manually
                    </div>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setAutoReverse((v) => !v)}
                  aria-pressed={autoReverse}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none',
                    background: autoReverse ? '#16A34A' : '#D1D5DB',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: autoReverse ? '21px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {/* Reverse preview */}
              {autoReverse && reversePreview && (
                <div style={{
                  marginTop: '10px', fontSize: '12px', color: '#15803D',
                  padding: '6px 10px', background: '#DCFCE7', borderRadius: '6px',
                }}>
                  ↔ Will also add: <strong>{reversePreview}</strong>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={footer}>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={primaryBtn} onClick={handleSave}>
            {isEditMode ? 'Update' : 'Add Conversion'}
          </button>
        </div>
      </div>
    </>
  );
}
