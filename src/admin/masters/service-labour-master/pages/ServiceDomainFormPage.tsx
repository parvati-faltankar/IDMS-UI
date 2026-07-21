import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BriefcaseBusiness, CalendarRange } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import {
  MasterCreateFormShell,
  MasterFormAccordionSection,
  MasterFormSectionSummary,
} from '../../../../experience/components/AdminPageShell';
import { FieldHelpPopover } from '../../../../experience/components/FieldHelpPopover';
import {
  SERVICE_CATALOGUE_BUSINESS_UNIT_OPTIONS,
  SERVICE_CATALOGUE_REGION_OPTIONS,
  SERVICE_CATALOGUE_ROWS,
} from '../serviceCatalogueConfig';

type ServiceDomainStatus = 'Draft' | 'Active' | 'Inactive' | 'Retired';
type ScopeLevel = 'Global' | 'Regional' | 'Country' | 'Dealer' | 'Branch';

type ServiceDomainFormState = {
  serviceDomainCode: string;
  serviceDomainName: string;
  description: string;
  scopeLevel: ScopeLevel | '';
  applicableBusinessUnits: string;
  applicableBrands: string;
  applicableRegions: string;
  status: ServiceDomainStatus;
  effectiveFrom: string;
  effectiveTo: string;
};

type ServiceDomainFormErrors = Partial<Record<keyof ServiceDomainFormState, string>>;

type FieldHelpKey =
  | 'serviceDomainCode'
  | 'serviceDomainName'
  | 'description'
  | 'scopeLevel'
  | 'applicableBusinessUnits'
  | 'applicableBrands'
  | 'applicableRegions'
  | 'status'
  | 'effectiveFrom'
  | 'effectiveTo';

type FieldHelpEntry = {
  title: string;
  useCase: string;
  purpose: string;
  impact: string;
  outcome: string;
};

const LIST_PATH = '/admin/master/service-domain';
const ACTIVE_BRAND_OPTIONS = ['Toyota', 'Lexus', 'Honda', 'Mercedes-Benz', 'Tata Motors', 'Tata Commercial', 'Tata EV'];
const SCOPE_LEVEL_OPTIONS: ScopeLevel[] = ['Global', 'Regional', 'Country', 'Dealer', 'Branch'];
const STATUS_OPTIONS: ServiceDomainStatus[] = ['Draft', 'Active', 'Inactive', 'Retired'];

const EMPTY_FORM: ServiceDomainFormState = {
  serviceDomainCode: '',
  serviceDomainName: '',
  description: '',
  scopeLevel: '',
  applicableBusinessUnits: '',
  applicableBrands: '',
  applicableRegions: '',
  status: 'Draft',
  effectiveFrom: '',
  effectiveTo: '',
};

const SAMPLE_RECORDS: Record<string, ServiceDomainFormState> = {
  'SD-001': {
    serviceDomainCode: 'AFS',
    serviceDomainName: 'After Sales Service',
    description: 'Customer-facing maintenance and repair services after sale.',
    scopeLevel: 'Global',
    applicableBusinessUnits: 'Passenger Vehicles',
    applicableBrands: 'Tata Motors',
    applicableRegions: '',
    status: 'Active',
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
  },
  'SD-002': {
    serviceDomainCode: 'BPC',
    serviceDomainName: 'Body & Paint / Collision',
    description: 'Collision and paint operations for accident and cosmetic repair jobs.',
    scopeLevel: 'Regional',
    applicableBusinessUnits: 'Commercial Vehicles',
    applicableBrands: 'Tata Commercial',
    applicableRegions: 'North Region',
    status: 'Draft',
    effectiveFrom: '2026-05-01',
    effectiveTo: '',
  },
};

