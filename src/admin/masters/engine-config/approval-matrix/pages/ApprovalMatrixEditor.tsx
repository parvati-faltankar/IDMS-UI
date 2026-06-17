import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { MasterFormStepper } from '../../../../../experience/components';
import type { ApprovalMatrixEntry, ApprovalLevel, ApprovalCategoryCode, ApprovalRole } from '../../../../../engine/types/approvalMatrix';
import { loadApprovalMatrix, persistApprovalMatrixEntry } from '../services/approvalMatrixService';

const STEPS_NAV = [
  { index: 0, label: 'Entry Details' },
  { index: 1, label: 'Approval Levels' },
];

const APPROVAL_CATEGORIES: ApprovalCategoryCode[] = [
  'DISCOUNT_EXCEPTION', 'PRICE_EXCEPTION', 'CREDIT_EXCEPTION', 'TAX_EXCEPTION',
  'EXPIRED_ORDER_EXCEPTION', 'PROCESSED_SCOPE_EXCEPTION', 'CANCELLATION_EXCEPTION',
];

const APPROVAL_ROLES: ApprovalRole[] = [
  'ASM', 'HQ_MANAGER', 'BRANCH_MANAGER', 'SALES_MANAGER',
  'REGIONAL_MANAGER', 'FINANCE_MANAGER', 'SERVICE_MANAGER',
];

const AUTO_ACTIONS = ['', 'Approve', 'Reject', 'Escalate'] as const;

function emptyLevel(level: number): ApprovalLevel {
  return { level, role: 'ASM', escalationHours: 24 };
}

function emptyEntry(): ApprovalMatrixEntry {
  return { entryId: '', approvalCategory: 'DISCOUNT_EXCEPTION', conditionExpression: '', conditionLabel: '', entityName: 'SaleOrder', isActive: true, levels: [] };
}

