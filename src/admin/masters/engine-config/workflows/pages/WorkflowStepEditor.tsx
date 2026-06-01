import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import type { WorkflowConfig, WorkflowStepConfig } from '../../../../../engine/types/configuration';
import type { WorkflowStepConfigType, WorkflowStepFailureMode } from '../../../../../engine/types/configuration';
import { loadWorkflows, persistWorkflow } from '../services/workflowConfigService';

const STEPS_NAV = [
  { index: 0, label: 'Workflow Details' },
  { index: 1, label: 'Steps' },
];

const STEP_TYPES: WorkflowStepConfigType[] = [
  'Start', 'RuleTask', 'ServiceTask', 'Decision', 'UserTask', 'NotificationTask', 'IntegrationTask', 'End',
];

const FAILURE_MODES: WorkflowStepFailureMode[] = [
  'Stop', 'ValidationFailed', 'PendingApproval', 'Retry', 'NonBlocking',
];

function emptyStep(seq: number): WorkflowStepConfig {
  return { seq, stepCode: '', stepType: 'ServiceTask', calls: '', failureBehavior: 'Stop', isActive: true };
}

function emptyWorkflow(): WorkflowConfig {
  return { workflowCode: '', workflowName: '', entityName: '', version: 1, description: '', isActive: true, steps: [], transitions: [] };
}

