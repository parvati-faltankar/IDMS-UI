import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BriefcaseBusiness, CircleHelp, FolderTree, Settings2, Wrench } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import {
  MasterCreateFormShell,
  MasterFormAccordionSection,
  MasterFormSectionSummary,
} from '../../../../experience/components/AdminPageShell';
import ServiceDomainHelpDrawer from '../components/ServiceDomainHelpDrawer';
import LabourMasterFormPage from './LabourMasterFormPage';
import ServiceDomainFormPage from './ServiceDomainFormPage';
import {
  getServiceCatalogueConfig,
  type ServiceCatalogueVariant,
} from '../serviceCatalogueConfig';

type ServiceLabourStatus = 'Draft' | 'Active' | 'Inactive';

type ServiceLabourFormState = {
  serviceDomainCode: string;
  serviceDomainName: string;
  serviceDomainDisplayName: string;
  serviceDomainDescription: string;
  businessOwnerDepartment: string;
  domainOwnerUserRole: string;
  scopeLevel: string;
  applicableBusinessUnit: string;
  applicableBrand: string;
  applicableLocationRegion: string;
  serviceFamilyCode: string;
  serviceFamilyName: string;
  serviceFamilyDescription: string;
  familyScopeLevel: string;
  familyApplicableBusinessUnits: string;
  familyApplicableBrandsOrOems: string;
  familyApplicableRegionsLocations: string;
  familyStatus: string;
  familyEffectiveFrom: string;
  familyEffectiveTo: string;
  itemServiceDomain: string;
  itemServiceFamily: string;
  serviceItemCode: string;
  serviceItemName: string;
  serviceItemDescription: string;
  itemScopeLevel: string;
  itemApplicableBusinessUnits: string;
  itemApplicableBrandsOrOems: string;
  itemApplicableRegionsLocations: string;
  itemAssetRequired: string;
  itemApplicableAssetCategory: string;
  itemApplicableModelGroup: string;
  standardDuration: string;
  durationUom: string;
  defaultSkillCategory: string;
  executionMode: string;
  fulfilmentMode: string;
  serviceItemStatus: string;
  serviceItemEffectiveFrom: string;
  serviceItemEffectiveTo: string;
  labourActivityCode: string;
  labourActivityName: string;
  labourRateType: string;
  standardRate: string;
  unitOfMeasure: string;
  labourRemarks: string;
  status: ServiceLabourStatus;
};

const EMPTY_FORM: ServiceLabourFormState = {
  serviceDomainCode: '',
  serviceDomainName: '',
  serviceDomainDisplayName: '',
  serviceDomainDescription: '',
  businessOwnerDepartment: '',
  domainOwnerUserRole: '',
  scopeLevel: '',
  applicableBusinessUnit: '',
  applicableBrand: '',
  applicableLocationRegion: '',
  serviceFamilyCode: '',
  serviceFamilyName: '',
  serviceFamilyDescription: '',
  familyScopeLevel: '',
  familyApplicableBusinessUnits: '',
  familyApplicableBrandsOrOems: '',
  familyApplicableRegionsLocations: '',
  familyStatus: 'Draft',
  familyEffectiveFrom: '',
  familyEffectiveTo: '',
  itemServiceDomain: '',
  itemServiceFamily: '',
  serviceItemCode: '',
  serviceItemName: '',
  serviceItemDescription: '',
  itemScopeLevel: '',
  itemApplicableBusinessUnits: '',
  itemApplicableBrandsOrOems: '',
  itemApplicableRegionsLocations: '',
  itemAssetRequired: '',
  itemApplicableAssetCategory: '',
  itemApplicableModelGroup: '',
  standardDuration: '',
  durationUom: '',
  defaultSkillCategory: '',
  executionMode: '',
  fulfilmentMode: '',
  serviceItemStatus: 'Draft',
  serviceItemEffectiveFrom: '',
  serviceItemEffectiveTo: '',
  labourActivityCode: '',
  labourActivityName: '',
  labourRateType: '',
  standardRate: '',
  unitOfMeasure: '',
  labourRemarks: '',
  status: 'Draft',
};