const FIELD_HELP: Record<FieldHelpKey, FieldHelpEntry> = {
  serviceDomainCode: {
    title: 'Service Domain Code',
    useCase: 'User enters a short business code for the major service area.',
    purpose: 'Provides a stable code for search, reporting, and hierarchy mapping.',
    impact: 'Logical impact',
    outcome: 'Prevents duplicate service domains and keeps downstream mapping clean.',
  },
  serviceDomainName: {
    title: 'Service Domain Name',
    useCase: 'User enters the top-level business area name, such as After Sales Service or Body & Paint.',
    purpose: 'Defines the major service business area.',
    impact: 'Logical impact',
    outcome: 'Clean hierarchy, easy navigation, and clear reporting by business area.',
  },
  description: {
    title: 'Description',
    useCase: 'User explains what belongs inside this Service Domain.',
    purpose: 'Prevents users from creating wrong Service Families under the wrong domain.',
    impact: 'Information-only',
    outcome: 'Better data quality and fewer junk domains.',
  },
  scopeLevel: {
    title: 'Scope Level',
    useCase: 'User defines whether this domain is available globally or only for selected regions, dealers, or branches.',
    purpose: 'Controls the availability of the Service Domain.',
    impact: 'Logical impact',
    outcome: 'Prevents local domains from being used globally and supports controlled rollout.',
  },
  applicableBusinessUnits: {
    title: 'Applicable Business Units',
    useCase: 'User selects which business units can use this Service Domain.',
    purpose: 'Supports companies with multiple business lines.',
    impact: 'Logical impact',
    outcome: 'Prevents a Service Domain from being used by the wrong business unit.',
  },
  applicableBrands: {
    title: 'Applicable Brands / OEMs',
    useCase: 'User selects which brands or OEMs can use this Service Domain.',
    purpose: 'Supports multi-brand service operations.',
    impact: 'Logical impact',
    outcome: 'Ensures the domain is available only for relevant brands.',
  },
  applicableRegions: {
    title: 'Applicable Regions / Locations',
    useCase: 'User selects where this Service Domain is available.',
    purpose: 'Supports regional, dealer-level, or branch-level rollout.',
    impact: 'Logical impact',
    outcome: 'Prevents domains from being used in locations where they are not allowed.',
  },
  status: {
    title: 'Status',
    useCase: 'User controls whether this Service Domain can be used.',
    purpose: 'Manages the lifecycle of the domain.',
    impact: 'Logical impact',
    outcome: 'Prevents inactive or retired domains from being used while creating Service Families.',
  },
  effectiveFrom: {
    title: 'Effective From',
    useCase: 'User defines when this Service Domain becomes valid.',
    purpose: 'Supports controlled rollout of new service business areas.',
    impact: 'Logical impact',
    outcome: 'Prevents domains from being used before their valid start date.',
  },
  effectiveTo: {
    title: 'Effective To',
    useCase: 'User defines when this Service Domain expires.',
    purpose: 'Supports retirement of old or temporary service domains.',
    impact: 'Logical impact',
    outcome: 'Prevents expired domains from being used in new Service Family creation.',
  },
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
};

const fullWidth: React.CSSProperties = { gridColumn: '1 / -1' };

function summaryText(label: string, value: string | string[] | null | undefined) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length ? `${label}: ${value.join(', ')}` : null;
  if (!value) return null;
  return `${label}: ${value}`;
}

function LabelWithInfo({
  label,
  helpKey,
  required = false,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
}) {
  const help = FIELD_HELP[helpKey];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <FieldHelpPopover
        title={help.title}
        description={`Use case: ${help.useCase}\n\nPurpose: ${help.purpose}\n\nImpact: ${help.impact}\n\nAchieves: ${help.outcome}`}
      />
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{message}</span>;
}

function InputField({
  label,
  helpKey,
  required,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label>
        <LabelWithInfo label={label} helpKey={helpKey} required={required} />
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputBase}
      />
      <FieldError message={error} />
    </div>
  );
}

function SelectField({
  label,
  helpKey,
  required,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label>
        <LabelWithInfo label={label} helpKey={helpKey} required={required} />
      </label>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputBase}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

function TextAreaField({
  label,
  helpKey,
  required,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...fullWidth }}>
      <label>
        <LabelWithInfo label={label} helpKey={helpKey} required={required} />
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }}
      />
      <FieldError message={error} />
    </div>
  );
}

