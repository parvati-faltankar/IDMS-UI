// ─── Service Type Master — Smart Wizard Form ─────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type {
  ServiceTypeRecord,
  PostingType,
  OperatorType,
  ContractOperator,
  ServiceDeliveryMode,
  AssetIdentificationLevel,
  MeterReadingType,
  DurationType,
  ServiceProviderType,
  WarrantyEligibilityBasis,
  BillingResponsibility,
  SLACalendarType,
  ContractRelationLabourRow,
  ContractRelationPartRow,
} from '../types/serviceTypeMaster.types';
import {
  MASTER_KEY,
  INITIAL_SERVICE_TYPE,
  POSTING_TYPE_OPTIONS,
  CONTRACT_OPERATOR_OPTIONS,
  SERVICE_DELIVERY_MODE_OPTIONS,
  ASSET_ID_LEVEL_OPTIONS,
  METER_READING_TYPE_OPTIONS,
  DURATION_TYPE_OPTIONS,
  SERVICE_PROVIDER_TYPE_OPTIONS,
  WARRANTY_BASIS_OPTIONS,
  BILLING_RESPONSIBILITY_OPTIONS,
  SLA_CALENDAR_OPTIONS,
  MOCK_SKILLS,
  MOCK_CERTIFICATIONS,
  MOCK_TERRITORIES,
  MOCK_CHECKLIST_TEMPLATES,
  MOCK_SLA_PROFILES,
  MOCK_CONTRACTS,
  MOCK_SEGMENTS,
  MOCK_SUBSEGMENTS,
  MOCK_ORGS,
  MOCK_SUPPLIERS,
  MOCK_SERVICE_TYPES,
  PROFILE_PRESETS,
  PROFILE_SKIP_STEPS,
  type ServiceProfile,
} from '../constants/serviceTypeMaster.constants';
import { serviceTypeService } from '../services/serviceTypeService';
import {
  validateStep as validateWizardStep,
  validateForSave,
  validateForActivation,
  type STFieldErrors,
} from '../utils/serviceTypeValidation';
import { BillingRatioGrid } from '../components/BillingRatioGrid';
import { ProductApplicabilityGrid } from '../components/ProductApplicabilityGrid';
import { ContractRelationSection } from '../components/ContractRelationSection';
import { AttributeTaggingGrid } from '../components/AttributeTaggingGrid';

// ─── Wizard step definitions ──────────────────────────────────────────────────

const WIZARD_STEPS = [
  { index: 0, label: 'Service Identity' },
  { index: 1, label: 'Billing & Contract' },
  { index: 2, label: 'Asset & Scheduling' },
  { index: 3, label: 'Team & Delivery' },
  { index: 4, label: 'Safety & SLA' },
  { index: 5, label: 'Advanced Settings' },
];

// ─── Profile display meta (for badge in Step 0) ──────────────────────────────

const PROFILE_META: Record<ServiceProfile, { label: string; accent: string }> = {
  warranty: { label: 'Warranty Service',     accent: '#2563EB' },
  contract: { label: 'Contract Service',     accent: '#7C3AED' },
  saleable: { label: 'Saleable Service',     accent: '#0891B2' },
  periodic: { label: 'Periodic Maintenance', accent: '#059669' },
  field:    { label: 'Field Service',        accent: '#D97706' },
  custom:   { label: 'Custom',               accent: '#6B7280' },
};

// ─── Shared style constants ───────────────────────────────────────────────────

const inputBase: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' };
const inputErr: React.CSSProperties  = { ...inputBase, border: '1px solid #FCA5A5' };
const labelBase: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' };
const labelMuted: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px' };
const errTxt: React.CSSProperties    = { fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' };
const twoCol: React.CSSProperties    = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const threeCol: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
const fw: React.CSSProperties        = { marginBottom: '16px' };
const sectionCard: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' };
const sCardHead: React.CSSProperties   = { padding: '12px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const sCardBody: React.CSSProperties   = { padding: '20px 24px', background: 'var(--color-surface)' };

// ─── Reusable micro-components ────────────────────────────────────────────────

function CB({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none', opacity: disabled ? 0.5 : 1 }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ width: '14px', height: '14px' }} />
      {label}
    </label>
  );
}

function MultiChips({ label, options, selected, onChange, muted }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; muted?: boolean }) {
  return (
    <div style={fw}>
      <label style={muted ? labelMuted : labelBase}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button key={opt} type="button"
              onClick={() => onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt])}
              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: on ? 600 : 400, borderRadius: '9999px', cursor: 'pointer', border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-primary)' : 'var(--color-surface)', color: on ? 'white' : 'var(--color-text)' }}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange, error }: { options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
        {options.map((opt, i) => {
          const active = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: active ? 600 : 400, border: 'none', borderRight: i < options.length - 1 ? '1px solid var(--color-border)' : 'none', background: active ? 'var(--color-primary)' : 'var(--color-surface)', color: active ? 'white' : 'var(--color-text)', cursor: 'pointer' }}
            >{opt.label}</button>
          );
        })}
      </div>
      {error && <span style={errTxt}>{error}</span>}
    </div>
  );
}