const WorkflowStepEditor: React.FC = () => {
  const navigate         = useNavigate();
  const { workflowCode } = useParams<{ workflowCode: string }>();
  const isNew            = !workflowCode || workflowCode === 'new';

  const [form,       setForm]       = useState<WorkflowConfig>(emptyWorkflow());
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
    void loadWorkflows().then(({ data }) => {
      const found = data.find((w) => w.workflowCode === workflowCode);
      if (found) setForm(found);
      setIsLoading(false);
    });
  }, [isNew, workflowCode]);

  const setField = useCallback(<K extends keyof WorkflowConfig>(key: K, value: WorkflowConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }, [errors]);

  function setStepField<K extends keyof WorkflowStepConfig>(idx: number, key: K, value: WorkflowStepConfig[K]) {
    setForm((prev) => { const steps = [...prev.steps]; steps[idx] = { ...steps[idx], [key]: value }; return { ...prev, steps }; });
  }

  function addStep() {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, emptyStep(prev.steps.length + 1)] }));
  }

  function removeStep(idx: number) {
    setForm((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.workflowCode.trim()) errs.workflowCode = 'Workflow Code is required.';
    if (!form.workflowName.trim()) errs.workflowName = 'Workflow Name is required.';
    if (!form.entityName.trim())   errs.entityName   = 'Entity Name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) { setActiveStep(0); return; }
    setIsSaving(true); setSaveError('');
    const { data, isOffline } = await persistWorkflow(form);
    setIsSaving(false);
    if (isOffline) { setSaveError('Engine API is offline. Changes could not be saved.'); showToast('Saved locally (offline mode).', 'error'); }
    else { setForm(data); showToast(`Workflow "${data.workflowName}" saved.`, 'success'); setTimeout(() => navigate('/admin/engine-config/workflows'), 1200); }
  }

  const stepHasData = useMemo(() => [!!form.workflowCode.trim() && !!form.workflowName.trim(), form.steps.length > 0], [form]);

  const inputBase: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' };
  const errorStyle: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };

  if (isLoading) return <AdminShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '14px', color: 'var(--color-text-muted)' }}>Loading workflow…</div></AdminShell>;

  return (
    <AdminShell>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#111827' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.message}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/admin/engine-config/workflows')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><ArrowLeft size={16} /> Back</button>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{isNew ? 'New Workflow' : `Edit: ${form.workflowName || form.workflowCode}`}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Engine Configuration · Workflows</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saveError && <span style={{ fontSize: '12px', color: '#DC2626', maxWidth: '300px' }}>{saveError}</span>}
          <button type="button" onClick={() => navigate('/admin/engine-config/workflows')} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
          <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Workflow'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        <div style={{ width: '220px', borderRight: '1px solid var(--color-border)', padding: '20px 0', flexShrink: 0, background: 'var(--color-surface)' }}>
          {STEPS_NAV.map((step) => {
            const active = activeStep === step.index; const done = stepHasData[step.index];
            return (
              <button key={step.index} type="button" onClick={() => setActiveStep(step.index)} style={{ width: '100%', textAlign: 'left', padding: '10px 20px', border: 'none', cursor: 'pointer', background: active ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent', borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: done ? '#DCFCE7' : active ? 'var(--color-primary)' : 'var(--color-surface-subtle)', color: done ? '#15803D' : active ? 'white' : 'var(--color-text-muted)', border: `1px solid ${done ? '#86EFAC' : active ? 'var(--color-primary)' : 'var(--color-border)'}` }}>{done ? '✓' : step.index + 1}</div>
                <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>{step.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {activeStep === 0 && (
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Workflow Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Workflow Code {isNew && <span style={{ color: '#DC2626' }}>*</span>}</label>
                  <input value={form.workflowCode} onChange={(e) => setField('workflowCode', e.target.value)} readOnly={!isNew} placeholder="e.g. WF_SO_SUBMIT" style={{ ...inputBase, fontFamily: 'monospace', background: !isNew ? 'var(--color-surface-subtle)' : undefined }} />
                  {errors.workflowCode && <div style={errorStyle}>{errors.workflowCode}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Entity Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={form.entityName} onChange={(e) => setField('entityName', e.target.value)} placeholder="e.g. SaleOrder" style={inputBase} />
                  {errors.entityName && <div style={errorStyle}>{errors.entityName}</div>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Workflow Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.workflowName} onChange={(e) => setField('workflowName', e.target.value)} placeholder="e.g. Submit Sale Order" style={inputBase} />
                {errors.workflowName && <div style={errorStyle}>{errors.workflowName}</div>}
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} placeholder="Describe this workflow…" style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={labelStyle}>Version</label>
                  <input type="number" min={1} value={form.version} onChange={(e) => setField('version', Number(e.target.value))} style={inputBase} />
                </div>
                <div style={{ paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Active</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Steps ({form.steps.length})</div>
                <button type="button" onClick={addStep} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}><Plus size={13} /> Add Step</button>
              </div>
              {form.steps.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>No steps yet. Click "Add Step" to begin.</div>
              ) : (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 160px 140px minmax(140px,1fr) 160px 50px 36px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)', padding: '0 12px', height: '34px', alignItems: 'center', gap: '8px' }}>
                    {['Seq', 'Step Code', 'Step Type', 'Calls', 'Failure', 'Active', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {form.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 160px 140px minmax(140px,1fr) 160px 50px 36px', padding: '6px 12px', borderBottom: idx < form.steps.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center', gap: '8px' }}>
                      <input type="number" min={1} value={step.seq} onChange={(e) => setStepField(idx, 'seq', Number(e.target.value))} style={{ ...inputBase, fontSize: '11px', textAlign: 'center' }} />
                      <input value={step.stepCode} onChange={(e) => setStepField(idx, 'stepCode', e.target.value)} placeholder="STEP_CODE" style={{ ...inputBase, fontFamily: 'monospace', fontSize: '11px' }} />
                      <select value={step.stepType} onChange={(e) => setStepField(idx, 'stepType', e.target.value as WorkflowStepConfigType)} style={{ ...inputBase, fontSize: '11px' }}>
                        {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input value={step.calls} onChange={(e) => setStepField(idx, 'calls', e.target.value)} placeholder="ServiceCode / RuleSetCode" style={{ ...inputBase, fontSize: '11px' }} />
                      <select value={step.failureBehavior} onChange={(e) => setStepField(idx, 'failureBehavior', e.target.value as WorkflowStepFailureMode)} style={{ ...inputBase, fontSize: '11px' }}>
                        {FAILURE_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input type="checkbox" checked={step.isActive} onChange={(e) => setStepField(idx, 'isActive', e.target.checked)} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
                      </div>
                      <button type="button" onClick={() => removeStep(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', color: activeStep === 0 ? 'var(--color-text-muted)' : 'var(--color-text)', opacity: activeStep === 0 ? 0.5 : 1 }}>← Previous</button>
            {activeStep < STEPS_NAV.length - 1
              ? <button type="button" onClick={() => setActiveStep((s) => s + 1)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Next →</button>
              : <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Workflow'}</button>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default WorkflowStepEditor;
