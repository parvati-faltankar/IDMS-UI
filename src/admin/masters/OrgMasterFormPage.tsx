import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Paintbrush,
  Save,
  ScrollText,
  SlidersHorizontal,
} from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'organisation-master';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgFormData {
  // Company Identity
  code: string;
  companyName: string;
  legalName: string;
  shortName: string;
  status: string;
  description: string;
  // Address & Contact
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  phone: string;
  email: string;
  website: string;
  // Legal & Tax
  gstNumber: string;
  panNumber: string;
  cinNumber: string;
  taxCategory: string;
  fiscalYearStart: string;
  // Branding
  logoUrl: string;
  tagline: string;
  primaryColour: string;
  // Notes & Settings
  effectiveFrom: string;
  effectiveTo: string;
  sortOrder: string;
  externalCode: string;
  remarks: string;
}

type SectionKey = 'identity' | 'address' | 'legal' | 'branding' | 'settings';
type CompletionState = 'complete' | 'partial' | 'empty';

// ─── Section config ────────────────────────────────────────────────────────────

const SECTIONS: Array<{
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  { key: 'identity', label: 'Company Identity', icon: Building2, description: 'Core company and trading name' },
  { key: 'address', label: 'Address & Contact', icon: MapPin, description: 'Registered address and contact' },
  { key: 'legal', label: 'Legal & Tax', icon: ScrollText, description: 'Tax IDs and legal registrations' },
  { key: 'branding', label: 'Branding', icon: Paintbrush, description: 'Logo, tagline and brand colour' },
  { key: 'settings', label: 'Notes & Settings', icon: SlidersHorizontal, description: 'Validity period and remarks' },
];

const SECTION_REQUIRED: Record<SectionKey, (keyof OrgFormData)[]> = {
  identity: ['companyName', 'legalName', 'status'],
  address: ['addressLine1', 'city'],
  legal: [],
  branding: [],
  settings: [],
};

const SECTION_FIELDS: Record<SectionKey, (keyof OrgFormData)[]> = {
  identity: ['code', 'companyName', 'legalName', 'shortName', 'status', 'description'],
  address: ['addressLine1', 'addressLine2', 'city', 'state', 'country', 'pinCode', 'phone', 'email', 'website'],
  legal: ['gstNumber', 'panNumber', 'cinNumber', 'taxCategory', 'fiscalYearStart'],
  branding: ['logoUrl', 'tagline', 'primaryColour'],
  settings: ['effectiveFrom', 'effectiveTo', 'sortOrder', 'externalCode', 'remarks'],
};

