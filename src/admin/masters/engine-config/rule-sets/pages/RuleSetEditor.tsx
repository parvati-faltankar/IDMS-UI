import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { MasterFormStepper } from '../../../../../experience/components';
import type { RuleSetConfig, RuleDefinition } from '../../../../../engine/types/configuration';
import type { RuleType, RuleAction, RuleOwner } from '../../../../../engine/types/configuration';
import { loadRuleSets, persistRuleSet } from '../services/ruleSetService';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { index: 0, label: 'Rule Set Details' },
  { index: 1, label: 'Rules' },
];

const RULE_TYPES: RuleType[] = [
  'Validation', 'ConditionalValidation', 'Derivation', 'ApprovalTrigger',
  'FieldBehavior', 'Eligibility', 'BoundaryRule', 'StatusDerivation', 'SystemInvariant',
];

const RULE_ACTIONS: RuleAction[] = [
  'RaiseError', 'RaiseWarning', 'DeriveValue', 'RequireApproval',
  'CallService', 'RouteToExtension', 'ApplyMaskingPolicy', 'SetFieldBehavior',
];

const RULE_OWNERS: RuleOwner[] = [
  'RuleEngine', 'PricingService', 'DiscountService', 'TaxService', 'ChargeService',
  'ApprovalService', 'NumberingService', 'SaleOrderService', 'SourceLineLedgerService',
  'CalculationService', 'RevisionService', 'IntegrationEventService',
  'LifecycleService', 'RBACService', 'PrivacyService', 'Workflow',
];

function emptyRule(order: number): RuleDefinition {
  return {
    ruleCode: '', field: '', ruleType: 'Validation', action: 'RaiseError',
    owner: 'RuleEngine', isActive: true, order,
  };
}