const ApprovalMatrixEditor: React.FC = () => {
  const navigate      = useNavigate();
  const { entryId }   = useParams<{ entryId: string }>();
  const isNew         = !entryId || entryId === 'new';

  const [form,       setForm]       = useState<ApprovalMatrixEntry>(emptyEntry());
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving,   setIsSaving]   = useState(false);
  const [isLoading,  setIsLoading]  = useState(!isNew);
  const [saveError,  setSaveError]  = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone }); setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (isNew) return;
    setIsLoading(true);
    void loadApprovalMatrix().then(({ data }) => {
      const found = data.find((e) => e.entryId === entryId);
      if (found) setForm(found);
      setIsLoading(false);
    });
  }, [isNew, entryId]);

  const setField = useCallback(<K extends keyof ApprovalMatrixEntry>(key: K, value: ApprovalMatrixEntry[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }, [errors]);

  function setLevelField<K extends keyof ApprovalLevel>(idx: number, key: K, value: ApprovalLevel[K]) {
    setForm((prev) => { const levels = [...prev.levels]; levels[idx] = { ...levels[idx], [key]: value }; return { ...prev, levels }; });
  }

  function addLevel() {
    setForm((prev) => ({ ...prev, levels: [...prev.levels, emptyLevel(prev.levels.length + 1)] }));
  }

  function removeLevel(idx: number) {
    setForm((prev) => ({ ...prev, levels: prev.levels.filter((_, i) => i !== idx) }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.entryId.trim() && isNew)      errs.entryId         = 'Entry ID is required.';
    if (!form.entityName.trim())             errs.entityName      = 'Entity Name is required.';
    if (!form.conditionLabel.trim())         errs.conditionLabel  = 'Condition Label is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) { setActiveStep(0); return; }
    setIsSaving(true); setSaveError('');
    const { data, isOffline } = await persistApprovalMatrixEntry(form);
    setIsSaving(false);
    if (isOffline) { setSaveError('Engine API is offline. Changes could not be saved.'); showToast('Saved locally (offline mode).', 'error'); }
    else { setForm(data); showToast(`Entry "${data.approvalCategory}" saved.`, 'success'); setTimeout(() => navigate('/admin/engine-config/approval-matrix'), 1200); }
  }

  const stepHasData = useMemo(() => [
    !!form.conditionLabel.trim() && !!form.entityName.trim(),
    form.levels.length > 0,
  ], [form]);
  const stepperSteps = STEPS_NAV.map((step) => ({
    id: String(step.index),
    label: step.label,
    state: activeStep === step.index ? 'current' : stepHasData[step.index] ? 'complete' : 'default',
  }));

  const inputBase: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' };
  const errorStyle: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };

  if (isLoading) return <AdminShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '14px', color: 'var(--color-text-muted)' }}>Loading entry…</div></AdminShell>;

  return (
    <AdminShell>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#111827' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.message}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/admin/engine-config/approval-matrix')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><ArrowLeft size={16} /> Back</button>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{isNew ? 'New Approval Matrix Entry' : `Edit: ${form.approvalCategory}`}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Engine Configuration · Approval Matrix</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saveError && <span style={{ fontSize: '12px', color: '#DC2626', maxWidth: '300px' }}>{saveError}</span>}
          <button type="button" onClick={() => navigate('/admin/engine-config/approval-matrix')} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
          <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Entry'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        <div style={{ width: '220px', borderRight: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--color-surface)' }}>
          <MasterFormStepper
            steps={stepperSteps}
            activeStepId={String(activeStep)}
            onStepChange={(stepId) => setActiveStep(Number(stepId))}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {activeStep === 0 && (
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Entry Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Entry ID {isNew && <span style={{ color: '#DC2626' }}>*</span>}</label>
                  <input value={form.entryId} onChange={(e) => setField('entryId', e.target.value)} readOnly={!isNew} placeholder="e.g. AM_DISC_EXC_01" style={{ ...inputBase, fontFamily: 'monospace', background: !isNew ? 'var(--color-surface-subtle)' : undefined }} />
                  {errors.entryId && <div style={errorStyle}>{errors.entryId}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Entity Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={form.entityName} onChange={(e) => setField('entityName', e.target.value)} placeholder="e.g. SaleOrder" style={inputBase} />
                  {errors.entityName && <div style={errorStyle}>{errors.entityName}</div>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Approval Category <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={form.approvalCategory} onChange={(e) => setField('approvalCategory', e.target.value as ApprovalCategoryCode)} style={{ ...inputBase, fontFamily: 'monospace' }}>
                  {APPROVAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Condition Label <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.conditionLabel} onChange={(e) => setField('conditionLabel', e.target.value)} placeholder="e.g. Discount &gt; 10%" style={inputBase} />
                {errors.conditionLabel && <div style={errorStyle}>{errors.conditionLabel}</div>}
              </div>
              <div>
                <label style={labelStyle}>Condition Expression</label>
                <textarea value={form.conditionExpression} onChange={(e) => setField('conditionExpression', e.target.value)} rows={3} placeholder={'e.g. discountPercent > 10 && discountPercent <= 15'} style={{ ...inputBase, fontFamily: 'monospace', resize: 'vertical', fontSize: '12px' }} />
              </div>
              <div style={{ paddingTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Active</span>
                </label>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Approval Levels ({form.levels.length})</div>
                <button type="button" onClick={addLevel} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> Add Level</button>
              </div>
              {form.levels.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>No approval levels yet. Click "Add Level" to begin.</div>
              ) : (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 160px 90px 160px 130px 36px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)', padding: '0 12px', height: '34px', alignItems: 'center', gap: '8px' }}>
                    {['Level', 'Role', 'Esc. Hours', 'Esc. Role', 'Auto Action', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {form.levels.map((lvl, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 160px 90px 160px 130px 36px', padding: '6px 12px', borderBottom: idx < form.levels.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center', gap: '8px' }}>
                      <input type="number" min={1} value={lvl.level} onChange={(e) => setLevelField(idx, 'level', Number(e.target.value))} style={{ ...inputBase, fontSize: '11px', textAlign: 'center' }} />
                      <select value={lvl.role} onChange={(e) => setLevelField(idx, 'role', e.target.value as ApprovalRole)} style={{ ...inputBase, fontSize: '11px' }}>
                        {APPROVAL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input type="number" min={1} value={lvl.escalationHours} onChange={(e) => setLevelField(idx, 'escalationHours', Number(e.target.value))} style={{ ...inputBase, fontSize: '11px' }} />
                      <select value={lvl.escalationRole ?? ''} onChange={(e) => setLevelField(idx, 'escalationRole', e.target.value as ApprovalRole || undefined)} style={{ ...inputBase, fontSize: '11px' }}>
                        <option value="">— None —</option>
                        {APPROVAL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select value={lvl.autoActionOnTimeout ?? ''} onChange={(e) => setLevelField(idx, 'autoActionOnTimeout', (e.target.value as ApprovalLevel['autoActionOnTimeout']) || undefined)} style={{ ...inputBase, fontSize: '11px' }}>
                        {AUTO_ACTIONS.map((a) => <option key={a} value={a}>{a === '' ? '— None —' : a}</option>)}
                      </select>
                      <button type="button" onClick={() => removeLevel(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.5 : 1, color: activeStep === 0 ? 'var(--color-text-muted)' : 'var(--color-text)' }}>← Previous</button>
            {activeStep < STEPS_NAV.length - 1
              ? <button type="button" onClick={() => setActiveStep((s) => s + 1)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Next →</button>
              : <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Entry'}</button>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default ApprovalMatrixEditor;