function getSectionCompletion(key: SectionKey, data: OrgFormData): CompletionState {
  const required = SECTION_REQUIRED[key];
  const allFields = SECTION_FIELDS[key];
  if (required.length > 0 && required.every((f) => !!data[f])) return 'complete';
  if (allFields.some((f) => !!data[f])) return 'partial';
  return 'empty';
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrgMasterFormPage: React.FC = () => {
  const { recordId } = useParams<{ masterKey: string; recordId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const master = findMasterByKey(MASTER_KEY);
  const group = findGroupForMasterKey(MASTER_KEY);

  const isView = searchParams.get('mode') === 'view';
  const isEdit = recordId !== undefined && recordId !== 'new' && !isView;
  const isCreate = !isEdit && !isView;

  const pageTitle = isView
    ? `View ${master?.label}`
    : isEdit
      ? `Edit ${master?.label}`
      : `New ${master?.label}`;

  const [activeSection, setActiveSection] = useState<SectionKey>('identity');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<OrgFormData>({
    code: isCreate ? '' : 'ORG-001',
    companyName: isCreate ? '' : 'Tata Motors Limited',
    legalName: isCreate ? '' : 'Tata Motors Limited',
    shortName: isCreate ? '' : 'TML',
    status: 'Active',
    description: isCreate ? '' : 'Leading automotive manufacturer in India.',
    addressLine1: isCreate ? '' : 'Bombay House, 24, Homi Mody Street',
    addressLine2: isCreate ? '' : 'Fort',
    city: isCreate ? '' : 'Mumbai',
    state: isCreate ? '' : 'Maharashtra',
    country: isCreate ? '' : 'India',
    pinCode: isCreate ? '' : '400001',
    phone: isCreate ? '' : '+91 22 6665 8282',
    email: isCreate ? '' : 'info@tatamotors.com',
    website: isCreate ? '' : 'https://www.tatamotors.com',
    gstNumber: isCreate ? '' : '27AAACT2727Q1ZW',
    panNumber: isCreate ? '' : 'AAACT2727Q',
    cinNumber: isCreate ? '' : 'L28920MH1945PLC004520',
    taxCategory: isCreate ? '' : 'Regular',
    fiscalYearStart: isCreate ? '' : 'April',
    logoUrl: '',
    tagline: isCreate ? '' : 'Connecting Aspirations',
    primaryColour: '#1e40af',
    effectiveFrom: isCreate ? '' : '2024-04-01',
    effectiveTo: '',
    sortOrder: isCreate ? '' : '1',
    externalCode: '',
    remarks: '',
  });

  const updateField = (field: keyof OrgFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key,
        label: master.label,
        path: master.path,
        groupLabel: group.label,
        groupIconBg: group.iconBg,
        groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);

  const handleSave = (andNew = false, andClose = false) => {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      setShowSaveSuccess(true);
      window.setTimeout(() => setShowSaveSuccess(false), 3000);
      if (andNew) navigate(`/admin/master/${MASTER_KEY}/new`);
      else if (andClose) navigate(`/admin/master/${MASTER_KEY}`);
    }, 600);
  };

  const handleCancel = () => navigate(`/admin/master/${MASTER_KEY}`);

  if (!master || !group) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Master not found.</p>
        </div>
      </AdminShell>
    );
  }

  const GroupIcon = group.icon;
  const completedCount = SECTIONS.filter((s) => getSectionCompletion(s.key, formData) === 'complete').length;

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface-subtle)' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 24px 12px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: group.iconBg, flexShrink: 0 }}>
              <GroupIcon size={14} style={{ color: group.iconColor }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>{pageTitle}</span>
                {isDirty && (
                  <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '9999px', fontWeight: 500, background: '#FEF3C7', color: '#92400E' }}>
                    Unsaved changes
                  </span>
                )}
                {showSaveSuccess && (
                  <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '9999px', fontWeight: 500, background: '#D1FAE5', color: '#065F46' }}>
                    ✓ Saved
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                {isCreate ? `Create a new ${master.label} record` : master.description}
              </div>
            </div>

            {/* Actions */}
            {!isView && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button type="button" onClick={handleCancel} style={btnOutline}>Cancel</button>
                <button type="button" onClick={() => handleSave(false, false)} style={btnGhost}>Save Draft</button>
                {isCreate && (
                  <button type="button" onClick={() => handleSave(true, false)} style={btnGhost}>Save & New</button>
                )}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSave(false, true)}
                  style={{ ...btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                >
                  <Save size={13} />
                  {isSaving ? 'Saving…' : 'Save & Close'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left section navigator */}
          <aside style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
            {/* Section list */}
            <div style={{ flex: 1 }}>
              {SECTIONS.map((section, idx) => {
                const isActive = activeSection === section.key;
                const completion = getSectionCompletion(section.key, formData);
                const isLast = idx === SECTIONS.length - 1;
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '14px 16px 14px 14px',
                      background: isActive ? 'rgba(var(--color-primary-rgb, 59,130,246), 0.06)' : 'transparent',
                      borderWidth: '0 0 0 3px',
                      borderStyle: 'solid',
                      borderColor: `transparent transparent transparent ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                      outline: 'none',
                    }}
                  >
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                      lineHeight: 1.4,
                    }}>
                      {section.label}
                    </span>
                    {completion === 'complete'
                      ? <CheckCircle2 size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
                      : <ChevronRight size={16} style={{ flexShrink: 0, color: isActive ? 'var(--color-primary)' : 'var(--color-border)', strokeWidth: isActive ? 2.5 : 1.5 }} />
                    }
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Progress</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  {completedCount}/{SECTIONS.length}
                </span>
              </div>
              <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: '9999px',
                    width: `${(completedCount / SECTIONS.length) * 100}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Right: Section content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
            {activeSection === 'identity' && (
              <SectionPanel sectionKey="identity" title="Company Identity" description="Core company information, trading name and legal entity details." icon={Building2} formData={formData}>
                <FormGrid>
                  <Field label="Code" hint="Auto-generated if left blank">
                    <TextInput value={formData.code} onChange={(v) => updateField('code', v)} disabled={isView} placeholder="e.g. ORG-001" />
                  </Field>
                  <Field label="Company Name" required>
                    <TextInput value={formData.companyName} onChange={(v) => updateField('companyName', v)} disabled={isView} placeholder="Trading / operating name" />
                  </Field>
                  <Field label="Legal Name" required>
                    <TextInput value={formData.legalName} onChange={(v) => updateField('legalName', v)} disabled={isView} placeholder="Full registered legal name" />
                  </Field>
                  <Field label="Short Name">
                    <TextInput value={formData.shortName} onChange={(v) => updateField('shortName', v)} disabled={isView} placeholder="Abbreviation or alias" />
                  </Field>
                  <Field label="Status" required>
                    <SelectInput value={formData.status} onChange={(v) => updateField('status', v)} disabled={isView} options={['Active', 'Inactive', 'Draft']} />
                  </Field>
                  <Field label="Description" span={2}>
                    <TextareaInput value={formData.description} onChange={(v) => updateField('description', v)} disabled={isView} placeholder="Brief description of this organisation" rows={3} />
                  </Field>
                </FormGrid>
              </SectionPanel>
            )}

            {activeSection === 'address' && (
              <SectionPanel sectionKey="address" title="Address & Contact" description="Registered office address and primary contact information." icon={MapPin} formData={formData}>
                <FormGrid>
                  <Field label="Address Line 1" required span={2}>
                    <TextInput value={formData.addressLine1} onChange={(v) => updateField('addressLine1', v)} disabled={isView} placeholder="Building / Street name" />
                  </Field>
                  <Field label="Address Line 2" span={2}>
                    <TextInput value={formData.addressLine2} onChange={(v) => updateField('addressLine2', v)} disabled={isView} placeholder="Area / Locality (optional)" />
                  </Field>
                  <Field label="City" required>
                    <TextInput value={formData.city} onChange={(v) => updateField('city', v)} disabled={isView} placeholder="City" />
                  </Field>
                  <Field label="State">
                    <TextInput value={formData.state} onChange={(v) => updateField('state', v)} disabled={isView} placeholder="State / Province" />
                  </Field>
                  <Field label="Country">
                    <TextInput value={formData.country} onChange={(v) => updateField('country', v)} disabled={isView} placeholder="Country" />
                  </Field>
                  <Field label="PIN / ZIP Code">
                    <TextInput value={formData.pinCode} onChange={(v) => updateField('pinCode', v)} disabled={isView} placeholder="Postal code" />
                  </Field>
                  <Field label="Phone">
                    <TextInput value={formData.phone} onChange={(v) => updateField('phone', v)} disabled={isView} placeholder="+91 00000 00000" />
                  </Field>
                  <Field label="Email">
                    <TextInput value={formData.email} onChange={(v) => updateField('email', v)} disabled={isView} placeholder="contact@company.com" />
                  </Field>
                  <Field label="Website" span={2}>
                    <TextInput value={formData.website} onChange={(v) => updateField('website', v)} disabled={isView} placeholder="https://www.company.com" />
                  </Field>
                </FormGrid>
              </SectionPanel>
            )}

            {activeSection === 'legal' && (
              <SectionPanel sectionKey="legal" title="Legal & Tax" description="Tax identifiers, regulatory numbers and legal registration details." icon={ScrollText} formData={formData}>
                <FormGrid>
                  <Field label="GST Number">
                    <TextInput value={formData.gstNumber} onChange={(v) => updateField('gstNumber', v)} disabled={isView} placeholder="27AAAAA0000A1Z5" />
                  </Field>
                  <Field label="PAN Number">
                    <TextInput value={formData.panNumber} onChange={(v) => updateField('panNumber', v)} disabled={isView} placeholder="AAAAA0000A" />
                  </Field>
                  <Field label="CIN Number">
                    <TextInput value={formData.cinNumber} onChange={(v) => updateField('cinNumber', v)} disabled={isView} placeholder="L00000AA0000PLC000000" />
                  </Field>
                  <Field label="Tax Category">
                    <SelectInput value={formData.taxCategory} onChange={(v) => updateField('taxCategory', v)} disabled={isView} options={['Regular', 'Composition', 'Exempt', 'SEZ']} />
                  </Field>
                  <Field label="Fiscal Year Start">
                    <SelectInput value={formData.fiscalYearStart} onChange={(v) => updateField('fiscalYearStart', v)} disabled={isView} options={['April', 'January', 'July', 'October']} />
                  </Field>
                </FormGrid>
              </SectionPanel>
            )}

            {activeSection === 'branding' && (
              <SectionPanel sectionKey="branding" title="Branding" description="Visual identity — logo URL, brand tagline and primary colour." icon={Paintbrush} formData={formData}>
                <FormGrid>
                  <Field label="Logo URL" span={2}>
                    <TextInput value={formData.logoUrl} onChange={(v) => updateField('logoUrl', v)} disabled={isView} placeholder="https://cdn.company.com/logo.png" />
                  </Field>
                  <Field label="Tagline" span={2}>
                    <TextInput value={formData.tagline} onChange={(v) => updateField('tagline', v)} disabled={isView} placeholder="Your brand tagline" />
                  </Field>
                  <Field label="Primary Colour">
                    <ColourInput value={formData.primaryColour} onChange={(v) => updateField('primaryColour', v)} disabled={isView} />
                  </Field>
                </FormGrid>
                {formData.logoUrl && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={formData.logoUrl} alt="Logo preview" style={{ height: '36px', objectFit: 'contain', borderRadius: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Logo preview</span>
                  </div>
                )}
              </SectionPanel>
            )}

            {activeSection === 'settings' && (
              <SectionPanel sectionKey="settings" title="Notes & Settings" description="Operational validity period, integration codes and internal notes." icon={SlidersHorizontal} formData={formData}>
                <FormGrid>
                  <Field label="Effective From">
                    <TextInput type="date" value={formData.effectiveFrom} onChange={(v) => updateField('effectiveFrom', v)} disabled={isView} />
                  </Field>
                  <Field label="Effective To" hint="Leave blank for no end date">
                    <TextInput type="date" value={formData.effectiveTo} onChange={(v) => updateField('effectiveTo', v)} disabled={isView} />
                  </Field>
                  <Field label="Sort Order">
                    <TextInput type="number" value={formData.sortOrder} onChange={(v) => updateField('sortOrder', v)} disabled={isView} placeholder="e.g. 1" />
                  </Field>
                  <Field label="External Code">
                    <TextInput value={formData.externalCode} onChange={(v) => updateField('externalCode', v)} disabled={isView} placeholder="Integration reference code" />
                  </Field>
                  <Field label="Remarks" span={2}>
                    <TextareaInput value={formData.remarks} onChange={(v) => updateField('remarks', v)} disabled={isView} placeholder="Internal notes visible to administrators only…" rows={5} />
                  </Field>
                </FormGrid>
                {formData.effectiveTo && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                      <strong>Note:</strong> The record will automatically become inactive after the Effective To date.
                    </p>
                  </div>
                )}
              </SectionPanel>
            )}
          </main>
        </div>
      </div>
    </AdminShell>
  );
};

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '6px 14px', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.15s',
  whiteSpace: 'nowrap',
};
const btnOutline: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' };
const btnGhost: React.CSSProperties = { ...btnBase, background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' };
const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600 };
const crumbBtn: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '11px', textDecoration: 'none' };

// ─── SectionPanel ─────────────────────────────────────────────────────────────

interface SectionPanelProps {
  sectionKey: SectionKey;
  title: string;
  description: string;
  icon: React.ElementType;
  formData: OrgFormData;
  children: React.ReactNode;
}

const SectionPanel: React.FC<SectionPanelProps> = ({ sectionKey, title, formData, children }) => {
  const completion = getSectionCompletion(sectionKey, formData);
  const totalFields = SECTION_FIELDS[sectionKey].length;
  const filledFields = SECTION_FIELDS[sectionKey].filter((f) => !!formData[f]).length;

  const badge =
    completion === 'complete'
      ? { label: 'Complete', color: '#15803D', dot: '#16A34A' }
      : completion === 'partial'
      ? { label: 'In progress', color: '#1D4ED8', dot: '#3B82F6' }
      : { label: 'Not started', color: '#94A3B8', dot: '#CBD5E1' };

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Flat gray section header — Zomato style */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 20px',
        background: 'var(--color-surface-subtle)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{filledFields} / {totalFields} filled</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: badge.color }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
            {badge.label}
          </span>
        </div>
      </div>
      {/* Form body */}
      <div style={{ padding: '24px 20px' }}>
        {children}
      </div>
    </div>
  );
};

