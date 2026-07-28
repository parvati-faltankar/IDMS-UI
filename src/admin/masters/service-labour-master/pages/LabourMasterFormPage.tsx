import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BriefcaseBusiness, CalendarRange, Network, PlayCircle } from 'lucide-react';
import AppDialog from '../../../../components/app/AppDialog';
import AdminShell from '../../../AdminShell';
import {
  MasterCreateFormShell,
  MasterFormAccordionSection,
  MasterFormSectionSummary,
} from '../../../../experience/components/AdminPageShell';
import { FieldHelpPopover } from '../../../../experience/components/FieldHelpPopover';

type LabourStatus = 'Draft' | 'Active' | 'Inactive' | 'Retired';
type MatrixRuleStatus = 'Active' | 'Inactive';
type ScopeLevel = 'Global' | 'Regional' | 'Country' | 'Dealer' | 'Branch';
type DurationUom = 'Minutes' | 'Hours' | 'Days';

type LabourFormState = {
  serviceDomain: string;
  serviceFamily: string;
  labourCode: string;
  labourName: string;
  description: string;
  assetRequired: 'Yes' | 'No';
  skillCategory: string;
  skillLevel: string;
  resourceRole: string;
  executionMode: 'In-house' | 'Outside' | 'Pickup & Drop' |'Outside';
  status: LabourStatus;
  effectiveFrom: string;
  effectiveTo: string;
};

type MatrixRule = {
  id: string;
  ruleName: string;
  scopeLevel: ScopeLevel | '';
  applicableBusinessUnit: string;
  applicableBrand: string;
  applicableAssetCategory: string;
  applicableModelGroup: string;
  applicableRegionLocation: string;
  standardDuration: string;
  durationUom: DurationUom | '';
  durationSource: string;
  ruleEffectiveFrom: string;
  ruleEffectiveTo: string;
  ruleStatus: MatrixRuleStatus;
};

type MatrixRuleErrors = Partial<Record<keyof MatrixRule, string>>;
type LabourFormErrors = Partial<Record<keyof LabourFormState, string>> & { matrix?: string };

type FieldHelpKey =
  | 'serviceDomain'
  | 'serviceFamily'
  | 'labourCode'
  | 'labourName'
  | 'description'
  | 'assetRequired'
  | 'skillCategory'
  | 'skillLevel'
  | 'resourceRole'
  | 'executionMode'
  | 'ruleName'
  | 'scopeLevel'
  | 'applicableBusinessUnit'
  | 'applicableBrand'
  | 'applicableAssetCategory'
  | 'applicableModelGroup'
  | 'applicableRegionLocation'
  | 'standardDuration'
  | 'durationUom'
  | 'durationSource'
  | 'ruleEffectiveFrom'
  | 'ruleEffectiveTo'
  | 'ruleStatus'
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

const LIST_PATH = '/admin/master/labour-master';

const DOMAIN_OPTIONS = ['After Sales Service', 'Body & Paint / Collision', 'Roadside Assistance', 'Customer Convenience'];
const FAMILY_OPTIONS_BY_DOMAIN: Record<string, string[]> = {
  'After Sales Service': ['Brake Service', 'Periodic Maintenance', 'General Repair', 'AC Service'],
  'Body & Paint / Collision': ['Painting', 'Panel Repair', 'Dent Removal'],
  'Roadside Assistance': ['Emergency Support', 'Battery Support', 'Towing Support'],
  'Customer Convenience': ['Pickup & Drop', 'Doorstep Service'],
};
const ACTIVE_BRAND_OPTIONS = ['Tata Motors', 'Tata Commercial', 'Tata EV', 'Toyota', 'Lexus'];
const MODEL_GROUP_OPTIONS_BY_BRAND: Record<string, string[]> = {
  'Tata Motors': ['Hatchback Models', 'SUV Models', 'Premium SUV'],
  'Tata Commercial': ['Light Commercial', 'Heavy Commercial'],
  'Tata EV': ['EV Hatchback', 'EV SUV'],
  Toyota: ['Hatchback', 'SUV Models', 'Premium SUV'],
  Lexus: ['Premium SUV', 'Luxury Sedan'],
};

const SKILL_CATEGORY_OPTIONS = ['Mechanical Technician', 'EV Technician', 'Body Painter', 'Diagnostic Specialist'];
const SKILL_LEVEL_OPTIONS = ['Basic', 'Intermediate', 'Advanced', 'Expert'];