function validateServiceDomainForm(
  form: ServiceDomainFormState,
  recordId?: string,
): ServiceDomainFormErrors {
  const errors: ServiceDomainFormErrors = {};

  if (!form.serviceDomainCode || !/^[A-Z0-9_-]{3,30}$/.test(form.serviceDomainCode)) {
    errors.serviceDomainCode = 'Service Domain Code already exists or contains invalid characters.';
  }

  const duplicateCode = SERVICE_CATALOGUE_ROWS.domain.some((row) => row.id !== recordId && row.code.toUpperCase() === form.serviceDomainCode.toUpperCase());
  if (duplicateCode) {
    errors.serviceDomainCode = 'Service Domain Code already exists or contains invalid characters.';
  }

  if (!form.serviceDomainName || form.serviceDomainName.trim().length < 3) {
    errors.serviceDomainName = 'Service Domain Name already exists.';
  }

  const duplicateName = SERVICE_CATALOGUE_ROWS.domain.some((row) => row.id !== recordId && row.name.toLowerCase() === form.serviceDomainName.trim().toLowerCase());
  if (duplicateName) {
    errors.serviceDomainName = 'Service Domain Name already exists.';
  }

  if (!form.description || form.description.trim().length < 20) {
    errors.description = 'Please enter a clear description for this Service Domain.';
  }

  if (!form.scopeLevel) {
    errors.scopeLevel = 'Please select Scope Level.';
  }

  if (form.scopeLevel && form.scopeLevel !== 'Global' && !form.applicableRegions) {
    errors.applicableRegions = 'Please select at least one applicable region/location.';
  }

  if (!form.status) {
    errors.status = 'Inactive or retired Service Domain cannot be used.';
  }

  if (!form.effectiveFrom) {
    errors.effectiveFrom = 'Please select Effective From date.';
  }

  if (form.effectiveFrom && form.effectiveTo && form.effectiveTo <= form.effectiveFrom) {
    errors.effectiveTo = 'Effective To must be later than Effective From.';
  }

  return errors;
}