const SAMPLE_RECORDS: Record<string, ServiceLabourFormState> = {
  'SL-001': {
    serviceDomainCode: 'DOM-SRV-001',
    serviceDomainName: 'Workshop Mechanical Services',
    serviceDomainDisplayName: 'Workshop Mechanical Services',
    serviceDomainDescription: 'Core workshop labour domain for scheduled and breakdown jobs.',
    businessOwnerDepartment: 'After Sales Operations',
    domainOwnerUserRole: 'Service Admin',
    scopeLevel: 'Global',
    applicableBusinessUnit: 'Passenger Vehicles',
    applicableBrand: 'Tata Motors',
    applicableLocationRegion: 'West Region',
    serviceFamilyCode: 'FAM-LAB-001',
    serviceFamilyName: 'Engine Repair Labour',
    serviceFamilyDescription: 'Scheduled services based on time, mileage, or usage for workshop labour operations.',
    familyScopeLevel: 'Global',
    familyApplicableBusinessUnits: 'Passenger Vehicles',
    familyApplicableBrandsOrOems: 'Tata Motors',
    familyApplicableRegionsLocations: 'West Region',
    familyStatus: 'Active',
    familyEffectiveFrom: '2026-04-01',
    familyEffectiveTo: '2027-03-31',
    itemServiceDomain: 'After Sales Service',
    itemServiceFamily: 'Periodic Maintenance',
    serviceItemCode: 'PM-10K-PETROL',
    serviceItemName: '10,000 KM Service - Petrol',
    serviceItemDescription: 'Includes inspection, oil replacement, filter replacement, brake check, and road test.',
    itemScopeLevel: 'Global',
    itemApplicableBusinessUnits: 'Passenger Vehicles',
    itemApplicableBrandsOrOems: 'Tata Motors',
    itemApplicableRegionsLocations: 'West Region',
    itemAssetRequired: 'Yes',
    itemApplicableAssetCategory: 'Vehicle',
    itemApplicableModelGroup: 'Petrol Vehicle Models',
    standardDuration: '1.50',
    durationUom: 'Hours',
    defaultSkillCategory: 'Mechanical Technician',
    executionMode: 'In-house',
    fulfilmentMode: 'Workshop',
    serviceItemStatus: 'Active',
    serviceItemEffectiveFrom: '2026-04-01',
    serviceItemEffectiveTo: '2027-03-31',
    labourActivityCode: 'ACT-LAB-087',
    labourActivityName: 'Cylinder Head Removal & Fitment',
    labourRateType: 'Flat Rate',
    standardRate: '2450',
    unitOfMeasure: 'Hour',
    labourRemarks: 'Rate aligned with workshop standard billing policy.',
    status: 'Active',
  },
};

SAMPLE_RECORDS['SD-001'] = { ...SAMPLE_RECORDS['SL-001'] };
SAMPLE_RECORDS['SF-001'] = { ...SAMPLE_RECORDS['SL-001'] };
SAMPLE_RECORDS['LM-001'] = { ...SAMPLE_RECORDS['SL-001'] };

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

const labelBase: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: '5px',
};

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  padding: '0',
};

const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
  padding: '0',
};

const fullWidth: React.CSSProperties = { gridColumn: '1 / -1' };

const DOMAIN_OWNER_DEPARTMENTS = [
  'After Sales Operations',
  'Workshop Operations',
  'Customer Support',
  'Technical Service',
  'Dealer Development',
];

const DOMAIN_OWNER_ROLES = [
  'Service Admin',
  'Workshop Manager',
  'Regional Service Manager',
  'Dealer Operations Lead',
  'Technical Support Manager',
];

const SERVICE_DOMAIN_OPTIONS = [
  { name: 'After Sales Service', code: 'AFS' },
  { name: 'Body & Paint / Collision', code: 'BPC' },
  { name: 'Roadside Assistance', code: 'RSA' },
  { name: 'Customer Convenience', code: 'CCV' },
];

