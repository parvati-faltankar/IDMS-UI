import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { MasterFormStepper } from '../../../../../experience/components';
import type { ServiceConfig, ServiceFallbackPolicy, ServiceRetryPolicy } from '../../../../../engine/types/configuration';
import { loadServices, persistService } from '../services/serviceRegistryService';

const STEPS_NAV = [
  { index: 0, label: 'Service Details' },
  { index: 1, label: 'Retry & Action Codes' },
];

const FALLBACK_POLICIES: ServiceFallbackPolicy[] = ['ReturnError', 'SkipStep', 'UseLastKnown'];

function emptyService(): ServiceConfig {
  return {
    serviceCode: '', serviceName: '', endpointUrl: '', timeoutMs: 5000,
    retryPolicy: { maxRetries: 3, retryDelayMs: 500, backoffMultiplier: 2 },
    fallbackPolicy: 'ReturnError', isActive: true, actionCodes: [],
  };
}

const ServiceDefinitionEditor: React.FC = () => {
  const navigate         = useNavigate();
  const { serviceCode }  = useParams<{ serviceCode: string }>();
  const isNew            = !serviceCode || serviceCode === 'new';

  const [form,       setForm]       = useState<ServiceConfig>(emptyService());
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving,   setIsSaving]   = useState(false);
  const [isLoading,  setIsLoading]  = useState(!isNew);
  const [saveError,  setSaveError]  = useState('');
  const [newCode,    setNewCode]    = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone }); setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (isNew) return;
    setIsLoading(true);
    void loadServices().then(({ data }) => {
      const found = data.find((s) => s.serviceCode === serviceCode);
      if (found) setForm(found);
      setIsLoading(false);
    });
  }, [isNew, serviceCode]);

  const setField = useCallback(<K extends keyof ServiceConfig>(key: K, value: ServiceConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }, [errors]);

  function setRetryField<K extends keyof ServiceRetryPolicy>(key: K, value: ServiceRetryPolicy[K]) {
    setForm((prev) => ({ ...prev, retryPolicy: { ...prev.retryPolicy, [key]: value } }));
  }

  function addActionCode() {
    const code = newCode.trim().toUpperCase();
    if (!code || form.actionCodes.includes(code)) return;
    setForm((prev) => ({ ...prev, actionCodes: [...prev.actionCodes, code] }));
    setNewCode('');
  }

  function removeActionCode(code: string) {
    setForm((prev) => ({ ...prev, actionCodes: prev.actionCodes.filter((c) => c !== code) }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.serviceCode.trim())  errs.serviceCode  = 'Service Code is required.';
    if (!form.serviceName.trim())  errs.serviceName  = 'Service Name is required.';
    if (!form.endpointUrl.trim())  errs.endpointUrl  = 'Endpoint URL is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) { setActiveStep(0); return; }
    setIsSaving(true); setSaveError('');
    const { data, isOffline } = await persistService(form);
    setIsSaving(false);
    if (isOffline) { setSaveError('Engine API is offline. Changes could not be saved.'); showToast('Saved locally (offline mode).', 'error'); }
    else { setForm(data); showToast(`Service "${data.serviceName}" saved.`, 'success'); setTimeout(() => navigate('/admin/engine-config/services'), 1200); }
  }

  const stepHasData = useMemo(() => [!!form.serviceCode.trim() && !!form.serviceName.trim(), form.actionCodes.length > 0], [form]);
  const stepperSteps = STEPS_NAV.map((step) => ({
    id: String(step.index),
    label: step.label,
    state: activeStep === step.index ? 'current' : stepHasData[step.index] ? 'complete' : 'default',
  }));

  const inputBase: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' };
  const errorStyle: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };

  if (isLoading) return <AdminShell><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '14px', color: 'var(--color-text-muted)' }}>Loading service…</div></AdminShell>;

  return (
    <AdminShell>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#111827' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.message}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/admin/engine-config/services')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><ArrowLeft size={16} /> Back</button>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{isNew ? 'New Service' : `Edit: ${form.serviceName || form.serviceCode}`}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Engine Configuration · Service Registry</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saveError && <span style={{ fontSize: '12px', color: '#DC2626', maxWidth: '300px' }}>{saveError}</span>}
          <button type="button" onClick={() => navigate('/admin/engine-config/services')} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
          <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Service'}</button>
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
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Service Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Service Code {isNew && <span style={{ color: '#DC2626' }}>*</span>}</label>
                  <input value={form.serviceCode} onChange={(e) => setField('serviceCode', e.target.value)} readOnly={!isNew} placeholder="e.g. PRICING_SERVICE" style={{ ...inputBase, fontFamily: 'monospace', background: !isNew ? 'var(--color-surface-subtle)' : undefined }} />
                  {errors.serviceCode && <div style={errorStyle}>{errors.serviceCode}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Service Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={form.serviceName} onChange={(e) => setField('serviceName', e.target.value)} placeholder="e.g. Pricing Service" style={inputBase} />
                  {errors.serviceName && <div style={errorStyle}>{errors.serviceName}</div>}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Endpoint URL <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.endpointUrl} onChange={(e) => setField('endpointUrl', e.target.value)} placeholder="https://api.example.com/pricing" style={{ ...inputBase, fontFamily: 'monospace' }} />
                {errors.endpointUrl && <div style={errorStyle}>{errors.endpointUrl}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Timeout (ms)</label>
                  <input type="number" min={100} value={form.timeoutMs} onChange={(e) => setField('timeoutMs', Number(e.target.value))} style={inputBase} />
                </div>
                <div>
                  <label style={labelStyle}>Fallback Policy</label>
                  <select value={form.fallbackPolicy} onChange={(e) => setField('fallbackPolicy', e.target.value as ServiceFallbackPolicy)} style={inputBase}>
                    {FALLBACK_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
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
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Retry Policy</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Max Retries</label>
                    <input type="number" min={0} max={10} value={form.retryPolicy.maxRetries} onChange={(e) => setRetryField('maxRetries', Number(e.target.value))} style={labelStyle} />
                    <input type="number" min={0} max={10} value={form.retryPolicy.maxRetries} onChange={(e) => setRetryField('maxRetries', Number(e.target.value))} style={inputBase} />
                  </div>
                  <div>
                    <label style={labelStyle}>Delay (ms)</label>
                    <input type="number" min={0} value={form.retryPolicy.retryDelayMs} onChange={(e) => setRetryField('retryDelayMs', Number(e.target.value))} style={inputBase} />
                  </div>
                  <div>
                    <label style={labelStyle}>Backoff Multiplier</label>
                    <input type="number" min={1} step={0.1} value={form.retryPolicy.backoffMultiplier} onChange={(e) => setRetryField('backoffMultiplier', Number(e.target.value))} style={inputBase} />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Action Codes ({form.actionCodes.length})</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addActionCode(); } }}
                    placeholder="ACTION_CODE (press Enter to add)" style={{ ...inputBase, fontFamily: 'monospace', flex: 1 }} />
                  <button type="button" onClick={addActionCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}><Plus size={13} /> Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.actionCodes.map((code) => (
                    <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace', color: '#1D4ED8' }}>
                      {code}
                      <button type="button" onClick={() => removeActionCode(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#93C5FD', display: 'flex', alignItems: 'center' }}><X size={11} /></button>
                    </span>
                  ))}
                  {form.actionCodes.length === 0 && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No action codes added yet.</div>}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', opacity: activeStep === 0 ? 0.5 : 1, color: activeStep === 0 ? 'var(--color-text-muted)' : 'var(--color-text)' }}>← Previous</button>
            {activeStep < STEPS_NAV.length - 1
              ? <button type="button" onClick={() => setActiveStep((s) => s + 1)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Next →</button>
              : <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving…' : 'Save Service'}</button>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default ServiceDefinitionEditor;