export default function ServiceDomainFormPage() {
  const { recordId } = useParams<{ recordId?: string }>();
  const navigate = useNavigate();
  const isNew = !recordId;
  const existingRecord = recordId ? SAMPLE_RECORDS[recordId] ?? null : null;

  const [form, setForm] = useState<ServiceDomainFormState>(existingRecord ?? EMPTY_FORM);
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState<ServiceDomainFormErrors>({});
  const [toast, setToast] = useState<string | null>(null);

  const pageTitle = isNew ? 'New Service Domain' : form.serviceDomainName || 'Service Domain';
  const stepperSteps = [
    { id: '0', label: 'Basic Details', icon: <BriefcaseBusiness size={14} />, state: activeStep === 0 ? 'current' : activeStep > 0 ? 'complete' : 'default' },
    { id: '1', label: 'Applicability & Status', icon: <CalendarRange size={14} />, state: activeStep === 1 ? 'current' : 'default' },
  ] as const;

  const statusTone = form.status === 'Active'
    ? 'active'
    : form.status === 'Inactive' || form.status === 'Retired'
      ? 'inactive'
      : 'draft';

  function patch<K extends keyof ServiceDomainFormState>(field: K, value: ServiceDomainFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'serviceDomainCode') {
        next.serviceDomainCode = String(value).toUpperCase().replace(/\s+/g, '');
      }
      if (field === 'scopeLevel' && value === 'Global') {
        next.applicableRegions = '';
      }
      return next;
    });
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function handleSaveDraft() {
    const nextErrors = validateServiceDomainForm(
      {
        ...form,
        description: form.description || 'Draft description placeholder for validation bypass',
        effectiveFrom: form.effectiveFrom || 'draft',
      },
      recordId,
    );
    setFormErrors({
      serviceDomainCode: nextErrors.serviceDomainCode,
      serviceDomainName: nextErrors.serviceDomainName,
    });
    showToast('Service domain draft saved.');
  }

  function handlePrimaryAction() {
    if (activeStep === 0) {
      setActiveStep(1);
      return;
    }

    const nextErrors = validateServiceDomainForm(form, recordId);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    patch('status', 'Active');
    showToast('Service domain saved successfully.');
  }

  if (recordId && !existingRecord) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Service Domain record not found.</p>
          <button type="button" onClick={() => navigate(LIST_PATH)} style={{ ...inputBase, width: 'auto', marginTop: '16px', cursor: 'pointer' }}>
            Back to List
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {toast ? (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#15803D', color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      ) : null}

      <MasterCreateFormShell
        navigationPersistenceKey="service-domain-form-stepper"
        title={pageTitle}
        backAction={{ label: 'Back', onClick: () => navigate(LIST_PATH) }}
        statusLabel={!isNew ? form.status : undefined}
        statusTone={statusTone}
        secondaryActions={[{ label: 'Save as Draft', onClick: handleSaveDraft }]}
        primaryAction={{ label: activeStep === 1 ? (isNew ? 'Save Service Domain' : 'Save Changes') : 'Save', onClick: handlePrimaryAction }}
        steps={stepperSteps as unknown as Array<{ id: string; label: string; icon?: React.ReactNode; state?: string }>}
        activeStepId={String(activeStep)}
        onStepChange={(stepId) => setActiveStep(Number(stepId))}
      >
        <div style={{ padding: 0, background: 'var(--color-surface-subtle)', minHeight: '100%' }}>
          {activeStep === 0 && (
            <MasterFormAccordionSection
              title="Basic Details"
              defaultOpen
              summary={<MasterFormSectionSummary items={[summaryText('Code', form.serviceDomainCode), summaryText('Name', form.serviceDomainName), summaryText('Description', form.description)]} />}
            >
              <div style={gridTwo}>
                <InputField label="Service Domain Code" helpKey="serviceDomainCode" required value={form.serviceDomainCode} onChange={(value) => patch('serviceDomainCode', value)} placeholder="AFS" error={formErrors.serviceDomainCode} />
                <InputField label="Service Domain Name" helpKey="serviceDomainName" required value={form.serviceDomainName} onChange={(value) => patch('serviceDomainName', value)} placeholder="After Sales Service" error={formErrors.serviceDomainName} />
                <TextAreaField label="Description" helpKey="description" required value={form.description} onChange={(value) => patch('description', value)} placeholder="Customer-facing maintenance and repair services after sale." error={formErrors.description} />
              </div>
            </MasterFormAccordionSection>
          )}

          {activeStep === 1 && (
            <MasterFormAccordionSection
              title="Applicability & Status"
              defaultOpen
              summary={<MasterFormSectionSummary items={[summaryText('Scope Level', form.scopeLevel), summaryText('Business Units', form.applicableBusinessUnits), summaryText('Regions', form.applicableRegions), summaryText('Status', form.status)]} />}
            >
              <div style={gridThree}>
                <SelectField label="Scope Level" helpKey="scopeLevel" required value={form.scopeLevel} onChange={(value) => patch('scopeLevel', value as ScopeLevel | '')} options={SCOPE_LEVEL_OPTIONS} error={formErrors.scopeLevel} />
                <SelectField label="Status" helpKey="status" required value={form.status} onChange={(value) => patch('status', value as ServiceDomainStatus)} options={STATUS_OPTIONS} error={formErrors.status} />
                <InputField label="Effective From" helpKey="effectiveFrom" required value={form.effectiveFrom} onChange={(value) => patch('effectiveFrom', value)} placeholder="2026-04-01" error={formErrors.effectiveFrom} />
                <InputField label="Effective To" helpKey="effectiveTo" value={form.effectiveTo} onChange={(value) => patch('effectiveTo', value)} placeholder="2027-03-31" error={formErrors.effectiveTo} />
                <div style={fullWidth}>
                  <SelectField label="Applicable Business Units" helpKey="applicableBusinessUnits" value={form.applicableBusinessUnits} onChange={(value) => patch('applicableBusinessUnits', value)} options={SERVICE_CATALOGUE_BUSINESS_UNIT_OPTIONS} error={formErrors.applicableBusinessUnits} />
                </div>
                <div style={fullWidth}>
                  <SelectField label="Applicable Brands / OEMs" helpKey="applicableBrands" value={form.applicableBrands} onChange={(value) => patch('applicableBrands', value)} options={ACTIVE_BRAND_OPTIONS} error={formErrors.applicableBrands} />
                </div>
                <div style={fullWidth}>
                  <SelectField label="Applicable Regions / Locations" helpKey="applicableRegions" value={form.applicableRegions} onChange={(value) => patch('applicableRegions', value)} options={SERVICE_CATALOGUE_REGION_OPTIONS} error={formErrors.applicableRegions} />
                </div>
              </div>
            </MasterFormAccordionSection>
          )}
        </div>
      </MasterCreateFormShell>
    </AdminShell>
  );
}
