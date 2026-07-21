import React from 'react';
import type { Customer } from '../../types/customerMaster.types';
import {
  CUSTOMER_STATUSES,
  SALUTATIONS,
  GENDERS,
  MARITAL_STATUSES,
  NATIONALITIES,
  EDUCATION_LEVELS,
  LANGUAGES,
  COUNTRY_CODES,
  CREATED_SOURCES,
  SOURCE_VALIDATION_STATUSES,
  LEAD_SOURCES,
  VISIBILITY_SCOPES,
  CUSTOMER_SEGMENTS,
  CREDIT_STATUSES,
} from '../../constants/customerMaster.constants';
import { CustomerAccordionSection } from '../CustomerAccordionSection';
import { MasterFormSectionSummary } from '../../../../../experience/components/AdminPageShell';

// ─── Style constants ──────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const inputDisabled: React.CSSProperties = {
  ...inputBase, background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', cursor: 'not-allowed',
};
const labelBase: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--color-text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em',
};
const sectionCard: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
};
const sCardHead: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};
const sCardBody: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px 24px',
};
const fw: React.CSSProperties = { gridColumn: '1 / -1' };

function Req() {
  return <span style={{ color: '#DC2626', marginLeft: '2px' }}>*</span>;
}
function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{text}</p>;
}
function STitle({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</span>;
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={labelBase}>{label}</label>
      <div style={{ ...inputDisabled, padding: '9px 12px', borderRadius: '8px', fontSize: '13px', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
        {value || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
      </div>
    </div>
  );
}

function summaryText(label: string, value: string | number | null | undefined | boolean) {
  if (value === null || value === undefined || value === '' || value === false) return null;
  if (value === true) return label;
  return `${label}: ${value}`;
}

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function buildDisplayName(form: Customer): string {
  switch (form.customerType) {
    case 'Retail Individual': {
      const parts = [form.salutation, form.firstName, form.middleName, form.lastName].filter(Boolean);
      return parts.join(' ').trim();
    }
    case 'Corporate':
    case 'Fleet':
      return (form.tradeName || form.legalName).trim();
    case 'Government':
      return form.deptLegalName.trim();
    case 'Internal':
      return form.internalEntityName.trim();
    default:
      return '';
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  form: Customer;
  onChange: (updates: Partial<Customer>) => void;
  isViewOnly: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BasicDetailsStep({ form, onChange, isViewOnly }: Props) {
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => {
    const updates: Partial<Customer> = { [k]: v };
    // Auto-generate display name when name fields change
    const nameFields: (keyof Customer)[] = [
      'salutation', 'firstName', 'middleName', 'lastName',
      'legalName', 'tradeName', 'deptLegalName', 'internalEntityName',
    ];
    if (nameFields.includes(k)) {
      const draft = { ...form, [k]: v };
      const autoName = buildDisplayName(draft as Customer);
      updates.displayName = autoName;
    }
    onChange(updates);
  };

  const inp = (_k: keyof Customer) => isViewOnly ? inputDisabled : inputBase;
  const isExternal = form.createdSource && !['Manual', 'Service Transaction', 'Sales Transaction'].includes(form.createdSource);
  const needsSourceSystem = !!(form.createdSource && ['CRM', 'API', 'Migration', 'Mobile App', 'Website', 'Bulk Upload'].includes(form.createdSource));
  const isBulkUpload = form.createdSource === 'Bulk Upload';
  const needsStatusReason = form.customerStatus === 'Inactive' || form.customerStatus === 'Blocked';
  const isIndividual = form.customerType === 'Retail Individual';
  const isBusiness   = ['Corporate', 'Fleet'].includes(form.customerType);
  const isGovt       = form.customerType === 'Government';
  const isInternal   = form.customerType === 'Internal';

  return (
    <div>
      {/* ── System Identification ─────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="System Identification"
        description="Review draft and generated identifiers in the shared supplier-style accordion section."
        summary={<MasterFormSectionSummary items={[summaryText('Draft', form.draftReferenceId), summaryText('Code', form.customerCode)]} />}
      >
        <div style={{ ...sCardBody }}>
          <ReadOnly label="Draft Reference ID" value={form.draftReferenceId} />
          <ReadOnly label="Customer Code" value={form.customerCode} />
        </div>
      </CustomerAccordionSection>

      {/* ── Status & Lifecycle ────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Status & Lifecycle"
        description="Control the current customer lifecycle state and any required reason."
        summary={<MasterFormSectionSummary items={[summaryText('Status', form.customerStatus), summaryText('Reason', form.statusChangeReason)]} />}
      >
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Customer Status <Req /></label>
            <select value={form.customerStatus} onChange={(e) => onChange({ customerStatus: e.target.value as Customer['customerStatus'] })} disabled={isViewOnly} style={inp('customerStatus')}>
              {CUSTOMER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {needsStatusReason && (
            <div>
              <label style={labelBase}>Status Change Reason <Req /></label>
              <input value={form.statusChangeReason} onChange={(e) => onChange({ statusChangeReason: e.target.value })} disabled={isViewOnly} maxLength={250} placeholder="Reason for status change" style={inp('statusChangeReason')} />
            </div>
          )}
        </div>
      </CustomerAccordionSection>

      {/* ── Customer Classification ───────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Customer Classification"
        description="Define customer type, segment, and loyalty tagging in the shared accordion pattern."
        summary={<MasterFormSectionSummary items={[summaryText('Type', form.customerType), summaryText('Primary Segment', form.primaryCustomerSegment), form.additionalTags.length > 0 ? `${form.additionalTags.length} tag(s)` : null, summaryText('Loyalty Customer', form.isLoyaltyCustomer)]} />}
      >
        <div style={sCardBody}>
          <ReadOnly label="Customer Type" value={form.customerType} />
          <div>
            <label style={labelBase}>Primary Customer Segment</label>
            <select value={form.primaryCustomerSegment} onChange={(e) => onChange({ primaryCustomerSegment: e.target.value })} disabled={isViewOnly} style={inp('primaryCustomerSegment')}>
              <option value="">— Select Segment —</option>
              {CUSTOMER_SEGMENTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={fw}>
            <label style={labelBase}>Additional Tags / Segments</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', minHeight: '42px' }}>
              {form.additionalTags.map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 600, borderRadius: '4px' }}>
                  {t}
                  {!isViewOnly && <button type="button" onClick={() => onChange({ additionalTags: form.additionalTags.filter((x) => x !== t) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 1px', lineHeight: 1 }}>×</button>}
                </span>
              ))}
              {!isViewOnly && (
                <select value="" onChange={(e) => { if (e.target.value && !form.additionalTags.includes(e.target.value)) onChange({ additionalTags: [...form.additionalTags, e.target.value] }); }} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px 0' }}>
                  <option value="">+ Add tag…</option>
                  {CUSTOMER_SEGMENTS.filter((s) => !form.additionalTags.includes(s) && s !== form.primaryCustomerSegment).map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none', paddingTop: '22px' }}>
              <input type="checkbox" checked={form.isLoyaltyCustomer} onChange={(e) => onChange({ isLoyaltyCustomer: e.target.checked })} disabled={isViewOnly} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Loyalty Customer</span>
            </label>
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── Source Tracking ───────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Source Tracking"
        description="Track how the customer was created and the originating system details."
        summary={<MasterFormSectionSummary items={[summaryText('Source', form.createdSource), summaryText('Validation', form.sourceValidationStatus), summaryText('System', form.sourceSystem), summaryText('Reference', form.sourceReferenceId), summaryText('Batch', form.bulkUploadBatchId)]} />}
      >
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Created Source <Req /></label>
            <select value={form.createdSource} onChange={(e) => onChange({ createdSource: e.target.value as Customer['createdSource'] })} disabled={isViewOnly} style={inp('createdSource')}>
              <option value="">— Select Source —</option>
              {CREATED_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Source Validation Status</label>
            <select value={form.sourceValidationStatus} onChange={(e) => onChange({ sourceValidationStatus: e.target.value as Customer['sourceValidationStatus'] })} disabled style={inputDisabled}>
              <option value="">— System managed —</option>
              {SOURCE_VALIDATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <Hint text="System managed based on source validation result." />
          </div>
          {needsSourceSystem && (
            <div>
              <label style={labelBase}>Source System {isExternal && <Req />}</label>
              <input value={form.sourceSystem} onChange={(e) => onChange({ sourceSystem: e.target.value })} disabled={isViewOnly} maxLength={100} placeholder="e.g. Salesforce CRM, DMS API" style={inp('sourceSystem')} />
            </div>
          )}
          {(needsSourceSystem || form.sourceReferenceId) && (
            <div>
              <label style={labelBase}>Source Reference ID</label>
              <input value={form.sourceReferenceId} onChange={(e) => onChange({ sourceReferenceId: e.target.value })} disabled={isViewOnly} maxLength={100} placeholder="Lead ID, API ref, migration record…" style={inp('sourceReferenceId')} />
            </div>
          )}
          {isBulkUpload && (
            <div style={fw}>
              <label style={labelBase}>Bulk Upload Batch ID</label>
              <input value={form.bulkUploadBatchId} onChange={(e) => onChange({ bulkUploadBatchId: e.target.value })} disabled={isViewOnly} maxLength={100} placeholder="System batch reference" style={inp('bulkUploadBatchId')} />
            </div>
          )}
        </div>
      </CustomerAccordionSection>

      {/* ── Ownership & Visibility ────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Ownership & Visibility"
        summary={<MasterFormSectionSummary items={[summaryText('Organisation', form.owningOrganization), summaryText('Branch', form.owningBranchDealer), summaryText('Scope', form.visibilityScope), summaryText('Shared Customer', form.isSharedCustomer)]} />}
      >
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Owning Organization</label>
            <input value={form.owningOrganization} onChange={(e) => onChange({ owningOrganization: e.target.value })} disabled={isViewOnly} maxLength={100} placeholder="Search organization…" style={inp('owningOrganization')} />
          </div>
          <div>
            <label style={labelBase}>Owning Branch / Dealer</label>
            <input value={form.owningBranchDealer} onChange={(e) => onChange({ owningBranchDealer: e.target.value })} disabled={isViewOnly} maxLength={100} placeholder="Search branch or dealer…" style={inp('owningBranchDealer')} />
          </div>
          <div>
            <label style={labelBase}>Visibility Scope</label>
            <select value={form.visibilityScope} onChange={(e) => onChange({ visibilityScope: e.target.value as Customer['visibilityScope'] })} disabled={isViewOnly} style={inp('visibilityScope')}>
              <option value="">— Select Scope —</option>
              {VISIBILITY_SCOPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isViewOnly ? 'default' : 'pointer', userSelect: 'none', paddingTop: '22px' }}>
              <input type="checkbox" checked={form.isSharedCustomer} onChange={(e) => onChange({ isSharedCustomer: e.target.checked })} disabled={isViewOnly} style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Shared Customer</span>
            </label>
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── Name (Retail Individual) ──────────────────────────────────────── */}
      {isIndividual && (
        <CustomerAccordionSection
          title="Individual Name"
          summary={<MasterFormSectionSummary items={[summaryText('Salutation', form.salutation), summaryText('Name', [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' '))]} />}
        >
          <div style={sCardBody}>
            <div>
              <label style={labelBase}>Salutation</label>
              <select value={form.salutation} onChange={(e) => set('salutation', e.target.value)} disabled={isViewOnly} style={inp('salutation')}>
                <option value="">— Select —</option>
                {SALUTATIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>First Name <Req /></label>
              <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} disabled={isViewOnly} maxLength={100} placeholder="First name" style={inp('firstName')} />
            </div>
            <div>
              <label style={labelBase}>Middle Name</label>
              <input value={form.middleName} onChange={(e) => set('middleName', e.target.value)} disabled={isViewOnly} maxLength={100} placeholder="Middle name (optional)" style={inp('middleName')} />
            </div>
            <div>
              <label style={labelBase}>Last Name</label>
              <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} disabled={isViewOnly} maxLength={100} placeholder="Last name" style={inp('lastName')} />
            </div>
          </div>
        </CustomerAccordionSection>
      )}

      {/* ── Name (Corporate / Fleet) ──────────────────────────────────────── */}
      {isBusiness && (
        <CustomerAccordionSection
          title="Business Name"
          summary={<MasterFormSectionSummary items={[summaryText('Legal Name', form.legalName), summaryText('Trade Name', form.tradeName)]} />}
        >
          <div style={sCardBody}>
            <div>
              <label style={labelBase}>Legal Name <Req /></label>
              <input value={form.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={isViewOnly} maxLength={200} placeholder="Registered legal name" style={inp('legalName')} />
            </div>
            <div>
              <label style={labelBase}>Trade Name</label>
              <input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)} disabled={isViewOnly} maxLength={200} placeholder="Brand or trade name (optional)" style={inp('tradeName')} />
            </div>
          </div>
        </CustomerAccordionSection>
      )}

      {/* ── Name (Government) ────────────────────────────────────────────── */}
      {isGovt && (
        <CustomerAccordionSection
          title="Department / Legal Name"
          summary={<MasterFormSectionSummary items={[summaryText('Department', form.deptLegalName)]} />}
        >
          <div style={sCardBody}>
            <div style={fw}>
              <label style={labelBase}>Department / Legal Name <Req /></label>
              <input value={form.deptLegalName} onChange={(e) => set('deptLegalName', e.target.value)} disabled={isViewOnly} maxLength={200} placeholder="Ministry, department, or PSU name" style={inp('deptLegalName')} />
            </div>
          </div>
        </CustomerAccordionSection>
      )}

      {/* ── Name (Internal) ──────────────────────────────────────────────── */}
      {isInternal && (
        <CustomerAccordionSection
          title="Internal Entity / Employee / Branch Name"
          summary={<MasterFormSectionSummary items={[summaryText('Entity', form.internalEntityName)]} />}
        >
          <div style={sCardBody}>
            <div style={fw}>
              <label style={labelBase}>Internal Entity Name <Req /></label>
              <input value={form.internalEntityName} onChange={(e) => set('internalEntityName', e.target.value)} disabled={isViewOnly} maxLength={200} placeholder="Employee, department, or branch name" style={inp('internalEntityName')} />
            </div>
          </div>
        </CustomerAccordionSection>
      )}

      {/* ── Display Identity ──────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Display Identity"
        summary={<MasterFormSectionSummary items={[summaryText('Display Name', form.displayName)]} />}
      >
        <div style={sCardBody}>
          <div style={fw}>
            <label style={labelBase}>Display Name <Req /></label>
            <input value={form.displayName} onChange={(e) => onChange({ displayName: e.target.value })} disabled={isViewOnly} maxLength={250} placeholder="Auto-generated from name fields; can be edited" style={inp('displayName')} />
            <Hint text="Auto-generated from name fields. Edit only if a custom display name is needed." />
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── Contact Details ───────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Contact Details"
        summary={<MasterFormSectionSummary items={[summaryText('Primary Mobile', [form.primaryMobileCountryCode, form.primaryMobileNumber].filter(Boolean).join(' ')), summaryText('Secondary Mobile', [form.secondaryMobileCountryCode, form.secondaryMobileNumber].filter(Boolean).join(' ')), summaryText('Email', form.emailId), summaryText('OTP Verified', form.otpVerified)]} />}
      >
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Primary Mobile Country Code</label>
            <select value={form.primaryMobileCountryCode} onChange={(e) => onChange({ primaryMobileCountryCode: e.target.value })} disabled={isViewOnly} style={inp('primaryMobileCountryCode')}>
              <option value="">— Select —</option>
              {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Primary Mobile Number {isIndividual && <Req />}</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input value={form.primaryMobileNumber} onChange={(e) => onChange({ primaryMobileNumber: e.target.value })} disabled={isViewOnly} maxLength={15} placeholder="10-digit mobile number" style={{ ...inp('primaryMobileNumber'), flex: 1 }} />
              {form.primaryMobileNumber && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: form.otpVerified ? '#F0FDF4' : '#FFF7ED', color: form.otpVerified ? '#15803D' : '#EA580C', whiteSpace: 'nowrap', border: '1px solid', borderColor: form.otpVerified ? '#86EFAC' : '#FED7AA', flexShrink: 0 }}>
                  {form.otpVerified ? '✓ Verified' : 'OTP Pending'}
                </span>
              )}
            </div>
          </div>
          <div>
            <label style={labelBase}>Secondary Mobile Country Code</label>
            <select value={form.secondaryMobileCountryCode} onChange={(e) => onChange({ secondaryMobileCountryCode: e.target.value })} disabled={isViewOnly} style={inp('secondaryMobileCountryCode')}>
              <option value="">— Select —</option>
              {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelBase}>Secondary Mobile Number</label>
            <input value={form.secondaryMobileNumber} onChange={(e) => onChange({ secondaryMobileNumber: e.target.value })} disabled={isViewOnly} maxLength={15} placeholder="Optional secondary number" style={inp('secondaryMobileNumber')} />
          </div>
          <div style={fw}>
            <label style={labelBase}>Email ID</label>
            <input type="email" value={form.emailId} onChange={(e) => onChange({ emailId: e.target.value })} disabled={isViewOnly} maxLength={150} placeholder="customer@example.com" style={inp('emailId')} />
          </div>
        </div>
      </CustomerAccordionSection>

      {/* ── Source of Lead ────────────────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Source of Lead / Customer"
        summary={<MasterFormSectionSummary items={[summaryText('Lead Source', form.sourceOfLead), summaryText('Other Source', form.specifyOtherSource)]} />}
      >
        <div style={sCardBody}>
          <div>
            <label style={labelBase}>Source of Lead</label>
            <select value={form.sourceOfLead} onChange={(e) => onChange({ sourceOfLead: e.target.value as Customer['sourceOfLead'] })} disabled={isViewOnly} style={inp('sourceOfLead')}>
              <option value="">— Select Source —</option>
              {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.sourceOfLead === 'Other' && (
            <div>
              <label style={labelBase}>Specify Other Source <Req /></label>
              <input value={form.specifyOtherSource} onChange={(e) => onChange({ specifyOtherSource: e.target.value })} disabled={isViewOnly} maxLength={150} placeholder="Describe the source" style={inp('specifyOtherSource')} />
            </div>
          )}
        </div>
      </CustomerAccordionSection>

      {/* ── Personal Profile (Retail Individual only) ─────────────────────── */}
      {isIndividual && (
        <CustomerAccordionSection
          title="Personal Profile"
          summary={<MasterFormSectionSummary items={[summaryText('Gender', form.gender), summaryText('DOB', form.dateOfBirth), summaryText('Age', form.age), summaryText('Nationality', form.nationality), summaryText('Language', form.preferredLanguage)]} />}
        >
          <div style={sCardBody}>
            <div>
              <label style={labelBase}>Gender</label>
              <select value={form.gender} onChange={(e) => onChange({ gender: e.target.value })} disabled={isViewOnly} style={inp('gender')}>
                <option value="">— Select —</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => {
                const newAge = calculateAge(e.target.value);
                onChange({ dateOfBirth: e.target.value, age: newAge });
              }} disabled={isViewOnly} max={new Date().toISOString().split('T')[0]} style={inp('dateOfBirth')} />
            </div>
            <div>
              <label style={labelBase}>Age</label>
              <input value={form.age !== null ? String(form.age) : ''} readOnly placeholder="Auto-calculated" style={inputDisabled} />
              <Hint text="Calculated from Date of Birth." />
            </div>
            <div>
              <label style={labelBase}>Marital Status</label>
              <select value={form.maritalStatus} onChange={(e) => onChange({ maritalStatus: e.target.value })} disabled={isViewOnly} style={inp('maritalStatus')}>
                <option value="">— Select —</option>
                {MARITAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            {form.maritalStatus === 'Married' && (
              <div>
                <label style={labelBase}>Anniversary Date</label>
                <input type="date" value={form.anniversaryDate} onChange={(e) => onChange({ anniversaryDate: e.target.value })} disabled={isViewOnly} max={new Date().toISOString().split('T')[0]} style={inp('anniversaryDate')} />
              </div>
            )}
            <div>
              <label style={labelBase}>Nationality</label>
              <select value={form.nationality} onChange={(e) => onChange({ nationality: e.target.value })} disabled={isViewOnly} style={inp('nationality')}>
                <option value="">— Select —</option>
                {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Education</label>
              <select value={form.education} onChange={(e) => onChange({ education: e.target.value })} disabled={isViewOnly} style={inp('education')}>
                <option value="">— Select —</option>
                {EDUCATION_LEVELS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Preferred Language</label>
              <select value={form.preferredLanguage} onChange={(e) => onChange({ preferredLanguage: e.target.value })} disabled={isViewOnly} style={inp('preferredLanguage')}>
                <option value="">— Select —</option>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </CustomerAccordionSection>
      )}

      {/* ── Credit Summary (read-only) ────────────────────────────────────── */}
      <CustomerAccordionSection
        title="Credit Summary"
        summary={<MasterFormSectionSummary items={[summaryText('Credit Status', form.creditStatus), summaryText('Hold Reason', form.creditHoldReason)]} />}
        actions={<span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Read-only - derived from Credit Setup</span>}
      >
        <div style={sCardHead}>
          <STitle>Credit Summary</STitle>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Read-only — derived from Credit Setup</span>
        </div>
        <div style={{ ...sCardBody, background: 'var(--color-surface-subtle)' }}>
          <div>
            <label style={labelBase}>Credit Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {form.creditStatus ? (
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: form.creditStatus === 'Active' ? '#F0FDF4' : form.creditStatus === 'Not Applicable' ? '#F8FAFC' : '#FEF2F2', color: form.creditStatus === 'Active' ? '#15803D' : form.creditStatus === 'Not Applicable' ? '#475569' : '#DC2626' }}>
                  {form.creditStatus}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not linked to Credit Setup</span>
              )}
            </div>
          </div>
          {form.creditStatus && !['Not Applicable', 'Active'].includes(form.creditStatus) && form.creditHoldReason && (
            <div>
              <label style={labelBase}>Credit Hold Reason</label>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', padding: '8px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', lineHeight: 1.5 }}>
                {form.creditHoldReason}
              </div>
            </div>
          )}
          {!form.creditStatus && (
            <div style={{ gridColumn: '1 / -1' }}>
              {CREDIT_STATUSES.length > 0 && <span style={{ display: 'none' }} />}
            </div>
          )}
        </div>
      </CustomerAccordionSection>
    </div>
  );
}