function OptionCards<T extends string>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string; desc?: string }>; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div style={fw}>
      <label style={labelBase}>{label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '8px', border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, background: active ? 'var(--color-primary-subtle, #EFF6FF)' : 'var(--color-surface)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>{opt.label}</div>
              {opt.desc && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{opt.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccordionGroup({ title, children, badge }: { title: string; children: React.ReactNode; badge?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '11px 18px', background: 'var(--color-surface-subtle)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        {open ? React.createElement(ChevronDown, { size: 14, color: 'var(--color-text-muted)' }) : React.createElement(ChevronRight, { size: 14, color: 'var(--color-text-muted)' })}
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{ minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9px', background: 'var(--color-primary)', color: 'white', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
        )}
      </button>
      {open && <div style={{ padding: '16px 20px', background: 'var(--color-surface)' }}>{children}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ServiceTypeFormPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const isNew = !recordId;

  const [existing, setExisting] = useState<ServiceTypeRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<ServiceTypeRecord>(() => ({
    ...INITIAL_SERVICE_TYPE,
    id: '', code: 'ST-AUTO',
    createdBy: 'Admin', createdDate: '',
    lastModifiedBy: 'Admin', lastModifiedDate: '',
  }));
  const [selectedProfile, setSelectedProfile] = useState<ServiceProfile | ''>('');
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [stepDone, setStepDone] = useState<Set<number>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<STFieldErrors>({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isNew && recordId) {
      const found = serviceTypeService.getById(recordId);
      /* eslint-disable react-hooks/set-state-in-effect */
      if (!found) { setNotFound(true); return; }
      setExisting(found);
      setForm((prev) => ({ ...prev, ...found }));
      setStepDone(new Set([0, 1, 2, 3, 4]));
      /* eslint-enable react-hooks/set-state-in-effect */
    } else {
      const p = new URLSearchParams(window.location.search).get('profile') as ServiceProfile | null;
      if (p && p in PROFILE_PRESETS) {
        setSelectedProfile(p);
        setForm((prev) => ({ ...prev, ...PROFILE_PRESETS[p] }));
        setSkippedSteps(new Set(PROFILE_SKIP_STEPS[p]));
      }
    }
    const m = findMasterByKey(MASTER_KEY);
    const g = findGroupForMasterKey(MASTER_KEY);
    if (m && g) recordRecentAdminMaster({ key: m.key, label: m.label, path: m.path, groupLabel: g.label, groupIconBg: g.iconBg, groupIconColor: g.iconColor });
  }, [recordId, isNew]);

  const status = existing?.status ?? 'Draft';
  const isActive = status === 'Active';

  const recurrenceMode: 'none' | 'meter' | 'duration' | 'both' = (
    form.meterReadingRequired && form.durationType ? 'both' :
    form.meterReadingRequired ? 'meter' :
    form.durationType ? 'duration' : 'none'
  );

  const headerLineMode = (
    form.isHeader && form.isLine ? 'both' :
    form.isHeader ? 'header' :
    form.isLine ? 'line' : ''
  );

  function showToast(msg: string, tone: 'success' | 'error') {
    setToast({ message: msg, tone });
    setTimeout(() => setToast(null), 3200);
  }

  function setF<K extends keyof ServiceTypeRecord>(field: K, value: ServiceTypeRecord[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'availMultipleTimes' && value === true) next.availLimit = '';
      if (field === 'availLimit' && String(value).trim() !== '') next.availMultipleTimes = false;
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setHeaderLine(mode: string) {
    setF('isHeader', mode === 'header' || mode === 'both');
    setF('isLine',   mode === 'line'   || mode === 'both');
  }

  function setRecurrenceMode(mode: 'none' | 'meter' | 'duration' | 'both') {
    setForm((prev) => {
      const next = { ...prev };
      next.meterReadingRequired = mode === 'meter' || mode === 'both';
      if (mode === 'none' || mode === 'duration') { next.meterReadingType = ''; next.meterReading = ''; }
      if (mode === 'none' || mode === 'meter') { next.durationType = '' as DurationType | ''; next.durationValue = ''; }
      if (mode !== 'both') next.operator = '';
      return next;
    });
  }

  function nextStep() {
    const errs = validateWizardStep(activeStep, form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setStepDone((prev) => new Set([...prev, activeStep]));
    setFieldErrors({});
    let next = activeStep + 1;
    while (next < 5 && skippedSteps.has(next)) next++;
    setActiveStep(Math.min(next, 5));
  }

  function prevStep() {
    let prev = activeStep - 1;
    while (prev > 0 && skippedSteps.has(prev)) prev--;
    setActiveStep(Math.max(prev, 0));
  }

  function unSkipStep(i: number) {
    setSkippedSteps((prev) => { const s = new Set(prev); s.delete(i); return s; });
    setActiveStep(i);
  }

  function doSave(activate = false) {
    const allErrs = validateForSave(form);
    if (activate) {
      const issues = validateForActivation(form);
      if (issues.length > 0) { showToast(issues[0], 'error'); return; }
    }
    if (Object.keys(allErrs).filter((k) => ['code', 'name', 'postingType', 'isHeaderIsLine'].includes(k)).length > 0) {
      setFieldErrors(allErrs); setActiveStep(0);
      showToast('Please fix required fields before saving', 'error'); return;
    }
    const data: ServiceTypeRecord = { ...form, status: activate ? 'Active' : 'Draft' };
    if (isNew) {
      const created = serviceTypeService.create(data);
      showToast(`"${created.name}" saved${activate ? ' & activated' : ' as Draft'}`, 'success');
    } else {
      serviceTypeService.update(form.id, data);
      showToast(`Updated${activate ? ' & activated' : ''}`, 'success');
    }
    setTimeout(() => navigate('/admin/master/service-type-master'), 1000);
  }

  const statusStyle: React.CSSProperties = status === 'Active'
    ? { background: '#DCFCE7', color: '#15803D' }
    : status === 'Inactive' ? { background: '#FEF2F2', color: '#DC2626' }
    : { background: '#F1F5F9', color: '#64748B' };

  const helpTopic = getHelpTopic('service-type-master');

  if (notFound) {
    return (
      <AdminShell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <AlertCircle size={40} color="#DC2626" />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Service Type not found</div>
          <button type="button" onClick={() => navigate('/admin/master/service-type-master')} style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>Back to List</button>
        </div>
      </AdminShell>
    );
  }

  // ── Step renderers ────────────────────────────────────────────────────────

  function renderStep0() {
    const meta = selectedProfile ? PROFILE_META[selectedProfile] : null;
    return (
      <>
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Service Identity</span>
            {meta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.accent }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: meta.accent }}>{meta.label}</span>
              </div>
            )}
          </div>
          <div style={sCardBody}>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Service Type Name <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.name} onChange={(e) => setF('name', e.target.value)} style={fieldErrors.name ? inputErr : inputBase} placeholder="e.g. Annual Maintenance Contract" autoFocus />
                {fieldErrors.name && <span style={errTxt}>{fieldErrors.name}</span>}
              </div>
              <div style={fw}>
                <label style={labelBase}>Posting Type <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={form.postingType} onChange={(e) => setF('postingType', e.target.value as PostingType | '')} style={fieldErrors.postingType ? inputErr : inputBase}>
                  <option value="">— Select —</option>
                  {POSTING_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {fieldErrors.postingType && <span style={errTxt}>{fieldErrors.postingType}</span>}
              </div>
            </div>
            <div style={fw}>
              <label style={labelMuted}>Description (optional)</label>
              <textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={3} placeholder="Brief description of what this service type covers..." style={{ ...inputBase, resize: 'vertical' as const }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderStep1() {
    return (
      <>
        {/* Usage */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Usage</span>
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <label style={labelBase}>Used as <span style={{ color: '#DC2626' }}>*</span></label>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>How does this service type appear on transactions?</div>
              <SegmentedControl
                options={[{ value: 'header', label: 'Header' }, { value: 'line', label: 'Line Item' }, { value: 'both', label: 'Both' }]}
                value={headerLineMode} onChange={setHeaderLine} error={fieldErrors.isHeaderIsLine}
              />
            </div>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              <CB checked={form.saleable}    onChange={(v) => setF('saleable', v)}    label="Saleable" />
              <CB checked={form.taxExempted} onChange={(v) => setF('taxExempted', v)} label="Tax Exempted" />
              <CB checked={form.active}      onChange={(v) => setF('active', v)}      label="Active" />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Billing</span>
            <CB checked={form.isRatioApplicable} onChange={(v) => setF('isRatioApplicable', v)} label="Billing Ratio Applicable" />
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <label style={labelBase}>Billing Responsibility</label>
              <select value={form.billingResponsibility} onChange={(e) => setF('billingResponsibility', e.target.value as BillingResponsibility | '')} style={{ ...inputBase, maxWidth: '340px' }}>
                <option value="">— Select —</option>
                {BILLING_RESPONSIBILITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {form.isRatioApplicable && (
              <BillingRatioGrid isEnabled={true} billingRatioType={form.billingRatioType} onBillingRatioTypeChange={(v) => setF('billingRatioType', v)} rows={form.billingRatioRows} onChange={(rows) => setF('billingRatioRows', rows)} errors={{ billingRatioType: fieldErrors.billingRatioType, rows: fieldErrors.billingRatioRows }} />
            )}
          </div>
        </div>

        {/* Contract */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Contract</span>
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <CB checked={form.contractRequired} onChange={(v) => setF('contractRequired', v)} label="Contract Required" />
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', marginLeft: '22px' }}>Service can only be availed against a valid contract</div>
            </div>
            {form.contractRequired && (
              <div style={twoCol}>
                <div style={fw}>
                  <label style={labelMuted}>Contract Operator</label>
                  <select value={form.contractOperator} onChange={(e) => setF('contractOperator', e.target.value as ContractOperator | '')} style={inputBase}>
                    <option value="">— None —</option>
                    {CONTRACT_OPERATOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={fw}>
                  <label style={labelMuted}>Applicable Contract</label>
                  <select value={form.applicableContract} onChange={(e) => setF('applicableContract', e.target.value)} style={inputBase}>
                    <option value="">— None —</option>
                    {MOCK_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderStep2() {
    const showMeter    = recurrenceMode === 'meter'    || recurrenceMode === 'both';
    const showDuration = recurrenceMode === 'duration' || recurrenceMode === 'both';
    return (
      <>
        {/* Recurrence */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Recurrence</span>
          </div>
          <div style={sCardBody}>
            <OptionCards
              label="How is recurrence tracked?"
              options={[
                { value: 'none',     label: 'None',        desc: 'No restriction' },
                { value: 'meter',    label: 'By Meter',    desc: 'KM / Hours / Cycles' },
                { value: 'duration', label: 'By Duration', desc: 'Days / Months' },
                { value: 'both',     label: 'Both',        desc: 'Meter AND/OR Duration' },
              ]}
              value={recurrenceMode}
              onChange={(v) => setRecurrenceMode(v as 'none' | 'meter' | 'duration' | 'both')}
            />
            {showMeter && (
              <div style={twoCol}>
                <div style={fw}>
                  <label style={labelBase}>Meter Reading Type <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.meterReadingType} onChange={(e) => setF('meterReadingType', e.target.value as MeterReadingType | '')} style={fieldErrors.meterReadingType ? inputErr : inputBase}>
                    <option value="">— Select —</option>
                    {METER_READING_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {fieldErrors.meterReadingType && <span style={errTxt}>{fieldErrors.meterReadingType}</span>}
                </div>
                <div style={fw}>
                  <label style={labelBase}>Meter Reading Value <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="number" min={0} value={form.meterReading} onChange={(e) => setF('meterReading', e.target.value)} style={fieldErrors.meterReading ? inputErr : inputBase} placeholder="e.g. 10000" />
                  {fieldErrors.meterReading && <span style={errTxt}>{fieldErrors.meterReading}</span>}
                </div>
              </div>
            )}
            {showDuration && (
              <div style={twoCol}>
                <div style={fw}>
                  <label style={labelBase}>Duration Type <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={form.durationType} onChange={(e) => setF('durationType', e.target.value as DurationType | '')} style={fieldErrors.durationType ? inputErr : inputBase}>
                    <option value="">— Select —</option>
                    {DURATION_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {fieldErrors.durationType && <span style={errTxt}>{fieldErrors.durationType}</span>}
                </div>
                <div style={fw}>
                  <label style={labelBase}>Duration Value <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="number" min={1} value={form.durationValue} onChange={(e) => setF('durationValue', e.target.value)} style={fieldErrors.durationValue ? inputErr : inputBase} placeholder="e.g. 12" />
                  {fieldErrors.durationValue && <span style={errTxt}>{fieldErrors.durationValue}</span>}
                </div>
              </div>
            )}
            {recurrenceMode === 'both' && (
              <div style={fw}>
                <label style={labelBase}>Operator (when both apply)</label>
                <SegmentedControl options={[{ value: 'AND', label: 'AND — whichever comes first' }, { value: 'OR', label: 'OR — either is sufficient' }]} value={form.operator} onChange={(v) => setF('operator', v as '' | OperatorType)} />
              </div>
            )}
          </div>
        </div>

        {/* Asset Requirements */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Asset Requirements</span>
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <CB checked={form.installedAssetRequired} onChange={(v) => setF('installedAssetRequired', v)} label="Installed Asset Required" />
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', marginLeft: '22px' }}>Service requires a registered asset to be linked</div>
            </div>
            {form.installedAssetRequired && (
              <div style={twoCol}>
                <div style={fw}>
                  <label style={labelMuted}>Asset Identification Level</label>
                  <select value={form.assetIdentificationLevel} onChange={(e) => setF('assetIdentificationLevel', e.target.value as AssetIdentificationLevel | '')} style={inputBase}>
                    <option value="">— Select —</option>
                    {ASSET_ID_LEVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '18px' }}>
                  <CB checked={form.multiAssetServiceAllowed} onChange={(v) => setF('multiAssetServiceAllowed', v)} label="Multi-Asset Allowed" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Schedule */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Service Schedule</span>
          </div>
          <div style={sCardBody}>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Standard Service Duration (hours)</label>
                <input type="number" min={0} step={0.5} value={form.standardServiceDuration} onChange={(e) => setF('standardServiceDuration', e.target.value)} style={inputBase} placeholder="e.g. 2" />
              </div>
            </div>
            <div style={fw}>
              <CB checked={form.serviceTimeWindowRequired} onChange={(v) => setF('serviceTimeWindowRequired', v)} label="Service Time Window Required" />
            </div>
            {form.serviceTimeWindowRequired && (
              <div style={twoCol}>
                <div style={fw}>
                  <label style={labelMuted}>Window From <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="time" value={form.defaultServiceWindowFrom} onChange={(e) => setF('defaultServiceWindowFrom', e.target.value)} style={fieldErrors.defaultServiceWindowFrom ? inputErr : inputBase} />
                </div>
                <div style={fw}>
                  <label style={labelMuted}>Window To <span style={{ color: '#DC2626' }}>*</span></label>
                  <input type="time" value={form.defaultServiceWindowTo} onChange={(e) => setF('defaultServiceWindowTo', e.target.value)} style={fieldErrors.defaultServiceWindowTo ? inputErr : inputBase} />
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderStep3() {
    return (
      <>
        {/* Delivery */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Delivery</span>
          </div>
          <div style={sCardBody}>
            <div style={twoCol}>
              <div style={fw}>
                <label style={labelBase}>Service Delivery Mode</label>
                <select value={form.serviceDeliveryMode} onChange={(e) => setF('serviceDeliveryMode', e.target.value as ServiceDeliveryMode | '')} style={inputBase}>
                  <option value="">— Select —</option>
                  {SERVICE_DELIVERY_MODE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={fw}>
                <label style={labelBase}>Service Provider Type</label>
                <select value={form.serviceProviderType} onChange={(e) => setF('serviceProviderType', e.target.value as ServiceProviderType | '')} style={inputBase}>
                  <option value="">— Select —</option>
                  {SERVICE_PROVIDER_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Certifications */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Skills & Certifications</span>
          </div>
          <div style={sCardBody}>
            <MultiChips label="Required Skills" options={MOCK_SKILLS} selected={form.requiredSkill} onChange={(v) => setF('requiredSkill', v)} />
            <MultiChips label="Required Certifications" options={MOCK_CERTIFICATIONS} selected={form.requiredCertification} onChange={(v) => setF('requiredCertification', v)} />
            <MultiChips label="Applicable Territories" options={MOCK_TERRITORIES} selected={form.applicableServiceTerritory} onChange={(v) => setF('applicableServiceTerritory', v)} />
          </div>
        </div>

        {/* Crew */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Crew</span>
          </div>
          <div style={sCardBody}>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
              <CB checked={form.crewRequired} onChange={(v) => setF('crewRequired', v)} label="Crew Required" />
              <CB checked={form.remoteServiceAllowed} onChange={(v) => setF('remoteServiceAllowed', v)} label="Remote Service Allowed" />
            </div>
            {form.crewRequired && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={labelBase}>Minimum Technicians</label>
                <input type="number" min={1} value={form.minimumTechnicianCount} onChange={(e) => setF('minimumTechnicianCount', e.target.value)} style={{ ...inputBase, maxWidth: '100px' }} />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  function renderStep4() {
    return (
      <>
        {/* Safety */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Safety</span>
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <CB checked={form.safetyPermitRequired} onChange={(v) => setF('safetyPermitRequired', v)} label="Safety Permit Required" />
            </div>
            {form.safetyPermitRequired && (
              <div style={fw}>
                <label style={labelBase}>Safety Checklist Template <span style={{ color: '#DC2626' }}>*</span></label>
                <select value={form.safetyChecklistTemplate} onChange={(e) => setF('safetyChecklistTemplate', e.target.value)} style={fieldErrors.safetyChecklistTemplate ? inputErr : inputBase}>
                  <option value="">— Select template —</option>
                  {MOCK_CHECKLIST_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {fieldErrors.safetyChecklistTemplate && <span style={errTxt}>{fieldErrors.safetyChecklistTemplate}</span>}
              </div>
            )}
          </div>
        </div>

        {/* SLA Configuration */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>SLA Configuration</span>
          </div>
          <div style={sCardBody}>
            <div style={fw}>
              <label style={labelBase}>SLA Profile</label>
              <select value={form.slaProfile} onChange={(e) => setF('slaProfile', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_SLA_PROFILES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.slaProfile && (
              <div style={threeCol}>
                <div style={fw}>
                  <label style={labelMuted}>SLA Calendar</label>
                  <select value={form.slaCalendar} onChange={(e) => setF('slaCalendar', e.target.value as SLACalendarType | '')} style={inputBase}>
                    <option value="">— Select —</option>
                    {SLA_CALENDAR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={fw}>
                  <label style={labelMuted}>Response SLA (hrs)</label>
                  <input type="number" min={0} value={form.responseSLA} onChange={(e) => setF('responseSLA', e.target.value)} style={inputBase} placeholder="4" />
                </div>
                <div style={fw}>
                  <label style={labelMuted}>Resolution SLA (hrs)</label>
                  <input type="number" min={0} value={form.resolutionSLA} onChange={(e) => setF('resolutionSLA', e.target.value)} style={inputBase} placeholder="24" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval */}
        <div style={sectionCard}>
          <div style={sCardHead}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Approval</span>
          </div>
          <div style={sCardBody}>
            <CB checked={form.approvalRequired} onChange={(v) => setF('approvalRequired', v)} label="Approval Required before service execution" />
          </div>
        </div>
      </>
    );
  }

  function renderStep5() {
    return (
      <>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
          These settings are pre-configured from your profile. Expand any section to review or adjust edge-case options.
        </div>
        <AccordionGroup title="Availability & Status Flags">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px', marginBottom: '14px' }}>
            <CB checked={form.subscriptionApplicable} onChange={(v) => setF('subscriptionApplicable', v)} label="Subscription Applicable" />
            <CB checked={form.separateBillRequired}   onChange={(v) => setF('separateBillRequired', v)}   label="Separate Bill Required" />
            <CB checked={form.discontinued}           onChange={(v) => setF('discontinued', v)}           label="Discontinued" />
            <CB checked={form.availWithUCN}           onChange={(v) => setF('availWithUCN', v)}           label="Avail with UCN" />
            <CB checked={form.isCustom}               onChange={(v) => setF('isCustom', v)}               label="Is Custom" />
            <CB checked={form.availedAtOrganization}  onChange={(v) => setF('availedAtOrganization', v)}  label="Availed At Organization" />
            <CB checked={form.availMultipleTimes}     onChange={(v) => setF('availMultipleTimes', v)}     label="Avail Multiple Times" />
            <CB checked={form.offlineExecutionAllowed}onChange={(v) => setF('offlineExecutionAllowed', v)} label="Offline Execution Allowed" />
          </div>
          {!form.availMultipleTimes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={labelMuted}>Avail Limit</label>
              <input type="number" min={1} value={form.availLimit} onChange={(e) => setF('availLimit', e.target.value)} style={{ ...inputBase, maxWidth: '90px' }} placeholder="—" />
            </div>
          )}
        </AccordionGroup>

        <AccordionGroup title="Contract Flags">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px' }}>
            <CB checked={form.generateReminder}         onChange={(v) => setF('generateReminder', v)}         label="Generate Reminder" />
            <CB checked={form.applicableToAllParts}     onChange={(v) => setF('applicableToAllParts', v)}     label="Applicable To All Parts" />
            <CB checked={form.applicableToAllServices}  onChange={(v) => setF('applicableToAllServices', v)}  label="Applicable To All Services" />
            <CB checked={form.applicableToAllProducts}  onChange={(v) => setF('applicableToAllProducts', v)}  label="Applicable To All Products" />
            <CB checked={form.copyToWarrantyTab}        onChange={(v) => setF('copyToWarrantyTab', v)}        label="Copy to Warranty Tab" />
          </div>
        </AccordionGroup>

        <AccordionGroup title="Child Contract Mapping">
          <div style={fw}>
            <CB checked={form.childContractActive} onChange={(v) => setF('childContractActive', v)} label="Child Contract Active" />
          </div>
          <div style={{ ...twoCol, opacity: form.childContractActive ? 1 : 0.4, pointerEvents: form.childContractActive ? 'auto' : 'none' }}>
            <div>
              <label style={labelMuted}>Child Contracts</label>
              <select multiple value={form.childContracts} onChange={(e) => setF('childContracts', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputBase, height: '80px' }}>
                {MOCK_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Child Labours</label>
              <select multiple value={form.childLabours} onChange={(e) => setF('childLabours', Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputBase, height: '80px' }}>
                {MOCK_SERVICE_TYPES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </AccordionGroup>

        <AccordionGroup title="Classification">
          <div style={threeCol}>
            <div>
              <label style={labelMuted}>Segment Type</label>
              <select value={form.segmentType} onChange={(e) => setF('segmentType', e.target.value)} style={inputBase}>
                <option value="">— Select —</option>
                {MOCK_SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Sub-Segment Type</label>
              <select value={form.subSegmentType} onChange={(e) => setF('subSegmentType', e.target.value)} style={inputBase}>
                <option value="">— Select —</option>
                {MOCK_SUBSEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Organization</label>
              <select value={form.organization} onChange={(e) => setF('organization', e.target.value)} style={inputBase}>
                <option value="">— All —</option>
                {MOCK_ORGS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </AccordionGroup>

        <AccordionGroup title="Contract Settings">
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelMuted}>Claim To</label>
              <select value={form.claimTo} onChange={(e) => setF('claimTo', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_SUPPLIERS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Dependent Contract</label>
              <select value={form.dependentContract} onChange={(e) => setF('dependentContract', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={twoCol}>
            <div>
              <label style={labelMuted}>Default Max Duration (days)</label>
              <input type="number" min={0} value={form.defaultMaxDuration} onChange={(e) => setF('defaultMaxDuration', e.target.value)} style={inputBase} />
            </div>
            <div>
              <label style={labelMuted}>Default Max Usage</label>
              <input type="number" min={0} value={form.defaultMaxUsage} onChange={(e) => setF('defaultMaxUsage', e.target.value)} style={inputBase} />
            </div>
          </div>
        </AccordionGroup>

        <AccordionGroup title="Warranty, Billing & Operations">
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelMuted}>Warranty Eligibility Basis</label>
              <select value={form.warrantyEligibilityBasis} onChange={(e) => setF('warrantyEligibilityBasis', e.target.value as WarrantyEligibilityBasis | '')} style={inputBase}>
                <option value="">— None —</option>
                {WARRANTY_BASIS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px', marginBottom: '14px' }}>
            <CB checked={form.visitChargeApplicable}       onChange={(v) => setF('visitChargeApplicable', v)}       label="Visit Charge Applicable" />
            <CB checked={form.diagnosisChargeApplicable}   onChange={(v) => setF('diagnosisChargeApplicable', v)}   label="Diagnosis Charge Applicable" />
            <CB checked={form.pickupAndDropRequired}       onChange={(v) => setF('pickupAndDropRequired', v)}       label="Pickup & Drop Required" />
            <CB checked={form.closureEvidenceRequired}     onChange={(v) => setF('closureEvidenceRequired', v)}     label="Closure Evidence Required" />
            <CB checked={form.complaintReviewRequired}     onChange={(v) => setF('complaintReviewRequired', v)}     label="Complaint Review Required" />
            <CB checked={form.testInspectionEvidenceRequired} onChange={(v) => setF('testInspectionEvidenceRequired', v)} label="Test/Inspection Evidence" />
          </div>
          <div style={fw}>
            <CB checked={form.followUpRequired} onChange={(v) => setF('followUpRequired', v)} label="Follow-up Required" />
            {form.followUpRequired && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={labelMuted}>Follow-up Interval (days)</label>
                <input type="number" min={1} value={form.followUpInterval} onChange={(e) => setF('followUpInterval', e.target.value)} style={{ ...inputBase, maxWidth: '90px' }} />
              </div>
            )}
          </div>
          <div>
            <label style={labelMuted}>Knowledge Article Reference</label>
            <input value={form.knowledgeArticleReference} onChange={(e) => setF('knowledgeArticleReference', e.target.value)} style={inputBase} placeholder="URL or reference code" />
          </div>
        </AccordionGroup>

        <AccordionGroup title="Checklist Templates">
          <div style={threeCol}>
            <div>
              <label style={labelMuted}>Pre-Service Checklist</label>
              <select value={form.preServiceChecklistTemplate} onChange={(e) => setF('preServiceChecklistTemplate', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_CHECKLIST_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Post-Service Checklist</label>
              <select value={form.postServiceChecklistTemplate} onChange={(e) => setF('postServiceChecklistTemplate', e.target.value)} style={inputBase}>
                <option value="">— None —</option>
                {MOCK_CHECKLIST_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelMuted}>Proficiency Level</label>
              <select value={form.skillProficiencyLevel} onChange={(e) => setF('skillProficiencyLevel', e.target.value as ServiceTypeRecord['skillProficiencyLevel'])} style={inputBase}>
                <option value="">— Any —</option>
                {['Junior', 'Senior', 'Expert', 'OEM Certified'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </AccordionGroup>

        <AccordionGroup title="Service Source Applicability">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['Complaint', 'Contract', 'Warranty', 'Scheduled PM', 'IoT Alert', 'Customer Request'] as const).map((opt) => {
              const on = form.serviceRequestSourceApplicability.includes(opt);
              return (
                <button key={opt} type="button"
                  onClick={() => setF('serviceRequestSourceApplicability', (on ? form.serviceRequestSourceApplicability.filter((s) => s !== opt) : [...form.serviceRequestSourceApplicability, opt]) as ServiceTypeRecord['serviceRequestSourceApplicability'])}
                  style={{ padding: '4px 12px', fontSize: '12px', fontWeight: on ? 600 : 400, borderRadius: '9999px', border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-primary)' : 'transparent', color: on ? 'white' : 'var(--color-text)', cursor: 'pointer' }}
                >{opt}</button>
              );
            })}
          </div>
        </AccordionGroup>

        <AccordionGroup title="Product Applicability" badge={form.productApplicabilityRows.length}>
          <ProductApplicabilityGrid rows={form.productApplicabilityRows} onChange={(rows) => setF('productApplicabilityRows', rows)} />
        </AccordionGroup>

        {form.contractRequired && (
          <>
            <AccordionGroup title="Contract Relation — Labour" badge={form.labourRows.length}>
              <ContractRelationSection type="labour"
                rows={form.labourRows as (ContractRelationLabourRow | ContractRelationPartRow)[]}
                onChange={(rows) => setF('labourRows', rows as ContractRelationLabourRow[])}
              />
            </AccordionGroup>
            <AccordionGroup title="Contract Relation — Parts" badge={form.partRows.length}>
              <ContractRelationSection type="part"
                rows={form.partRows as (ContractRelationLabourRow | ContractRelationPartRow)[]}
                onChange={(rows) => setF('partRows', rows as ContractRelationPartRow[])}
              />
            </AccordionGroup>
          </>
        )}

        <AccordionGroup title="Custom Fields" badge={form.attributeTagRows.length}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            Add configurable attributes to capture extra data for this service type.
          </div>
          <AttributeTaggingGrid rows={form.attributeTagRows} onChange={(rows) => setF('attributeTagRows', rows)} />
        </AccordionGroup>
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];
  const isLastStep  = activeStep === 5;

  return (
    <AdminShell>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '58px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
              <button type="button" onClick={() => navigate('/admin/master/service-type-master')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '11px', padding: 0 }}>
                Service Type Master
              </button>
              {' / '}{isNew ? 'New Service Type' : form.name || form.code}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                {isNew ? 'New Service Type' : form.name || form.code}
              </span>
              {!isNew && (
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, ...statusStyle }}>{status}</span>
              )}
            </div>
          </div>
          <button type="button" onClick={() => setHelpOpen(true)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '7px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>
            How this works
          </button>
        </div>

        {/* Middle: left sidebar + scrollable form body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left step sidebar (220px) */}
          <nav style={{ width: '220px', flexShrink: 0, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
            {WIZARD_STEPS.map((s) => {
              const isAct     = activeStep === s.index;
              const isDone    = stepDone.has(s.index);
              const isSkipped = skippedSteps.has(s.index);
              const isHov     = hoveredStep === s.index;
              const dotColor  = isAct ? 'var(--color-primary)' : isDone ? '#16A34A' : '#CBD5E1';
              return (
                <button key={s.index} type="button"
                  onClick={() => isSkipped ? unSkipStep(s.index) : setActiveStep(s.index)}
                  onMouseEnter={() => setHoveredStep(s.index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 12px 12px 20px', border: 'none', borderBottom: '1px solid var(--color-border)', background: isAct ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : isHov ? 'color-mix(in srgb, var(--color-primary) 3%, white)' : 'transparent', cursor: 'pointer', textAlign: 'left', opacity: isSkipped ? 0.45 : 1, transition: 'background 0.1s', width: '100%' }}
                >
                  {isAct && <span style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: 'var(--color-primary)' }} />}
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, background: dotColor, transition: 'background 0.15s' }} />
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: isAct ? 600 : 500, color: isAct ? 'var(--color-primary)' : isDone ? 'var(--color-text)' : 'var(--color-text-muted)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                  {isSkipped && <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontStyle: 'italic', flexShrink: 0 }}>skipped</span>}
                  <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)', opacity: isHov ? 0.7 : 0, transition: 'opacity 0.15s' }} />
                </button>
              );
            })}
          </nav>

          {/* Form body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', background: 'var(--color-surface-subtle)' }}>
            {stepContent[activeStep]?.()}
          </div>

        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => navigate('/admin/master/service-type-master')}
              style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>
              Cancel
            </button>
            {activeStep > 0 && (
              <button type="button" onClick={prevStep}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isLastStep && (
              <>
                <button type="button" onClick={nextStep}
                  style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
                  Next →
                </button>
              </>
            )}
            {isLastStep && (
              <>
                <button type="button" onClick={() => doSave(false)} disabled={isActive}
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--color-border)', borderRadius: '8px', background: isActive ? 'var(--color-surface-subtle)' : 'var(--color-surface)', color: isActive ? 'var(--color-text-muted)' : 'var(--color-text)', cursor: isActive ? 'not-allowed' : 'pointer' }}>
                  Save as Draft
                </button>
                <button type="button" onClick={() => doSave(true)}
                  style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
                  {isActive ? 'Save' : 'Save & Activate'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {helpTopic && <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} topic={helpTopic} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'white', background: toast.tone === 'success' ? '#15803D' : '#DC2626', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}
    </AdminShell>
  );
};

export default ServiceTypeFormPage;