function emptyRuleSet(): RuleSetConfig {
  return {
    ruleSetCode: '', ruleSetName: '', entityName: '', description: '',
    version: 1, isActive: true, rules: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const RuleSetEditor: React.FC = () => {
  const navigate          = useNavigate();
  const { ruleSetCode }   = useParams<{ ruleSetCode: string }>();
  const isNew             = !ruleSetCode || ruleSetCode === 'new';

  const [form,        setForm]        = useState<RuleSetConfig>(emptyRuleSet());
  const [activeStep,  setActiveStep]  = useState(0);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(!isNew);
  const [saveError,   setSaveError]   = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (isNew) return;
    setIsLoading(true);
    void loadRuleSets().then(({ data }) => {
      const found = data.find((r) => r.ruleSetCode === ruleSetCode);
      if (found) setForm(found);
      setIsLoading(false);
    });
  }, [isNew, ruleSetCode]);

  const setField = useCallback(<K extends keyof RuleSetConfig>(key: K, value: RuleSetConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }, [errors]);

  function setRuleField<K extends keyof RuleDefinition>(idx: number, key: K, value: RuleDefinition[K]) {
    setForm((prev) => {
      const rules = [...prev.rules];
      rules[idx] = { ...rules[idx], [key]: value };
      return { ...prev, rules };
    });
  }

  function addRule() {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, emptyRule(prev.rules.length + 1)] }));
  }

  function removeRule(idx: number) {
    setForm((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.ruleSetCode.trim()) errs.ruleSetCode = 'Rule Set Code is required.';
    if (!form.ruleSetName.trim()) errs.ruleSetName = 'Rule Set Name is required.';
    if (!form.entityName.trim())  errs.entityName  = 'Entity Name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) { setActiveStep(0); return; }
    setIsSaving(true);
    setSaveError('');
    const { data, isOffline } = await persistRuleSet(form);
    setIsSaving(false);
    if (isOffline) {
      setSaveError('Engine API is offline. Changes could not be saved to the server.');
      showToast('Saved locally (offline mode).', 'error');
    } else {
      setForm(data);
      showToast(`Rule set "${data.ruleSetName}" saved successfully.`, 'success');
      setTimeout(() => navigate('/admin/engine-config/rule-sets'), 1200);
    }
  }

  const stepHasData = useMemo(() => [
    !!form.ruleSetCode.trim() && !!form.ruleSetName.trim(),
    form.rules.length > 0,
  ], [form]);
  const stepperSteps = STEPS.map((step) => ({
    id: String(step.index),
    label: step.label,
    state: activeStep === step.index ? 'current' : stepHasData[step.index] ? 'complete' : 'default',
  }));

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
  };
  const errorStyle: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '3px' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' };

  if (isLoading) {
    return (
      <AdminShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Loading rule set…
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#111827' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast.message}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/admin/engine-config/rule-sets')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {isNew ? 'New Rule Set' : `Edit: ${form.ruleSetName || form.ruleSetCode}`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Engine Configuration · Rule Engine</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saveError && <span style={{ fontSize: '12px', color: '#DC2626', maxWidth: '300px' }}>{saveError}</span>}
          <button type="button" onClick={() => navigate('/admin/engine-config/rule-sets')}
            style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>
            Cancel
          </button>
          <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving}
            style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Saving…' : 'Save Rule Set'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden' }}>
        {/* Step sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid var(--color-border)', flexShrink: 0, background: 'var(--color-surface)' }}>
          <MasterFormStepper
            steps={stepperSteps}
            activeStepId={String(activeStep)}
            onStepChange={(stepId) => setActiveStep(Number(stepId))}
          />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {activeStep === 0 && (
            <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>Rule Set Details</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Rule Set Code {isNew && <span style={{ color: '#DC2626' }}>*</span>}</label>
                  <input value={form.ruleSetCode} onChange={(e) => setField('ruleSetCode', e.target.value)}
                    readOnly={!isNew} placeholder="e.g. SO_HEADER_VALIDATION_RULES"
                    style={{ ...inputBase, fontFamily: 'monospace', background: !isNew ? 'var(--color-surface-subtle)' : undefined }} />
                  {errors.ruleSetCode && <div style={errorStyle}>{errors.ruleSetCode}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Entity Name <span style={{ color: '#DC2626' }}>*</span></label>
                  <input value={form.entityName} onChange={(e) => setField('entityName', e.target.value)} placeholder="e.g. SaleOrder" style={inputBase} />
                  {errors.entityName && <div style={errorStyle}>{errors.entityName}</div>}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Rule Set Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.ruleSetName} onChange={(e) => setField('ruleSetName', e.target.value)} placeholder="e.g. Header Validation Rules" style={inputBase} />
                {errors.ruleSetName && <div style={errorStyle}>{errors.ruleSetName}</div>}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
                  rows={3} placeholder="Describe the purpose of this rule set…"
                  style={{ ...inputBase, resize: 'vertical', fontFamily: 'inherit' }} />
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
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Rules ({form.rules.length})</div>
                <button type="button" onClick={addRule}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Add Rule
                </button>
              </div>

              {form.rules.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No rules yet. Click "Add Rule" to add the first one.
                </div>
              ) : (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 120px 160px 160px 160px 60px 50px 36px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)', padding: '0 12px', height: '34px', alignItems: 'center', gap: '8px' }}>
                    {['Rule Code', 'Field', 'Rule Type', 'Action', 'Owner', 'Order', 'Active', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {form.rules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '140px 120px 160px 160px 160px 60px 50px 36px', padding: '6px 12px', borderBottom: idx < form.rules.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center', gap: '8px' }}>
                      <input value={rule.ruleCode} onChange={(e) => setRuleField(idx, 'ruleCode', e.target.value)} placeholder="RULE_CODE" style={{ ...inputBase, fontFamily: 'monospace', fontSize: '11px' }} />
                      <input value={rule.field ?? ''} onChange={(e) => setRuleField(idx, 'field', e.target.value)} placeholder="fieldName" style={{ ...inputBase, fontSize: '11px' }} />
                      <select value={rule.ruleType} onChange={(e) => setRuleField(idx, 'ruleType', e.target.value as RuleType)} style={{ ...inputBase, fontSize: '11px' }}>
                        {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={rule.action} onChange={(e) => setRuleField(idx, 'action', e.target.value as RuleAction)} style={{ ...inputBase, fontSize: '11px' }}>
                        {RULE_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <select value={rule.owner} onChange={(e) => setRuleField(idx, 'owner', e.target.value as RuleOwner)} style={{ ...inputBase, fontSize: '11px' }}>
                        {RULE_OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <input type="number" min={1} value={rule.order} onChange={(e) => setRuleField(idx, 'order', Number(e.target.value))} style={{ ...inputBase, fontSize: '11px', textAlign: 'center' }} />
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input type="checkbox" checked={rule.isActive} onChange={(e) => setRuleField(idx, 'isActive', e.target.checked)} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
                      </div>
                      <button type="button" onClick={() => removeRule(idx)} title="Remove rule"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0}
              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: activeStep === 0 ? 'not-allowed' : 'pointer', color: activeStep === 0 ? 'var(--color-text-muted)' : 'var(--color-text)', opacity: activeStep === 0 ? 0.5 : 1 }}>
              ← Previous
            </button>
            {activeStep < STEPS.length - 1 ? (
              <button type="button" onClick={() => setActiveStep((s) => Math.min(STEPS.length - 1, s + 1))}
                style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Next →
              </button>
            ) : (
              <button type="button" onClick={() => { void handleSave(); }} disabled={isSaving}
                style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving…' : 'Save Rule Set'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default RuleSetEditor;