const FAMILY_SCOPE_LEVEL_OPTIONS = ['Global', 'Regional', 'Country', 'Dealer', 'Branch'];
const FAMILY_BUSINESS_UNIT_OPTIONS = [
  'Passenger Vehicles',
  'Commercial Vehicles',
  'Two-Wheeler',
  'EV Division',
];
const FAMILY_BRAND_OPTIONS = [
  'Tata Motors',
  'Tata Commercial',
  'Tata EV',
  'Toyota',
  'Lexus',
  'Honda',
  'Mercedes-Benz',
];
const FAMILY_REGION_OPTIONS = [
  'North Region',
  'South Region',
  'East Region',
  'West Region',
  'Dealer Cluster A',
  'Dealer Cluster B',
  'Branch Workshop 01',
];
const FAMILY_STATUS_OPTIONS = ['Draft', 'Active', 'Inactive', 'Retired'];
const ITEM_ASSET_REQUIRED_OPTIONS = ['Yes', 'No'];
const ITEM_ASSET_CATEGORY_OPTIONS = [
  'Vehicle',
  'EV Vehicle',
  'Commercial Vehicle',
  'Two-Wheeler',
];
const ITEM_MODEL_GROUP_OPTIONS = [
  'Petrol Vehicle Models',
  'Diesel Vehicle Models',
  'EV Models',
  'Premium SUV Models',
];
const ITEM_DURATION_UOM_OPTIONS = ['Minutes', 'Hours', 'Days'];
const ITEM_SKILL_CATEGORY_OPTIONS = [
  'Mechanical Technician',
  'AC Technician',
  'Body Painter',
  'EV Service Technician',
];
const ITEM_EXECUTION_MODE_OPTIONS = ['In-house', 'Outside', 'Mixed'];
const ITEM_FULFILMENT_MODE_OPTIONS = [
  'Workshop',
  'Doorstep',
  'Mobile Service',
  'Pickup & Drop',
  'Remote',
];

function summaryText(
  label: string,
  value: string | number | null | undefined | boolean | readonly string[],
) {
  if (value === null || value === undefined || value === '' || value === false) return null;
  if (Array.isArray(value)) return value.length ? `${label}: ${value.join(', ')}` : null;
  if (value === true) return label;
  return `${label}: ${value}`;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  options?: string[];
}) {
  return (
    <div>
      <label style={labelBase}>{label}</label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          style={{
            ...inputBase,
            background: readOnly ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            color: readOnly ? 'var(--color-text-muted)' : 'var(--color-text)',
          }}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            ...inputBase,
            background: readOnly ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            color: readOnly ? 'var(--color-text-muted)' : 'var(--color-text)',
          }}
        />
      )}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={fullWidth}>
      <label style={labelBase}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }}
      />
    </div>
  );
}

interface ServiceLabourFormPageProps {
  entryVariant?: ServiceCatalogueVariant;
}

