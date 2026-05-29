// ─── UOM Master — Form Page ───────────────────────────────────────────────────
// Follows the Supplier / Customer Master structural pattern exactly:
//   • Full-page layout with compact header, step sidebar (220px), and sticky footer
//   • Step 0 — General Details  |  Step 1 — Unit Conversions
//   • Draft → Activate lifecycle with SmartReviewDrawer
//   • uomService for all data persistence

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronRight,
  Info,
  Lock,
  Unlock,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { UomRecord, UomConversion, UomFormErrors, UomStatus } from '../types/uomMaster.types';
import { UomConversionDrawer } from '../components/UomConversionDrawer';
import {
  DEFAULT_UOM_FORM,
  UNIT_TYPES,
  ROUNDING_RULES,
  DECIMAL_PRECISION_OPTIONS,
  UNIT_TYPE_META,
} from '../constants/uomMaster.constants';
import { uomService } from '../services/uomService';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { index: 0, label: 'General Details' },
  { index: 1, label: 'Unit Conversions' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MASTER_KEY = 'unit-of-measurement';

function parseDateStr(s: string): Date | null {
  const [d, m, y] = s.split('/').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// ─── Component ────────────────────────────────────────────────────────────────

const UomFormPage: React.FC = () => {
  const navigate     = useNavigate();
  const { recordId } = useParams<{ recordId: string }>();
  const isNew        = !recordId;

  // ── Load existing record ────────────────────────────────────────────────
  const existing = useMemo(
    () => (recordId ? uomService.getById(recordId) ?? null : null),
    [recordId],
  );

  // ── Form state ──────────────────────────────────────────────────────────
  const [form,          setFormState]  = useState<Omit<UomRecord, 'id'>>({ ...DEFAULT_UOM_FORM });
  const [codeLocked,    setCodeLocked] = useState(true);
  const [errors,        setErrors]     = useState<UomFormErrors>({});
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [activeStep,    setActiveStep] = useState(0);
  const [hoveredStep,   setHoveredStep] = useState<number | null>(null);
  const [convExpanded,  setConvExpanded] = useState(true);

  // ── Conversion drawer ───────────────────────────────────────────────────
  const [drawerOpen,        setDrawerOpen]        = useState(false);
  const [editingConversion, setEditingConversion] = useState<UomConversion | null>(null);

  // ── Activation flow ─────────────────────────────────────────────────────
  const [reviewOpen, setReviewOpen] = useState(false);

  // ── Help ─────────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Derived status ──────────────────────────────────────────────────────
  const status     = (existing?.status ?? 'Draft') as UomStatus;
  const isActive   = status === 'Active';
  const isInactive = status === 'Inactive';
  const isViewOnly = isInactive;
  const canDel     = !isNew && status === 'Draft';

  // ── Track recent admin master ───────────────────────────────────────────
  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group  = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key:            master.key,
        label:          master.label,
        path:           master.path,
        groupLabel:     group.label,
        groupIconBg:    group.iconBg,
        groupIconColor: group.iconColor,
      });
    }
  }, []);

  // ── Seed form from existing record or generate new ──────────────────────
  useEffect(() => {
    if (!isNew && existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormState(existing as unknown as Omit<UomRecord, 'id'>);
      setCodeLocked(true);
    } else if (isNew) {
      setFormState({ ...DEFAULT_UOM_FORM, unitCode: uomService.generateCode() });
      setCodeLocked(true);
    }
  }, [isNew, recordId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field helper ────────────────────────────────────────────────────────
  const setField = useCallback(<K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof UomFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ── Auto-suggest symbol from name (new records only) ────────────────────
  useEffect(() => {
    if (!isNew) return;
    const words = form.unitName.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const suggested = words.length === 1
      ? words[0].substring(0, 3).toUpperCase()
      : words.map((w) => w[0]).join('').toUpperCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState((prev) => ({ ...prev, unitSymbol: suggested }));
  }, [form.unitName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback((forActivation = false): boolean => {
    const errs: UomFormErrors = {};
    if (!form.unitCode.trim())   errs.unitCode   = 'Unit Code is required.';
    if (!form.unitName.trim())   errs.unitName   = 'Unit Name is required.';
    if (form.unitName.length > 30) errs.unitName = 'Unit Name cannot exceed 30 characters.';
    if (!form.unitSymbol.trim()) errs.unitSymbol = 'Unit Symbol is required.';
    if (form.unitSymbol.length > 20) errs.unitSymbol = 'Unit Symbol cannot exceed 20 characters.';

    // Uniqueness checks (skip for the current record when editing)
    const others = uomService.getAll().filter((u) => u.id !== (existing?.id ?? ''));
    if (form.unitName.trim() && others.some((u) => u.unitName.toLowerCase() === form.unitName.trim().toLowerCase()))
      errs.unitName = 'Unit Name already exists.';
    if (form.unitSymbol.trim() && others.some((u) => u.unitSymbol.toLowerCase() === form.unitSymbol.trim().toLowerCase()))
      errs.unitSymbol = 'Unit Symbol already exists.';

    if (form.allowDecimal && form.qtyDecimalPrecision === null)
      errs.qtyDecimalPrecision = 'Decimal Precision is required when Allow Decimal is enabled.';

    if (form.effectiveFromDate && form.effectiveToDate) {
      const from = parseDateStr(form.effectiveFromDate);
      const to   = parseDateStr(form.effectiveToDate);
      if (from && to && to < from)
        errs.effectiveToDate = 'Effective To Date cannot be earlier than Effective From Date.';
    }

    if (forActivation && !form.unitType)
      errs.unitType = 'Unit Type is required to activate.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, existing]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saveAttempted) validate();
  }, [form, saveAttempted, validate]);

  // ── Step completion indicators ──────────────────────────────────────────
  function stepHasData(i: number): boolean {
    if (i === 0) return !!form.unitName.trim() && !!form.unitSymbol.trim();
    if (i === 1) return form.conversions.length > 0;
    return false;
  }

  function getStepCount(i: number): number {
    if (i === 1) return form.conversions.length;
    return 0;
  }

  // ── Build record from form state ────────────────────────────────────────
  function buildRecord(): Omit<UomRecord, 'id'> {
    return {
      unitCode:            form.unitCode.trim(),
      unitName:            form.unitName.trim(),
      unitSymbol:          form.unitSymbol.trim().toUpperCase(),
      unitType:            form.unitType,
      description:         form.description.trim(),
      allowDecimal:        form.allowDecimal,
      qtyDecimalPrecision: form.allowDecimal ? form.qtyDecimalPrecision : null,
      roundingRule:        form.roundingRule,
      status:              existing?.status ?? 'Draft',
      effectiveFromDate:   form.effectiveFromDate,
      effectiveToDate:     form.effectiveToDate,
      conversions:         form.conversions,
    };
  }

  // ── Save as Draft ───────────────────────────────────────────────────────
  function handleSaveDraft() {
    setSaveAttempted(true);
    if (!validate()) {
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }
    const data = buildRecord();
    if (isNew) {
      uomService.create(data);
      showToast(`"${data.unitName}" saved as Draft.`, 'success');
    } else if (existing) {
      uomService.update(existing.id, data);
      showToast('Draft saved.', 'success');
    }
    setSaveAttempted(false);
    navigate('/admin/master/unit-of-measurement');
  }

  // ── Save (Active record update) ─────────────────────────────────────────
  function handleSave() {
    setSaveAttempted(true);
    if (!validate()) {
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }
    if (existing) {
      uomService.update(existing.id, buildRecord());
      showToast('Changes saved.', 'success');
    }
    setSaveAttempted(false);
    navigate('/admin/master/unit-of-measurement');
  }

  // ── Activate request (opens SmartReviewDrawer) ──────────────────────────
  function handleActivateRequest() {
    setSaveAttempted(true);
    if (!validate(true)) {
      showToast('Please fix validation errors before activating.', 'error');
      return;
    }
    setReviewOpen(true);
  }

  // ── Confirm activation ──────────────────────────────────────────────────
  function confirmActivate() {
    if (!existing) return;
    uomService.update(existing.id, buildRecord());
    uomService.activate(existing.id);
    setReviewOpen(false);
    showToast(`"${form.unitName}" activated successfully.`, 'success');
    navigate('/admin/master/unit-of-measurement');
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!existing) return;
    uomService.delete(existing.id);
    navigate('/admin/master/unit-of-measurement');
  }

  // ── Conversion drawer helpers ───────────────────────────────────────────
  function openAddConversion()  { setEditingConversion(null);  setDrawerOpen(true); }
  function openEditConversion(conv: UomConversion) { setEditingConversion(conv); setDrawerOpen(true); }

  function handleConversionSave(conversion: UomConversion, autoReverse: UomConversion | null) {
    setFormState((prev) => {
      let convs = [...prev.conversions];
      if (editingConversion) {
        convs = convs.map((c) => c.id === conversion.id ? conversion : c);
      } else {
        convs = [...convs, conversion];
        if (autoReverse) convs = [...convs, autoReverse];
      }
      return { ...prev, conversions: convs };
    });
    setDrawerOpen(false);
  }

  function removeConversion(id: string) {
    setFormState((prev) => ({ ...prev, conversions: prev.conversions.filter((c) => c.id !== id) }));
  }

  // ── Page title ──────────────────────────────────────────────────────────
  const pageTitle = useMemo(() =>
    isNew ? 'New Unit of Measurement' : (form.unitName || 'Edit Unit'),
    [isNew, form.unitName],
  );

  // ── Shared inline styles ────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };
  const inputError: React.CSSProperties = { ...inputBase, borderColor: '#DC2626' };
  const labelMuted: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em',
    color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '5px',
  };
  const fieldErrTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };
  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '0 16px', height: '34px', borderRadius: '8px', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
  };
  const btnPrimary: React.CSSProperties = { ...btnBase, background: '#111827', color: '#fff' };
  const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
  const card: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '12px', overflow: 'hidden',
  };
  const cardHead: React.CSSProperties = {
    padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--color-surface-subtle)',
  };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

  // ── Step 0: General Details ─────────────────────────────────────────────
  function renderStep0() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={card}>
          <div style={cardHead}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Identity
            </span>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Code + Name */}
            <div style={grid2}>
              <div>
                <label style={labelMuted}>
                  Unit Code *
                  <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 400, color: '#9CA3AF', textTransform: 'none', letterSpacing: 0 }}>
                    {codeLocked ? 'auto-generated' : 'editing'}
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.unitCode}
                    readOnly={codeLocked || isViewOnly}
                    onChange={(e) => setField('unitCode', e.target.value)}
                    style={{
                      ...(errors.unitCode ? inputError : inputBase),
                      paddingRight: '42px', fontFamily: 'monospace',
                      background: codeLocked ? 'var(--color-surface-subtle)' : undefined,
                    }}
                    placeholder="Auto-generated"
                  />
                  {!isViewOnly && (
                    <button
                      type="button"
                      title={codeLocked ? 'Unlock to edit manually' : 'Lock and regenerate'}
                      onClick={() => {
                        if (!codeLocked) setField('unitCode', uomService.generateCode());
                        setCodeLocked((v) => !v);
                      }}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
                    >
                      {codeLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  )}
                </div>
                {errors.unitCode && <p style={fieldErrTxt}>{errors.unitCode}</p>}
              </div>
              <div>
                <label style={labelMuted}>Unit Name *</label>
                <input
                  value={form.unitName}
                  maxLength={30}
                  readOnly={isViewOnly}
                  onChange={(e) => setField('unitName', e.target.value)}
                  placeholder="e.g. Kilogram"
                  style={errors.unitName ? inputError : inputBase}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  {errors.unitName ? <p style={fieldErrTxt}>{errors.unitName}</p> : <div />}
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{form.unitName.length}/30</span>
                </div>
              </div>
            </div>

            {/* Symbol + Unit Type */}
            <div style={grid2}>
              <div>
                <label style={labelMuted}>Unit Symbol *</label>
                <input
                  value={form.unitSymbol}
                  maxLength={20}
                  readOnly={isViewOnly}
                  onChange={(e) => setField('unitSymbol', e.target.value.toUpperCase())}
                  placeholder="e.g. KG"
                  style={errors.unitSymbol ? inputError : inputBase}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  {errors.unitSymbol ? <p style={fieldErrTxt}>{errors.unitSymbol}</p> : <div />}
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{form.unitSymbol.length}/20</span>
                </div>
              </div>
              <div>
                <label style={labelMuted}>Unit Type {isActive ? '*' : ''}</label>
                <select
                  value={form.unitType}
                  disabled={isViewOnly}
                  onChange={(e) => setField('unitType', e.target.value as typeof form.unitType)}
                  style={errors.unitType ? { ...inputError } : inputBase}
                >
                  <option value="">— Select type —</option>
                  {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.unitType && <p style={fieldErrTxt}>{errors.unitType}</p>}
                {form.unitType && (
                  <div style={{ marginTop: '6px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '99px',
                      fontSize: '11px', fontWeight: 600,
                      background: UNIT_TYPE_META[form.unitType as keyof typeof UNIT_TYPE_META]?.bgColor ?? '#F3F4F6',
                      color:      UNIT_TYPE_META[form.unitType as keyof typeof UNIT_TYPE_META]?.color ?? '#374151',
                    }}>
                      {form.unitType}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelMuted}>Description</label>
              <textarea
                value={form.description}
                maxLength={300}
                rows={3}
                readOnly={isViewOnly}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Optional description for this unit"
                style={{ ...inputBase, resize: 'vertical', minHeight: '72px', lineHeight: '1.5', fontFamily: 'inherit' }}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{form.description.length}/300</div>
            </div>
          </div>
        </div>

        {/* Quantity Behaviour card */}
        <div style={card}>
          <div style={cardHead}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quantity Behaviour
            </span>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
              {/* Allow Decimal toggle */}
              <div
                role="button" tabIndex={0}
                onClick={() => {
                  if (isViewOnly) return;
                  const next = !form.allowDecimal;
                  setField('allowDecimal', next);
                  if (!next) setField('qtyDecimalPrecision', null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${form.allowDecimal ? '#86EFAC' : 'var(--color-border)'}`,
                  background: form.allowDecimal ? '#F0FDF4' : 'var(--color-surface-subtle)',
                  cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none',
                }}
              >
                <div style={{ width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0, background: form.allowDecimal ? '#16A34A' : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: '2px', left: form.allowDecimal ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Allow Decimal Quantity</span>
              </div>

              {/* Precision */}
              {form.allowDecimal && (
                <div style={{ minWidth: '180px', flex: '0 0 auto' }}>
                  <label style={labelMuted}>Decimal Precision *</label>
                  <select
                    value={form.qtyDecimalPrecision !== null ? String(form.qtyDecimalPrecision) : ''}
                    disabled={isViewOnly}
                    onChange={(e) => setField('qtyDecimalPrecision', e.target.value !== '' ? parseInt(e.target.value, 10) : null)}
                    style={errors.qtyDecimalPrecision ? { ...inputError } : inputBase}
                  >
                    <option value="">Select…</option>
                    {DECIMAL_PRECISION_OPTIONS.map((n) => (
                      <option key={n} value={String(n)}>{n} decimal place{n !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  {errors.qtyDecimalPrecision && <p style={fieldErrTxt}>{errors.qtyDecimalPrecision}</p>}
                </div>
              )}

              {/* Rounding Rule */}
              <div style={{ minWidth: '200px', flex: '1 1 200px' }}>
                <label style={labelMuted}>Rounding Rule</label>
                <select
                  value={form.roundingRule}
                  disabled={isViewOnly}
                  onChange={(e) => setField('roundingRule', e.target.value)}
                  style={inputBase}
                >
                  <option value="">— optional —</option>
                  {ROUNDING_RULES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Validity card */}
        <div style={card}>
          <div style={cardHead}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Validity Period
            </span>
          </div>
          <div style={{ padding: '18px' }}>
            <div style={grid2}>
              <div>
                <label style={labelMuted}>Effective From Date</label>
                <input
                  type="text"
                  value={form.effectiveFromDate}
                  placeholder="DD/MM/YYYY"
                  readOnly={isViewOnly}
                  onChange={(e) => setField('effectiveFromDate', e.target.value)}
                  style={inputBase}
                />
              </div>
              <div>
                <label style={labelMuted}>Effective To Date</label>
                <input
                  type="text"
                  value={form.effectiveToDate}
                  placeholder="DD/MM/YYYY"
                  readOnly={isViewOnly}
                  onChange={(e) => setField('effectiveToDate', e.target.value)}
                  style={errors.effectiveToDate ? inputError : inputBase}
                />
                {errors.effectiveToDate && <p style={fieldErrTxt}>{errors.effectiveToDate}</p>}
              </div>
            </div>
            {form.effectiveToDate && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: '#FFF7ED', border: '1px solid #FED7AA', fontSize: '12px', color: '#92400E' }}>
                <Info size={13} />
                This unit will automatically become inactive on {form.effectiveToDate}.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Unit Conversions ────────────────────────────────────────────
  function renderStep1() {
    const btnAddConv: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '8px',
      border: '1px solid #111827', background: 'transparent',
      color: '#111827', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
    };

    return (
      <div style={card}>
        <div style={cardHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Unit Conversions
            </span>
            {form.conversions.length > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#EFF6FF', color: '#1D4ED8' }}>
                {form.conversions.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {form.conversions.length > 0 && (
              <button type="button" onClick={() => setConvExpanded((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9CA3AF', display: 'flex' }}>
                {convExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            {!isViewOnly && (
              <button style={btnAddConv} onClick={openAddConversion}>
                <Plus size={13} /> Add Conversion
              </button>
            )}
          </div>
        </div>

        {convExpanded && (
          form.conversions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={28} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No conversions yet</div>
              <div style={{ fontSize: '13px' }}>
                Add conversions to define how this unit relates to others.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)' }}>
                    {['From', 'To', 'Factor', 'Precision', 'Rounding Rule', 'Type', 'Status', ''].map((h) => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.conversions.map((conv, idx) => (
                    <tr key={conv.id} style={{ borderBottom: idx < form.conversions.length - 1 ? '1px solid var(--color-border)' : 'none', background: conv.isAutoReverse ? '#FAFAFA' : undefined }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                        {conv.fromUnitName} <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: '4px' }}>({conv.fromUnitCode})</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {conv.toUnitName} <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>({conv.toUnitCode})</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{conv.conversionFactor}</td>
                      <td style={{ padding: '10px 14px', color: conv.decimalPrecision !== null ? undefined : '#9CA3AF' }}>
                        {conv.decimalPrecision !== null ? conv.decimalPrecision : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: conv.roundingRule ? undefined : '#9CA3AF' }}>
                        {conv.roundingRule || '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {conv.isAutoReverse
                          ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>↔ auto</span>
                          : <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: '#F3F4F6', color: '#6B7280' }}>manual</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: conv.status === 'Active' ? '#DCFCE7' : '#FEF2F2', color: conv.status === 'Active' ? '#15803D' : '#DC2626' }}>
                          {conv.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {conv.isAutoReverse
                            ? <span title="Auto-reverse — managed automatically" style={{ padding: '5px', color: '#D1D5DB', display: 'flex', alignItems: 'center' }}><Lock size={13} /></span>
                            : !isViewOnly && (
                              <button title="Edit" onClick={() => openEditConversion(conv)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '6px', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                                <Pencil size={13} />
                              </button>
                            )
                          }
                          {!isViewOnly && (
                            <button title="Remove" onClick={() => removeConversion(conv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '6px', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    );
  }

  // ── SmartReviewDrawer checklist items ───────────────────────────────────
  const reviewChecklist = [
    { id: 'unit-code',    label: 'Unit Code',    passed: !!form.unitCode.trim(),   detail: form.unitCode || undefined },
    { id: 'unit-name',    label: 'Unit Name',    passed: !!form.unitName.trim(),   detail: form.unitName || undefined },
    { id: 'symbol',       label: 'Symbol',       passed: !!form.unitSymbol.trim(), detail: form.unitSymbol || undefined },
    { id: 'unit-type',    label: 'Unit Type',    passed: !!form.unitType,          detail: form.unitType || 'Not set — required for activation' },
    { id: 'conversions',  label: 'Conversions',  passed: true,                     detail: `${form.conversions.length} defined` },
  ];

  const helpTopic = getHelpTopic('unit-of-measurement');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#15803D' : '#DC2626', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      {/* ── Full-page layout ──────────────────────────────────────────────── */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── 1. Compact Header ─────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
              Admin / Products & Catalogue / Unit of Measurement
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>{pageTitle}</span>
              {existing?.status && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '9999px', border: '1px solid',
                  ...(status === 'Active'
                    ? { background: 'color-mix(in srgb, #10b981 12%, var(--color-surface))', color: 'color-mix(in srgb, #10b981 85%, var(--color-text))', borderColor: 'color-mix(in srgb, #10b981 35%, var(--color-border))' }
                    : status === 'Inactive'
                    ? { background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                    : { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }) }}>
                  {status}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
              {isNew ? 'Fill in the details below to register a new unit of measurement.' : `Configure unit details and conversions for ${form.unitCode}.`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button type="button" onClick={() => navigate('/admin/master/unit-of-measurement')} style={btnOutline}>← Back to List</button>
            {helpTopic && (
              <button type="button" onClick={() => setHelpOpen(true)} style={btnOutline}>How this works</button>
            )}
          </div>
        </div>

        {/* ── 2. Middle Area (sidebar + form body) ─────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left Step Sidebar (200px) ─────────────────────────────── */}
          <nav style={{ width: '200px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
            {STEPS.map((s) => {
              const isAct   = activeStep === s.index;
              const hasData = stepHasData(s.index);
              const count   = getStepCount(s.index);
              const isHov   = hoveredStep === s.index;
              const dotColor = isAct ? 'var(--color-primary)' : hasData ? '#16A34A' : '#CBD5E1';
              return (
                <button
                  key={s.index}
                  type="button"
                  onClick={() => setActiveStep(s.index)}
                  onMouseEnter={() => setHoveredStep(s.index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 12px 20px', border: 'none', borderBottom: '1px solid var(--color-border)', background: isAct ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : isHov ? 'color-mix(in srgb, var(--color-primary) 3%, white)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', width: '100%' }}
                >
                  {isAct && <span style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: 'var(--color-primary)' }} />}
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: dotColor, transition: 'background 0.15s' }} />
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: isAct ? 600 : 500, color: isAct ? 'var(--color-primary)' : hasData ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  {count > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 700, minWidth: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9px', padding: '0 4px', background: isAct ? 'var(--color-primary)' : 'color-mix(in srgb, var(--color-primary) 12%, white)', color: isAct ? 'white' : 'var(--color-primary)', flexShrink: 0 }}>
                      {count}
                    </span>
                  )}
                  <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)', opacity: isHov ? 0.7 : 0, transition: 'opacity 0.15s' }} />
                </button>
              );
            })}
          </nav>

          {/* ── 3. Scrollable Form Body ───────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 28px', background: 'var(--color-surface-subtle)' }}>
            {isActive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
                <Info size={15} style={{ color: '#EA580C', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: '#9A3412', lineHeight: 1.6 }}>
                  This unit is <strong>Active</strong>. Unit Code is locked. All other fields can be updated.
                </span>
              </div>
            )}
            {isInactive && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  This unit is <strong>Inactive</strong>. All fields are read-only.
                </span>
              </div>
            )}

            {activeStep === 0 && renderStep0()}
            {activeStep === 1 && renderStep1()}
          </div>
        </div>

        {/* ── 4. Sticky Footer ─────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, height: '60px', padding: '0 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Previous */}
          <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0}
            style={{ ...btnOutline, opacity: activeStep === 0 ? 0.4 : 1, cursor: activeStep === 0 ? 'default' : 'pointer' }}>
            ← Previous
          </button>

          {/* Delete (Draft only) */}
          {canDel && (
            <button type="button" onClick={handleDelete}
              style={{ ...btnBase, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
              Delete
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Save Draft */}
          {!isInactive && !isActive && (
            <button type="button" onClick={handleSaveDraft} style={btnOutline}>
              Save Draft
            </button>
          )}

          {/* Save (Active) */}
          {isActive && (
            <button type="button" onClick={handleSave} style={btnOutline}>
              Save Changes
            </button>
          )}

          {/* Activate (Draft, existing record) */}
          {!isNew && !isActive && !isInactive && (
            <button type="button" onClick={handleActivateRequest}
              style={{ ...btnPrimary, background: '#16A34A' }}>
              Activate
            </button>
          )}

          {/* Continue / Finish */}
          {activeStep < STEPS.length - 1 ? (
            <button type="button" onClick={() => setActiveStep((s) => Math.min(STEPS.length - 1, s + 1))} style={btnPrimary}>
              Continue →
            </button>
          ) : (
            !isInactive && (
              <button type="button" onClick={isActive ? handleSave : handleSaveDraft} style={btnPrimary}>
                {isNew ? 'Save as Draft' : isActive ? 'Save Changes' : 'Save Draft'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Conversion Drawer ─────────────────────────────────────────────── */}
      <UomConversionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentUnitCode={form.unitCode}
        currentUnitName={form.unitName}
        existingConversions={form.conversions}
        editingConversion={editingConversion}
        onSave={handleConversionSave}
      />

      {/* ── SmartReviewDrawer (Activation) ────────────────────────────────── */}
      <SmartReviewDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Review Before Activation"
        subtitle={`Activating: ${form.unitName} (${form.unitCode})`}
        checklist={reviewChecklist}
        onConfirm={confirmActivate}
        confirmLabel="Activate Unit"
      />

      {/* ── Help Drawer ───────────────────────────────────────────────────── */}
      {helpTopic && (
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          topic={helpTopic}
        />
      )}
    </AdminShell>
  );
};

export default UomFormPage;