const EXECUTION_MODE_OPTIONS = ['In-house', 'Outside', 'Pickup & Drop'] as const;
const SCOPE_LEVEL_OPTIONS: ScopeLevel[] = ['Global', 'Regional', 'Country', 'Dealer', 'Branch'];
const BUSINESS_UNIT_OPTIONS = ['Passenger Vehicles', 'Commercial Vehicles', 'Two-Wheeler', 'EV Division'];
const ASSET_CATEGORY_OPTIONS = ['Vehicle', 'EV Vehicle', 'Commercial Vehicle', 'Equipment'];
const REGION_OPTIONS = ['All', 'North Region', 'South Region', 'East Region', 'West Region', 'Metro Branches', 'EV-certified workshops'];
const DURATION_UOM_OPTIONS: DurationUom[] = ['Minutes', 'Hours', 'Days'];
const DURATION_SOURCE_OPTIONS = ['OEM Standard', 'Company Standard', 'Dealer Defined', 'Vendor Standard', 'Estimated'];
const STATUS_OPTIONS: LabourStatus[] = ['Draft', 'Active', 'Inactive', 'Retired'];
const RULE_STATUS_OPTIONS: MatrixRuleStatus[] = ['Active', 'Inactive'];

const EMPTY_FORM: LabourFormState = {
  serviceDomain: '',
  serviceFamily: '',
  labourCode: '',
  labourName: '',
  description: '',
  assetRequired: 'Yes',
  skillCategory: '',
  skillLevel: '',
  resourceRole: '',
  executionMode: '',
  status: 'Draft',
  effectiveFrom: '',
  effectiveTo: '',
};

const EMPTY_RULE: MatrixRule = {
  id: '',
  ruleName: '',
  scopeLevel: '',
  applicableBusinessUnit: '',
  applicableBrand: '',
  applicableAssetCategory: '',
  applicableModelGroup: '',
  applicableRegionLocation: '',
  standardDuration: '',
  durationUom: '',
  durationSource: '',
  ruleEffectiveFrom: '',
  ruleEffectiveTo: '',
  ruleStatus: 'Active',
};

const SAMPLE_RECORDS: Record<string, { form: LabourFormState; matrixRows: MatrixRule[] }> = {
  'LM-001': {
    form: {
      serviceDomain: 'After Sales Service',
      serviceFamily: 'Brake Service',
      labourCode: 'BRK-DISC-FRONT-REPL',
      labourName: 'Front Disc Plate Replacement',
      description: 'Labour for replacing the front brake disc plate or rotor for workshop service cases.',
      assetRequired: 'Yes',
      skillCategory: 'Mechanical Technician',
      skillLevel: 'Intermediate',
      resourceRole: 'Technician',
      executionMode: 'In-house',
      status: 'Active',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
    },
    matrixRows: [
      {
        id: 'rule-1',
        ruleName: 'Toyota Hatchback - All India',
        scopeLevel: 'Global',
        applicableBusinessUnit: 'Passenger Vehicles',
        applicableBrand: 'Toyota',
        applicableAssetCategory: 'Vehicle',
        applicableModelGroup: 'Hatchback',
        applicableRegionLocation: 'All',
        standardDuration: '1.00',
        durationUom: 'Hours',
        durationSource: 'OEM Standard',
        ruleEffectiveFrom: '2026-04-01',
        ruleEffectiveTo: '2027-03-31',
        ruleStatus: 'Active',
      },
    ],
  },
};