// ─── FormGrid ─────────────────────────────────────────────────────────────────

const FormGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
    {children}
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  span?: number;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, hint, span, children }) => (
  <div style={{ gridColumn: span === 2 ? 'span 2 / span 2' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '5px' }}>
      {label}
      {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</div>}
  </div>
);

// ─── Input base style ─────────────────────────────────────────────────────────

const inputBase = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '7px 11px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: disabled ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: disabled ? 'not-allowed' : undefined,
  opacity: disabled ? 0.7 : 1,
  transition: 'border-color 0.15s',
});

// ─── TextInput ────────────────────────────────────────────────────────────────

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, disabled = false, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    style={inputBase(disabled)}
  />
);

// ─── TextareaInput ────────────────────────────────────────────────────────────

interface TextareaInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
}

const TextareaInput: React.FC<TextareaInputProps> = ({ value, onChange, disabled = false, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    rows={rows}
    style={{ ...inputBase(disabled), resize: 'vertical' }}
  />
);

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: string[];
}

const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, disabled = false, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    style={{ ...inputBase(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <option value="">— Select —</option>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

// ─── ColourInput ──────────────────────────────────────────────────────────────

interface ColourInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const ColourInput: React.FC<ColourInputProps> = ({ value, onChange, disabled = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ width: '36px', height: '34px', padding: '2px 3px', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="#1e40af"
      style={inputBase(disabled)}
    />
  </div>
);

export default OrgMasterFormPage;
