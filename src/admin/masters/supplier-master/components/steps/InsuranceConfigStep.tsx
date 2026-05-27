import React, { useState } from 'react';
import type { BPInsuranceConfig, BPInsuranceBranch } from '../../types/supplierMaster.types';
import { INSURANCE_PICKLISTS } from '../../constants/supplierMaster.constants';
import AppDialog from '../../../../../components/app/AppDialog';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const labelBase: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em',
};
const fw: React.CSSProperties = { gridColumn: '1 / -1' };
const sectionCard: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '12px', overflow: 'hidden',
};
const sCardHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};
const sCardBody: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px',
};
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.1s',
};
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', color: '#fff' };
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

// ─── Inner helper components ──────────────────────────────────────────────────

function Req() {
  return <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>;
}

function FieldHint({ text }: { text: string }) {
  return <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{text}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</span>;
}

function CheckRow({ label, hint, checked, onChange, disabled }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled: boolean;
}) {
  return (
    <label style={{ display: 'flex', gap: '8px', cursor: disabled ? 'default' : 'pointer', alignItems: 'flex-start' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '2px', accentColor: 'var(--color-primary)', width: '14px', height: '14px', flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{hint}</div>}
      </div>
    </label>
  );
}

function TagSelect({ options, selected, onChange, disabled, placeholder }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; disabled: boolean; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', minHeight: '42px', alignItems: 'flex-start' }}>
      {selected.map((s) => (
        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, borderRadius: '4px' }}>
          {s}
          {!disabled && (
            <button type="button" onClick={() => onChange(selected.filter((x) => x !== s))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 1px', lineHeight: 1 }}>×</button>
          )}
        </span>
      ))}
      {!disabled && (
        <select
          value=""
          onChange={(e) => { if (e.target.value && !selected.includes(e.target.value)) onChange([...selected, e.target.value]); }}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px 0' }}
        >
          <option value="">{placeholder ?? '+ Add…'}</option>
          {options.filter((o) => !selected.includes(o)).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '2px' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</span>
    </div>
  );
}

// ─── Branch form types ────────────────────────────────────────────────────────

interface BranchForm {
  branchName: string;
  branchType: string;
  status: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
  coverageScope: string;
  coveredStates: string[];
  contactPerson: string;
  countryCode: string;
  mobileNumber: string;
  emailId: string;
  escalationContact: string;
}

interface BranchErrors {
  branchName?: string;
  branchType?: string;
  status?: string;
  effectiveStartDate?: string;
  addressLine1?: string;
  country?: string;
  state?: string;
  city?: string;
  coverageScope?: string;
  coveredStates?: string;
  inspectionMode?: string;
}

const EMPTY_BRANCH: BranchForm = {
  branchName: '', branchType: '', status: '', effectiveStartDate: '', effectiveEndDate: '',
  addressLine1: '', addressLine2: '', country: '', state: '', city: '', pinCode: '',
  coverageScope: '', coveredStates: [],
  contactPerson: '', countryCode: '', mobileNumber: '', emailId: '', escalationContact: '',
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  config: BPInsuranceConfig;
  onChange: (c: BPInsuranceConfig) => void;
  isViewOnly: boolean;
}

export function InsuranceConfigStep({ config, onChange, isViewOnly }: Props) {
  const set = <K extends keyof BPInsuranceConfig>(k: K, v: BPInsuranceConfig[K]) =>
    onChange({ ...config, [k]: v });

  // ── Branch CRUD state ─────────────────────────────────────────────────
  const [branchOpen, setBranchOpen]       = useState(false);
  const [branchEditId, setBranchEditId]   = useState<string | null>(null);
  const [branchForm, setBranchForm]       = useState<BranchForm>(EMPTY_BRANCH);
  const [branchErrors, setBranchErrors]   = useState<BranchErrors>({});

  function openAddBranch() {
    setBranchEditId(null);
    setBranchForm(EMPTY_BRANCH);
    setBranchErrors({});
    setBranchOpen(true);
  }

  function openEditBranch(b: BPInsuranceBranch) {
    setBranchEditId(b.id);
    setBranchForm({
      branchName: b.branchName, branchType: b.branchType, status: b.status,
      effectiveStartDate: b.effectiveStartDate, effectiveEndDate: b.effectiveEndDate,
      addressLine1: b.addressLine1, addressLine2: b.addressLine2,
      country: b.country, state: b.state, city: b.city, pinCode: b.pinCode,
      coverageScope: b.coverageScope, coveredStates: b.coveredStates,
      contactPerson: b.contactPerson, countryCode: b.countryCode,
      mobileNumber: b.mobileNumber, emailId: b.emailId, escalationContact: b.escalationContact,
    });
    setBranchErrors({});
    setBranchOpen(true);
  }

  function saveBranch() {
    const errs: BranchErrors = {};
    if (!branchForm.branchName.trim()) errs.branchName = 'Branch Name is required.';
    if (!branchForm.branchType) errs.branchType = 'Branch Type is required.';
    if (!branchForm.status) errs.status = 'Branch Status is required.';
    if (!branchForm.effectiveStartDate) errs.effectiveStartDate = 'Effective Start Date is required.';
    if (!branchForm.addressLine1.trim()) errs.addressLine1 = 'Address Line 1 is required.';
    if (!branchForm.country) errs.country = 'Country is required.';
    if (!branchForm.state) errs.state = 'State is required.';
    if (!branchForm.city.trim()) errs.city = 'City is required.';
    if (!branchForm.coverageScope) errs.coverageScope = 'Branch Coverage Scope is required.';
    if (['State', 'Multi-State'].includes(branchForm.coverageScope) && branchForm.coveredStates.length === 0) {
      errs.coveredStates = 'Select at least one Covered State.';
    }
    if (Object.keys(errs).length > 0) { setBranchErrors(errs); return; }

    const entry: BPInsuranceBranch = {
      id: branchEditId ?? `BR-${Date.now()}`,
      branchCode: branchEditId
        ? (config.branches.find((b) => b.id === branchEditId)?.branchCode ?? `BC-${Date.now()}`)
        : `BC-${Date.now()}`,
      branchName: branchForm.branchName.trim(),
      branchType: branchForm.branchType,
      status: branchForm.status,
      effectiveStartDate: branchForm.effectiveStartDate,
      effectiveEndDate: branchForm.effectiveEndDate,
      addressLine1: branchForm.addressLine1.trim(),
      addressLine2: branchForm.addressLine2.trim(),
      country: branchForm.country, state: branchForm.state,
      city: branchForm.city.trim(), pinCode: branchForm.pinCode,
      coverageScope: branchForm.coverageScope, coveredStates: branchForm.coveredStates,
      contactPerson: branchForm.contactPerson.trim(),
      countryCode: branchForm.countryCode,
      mobileNumber: branchForm.mobileNumber,
      emailId: branchForm.emailId.toLowerCase().trim(),
      escalationContact: branchForm.escalationContact.trim(),
    };

    const branches = branchEditId
      ? config.branches.map((b) => (b.id === branchEditId ? entry : b))
      : [...config.branches, entry];
    onChange({ ...config, branches });
    setBranchOpen(false);
  }

  function removeBranch(id: string) {
    onChange({ ...config, branches: config.branches.filter((b) => b.id !== id) });
  }

  const bf = branchForm;
  const setBF = (patch: Partial<BranchForm>) => setBranchForm((f) => ({ ...f, ...patch }));

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 1 — Insurance Provider Profile
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Insurance Provider Profile</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Insurance Provider Type */}
          <div>
            <label style={labelBase}>Insurance Provider Type <Req /></label>
            <select value={config.insuranceProviderType} onChange={(e) => set('insuranceProviderType', e.target.value)} disabled={isViewOnly} style={inputBase}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.insuranceProviderTypes.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Provider Category */}
          <div>
            <label style={labelBase}>Provider Category</label>
            <select value={config.providerCategory} onChange={(e) => set('providerCategory', e.target.value)} disabled={isViewOnly} style={inputBase}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.providerCategories.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Regulator Registration Number */}
          <div>
            <label style={labelBase}>Regulator Registration Number <Req /></label>
            <input
              type="text" value={config.regulatorRegNumber}
              onChange={(e) => set('regulatorRegNumber', e.target.value.toUpperCase())}
              disabled={isViewOnly} placeholder="e.g. IRDAI/HQ/ORD/2024/001"
              style={inputBase}
            />
            <FieldHint text="Converted to uppercase automatically. Must be unique across insurance providers." />
          </div>

          {/* Regulator Registration Valid Till */}
          <div>
            <label style={labelBase}>Regulator Registration Valid Till <Req /></label>
            <input type="date" value={config.regulatorRegValidTill} onChange={(e) => set('regulatorRegValidTill', e.target.value)} disabled={isViewOnly} style={inputBase} />
            <FieldHint text="Must be on or after today. Expiry will block new policy issuance." />
          </div>

          {/* Supported Insurance Lines */}
          <div style={fw}>
            <label style={labelBase}>Supported Insurance Lines <Req /></label>
            <TagSelect
              options={INSURANCE_PICKLISTS.insuranceLines}
              selected={config.supportedInsuranceLines}
              onChange={(v) => set('supportedInsuranceLines', v)}
              disabled={isViewOnly}
              placeholder="+ Add Insurance Line…"
            />
            <FieldHint text="At least one Insurance Line must be selected." />
          </div>

          {/* Default Insurance Provider */}
          <div style={fw}>
            <CheckRow
              label="Default Insurance Provider"
              hint="Only one default insurance provider is allowed per branch or organisation."
              checked={config.defaultInsuranceProvider}
              onChange={(v) => set('defaultInsuranceProvider', v)}
              disabled={isViewOnly}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 2 — Document & KYC Requirements
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Document &amp; KYC Requirements</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Mandatory Customer Documents */}
          <div style={fw}>
            <label style={labelBase}>Mandatory Customer Documents <Req /></label>
            <TagSelect
              options={INSURANCE_PICKLISTS.kycDocuments}
              selected={config.mandatoryCustomerDocuments}
              onChange={(v) => set('mandatoryCustomerDocuments', v)}
              disabled={isViewOnly}
              placeholder="+ Add Document…"
            />
            <FieldHint text="At least one document type is required. Applies to all Insurance Lines configured above." />
          </div>

          {/* Vehicle Inspection Required */}
          <div style={fw}>
            <CheckRow
              label="Vehicle Inspection Required"
              hint="If enabled, the Inspection Mode field below becomes mandatory."
              checked={config.vehicleInspectionRequired}
              onChange={(v) => set('vehicleInspectionRequired', v)}
              disabled={isViewOnly}
            />
          </div>

          {/* Inspection Mode — conditional */}
          {config.vehicleInspectionRequired && (
            <div>
              <label style={labelBase}>Inspection Mode <Req /></label>
              <select value={config.inspectionMode} onChange={(e) => set('inspectionMode', e.target.value)} disabled={isViewOnly} style={inputBase}>
                <option value="">Select&hellip;</option>
                {INSURANCE_PICKLISTS.inspectionModes.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          {/* Dealer Verification Required */}
          <div style={fw}>
            <CheckRow
              label="Dealer Verification Required"
              checked={config.dealerVerificationRequired}
              onChange={(v) => set('dealerVerificationRequired', v)}
              disabled={isViewOnly}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 3 — Commission & Incentive
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Commission &amp; Incentive</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Commission Applicable */}
          <div style={fw}>
            <CheckRow
              label="Commission Applicable"
              hint="Enabling this reveals commission configuration fields below."
              checked={config.commissionApplicable}
              onChange={(v) => {
                onChange({
                  ...config,
                  commissionApplicable: v,
                  ...(v ? {} : { commissionType: '', commissionValue: '', commissionCurrency: '', payoutBasis: '', payoutTrigger: '' }),
                });
              }}
              disabled={isViewOnly}
            />
          </div>

          {config.commissionApplicable && (
            <>
              {/* Commission Type */}
              <div>
                <label style={labelBase}>Commission Type <Req /></label>
                <select
                  value={config.commissionType}
                  onChange={(e) => {
                    onChange({ ...config, commissionType: e.target.value, commissionValue: '', commissionCurrency: '' });
                  }}
                  disabled={isViewOnly} style={inputBase}
                >
                  <option value="">Select&hellip;</option>
                  {INSURANCE_PICKLISTS.commissionTypes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Commission Value — shown when type selected */}
              {config.commissionType && (
                <div>
                  <label style={labelBase}>
                    Commission Value <Req />
                    {config.commissionType === 'Percentage' && (
                      <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> (max 100%)</span>
                    )}
                  </label>
                  <input
                    type="number" min="0"
                    max={config.commissionType === 'Percentage' ? 100 : undefined}
                    value={config.commissionValue}
                    onChange={(e) => set('commissionValue', e.target.value)}
                    disabled={isViewOnly} placeholder="0"
                    style={inputBase}
                  />
                </div>
              )}

              {/* Commission Currency — shown when type = Fixed */}
              {config.commissionType === 'Fixed' && (
                <div>
                  <label style={labelBase}>Commission Currency <Req /></label>
                  <select value={config.commissionCurrency} onChange={(e) => set('commissionCurrency', e.target.value)} disabled={isViewOnly} style={inputBase}>
                    <option value="">Select&hellip;</option>
                    {INSURANCE_PICKLISTS.currencies.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}

              {/* Payout Basis */}
              <div>
                <label style={labelBase}>Payout Basis</label>
                <select value={config.payoutBasis} onChange={(e) => set('payoutBasis', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select&hellip;</option>
                  {INSURANCE_PICKLISTS.payoutBasisOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Payout Trigger */}
              <div>
                <label style={labelBase}>Payout Trigger</label>
                <select value={config.payoutTrigger} onChange={(e) => set('payoutTrigger', e.target.value)} disabled={isViewOnly} style={inputBase}>
                  <option value="">Select&hellip;</option>
                  {INSURANCE_PICKLISTS.payoutTriggerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 4 — Branches (repeatable grid)
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Branch Network</SectionTitle>
          {!isViewOnly && (
            <button
              type="button"
              onClick={openAddBranch}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '0 12px', height: '28px', fontSize: '12px', fontWeight: 600,
                borderRadius: '7px', border: '1px solid var(--color-primary)',
                background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
                color: 'var(--color-primary)', cursor: 'pointer',
              }}
            >
              + Add Branch
            </button>
          )}
        </div>

        {config.branches.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No branches configured. Add branch coverage and contact details.
          </div>
        ) : (
          <div>
            {/* Grid header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 110px 120px 68px', gap: '8px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', padding: '0 16px', height: '34px', alignItems: 'center' }}>
              {['Branch Name', 'Type', 'Status', 'Start Date', 'Coverage Scope', ''].map((h) => (
                <div key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>
            {/* Grid rows */}
            {config.branches.map((b, idx) => (
              <div
                key={b.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 80px 110px 120px 68px', gap: '8px',
                  padding: '0 16px', height: '44px', alignItems: 'center',
                  borderBottom: idx < config.branches.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{b.branchName}</div>
                  {b.branchCode && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{b.branchCode}</div>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{b.branchType || '\u2014'}</div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    background: b.status === 'Active' ? '#DCFCE7' : '#FEF2F2',
                    color: b.status === 'Active' ? '#15803D' : '#DC2626',
                  }}>{b.status || '\u2014'}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{b.effectiveStartDate || '\u2014'}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{b.coverageScope || '\u2014'}</div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {!isViewOnly && (
                    <>
                      <button type="button" onClick={() => openEditBranch(b)} title="Edit"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => removeBranch(b.id)} title="Remove"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 5 — Configuration Validity
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={sectionCard}>
        <div style={sCardHead}>
          <SectionTitle>Configuration Validity</SectionTitle>
        </div>
        <div style={sCardBody}>

          {/* Effective From */}
          <div>
            <label style={labelBase}>Effective From Date <Req /></label>
            <input type="date" value={config.configEffectiveFrom} onChange={(e) => set('configEffectiveFrom', e.target.value)} disabled={isViewOnly} style={inputBase} />
            <FieldHint text="Insurance configuration is usable only from this date." />
          </div>

          {/* Effective To */}
          <div>
            <label style={labelBase}>Effective To Date</label>
            <input type="date" value={config.configEffectiveTo} onChange={(e) => set('configEffectiveTo', e.target.value)} disabled={isViewOnly} style={inputBase} />
            <FieldHint text="Must be on or after Effective From. Expired configuration will not be available for new transactions." />
          </div>

          {/* Status */}
          <div>
            <label style={labelBase}>Status <Req /></label>
            <select value={config.configStatus} onChange={(e) => set('configStatus', e.target.value)} disabled={isViewOnly} style={inputBase}>
              {INSURANCE_PICKLISTS.configStatus.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Branch AppDialog ──────────────────────────────────────────────── */}
      <AppDialog
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        title={branchEditId ? 'Edit Branch' : 'Add Branch'}
        width={680}
        actions={
          !isViewOnly ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setBranchOpen(false)} style={btnOutline}>Cancel</button>
              <button type="button" onClick={saveBranch} style={btnPrimary}>{branchEditId ? 'Update' : 'Add'}</button>
            </div>
          ) : undefined
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          {/* ── Branch Overview ───────────────────────────────────── */}
          <SubHeading>Branch Overview</SubHeading>

          <div>
            <label style={labelBase}>Branch Name <Req /></label>
            <input type="text" value={bf.branchName} onChange={(e) => setBF({ branchName: e.target.value })} disabled={isViewOnly} placeholder="e.g. Mumbai Regional Branch"
              style={{ ...inputBase, borderColor: branchErrors.branchName ? '#DC2626' : undefined }} />
            {branchErrors.branchName && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.branchName}</div>}
          </div>

          <div>
            <label style={labelBase}>Branch Type <Req /></label>
            <select value={bf.branchType} onChange={(e) => setBF({ branchType: e.target.value })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.branchType ? '#DC2626' : undefined }}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.branchTypes.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {branchErrors.branchType && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.branchType}</div>}
          </div>

          <div>
            <label style={labelBase}>Status <Req /></label>
            <select value={bf.status} onChange={(e) => setBF({ status: e.target.value })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.status ? '#DC2626' : undefined }}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.branchStatuses.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {branchErrors.status && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.status}</div>}
          </div>

          <div>
            <label style={labelBase}>Effective Start Date <Req /></label>
            <input type="date" value={bf.effectiveStartDate} onChange={(e) => setBF({ effectiveStartDate: e.target.value })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.effectiveStartDate ? '#DC2626' : undefined }} />
            {branchErrors.effectiveStartDate && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.effectiveStartDate}</div>}
          </div>

          <div>
            <label style={labelBase}>Effective End Date</label>
            <input type="date" value={bf.effectiveEndDate} onChange={(e) => setBF({ effectiveEndDate: e.target.value })} disabled={isViewOnly} style={inputBase} />
          </div>

          {/* ── Branch Address & Geography ────────────────────────── */}
          <SubHeading>Branch Address &amp; Geography</SubHeading>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelBase}>Address Line 1 <Req /></label>
            <input type="text" value={bf.addressLine1} onChange={(e) => setBF({ addressLine1: e.target.value })} disabled={isViewOnly} placeholder="Street address, building"
              style={{ ...inputBase, borderColor: branchErrors.addressLine1 ? '#DC2626' : undefined }} />
            {branchErrors.addressLine1 && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.addressLine1}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelBase}>Address Line 2</label>
            <input type="text" value={bf.addressLine2} onChange={(e) => setBF({ addressLine2: e.target.value })} disabled={isViewOnly} placeholder="Area, landmark (optional)" style={inputBase} />
          </div>

          <div>
            <label style={labelBase}>Country <Req /></label>
            <select value={bf.country} onChange={(e) => setBF({ country: e.target.value, state: '', coveredStates: [] })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.country ? '#DC2626' : undefined }}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.countries.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {branchErrors.country && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.country}</div>}
          </div>

          <div>
            <label style={labelBase}>State <Req /></label>
            <select value={bf.state} onChange={(e) => setBF({ state: e.target.value })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.state ? '#DC2626' : undefined }}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.states.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {branchErrors.state && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.state}</div>}
          </div>

          <div>
            <label style={labelBase}>City <Req /></label>
            <input type="text" value={bf.city} onChange={(e) => setBF({ city: e.target.value })} disabled={isViewOnly} placeholder="Enter city"
              style={{ ...inputBase, borderColor: branchErrors.city ? '#DC2626' : undefined }} />
            {branchErrors.city && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.city}</div>}
          </div>

          <div>
            <label style={labelBase}>PIN Code</label>
            <input type="text" value={bf.pinCode} onChange={(e) => setBF({ pinCode: e.target.value.replace(/\D/g, '') })} disabled={isViewOnly} placeholder="e.g. 400001" maxLength={10} style={inputBase} />
          </div>

          <div>
            <label style={labelBase}>Branch Coverage Scope <Req /></label>
            <select value={bf.coverageScope} onChange={(e) => setBF({ coverageScope: e.target.value, coveredStates: [] })} disabled={isViewOnly}
              style={{ ...inputBase, borderColor: branchErrors.coverageScope ? '#DC2626' : undefined }}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.coverageScopes.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {branchErrors.coverageScope && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.coverageScope}</div>}
          </div>

          {/* Covered States — conditional */}
          {['State', 'Multi-State'].includes(bf.coverageScope) && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelBase}>Covered States <Req /></label>
              <TagSelect
                options={INSURANCE_PICKLISTS.states}
                selected={bf.coveredStates}
                onChange={(v) => setBF({ coveredStates: v })}
                disabled={isViewOnly}
                placeholder="+ Add State…"
              />
              {branchErrors.coveredStates && <div style={{ color: '#DC2626', fontSize: '11px', marginTop: '3px' }}>{branchErrors.coveredStates}</div>}
            </div>
          )}

          {/* ── Branch Contact Details ────────────────────────────── */}
          <SubHeading>Branch Contact Details</SubHeading>

          <div>
            <label style={labelBase}>Contact Person</label>
            <input type="text" value={bf.contactPerson} onChange={(e) => setBF({ contactPerson: e.target.value })} disabled={isViewOnly} placeholder="Full name" style={inputBase} />
          </div>

          <div>
            <label style={labelBase}>Escalation Contact</label>
            <input type="text" value={bf.escalationContact} onChange={(e) => setBF({ escalationContact: e.target.value })} disabled={isViewOnly} placeholder="Name or designation" style={inputBase} />
          </div>

          <div>
            <label style={labelBase}>Country Code</label>
            <select value={bf.countryCode} onChange={(e) => setBF({ countryCode: e.target.value })} disabled={isViewOnly} style={inputBase}>
              <option value="">Select&hellip;</option>
              {INSURANCE_PICKLISTS.countryCodes.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label style={labelBase}>Mobile Number</label>
            <input type="text" value={bf.mobileNumber} onChange={(e) => setBF({ mobileNumber: e.target.value.replace(/\D/g, '') })} disabled={isViewOnly} placeholder="10–15 digits" maxLength={15} style={inputBase} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelBase}>Email ID</label>
            <input type="email" value={bf.emailId} onChange={(e) => setBF({ emailId: e.target.value })} disabled={isViewOnly} placeholder="branch@example.com" style={inputBase} />
          </div>

        </div>
      </AppDialog>

    </div>
  );
}