const FIELD_HELP: Record<FieldHelpKey, FieldHelpEntry> = {
  serviceDomain: {
    title: 'Service Domain',
    useCase: 'User selects the major business area, such as After Sales Service or Body & Paint.',
    purpose: 'Groups labour under the correct top-level service business.',
    impact: 'Logical impact',
    outcome: 'Correct reporting, hierarchy mapping, and filtering of Service Families.',
  },
  serviceFamily: {
    title: 'Service Family',
    useCase: 'User selects the labour group, such as Brake Service, AC Service, or Painting.',
    purpose: 'Keeps similar labour records grouped together.',
    impact: 'Logical impact',
    outcome: 'Easier search, cleaner reporting, and prevention of random labour creation.',
  },
  labourCode: {
    title: 'Labour Code',
    useCase: 'Used as the unique business code for a labour record.',
    purpose: 'Provides a stable code for search, mapping, reporting, and future integrations.',
    impact: 'Logical impact',
    outcome: 'Prevents duplicate labour records and supports clean downstream configuration.',
  },
  labourName: {
    title: 'Labour Name',
    useCase: 'User enters the business-readable labour name.',
    purpose: 'Shows the exact labour or work item to users in master, job card, estimate, or configuration screens.',
    impact: 'Logical impact',
    outcome: 'Clear user selection and avoids confusion between similar labour items.',
  },
  description: {
    title: 'Description',
    useCase: 'Explains what work is covered under this labour.',
    purpose: 'Prevents wrong usage of similar labour records.',
    impact: 'Information-only',
    outcome: 'Better clarity for users, approvers, and future maintainers.',
  },
  assetRequired: {
    title: 'Asset Required',
    useCase: 'Defines whether a vehicle, equipment, or asset is required before this labour can be used.',
    purpose: 'Prevents users from adding asset-based labour without selecting the asset.',
    impact: 'Logical impact',
    outcome: 'Correct transaction validation in estimate, job card, or work order.',
  },
  skillCategory: {
    title: 'Skill Category',
    useCase: 'Defines the type of skill generally required to perform this labour.',
    purpose: 'Supports technician and resource planning.',
    impact: 'Logical impact',
    outcome: 'Better technician allocation and skill-based filtering.',
  },
  skillLevel: {
    title: 'Skill Level',
    useCase: 'Defines the expected skill depth needed for this labour.',
    purpose: 'Helps differentiate simple work from specialist work.',
    impact: 'Logical impact',
    outcome: 'Better assignment quality and reduced wrong technician allocation.',
  },

  executionMode: {
    title: 'Execution Mode',
    useCase: 'Defines whether this labour is performed internally or by an external vendor.',
    purpose: 'Helps the system decide whether internal technician assignment or outside job handling is required.',
    impact: 'Logical impact',
    outcome: 'Correct process routing for workshop labour versus outsourced labour.',
  },
  ruleName: {
    title: 'Rule Name',
    useCase: 'Gives a friendly name to an applicability rule.',
    purpose: 'Helps users identify rules quickly when many rows exist.',
    impact: 'Information-only',
    outcome: 'Easier maintenance of complex applicability rules.',
  },
  scopeLevel: {
    title: 'Scope Level',
    useCase: 'Defines how broadly this rule applies.',
    purpose: 'Controls whether the rule is global or limited to a country, dealer, branch, or region.',
    impact: 'Logical impact',
    outcome: 'Prevents global labour duration from being incorrectly applied to local cases.',
  },
  applicableBusinessUnit: {
    title: 'Applicable Business Unit',
    useCase: 'Defines which business unit can use this rule.',
    purpose: 'Supports multi-business organizations.',
    impact: 'Logical impact',
    outcome: 'Prevents labour from being used by the wrong business unit.',
  },
  applicableBrand: {
    title: 'Applicable Brand / OEM',
    useCase: 'Defines which brand or OEM this rule applies to.',
    purpose: 'Supports multi-brand service operations.',
    impact: 'Logical impact',
    outcome: 'Ensures brand-specific labour durations are applied correctly.',
  },
  applicableAssetCategory: {
    title: 'Applicable Asset Category',
    useCase: 'Defines the asset type for which this rule applies.',
    purpose: 'Separates vehicle, EV vehicle, commercial vehicle, equipment, or other asset categories.',
    impact: 'Logical impact',
    outcome: 'Prevents wrong labour applicability across asset types.',
  },
  applicableModelGroup: {
    title: 'Applicable Model Group',
    useCase: 'Defines which model group this duration applies to.',
    purpose: 'Allows different durations for hatchback, SUV, EV, commercial vehicle, or premium models.',
    impact: 'Logical impact',
    outcome: 'Accurate labour time by model group.',
  },
  applicableRegionLocation: {
    title: 'Applicable Region / Location',
    useCase: 'Defines where this rule is valid.',
    purpose: 'Allows different labour durations or applicability by country, dealer, branch, or region.',
    impact: 'Logical impact',
    outcome: 'Correct local applicability and duration control.',
  },
  standardDuration: {
    title: 'Standard Duration',
    useCase: 'Defines expected labour time for this specific applicability rule.',
    purpose: 'Supports effort planning, job card time calculation, capacity planning, and productivity comparison.',
    impact: 'Logical impact',
    outcome: 'Accurate duration by model, brand, business unit, or location.',
  },
  durationUom: {
    title: 'Duration UOM',
    useCase: 'Defines the unit of the standard duration.',
    purpose: 'Prevents confusion between minutes, hours, and days.',
    impact: 'Logical impact',
    outcome: 'Accurate time interpretation in job card and planning.',
  },
  durationSource: {
    title: 'Duration Source',
    useCase: 'Shows where the labour duration came from.',
    purpose: 'Helps business users trust and audit the duration.',
    impact: 'Information + governance impact',
    outcome: 'Clear traceability of standard labour time.',
  },
  ruleEffectiveFrom: {
    title: 'Rule Effective From',
    useCase: 'Defines when this applicability-duration rule becomes valid.',
    purpose: 'Allows future duration changes without disturbing current records.',
    impact: 'Logical impact',
    outcome: 'Time-controlled applicability and safer rollout.',
  },
  ruleEffectiveTo: {
    title: 'Rule Effective To',
    useCase: 'Defines when this applicability-duration rule expires.',
    purpose: 'Supports temporary or retired duration rules.',
    impact: 'Logical impact',
    outcome: 'Prevents expired duration rules from being used.',
  },
  ruleStatus: {
    title: 'Rule Status',
    useCase: 'Controls whether this matrix row can be used.',
    purpose: 'Allows disabling one applicability rule without retiring the entire labour.',
    impact: 'Logical impact',
    outcome: 'Fine-grained control of applicability.',
  },
  status: {
    title: 'Status',
    useCase: 'Defines whether this Labour record can be used in transactions or configurations.',
    purpose: 'Controls lifecycle of the Labour Master.',
    impact: 'Logical impact',
    outcome: 'Prevents inactive or retired labour from being selected.',
  },
  effectiveFrom: {
    title: 'Effective From',
    useCase: 'Defines when this Labour record becomes valid.',
    purpose: 'Supports controlled rollout of new labour records.',
    impact: 'Logical impact',
    outcome: 'Prevents labour from being used before its valid start date.',
  },
  effectiveTo: {
    title: 'Effective To',
    useCase: 'Defines when this Labour record expires.',
    purpose: 'Supports retiring temporary or old labour records.',
    impact: 'Logical impact',
    outcome: 'Prevents expired labour from being used in new transactions.',
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

const mutedInputBase: React.CSSProperties = {
  ...inputBase,
  background: 'var(--color-surface-subtle)',
};

const fieldWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
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

function summaryText(label: string, value: string | null | undefined) {
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

function SelectField({
  label,
  helpKey,
  required,
  value,
  onChange,
  options,
  error,
  disabled = false,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div style={fieldWrapper}>
      <label>
        <LabelWithInfo label={label} helpKey={helpKey} required={required} />
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={disabled ? mutedInputBase : inputBase}
      >
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

function InputField({
  label,
  helpKey,
  required,
  value,
  onChange,
  placeholder,
  error,
  readOnly = false,
}: {
  label: string;
  helpKey: FieldHelpKey;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <div style={fieldWrapper}>
      <label>
        <LabelWithInfo label={label} helpKey={helpKey} required={required} />
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={readOnly ? mutedInputBase : inputBase}
      />
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
    <div style={{ ...fieldWrapper, ...fullWidth }}>
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

function createEmptyRule(): MatrixRule {
  return {
    ...EMPTY_RULE,
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

function buildDuplicateKey(rule: MatrixRule) {
  return [
    rule.scopeLevel,
    rule.applicableBusinessUnit,
    rule.applicableBrand,
    rule.applicableAssetCategory,
    rule.applicableModelGroup,
    rule.applicableRegionLocation,
  ].join('|');
}

function validateRule(
  rule: MatrixRule,
  labourForm: LabourFormState,
  existingRows: MatrixRule[],
): MatrixRuleErrors {
  const errors: MatrixRuleErrors = {};

  if (!rule.scopeLevel) errors.scopeLevel = 'Please select Scope Level.';
  if (!rule.standardDuration || Number(rule.standardDuration) <= 0) {
    errors.standardDuration = 'Standard Duration must be greater than zero.';
  }
  if (!rule.durationUom) errors.durationUom = 'Please select Duration UOM.';
  if (rule.scopeLevel && rule.scopeLevel !== 'Global' && !rule.applicableRegionLocation) {
    errors.applicableRegionLocation = 'Please select at least one applicable region/location.';
  }
  if (rule.ruleEffectiveFrom && labourForm.effectiveFrom && rule.ruleEffectiveFrom < labourForm.effectiveFrom) {
    errors.ruleEffectiveFrom = 'Rule Effective From cannot be earlier than Labour Effective From.';
  }
  if (rule.ruleEffectiveFrom && rule.ruleEffectiveTo && rule.ruleEffectiveTo <= rule.ruleEffectiveFrom) {
    errors.ruleEffectiveTo = 'Rule Effective To must be later than Rule Effective From.';
  }
  if (rule.applicableBrand && rule.applicableModelGroup) {
    const models = MODEL_GROUP_OPTIONS_BY_BRAND[rule.applicableBrand] ?? [];
    if (!models.includes(rule.applicableModelGroup)) {
      errors.applicableModelGroup = 'Selected model group does not belong to selected brand/OEM.';
    }
  }

  if (rule.ruleStatus === 'Active') {
    const duplicate = existingRows.some((row) => (
      row.id !== rule.id
      && row.ruleStatus === 'Active'
      && buildDuplicateKey(row) === buildDuplicateKey(rule)
    ));
    if (duplicate) {
      errors.ruleName = 'Duplicate applicability rule found.';
    }
  }

  return errors;
}

function validateLabourForm(
  form: LabourFormState,
  matrixRows: MatrixRule[],
  strict: boolean,
): LabourFormErrors {
  const errors: LabourFormErrors = {};

  if (!form.serviceDomain) errors.serviceDomain = 'Please select an active Service Domain.';
  if (!form.serviceFamily) errors.serviceFamily = 'Please select an active Service Family.';
  if (!form.labourCode || !/^[A-Z0-9_-]{3,40}$/.test(form.labourCode)) {
    errors.labourCode = 'Labour Code already exists or contains invalid characters.';
  }
  if (!form.labourName || form.labourName.trim().length < 3) {
    errors.labourName = 'Labour Name already exists under selected Service Family.';
  }
  if (!form.description || form.description.trim().length < 20) {
    errors.description = 'Please enter a clear description for this Labour.';
  }
  if (!form.assetRequired) errors.assetRequired = 'Please specify whether an asset is required.';
  if (!form.executionMode) errors.executionMode = 'Please select Execution Mode.';
  if (!form.status) errors.status = 'Inactive or retired Labour cannot be selected.';
  if (!form.effectiveFrom) errors.effectiveFrom = 'Effective From cannot be earlier than Service Family effective date.';
  if (form.effectiveFrom && form.effectiveTo && form.effectiveTo <= form.effectiveFrom) {
    errors.effectiveTo = 'Effective To must be later than Effective From.';
  }
  if (form.skillLevel && !form.skillCategory) {
    errors.skillLevel = 'Please select Skill Category before Skill Level.';
  }

  if (strict || form.status === 'Active') {
    const activeRows = matrixRows.filter((row) => row.ruleStatus === 'Active');
    if (activeRows.length === 0) {
      errors.matrix = 'At least one applicability-duration rule is required.';
    } else {
      const hasMissingDuration = activeRows.some((row) => !row.standardDuration || Number(row.standardDuration) <= 0 || !row.durationUom);
      const hasInvalidLocation = activeRows.some((row) => row.scopeLevel !== 'Global' && !row.applicableRegionLocation);
      const duplicateKeys = new Set<string>();
      const hasDuplicates = activeRows.some((row) => {
        const key = buildDuplicateKey(row);
        if (duplicateKeys.has(key)) return true;
        duplicateKeys.add(key);
        return false;
      });

      if (hasMissingDuration) {
        errors.matrix = 'Standard Duration is required for each active applicability rule.';
      } else if (hasInvalidLocation) {
        errors.matrix = 'Please select location details for non-global rules.';
      } else if (hasDuplicates) {
        errors.matrix = 'Duplicate applicability rule found.';
      }
    }
  }

  return errors;
}

export default function LabourMasterFormPage() {
  const { recordId } = useParams<{ recordId?: string }>();
  const navigate = useNavigate();
  const isNew = !recordId;
  const existingRecord = recordId ? SAMPLE_RECORDS[recordId] ?? null : null;

  const [form, setForm] = useState<LabourFormState>(existingRecord?.form ?? EMPTY_FORM);
  const [matrixRows, setMatrixRows] = useState<MatrixRule[]>(existingRecord?.matrixRows ?? []);
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState<LabourFormErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MatrixRule>(createEmptyRule());
  const [ruleErrors, setRuleErrors] = useState<MatrixRuleErrors>({});

  const familyOptions = FAMILY_OPTIONS_BY_DOMAIN[form.serviceDomain] ?? [];
  const modelGroupOptions = MODEL_GROUP_OPTIONS_BY_BRAND[editingRule.applicableBrand] ?? [];
  const activeRuleCount = matrixRows.filter((row) => row.ruleStatus === 'Active').length;

  const stepperSteps = [
    { id: '0', label: 'Basic Details', icon: <BriefcaseBusiness size={14} />, state: activeStep === 0 ? 'current' : activeStep > 0 ? 'complete' : 'default' },
    { id: '1', label: 'Execution Defaults', icon: <PlayCircle size={14} />, state: activeStep === 1 ? 'current' : activeStep > 1 ? 'complete' : 'default' },
    { id: '2', label: 'Applicability & Duration Matrix', icon: <Network size={14} />, state: activeStep === 2 ? 'current' : activeStep > 2 ? 'complete' : 'default' },
    { id: '3', label: 'Status & Validity', icon: <CalendarRange size={14} />, state: activeStep === 3 ? 'current' : 'default' },
  ] as const;

  const pageTitle = isNew ? 'New Labour Master' : form.labourName || 'Labour Master';

  function patch<K extends keyof LabourFormState>(field: K, value: LabourFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'serviceDomain' && current.serviceDomain !== value) {
        const nextFamilyOptions = FAMILY_OPTIONS_BY_DOMAIN[String(value)] ?? [];
        if (!nextFamilyOptions.includes(current.serviceFamily)) {
          next.serviceFamily = '';
        }
      }
      if (field === 'labourCode') {
        next.labourCode = String(value).toUpperCase().replace(/\s+/g, '');
      }
      return next;
    });
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function openAddRule() {
    setEditingRule(createEmptyRule());
    setRuleErrors({});
    setRuleDialogOpen(true);
  }

  function openEditRule(rule: MatrixRule) {
    setEditingRule({ ...rule });
    setRuleErrors({});
    setRuleDialogOpen(true);
  }

  function closeRuleDialog() {
    setRuleDialogOpen(false);
    setRuleErrors({});
  }

  function saveRule() {
    const nextErrors = validateRule(editingRule, form, matrixRows);
    setRuleErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setMatrixRows((current) => {
      const exists = current.some((row) => row.id === editingRule.id);
      return exists
        ? current.map((row) => (row.id === editingRule.id ? editingRule : row))
        : [...current, editingRule];
    });
    setFormErrors((current) => ({ ...current, matrix: undefined }));
    setRuleDialogOpen(false);
  }

  function removeRule(ruleId: string) {
    setMatrixRows((current) => current.filter((row) => row.id !== ruleId));
  }

  function handleSaveDraft() {
    const nextErrors = validateLabourForm(form, matrixRows, false);
    setFormErrors(nextErrors);
    showToast('Labour master draft saved.');
  }

  function handlePrimaryAction() {
    if (activeStep < 3) {
      setActiveStep((current) => Math.min(3, current + 1));
      return;
    }

    const nextErrors = validateLabourForm(form, matrixRows, true);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    patch('status', 'Active');
    showToast('Labour master saved successfully.');
  }

  if (recordId && !existingRecord) {
    return (
      <AdminShell>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>Labour Master record not found.</p>
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
        navigationPersistenceKey="labour-master-form-stepper"
        title={pageTitle}
        backAction={{ label: 'Back', onClick: () => navigate(LIST_PATH) }}
        statusLabel={!isNew ? form.status : undefined}
        statusTone={form.status === 'Active' ? 'active' : form.status === 'Inactive' || form.status === 'Retired' ? 'inactive' : 'draft'}
        secondaryActions={[{ label: 'Save as Draft', onClick: handleSaveDraft }]}
        primaryAction={{ label: activeStep === 3 ? (isNew ? 'Save Labour Master' : 'Save Changes') : 'Save', onClick: handlePrimaryAction }}
        steps={stepperSteps as unknown as Array<{ id: string; label: string; icon?: React.ReactNode; state?: string }>}
        activeStepId={String(activeStep)}
        onStepChange={(stepId) => setActiveStep(Number(stepId))}
      >
        <div style={{ padding: 0, background: 'var(--color-surface-subtle)', minHeight: '100%' }}>
          {activeStep === 0 && (
            <>
              <MasterFormAccordionSection
                title="Basic Details"
                defaultOpen
                summary={<MasterFormSectionSummary items={[summaryText('Service Domain', form.serviceDomain), summaryText('Service Family', form.serviceFamily), summaryText('Labour Code', form.labourCode), summaryText('Labour Name', form.labourName)]} />}
              >
                <div style={gridTwo}>
                  <SelectField label="Service Domain" helpKey="serviceDomain" required value={form.serviceDomain} onChange={(value) => patch('serviceDomain', value)} options={DOMAIN_OPTIONS} error={formErrors.serviceDomain} />
                  <SelectField label="Service Family" helpKey="serviceFamily" required value={form.serviceFamily} onChange={(value) => patch('serviceFamily', value)} options={familyOptions} error={formErrors.serviceFamily} disabled={!form.serviceDomain} />
                  <InputField label="Labour Code" helpKey="labourCode" required value={form.labourCode} onChange={(value) => patch('labourCode', value)} placeholder="BRK-DISC-FRONT-REPL" error={formErrors.labourCode} />
                  <InputField label="Labour Name" helpKey="labourName" required value={form.labourName} onChange={(value) => patch('labourName', value)} placeholder="Front Disc Plate Replacement" error={formErrors.labourName} />
                  <TextAreaField label="Description" helpKey="description" required value={form.description} onChange={(value) => patch('description', value)} placeholder="Labour for replacing the front brake disc plate or rotor." error={formErrors.description} />
                </div>
              </MasterFormAccordionSection>
            </>
          )}

          {activeStep === 1 && (
            <MasterFormAccordionSection
              title="Execution Defaults"
              defaultOpen
              summary={<MasterFormSectionSummary items={[summaryText('Asset Required', form.assetRequired), summaryText('Skill Category', form.skillCategory), summaryText('Skill Level', form.skillLevel), summaryText('Execution Mode', form.executionMode)]} />}
            >
              <div style={gridTwo}>
                <SelectField label="Asset Required" helpKey="assetRequired" required value={form.assetRequired} onChange={(value) => patch('assetRequired', value as 'Yes' | 'No')} options={['Yes', 'No']} error={formErrors.assetRequired} />
                <SelectField label="Skill Category" helpKey="skillCategory" value={form.skillCategory} onChange={(value) => patch('skillCategory', value)} options={SKILL_CATEGORY_OPTIONS} error={formErrors.skillCategory} />
                <SelectField label="Skill Level" helpKey="skillLevel" value={form.skillLevel} onChange={(value) => patch('skillLevel', value)} options={SKILL_LEVEL_OPTIONS} error={formErrors.skillLevel} />
                {/* <SelectField label="Resource Role" helpKey="resourceRole" value={form.resourceRole} onChange={(value) => patch('resourceRole', value)} options={RESOURCE_ROLE_OPTIONS} error={formErrors.resourceRole} /> */}
                <SelectField label="Execution Mode" helpKey="executionMode" required value={form.executionMode} onChange={(value) => patch('executionMode', value as LabourFormState['executionMode'])} options={[...EXECUTION_MODE_OPTIONS]} error={formErrors.executionMode} />
              </div>
            </MasterFormAccordionSection>
          )}

          {activeStep === 2 && (
            <MasterFormAccordionSection
              title="Applicability & Duration Matrix"
              defaultOpen
              summary={<MasterFormSectionSummary items={[summaryText('Rules', String(matrixRows.length)), summaryText('Active Rules', String(activeRuleCount))]} />}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Applicability & Duration Matrix</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Add business, brand, model, and location-specific duration rules.
                  </div>
                </div>
                <button type="button" onClick={openAddRule} style={{ ...inputBase, width: 'auto', cursor: 'pointer', fontWeight: 600 }}>
                  Add Applicability Rule
                </button>
              </div>

              {formErrors.matrix ? (
                <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border))', background: 'color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))', color: 'var(--color-danger)', fontSize: '12px' }}>
                  {formErrors.matrix}
                </div>
              ) : null}

              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-subtle)' }}>
                      {['Rule Name', 'Scope Level', 'Business Unit', 'Brand / OEM', 'Asset Category', 'Model Group', 'Region / Location', 'Standard Duration', 'Duration UOM', 'Rule Status', 'Actions'].map((heading) => (
                        <th key={heading} style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)', textAlign: 'left', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          No applicability rules added yet.
                        </td>
                      </tr>
                    ) : (
                      matrixRows.map((row) => (
                        <tr key={row.id}>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.ruleName || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.scopeLevel || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.applicableBusinessUnit || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.applicableBrand || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.applicableAssetCategory || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.applicableModelGroup || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.applicableRegionLocation || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.standardDuration || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.durationUom || '-'}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>{row.ruleStatus}</td>
                          <td style={{ padding: '12px 10px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" onClick={() => openEditRule(row)} style={{ ...inputBase, width: 'auto', padding: '6px 12px', cursor: 'pointer' }}>Edit</button>
                              <button type="button" onClick={() => removeRule(row.id)} style={{ ...inputBase, width: 'auto', padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </MasterFormAccordionSection>
          )}

          {activeStep === 3 && (
            <MasterFormAccordionSection
              title="Status & Validity"
              defaultOpen
              summary={<MasterFormSectionSummary items={[summaryText('Status', form.status), summaryText('Effective From', form.effectiveFrom), summaryText('Effective To', form.effectiveTo)]} />}
            >
              <div style={gridThree}>
                <SelectField label="Status" helpKey="status" required value={form.status} onChange={(value) => patch('status', value as LabourStatus)} options={STATUS_OPTIONS} error={formErrors.status} />
                <InputField label="Effective From" helpKey="effectiveFrom" required value={form.effectiveFrom} onChange={(value) => patch('effectiveFrom', value)} placeholder="2026-04-01" error={formErrors.effectiveFrom} />
                <InputField label="Effective To" helpKey="effectiveTo" value={form.effectiveTo} onChange={(value) => patch('effectiveTo', value)} placeholder="2027-03-31" error={formErrors.effectiveTo} />
              </div>
            </MasterFormAccordionSection>
          )}
        </div>
      </MasterCreateFormShell>

      <AppDialog
        open={ruleDialogOpen}
        onClose={closeRuleDialog}
        title={editingRule.ruleName ? 'Edit Applicability Rule' : 'Add Applicability Rule'}
        description="Configure where this labour applies and what duration should be used."
        showCloseButton
        width={920}
        actions={(
          <>
            <button type="button" onClick={closeRuleDialog} style={{ ...inputBase, width: 'auto', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" onClick={saveRule} style={{ ...inputBase, width: 'auto', cursor: 'pointer', fontWeight: 600 }}>
              Save Rule
            </button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={gridThree}>
            <InputField label="Rule Name" helpKey="ruleName" value={editingRule.ruleName} onChange={(value) => setEditingRule((current) => ({ ...current, ruleName: value }))} placeholder="Toyota SUV - All India" error={ruleErrors.ruleName} />
            <SelectField label="Scope Level" helpKey="scopeLevel" required value={editingRule.scopeLevel} onChange={(value) => setEditingRule((current) => ({ ...current, scopeLevel: value as ScopeLevel | '' }))} options={SCOPE_LEVEL_OPTIONS} error={ruleErrors.scopeLevel} />
            <SelectField label="Applicable Business Unit" helpKey="applicableBusinessUnit" value={editingRule.applicableBusinessUnit} onChange={(value) => setEditingRule((current) => ({ ...current, applicableBusinessUnit: value }))} options={BUSINESS_UNIT_OPTIONS} error={ruleErrors.applicableBusinessUnit} />
            <SelectField label="Applicable Brand / OEM" helpKey="applicableBrand" value={editingRule.applicableBrand} onChange={(value) => setEditingRule((current) => ({ ...current, applicableBrand: value, applicableModelGroup: '' }))} options={ACTIVE_BRAND_OPTIONS} error={ruleErrors.applicableBrand} />
            <SelectField label="Applicable Asset Category" helpKey="applicableAssetCategory" value={editingRule.applicableAssetCategory} onChange={(value) => setEditingRule((current) => ({ ...current, applicableAssetCategory: value }))} options={ASSET_CATEGORY_OPTIONS} error={ruleErrors.applicableAssetCategory} />
            <SelectField label="Applicable Model Group" helpKey="applicableModelGroup" value={editingRule.applicableModelGroup} onChange={(value) => setEditingRule((current) => ({ ...current, applicableModelGroup: value }))} options={modelGroupOptions} error={ruleErrors.applicableModelGroup} disabled={!editingRule.applicableBrand} />
            <SelectField label="Applicable Region / Location" helpKey="applicableRegionLocation" value={editingRule.applicableRegionLocation} onChange={(value) => setEditingRule((current) => ({ ...current, applicableRegionLocation: value }))} options={REGION_OPTIONS} error={ruleErrors.applicableRegionLocation} />
            <InputField label="Standard Duration" helpKey="standardDuration" required value={editingRule.standardDuration} onChange={(value) => setEditingRule((current) => ({ ...current, standardDuration: value }))} placeholder="1.20" error={ruleErrors.standardDuration} />
            <SelectField label="Duration UOM" helpKey="durationUom" required value={editingRule.durationUom} onChange={(value) => setEditingRule((current) => ({ ...current, durationUom: value as DurationUom | '' }))} options={DURATION_UOM_OPTIONS} error={ruleErrors.durationUom} />
            <SelectField label="Duration Source" helpKey="durationSource" value={editingRule.durationSource} onChange={(value) => setEditingRule((current) => ({ ...current, durationSource: value }))} options={DURATION_SOURCE_OPTIONS} error={ruleErrors.durationSource} />
            <InputField label="Rule Effective From" helpKey="ruleEffectiveFrom" value={editingRule.ruleEffectiveFrom} onChange={(value) => setEditingRule((current) => ({ ...current, ruleEffectiveFrom: value }))} placeholder="2026-04-01" error={ruleErrors.ruleEffectiveFrom} />
            <InputField label="Rule Effective To" helpKey="ruleEffectiveTo" value={editingRule.ruleEffectiveTo} onChange={(value) => setEditingRule((current) => ({ ...current, ruleEffectiveTo: value }))} placeholder="2027-03-31" error={ruleErrors.ruleEffectiveTo} />
            <SelectField label="Rule Status" helpKey="ruleStatus" required value={editingRule.ruleStatus} onChange={(value) => setEditingRule((current) => ({ ...current, ruleStatus: value as MatrixRuleStatus }))} options={RULE_STATUS_OPTIONS} error={ruleErrors.ruleStatus} />
          </div>
        </div>
      </AppDialog>
    </AdminShell>
  );
}