export default function ServiceLabourFormPage({
  entryVariant = 'labour',
}: ServiceLabourFormPageProps) {
  if (entryVariant === 'labour') {
    return <LabourMasterFormPage />;
  }

  if (entryVariant === 'domain') {
    return <ServiceDomainFormPage />;
  }

  const { recordId } = useParams<{ recordId?: string }>();
  const navigate = useNavigate();
  const entryConfig = getServiceCatalogueConfig(entryVariant);
  const listPath = entryConfig.listPath;
  const initialStep = entryConfig.stepIndex;
  const isNew = !recordId;
  const existing = recordId ? SAMPLE_RECORDS[recordId] ?? null : null;
  const [form, setForm] = useState<ServiceLabourFormState>(existing ?? EMPTY_FORM);
  const [activeStep, setActiveStep] = useState(initialStep);
  const [isServiceDomainHelpOpen, setIsServiceDomainHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const pageTitle = isNew
    ? `New ${entryConfig.title}`
    : entryVariant === 'domain'
      ? form.serviceDomainName || entryConfig.title
      : entryVariant === 'family'
        ? form.serviceFamilyName || entryConfig.title
        : form.labourActivityName || entryConfig.title;
  const status = form.status;
  const statusTone = status === 'Active' ? 'active' : status === 'Inactive' ? 'neutral' : 'draft';

  const stepperSteps = [
    { id: '0', label: 'Service Domain', icon: <BriefcaseBusiness size={14} />, state: activeStep === 0 ? 'current' : activeStep > 0 ? 'complete' : 'default' },
    { id: '1', label: 'Service Family', icon: <FolderTree size={14} />, state: activeStep === 1 ? 'current' : activeStep > 1 ? 'complete' : 'default' },
    { id: '2', label: 'Service Item', icon: <Settings2 size={14} />, state: activeStep === 2 ? 'current' : activeStep > 2 ? 'complete' : 'default' },
    { id: '3', label: 'Labour Activity', icon: <Wrench size={14} />, state: activeStep === 3 ? 'current' : 'default' },
  ] as const;

  function patch<K extends keyof ServiceLabourFormState>(field: K, value: ServiceLabourFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function patchServiceDomainSelection(domainName: string) {
    const selectedDomain = SERVICE_DOMAIN_OPTIONS.find((option) => option.name === domainName);
    setForm((current) => ({
      ...current,
      serviceDomainName: domainName,
      serviceDomainCode: selectedDomain?.code ?? '',
    }));
  }

  function showToastMessage(message: string) {
    setToast({ tone: 'success', message });
    window.setTimeout(() => setToast(null), 2500);
  }

  const headerSecondaryActions = useMemo(
    () => [
      {
        label: 'Save as Draft',
        onClick: () => {
          patch('status', 'Draft');
          showToastMessage(`${entryConfig.title} draft saved.`);
        },
      },
    ],
    [entryConfig.title],
  );

  const headerPrimaryAction = activeStep === 3
    ? {
        label: isNew ? `Save ${entryConfig.title}` : 'Save Changes',
        onClick: () => {
          patch('status', 'Active');
          showToastMessage(`${entryConfig.title} saved successfully.`);
        },
      }
    : {
        label: 'Save',
        onClick: () => setActiveStep((current) => Math.min(3, current + 1)),
      };

  if (recordId && !existing) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>{entryConfig.title} record not found.</p>
          <button type="button" onClick={() => navigate(listPath)} style={{ ...inputBase, width: 'auto', marginTop: '16px', cursor: 'pointer' }}>
            Back to List
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#15803D', color: 'white', padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      <ServiceDomainHelpDrawer
        open={isServiceDomainHelpOpen}
        onClose={() => setIsServiceDomainHelpOpen(false)}
      />

      <MasterCreateFormShell
        navigationPersistenceKey={`${entryConfig.masterKey}-form-stepper`}
        title={pageTitle}
        backAction={{ label: 'Back', onClick: () => navigate(listPath) }}
        statusLabel={!isNew ? status : undefined}
        statusTone={statusTone}
        secondaryActions={headerSecondaryActions}
        primaryAction={headerPrimaryAction}
        steps={stepperSteps as unknown as Array<{ id: string; label: string; icon?: React.ReactNode; state?: string }>}
        activeStepId={String(activeStep)}
        onStepChange={(stepId) => setActiveStep(Number(stepId))}
      >
        <div style={{ padding: 0, background: 'var(--color-surface-subtle)', minHeight: '100%' }}>
          {activeStep === 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsServiceDomainHelpOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <CircleHelp size={15} />
                  <span>Why Service Domain?</span>
                </button>
              </div>
              <MasterFormAccordionSection
                title="Basic Details"
                summary={<MasterFormSectionSummary items={[summaryText('Domain Code', form.serviceDomainCode), summaryText('Domain Name', form.serviceDomainName), summaryText('Display Name', form.serviceDomainDisplayName), summaryText('Status', form.status)]} />}
              >
                <div style={{ padding: 0 }}>
                  <div style={gridTwo}>
                  <Field label="Service Domain Code" value={form.serviceDomainCode} onChange={(value) => patch('serviceDomainCode', value)} placeholder="DOM-SRV-001" />
                  <Field label="Domain Name" value={form.serviceDomainName} onChange={(value) => patch('serviceDomainName', value)} placeholder="Workshop Mechanical Services" />
                  <Field label="Display Name" value={form.serviceDomainDisplayName} onChange={(value) => patch('serviceDomainDisplayName', value)} placeholder="Workshop Mechanical Services" />
                  <Field label="Status" value={form.status} onChange={() => undefined} readOnly />
                  <TextArea label="Description" value={form.serviceDomainDescription} onChange={(value) => patch('serviceDomainDescription', value)} placeholder="Add domain description." />
                  </div>
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Business Ownership"
                summary={<MasterFormSectionSummary items={[summaryText('Department', form.businessOwnerDepartment), summaryText('Owner', form.domainOwnerUserRole)]} />}
              >
                <div style={{ padding: 0 }}>
                  <div style={gridTwo}>
                  <Field label="Business Owner Department" value={form.businessOwnerDepartment} onChange={(value) => patch('businessOwnerDepartment', value)} options={DOMAIN_OWNER_DEPARTMENTS} />
                  <Field label="Domain Owner User / Role" value={form.domainOwnerUserRole} onChange={(value) => patch('domainOwnerUserRole', value)} options={DOMAIN_OWNER_ROLES} />
                  </div>
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Scope & Applicability"
                summary={<MasterFormSectionSummary items={[summaryText('Scope', form.scopeLevel), summaryText('Business Unit', form.applicableBusinessUnit), summaryText('Brand', form.applicableBrand), summaryText('Location / Region', form.applicableLocationRegion)]} />}
              >
                <div style={{ padding: 0 }}>
                  <div style={gridTwo}>
                  <Field label="Scope Level" value={form.scopeLevel} onChange={(value) => patch('scopeLevel', value)} options={['Global', 'Dealer-Level']} />
                  <Field label="Applicable Business Units" value={form.applicableBusinessUnit} onChange={(value) => patch('applicableBusinessUnit', value)} options={['Passenger Vehicles', 'Commercial Vehicles', 'Two-Wheeler', 'EV Division']} />
                  <Field label="Applicable Brands" value={form.applicableBrand} onChange={(value) => patch('applicableBrand', value)} options={['Tata Motors', 'Tata Commercial', 'Tata EV', 'Jaguar Land Rover']} />
                  <Field label="Applicable Locations / Regions" value={form.applicableLocationRegion} onChange={(value) => patch('applicableLocationRegion', value)} options={['North Region', 'South Region', 'East Region', 'West Region']} />
                  </div>
                </div>
              </MasterFormAccordionSection>
            </>
          )}

          {activeStep === 1 && (
            <>
              <MasterFormAccordionSection
                title="Basic Details"
                summary={
                  <MasterFormSectionSummary
                    items={[
                      summaryText('Service Domain', form.serviceDomainName),
                      summaryText('Family Code', form.serviceFamilyCode),
                      summaryText('Family Name', form.serviceFamilyName),
                    ]}
                  />
                }
              >
                <div style={{ padding: 0 }}>
                  <div style={gridThree}>
                    <Field
                      label="Service Domain"
                      value={form.serviceDomainName}
                      onChange={patchServiceDomainSelection}
                      options={SERVICE_DOMAIN_OPTIONS.map((option) => option.name)}
                    />
                    <Field
                      label="Service Family Code"
                      value={form.serviceFamilyCode}
                      onChange={(value) => patch('serviceFamilyCode', value)}
                      placeholder="PM"
                    />
                    <Field
                      label="Service Family Name"
                      value={form.serviceFamilyName}
                      onChange={(value) => patch('serviceFamilyName', value)}
                      placeholder="Periodic Maintenance"
                    />
                  </div>
                  <div style={gridTwo}>
                    <TextArea
                      label="Description"
                      value={form.serviceFamilyDescription}
                      onChange={(value) => patch('serviceFamilyDescription', value)}
                      placeholder="Scheduled services based on time, mileage, or usage."
                    />
                  </div>
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Applicability & Status"
                summary={
                  <MasterFormSectionSummary
                    items={[
                      summaryText('Scope Level', form.familyScopeLevel),
                      summaryText('Business Units', form.familyApplicableBusinessUnits),
                      summaryText('Brands / OEMs', form.familyApplicableBrandsOrOems),
                      summaryText('Regions / Locations', form.familyApplicableRegionsLocations),
                      summaryText('Status', form.familyStatus),
                    ]}
                  />
                }
              >
                <div style={{ padding: 0 }}>
                  <div style={gridThree}>
                    <Field
                      label="Scope Level"
                      value={form.familyScopeLevel}
                      onChange={(value) => patch('familyScopeLevel', value)}
                      options={FAMILY_SCOPE_LEVEL_OPTIONS}
                    />
                    <Field
                      label="Applicable Business Units"
                      value={form.familyApplicableBusinessUnits}
                      onChange={(value) => patch('familyApplicableBusinessUnits', value)}
                      options={FAMILY_BUSINESS_UNIT_OPTIONS}
                    />
                    <Field
                      label="Status"
                      value={form.familyStatus}
                      onChange={(value) => patch('familyStatus', value)}
                      options={FAMILY_STATUS_OPTIONS}
                    />
                    <Field
                      label="Applicable Brands / OEMs"
                      value={form.familyApplicableBrandsOrOems}
                      onChange={(value) => patch('familyApplicableBrandsOrOems', value)}
                      options={FAMILY_BRAND_OPTIONS}
                    />
                    <Field
                      label="Applicable Regions / Locations"
                      value={form.familyApplicableRegionsLocations}
                      onChange={(value) => patch('familyApplicableRegionsLocations', value)}
                      options={FAMILY_REGION_OPTIONS}
                    />
                    <Field
                      label="Effective From"
                      value={form.familyEffectiveFrom}
                      onChange={(value) => patch('familyEffectiveFrom', value)}
                      placeholder="2026-04-01"
                    />
                    <Field
                      label="Effective To"
                      value={form.familyEffectiveTo}
                      onChange={(value) => patch('familyEffectiveTo', value)}
                      placeholder="2027-03-31"
                    />
                  </div>
                </div>
              </MasterFormAccordionSection>
            </>
          )}

          {activeStep === 2 && (
            <>
              <MasterFormAccordionSection
                title="Basic Details"
                summary={
                  <MasterFormSectionSummary
                    items={[
                      summaryText('Service Domain', form.itemServiceDomain),
                      summaryText('Service Family', form.itemServiceFamily),
                      summaryText('Item Code', form.serviceItemCode),
                      summaryText('Item Name', form.serviceItemName),
                    ]}
                  />
                }
              >
                <div style={{ padding: 0 }}>
                  <div style={gridThree}>
                    <Field
                      label="Service Domain"
                      value={form.itemServiceDomain}
                      onChange={(value) => patch('itemServiceDomain', value)}
                      options={SERVICE_DOMAIN_OPTIONS.map((option) => option.name)}
                    />
                    <Field
                      label="Service Family"
                      value={form.itemServiceFamily}
                      onChange={(value) => patch('itemServiceFamily', value)}
                      options={[
                        'Periodic Maintenance',
                        'General Repair',
                        'AC Service',
                        'Painting',
                        'Pickup & Drop',
                      ]}
                    />
                    <Field
                      label="Service Item Code"
                      value={form.serviceItemCode}
                      onChange={(value) => patch('serviceItemCode', value)}
                      placeholder="PM-10K-PETROL"
                    />
                    <Field
                      label="Service Item Name"
                      value={form.serviceItemName}
                      onChange={(value) => patch('serviceItemName', value)}
                      placeholder="10,000 KM Service - Petrol"
                    />
                  </div>
                  <div style={gridTwo}>
                    <TextArea
                      label="Description"
                      value={form.serviceItemDescription}
                      onChange={(value) => patch('serviceItemDescription', value)}
                      placeholder="Includes inspection, oil replacement, filter replacement, brake check, and road test."
                    />
                  </div>
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Applicability & Execution"
                summary={
                  <MasterFormSectionSummary
                    items={[
                      summaryText('Scope Level', form.itemScopeLevel),
                      summaryText('Business Units', form.itemApplicableBusinessUnits),
                      summaryText('Brands / OEMs', form.itemApplicableBrandsOrOems),
                      summaryText('Regions / Locations', form.itemApplicableRegionsLocations),
                      summaryText('Execution Mode', form.executionMode),
                      summaryText('Fulfilment Mode', form.fulfilmentMode),
                    ]}
                  />
                }
              >
                <div style={{ padding: 0 }}>
                  <div style={gridThree}>
                    <Field
                      label="Scope Level"
                      value={form.itemScopeLevel}
                      onChange={(value) => patch('itemScopeLevel', value)}
                      options={FAMILY_SCOPE_LEVEL_OPTIONS}
                    />
                    <Field
                      label="Applicable Business Units"
                      value={form.itemApplicableBusinessUnits}
                      onChange={(value) => patch('itemApplicableBusinessUnits', value)}
                      options={FAMILY_BUSINESS_UNIT_OPTIONS}
                    />
                    <Field
                      label="Applicable Brands / OEMs"
                      value={form.itemApplicableBrandsOrOems}
                      onChange={(value) => patch('itemApplicableBrandsOrOems', value)}
                      options={FAMILY_BRAND_OPTIONS}
                    />
                    <Field
                      label="Applicable Regions / Locations"
                      value={form.itemApplicableRegionsLocations}
                      onChange={(value) => patch('itemApplicableRegionsLocations', value)}
                      options={FAMILY_REGION_OPTIONS}
                    />
                    <Field
                      label="Asset Required"
                      value={form.itemAssetRequired}
                      onChange={(value) => patch('itemAssetRequired', value)}
                      options={ITEM_ASSET_REQUIRED_OPTIONS}
                    />
                    <Field
                      label="Applicable Asset Category"
                      value={form.itemApplicableAssetCategory}
                      onChange={(value) => patch('itemApplicableAssetCategory', value)}
                      options={ITEM_ASSET_CATEGORY_OPTIONS}
                    />
                    <Field
                      label="Applicable Model Group"
                      value={form.itemApplicableModelGroup}
                      onChange={(value) => patch('itemApplicableModelGroup', value)}
                      options={ITEM_MODEL_GROUP_OPTIONS}
                    />
                    <Field
                      label="Standard Duration"
                      value={form.standardDuration}
                      onChange={(value) => patch('standardDuration', value)}
                      placeholder="1.50"
                    />
                    <Field
                      label="Duration UOM"
                      value={form.durationUom}
                      onChange={(value) => patch('durationUom', value)}
                      options={ITEM_DURATION_UOM_OPTIONS}
                    />
                    <Field
                      label="Default Skill Category"
                      value={form.defaultSkillCategory}
                      onChange={(value) => patch('defaultSkillCategory', value)}
                      options={ITEM_SKILL_CATEGORY_OPTIONS}
                    />
                    <Field
                      label="Execution Mode"
                      value={form.executionMode}
                      onChange={(value) => patch('executionMode', value)}
                      options={ITEM_EXECUTION_MODE_OPTIONS}
                    />
                    <Field
                      label="Fulfilment Mode"
                      value={form.fulfilmentMode}
                      onChange={(value) => patch('fulfilmentMode', value)}
                      options={ITEM_FULFILMENT_MODE_OPTIONS}
                    />
                  </div>
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Status & Validity"
                summary={
                  <MasterFormSectionSummary
                    items={[
                      summaryText('Status', form.serviceItemStatus),
                      summaryText('Effective From', form.serviceItemEffectiveFrom),
                      summaryText('Effective To', form.serviceItemEffectiveTo),
                    ]}
                  />
                }
              >
                <div style={{ padding: 0 }}>
                  <div style={gridThree}>
                    <Field
                      label="Status"
                      value={form.serviceItemStatus}
                      onChange={(value) => patch('serviceItemStatus', value)}
                      options={FAMILY_STATUS_OPTIONS}
                    />
                    <Field
                      label="Effective From"
                      value={form.serviceItemEffectiveFrom}
                      onChange={(value) => patch('serviceItemEffectiveFrom', value)}
                      placeholder="2026-04-01"
                    />
                    <Field
                      label="Effective To"
                      value={form.serviceItemEffectiveTo}
                      onChange={(value) => patch('serviceItemEffectiveTo', value)}
                      placeholder="2027-03-31"
                    />
                  </div>
                </div>
              </MasterFormAccordionSection>
            </>
          )}

          {activeStep === 3 && (
            <>
              <MasterFormAccordionSection
                title="Labour Activity Identification"
                summary={<MasterFormSectionSummary items={[summaryText('Activity Code', form.labourActivityCode), summaryText('Service Item', form.serviceItemName)]} />}
              >
                <div style={gridTwo}>
                  <Field label="Labour Activity Code" value={form.labourActivityCode} onChange={(value) => patch('labourActivityCode', value)} placeholder="ACT-LAB-087" />
                  <Field label="Mapped Service Item" value={form.serviceItemName} onChange={() => undefined} readOnly />
                </div>
              </MasterFormAccordionSection>
              <MasterFormAccordionSection
                title="Labour Activity"
                summary={<MasterFormSectionSummary items={[summaryText('Activity', form.labourActivityName), summaryText('Rate Type', form.labourRateType), summaryText('Standard Rate', form.standardRate), summaryText('UOM', form.unitOfMeasure)]} />}
              >
                <div style={gridTwo}>
                  <Field label="Labour Activity Name" value={form.labourActivityName} onChange={(value) => patch('labourActivityName', value)} placeholder="Cylinder Head Removal & Fitment" />
                  <Field label="Labour Rate Type" value={form.labourRateType} onChange={(value) => patch('labourRateType', value)} placeholder="Flat Rate / Hourly" />
                  <Field label="Standard Rate" value={form.standardRate} onChange={(value) => patch('standardRate', value)} placeholder="2450" />
                  <Field label="Unit Of Measure" value={form.unitOfMeasure} onChange={(value) => patch('unitOfMeasure', value)} placeholder="Hour" />
                  <TextArea label="Remarks" value={form.labourRemarks} onChange={(value) => patch('labourRemarks', value)} placeholder="Add billing or operational remarks for this labour activity." />
                </div>
              </MasterFormAccordionSection>
            </>
          )}
        </div>
      </MasterCreateFormShell>
    </AdminShell>
  );
}
