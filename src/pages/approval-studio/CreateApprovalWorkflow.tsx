import React, { useEffect, useMemo, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CopyCheck,
  GitBranch,
  Info,
  MoveDown,
  MoveUp,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import { cn } from '../../utils/classNames';
import { formatDateTime } from '../../utils/dateFormat';
import {
  type ApprovalBusinessDomain,
  type ApprovalFlowType,
  type ApprovalSetupMode,
  type ApprovalStepConfig,
  createEmptyApprovalWorkflowDraft,
  type DecisionTableRow,
  type DelegationSource,
  type DerivationRuleRow,
  type EntryCriteriaType,
  type FallbackLevelType,
  getApprovalWorkflowById,
  listApprovalWorkflows,
  type MissingApproverAction,
  publishApprovalWorkflow,
  type ReassignmentAuthority,
  type RequiredApprovalsMode,
  type ResolutionType,
  type RuleInputRow,
  saveApprovalWorkflowDraft,
  type ApprovalDataApplicabilitySettings,
  type ApprovalActionSettings,
  type ApprovalActionRow,
  type ApprovalRule,
  type ApprovalScopeLevel,
  type DecisionTableHitPolicy,
  type RuleInputDataType,
  type RuleInputNullHandling,
  type RuleInputSourceType,
  type SnapshotMode,
  type SubmissionTriggerMode,
  type ApprovalWorkflowDraft,
  type ApprovalWorkflowRecord,
  type ApprovalWorkflowType,
} from './approvalStudioData';

type ApprovalWizardMode = 'create' | 'edit' | 'view';

interface CreateApprovalWorkflowProps {
  editingWorkflowId?: string | null;
  mode?: ApprovalWizardMode;
  onBack: () => void;
  onNavigateToList: () => void;
  onNavigateToCreate: () => void;
  onNavigateToView: (workflowId: string) => void;
}

const stepDefinitions = [
  { id: 'basic', title: 'Basic Details' },
  { id: 'trigger', title: 'Trigger' },
  { id: 'approval', title: 'Approvers' },
  { id: 'rules', title: 'Rules' },
  { id: 'actions', title: 'Actions' },
  { id: 'publish', title: 'Publish' },
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const approvalFlowTypeCards: Array<{
  type: ApprovalWorkflowType;
  title: string;
  description: string;
  useCase: string;
  icon: React.ElementType;
}> = [
  {
    type: 'Sequential',
    title: 'Sequential approval',
    description: 'Approvers review one after another in a strict order.',
    useCase: 'Best for controlled multi-step approvals.',
    icon: MoveDown,
  },
  {
    type: 'Parallel',
    title: 'Parallel approval',
    description: 'Multiple approvers can review at the same time.',
    useCase: 'Best for faster cross-team approvals.',
    icon: UsersRound,
  },
  {
    type: 'Conditional',
    title: 'Conditional approval',
    description: 'Approval path changes based on rules and thresholds.',
    useCase: 'Best for amount, role, or risk-based governance.',
    icon: GitBranch,
  },
  {
    type: 'Multi-level',
    title: 'Multi-level approval',
    description: 'Layered approvals across multiple management levels.',
    useCase: 'Best for enterprise hierarchies and escalations.',
    icon: ShieldCheck,
  },
];

const moduleDocumentTypeMap: Record<ApprovalBusinessDomain, string[]> = {
  Procurement: [
    'Purchase Requisition',
    'Purchase Return Requisition',
    'Purchase Order',
    'Purchase Receipt',
    'Purchase Invoice',
    'Purchase Return',
  ],
  Sales: ['Sale Order', 'Sale Return Requisition', 'Sale Allocation Requisition', 'Sale Allocation', 'Sale Invoice', 'Sale Return', 'Delivery'],
  Inventory: ['Stock Transfer Requisition', 'Stock Transfer', 'Stock Adjustment Requisition', 'Stock Adjustment'],
  Service: ['Appointment', 'Job Card', 'Service Estimate', 'Service Invoice', 'Service Invoice Return', 'Spare Issue', 'Spare Issue Return'],
};

const scopeValueOptionsByLevel: Record<ApprovalScopeLevel, string[]> = {
  Global: [],
  Organisation: ['North Procurement Org', 'Sales Operations Org', 'Inventory Control Org', 'Service Support Org'],
  Branch: ['Pune Branch', 'Mumbai Branch', 'Delhi Branch', 'Chennai Branch'],
  Department: ['Procurement', 'Finance', 'Sales Operations', 'Inventory Planning', 'Service Desk'],
  Role: ['Branch Manager', 'Regional Manager', 'Finance Manager', 'General Manager'],
  User: ['Alex Kumar', 'Neha Sharma', 'Rohit Menon', 'Priya Nair', 'Arjun Patel'],
  Custom: ['Strategic Accounts', 'Export Orders', 'High Risk Category'],
  Region: ['North Region', 'South Region', 'East Region', 'West Region'],
  Org: ['North Procurement Org', 'Sales Operations Org', 'Inventory Control Org', 'Service Support Org'],
};

const submissionTriggerModeOptions: SubmissionTriggerMode[] = ['User Submit', 'System Event', 'API'];
const snapshotModeOptions: SnapshotMode[] = ['Snapshot', 'Live'];
const entryCriteriaTypeOptions: EntryCriteriaType[] = [
  'Condition',
  'Formula',
  'Approval Eligibility Matrix',
  'Hybrid',
];
const ruleInputDataTypeOptions: RuleInputDataType[] = ['Number', 'Text', 'Date', 'Boolean', 'Lookup'];
const ruleInputSourceTypeOptions: RuleInputSourceType[] = ['Record', 'Related', 'Related Record', 'Context', 'Constant', 'Derived'];
const ruleInputNullHandlingOptions: RuleInputNullHandling[] = ['Error', 'Zero', 'False', 'Skip', 'Use Default'];
const decisionTableHitPolicyOptions: DecisionTableHitPolicy[] = ['FIRST_MATCH', 'PRIORITY', 'ALL_MATCH', 'COLLECT'];
const availableHeaderFieldIds = [
  'documentNo',
  'documentDate',
  'requester',
  'department',
  'supplier',
  'branch',
  'priority',
  'amount',
];

const availableLineFieldIds = [
  'lineNo',
  'itemCode',
  'itemDescription',
  'uom',
  'qty',
  'rate',
  'lineAmount',
  'remarks',
];

const decisionReferenceOptions = ['DT-INV-001', 'DT-PROC-005', 'DT-SALES-003'];

const decisionOutputKeyOptions = ['approvalPath', 'requiredRole', 'escalationOwner', 'autoApproveFlag'];
const ruleOutputWhenMatchedOptions = ['Approval Required', 'Approval Not Required', 'Route to Matrix'] as const;
const noMatchHandlingOptions = ['Approval Not Required', 'Block Submission', 'Send to Manual Review'] as const;
const conditionLogicOptions = ['AND', 'OR', 'Custom Logic'] as const;
const matrixOutputColumnOptions = ['ApprovalRequired', 'RuleResult', 'ReasonCode', 'ActionSet', 'Severity'] as const;
const conditionOperatorOptions = [
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '=', label: 'Equal to' },
  { value: '!=', label: 'Not equal to' },
  { value: '<=', label: 'Less than or equal' },
  { value: '<', label: 'Less than' },
  { value: 'contains', label: 'Contains' },
  { value: 'between', label: 'Between' },
] as const;
const triggerSystemEventOptions = ['On Save', 'On Submit', 'On Status Change', 'On Amount Change', 'On Create', 'Custom Event'];
const snapshotCapturePointOptions = ['On Submit', 'On Trigger Event', 'On First Approval Step'] as const;
const relatedFieldOptions = [
  'Customer > Customer Group',
  'Supplier > Supplier Type',
  'Branch > Region',
  'Employee > Department',
  'Vehicle > Vehicle Type',
];
const quickSetupFlowTypeOptions: ApprovalFlowType[] = ['Single', 'Sequential', 'Parallel', 'Conditional'];
const detailedSetupFlowTypeOptions: ApprovalFlowType[] = [
  'Single',
  'Sequential',
  'Parallel',
  'Conditional',
];
const stageExecutionModeOptions = ['Sequential', 'Parallel', 'Any-One', 'All'] as const;
const requiredApprovalModeOptions: RequiredApprovalsMode[] = ['ALL', 'ANY', 'N-of-M'];
const resolutionTypeOptions: ResolutionType[] = [
  'Role',
  'User',
  'Queue',
  'Hierarchy',
  'Approver Routing Matrix',
  'Attribute Rule',
];
const fallbackTypeOptions: FallbackLevelType[] = ['Queue', 'Role', 'User', 'Admin'];
const missingApproverActionOptions: MissingApproverAction[] = [
  'Use Fallback Chain',
  'Block Submission',
  'Send to Admin Queue',
];
const delegationSourceOptions: DelegationSource[] = ['User Delegation', 'Role Delegation', 'System Delegation Rule'];
const reassignmentAuthorityOptions: ReassignmentAuthority[] = [
  'Current Approver',
  'Admin',
  'Policy Owner',
  'Same Role Manager',
];
const actionEventOptions = ['OnSubmit', 'StepApprove', 'StepReject', 'FinalApprove', 'FinalReject', 'Timeout', 'Recall'] as const;
const actionTypeOptions = ['Field Update', 'Notify', 'API', 'Lock', 'Unlock', 'Task', 'Script'] as const;
const recordLockPolicyOptions = ['Do Not Lock', 'Lock on Submit', 'Lock on Step Approval', 'Lock on Final Approval'] as const;
const editDuringApprovalPolicyOptions = ['No Edit', 'Allow Edit with Invalidation', 'Allow Edit without Invalidation'] as const;
const retryPolicyOptions = ['None', 'Fixed', 'Exponential'] as const;
const failureHandlingOptions = ['Reject', 'Hold Pending', 'Manual Review', 'Retry Later'] as const;
const attachmentRequiredEventOptions = ['Approve', 'Reject', 'Recall', 'Reassign'] as const;
const allowedFileTypeOptions = ['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX'] as const;
const notificationEventOptions = [
  'Submitted',
  'Assigned',
  'Approved',
  'Rejected',
  'Recalled',
  'Escalated',
  'Timed Out',
  'Failed',
  'Final Approved',
  'Final Rejected',
] as const;
const notificationRecipientOptions = [
  'Requester',
  'Current Approver',
  'Previous Approver',
  'Next Approver',
  'Policy Owner',
  'Admin',
  'Custom User',
  'Role',
  'Queue',
] as const;
const digestFrequencyOptions = ['Hourly', 'Daily', 'Weekly'] as const;
const slaUnitOptions = ['Hours', 'Days'] as const;
const slaCalendarOptions = ['Business Calendar', '24x7 Calendar'] as const;
const autoActionOnTimeoutOptions = ['None', 'Auto Approve', 'Auto Reject', 'Escalate Only'] as const;
const externalApprovalModeOptions = ['Secure Link', 'Login Required'] as const;
const otpChannelOptions = ['SMS', 'Email', 'WhatsApp'] as const;
const invalidationStrategyOptions = ['Invalidate Impacted Lines', 'Invalidate Whole Request'] as const;
const partialApprovalPolicyOptions = ['Block All', 'Allow Approved Only', 'Split Processing'] as const;
const rejectionHandlingPolicyOptions = ['Block + Edit + Resubmit', 'Block Permanently', 'Cancel'] as const;
const rejectedLineEditPolicyOptions = ['Allow Edit', 'View Only', 'Remove from Processing'] as const;
const recallAllowedUntilOptions = ['Before First Approval', 'Before Final Approval', 'Anytime Before Completion'] as const;
const cancelApprovalPermissionOptions = ['Requester', 'Policy Owner', 'Admin', 'Approver'] as const;
const notificationLanguageOptions = ['Default', 'User Preferred', 'Specific Language'] as const;
const sampleDataSourceOptions = ['Manual Entry', 'Existing Record', 'Uploaded Sample'] as const;
const validationStatusOptions = ['Not Checked', 'Passed', 'Failed'] as const;
const simulationStatusOptions = ['Not Run', 'Passed', 'Failed'] as const;
const simulationResultOptions = ['Approval Required', 'Approval Not Required', 'Manual Review', 'Error'] as const;
const activationTypeOptions = ['Activate Now', 'Schedule for Later'] as const;
const versionActionOptions = [
  'Create New Active Version',
  'Replace Existing Active Version',
  'Schedule New Version',
] as const;
const effectiveTimeZoneOptions = ['Tenant default', 'Asia/Kolkata', 'UTC'] as const;

function createActionRow(): ApprovalActionRow {
  return {
    id: `action-row-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    eventType: '',
    actionType: '',
    actionConfiguration: '',
    fieldToUpdate: '',
    updateValue: '',
    taskTemplate: '',
    apiEndpoint: '',
    scriptAction: '',
    idempotencyKeyRule: '',
    retryPolicy: '',
    retryCount: '',
    failureHandling: '',
  };
}

function toggleArrayValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function createRule(): ApprovalRule {
  return {
    id: `rule-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    field: '',
    operator: '',
    value: '',
    action: '',
  };
}

function createRuleInputRow(): RuleInputRow {
  return {
    id: `rule-input-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    inputCode: '',
    inputDisplayName: '',
    dataType: '',
    sourceType: '',
    sourceMapping: '',
    constantValue: '',
    defaultValue: '',
    nullHandling: '',
    mandatoryForEvaluation: true,
  };
}

function createDerivationRuleRow(): DerivationRuleRow {
  return {
    id: `derivation-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    derivedOutputCode: '',
    derivationExpression: '',
    derivationEvaluationOrder: '',
  };
}

function createDecisionRow(): DecisionTableRow {
  return {
    id: `decision-row-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    conditionExpression: '',
    outputValue: '',
    priority: '',
    rowEffectiveFrom: '',
    rowEffectiveTo: '',
  };
}

function createApprovalStep(): ApprovalStepConfig {
  return {
    id: `approval-step-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    stageName: '',
    stageSequence: 1,
    stageExecutionMode: '',
    stepName: '',
    stepSequence: 1,
    stepDescription: '',
    requiredApprovals: 'ALL',
    requiredApprovalCount: '',
    totalApproverCount: '',
    resolutionType: 'Role',
    role: '',
    users: [],
    queue: '',
    managerLevel: '',
    approverRoutingMatrix: '',
    attributeRuleReference: '',
    allowMultipleApprovers: false,
  };
}

function createFallbackLevel() {
  return {
    id: `fallback-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    type: 'Role' as FallbackLevelType,
    value: '',
  };
}

const DualListboxField: React.FC<{
  label: string;
  availableItems: string[];
  selectedItems: string[];
  onChange: (nextItems: string[]) => void;
  disabled?: boolean;
  helperText?: string;
  required?: boolean;
  tooltip?: React.ReactNode;
}> = ({ label, availableItems, selectedItems, onChange, disabled, helperText, required, tooltip }) => {
  const [leftSelection, setLeftSelection] = useState<string[]>([]);
  const [rightSelection, setRightSelection] = useState<string[]>([]);

  const unselectedItems = useMemo(
    () => availableItems.filter((item) => !selectedItems.includes(item)),
    [availableItems, selectedItems]
  );

  return (
    <div className="grid gap-2">
      {tooltip ? (
        <InfoLabel label={label} required={required} tooltip={tooltip} />
      ) : (
        <span className="field-label">
          {label}
          {required && <span className="field-label__required ml-1">*</span>}
        </span>
      )}
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <select
          multiple
          className="field-select min-h-36"
          value={leftSelection}
          disabled={disabled}
          onChange={(event) =>
            setLeftSelection(Array.from(event.target.selectedOptions).map((option) => option.value))
          }
        >
          {unselectedItems.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-center gap-2 md:flex-col">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={disabled || leftSelection.length === 0}
            onClick={() => {
              onChange([...selectedItems, ...leftSelection.filter((item) => !selectedItems.includes(item))]);
              setLeftSelection([]);
            }}
          >
            <ArrowRight size={12} />
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={disabled || rightSelection.length === 0}
            onClick={() => {
              onChange(selectedItems.filter((item) => !rightSelection.includes(item)));
              setRightSelection([]);
            }}
          >
            <ArrowLeft size={12} />
          </button>
        </div>
        <select
          multiple
          className="field-select min-h-36"
          value={rightSelection}
          disabled={disabled}
          onChange={(event) =>
            setRightSelection(Array.from(event.target.selectedOptions).map((option) => option.value))
          }
        >
          {selectedItems.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {helperText && <p className="field-helper">{helperText}</p>}
    </div>
  );
};

const InfoLabel: React.FC<{
  label: string;
  required?: boolean;
  tooltip: React.ReactNode;
  helper?: string;
}> = ({ label, required, tooltip, helper }) => (
  <div className="mb-2">
    <div className="flex items-center gap-1">
      <label className="field-label">
        {label}
        {required && <span className="field-label__required ml-1">*</span>}
      </label>
      <Tooltip
        title={tooltip}
        arrow
        placement="top"
        slotProps={{
          tooltip: { className: 'approval-info-tooltip' },
          arrow: { className: 'approval-info-tooltip-arrow' },
        }}
      >
        <span
          className="inline-flex h-4 w-4 cursor-help items-center justify-center text-[var(--color-brand-text)]"
          aria-label={`${label} info`}
          tabIndex={0}
        >
          <Info size={12} />
        </span>
      </Tooltip>
    </div>
    {helper && <p className="field-helper">{helper}</p>}
  </div>
);

const TooltipPointerList: React.FC<{
  items: Array<{ label: string; description: string }>;
}> = ({ items }) => (
  <div className="approval-info-tooltip__list">
    {items.map((item, index) => (
      <div
        key={item.label}
        className={cn(
          'approval-info-tooltip__item',
          index < items.length - 1 && 'approval-info-tooltip__item--bordered'
        )}
      >
        <div className="approval-info-tooltip__item-label">{item.label}</div>
        <div className="approval-info-tooltip__item-description">{item.description}</div>
      </div>
    ))}
  </div>
);

const ActionFormField: React.FC<{
  label: string;
  tooltip: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, tooltip, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <InfoLabel label={label} tooltip={tooltip} required={required} />
    {children}
  </div>
);

function mapRecordToDraft(record: ApprovalWorkflowRecord): ApprovalWorkflowDraft {
  return {
    policyCode: record.policyCode || '',
    name: record.name || '',
    description: record.description || '',
    setupMode: record.setupMode || record.approvalSection?.setupMode || 'Quick Setup',
    category: record.category,
    businessDomain: record.businessDomain || (record.category as ApprovalBusinessDomain | ''),
    entity: record.entity || '',
    documentType: record.documentType || '',
    approvalGranularity: record.approvalGranularity || '',
    scopeLevel: record.scopeLevel || 'Global',
    scopeValues: record.scopeValues || '',
    policyPriority: record.policyPriority || '1',
    ownerTeam: record.ownerTeam,
    policyOwner: record.policyOwner || '',
    tags: record.tags || [],
    priority: record.priority,
    type: record.type,
    dataApplicability: record.dataApplicability,
    approvalSection: record.approvalSection,
    approvers: record.approvers,
    rules: record.rules,
    actions: record.actions ?? createEmptyApprovalWorkflowDraft().actions,
    permissions: record.permissions,
  };
}

function updateActionSetting(
  actions: ApprovalActionSettings,
  field: keyof ApprovalActionSettings,
  value: ApprovalActionSettings[keyof ApprovalActionSettings]
): ApprovalActionSettings {
  return {
    ...actions,
    [field]: value,
  } as ApprovalActionSettings;
}

function updateDataApplicabilitySetting(
  settings: ApprovalDataApplicabilitySettings,
  field: keyof ApprovalDataApplicabilitySettings,
  value: ApprovalDataApplicabilitySettings[keyof ApprovalDataApplicabilitySettings]
): ApprovalDataApplicabilitySettings {
  return {
    ...settings,
    [field]: value,
  };
}

const CreateApprovalWorkflow: React.FC<CreateApprovalWorkflowProps> = ({
  editingWorkflowId,
  mode = 'create',
  onBack,
  onNavigateToList,
  onNavigateToCreate,
  onNavigateToView,
}) => {
  // Temporary design-phase flag: allow navigation without blocking mandatory validations.
  // Keep existing validation logic intact so we can re-enable gating later.
  const skipStepValidationForNow = true;
  const [workflowId, setWorkflowId] = useState<string | null>(editingWorkflowId ?? null);
  const [draft, setDraft] = useState<ApprovalWorkflowDraft>(() => createEmptyApprovalWorkflowDraft());
  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [savedRecord, setSavedRecord] = useState<ApprovalWorkflowRecord | null>(null);
  const [workflowNotFound, setWorkflowNotFound] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [publishValidationStatus, setPublishValidationStatus] =
    useState<(typeof validationStatusOptions)[number]>('Not Checked');
  const [publishValidationErrors, setPublishValidationErrors] = useState<string[]>([]);
  const [publishValidationWarnings, setPublishValidationWarnings] = useState<string[]>([]);
  const [activationConflictPassed, setActivationConflictPassed] = useState<boolean>(true);
  const [duplicateScopePassed, setDuplicateScopePassed] = useState<boolean>(true);
  const [simulationRequired, setSimulationRequired] = useState(false);
  const [sampleDataSource, setSampleDataSource] = useState<(typeof sampleDataSourceOptions)[number] | ''>('');
  const [sampleRecord, setSampleRecord] = useState('');
  const [sampleDataInput, setSampleDataInput] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<(typeof simulationStatusOptions)[number]>('Not Run');
  const [simulationResult, setSimulationResult] = useState<(typeof simulationResultOptions)[number] | ''>('');
  const [approverRouteSimulation, setApproverRouteSimulation] = useState('');
  const [decisionTrace, setDecisionTrace] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTimeZone, setEffectiveTimeZone] = useState<(typeof effectiveTimeZoneOptions)[number]>('Tenant default');
  const [activationType, setActivationType] = useState<(typeof activationTypeOptions)[number]>('Activate Now');
  const [changeLog, setChangeLog] = useState('');
  const [versionAction, setVersionAction] = useState<(typeof versionActionOptions)[number] | ''>('');
  const [retirePreviousVersion, setRetirePreviousVersion] = useState(true);
  const [activationNotes, setActivationNotes] = useState('');
  const [userConfirmation, setUserConfirmation] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'Draft' | 'Scheduled' | 'Active' | 'Failed'>('Draft');
  const [activationResultMessage, setActivationResultMessage] = useState('');

  const isReadOnly = mode === 'view';

  useEffect(() => {
    setCurrentStep(0);
    setSavedRecord(null);
    setBannerMessage('');
    setStepError('');
    setFieldErrors({});
    setPublishValidationStatus('Not Checked');
    setPublishValidationErrors([]);
    setPublishValidationWarnings([]);
    setActivationConflictPassed(true);
    setDuplicateScopePassed(true);
    setSimulationRequired(false);
    setSampleDataSource('');
    setSampleRecord('');
    setSampleDataInput('');
    setSimulationStatus('Not Run');
    setSimulationResult('');
    setApproverRouteSimulation('');
    setDecisionTrace('');
    setEffectiveFrom('');
    setEffectiveTimeZone('Tenant default');
    setActivationType('Activate Now');
    setChangeLog('');
    setVersionAction('');
    setRetirePreviousVersion(true);
    setActivationNotes('');
    setUserConfirmation(false);
    setPublishStatus('Draft');
    setActivationResultMessage('');

    if (!editingWorkflowId) {
      setWorkflowId(null);
      setDraft(createEmptyApprovalWorkflowDraft());
      setWorkflowNotFound(false);
      return;
    }

    const existingRecord = getApprovalWorkflowById(editingWorkflowId);
    if (!existingRecord) {
      setWorkflowNotFound(true);
      return;
    }

    setWorkflowNotFound(false);
    setWorkflowId(existingRecord.id);
    setDraft(mapRecordToDraft(existingRecord));
    setPublishStatus(existingRecord.status === 'Active' ? 'Active' : 'Draft');
  }, [editingWorkflowId]);

  useEffect(() => {
    if (!bannerMessage) {
      return;
    }
    const timer = window.setTimeout(() => setBannerMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [bannerMessage]);

  const pageTitle = useMemo(() => {
    if (mode === 'view') {
      return 'View Approval Workflow';
    }
    if (mode === 'edit') {
      return 'Edit Approval Workflow';
    }
    return 'New Approval Workflow';
  }, [mode]);

  const progressPercent = useMemo(
    () => Math.round(((currentStep + 1) / stepDefinitions.length) * 100),
    [currentStep]
  );
  const moduleDocumentOptions = useMemo(
    () => (draft.businessDomain ? moduleDocumentTypeMap[draft.businessDomain] ?? [] : []),
    [draft.businessDomain]
  );
  const scopeValueOptions = useMemo(
    () => (draft.scopeLevel ? scopeValueOptionsByLevel[draft.scopeLevel] ?? [] : []),
    [draft.scopeLevel]
  );
  const selectedScopeValues = useMemo(
    () =>
      draft.scopeValues
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [draft.scopeValues]
  );
  const existingWorkflows = useMemo(() => listApprovalWorkflows(), [workflowId, bannerMessage, savedRecord]);
  const approvalFlowTypeOptions =
    draft.approvalSection.setupMode === 'Quick Setup'
      ? quickSetupFlowTypeOptions
      : detailedSetupFlowTypeOptions;

  const approvalValidationChecklist = useMemo(() => {
    const approval = draft.approvalSection;
    const stepNames = approval.steps.map((step) => step.stepName.trim()).filter(Boolean);
    const uniqueStepNames = new Set(stepNames.map((name) => name.toLowerCase())).size === stepNames.length;
    const hasAtLeastOneStep = approval.steps.length > 0;
    const hasValidRequiredApprovals = approval.steps.every((step) => {
      if (step.requiredApprovals !== 'N-of-M') {
        return true;
      }
      const requiredCount = Number.parseInt(step.requiredApprovalCount, 10);
      const totalCount = Number.parseInt(step.totalApproverCount, 10);
      if (!Number.isFinite(requiredCount) || requiredCount <= 0) {
        return false;
      }
      if (Number.isFinite(totalCount) && totalCount > 0 && requiredCount > totalCount) {
        return false;
      }
      return true;
    });
    const hasResolutionType = approval.steps.every((step) => Boolean(step.resolutionType));
    const hasResolutionTarget = approval.steps.every((step) => {
      if (step.resolutionType === 'Role') return Boolean(step.role.trim());
      if (step.resolutionType === 'User') return step.users.length > 0;
      if (step.resolutionType === 'Queue') return Boolean(step.queue.trim());
      if (step.resolutionType === 'Hierarchy') {
        const value = Number.parseInt(step.managerLevel, 10);
        return Number.isFinite(value) && value >= 1;
      }
      if (step.resolutionType === 'Approver Routing Matrix') return Boolean(step.approverRoutingMatrix.trim());
      if (step.resolutionType === 'Attribute Rule') return Boolean(step.attributeRuleReference.trim());
      return false;
    });
    const hasFallbackChain = approval.fallbackChain.length > 0 && approval.fallbackChain.every((item) => item.value.trim());
    const hasFinalFallbackOwner = approval.missingApproverAction !== 'Use Fallback Chain' || Boolean(approval.finalFallbackOwner.trim());
    const hasMatrixValidity = approval.steps
      .filter((step) => step.resolutionType === 'Approver Routing Matrix')
      .every((step) => Boolean(step.approverRoutingMatrix.trim()));
    const hasAttributeRuleValidity = approval.steps
      .filter((step) => step.resolutionType === 'Attribute Rule')
      .every((step) => Boolean(step.attributeRuleReference.trim()));
    const hasSodValidationPass =
      !approval.segregationOfDuties ||
      approval.allowRequesterInApprovalQueue ||
      approval.steps.every(
        (step) => !step.users.some((user) => user.trim().toLowerCase() === 'requester')
      );
    const hasDelegationSource = !approval.delegationAllowed || Boolean(approval.delegationSource);
    const hasReassignmentAuthority = !approval.reassignmentAllowed || Boolean(approval.reassignmentAuthority);
    const hasBulkCount =
      !approval.bulkApprovalAllowed ||
      (Number.isFinite(Number.parseInt(approval.maxBulkApprovalCount, 10)) &&
        Number.parseInt(approval.maxBulkApprovalCount, 10) > 0 &&
        Number.parseInt(approval.maxBulkApprovalCount, 10).toString() === approval.maxBulkApprovalCount.trim());

    return [
      { id: 'flow', label: 'Approval Flow Type selected', passed: Boolean(approval.flowType) },
      { id: 'steps', label: 'At least one approval step exists', passed: hasAtLeastOneStep },
      { id: 'step-unique', label: 'Step Name is unique', passed: uniqueStepNames && stepNames.length > 0 },
      { id: 'required', label: 'Required Approvals selected', passed: approval.steps.every((step) => Boolean(step.requiredApprovals)) },
      { id: 'required-count', label: 'Required Approval Count valid, if N-of-M is selected', passed: hasValidRequiredApprovals },
      { id: 'resolution', label: 'Resolution Type selected', passed: hasResolutionType },
      {
        id: 'role',
        label: 'Role selected, if Resolution Type = Role',
        passed: approval.steps.filter((step) => step.resolutionType === 'Role').every((step) => Boolean(step.role.trim())),
      },
      {
        id: 'user',
        label: 'Active user selected, if Resolution Type = User',
        passed: approval.steps.filter((step) => step.resolutionType === 'User').every((step) => step.users.length > 0),
      },
      {
        id: 'queue',
        label: 'Queue selected, if Resolution Type = Queue',
        passed: approval.steps.filter((step) => step.resolutionType === 'Queue').every((step) => Boolean(step.queue.trim())),
      },
      {
        id: 'hierarchy',
        label: 'Manager Level valid, if Resolution Type = Hierarchy',
        passed: approval.steps
          .filter((step) => step.resolutionType === 'Hierarchy')
          .every((step) => Number.isFinite(Number.parseInt(step.managerLevel, 10)) && Number.parseInt(step.managerLevel, 10) >= 1),
      },
      {
        id: 'matrix',
        label: 'Approver Routing Matrix active and valid, if selected',
        passed: hasMatrixValidity,
      },
      {
        id: 'attribute',
        label: 'Attribute Rule active and valid, if selected',
        passed: hasAttributeRuleValidity,
      },
      {
        id: 'fallback',
        label: 'Fallback configured, if Missing Approver Action = Use Fallback Chain',
        passed: approval.missingApproverAction !== 'Use Fallback Chain' || (hasFallbackChain && hasFinalFallbackOwner),
      },
      { id: 'sod', label: 'Segregation of Duties validation passed', passed: hasSodValidationPass },
      { id: 'delegation', label: 'Delegation Source selected, if Delegation Allowed = Yes', passed: hasDelegationSource },
      { id: 'reassignment', label: 'Reassignment Authority selected, if Reassignment Allowed = Yes', passed: hasReassignmentAuthority },
      { id: 'bulk', label: 'Maximum Bulk Approval Count valid, if Bulk Approval Allowed = Yes', passed: hasBulkCount },
      { id: 'target', label: 'Related approver field selected', passed: hasResolutionTarget },
    ];
  }, [draft]);

  const triggerValidationChecklist = useMemo(() => {
    const data = draft.dataApplicability;
    const isLineOrHybrid = draft.approvalGranularity === 'Line' || draft.approvalGranularity === 'Hybrid';
    const hasValidApiKey =
      data.submissionTriggerMode !== 'API' ||
      (Boolean(data.apiTriggerKey?.trim()) && /^[A-Z0-9_-]{1,100}$/.test((data.apiTriggerKey ?? '').trim()));
    const hasHeaderFields =
      data.headerFieldsToCapture.length > 0 &&
      data.headerFieldsToCapture.every((field) => availableHeaderFieldIds.includes(field));
    const hasLineFields =
      !isLineOrHybrid ||
      (data.lineFieldsToCapture.length > 0 &&
        data.lineFieldsToCapture.every((field) => availableLineFieldIds.includes(field)));
    const hasRelatedFields =
      !data.includeRelatedFields ||
      ((data.relatedFieldsToCapture?.length ?? 0) > 0 &&
        (data.relatedFieldsToCapture ?? []).every((field) => relatedFieldOptions.includes(field)));
    const hasSnapshotCapturePoint =
      data.snapshotMode !== 'Snapshot' || Boolean(data.snapshotCapturePoint && data.snapshotCapturePoint.trim());
    const hasBaseSetup =
      Boolean(data.submissionTriggerMode) &&
      (data.submissionTriggerMode !== 'System Event' || Boolean(data.systemEvent?.trim())) &&
      hasValidApiKey &&
      Boolean(draft.approvalGranularity) &&
      hasHeaderFields &&
      hasLineFields &&
      hasRelatedFields &&
      Boolean(data.snapshotMode) &&
      hasSnapshotCapturePoint &&
      Boolean(data.entryCriteriaType);

    return [
      { id: 'submission-mode', label: 'Submission Trigger Mode selected', passed: Boolean(data.submissionTriggerMode) },
      {
        id: 'system-event',
        label: 'System Event selected, if trigger mode is System Event',
        passed: data.submissionTriggerMode !== 'System Event' || Boolean(data.systemEvent?.trim()),
      },
      {
        id: 'api-key',
        label: 'API Trigger Key entered, if trigger mode is API',
        passed: hasValidApiKey,
      },
      { id: 'granularity', label: 'Approval Granularity selected', passed: Boolean(draft.approvalGranularity) },
      { id: 'header-fields', label: 'At least one Header Field selected', passed: hasHeaderFields },
      {
        id: 'line-fields',
        label: 'Line Fields selected, if approval granularity is Line or Hybrid',
        passed: hasLineFields,
      },
      {
        id: 'related-fields',
        label: 'Related Fields selected, if Include Related Fields is enabled',
        passed: hasRelatedFields,
      },
      { id: 'snapshot-mode', label: 'Snapshot Mode selected', passed: Boolean(data.snapshotMode) },
      {
        id: 'snapshot-point',
        label: 'Snapshot Capture Point selected, if Snapshot Mode is Snapshot',
        passed: hasSnapshotCapturePoint,
      },
      { id: 'entry-criteria', label: 'Entry Criteria Type selected', passed: Boolean(data.entryCriteriaType) },
      { id: 'trigger-valid', label: 'Trigger setup is valid', passed: hasBaseSetup },
    ];
  }, [draft]);

  const ruleValidationChecklist = useMemo(() => {
    const data = draft.dataApplicability;
    const entryType = data.entryCriteriaType;
    const includesCondition = entryType === 'Condition' || entryType === 'Hybrid';
    const includesFormula = entryType === 'Formula' || entryType === 'Hybrid';
    const includesMatrix = entryType === 'Approval Eligibility Matrix' || entryType === 'Hybrid' || entryType === 'Decision Table';
    const usesMatrix = includesMatrix || Boolean(data.matrixEnabled);
    const normalizedCodes = data.ruleInputs.map((row) => row.inputCode.trim().toUpperCase()).filter(Boolean);
    const uniqueCodes = new Set(normalizedCodes).size === normalizedCodes.length && normalizedCodes.length > 0;
    const sourceMappingsValid = data.ruleInputs.every(
      (row) => row.sourceType === 'Constant' || !row.sourceType || Boolean(row.sourceMapping.trim())
    );
    const constantsValid = data.ruleInputs.every(
      (row) => row.sourceType !== 'Constant' || Boolean((row.constantValue ?? '').trim())
    );
    const nullHandlingValid = data.ruleInputs.every(
      (row) => row.nullHandling !== 'Use Default' || Boolean(row.defaultValue.trim())
    );
    const conditionRowsValid =
      !includesCondition ||
      (draft.rules.length > 0 &&
        draft.rules.every((rule) => rule.field.trim() && rule.operator.trim() && rule.value.trim() && rule.action.trim()));
    const matrixRowsValid =
      !usesMatrix ||
      (data.decisionRows.length > 0 &&
        data.decisionRows.every((row) => Boolean(row.conditionExpression.trim()) && Boolean(row.outputValue.trim())));
    const rowPriorityValid =
      !usesMatrix ||
      data.decisionTableHitPolicy !== 'PRIORITY' ||
      (() => {
        const values = data.decisionRows.map((row) => Number.parseInt(row.priority, 10));
        if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
          return false;
        }
        return new Set(values).size === values.length;
      })();
    const overlapValid =
      !usesMatrix ||
      !data.decisionTableHitPolicy ||
      (data.decisionTableHitPolicy !== 'FIRST_MATCH' && data.decisionTableHitPolicy !== 'PRIORITY') ||
      data.overlapDetectionPass;

    const checklist = [
      { id: 'entry-type', label: 'Selected Entry Criteria Type available', passed: Boolean(entryType) },
      { id: 'rule-set-name', label: 'Rule Set Name entered', passed: Boolean(data.ruleSetName?.trim()) },
      { id: 'input-set-name', label: 'Input Set Name entered', passed: Boolean(data.inputSetName.trim()) },
      { id: 'input-codes-unique', label: 'Input Codes are unique', passed: uniqueCodes },
      {
        id: 'input-data-types',
        label: 'Input Data Types selected',
        passed: data.ruleInputs.length > 0 && data.ruleInputs.every((row) => Boolean(row.dataType)),
      },
      {
        id: 'source-types',
        label: 'Source Types selected',
        passed: data.ruleInputs.length > 0 && data.ruleInputs.every((row) => Boolean(row.sourceType)),
      },
      { id: 'source-mapping', label: 'Source Mappings valid', passed: sourceMappingsValid },
      { id: 'constants', label: 'Constant Values valid, if used', passed: constantsValid },
      { id: 'null-handling', label: 'Null Handling valid', passed: nullHandlingValid },
      { id: 'condition', label: 'Condition setup valid, if used', passed: conditionRowsValid || Boolean(data.conditionBuilderRules.trim()) },
      { id: 'formula', label: 'Formula setup valid, if used', passed: !includesFormula || Boolean(data.formulaExpression.trim()) },
      {
        id: 'derivation',
        label: 'Derivation setup valid, if used',
        passed:
          data.derivationRules.length === 0 ||
          data.derivationRules.every((row) => Boolean(row.derivedOutputCode.trim()) && Boolean(row.derivationExpression.trim())),
      },
      {
        id: 'matrix',
        label: 'Matrix setup valid, if used',
        passed:
          !usesMatrix ||
          (Boolean(data.decisionTableName.trim()) &&
            data.decisionInputColumns.length > 0 &&
            data.decisionOutputColumns.length > 0 &&
            matrixRowsValid),
      },
      {
        id: 'hit-policy',
        label: 'Hit Policy selected, if matrix is enabled',
        passed: !usesMatrix || Boolean(data.decisionTableHitPolicy),
      },
      { id: 'matrix-rows', label: 'Matrix rows valid, if matrix is enabled', passed: matrixRowsValid },
      { id: 'row-priority', label: 'Row priority valid, if Hit Policy = PRIORITY', passed: rowPriorityValid },
      { id: 'overlap', label: 'Overlap detection passed, if required', passed: overlapValid },
      { id: 'no-match', label: 'No Match Handling selected', passed: Boolean(data.noMatchHandling) },
    ];
    const finalPassed = checklist.every((item) => item.passed);
    return [...checklist, { id: 'final', label: 'Rule validation passed', passed: finalPassed }];
  }, [draft]);

  const validateStep = (step: StepIndex, applyState = true) => {
    const nextFieldErrors: Record<string, string> = {};
    let nextStepError = '';

    if (step === 0) {
      const normalizedPolicyName = draft.name.trim().toLowerCase();
      const normalizedScopeValues = selectedScopeValues.map((value) => value.toLowerCase()).sort().join('|');
      const policyPriorityValue = Number.parseInt(draft.policyPriority, 10);

      if (!draft.name.trim() || draft.name.length > 100) {
        nextFieldErrors.name = 'Enter a unique policy name.';
      } else if (draft.businessDomain && draft.documentType) {
        const hasDuplicateName = existingWorkflows.some(
          (workflow) =>
            workflow.id !== workflowId &&
            workflow.businessDomain === draft.businessDomain &&
            (workflow.documentType || workflow.entity) === draft.documentType &&
            workflow.name.trim().toLowerCase() === normalizedPolicyName
        );
        if (hasDuplicateName) {
          nextFieldErrors.name = 'Enter a unique policy name.';
        }
      }



      if (draft.description.length > 255) {
        nextFieldErrors.description = 'Description cannot exceed 255 characters.';
      }

      if (!draft.setupMode) {
        nextFieldErrors.setupMode = 'Select setup mode.';
      }

      if (!draft.businessDomain) {
        nextFieldErrors.businessDomain = 'Select module.';
      }

      if (!draft.documentType.trim()) {
        nextFieldErrors.documentType = 'Select entity or document type.';
      } else if (draft.businessDomain) {
        const validDocuments = moduleDocumentTypeMap[draft.businessDomain] ?? [];
        if (!validDocuments.includes(draft.documentType)) {
          nextFieldErrors.documentType = 'Select entity or document type.';
        }
      }

      if (!draft.scopeLevel) {
        nextFieldErrors.scopeLevel = 'Select policy scope type.';
      } else if (draft.scopeLevel !== 'Global' && selectedScopeValues.length === 0) {
        nextFieldErrors.scopeValues = 'Select scope value.';
      } else if (new Set(selectedScopeValues.map((value) => value.toLowerCase())).size !== selectedScopeValues.length) {
        nextFieldErrors.scopeValues = 'Select scope value.';
      }

      if (!draft.policyPriority.trim() || !Number.isFinite(policyPriorityValue) || policyPriorityValue <= 0) {
        nextFieldErrors.policyPriority = 'Enter valid policy priority.';
      } else if (policyPriorityValue.toString() !== draft.policyPriority.trim()) {
        nextFieldErrors.policyPriority = 'Enter valid policy priority.';
      } else {
        const hasPriorityConflict = existingWorkflows.some((workflow) => {
          if (workflow.id === workflowId || workflow.status !== 'Active') {
            return false;
          }
          const workflowScopeValues = (workflow.scopeValues || '')
            .split(',')
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean)
            .sort()
            .join('|');
          return (
            workflow.businessDomain === draft.businessDomain &&
            (workflow.documentType || workflow.entity) === draft.documentType &&
            workflow.scopeLevel === draft.scopeLevel &&
            workflowScopeValues === normalizedScopeValues &&
            workflow.policyPriority === draft.policyPriority.trim()
          );
        });
        if (hasPriorityConflict) {
          nextFieldErrors.policyPriority = 'Enter valid policy priority.';
        }
      }

      if (draft.policyOwner.trim()) {
        const activeUsers = ['Alex Kumar', 'Neha Sharma', 'Rohit Menon', 'Priya Nair', 'Arjun Patel'];
        if (!activeUsers.includes(draft.policyOwner.trim())) {
          nextFieldErrors.policyOwner = 'Selected policy owner is inactive or invalid.';
        }
      }

      if (draft.tags.some((tag) => tag.length > 50)) {
        nextFieldErrors.tags = 'Each tag must be 50 characters or less.';
      } else if (new Set(draft.tags.map((tag) => tag.toLowerCase())).size !== draft.tags.length) {
        nextFieldErrors.tags = 'Duplicate tag is not allowed.';
      }
    }

    if (step === 1) {
      const data = draft.dataApplicability;
      const isLineOrHybrid = draft.approvalGranularity === 'Line' || draft.approvalGranularity === 'Hybrid';
      const isDetailedSetup = draft.setupMode === 'Detailed Setup';
      if (!data.submissionTriggerMode) {
        nextFieldErrors.submissionTriggerMode = 'Select submission trigger mode.';
      }
      if (data.submissionTriggerMode === 'System Event' && !data.systemEvent?.trim()) {
        nextFieldErrors.systemEvent = 'Select system event.';
      }
      if (data.submissionTriggerMode === 'API') {
        const key = data.apiTriggerKey?.trim() ?? '';
        if (!key) {
          nextFieldErrors.apiTriggerKey = 'Enter valid API trigger key.';
        } else if (!/^[A-Z0-9_-]{1,100}$/.test(key)) {
          nextFieldErrors.apiTriggerKey = 'Enter valid API trigger key.';
        }
      }

      if (!draft.approvalGranularity) {
        nextFieldErrors.approvalGranularity = 'Select approval granularity.';
      }
      if (data.headerFieldsToCapture.length === 0) {
        nextFieldErrors.headerFieldsToCapture = 'Select header fields.';
      } else if (data.headerFieldsToCapture.some((field) => !availableHeaderFieldIds.includes(field))) {
        nextFieldErrors.headerFieldsToCapture = 'Select header fields.';
      }
      if (isLineOrHybrid && data.lineFieldsToCapture.length === 0) {
        nextFieldErrors.lineFieldsToCapture = 'Select line fields.';
      } else if (isLineOrHybrid && data.lineFieldsToCapture.some((field) => !availableLineFieldIds.includes(field))) {
        nextFieldErrors.lineFieldsToCapture = 'Select line fields.';
      }
      if (data.includeRelatedFields && (data.relatedFieldsToCapture?.length ?? 0) === 0) {
        nextFieldErrors.relatedFieldsToCapture = 'Select valid related fields.';
      } else if (
        data.includeRelatedFields &&
        (data.relatedFieldsToCapture ?? []).some((field) => !relatedFieldOptions.includes(field))
      ) {
        nextFieldErrors.relatedFieldsToCapture = 'Select valid related fields.';
      }

      if (!data.snapshotMode) {
        nextFieldErrors.snapshotMode = 'Select snapshot mode.';
      } else if (!isDetailedSetup && data.snapshotMode !== 'Snapshot') {
        nextFieldErrors.snapshotMode = 'Select snapshot mode.';
      }
      if (data.snapshotMode === 'Snapshot' && !data.snapshotCapturePoint) {
        nextFieldErrors.snapshotCapturePoint = 'Select snapshot capture point.';
      }
      if (!data.entryCriteriaType) {
        nextFieldErrors.entryCriteriaType = 'Select entry criteria type.';
      }
      if (data.triggerDescription && data.triggerDescription.length > 255) {
        nextFieldErrors.triggerDescription = 'Trigger description cannot exceed 255 characters.';
      }

      if (Object.keys(nextFieldErrors).length > 0 && !nextStepError) {
        nextStepError = 'Fix trigger setup errors before continuing.';
      }
    }

    if (step === 2) {
      const approval = draft.approvalSection;
      const visibleFlowTypes =
        approval.setupMode === 'Quick Setup' ? quickSetupFlowTypeOptions : detailedSetupFlowTypeOptions;

      if (!approval.flowType || !visibleFlowTypes.includes(approval.flowType as ApprovalFlowType)) {
        nextFieldErrors.approvalFlowType = 'Select approval flow type.';
      }

      if (approval.steps.length === 0) {
        nextFieldErrors.approvalSteps = 'At least one approval step is required.';
      }

      const normalizedStepNames = approval.steps
        .map((stepConfig) => stepConfig.stepName.trim().toLowerCase())
        .filter(Boolean);
      if (normalizedStepNames.length !== new Set(normalizedStepNames).size) {
        nextFieldErrors.approvalUniqueStepName = 'Enter unique step name.';
      }

      const normalizedStageNames = approval.steps
        .map((stepConfig) => stepConfig.stageName.trim().toLowerCase())
        .filter(Boolean);
      if (normalizedStageNames.length !== new Set(normalizedStageNames).size) {
        nextFieldErrors.approvalUniqueStageName = 'Duplicate stage name.';
      }

      approval.steps.forEach((stepConfig, index) => {
        const prefix = `approvalStep_${index}`;
        const needsStageName =
          approval.stageSetupRequired ||
          approval.flowType === 'Sequential' ||
          approval.flowType === 'Parallel' ||
          approval.flowType === 'Conditional';

        if (!stepConfig.stepName.trim()) {
          nextFieldErrors[`${prefix}_stepName`] = 'Enter unique step name.';
        } else if (stepConfig.stepName.length > 80) {
          nextFieldErrors[`${prefix}_stepName`] = 'Enter unique step name.';
        }

        if (
          stepConfig.stageExecutionMode &&
          !stageExecutionModeOptions.includes(stepConfig.stageExecutionMode)
        ) {
          nextFieldErrors[`${prefix}_stageExecutionMode`] = 'Select valid stage execution mode.';
        }

        if (needsStageName && !stepConfig.stageName.trim()) {
          nextFieldErrors[`${prefix}_stageName`] = 'Duplicate stage name.';
        } else if (stepConfig.stageName.length > 80) {
          nextFieldErrors[`${prefix}_stageName`] = 'Duplicate stage name.';
        }

        if (approval.steps.length > 1 && !stepConfig.stageExecutionMode) {
          nextFieldErrors[`${prefix}_stageExecutionMode`] = 'Select valid stage execution mode.';
        }

        if (stepConfig.stepDescription.length > 255) {
          nextFieldErrors[`${prefix}_stepDescription`] = 'Step description cannot exceed 255 characters.';
        }

        if (!stepConfig.requiredApprovals) {
          nextFieldErrors[`${prefix}_requiredApprovals`] = 'Select required approvals.';
        }

        const totalApproverCount = Number.parseInt(stepConfig.totalApproverCount, 10);
        if (stepConfig.requiredApprovals === 'N-of-M') {
          const requiredCount = Number.parseInt(stepConfig.requiredApprovalCount, 10);
          if (!Number.isFinite(requiredCount) || requiredCount <= 0) {
            nextFieldErrors[`${prefix}_requiredApprovalCount`] = 'Enter valid required approval count.';
          } else if (
            Number.isFinite(totalApproverCount) &&
            totalApproverCount > 0 &&
            requiredCount > totalApproverCount
          ) {
            nextFieldErrors[`${prefix}_requiredApprovalCount`] = 'Enter valid required approval count.';
          }
        }

        if (!stepConfig.resolutionType) {
          nextFieldErrors[`${prefix}_resolutionType`] = 'Select resolution type.';
        } else if (stepConfig.resolutionType === 'Role' && !stepConfig.role.trim()) {
          nextFieldErrors[`${prefix}_role`] = 'Role is required.';
        } else if (stepConfig.resolutionType === 'User' && stepConfig.users.length === 0) {
          nextFieldErrors[`${prefix}_users`] = 'Select at least one active user.';
        } else if (stepConfig.resolutionType === 'Queue' && !stepConfig.queue.trim()) {
          nextFieldErrors[`${prefix}_queue`] = 'Queue is required.';
        } else if (stepConfig.resolutionType === 'Hierarchy') {
          const managerLevel = Number.parseInt(stepConfig.managerLevel, 10);
          if (!Number.isFinite(managerLevel) || managerLevel < 1) {
            nextFieldErrors[`${prefix}_managerLevel`] = 'Enter valid manager level.';
          }
        } else if (
          stepConfig.resolutionType === 'Approver Routing Matrix' &&
          !stepConfig.approverRoutingMatrix.trim()
        ) {
          nextFieldErrors[`${prefix}_approverRoutingMatrix`] = 'Approver routing matrix is invalid.';
        } else if (stepConfig.resolutionType === 'Attribute Rule' && !stepConfig.attributeRuleReference.trim()) {
          nextFieldErrors[`${prefix}_attributeRuleReference`] = 'Attribute rule is invalid.';
        }
      });

      if (!approval.missingApproverAction) {
        nextFieldErrors.missingApproverAction = 'Select missing approver action.';
      }

      if (
        approval.missingApproverAction === 'Use Fallback Chain' &&
        (approval.fallbackChain.length === 0 || approval.fallbackChain.some((item) => !item.value.trim()))
      ) {
        nextFieldErrors.fallbackChain = 'Fallback not configured.';
      }
      if (approval.missingApproverAction === 'Use Fallback Chain' && !approval.finalFallbackOwner.trim()) {
        nextFieldErrors.finalFallbackOwner = 'Final fallback owner is required.';
      }

      if (
        approval.segregationOfDuties &&
        !approval.allowRequesterInApprovalQueue &&
        approval.steps.some((stepConfig) =>
          stepConfig.users.some((user) => user.trim().toLowerCase() === 'requester')
        )
      ) {
        nextFieldErrors.allowRequesterInApprovalQueue = 'Requester is not allowed to approve this request.';
      }
      if (approval.delegationAllowed && !approval.delegationSource) {
        nextFieldErrors.delegationSource = 'Select delegation source.';
      }
      if (approval.reassignmentAllowed && !approval.reassignmentAuthority) {
        nextFieldErrors.reassignmentAuthority = 'Select reassignment authority.';
      }
      if (approval.bulkApprovalAllowed) {
        const maxBulk = Number.parseInt(approval.maxBulkApprovalCount, 10);
        if (!Number.isFinite(maxBulk) || maxBulk <= 0 || maxBulk.toString() !== approval.maxBulkApprovalCount.trim()) {
          nextFieldErrors.maxBulkApprovalCount = 'Enter valid bulk approval count.';
        }
      }

      if (Object.keys(nextFieldErrors).length > 0 && !nextStepError) {
        nextStepError = 'Fix approver setup errors before continuing.';
      }
    }

    if (step === 3) {
      const data = draft.dataApplicability;
      const entryType = data.entryCriteriaType;
      const includesCondition = entryType === 'Condition' || entryType === 'Hybrid';
      const includesFormula = entryType === 'Formula' || entryType === 'Hybrid';
      const includesMatrix = entryType === 'Approval Eligibility Matrix' || entryType === 'Hybrid' || entryType === 'Decision Table';
      const usesMatrix = includesMatrix || Boolean(data.matrixEnabled);

      if (!entryType) {
        nextFieldErrors.entryCriteriaType = 'Entry criteria type is missing.';
      }

      const normalizedRuleSetName = (data.ruleSetName ?? '').trim().toLowerCase();
      if (!data.ruleSetName?.trim() || (data.ruleSetName ?? '').length > 80) {
        nextFieldErrors.ruleSetName = 'Enter unique rule set name.';
      } else {
        const hasDuplicateRuleSetName = existingWorkflows.some(
          (workflow) =>
            workflow.id !== workflowId &&
            (workflow.dataApplicability?.ruleSetName ?? '').trim().toLowerCase() === normalizedRuleSetName &&
            workflow.businessDomain === draft.businessDomain &&
            (workflow.documentType || workflow.entity) === draft.documentType
        );
        if (hasDuplicateRuleSetName) {
          nextFieldErrors.ruleSetName = 'Enter unique rule set name.';
        }
      }

      if ((data.ruleSetDescription ?? '').length > 255) {
        nextFieldErrors.ruleSetDescription = 'Rule set description cannot exceed 255 characters.';
      }

      if (!data.inputSetName.trim() || data.inputSetName.length > 80) {
        nextFieldErrors.inputSetName = 'Input set already exists.';
      }

      const normalizedInputCodes = data.ruleInputs
        .map((row) => row.inputCode.trim().toUpperCase())
        .filter(Boolean);
      if (data.ruleInputs.length === 0) {
        nextFieldErrors.ruleInputs = 'Add at least one rule input.';
      }
      if (normalizedInputCodes.length !== new Set(normalizedInputCodes).size) {
        nextFieldErrors.ruleInputCodes = 'Invalid or duplicate input code.';
      }

      data.ruleInputs.forEach((row, index) => {
        const prefix = `ruleInput_${row.id || index}`;
        const normalizedCode = row.inputCode.trim().toUpperCase();
        if (!normalizedCode || normalizedCode.length > 50 || !/^[A-Z0-9_]+$/.test(normalizedCode)) {
          nextFieldErrors[`${prefix}_inputCode`] = 'Invalid or duplicate input code.';
        }
        if (!row.inputDisplayName?.trim() || row.inputDisplayName.length > 100) {
          nextFieldErrors[`${prefix}_inputDisplayName`] = 'Input display name is required.';
        }
        if (!row.dataType) {
          nextFieldErrors[`${prefix}_dataType`] = 'Input data type is required.';
        }
        if (!row.sourceType) {
          nextFieldErrors[`${prefix}_sourceType`] = 'Source type is required.';
        }

        const sourceType = row.sourceType;
        if (sourceType && sourceType !== 'Constant' && !row.sourceMapping.trim()) {
          nextFieldErrors[`${prefix}_sourceMapping`] = 'Field not found.';
        }
        if (sourceType === 'Constant' && !(row.constantValue ?? '').trim()) {
          nextFieldErrors[`${prefix}_constantValue`] = 'Invalid constant value.';
        }

        if (row.nullHandling === 'Use Default' && !row.defaultValue.trim()) {
          nextFieldErrors[`${prefix}_nullHandling`] = 'Invalid null handling.';
        }
      });

      if (includesCondition) {
        const hasValidConditionRows =
          draft.rules.length > 0 &&
          draft.rules.every(
            (rule) => rule.field.trim() && rule.operator.trim() && rule.value.trim() && rule.action.trim()
          );
        if (!hasValidConditionRows && !data.conditionBuilderRules.trim()) {
          nextFieldErrors.conditionBuilderRules = 'Invalid condition.';
        }
        if (data.conditionLogic && !conditionLogicOptions.includes(data.conditionLogic as (typeof conditionLogicOptions)[number])) {
          nextFieldErrors.conditionLogic = 'Invalid condition logic.';
        }
      }

      if (includesFormula) {
        if (!data.formulaExpression.trim()) {
          nextFieldErrors.formulaExpression = 'Invalid formula.';
        }
      }

      data.derivationRules.forEach((row, index) => {
        const prefix = `derivation_${row.id || index}`;
        if (!row.derivedOutputCode.trim()) {
          nextFieldErrors[`${prefix}_derivedOutputCode`] = 'Select derived output.';
        }
        if (!row.derivationExpression.trim()) {
          nextFieldErrors[`${prefix}_derivationExpression`] = 'Invalid derivation formula.';
        }
      });

      if (!data.ruleOutputWhenMatched) {
        nextFieldErrors.ruleOutputWhenMatched = 'Select rule output.';
      }
      if (data.ruleOutputWhenMatched === 'Route to Matrix' && !usesMatrix) {
        nextFieldErrors.ruleOutputWhenMatched = 'Select rule output.';
      }

      if (usesMatrix) {
        if (!data.matrixEnabled && includesMatrix) {
          nextFieldErrors.matrixEnabled = 'Approval eligibility matrix is required.';
        }
        if (!data.decisionTableName.trim() || data.decisionTableName.length > 100) {
          nextFieldErrors.decisionTableName = 'Matrix name already exists.';
        }
        if (!data.decisionTableHitPolicy) {
          nextFieldErrors.decisionTableHitPolicy = 'Hit policy is required.';
        }
        if (data.decisionInputColumns.length === 0) {
          nextFieldErrors.decisionInputColumns = 'Select at least one input column.';
        }
        if (data.decisionOutputColumns.length === 0) {
          nextFieldErrors.decisionOutputColumns = 'Select at least one output column.';
        }
        if (data.decisionRows.length === 0) {
          nextFieldErrors.decisionRows = 'Invalid matrix row.';
        }

        const priorityValues = data.decisionRows
          .map((row) => Number.parseInt(row.priority, 10))
          .filter((value) => Number.isFinite(value) && value > 0);
        if (data.decisionTableHitPolicy === 'PRIORITY') {
          const hasInvalidPriority = data.decisionRows.some(
            (row) => !Number.isFinite(Number.parseInt(row.priority, 10)) || Number.parseInt(row.priority, 10) <= 0
          );
          if (hasInvalidPriority || priorityValues.length !== data.decisionRows.length) {
            nextFieldErrors.decisionRowPriority = 'Priority conflict.';
          } else if (new Set(priorityValues).size !== priorityValues.length) {
            nextFieldErrors.decisionRowPriority = 'Priority conflict.';
          }
        }
        if (
          (data.decisionTableHitPolicy === 'FIRST_MATCH' || data.decisionTableHitPolicy === 'PRIORITY') &&
          !data.overlapDetectionPass
        ) {
          nextFieldErrors.overlapDetectionPass = 'Overlapping matrix rows found.';
        }
      }

      if (!data.noMatchHandling) {
        nextFieldErrors.noMatchHandling = 'Select no match handling.';
      }

      if (Object.keys(nextFieldErrors).length > 0 && !nextStepError) {
        nextStepError = 'Fix rule setup errors before continuing.';
      }
    }

    if (step === 4) {
      const actions = draft.actions;
      const isDetailedSetup = draft.setupMode === 'Detailed Setup';
      const isLineOrHybrid = draft.approvalGranularity === 'Line' || draft.approvalGranularity === 'Hybrid';

      if (!actions.recordLockPolicy) {
        nextFieldErrors.recordLockPolicy = 'Select record lock policy.';
      }
      if (!actions.editDuringApprovalPolicy) {
        nextFieldErrors.editDuringApprovalPolicy = 'Select edit during approval policy.';
      }

      if (isDetailedSetup && actions.actions.length === 0) {
        nextFieldErrors.actionRows = 'Add at least one action.';
      }

      if (isDetailedSetup) {
        actions.actions.forEach((actionRow) => {
        const prefix = `action_${actionRow.id}`;
        if (!actionRow.eventType) {
          nextFieldErrors[`${prefix}_eventType`] = 'Select event type.';
        }
        if (!actionRow.actionType) {
          nextFieldErrors[`${prefix}_actionType`] = 'Select action type.';
        }
        if (!actionRow.actionConfiguration.trim()) {
          nextFieldErrors[`${prefix}_actionConfiguration`] = 'Invalid action configuration.';
        }
        if (actionRow.actionType === 'Field Update') {
          if (!actionRow.fieldToUpdate.trim()) {
            nextFieldErrors[`${prefix}_fieldToUpdate`] = 'Select field to update.';
          }
          if (!actionRow.updateValue.trim()) {
            nextFieldErrors[`${prefix}_updateValue`] = 'Invalid update value.';
          }
        }
        if (actionRow.actionType === 'Task' && !actionRow.taskTemplate.trim()) {
          nextFieldErrors[`${prefix}_taskTemplate`] = 'Select task template.';
        }
        if (actionRow.actionType === 'API') {
          if (!isDetailedSetup) {
            nextFieldErrors[`${prefix}_actionType`] = 'API actions are available in Detailed Setup only.';
          }
          if (!actionRow.apiEndpoint.trim()) {
            nextFieldErrors[`${prefix}_apiEndpoint`] = 'Select API action.';
          }
          if (!actionRow.idempotencyKeyRule.trim()) {
            nextFieldErrors[`${prefix}_idempotencyKeyRule`] = 'Invalid idempotency key.';
          }
          if (!actionRow.retryPolicy) {
            nextFieldErrors[`${prefix}_retryPolicy`] = 'Retry policy required for API.';
          }
          if ((actionRow.retryPolicy === 'Fixed' || actionRow.retryPolicy === 'Exponential')) {
            const retryCount = Number.parseInt(actionRow.retryCount, 10);
            if (!Number.isFinite(retryCount) || retryCount <= 0) {
              nextFieldErrors[`${prefix}_retryCount`] = 'Enter valid retry count.';
            }
          }
          if (!actionRow.failureHandling) {
            nextFieldErrors[`${prefix}_failureHandling`] = 'Failure handling required.';
          }
        }
        if (actionRow.actionType === 'Script' && !isDetailedSetup) {
          nextFieldErrors[`${prefix}_actionType`] = 'Script actions are available in Detailed Setup only.';
        }
        if (actionRow.actionType === 'Script' && isDetailedSetup && !actionRow.scriptAction.trim()) {
          nextFieldErrors[`${prefix}_scriptAction`] = 'Script action is invalid.';
        }
        });
      }

      if (actions.remarksRequiredOnReject !== true && actions.remarksRequiredOnReject !== false) {
        nextFieldErrors.remarksRequiredOnReject = 'Rejection remarks required.';
      }

      if (isDetailedSetup && actions.decisionAttachmentRequired) {
        if (actions.attachmentRequiredEvent.length === 0) {
          nextFieldErrors.attachmentRequiredEvent = 'Select attachment required event.';
        }
        if (actions.allowedFileTypes.length === 0) {
          nextFieldErrors.allowedFileTypes = 'Select allowed file type.';
        }
        const maxFileSize = Number.parseInt(actions.maximumFileSize, 10);
        if (!Number.isFinite(maxFileSize) || maxFileSize <= 0) {
          nextFieldErrors.maximumFileSize = 'Enter valid file size.';
        }
      }

      const hasNotificationChannel =
        actions.inAppNotificationEnabled ||
        actions.emailNotificationEnabled ||
        actions.smsNotificationEnabled ||
        actions.whatsAppNotificationEnabled;

      if (!hasNotificationChannel) {
        nextFieldErrors.notificationChannels = 'Enable at least one notification channel.';
      } else {
        if (actions.notificationEvents.length === 0) {
          nextFieldErrors.notificationEvents = 'Select notification event.';
        }
        if (!actions.templateMapping.trim()) {
          nextFieldErrors.templateMapping = 'Template missing or inactive.';
        }
        if (actions.notificationRecipientType.length === 0) {
          nextFieldErrors.notificationRecipientType = 'Select notification recipient.';
        }
      }

      if (isDetailedSetup && actions.digestNotificationEnabled && !actions.digestFrequency) {
        nextFieldErrors.digestFrequency = 'Select digest frequency.';
      }

      if (isDetailedSetup && actions.slaEnabled) {
        const slaDuration = Number.parseInt(actions.slaDuration, 10);
        if (!Number.isFinite(slaDuration) || slaDuration <= 0) {
          nextFieldErrors.slaDuration = 'Invalid SLA duration.';
        }
        if (!actions.slaUnit) {
          nextFieldErrors.slaUnit = 'Select SLA unit.';
        }
        if (!actions.slaCalendar) {
          nextFieldErrors.slaCalendar = 'Select SLA calendar.';
        }
        if (actions.reminderBeforeDue) {
          const reminderTime = Number.parseInt(actions.reminderTimeBeforeDue, 10);
          if (!Number.isFinite(reminderTime) || reminderTime <= 0 || (Number.isFinite(slaDuration) && reminderTime >= slaDuration)) {
            nextFieldErrors.reminderTimeBeforeDue = 'Invalid reminder time.';
          }
        }
        if ((actions.autoActionOnTimeout === 'Auto Approve' || actions.autoActionOnTimeout === 'Auto Reject') && !actions.timeoutJustification.trim()) {
          nextFieldErrors.timeoutJustification = 'Timeout justification required.';
        }
      }

      if (isDetailedSetup && actions.externalApprovalEnabled) {
        if (!actions.externalApprovalMode) {
          nextFieldErrors.externalApprovalMode = 'External approval mode required.';
        }
        if (actions.externalApprovalMode === 'Secure Link' && actions.approveViaSecureLink) {
          const ttl = Number.parseInt(actions.tokenTtl, 10);
          if (!Number.isFinite(ttl) || ttl < 5 || ttl > 10080) {
            nextFieldErrors.tokenTtl = 'Invalid token TTL.';
          }
          if (actions.otpRequired) {
            if (!actions.otpChannel) {
              nextFieldErrors.otpChannel = 'OTP channel required.';
            }
            const maxOtpAttempts = Number.parseInt(actions.maxOtpAttempts, 10);
            if (!Number.isFinite(maxOtpAttempts) || maxOtpAttempts < 1 || maxOtpAttempts > 10) {
              nextFieldErrors.maxOtpAttempts = 'Invalid OTP attempts.';
            }
          }
        }
      }

      if (isDetailedSetup && actions.invalidationEnabled) {
        if (actions.invalidationTriggers.length === 0) {
          nextFieldErrors.invalidationTriggers = 'Invalid trigger.';
        }
        if (!actions.invalidationStrategy) {
          nextFieldErrors.invalidationStrategy = 'Invalidation strategy required.';
        }
      }

      if (isDetailedSetup && isLineOrHybrid && !actions.partialApprovalPolicy) {
        nextFieldErrors.partialApprovalPolicy = 'Select partial approval policy.';
      }
      if (!actions.rejectionHandlingPolicy) {
        nextFieldErrors.rejectionHandlingPolicy = 'Select rejection policy.';
      }
      if (isDetailedSetup && isLineOrHybrid && !actions.rejectedLineEditPolicy) {
        nextFieldErrors.rejectedLineEditPolicy = 'Select rejected line edit policy.';
      }
      if (actions.recallAllowed && !actions.recallAllowedUntil) {
        nextFieldErrors.recallAllowedUntil = 'Select recall allowed until.';
      }

      if (Object.keys(nextFieldErrors).length > 0 && !nextStepError) {
        nextStepError = 'Fix action setup errors before continuing.';
      }
    }

    const isValid = Object.keys(nextFieldErrors).length === 0 && !nextStepError;
    if (applyState) {
      setFieldErrors(nextFieldErrors);
      setStepError(nextStepError);
    }
    return isValid;
  };

  const handleValidateConfiguration = () => {
    if (isReadOnly) return;
    const nextErrors: string[] = [];
    if (!validateStep(0, false)) nextErrors.push('Basic Details > Complete mandatory fields and uniqueness checks.');
    if (!validateStep(1, false)) nextErrors.push('Trigger > Complete data applicability setup.');
    if (!validateStep(2, false)) nextErrors.push('Approvers > Fix approver setup errors.');
    if (!validateStep(3, false)) nextErrors.push('Rules > Complete all configured rules.');
    if (!validateStep(4, false)) nextErrors.push('Actions > Fix action setup errors.');

    const scopeConflict = existingWorkflows.some(
      (workflow) =>
        workflow.id !== workflowId &&
        workflow.status === 'Active' &&
        workflow.businessDomain === draft.businessDomain &&
        (workflow.documentType || workflow.entity) === draft.documentType &&
        workflow.scopeLevel === draft.scopeLevel &&
        workflow.scopeValues === draft.scopeValues &&
        workflow.policyPriority === draft.policyPriority
    );
    setActivationConflictPassed(!scopeConflict);
    setDuplicateScopePassed(!scopeConflict);
    if (scopeConflict) {
      nextErrors.push('Publish > Conflicting active approval policy found for same scope and priority.');
    }

    const nextWarnings: string[] = [];
    if (!simulationRequired) {
      nextWarnings.push('Simulation is optional but recommended before activation.');
    }
    if (changeLog.trim().length > 200) {
      nextWarnings.push('Change Log is lengthy. Keep it concise for audit readability.');
    }

    setPublishValidationErrors(nextErrors);
    setPublishValidationWarnings(nextWarnings);
    setPublishValidationStatus(nextErrors.length === 0 ? 'Passed' : 'Failed');
  };

  const handleRunSimulation = () => {
    if (isReadOnly) return;
    if (!sampleDataSource) {
      setSimulationStatus('Failed');
      setSimulationResult('Error');
      setDecisionTrace('Simulation could not run because sample data source is missing.');
      return;
    }
    if (sampleDataSource === 'Existing Record' && !sampleRecord.trim()) {
      setSimulationStatus('Failed');
      setSimulationResult('Error');
      setDecisionTrace('Simulation could not run because no sample record was selected.');
      return;
    }
    if ((sampleDataSource === 'Manual Entry' || sampleDataSource === 'Uploaded Sample') && !sampleDataInput.trim()) {
      setSimulationStatus('Failed');
      setSimulationResult('Error');
      setDecisionTrace('Simulation could not run because sample input data is empty.');
      return;
    }

    const firstStep = draft.approvalSection.steps[0];
    setSimulationStatus('Passed');
    setSimulationResult('Approval Required');
    setApproverRouteSimulation(
      `${draft.approvalSection.flowType || 'Single'} flow, Stage: ${firstStep?.stageName || 'Default'}, Step: ${firstStep?.stepName || 'Step 1'}`
    );
    setDecisionTrace(
      `Input data matched the configured criteria and resolved approver path using ${firstStep?.resolutionType || 'Role'} resolution. Final outcome: Approval Required.`
    );
  };

  const handleNext = () => {
    if (isReadOnly) {
      return;
    }
    if (!skipStepValidationForNow) {
      if (currentStep === 0 && !validateStep(0, true)) {
        return;
      }
      if (currentStep === 2 && !validateStep(2, true)) {
        return;
      }
      if (currentStep === 4 && !validateStep(4, true)) {
        return;
      }
    }
    setFieldErrors({});
    setCurrentStep((current) => Math.min(current + 1, 5) as StepIndex);
    setStepError('');
  };

  const handleBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 0) as StepIndex);
    setStepError('');
    setFieldErrors({});
  };

  const handleSaveDraft = () => {
    if (isReadOnly) {
      return;
    }
    const record = saveApprovalWorkflowDraft(draft, workflowId);
    setWorkflowId(record.id);
    setBannerMessage('Draft saved successfully.');
  };

  const handlePublish = () => {
    if (isReadOnly) {
      return;
    }
    if (publishValidationStatus !== 'Passed') {
      handleValidateConfiguration();
    }
    if (!isPublishReady) {
      setStepError('Complete pre-publish checklist before activation.');
      return;
    }
    const record = publishApprovalWorkflow(draft, workflowId);
    setWorkflowId(record.id);
    setSavedRecord(record);
    const nextStatus = activationType === 'Schedule for Later' ? 'Scheduled' : 'Active';
    setPublishStatus(nextStatus);
    setActivationResultMessage(
      nextStatus === 'Scheduled'
        ? 'Approval policy version has been scheduled successfully.'
        : 'Approval policy version has been published successfully.'
    );
    setStepError('');
  };

  const stepTitle = stepDefinitions[currentStep].title;
  const isDetailedSetupMode = draft.setupMode === 'Detailed Setup';
  const isLineOrHybridGranularity = draft.approvalGranularity === 'Line' || draft.approvalGranularity === 'Hybrid';
  const triggerData = draft.dataApplicability;
  const showTriggerSystemEvent = triggerData.submissionTriggerMode === 'System Event';
  const showTriggerApiKey = triggerData.submissionTriggerMode === 'API';
  const showTriggerLineFields = draft.approvalGranularity === 'Line' || draft.approvalGranularity === 'Hybrid';
  const showRelatedFieldsToggle = isDetailedSetupMode;
  const showRelatedFields = showRelatedFieldsToggle && Boolean(triggerData.includeRelatedFields);
  const showSnapshotCapturePoint = triggerData.snapshotMode === 'Snapshot';
  const showLiveModeWarning = triggerData.snapshotMode === 'Live';
  const triggerRulesRequired = Boolean(triggerData.entryCriteriaType);
  const rulesData = draft.dataApplicability;
  const selectedEntryCriteriaType = rulesData.entryCriteriaType || '';
  const isConditionRules = selectedEntryCriteriaType === 'Condition';
  const isFormulaRules = selectedEntryCriteriaType === 'Formula';
  const isMatrixRules =
    selectedEntryCriteriaType === 'Approval Eligibility Matrix' || selectedEntryCriteriaType === 'Decision Table';
  const isHybridRules = selectedEntryCriteriaType === 'Hybrid';
  const showConditionRules = isConditionRules || isHybridRules;
  const showFormulaRules = isFormulaRules || isHybridRules;
  const showMatrixRules = isMatrixRules || isHybridRules;
  const matrixEnabled = showMatrixRules || Boolean(rulesData.matrixEnabled);
  const hasNotificationChannel =
    draft.actions.inAppNotificationEnabled ||
    draft.actions.emailNotificationEnabled ||
    draft.actions.smsNotificationEnabled ||
    draft.actions.whatsAppNotificationEnabled;
  const requiredSetupChecks = useMemo(
    () => [
      { id: 'basic', label: 'Basic Details completed', passed: validateStep(0, false) },
      { id: 'trigger', label: 'Trigger setup completed', passed: validateStep(1, false) },
      { id: 'approvers', label: 'Approver setup completed', passed: validateStep(2, false) },
      { id: 'rules', label: 'Rules setup completed', passed: validateStep(3, false) },
      { id: 'actions', label: 'Actions setup completed', passed: validateStep(4, false) },
    ],
    [draft]
  );
  const isSetupComplete = requiredSetupChecks.every((item) => item.passed);
  const hasExistingVersionForScope = useMemo(
    () =>
      existingWorkflows.some(
        (workflow) =>
          workflow.id !== workflowId &&
          workflow.businessDomain === draft.businessDomain &&
          (workflow.documentType || workflow.entity) === draft.documentType &&
          workflow.status === 'Active'
      ),
    [existingWorkflows, workflowId, draft.businessDomain, draft.documentType, draft.entity]
  );
  const prePublishChecklist = useMemo(
    () => [
      { label: 'Basic Details completed', passed: requiredSetupChecks[0]?.passed ?? false },
      { label: 'Trigger setup completed', passed: requiredSetupChecks[1]?.passed ?? false },
      { label: 'Approver setup completed', passed: requiredSetupChecks[2]?.passed ?? false },
      { label: 'Rules setup completed', passed: requiredSetupChecks[3]?.passed ?? false },
      { label: 'Actions setup completed', passed: requiredSetupChecks[4]?.passed ?? false },
      { label: 'Configuration validation passed', passed: publishValidationStatus === 'Passed' },
      { label: 'No blocking errors', passed: publishValidationErrors.length === 0 },
      { label: 'Conflict check passed', passed: activationConflictPassed },
      { label: 'Duplicate scope handled', passed: duplicateScopePassed || Boolean(versionAction) },
      { label: 'Simulation passed, if required', passed: !simulationRequired || simulationStatus === 'Passed' },
      { label: 'Effective From selected', passed: Boolean(effectiveFrom) },
      { label: 'Change Log entered', passed: changeLog.trim().length > 0 },
      { label: 'Version Action selected', passed: Boolean(versionAction) },
      { label: 'Previous version handling completed, if applicable', passed: !hasExistingVersionForScope || retirePreviousVersion },
      { label: 'User confirmation completed', passed: userConfirmation },
    ],
    [
      requiredSetupChecks,
      publishValidationStatus,
      publishValidationErrors.length,
      activationConflictPassed,
      duplicateScopePassed,
      versionAction,
      simulationRequired,
      simulationStatus,
      effectiveFrom,
      changeLog,
      hasExistingVersionForScope,
      retirePreviousVersion,
      userConfirmation,
    ]
  );
  const isPublishReady = useMemo(() => {
    if (!isSetupComplete) return false;
    if (publishValidationStatus !== 'Passed') return false;
    if (!activationConflictPassed) return false;
    if (!duplicateScopePassed && !versionAction) return false;
    if (simulationRequired && simulationStatus !== 'Passed') return false;
    if (!effectiveFrom) return false;
    if (activationType === 'Schedule for Later' && new Date(effectiveFrom).getTime() <= Date.now()) return false;
    if (!changeLog.trim() || changeLog.trim().length > 255) return false;
    if (!versionAction) return false;
    if (hasExistingVersionForScope && !retirePreviousVersion) return false;
    if (!userConfirmation) return false;
    return prePublishChecklist.every((item) => item.passed);
  }, [
    isSetupComplete,
    publishValidationStatus,
    activationConflictPassed,
    duplicateScopePassed,
    versionAction,
    simulationRequired,
    simulationStatus,
    effectiveFrom,
    activationType,
    changeLog,
    hasExistingVersionForScope,
    retirePreviousVersion,
    userConfirmation,
    prePublishChecklist,
  ]);
  const currentUpdatedLabel = savedRecord
    ? formatDateTime(savedRecord.updatedAt)
    : workflowId
      ? formatDateTime(new Date().toISOString())
      : null;
  const wizardActionBar = (
    <section className="create-pr-sticky-actions approval-wizard-actions">
      <div className="approval-wizard-actions__inner mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-2">
        <div className="approval-wizard-actions__context">
          <span className="approval-wizard-actions__step">Step {currentStep + 1} of {stepDefinitions.length}</span>
          <span className="approval-wizard-actions__title">{stepTitle}</span>
        </div>
        <div className="approval-wizard-actions__controls flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onBack}>
            Back to list
          </button>
          {!isReadOnly && (
            <button type="button" className="btn btn--outline btn--sm" onClick={handleSaveDraft}>
              <CopyCheck size={14} />
              Save as draft
            </button>
          )}
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={14} />
            Previous
          </button>
          {currentStep < 5 && (
            <button
              type="button"
              className="btn btn--primary btn--sm approval-wizard-actions__next"
              onClick={handleNext}
              disabled={isReadOnly}
            >
              Next
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );

  if (workflowNotFound) {
    return (
      <AppShell activeLeaf="approval-studio">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8">
          <div className="rounded border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            The selected approval workflow could not be found.
          </div>
          <div>
            <button type="button" className="btn btn--outline" onClick={onNavigateToList}>
              Back to Approval Studio
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (savedRecord) {
    const summaryUpdated = formatDateTime(savedRecord.updatedAt);
    return (
      <AppShell activeLeaf="approval-studio">
        <div className="mx-auto flex w-full max-w-[980px] flex-col gap-6 px-4 py-8">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-surface)] text-[var(--color-brand-text-strong)]">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-[28px] font-semibold leading-9 text-[var(--color-text)]">
              Approval workflow published
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              "{savedRecord.name}" is now active and ready for use.
            </p>

            <div className="mt-5 grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Workflow ID</span>
                <span className="font-semibold text-[var(--color-text)]">{savedRecord.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Status</span>
                <span className="brand-badge brand-badge--approved">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Last updated</span>
                <span className="text-[var(--color-text)]">
                  {summaryUpdated.dateLabel}, {summaryUpdated.timeLabel}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => onNavigateToView(savedRecord.id)}
              >
                View approval workflow
              </button>
              <button type="button" className="btn btn--outline" onClick={onNavigateToCreate}>
                Create another approval workflow
              </button>
              <button type="button" className="btn btn--ghost" onClick={onNavigateToList}>
                Return to Approval Studio
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLeaf="approval-studio" bottomBar={wizardActionBar}>
      <div className="create-pr-header">
        <div className="create-pr-header__top">
          <div className="create-pr-header__title-group">
            <button
              type="button"
              className="page-back-button create-pr-header__back"
              aria-label="Back to Approval Studio"
              onClick={onBack}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="create-pr-header__title-wrap">
              <div className="create-pr-header__title-row">
                <h2 className="brand-page-title create-pr-header__title">{pageTitle}</h2>
                {mode === 'view' && <span className="create-pr-header__status">Read only</span>}
                {mode === 'edit' && <span className="create-pr-header__status">Editing</span>}
                {mode === 'create' && <span className="create-pr-header__status">Draft</span>}
              </div>
              <p className="brand-page-subtitle">
                Build a complete approval component with guided configuration.
              </p>
            </div>
          </div>
          {currentUpdatedLabel && (
            <div className="create-pr-header__meta">
              <div className="create-pr-header__meta-item">
                <span className="create-pr-header__meta-label">Updated:</span>
                <span className="create-pr-header__meta-value">
                  {currentUpdatedLabel.dateLabel}, {currentUpdatedLabel.timeLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="approval-wizard-shell mx-auto w-full max-w-[1400px] px-4 py-6 flex flex-col gap-4">
        {bannerMessage && <div className="brand-message mx-auto w-full max-w-[1400px] px-4 py-3 text-sm">{bannerMessage}</div>}

        <section className="approval-wizard-steps-sticky sticky top-0 left-0 right-0 z-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)] mx-auto w-full max-w-[1400px]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Step {currentStep + 1} / {stepDefinitions.length}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
            {stepDefinitions.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(index as StepIndex);
                    setStepError('');
                    setFieldErrors({});
                  }}
                  disabled={false}
                  className={cn(
                    'approval-wizard-step flex items-center gap-2 rounded-lg border px-2 py-2 text-xs transition',
                    isCurrent
                      ? 'border-[var(--color-primary)] bg-[var(--color-brand-surface)] text-[var(--color-brand-text-strong)]'
                      : isCompleted
                        ? 'border-[var(--color-brand-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                  )}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current">
                    {isCompleted ? <Check size={12} /> : index + 1}
                  </span>
                  <span className="truncate">{step.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="approval-wizard-content rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)] mx-auto w-full max-w-[1400px]">
          <div className="mb-5 border-b border-[var(--color-border)] pb-3">
            <h3 className="text-xl font-semibold text-[var(--color-text)]">{stepTitle}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Follow this step to define your approval workflow accurately.
            </p>
          </div>

          {currentStep === 0 && (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <div className="md:col-span-1">
                <div className="mb-2">
                  <span className="field-label">Setup Mode <span className="field-label__required ml-1">*</span></span>
                </div>
                <div className="flex gap-2">
                  {(['Quick Setup', 'Detailed Setup'] as ApprovalSetupMode[]).map((modeOption) => {
                    const isSelected = draft.setupMode === modeOption;
                    return (
                      <button
                        key={modeOption}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            setupMode: modeOption,
                            approvalSection: {
                              ...current.approvalSection,
                              setupMode: modeOption,
                            },
                            dataApplicability:
                              modeOption === 'Quick Setup'
                                ? {
                                    ...current.dataApplicability,
                                    snapshotMode: 'Snapshot',
                                    snapshotCapturePoint: current.dataApplicability.snapshotCapturePoint || 'On Submit',
                                    includeRelatedFields: false,
                                    relatedFieldsToCapture: [],
                                  }
                                : current.dataApplicability,
                          }))
                        }
                        className={cn(
                          'flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium transition',
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-brand-surface)] text-[var(--color-brand-text-strong)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                        )}
                      >
                        {modeOption === 'Quick Setup' ? 'Quick' : 'Detailed'}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.setupMode && <p className="field-error mt-1">{fieldErrors.setupMode}</p>}
              </div>

              <div>
                <div className="mb-2">
                  <span className="field-label">Policy Name <span className="field-label__required ml-1">*</span></span>
                </div>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Example: Purchase Order Approval - High Value"
                  error={fieldErrors.name}
                  maxLength={100}
                  readOnly={isReadOnly}
                />
                {fieldErrors.name && <p className="field-error mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <InfoLabel
                  label="Module"
                  required
                  tooltip="Select the module where this approval policy will be used. Example: Purchase, Sales, Service, Inventory."
                />
                <Select
                  value={draft.businessDomain}
                  onChange={(event) => {
                    const businessDomain = event.target.value as ApprovalBusinessDomain | '';
                    setDraft((current) => ({
                      ...current,
                      businessDomain,
                      category: businessDomain,
                      entity: '',
                      documentType: '',
                    }));
                  }}
                  disabled={isReadOnly}
                  error={fieldErrors.businessDomain}
                  options={[
                    { value: '', label: 'Select module' },
                    { value: 'Procurement', label: 'Procurement' },
                    { value: 'Sales', label: 'Sales' },
                    { value: 'Service', label: 'Service' },
                    { value: 'Inventory', label: 'Inventory' },
                  ]}
                />
                {fieldErrors.businessDomain && <p className="field-error mt-1">{fieldErrors.businessDomain}</p>}
              </div>

              <div>
                <InfoLabel
                  label="Entity / Document Type"
                  required
                  tooltip="Select the document or entity where approval will apply. Example: Purchase Order, Purchase Invoice, Supplier Master."
                />
                <Select
                  value={draft.documentType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      documentType: event.target.value,
                      entity: event.target.value,
                    }))
                  }
                  disabled={isReadOnly || !draft.businessDomain}
                  error={fieldErrors.documentType}
                  options={[
                    { value: '', label: draft.businessDomain ? 'Select entity or document type' : 'Select module first' },
                    ...moduleDocumentOptions.map((option) => ({ value: option, label: option })),
                  ]}
                />
                {fieldErrors.documentType && <p className="field-error mt-1">{fieldErrors.documentType}</p>}
              </div>

              <div>
                <InfoLabel
                  label="Policy Scope Type"
                  required
                  tooltip={
                    <TooltipPointerList
                      items={[
                        { label: 'Global', description: 'Applies everywhere.' },
                        { label: 'Organisation', description: 'Applies to selected organisations only.' },
                        { label: 'Branch', description: 'Applies to selected branches only.' },
                        { label: 'Department', description: 'Applies to selected departments only.' },
                        { label: 'Role', description: 'Applies to selected roles only.' },
                        { label: 'User', description: 'Applies to selected users only.' },
                        { label: 'Custom', description: 'Applies to configured custom scope values.' },
                      ]}
                    />
                  }
                />
                <Select
                  value={draft.scopeLevel}
                  onChange={(event) => {
                    const scopeLevel = event.target.value as ApprovalScopeLevel | '';
                    setDraft((current) => ({
                      ...current,
                      scopeLevel,
                      scopeValues: '',
                    }));
                  }}
                  disabled={isReadOnly}
                  error={fieldErrors.scopeLevel}
                  options={[
                    { value: '', label: 'Select policy scope type' },
                    { value: 'Global', label: 'Global' },
                    { value: 'Organisation', label: 'Organisation' },
                    { value: 'Branch', label: 'Branch' },
                    { value: 'Department', label: 'Department' },
                    { value: 'Role', label: 'Role' },
                    { value: 'User', label: 'User' },
                    { value: 'Custom', label: 'Custom' },
                  ]}
                />
                {fieldErrors.scopeLevel && <p className="field-error mt-1">{fieldErrors.scopeLevel}</p>}
              </div>

              {draft.scopeLevel && draft.scopeLevel !== 'Global' && (
                <div>
                  <InfoLabel
                    label="Scope Value"
                    required
                    tooltip="Select the actual scope value. Example: if scope type is Branch, select one or more branches."
                  />
                  <select
                    multiple
                    className={cn('field-select min-h-24', fieldErrors.scopeValues && 'field-select--error')}
                    value={selectedScopeValues}
                    disabled={isReadOnly || scopeValueOptions.length === 0}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                      setDraft((current) => ({
                        ...current,
                        scopeValues: values.join(', '),
                      }));
                    }}
                  >
                    {scopeValueOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.scopeValues && <p className="field-error mt-1">{fieldErrors.scopeValues}</p>}
                </div>
              )}

              <div>
                <InfoLabel
                  label="Policy Priority"
                  required
                  tooltip="Priority is used when more than one approval policy matches the same document. Lower number means higher priority."
                />
                <Input
                  value={draft.policyPriority}
                  onChange={(event) => setDraft((current) => ({ ...current, policyPriority: event.target.value }))}
                  placeholder="Example: 1"
                  inputMode="numeric"
                  readOnly={isReadOnly}
                  error={fieldErrors.policyPriority}
                />
                {fieldErrors.policyPriority && <p className="field-error mt-1">{fieldErrors.policyPriority}</p>}
              </div>

              <div>
                <InfoLabel
                  label="Policy Owner"
                  tooltip="Select the business owner responsible for this approval policy."
                />
                <Select
                  value={draft.policyOwner}
                  onChange={(event) => setDraft((current) => ({ ...current, policyOwner: event.target.value }))}
                  disabled={isReadOnly}
                  error={fieldErrors.policyOwner}
                  options={[
                    { value: '', label: 'Select policy owner' },
                    { value: 'Alex Kumar', label: 'Alex Kumar' },
                    { value: 'Neha Sharma', label: 'Neha Sharma' },
                    { value: 'Rohit Menon', label: 'Rohit Menon' },
                    { value: 'Priya Nair', label: 'Priya Nair' },
                    { value: 'Arjun Patel', label: 'Arjun Patel' },
                  ]}
                />
                {fieldErrors.policyOwner && <p className="field-error mt-1">{fieldErrors.policyOwner}</p>}
              </div>

              <div className="md:col-span-3 xl:col-span-4">
                <InfoLabel
                  label="Tags / Category"
                  tooltip="Use tags to group approval policies. Example: Purchase, High Value, Finance, Master Data."
                />
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-text)]"
                      >
                        {tag}
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="text-[var(--color-text-muted)]"
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                tags: current.tags.filter((item) => item !== tag),
                              }))
                            }
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ',') {
                        return;
                      }
                      event.preventDefault();
                      const nextTag = tagInput.trim();
                      if (!nextTag) {
                        return;
                      }
                      setDraft((current) => {
                        if (current.tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
                          return current;
                        }
                        return { ...current, tags: [...current.tags, nextTag] };
                      });
                      setTagInput('');
                    }}
                    placeholder="Example: Purchase, High Value, Finance"
                    readOnly={isReadOnly}
                    error={fieldErrors.tags}
                    maxLength={50}
                  />
                </div>
                {fieldErrors.tags && <p className="field-error mt-1">{fieldErrors.tags}</p>}
              </div>

              <div className="md:col-span-3 xl:col-span-4">
                <div className="mb-2">
                  <span className="field-label">Description</span>
                </div>
                <Textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Write the purpose of this approval policy."
                  rows={3}
                  maxLength={255}
                  error={fieldErrors.description}
                  readOnly={isReadOnly}
                />
                <div className="form-layout-field__counter">{draft.description.length}/255</div>
                {fieldErrors.description && <p className="field-error mt-1">{fieldErrors.description}</p>}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.1 Submission Trigger</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Submission Trigger Mode"
                      required
                      tooltip={
                        <TooltipPointerList
                          items={[
                            { label: 'User Submit', description: 'User clicks Submit for Approval.' },
                            { label: 'System Event', description: 'Approval starts automatically on configured event.' },
                            { label: 'API', description: 'Approval starts from integration or external system.' },
                          ]}
                        />
                      }
                    />
                    <Select
                      value={triggerData.submissionTriggerMode}
                      error={fieldErrors.submissionTriggerMode}
                      disabled={isReadOnly}
                      onChange={(event) => {
                        const nextMode = event.target.value as SubmissionTriggerMode | '';
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: {
                            ...current.dataApplicability,
                            submissionTriggerMode: nextMode,
                            systemEvent: nextMode === 'System Event' ? current.dataApplicability.systemEvent ?? '' : '',
                            apiTriggerKey: nextMode === 'API' ? current.dataApplicability.apiTriggerKey ?? '' : '',
                          },
                        }));
                      }}
                      options={[
                        { value: '', label: 'Select submission trigger mode' },
                        ...submissionTriggerModeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                    {fieldErrors.submissionTriggerMode && <p className="field-error mt-1">{fieldErrors.submissionTriggerMode}</p>}
                  </div>

                  {showTriggerSystemEvent && (
                    <div>
                      <InfoLabel
                        label="System Event"
                        required
                        tooltip="Select the system event that should automatically start the approval process."
                      />
                      <Select
                        value={triggerData.systemEvent ?? ''}
                        error={fieldErrors.systemEvent}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'systemEvent',
                              event.target.value
                            ),
                          }))
                        }
                        options={[
                          { value: '', label: 'Select system event' },
                          ...triggerSystemEventOptions.map((value) => ({ value, label: value })),
                        ]}
                      />
                      {fieldErrors.systemEvent && <p className="field-error mt-1">{fieldErrors.systemEvent}</p>}
                    </div>
                  )}

                  {showTriggerApiKey && (
                    <div>
                      <InfoLabel
                        label="API Trigger Key"
                        required
                        tooltip="Unique key used by external systems to trigger this approval policy through API."
                      />
                      <Input
                        value={triggerData.apiTriggerKey ?? ''}
                        maxLength={100}
                        readOnly={isReadOnly}
                        error={fieldErrors.apiTriggerKey}
                        placeholder="Example: JOB_CARD_APPROVAL_SUBMIT"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'apiTriggerKey',
                              event.target.value.toUpperCase()
                            ),
                          }))
                        }
                      />
                      {fieldErrors.apiTriggerKey && <p className="field-error mt-1">{fieldErrors.apiTriggerKey}</p>}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.2 Approval Applicability</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Approval Granularity"
                      required
                      tooltip={
                        <TooltipPointerList
                          items={[
                            { label: 'Header', description: 'Approval is based on main document fields.' },
                            { label: 'Line', description: 'Approval is based on product, service, item, or labour lines.' },
                            { label: 'Hybrid', description: 'Approval uses both header and line information.' },
                          ]}
                        />
                      }
                    />
                    <Select
                      value={draft.approvalGranularity}
                      error={fieldErrors.approvalGranularity}
                      disabled={isReadOnly}
                      onChange={(event) => {
                        const nextGranularity = event.target.value as ApprovalWorkflowDraft['approvalGranularity'];
                        setDraft((current) => {
                          const hadLineFields = current.dataApplicability.lineFieldsToCapture.length > 0;
                          if (
                            nextGranularity === 'Header' &&
                            hadLineFields &&
                            !window.confirm('Switching to Header will clear selected line fields. Continue?')
                          ) {
                            return current;
                          }
                          return {
                            ...current,
                            approvalGranularity: nextGranularity,
                            dataApplicability: {
                              ...current.dataApplicability,
                              lineFieldsToCapture: nextGranularity === 'Header' ? [] : current.dataApplicability.lineFieldsToCapture,
                            },
                          };
                        });
                      }}
                      options={[
                        { value: '', label: 'Select approval granularity' },
                        { value: 'Header', label: 'Header' },
                        { value: 'Line', label: 'Line' },
                        { value: 'Hybrid', label: 'Hybrid' },
                      ]}
                    />
                    {fieldErrors.approvalGranularity && <p className="field-error mt-1">{fieldErrors.approvalGranularity}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.3 Field Capture</h4>
                <div className="grid gap-4">
                  <DualListboxField
                    label="Header Fields to Capture"
                    required
                    tooltip="Select the main document fields that should be captured for approval."
                    availableItems={availableHeaderFieldIds}
                    selectedItems={triggerData.headerFieldsToCapture}
                    disabled={isReadOnly}
                    onChange={(nextItems) =>
                      setDraft((current) => ({
                        ...current,
                        dataApplicability: updateDataApplicabilitySetting(
                          current.dataApplicability,
                          'headerFieldsToCapture',
                          nextItems
                        ),
                      }))
                    }
                    helperText="Capture at least one header field."
                  />
                  {fieldErrors.headerFieldsToCapture && <p className="field-error">{fieldErrors.headerFieldsToCapture}</p>}

                  {showTriggerLineFields && (
                    <>
                      <DualListboxField
                        label="Line Fields to Capture"
                        required
                        tooltip="Select line-level fields that should be captured for approval."
                        availableItems={availableLineFieldIds}
                        selectedItems={triggerData.lineFieldsToCapture}
                        disabled={isReadOnly}
                        onChange={(nextItems) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'lineFieldsToCapture',
                              nextItems
                            ),
                          }))
                        }
                        helperText="Required for Line and Hybrid granularity."
                      />
                      {fieldErrors.lineFieldsToCapture && <p className="field-error">{fieldErrors.lineFieldsToCapture}</p>}
                    </>
                  )}

                  {showRelatedFieldsToggle && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <InfoLabel
                          label="Include Related Fields"
                          tooltip="Enable this if approval rules need fields from related records."
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                          <input
                            type="checkbox"
                            checked={Boolean(triggerData.includeRelatedFields)}
                            disabled={isReadOnly}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                dataApplicability: {
                                  ...current.dataApplicability,
                                  includeRelatedFields: event.target.checked,
                                  relatedFieldsToCapture: event.target.checked
                                    ? current.dataApplicability.relatedFieldsToCapture ?? []
                                    : [],
                                },
                              }))
                            }
                          />
                          {triggerData.includeRelatedFields ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                    </div>
                  )}

                  {showRelatedFields && (
                    <>
                      <DualListboxField
                        label="Related Fields to Capture"
                        required
                        tooltip="Select fields from related records that should be captured for approval."
                        availableItems={relatedFieldOptions}
                        selectedItems={triggerData.relatedFieldsToCapture ?? []}
                        disabled={isReadOnly}
                        onChange={(nextItems) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'relatedFieldsToCapture',
                              nextItems
                            ),
                          }))
                        }
                        helperText="Example path: Job Card > Customer > Customer Group."
                      />
                      {fieldErrors.relatedFieldsToCapture && <p className="field-error">{fieldErrors.relatedFieldsToCapture}</p>}
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.4 Snapshot Policy</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Snapshot Mode"
                      required
                      tooltip={
                        <TooltipPointerList
                          items={[
                            { label: 'Snapshot', description: 'Stores approval data at submission time for audit.' },
                            { label: 'Live', description: 'Reads current data while approval is in progress.' },
                          ]}
                        />
                      }
                    />
                    <Select
                      value={isDetailedSetupMode ? triggerData.snapshotMode : 'Snapshot'}
                      error={fieldErrors.snapshotMode}
                      disabled={isReadOnly || !isDetailedSetupMode}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'snapshotMode',
                            event.target.value as SnapshotMode | ''
                          ),
                        }))
                      }
                      options={
                        isDetailedSetupMode
                          ? [
                              { value: '', label: 'Select snapshot mode' },
                              ...snapshotModeOptions.map((value) => ({ value, label: value })),
                            ]
                          : [{ value: 'Snapshot', label: 'Snapshot' }]
                      }
                    />
                    {!isDetailedSetupMode && (
                      <p className="field-helper mt-1">Quick Setup keeps Snapshot mode enabled for stable audit behavior.</p>
                    )}
                    {fieldErrors.snapshotMode && <p className="field-error mt-1">{fieldErrors.snapshotMode}</p>}
                  </div>

                  {showSnapshotCapturePoint && (
                    <div>
                      <InfoLabel
                        label="Snapshot Capture Point"
                        required
                        tooltip="Select when approval data should be captured and frozen for audit."
                      />
                      <Select
                        value={triggerData.snapshotCapturePoint ?? ''}
                        error={fieldErrors.snapshotCapturePoint}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'snapshotCapturePoint',
                              event.target.value as ApprovalDataApplicabilitySettings['snapshotCapturePoint']
                            ),
                          }))
                        }
                        options={[
                          { value: '', label: 'Select snapshot capture point' },
                          ...snapshotCapturePointOptions.map((value) => ({ value, label: value })),
                        ]}
                      />
                      {fieldErrors.snapshotCapturePoint && <p className="field-error mt-1">{fieldErrors.snapshotCapturePoint}</p>}
                    </div>
                  )}

                  {showLiveModeWarning && (
                    <div className="md:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      Live mode may change approval result if source data changes after submission.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.5 Entry Criteria Method</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Entry Criteria Type"
                      required
                      tooltip={
                        <TooltipPointerList
                          items={[
                            { label: 'Condition', description: 'Use straightforward business conditions.' },
                            { label: 'Formula', description: 'Use calculated logic for approval entry.' },
                            {
                              label: 'Approval Eligibility Matrix',
                              description: 'Use matrix combinations like amount + branch + department.',
                            },
                            { label: 'Hybrid', description: 'Use multiple methods together.' },
                          ]}
                        />
                      }
                    />
                    <Select
                      value={triggerData.entryCriteriaType}
                      error={fieldErrors.entryCriteriaType}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'entryCriteriaType',
                            event.target.value as EntryCriteriaType | ''
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select entry criteria type' },
                        ...entryCriteriaTypeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                    {fieldErrors.entryCriteriaType && <p className="field-error mt-1">{fieldErrors.entryCriteriaType}</p>}
                  </div>

                  <div>
                    <InfoLabel
                      label="Rules Required Indicator"
                      tooltip="Shows whether detailed rule setup is required in the Rules tab."
                    />
                    <div className={cn('brand-badge', triggerRulesRequired ? 'brand-badge--draft' : 'brand-badge--approved')}>
                      {triggerRulesRequired ? 'Required' : 'Not Required'}
                    </div>
                    <p className="field-helper mt-1">Complete detailed rule setup in Tab 4: Rules.</p>
                  </div>

                  <div className="md:col-span-2">
                    <InfoLabel
                      label="Trigger Description"
                      tooltip="Write a short explanation for business users to understand this trigger setup."
                    />
                    <Textarea
                      value={triggerData.triggerDescription ?? ''}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'triggerDescription',
                            event.target.value
                          ),
                        }))
                      }
                      maxLength={255}
                      rows={3}
                      readOnly={isReadOnly}
                      error={fieldErrors.triggerDescription}
                      placeholder="Write short explanation of when this approval should start."
                    />
                    <div className="form-layout-field__counter">{(triggerData.triggerDescription ?? '').length}/255</div>
                    {fieldErrors.triggerDescription && <p className="field-error mt-1">{fieldErrors.triggerDescription}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">2.6 Trigger Preview & Validation</h4>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                    <h5 className="mb-2 font-semibold text-[var(--color-text)]">Trigger Summary Preview</h5>
                    <div className="space-y-1.5 text-[var(--color-text)]">
                      <div><strong>Submission Trigger Mode:</strong> {triggerData.submissionTriggerMode || '-'}</div>
                      {showTriggerSystemEvent && <div><strong>System Event:</strong> {triggerData.systemEvent || '-'}</div>}
                      {showTriggerApiKey && <div><strong>API Trigger Key:</strong> {triggerData.apiTriggerKey || '-'}</div>}
                      <div><strong>Approval Granularity:</strong> {draft.approvalGranularity || '-'}</div>
                      <div>
                        <strong>Header Fields:</strong> {triggerData.headerFieldsToCapture.length} selected
                        {triggerData.headerFieldsToCapture.length > 0 && ` (${triggerData.headerFieldsToCapture.join(', ')})`}
                      </div>
                      {showTriggerLineFields && (
                        <div>
                          <strong>Line Fields:</strong> {triggerData.lineFieldsToCapture.length} selected
                          {triggerData.lineFieldsToCapture.length > 0 && ` (${triggerData.lineFieldsToCapture.join(', ')})`}
                        </div>
                      )}
                      <div><strong>Include Related Fields:</strong> {triggerData.includeRelatedFields ? 'Yes' : 'No'}</div>
                      {showRelatedFields && (
                        <div>
                          <strong>Related Fields:</strong> {(triggerData.relatedFieldsToCapture ?? []).length} selected
                          {(triggerData.relatedFieldsToCapture ?? []).length > 0 &&
                            ` (${(triggerData.relatedFieldsToCapture ?? []).join(', ')})`}
                        </div>
                      )}
                      <div><strong>Snapshot Mode:</strong> {triggerData.snapshotMode || '-'}</div>
                      {showSnapshotCapturePoint && (
                        <div><strong>Snapshot Capture Point:</strong> {triggerData.snapshotCapturePoint || '-'}</div>
                      )}
                      <div><strong>Entry Criteria Type:</strong> {triggerData.entryCriteriaType || '-'}</div>
                      <div><strong>Rules Required Indicator:</strong> {triggerRulesRequired ? 'Required' : 'Not Required'}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
                    <h5 className="mb-2 font-semibold text-[var(--color-text)]">Trigger Validation Summary</h5>
                    <ul className="space-y-1.5">
                      {triggerValidationChecklist.map((item) => (
                        <li
                          key={item.id}
                          className={cn(
                            'flex items-start gap-2',
                            item.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                          )}
                        >
                          <span aria-hidden="true">{item.passed ? <CheckCircle2 size={14} /> : '!'}</span>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                    {stepError && currentStep === 1 && <p className="field-error mt-3">{stepError}</p>}
                  </div>
                </div>
              </section>
            </div>
          )}

          {false && currentStep === 1 && (
            <div className="space-y-5">
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Approval Flow Type</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {approvalFlowTypeCards.map((flowType) => {
                    const FlowTypeIcon = flowType.icon;
                    const isSelected = draft.type === flowType.type;
                    return (
                      <button
                        key={flowType.type}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setDraft((current) => ({ ...current, type: flowType.type }))}
                        className={cn(
                          'rounded-xl border p-4 text-left transition',
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-brand-surface)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand-border)]'
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                            <FlowTypeIcon size={16} />
                          </div>
                          {isSelected && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--color-text)]">{flowType.title}</h4>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{flowType.description}</p>
                        <p className="mt-2 text-xs font-medium text-[var(--color-brand-text)]">{flowType.useCase}</p>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.type && <p className="mt-2 field-error">{fieldErrors.type}</p>}
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Submission</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Submission Trigger Mode" required>
                    <Select
                      value={draft.dataApplicability.submissionTriggerMode}
                      error={fieldErrors.submissionTriggerMode}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'submissionTriggerMode',
                            event.target.value as SubmissionTriggerMode | ''
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select trigger mode' },
                        ...submissionTriggerModeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                  </FormField>

                  <FormField label="Snapshot Mode" required>
                    <Select
                      value={draft.dataApplicability.snapshotMode}
                      error={fieldErrors.snapshotMode}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'snapshotMode',
                            event.target.value as SnapshotMode | ''
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select snapshot mode' },
                        ...snapshotModeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <DualListboxField
                      label="Header Fields to Capture"
                      availableItems={availableHeaderFieldIds}
                      selectedItems={draft.dataApplicability.headerFieldsToCapture}
                      disabled={isReadOnly}
                      onChange={(nextItems) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'headerFieldsToCapture',
                            nextItems
                          ),
                        }))
                      }
                      helperText="Select header fields that should be captured in submission payload."
                    />
                    {fieldErrors.headerFieldsToCapture && <p className="field-error">{fieldErrors.headerFieldsToCapture}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <DualListboxField
                      label="Line Fields to Capture"
                      availableItems={availableLineFieldIds}
                      selectedItems={draft.dataApplicability.lineFieldsToCapture}
                      disabled={isReadOnly}
                      onChange={(nextItems) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'lineFieldsToCapture',
                            nextItems
                          ),
                        }))
                      }
                      helperText="Optional: choose line-level fields for granular payload capture."
                    />
                  </div>

                  <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={draft.dataApplicability.requireRemarksPerLine}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'requireRemarksPerLine',
                              event.target.checked
                            ),
                          }))
                        }
                      />
                      Require Remarks (per line)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={draft.dataApplicability.requireAttachments}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'requireAttachments',
                              event.target.checked
                            ),
                          }))
                        }
                      />
                      Require Attachments
                    </label>
                  </div>
                  {draft.dataApplicability.requireAttachments && (
                    <div className="md:col-span-2">
                      <FormField label="Attachment Evidence Upload">
                        <Input type="file" disabled={isReadOnly} />
                      </FormField>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Entry Criteria</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Entry Criteria Type" required>
                    <Select
                      value={draft.dataApplicability.entryCriteriaType}
                      error={fieldErrors.entryCriteriaType}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'entryCriteriaType',
                            event.target.value as EntryCriteriaType | ''
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select criteria type' },
                        ...entryCriteriaTypeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                  </FormField>

                  <label className="inline-flex items-center gap-2 self-end text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={draft.dataApplicability.reevaluateOnEdit}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'reevaluateOnEdit',
                            event.target.checked
                          ),
                        }))
                      }
                    />
                    Re-evaluate on Edit
                  </label>

                  {(draft.dataApplicability.entryCriteriaType === 'Condition' ||
                    draft.dataApplicability.entryCriteriaType === 'Hybrid') && (
                    <div className="md:col-span-2">
                      <FormField label="Condition Builder Rules">
                        <Textarea
                          rows={3}
                          value={draft.dataApplicability.conditionBuilderRules}
                          error={fieldErrors.conditionBuilderRules}
                          readOnly={isReadOnly}
                          placeholder="(field op value) + logical connectors"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'conditionBuilderRules',
                                event.target.value
                              ),
                            }))
                          }
                        />
                      </FormField>
                    </div>
                  )}

                  {(draft.dataApplicability.entryCriteriaType === 'Formula' ||
                    draft.dataApplicability.entryCriteriaType === 'Hybrid') && (
                    <div className="md:col-span-2">
                      <FormField label="Formula Expression">
                        <Textarea
                          rows={3}
                          value={draft.dataApplicability.formulaExpression}
                          error={fieldErrors.formulaExpression}
                          readOnly={isReadOnly}
                          placeholder="Boolean formula expression"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'formulaExpression',
                                event.target.value
                              ),
                            }))
                          }
                        />
                      </FormField>
                    </div>
                  )}

                  {(draft.dataApplicability.entryCriteriaType === 'Decision Table' ||
                    draft.dataApplicability.entryCriteriaType === 'Hybrid') && (
                    <FormField label="Decision Table Reference">
                      <Select
                        value={draft.dataApplicability.decisionTableReference}
                        error={fieldErrors.decisionTableReference}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'decisionTableReference',
                              event.target.value
                            ),
                          }))
                        }
                        options={[
                          { value: '', label: 'Select decision table reference' },
                          ...decisionReferenceOptions.map((value) => ({ value, label: value })),
                        ]}
                      />
                    </FormField>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Rule Inputs</h4>
                <div className="grid gap-4">
                  <FormField label="Input Set Name" required>
                    <Input
                      value={draft.dataApplicability.inputSetName}
                      maxLength={80}
                      error={fieldErrors.inputSetName}
                      readOnly={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'inputSetName',
                            event.target.value
                          ),
                        }))
                      }
                    />
                  </FormField>

                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <table className="w-full min-w-[980px]">
                      <thead className="bg-[var(--color-table-header)]">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Input Code</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Data Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Source Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Source Mapping</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Default Value</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Null Handling</th>
                          <th className="w-12 px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {draft.dataApplicability.ruleInputs.map((row) => (
                          <tr key={row.id} className="border-t border-[var(--color-border)]">
                            <td className="px-3 py-2">
                              <Input
                                value={row.inputCode}
                                maxLength={50}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id ? { ...input, inputCode: event.target.value } : input
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Select
                                value={row.dataType}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id
                                          ? { ...input, dataType: event.target.value as RuleInputDataType | '' }
                                          : input
                                      ),
                                    },
                                  }))
                                }
                                options={[
                                  { value: '', label: 'Select' },
                                  ...ruleInputDataTypeOptions.map((value) => ({ value, label: value })),
                                ]}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Select
                                value={row.sourceType}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id
                                          ? { ...input, sourceType: event.target.value as RuleInputSourceType | '' }
                                          : input
                                      ),
                                    },
                                  }))
                                }
                                options={[
                                  { value: '', label: 'Select' },
                                  ...ruleInputSourceTypeOptions.map((value) => ({ value, label: value })),
                                ]}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.sourceMapping}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id ? { ...input, sourceMapping: event.target.value } : input
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.defaultValue}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id ? { ...input, defaultValue: event.target.value } : input
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Select
                                value={row.nullHandling}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      ruleInputs: current.dataApplicability.ruleInputs.map((input) =>
                                        input.id === row.id
                                          ? { ...input, nullHandling: event.target.value as RuleInputNullHandling | '' }
                                          : input
                                      ),
                                    },
                                  }))
                                }
                                options={[
                                  { value: '', label: 'Select' },
                                  ...ruleInputNullHandlingOptions.map((value) => ({ value, label: value })),
                                ]}
                              />
                            </td>
                            <td className="px-3 py-2">
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.filter((input) => input.id !== row.id),
                                      },
                                    }))
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!isReadOnly && (
                    <div>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: {
                              ...current.dataApplicability,
                              ruleInputs: [...current.dataApplicability.ruleInputs, createRuleInputRow()],
                            },
                          }))
                        }
                      >
                        <Plus size={14} />
                        Add Input Row
                      </button>
                    </div>
                  )}
                  {fieldErrors.ruleInputs && <p className="field-error">{fieldErrors.ruleInputs}</p>}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Derivations</h4>
                <div className="space-y-3">
                  {draft.dataApplicability.derivationRules.map((row) => (
                    <div key={row.id} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
                      <Input
                        value={row.derivedOutputCode}
                        readOnly={isReadOnly}
                        placeholder="Derived Output Code"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: {
                              ...current.dataApplicability,
                              derivationRules: current.dataApplicability.derivationRules.map((item) =>
                                item.id === row.id ? { ...item, derivedOutputCode: event.target.value } : item
                              ),
                            },
                          }))
                        }
                      />
                      <Input
                        value={row.derivationExpression}
                        readOnly={isReadOnly}
                        placeholder="Derivation Expression"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: {
                              ...current.dataApplicability,
                              derivationRules: current.dataApplicability.derivationRules.map((item) =>
                                item.id === row.id ? { ...item, derivationExpression: event.target.value } : item
                              ),
                            },
                          }))
                        }
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: {
                                ...current.dataApplicability,
                                derivationRules: current.dataApplicability.derivationRules.filter((item) => item.id !== row.id),
                              },
                            }))
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: {
                            ...current.dataApplicability,
                            derivationRules: [...current.dataApplicability.derivationRules, createDerivationRuleRow()],
                          },
                        }))
                      }
                    >
                      <Plus size={14} />
                      Add Derivation Rule
                    </button>
                  )}
                  {fieldErrors.derivationRules && <p className="field-error">{fieldErrors.derivationRules}</p>}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Decision Tables</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Decision Table Name" required>
                    <Input
                      value={draft.dataApplicability.decisionTableName}
                      maxLength={100}
                      error={fieldErrors.decisionTableName}
                      readOnly={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'decisionTableName',
                            event.target.value
                          ),
                        }))
                      }
                    />
                  </FormField>

                  <FormField label="Hit Policy" required>
                    <Select
                      value={draft.dataApplicability.decisionTableHitPolicy}
                      error={fieldErrors.decisionTableHitPolicy}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'decisionTableHitPolicy',
                            event.target.value as DecisionTableHitPolicy | ''
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select hit policy' },
                        ...decisionTableHitPolicyOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                  </FormField>

                  <FormField label="Version">
                    <div className="brand-badge">{draft.dataApplicability.decisionTableVersion}</div>
                  </FormField>

                  <FormField label="Status">
                    <div className={cn('brand-badge', draft.dataApplicability.decisionTableStatus === 'Active' ? 'brand-badge--approved' : draft.dataApplicability.decisionTableStatus === 'Retired' ? 'brand-badge--cancelled' : 'brand-badge--draft')}>
                      {draft.dataApplicability.decisionTableStatus}
                    </div>
                  </FormField>

                  <div className="md:col-span-2">
                    <DualListboxField
                      label="Input Columns"
                      availableItems={draft.dataApplicability.ruleInputs.map((row) => row.inputCode).filter(Boolean)}
                      selectedItems={draft.dataApplicability.decisionInputColumns}
                      disabled={isReadOnly}
                      onChange={(nextItems) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'decisionInputColumns',
                            nextItems
                          ),
                        }))
                      }
                    />
                    {fieldErrors.decisionInputColumns && <p className="field-error">{fieldErrors.decisionInputColumns}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <DualListboxField
                      label="Output Columns"
                      availableItems={decisionOutputKeyOptions}
                      selectedItems={draft.dataApplicability.decisionOutputColumns}
                      disabled={isReadOnly}
                      onChange={(nextItems) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'decisionOutputColumns',
                            nextItems
                          ),
                        }))
                      }
                    />
                    {fieldErrors.decisionOutputColumns && <p className="field-error">{fieldErrors.decisionOutputColumns}</p>}
                  </div>

                  <div className="md:col-span-2 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <table className="w-full min-w-[760px]">
                      <thead className="bg-[var(--color-table-header)]">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Condition</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Output</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Priority</th>
                          <th className="w-12 px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {draft.dataApplicability.decisionRows.map((row) => (
                          <tr key={row.id} className="border-t border-[var(--color-border)]">
                            <td className="px-3 py-2">
                              <Input
                                value={row.conditionExpression}
                                readOnly={isReadOnly}
                                placeholder="Ranges / Equals / In"
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                        item.id === row.id ? { ...item, conditionExpression: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.outputValue}
                                readOnly={isReadOnly}
                                placeholder="Output key value"
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                        item.id === row.id ? { ...item, outputValue: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={row.priority}
                                readOnly={isReadOnly}
                                inputMode="numeric"
                                placeholder="Priority"
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    dataApplicability: {
                                      ...current.dataApplicability,
                                      decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                        item.id === row.id ? { ...item, priority: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        decisionRows: current.dataApplicability.decisionRows.filter((item) => item.id !== row.id),
                                      },
                                    }))
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!isReadOnly && (
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: {
                              ...current.dataApplicability,
                              decisionRows: [...current.dataApplicability.decisionRows, createDecisionRow()],
                            },
                          }))
                        }
                      >
                        <Plus size={14} />
                        Add Decision Row
                      </button>
                    </div>
                  )}
                  {fieldErrors.decisionRows && <p className="field-error md:col-span-2">{fieldErrors.decisionRows}</p>}

                  <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Overlap Detection
                      </div>
                      <div className={cn('mt-2 brand-badge', draft.dataApplicability.overlapDetectionPass ? 'brand-badge--approved' : 'brand-badge--rejected')}>
                        {draft.dataApplicability.overlapDetectionPass ? 'Pass' : 'Fail'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Activation Validation
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-[var(--color-text)]">
                        {draft.dataApplicability.activationValidationChecks.length === 0 && <li>No checks available</li>}
                        {draft.dataApplicability.activationValidationChecks.map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">3.1 Approval Flow</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Approval Flow Type"
                      required
                      tooltip={
                        <TooltipPointerList
                          items={[
                            { label: 'Single', description: 'One approval step only.' },
                            { label: 'Sequential', description: 'Approval moves one by one.' },
                            { label: 'Parallel', description: 'Multiple approvers receive approval together.' },
                            { label: 'Conditional', description: 'Route changes based on rules.' },
                          ]}
                        />
                      }
                    />
                    <Select
                      value={draft.approvalSection.flowType}
                      disabled={isReadOnly}
                      error={fieldErrors.approvalFlowType}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          approvalSection: { ...current.approvalSection, flowType: event.target.value as ApprovalFlowType },
                        }))
                      }
                      options={[
                        { value: '', label: 'Select approval flow type' },
                        ...approvalFlowTypeOptions.map((value) => ({ value, label: value })),
                      ]}
                    />
                    {fieldErrors.approvalFlowType && <p className="field-error mt-1">{fieldErrors.approvalFlowType}</p>}
                  </div>
                  {draft.approvalSection.setupMode === 'Detailed Setup' && (
                    <div>
                      <InfoLabel
                        label="Stage Setup Required"
                        tooltip="Enable this if approval needs multiple stages such as Branch Approval, Finance Approval, and Management Approval."
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.approvalSection.stageSetupRequired}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: { ...current.approvalSection, stageSetupRequired: event.target.checked },
                            }))
                          }
                        />
                        Yes
                      </label>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">3.2 Stages &amp; Steps</h4>
                  {!isReadOnly && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        disabled={draft.approvalSection.setupMode === 'Quick Setup'}
                        onClick={() =>
                          setDraft((current) => {
                            const nextSteps = [...current.approvalSection.steps, createApprovalStep()].map((step, idx) => ({
                              ...step,
                              stageSequence: idx + 1,
                              stepSequence: idx + 1,
                            }));
                            return {
                              ...current,
                              approvalSection: { ...current.approvalSection, steps: nextSteps },
                            };
                          })
                        }
                      >
                        <Plus size={14} />
                        Add Stage
                      </button>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => {
                            const nextSteps = [...current.approvalSection.steps, createApprovalStep()].map((step, idx) => ({
                              ...step,
                              stageSequence: idx + 1,
                              stepSequence: idx + 1,
                            }));
                            return {
                              ...current,
                              approvalSection: { ...current.approvalSection, steps: nextSteps },
                            };
                          })
                        }
                      >
                        <Plus size={14} />
                        Add Step
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {draft.approvalSection.steps.map((stepConfig, index) => (
                    <div key={stepConfig.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text)]">Step {index + 1}</span>
                        {!isReadOnly && (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={index === 0}
                              onClick={() =>
                                setDraft((current) => {
                                  const nextSteps = [...current.approvalSection.steps];
                                  [nextSteps[index - 1], nextSteps[index]] = [nextSteps[index], nextSteps[index - 1]];
                                  return {
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: nextSteps.map((step, idx) => ({ ...step, stageSequence: idx + 1, stepSequence: idx + 1 })),
                                    },
                                  };
                                })
                              }
                            >
                              <MoveUp size={14} />
                              Move Step Up
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={index === draft.approvalSection.steps.length - 1}
                              onClick={() =>
                                setDraft((current) => {
                                  const nextSteps = [...current.approvalSection.steps];
                                  [nextSteps[index], nextSteps[index + 1]] = [nextSteps[index + 1], nextSteps[index]];
                                  return {
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: nextSteps.map((step, idx) => ({ ...step, stageSequence: idx + 1, stepSequence: idx + 1 })),
                                    },
                                  };
                                })
                              }
                            >
                              <MoveDown size={14} />
                              Move Step Down
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm text-[var(--color-danger)]"
                              disabled={draft.approvalSection.steps.length === 1}
                              onClick={() =>
                                setDraft((current) => {
                                  if (current.approvalSection.steps.length === 1) {
                                    return current;
                                  }
                                  const shouldRemove =
                                    !stepConfig.stageName.trim() ||
                                    window.confirm('This stage/step will be removed. Do you want to continue?');
                                  if (!shouldRemove) {
                                    return current;
                                  }
                                  const nextSteps = current.approvalSection.steps
                                    .filter((item) => item.id !== stepConfig.id)
                                    .map((step, idx) => ({ ...step, stageSequence: idx + 1, stepSequence: idx + 1 }));
                                  return {
                                    ...current,
                                    approvalSection: { ...current.approvalSection, steps: nextSteps },
                                  };
                                })
                              }
                            >
                              <Trash2 size={14} />
                              Remove Step
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {(draft.approvalSection.setupMode === 'Detailed Setup' || draft.approvalSection.flowType !== 'Single') && (
                          <div>
                            <InfoLabel label="Stage Name" tooltip="Stage is a group of approval steps." />
                            <Input
                              value={stepConfig.stageName}
                              maxLength={80}
                              readOnly={isReadOnly}
                              placeholder="Example: Level 1 Approval"
                              error={fieldErrors[`approvalStep_${index}_stageName`]}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  approvalSection: {
                                    ...current.approvalSection,
                                    steps: current.approvalSection.steps.map((item) =>
                                      item.id === stepConfig.id ? { ...item, stageName: event.target.value } : item
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                        )}
                        {(draft.approvalSection.setupMode === 'Detailed Setup' || draft.approvalSection.flowType !== 'Single') && (
                          <FormField label="Stage Sequence">
                            <Input value={String(stepConfig.stageSequence || index + 1)} readOnly />
                          </FormField>
                        )}
                        {(draft.approvalSection.setupMode === 'Detailed Setup' || draft.approvalSection.steps.length > 1) && (
                          <div>
                            <InfoLabel label="Stage Execution Mode" tooltip="Defines how approval steps inside this stage will run." />
                            <Select
                              value={stepConfig.stageExecutionMode}
                              disabled={isReadOnly}
                              error={fieldErrors[`approvalStep_${index}_stageExecutionMode`]}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  approvalSection: {
                                    ...current.approvalSection,
                                    steps: current.approvalSection.steps.map((item) =>
                                      item.id === stepConfig.id
                                        ? { ...item, stageExecutionMode: event.target.value as ApprovalStepConfig['stageExecutionMode'] }
                                        : item
                                    ),
                                  },
                                }))
                              }
                              options={[
                                { value: '', label: 'Select stage execution mode' },
                                ...stageExecutionModeOptions.map((value) => ({ value, label: value })),
                              ]}
                            />
                          </div>
                        )}
                        <div>
                          <InfoLabel label="Step Name" required tooltip="Step is the actual approval action." />
                          <Input
                            value={stepConfig.stepName}
                            maxLength={80}
                            readOnly={isReadOnly}
                            placeholder="Example: Branch Manager Approval"
                            error={fieldErrors[`approvalStep_${index}_stepName`]}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  steps: current.approvalSection.steps.map((item) =>
                                    item.id === stepConfig.id ? { ...item, stepName: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                        <FormField label="Step Sequence">
                          <Input value={String(stepConfig.stepSequence || index + 1)} readOnly />
                        </FormField>
                        <div className="md:col-span-2">
                          <InfoLabel label="Step Description" tooltip="Write a short explanation of this approval step." />
                          <Textarea
                            rows={2}
                            maxLength={255}
                            readOnly={isReadOnly}
                            value={stepConfig.stepDescription}
                            placeholder="Write the purpose of this approval step."
                            error={fieldErrors[`approvalStep_${index}_stepDescription`]}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  steps: current.approvalSection.steps.map((item) =>
                                    item.id === stepConfig.id ? { ...item, stepDescription: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <InfoLabel label="Required Approvals" required tooltip="Defines how many approvers are required to complete this step." />
                          <Select
                            value={stepConfig.requiredApprovals}
                            disabled={isReadOnly}
                            error={fieldErrors[`approvalStep_${index}_requiredApprovals`]}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  steps: current.approvalSection.steps.map((item) =>
                                    item.id === stepConfig.id
                                      ? { ...item, requiredApprovals: event.target.value as RequiredApprovalsMode }
                                      : item
                                  ),
                                },
                              }))
                            }
                            options={requiredApprovalModeOptions.map((value) => ({ value, label: value }))}
                          />
                        </div>
                        {stepConfig.requiredApprovals === 'N-of-M' && (
                          <div>
                            <InfoLabel label="Required Approval Count" required tooltip="Enter how many approvals are required from total approvers." />
                            <Input
                              value={stepConfig.requiredApprovalCount}
                              inputMode="numeric"
                              readOnly={isReadOnly}
                              placeholder="Example: 2"
                              error={fieldErrors[`approvalStep_${index}_requiredApprovalCount`]}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  approvalSection: {
                                    ...current.approvalSection,
                                    steps: current.approvalSection.steps.map((item) =>
                                      item.id === stepConfig.id ? { ...item, requiredApprovalCount: event.target.value } : item
                                    ),
                                  },
                                }))
                              }
                            />
                          </div>
                        )}
                        <div>
                          <FormField label="Total Resolved Approver Count">
                            <Input
                              value={stepConfig.totalApproverCount}
                              inputMode="numeric"
                              readOnly={isReadOnly}
                              placeholder="Example: 5"
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  approvalSection: {
                                    ...current.approvalSection,
                                    steps: current.approvalSection.steps.map((item) =>
                                      item.id === stepConfig.id ? { ...item, totalApproverCount: event.target.value } : item
                                    ),
                                  },
                                }))
                              }
                            />
                          </FormField>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">3.3 Approver Resolution</h4>
                {draft.approvalSection.setupMode === 'Detailed Setup' && (
                  <label className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={draft.approvalSection.approverAvailabilityCheck}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          approvalSection: { ...current.approvalSection, approverAvailabilityCheck: event.target.checked },
                        }))
                      }
                    />
                    Approver Availability Check
                  </label>
                )}
                <div className="space-y-3">
                  {draft.approvalSection.steps.map((stepConfig, index) => {
                    const availableResolutionOptions =
                      draft.approvalSection.setupMode === 'Quick Setup'
                        ? resolutionTypeOptions.filter(
                            (item) => item !== 'Approver Routing Matrix' && item !== 'Attribute Rule'
                          )
                        : resolutionTypeOptions;
                    return (
                      <div key={stepConfig.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          Step {index + 1}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <InfoLabel
                              label="Resolution Type"
                              required
                              tooltip="Select how the approver should be identified."
                            />
                            <Select
                              value={stepConfig.resolutionType}
                              disabled={isReadOnly}
                              error={fieldErrors[`approvalStep_${index}_resolutionType`]}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  approvalSection: {
                                    ...current.approvalSection,
                                    steps: current.approvalSection.steps.map((item) =>
                                      item.id === stepConfig.id
                                        ? { ...item, resolutionType: event.target.value as ResolutionType }
                                        : item
                                    ),
                                  },
                                }))
                              }
                              options={[
                                { value: '', label: 'Select resolution type' },
                                ...availableResolutionOptions.map((value) => ({ value, label: value })),
                              ]}
                            />
                          </div>
                          <div>
                            <InfoLabel label="Allow Multiple Approvers" tooltip="Enable this when more than one approver can be assigned." />
                            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                              <input
                                type="checkbox"
                                checked={stepConfig.allowMultipleApprovers}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id ? { ...item, allowMultipleApprovers: event.target.checked } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                              Yes
                            </label>
                          </div>

                          {stepConfig.resolutionType === 'Role' && (
                            <FormField label="Role">
                              <Input
                                value={stepConfig.role}
                                readOnly={isReadOnly}
                                placeholder="Select role"
                                error={fieldErrors[`approvalStep_${index}_role`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id ? { ...item, role: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                          {stepConfig.resolutionType === 'User' && (
                            <FormField label="User(s)">
                              <Input
                                value={stepConfig.users.join(', ')}
                                readOnly={isReadOnly}
                                placeholder="Select user(s)"
                                error={fieldErrors[`approvalStep_${index}_users`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id
                                          ? {
                                              ...item,
                                              users: event.target.value
                                                .split(',')
                                                .map((value) => value.trim())
                                                .filter(Boolean),
                                            }
                                          : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                          {stepConfig.resolutionType === 'Queue' && (
                            <FormField label="Queue">
                              <Input
                                value={stepConfig.queue}
                                readOnly={isReadOnly}
                                placeholder="Select queue"
                                error={fieldErrors[`approvalStep_${index}_queue`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id ? { ...item, queue: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                          {stepConfig.resolutionType === 'Hierarchy' && (
                            <FormField label="Manager Level">
                              <Input
                                value={stepConfig.managerLevel}
                                readOnly={isReadOnly}
                                inputMode="numeric"
                                placeholder="Example: 1"
                                error={fieldErrors[`approvalStep_${index}_managerLevel`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id ? { ...item, managerLevel: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                          {stepConfig.resolutionType === 'Approver Routing Matrix' && (
                            <FormField label="Approver Routing Matrix">
                              <Input
                                value={stepConfig.approverRoutingMatrix}
                                readOnly={isReadOnly}
                                placeholder="Select approver routing matrix"
                                error={fieldErrors[`approvalStep_${index}_approverRoutingMatrix`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id
                                          ? { ...item, approverRoutingMatrix: event.target.value }
                                          : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                          {stepConfig.resolutionType === 'Attribute Rule' && (
                            <FormField label="Attribute Rule Reference">
                              <Input
                                value={stepConfig.attributeRuleReference}
                                readOnly={isReadOnly}
                                placeholder="Select attribute rule"
                                error={fieldErrors[`approvalStep_${index}_attributeRuleReference`]}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    approvalSection: {
                                      ...current.approvalSection,
                                      steps: current.approvalSection.steps.map((item) =>
                                        item.id === stepConfig.id
                                          ? { ...item, attributeRuleReference: event.target.value }
                                          : item
                                      ),
                                    },
                                  }))
                                }
                              />
                            </FormField>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">3.4 Fallback</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <InfoLabel label="Missing Approver Action" required tooltip="Select what system should do if approver is not found." />
                    <Select
                      value={draft.approvalSection.missingApproverAction}
                      disabled={isReadOnly}
                      error={fieldErrors.missingApproverAction}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          approvalSection: { ...current.approvalSection, missingApproverAction: event.target.value as MissingApproverAction },
                        }))
                      }
                      options={missingApproverActionOptions.map((value) => ({ value, label: value }))}
                    />
                  </div>
                </div>
                {draft.approvalSection.missingApproverAction === 'Use Fallback Chain' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <InfoLabel label="Fallback Chain" required tooltip="Backup route if main approver is missing." />
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: {
                                ...current.approvalSection,
                                fallbackChain: [...current.approvalSection.fallbackChain, createFallbackLevel()],
                              },
                            }))
                          }
                        >
                          <Plus size={14} />
                          Add Fallback Level
                        </button>
                      )}
                    </div>
                    {draft.approvalSection.fallbackChain.map((fallback, index) => (
                      <div key={fallback.id} className="grid gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[180px_1fr_auto]">
                        <Select
                          value={fallback.type}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: {
                                ...current.approvalSection,
                                fallbackChain: current.approvalSection.fallbackChain.map((item) =>
                                  item.id === fallback.id ? { ...item, type: event.target.value as FallbackLevelType } : item
                                ),
                              },
                            }))
                          }
                          options={fallbackTypeOptions.map((value) => ({ value, label: value }))}
                        />
                        <Input
                          value={fallback.value}
                          readOnly={isReadOnly}
                          placeholder={index === draft.approvalSection.fallbackChain.length - 1 ? 'Final fallback' : 'Fallback value'}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: {
                                ...current.approvalSection,
                                fallbackChain: current.approvalSection.fallbackChain.map((item) =>
                                  item.id === fallback.id ? { ...item, value: event.target.value } : item
                                ),
                              },
                            }))
                          }
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm text-[var(--color-danger)]"
                            disabled={draft.approvalSection.fallbackChain.length === 1}
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  fallbackChain: current.approvalSection.fallbackChain.filter((item) => item.id !== fallback.id),
                                },
                              }))
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {fieldErrors.fallbackChain && <p className="field-error">{fieldErrors.fallbackChain}</p>}
                    <div>
                      <InfoLabel label="Final Fallback Owner" required tooltip="Final owner if all fallback levels fail." />
                      <Input
                        value={draft.approvalSection.finalFallbackOwner}
                        readOnly={isReadOnly}
                        placeholder="Select final fallback owner"
                        error={fieldErrors.finalFallbackOwner}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            approvalSection: { ...current.approvalSection, finalFallbackOwner: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">3.5 Governance</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={draft.approvalSection.segregationOfDuties}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          approvalSection: { ...current.approvalSection, segregationOfDuties: event.target.checked },
                        }))
                      }
                    />
                    Segregation of Duties
                  </label>
                  {draft.approvalSection.segregationOfDuties &&
                    ['Queue', 'User', 'Approver Routing Matrix', 'Attribute Rule'].includes(
                      draft.approvalSection.steps[0]?.resolutionType || ''
                    ) && (
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.approvalSection.allowRequesterInApprovalQueue}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: { ...current.approvalSection, allowRequesterInApprovalQueue: event.target.checked },
                            }))
                          }
                        />
                        Allow Requester in Approval Queue
                      </label>
                    )}

                  {draft.approvalSection.setupMode === 'Detailed Setup' && (
                    <>
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.approvalSection.delegationAllowed}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: { ...current.approvalSection, delegationAllowed: event.target.checked },
                            }))
                          }
                        />
                        Delegation Allowed
                      </label>
                      {draft.approvalSection.delegationAllowed && (
                        <FormField label="Delegation Source">
                          <Select
                            value={draft.approvalSection.delegationSource}
                            disabled={isReadOnly}
                            error={fieldErrors.delegationSource}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  delegationSource: event.target.value as DelegationSource,
                                },
                              }))
                            }
                            options={[{ value: '', label: 'Select delegation source' }, ...delegationSourceOptions.map((value) => ({ value, label: value }))]}
                          />
                        </FormField>
                      )}

                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.approvalSection.reassignmentAllowed}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: { ...current.approvalSection, reassignmentAllowed: event.target.checked },
                            }))
                          }
                        />
                        Reassignment Allowed
                      </label>
                      {draft.approvalSection.reassignmentAllowed && (
                        <FormField label="Reassignment Authority">
                          <Select
                            value={draft.approvalSection.reassignmentAuthority}
                            disabled={isReadOnly}
                            error={fieldErrors.reassignmentAuthority}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: {
                                  ...current.approvalSection,
                                  reassignmentAuthority: event.target.value as ReassignmentAuthority,
                                },
                              }))
                            }
                            options={[{ value: '', label: 'Select reassignment authority' }, ...reassignmentAuthorityOptions.map((value) => ({ value, label: value }))]}
                          />
                        </FormField>
                      )}

                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.approvalSection.bulkApprovalAllowed}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              approvalSection: { ...current.approvalSection, bulkApprovalAllowed: event.target.checked },
                            }))
                          }
                        />
                        Bulk Approval Allowed
                      </label>
                      {draft.approvalSection.bulkApprovalAllowed && (
                        <FormField label="Maximum Bulk Approval Count">
                          <Input
                            value={draft.approvalSection.maxBulkApprovalCount}
                            inputMode="numeric"
                            readOnly={isReadOnly}
                            placeholder="Example: 50"
                            error={fieldErrors.maxBulkApprovalCount}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                approvalSection: { ...current.approvalSection, maxBulkApprovalCount: event.target.value },
                              }))
                            }
                          />
                        </FormField>
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">3.6 Preview &amp; Validation</h4>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                    <div><strong>Approval Flow Type:</strong> {draft.approvalSection.flowType || '-'}</div>
                    <div><strong>Stage Name:</strong> {draft.approvalSection.steps.map((step) => step.stageName || '-').join(', ')}</div>
                    <div><strong>Stage Sequence:</strong> {draft.approvalSection.steps.map((step) => String(step.stageSequence || 1)).join(', ')}</div>
                    <div><strong>Stage Execution Mode:</strong> {draft.approvalSection.steps.map((step) => step.stageExecutionMode || '-').join(', ')}</div>
                    <div><strong>Step Name:</strong> {draft.approvalSection.steps.map((step) => step.stepName || '-').join(', ')}</div>
                    <div><strong>Step Sequence:</strong> {draft.approvalSection.steps.map((step) => String(step.stepSequence || 1)).join(', ')}</div>
                    <div><strong>Required Approvals:</strong> {draft.approvalSection.steps.map((step) => step.requiredApprovals).join(', ')}</div>
                    <div><strong>Required Approval Count:</strong> {draft.approvalSection.steps.map((step) => step.requiredApprovalCount || '-').join(', ')}</div>
                    <div><strong>Resolution Type:</strong> {draft.approvalSection.steps.map((step) => step.resolutionType || '-').join(', ')}</div>
                    <div><strong>Fallback Chain:</strong> {draft.approvalSection.fallbackChain.map((item) => `${item.type}:${item.value || '-'}`).join(' -> ')}</div>
                    <div><strong>Final Fallback Owner:</strong> {draft.approvalSection.finalFallbackOwner || '-'}</div>
                    <div><strong>Segregation of Duties:</strong> {draft.approvalSection.segregationOfDuties ? 'Yes' : 'No'}</div>
                    <div><strong>Delegation:</strong> {draft.approvalSection.delegationAllowed ? 'Enabled' : 'Disabled'}</div>
                    <div><strong>Reassignment:</strong> {draft.approvalSection.reassignmentAllowed ? 'Enabled' : 'Disabled'}</div>
                    <div><strong>Bulk Approval:</strong> {draft.approvalSection.bulkApprovalAllowed ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <h5 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Approver Validation Summary</h5>
                    <div className="space-y-2">
                      {approvalValidationChecklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-sm">
                          <span className={cn('mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]', item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                            {item.passed ? <Check size={10} /> : '!'}
                          </span>
                          <span className={item.passed ? 'text-[var(--color-text)]' : 'text-rose-700'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">4.1 Rule Method</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <InfoLabel
                      label="Selected Entry Criteria Type"
                      required
                      tooltip="Shows how approval applicability will be decided and controls which rule sections are shown."
                    />
                    <div className={cn('brand-badge', selectedEntryCriteriaType ? 'brand-badge--draft' : 'brand-badge--cancelled')}>
                      {selectedEntryCriteriaType || 'Not selected'}
                    </div>
                    {!selectedEntryCriteriaType && <p className="field-error mt-1">Entry criteria type is missing.</p>}
                  </div>
                  <div className="flex items-end">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setCurrentStep(1)}>
                      Edit Trigger
                    </button>
                  </div>

                  <div>
                    <InfoLabel
                      label="Rule Set Name"
                      required
                      tooltip="Enter a name for this rule setup. Example: High Value PO Approval Rule."
                    />
                    <Input
                      value={rulesData.ruleSetName ?? ''}
                      maxLength={80}
                      readOnly={isReadOnly}
                      error={fieldErrors.ruleSetName}
                      placeholder="Example: High Value Job Card Labour Approval Rule"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'ruleSetName',
                            event.target.value
                          ),
                        }))
                      }
                    />
                    {fieldErrors.ruleSetName && <p className="field-error mt-1">{fieldErrors.ruleSetName}</p>}
                  </div>

                  <div>
                    <InfoLabel
                      label="Rule Set Description"
                      tooltip="Write a short explanation of what this rule set checks."
                    />
                    <Textarea
                      value={rulesData.ruleSetDescription ?? ''}
                      maxLength={255}
                      rows={3}
                      readOnly={isReadOnly}
                      error={fieldErrors.ruleSetDescription}
                      placeholder="Write short explanation of what this rule checks."
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'ruleSetDescription',
                            event.target.value
                          ),
                        }))
                      }
                    />
                    {fieldErrors.ruleSetDescription && <p className="field-error mt-1">{fieldErrors.ruleSetDescription}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">4.2 Rule Inputs</h4>
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: {
                            ...current.dataApplicability,
                            ruleInputs: [...current.dataApplicability.ruleInputs, createRuleInputRow()],
                          },
                        }))
                      }
                    >
                      <Plus size={14} />
                      Add input
                    </button>
                  )}
                </div>
                <div className="grid gap-4">
                  <div className="md:max-w-xl">
                    <InfoLabel
                      label="Input Set Name"
                      required
                      tooltip="Input set is a group of values used by approval rules."
                    />
                    <Input
                      value={rulesData.inputSetName}
                      maxLength={80}
                      readOnly={isReadOnly}
                      error={fieldErrors.inputSetName}
                      placeholder="Example: Job Card Approval Inputs"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'inputSetName',
                            event.target.value
                          ),
                        }))
                      }
                    />
                    {fieldErrors.inputSetName && <p className="field-error mt-1">{fieldErrors.inputSetName}</p>}
                  </div>

                  {fieldErrors.ruleInputs && <p className="field-error">{fieldErrors.ruleInputs}</p>}
                  {fieldErrors.ruleInputCodes && <p className="field-error">{fieldErrors.ruleInputCodes}</p>}

                  <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <table className="w-full min-w-[1400px]">
                      <thead className="bg-[var(--color-table-header)]">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Input Code</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Input Display Name</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Input Data Type</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Source Type</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Source Mapping</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Constant Value</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Default Value</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Null Handling</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Mandatory</th>
                          <th className="w-12 px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {rulesData.ruleInputs.map((row, index) => {
                          const prefix = `ruleInput_${row.id || index}`;
                          const isConstantSource = row.sourceType === 'Constant';
                          return (
                            <tr key={row.id} className="border-t border-[var(--color-border)] align-top">
                              <td className="px-2 py-2">
                                <Input
                                  value={row.inputCode}
                                  maxLength={50}
                                  readOnly={isReadOnly}
                                  error={fieldErrors[`${prefix}_inputCode`]}
                                  placeholder="LABOUR_TOTAL_AMOUNT"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id ? { ...item, inputCode: event.target.value.toUpperCase() } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.inputDisplayName ?? ''}
                                  maxLength={100}
                                  readOnly={isReadOnly}
                                  error={fieldErrors[`${prefix}_inputDisplayName`]}
                                  placeholder="Labour Total Amount"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id ? { ...item, inputDisplayName: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Select
                                  value={row.dataType}
                                  disabled={isReadOnly}
                                  error={fieldErrors[`${prefix}_dataType`]}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id
                                            ? { ...item, dataType: event.target.value as RuleInputDataType | '' }
                                            : item
                                        ),
                                      },
                                    }))
                                  }
                                  options={[
                                    { value: '', label: 'Select type' },
                                    ...ruleInputDataTypeOptions.map((option) => ({ value: option, label: option })),
                                  ]}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Select
                                  value={row.sourceType}
                                  disabled={isReadOnly}
                                  error={fieldErrors[`${prefix}_sourceType`]}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id
                                            ? {
                                                ...item,
                                                sourceType: event.target.value as RuleInputSourceType | '',
                                                sourceMapping:
                                                  event.target.value === 'Constant' ? '' : item.sourceMapping,
                                                constantValue:
                                                  event.target.value === 'Constant' ? item.constantValue ?? '' : '',
                                              }
                                            : item
                                        ),
                                      },
                                    }))
                                  }
                                  options={[
                                    { value: '', label: 'Select source' },
                                    ...ruleInputSourceTypeOptions.map((option) => ({ value: option, label: option })),
                                  ]}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.sourceMapping}
                                  readOnly={isReadOnly || isConstantSource}
                                  error={fieldErrors[`${prefix}_sourceMapping`]}
                                  placeholder="Record.FieldPath"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id ? { ...item, sourceMapping: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.constantValue ?? ''}
                                  readOnly={isReadOnly || !isConstantSource}
                                  error={fieldErrors[`${prefix}_constantValue`]}
                                  placeholder="Constant value"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id ? { ...item, constantValue: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.defaultValue}
                                  readOnly={isReadOnly}
                                  placeholder="Default value"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id ? { ...item, defaultValue: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Select
                                  value={row.nullHandling}
                                  disabled={isReadOnly}
                                  error={fieldErrors[`${prefix}_nullHandling`]}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                          item.id === row.id
                                            ? { ...item, nullHandling: event.target.value as RuleInputNullHandling | '' }
                                            : item
                                        ),
                                      },
                                    }))
                                  }
                                  options={[
                                    { value: '', label: 'Select null handling' },
                                    ...ruleInputNullHandlingOptions.map((option) => ({ value: option, label: option })),
                                  ]}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text)]">
                                  <input
                                    type="checkbox"
                                    checked={row.mandatoryForEvaluation ?? true}
                                    disabled={isReadOnly}
                                    onChange={(event) =>
                                      setDraft((current) => ({
                                        ...current,
                                        dataApplicability: {
                                          ...current.dataApplicability,
                                          ruleInputs: current.dataApplicability.ruleInputs.map((item) =>
                                            item.id === row.id
                                              ? { ...item, mandatoryForEvaluation: event.target.checked }
                                              : item
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                  Yes
                                </label>
                              </td>
                              <td className="px-2 py-2">
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    className="btn btn--ghost btn--sm"
                                    onClick={() =>
                                      setDraft((current) => ({
                                        ...current,
                                        dataApplicability: {
                                          ...current.dataApplicability,
                                          ruleInputs: current.dataApplicability.ruleInputs.filter((item) => item.id !== row.id),
                                        },
                                      }))
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {(showConditionRules || showFormulaRules) && (
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">4.3 Conditions &amp; Formula</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {showConditionRules && (
                      <div className="md:col-span-2">
                        <div className="approval-rule-builder">
                          <div className="approval-rule-builder__head">
                            <InfoLabel
                              label="Condition Builder Rules"
                              required
                              tooltip="Create approval conditions by selecting an input, operator, value, and result."
                            />
                            {!isReadOnly && (
                              <button
                                type="button"
                                className="btn btn--outline btn--sm"
                                onClick={() =>
                                  setDraft((current) => ({
                                    ...current,
                                    rules: [...current.rules, createRule()],
                                  }))
                                }
                              >
                                <Plus size={14} />
                                Add condition
                              </button>
                            )}
                          </div>
                          {draft.rules.length === 0 ? (
                            <div className="approval-rule-builder__empty">
                              <span>No conditions added yet.</span>
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  className="btn btn--primary btn--sm"
                                  onClick={() =>
                                    setDraft((current) => ({
                                      ...current,
                                      rules: [...current.rules, createRule()],
                                    }))
                                  }
                                >
                                  <Plus size={14} />
                                  Add first condition
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="approval-condition-grid">
                              <div className="approval-condition-grid__header">Input</div>
                              <div className="approval-condition-grid__header">Operator</div>
                              <div className="approval-condition-grid__header">Value</div>
                              <div className="approval-condition-grid__header">When matched</div>
                              <div className="approval-condition-grid__header" />
                              {draft.rules.map((rule, index) => (
                                <React.Fragment key={rule.id}>
                                  <div className="approval-condition-grid__cell">
                                    <Select
                                      value={rule.field}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          rules: current.rules.map((item) =>
                                            item.id === rule.id ? { ...item, field: event.target.value } : item
                                          ),
                                        }))
                                      }
                                      options={[
                                        { value: '', label: 'Select input' },
                                        ...rulesData.ruleInputs.map((input) => ({
                                          value: input.inputCode,
                                          label: input.inputDisplayName || input.inputCode || 'Unnamed input',
                                        })),
                                      ]}
                                    />
                                  </div>
                                  <div className="approval-condition-grid__cell">
                                    <Select
                                      value={rule.operator}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          rules: current.rules.map((item) =>
                                            item.id === rule.id ? { ...item, operator: event.target.value } : item
                                          ),
                                        }))
                                      }
                                      options={[
                                        { value: '', label: 'Select operator' },
                                        ...conditionOperatorOptions.map((option) => ({ value: option.value, label: option.label })),
                                      ]}
                                    />
                                  </div>
                                  <div className="approval-condition-grid__cell">
                                    <Input
                                      value={rule.value}
                                      readOnly={isReadOnly}
                                      placeholder={rule.operator === 'between' ? '50000 to 100000' : 'Example: 50000'}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          rules: current.rules.map((item) =>
                                            item.id === rule.id ? { ...item, value: event.target.value } : item
                                          ),
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="approval-condition-grid__cell">
                                    <Select
                                      value={rule.action}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          rules: current.rules.map((item) =>
                                            item.id === rule.id ? { ...item, action: event.target.value } : item
                                          ),
                                        }))
                                      }
                                      options={[
                                        { value: '', label: 'Select result' },
                                        ...ruleOutputWhenMatchedOptions.map((option) => ({ value: option, label: option })),
                                      ]}
                                    />
                                  </div>
                                  <div className="approval-condition-grid__cell approval-condition-grid__actions">
                                    <span className="approval-condition-grid__index">#{index + 1}</span>
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        className="btn btn--ghost btn--sm text-[var(--color-danger)]"
                                        onClick={() =>
                                          setDraft((current) => ({
                                            ...current,
                                            rules: current.rules.filter((item) => item.id !== rule.id),
                                          }))
                                        }
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                          {fieldErrors.conditionBuilderRules && <p className="field-error mt-2">{fieldErrors.conditionBuilderRules}</p>}
                        </div>
                      </div>
                    )}

                    {showConditionRules && draft.rules.length > 1 && (
                      <div>
                        <InfoLabel
                          label="Condition Logic"
                          tooltip="Choose how multiple conditions should be combined."
                        />
                        <Select
                          value={rulesData.conditionLogic ?? 'AND'}
                          disabled={isReadOnly}
                          error={fieldErrors.conditionLogic}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'conditionLogic',
                                event.target.value as ApprovalDataApplicabilitySettings['conditionLogic']
                              ),
                            }))
                          }
                          options={conditionLogicOptions.map((option) => ({ value: option, label: option }))}
                        />
                        {fieldErrors.conditionLogic && <p className="field-error mt-1">{fieldErrors.conditionLogic}</p>}
                      </div>
                    )}

                    {showFormulaRules && (
                      <>
                        <div className="md:col-span-2">
                          <InfoLabel
                            label="Formula Expression"
                            required
                            tooltip="Write formula that returns true or false. Approval applies only when formula result is true."
                          />
                          <Textarea
                            value={rulesData.formulaExpression}
                            rows={3}
                            readOnly={isReadOnly}
                            error={fieldErrors.formulaExpression}
                            placeholder="Example: NET_AMOUNT < THRESHOLD_LIMIT"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                dataApplicability: updateDataApplicabilitySetting(
                                  current.dataApplicability,
                                  'formulaExpression',
                                  event.target.value
                                ),
                              }))
                            }
                          />
                          {fieldErrors.formulaExpression && <p className="field-error mt-1">{fieldErrors.formulaExpression}</p>}
                        </div>

                        <div>
                          <InfoLabel label="Formula Test Result" tooltip="Shows whether formula works correctly using sample data." />
                          <div className={cn('brand-badge', rulesData.formulaTestResult === 'True' ? 'brand-badge--approved' : rulesData.formulaTestResult === 'Error' ? 'brand-badge--cancelled' : 'brand-badge--draft')}>
                            {rulesData.formulaTestResult || 'Not tested'}
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <InfoLabel
                        label="Rule Output When Matched"
                        required
                        tooltip="Decide what should happen when this rule is matched."
                      />
                      <Select
                        value={rulesData.ruleOutputWhenMatched ?? ''}
                        disabled={isReadOnly}
                        error={fieldErrors.ruleOutputWhenMatched}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'ruleOutputWhenMatched',
                              event.target.value as ApprovalDataApplicabilitySettings['ruleOutputWhenMatched']
                            ),
                          }))
                        }
                        options={[
                          { value: '', label: 'Select rule output' },
                          ...ruleOutputWhenMatchedOptions.map((option) => ({ value: option, label: option })),
                        ]}
                      />
                      {fieldErrors.ruleOutputWhenMatched && <p className="field-error mt-1">{fieldErrors.ruleOutputWhenMatched}</p>}
                    </div>

                    {isDetailedSetupMode && (
                      <div>
                        <InfoLabel
                          label="Rule Priority"
                          tooltip="Lower number means higher priority when multiple rules may match."
                        />
                        <Input
                          value={rulesData.rulePriority ?? ''}
                          inputMode="numeric"
                          readOnly={isReadOnly}
                          placeholder="Example: 1"
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'rulePriority',
                                event.target.value
                              ),
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(isDetailedSetupMode || showFormulaRules || isHybridRules || rulesData.ruleInputs.some((row) => row.sourceType === 'Derived')) && (
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">4.4 Derivations</h4>
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: {
                              ...current.dataApplicability,
                              derivationRules: [...current.dataApplicability.derivationRules, createDerivationRuleRow()],
                            },
                          }))
                        }
                      >
                        <Plus size={14} />
                        Add derivation
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {rulesData.derivationRules.map((row, index) => {
                      const prefix = `derivation_${row.id || index}`;
                      return (
                        <div key={row.id} className="grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[1fr_2fr_120px_auto]">
                          <Select
                            value={row.derivedOutputCode}
                            disabled={isReadOnly}
                            error={fieldErrors[`${prefix}_derivedOutputCode`]}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                dataApplicability: {
                                  ...current.dataApplicability,
                                  derivationRules: current.dataApplicability.derivationRules.map((item) =>
                                    item.id === row.id ? { ...item, derivedOutputCode: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                            options={[
                              { value: '', label: 'Derived Output Code' },
                              ...rulesData.ruleInputs
                                .filter((item) => (item.sourceType ?? '') === 'Derived')
                                .map((item) => ({ value: item.inputCode, label: item.inputCode || 'Unnamed input' })),
                            ]}
                          />
                          <Input
                            value={row.derivationExpression}
                            readOnly={isReadOnly}
                            error={fieldErrors[`${prefix}_derivationExpression`]}
                            placeholder="Example: NET_AMOUNT = GROSS_AMOUNT - DISCOUNT"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                dataApplicability: {
                                  ...current.dataApplicability,
                                  derivationRules: current.dataApplicability.derivationRules.map((item) =>
                                    item.id === row.id ? { ...item, derivationExpression: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                          />
                          <Input
                            value={row.derivationEvaluationOrder ?? ''}
                            readOnly={isReadOnly}
                            inputMode="numeric"
                            placeholder="Order"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                dataApplicability: {
                                  ...current.dataApplicability,
                                  derivationRules: current.dataApplicability.derivationRules.map((item) =>
                                    item.id === row.id ? { ...item, derivationEvaluationOrder: event.target.value } : item
                                  ),
                                },
                              }))
                            }
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  dataApplicability: {
                                    ...current.dataApplicability,
                                    derivationRules: current.dataApplicability.derivationRules.filter((item) => item.id !== row.id),
                                  },
                                }))
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {showMatrixRules && (
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">4.5 Approval Eligibility Matrix</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <InfoLabel
                        label="Matrix Enabled"
                        required
                        tooltip="Enable matrix when approval applicability should be decided using table rows."
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={matrixEnabled}
                          disabled={isReadOnly || showMatrixRules}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'matrixEnabled',
                                event.target.checked
                              ),
                            }))
                          }
                        />
                        {matrixEnabled ? 'Enabled' : 'Disabled'}
                      </label>
                      {fieldErrors.matrixEnabled && <p className="field-error mt-1">{fieldErrors.matrixEnabled}</p>}
                    </div>
                    <div>
                      <InfoLabel label="Matrix Version" tooltip="System-generated version of this matrix." />
                      <div className="brand-badge">{rulesData.decisionTableVersion}</div>
                    </div>
                    <div>
                      <InfoLabel label="Matrix Name" required tooltip="Enter name of this approval eligibility matrix." />
                      <Input
                        value={rulesData.decisionTableName}
                        maxLength={100}
                        readOnly={isReadOnly}
                        error={fieldErrors.decisionTableName}
                        placeholder="Example: Job Card Approval Eligibility Matrix"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'decisionTableName',
                              event.target.value
                            ),
                          }))
                        }
                      />
                      {fieldErrors.decisionTableName && <p className="field-error mt-1">{fieldErrors.decisionTableName}</p>}
                    </div>
                    <div>
                      <InfoLabel label="Matrix Status" tooltip="Shows whether this matrix is draft, active, or retired." />
                      <div className={cn('brand-badge', rulesData.decisionTableStatus === 'Active' ? 'brand-badge--approved' : rulesData.decisionTableStatus === 'Retired' ? 'brand-badge--cancelled' : 'brand-badge--draft')}>
                        {rulesData.decisionTableStatus}
                      </div>
                    </div>
                    <div>
                      <InfoLabel
                        label="Hit Policy"
                        required
                        tooltip="Defines what system should do when one or more matrix rows match."
                      />
                      <Select
                        value={rulesData.decisionTableHitPolicy}
                        disabled={isReadOnly}
                        error={fieldErrors.decisionTableHitPolicy}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'decisionTableHitPolicy',
                              event.target.value as DecisionTableHitPolicy | ''
                            ),
                          }))
                        }
                        options={[
                          { value: '', label: 'Select hit policy' },
                          ...decisionTableHitPolicyOptions.map((option) => ({ value: option, label: option })),
                        ]}
                      />
                      {fieldErrors.decisionTableHitPolicy && <p className="field-error mt-1">{fieldErrors.decisionTableHitPolicy}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <DualListboxField
                        label="Input Columns"
                        required
                        tooltip="Select input values used as matrix conditions."
                        availableItems={rulesData.ruleInputs.map((item) => item.inputCode).filter(Boolean)}
                        selectedItems={rulesData.decisionInputColumns}
                        disabled={isReadOnly}
                        onChange={(nextItems) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'decisionInputColumns',
                              nextItems
                            ),
                          }))
                        }
                      />
                      {fieldErrors.decisionInputColumns && <p className="field-error mt-1">{fieldErrors.decisionInputColumns}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <DualListboxField
                        label="Output Columns"
                        required
                        tooltip="Select what the matrix should return when a row matches."
                        availableItems={[...matrixOutputColumnOptions]}
                        selectedItems={rulesData.decisionOutputColumns}
                        disabled={isReadOnly}
                        onChange={(nextItems) =>
                          setDraft((current) => ({
                            ...current,
                            dataApplicability: updateDataApplicabilitySetting(
                              current.dataApplicability,
                              'decisionOutputColumns',
                              nextItems
                            ),
                          }))
                        }
                      />
                      {fieldErrors.decisionOutputColumns && <p className="field-error mt-1">{fieldErrors.decisionOutputColumns}</p>}
                    </div>

                    <div className="md:col-span-2 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <table className="w-full min-w-[980px]">
                        <thead className="bg-[var(--color-table-header)]">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Decision Rows Grid</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Rule Output</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Row Priority</th>
                            {isDetailedSetupMode && (
                              <>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Row Effective From</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Row Effective To</th>
                              </>
                            )}
                            <th className="w-12 px-2 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {rulesData.decisionRows.map((row) => (
                            <tr key={row.id} className="border-t border-[var(--color-border)]">
                              <td className="px-2 py-2">
                                <Input
                                  value={row.conditionExpression}
                                  readOnly={isReadOnly}
                                  placeholder="Amount BETWEEN 50000 and 100000 AND Branch = Pune"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                          item.id === row.id ? { ...item, conditionExpression: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.outputValue}
                                  readOnly={isReadOnly}
                                  placeholder="Approval Required / ReasonCode"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                          item.id === row.id ? { ...item, outputValue: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={row.priority}
                                  inputMode="numeric"
                                  readOnly={isReadOnly}
                                  placeholder="1"
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      dataApplicability: {
                                        ...current.dataApplicability,
                                        decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                          item.id === row.id ? { ...item, priority: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                />
                              </td>
                              {isDetailedSetupMode && (
                                <>
                                  <td className="px-2 py-2">
                                    <Input
                                      type="datetime-local"
                                      value={row.rowEffectiveFrom ?? ''}
                                      readOnly={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          dataApplicability: {
                                            ...current.dataApplicability,
                                            decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                              item.id === row.id ? { ...item, rowEffectiveFrom: event.target.value } : item
                                            ),
                                          },
                                        }))
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <Input
                                      type="datetime-local"
                                      value={row.rowEffectiveTo ?? ''}
                                      readOnly={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          dataApplicability: {
                                            ...current.dataApplicability,
                                            decisionRows: current.dataApplicability.decisionRows.map((item) =>
                                              item.id === row.id ? { ...item, rowEffectiveTo: event.target.value } : item
                                            ),
                                          },
                                        }))
                                      }
                                    />
                                  </td>
                                </>
                              )}
                              <td className="px-2 py-2">
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    className="btn btn--ghost btn--sm"
                                    onClick={() =>
                                      setDraft((current) => ({
                                        ...current,
                                        dataApplicability: {
                                          ...current.dataApplicability,
                                          decisionRows: current.dataApplicability.decisionRows.filter((item) => item.id !== row.id),
                                        },
                                      }))
                                    }
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: {
                                ...current.dataApplicability,
                                decisionRows: [...current.dataApplicability.decisionRows, createDecisionRow()],
                              },
                            }))
                          }
                        >
                          <Plus size={14} />
                          Add matrix row
                        </button>
                      </div>
                    )}
                    {fieldErrors.decisionRows && <p className="field-error md:col-span-2">{fieldErrors.decisionRows}</p>}
                    {fieldErrors.decisionRowPriority && <p className="field-error md:col-span-2">{fieldErrors.decisionRowPriority}</p>}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <div className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Overlap Detection</div>
                      <div className={cn('mt-2 brand-badge', rulesData.overlapDetectionPass ? 'brand-badge--approved' : 'brand-badge--cancelled')}>
                        {rulesData.overlapDetectionPass ? 'Pass' : 'Fail'}
                      </div>
                      {fieldErrors.overlapDetectionPass && <p className="field-error mt-2">{fieldErrors.overlapDetectionPass}</p>}
                    </div>
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <div className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Gap Detection</div>
                      <div className={cn('mt-2 brand-badge', rulesData.gapDetectionStatus === 'Fail' ? 'brand-badge--cancelled' : rulesData.gapDetectionStatus === 'Warning' ? 'brand-badge--draft' : 'brand-badge--approved')}>
                        {rulesData.gapDetectionStatus || 'Pass'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <div className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Activation Validation</div>
                      <ul className="mt-2 list-disc pl-5 text-[var(--color-text)]">
                        {(rulesData.activationValidationChecks ?? []).length === 0 && <li>No checks available</li>}
                        {(rulesData.activationValidationChecks ?? []).map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              <section className="approval-preview-panel rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <InfoLabel label="No Match Handling" required tooltip="Decide what system should do if no condition or matrix row matches." />
                    <Select
                      value={rulesData.noMatchHandling ?? ''}
                      disabled={isReadOnly}
                      error={fieldErrors.noMatchHandling}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataApplicability: updateDataApplicabilitySetting(
                            current.dataApplicability,
                            'noMatchHandling',
                            event.target.value as ApprovalDataApplicabilitySettings['noMatchHandling']
                          ),
                        }))
                      }
                      options={[
                        { value: '', label: 'Select no match handling' },
                        ...noMatchHandlingOptions.map((option) => ({ value: option, label: option })),
                      ]}
                    />
                    {fieldErrors.noMatchHandling && <p className="field-error mt-1">{fieldErrors.noMatchHandling}</p>}
                  </div>
                </div>
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text)]">4.6 Rule Preview &amp; Validation</h4>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    {isDetailedSetupMode && (
                      <div>
                        <InfoLabel
                          label="Sample Data Input"
                          tooltip="Enter sample values to test whether rule works correctly."
                        />
                        <Textarea
                          value={rulesData.sampleDataInput ?? ''}
                          rows={4}
                          readOnly={isReadOnly}
                          placeholder='{"LABOUR_TOTAL_AMOUNT": 75000, "BRANCH": "Pune"}'
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dataApplicability: updateDataApplicabilitySetting(
                                current.dataApplicability,
                                'sampleDataInput',
                                event.target.value
                              ),
                            }))
                          }
                        />
                      </div>
                    )}
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => {
                            const conditionSummary = current.rules.length
                              ? current.rules
                                  .map(
                                    (rule, index) =>
                                      `${index + 1}. ${rule.field || '[input]'} ${rule.operator || '[operator]'} ${rule.value || '[value]'} => ${rule.action || '[result]'}`
                                  )
                                  .join(' | ')
                              : current.dataApplicability.conditionBuilderRules || '-';
                            const nextFormulaResult: ApprovalDataApplicabilitySettings['formulaTestResult'] =
                              showFormulaRules && !current.dataApplicability.formulaExpression.trim()
                                ? 'Error'
                                : showFormulaRules
                                  ? 'True'
                                  : '';
                            const nextResult: ApprovalDataApplicabilitySettings['ruleResultPreview'] =
                              current.dataApplicability.noMatchHandling === 'Block Submission'
                                ? 'Block Submission'
                                : current.dataApplicability.ruleOutputWhenMatched === 'Approval Not Required'
                                  ? 'Approval Not Required'
                                  : current.dataApplicability.ruleOutputWhenMatched === 'Route to Matrix'
                                    ? 'Manual Review'
                                    : 'Approval Required';
                            return {
                              ...current,
                              dataApplicability: {
                                ...current.dataApplicability,
                                formulaTestResult: nextFormulaResult,
                                ruleResultPreview: nextResult,
                                conditionBuilderRules: conditionSummary,
                                decisionTracePreview: `Entry criteria: ${current.dataApplicability.entryCriteriaType || '-'} | Conditions: ${conditionSummary} | Formula: ${current.dataApplicability.formulaExpression || '-'} | Matrix rows: ${current.dataApplicability.decisionRows.length}.`,
                              },
                            };
                          })
                        }
                      >
                        Test Rule
                      </button>
                    )}

                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <h5 className="font-semibold text-[var(--color-text)]">Rule Result Preview</h5>
                      <p className="mt-1 text-[var(--color-text)]">{rulesData.ruleResultPreview || 'Not tested'}</p>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                      <h5 className="font-semibold text-[var(--color-text)]">Decision Trace Preview</h5>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--color-text)]">
                        {rulesData.decisionTracePreview || 'Run Test Rule to generate decision trace.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <h5 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Rule Validation Summary</h5>
                    <div className="space-y-2">
                      {ruleValidationChecklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 text-sm">
                          <span
                            className={cn(
                              'mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]',
                              item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            )}
                          >
                            {item.passed ? <Check size={10} /> : '!'}
                          </span>
                          <span className={item.passed ? 'text-[var(--color-text)]' : 'text-rose-700'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    {stepError && currentStep === 3 && <p className="field-error mt-3">{stepError}</p>}
                  </div>
                </div>

              </section>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">5.1 Status & record actions</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Control document lock/edit behavior and configure runtime system actions.</p>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <ActionFormField
                    label="Record Lock Policy"
                    required
                    tooltip="Decide when the source document should become non-editable during approval."
                  >
                    <Select
                      value={draft.actions.recordLockPolicy}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          actions: updateActionSetting(current.actions, 'recordLockPolicy', event.target.value),
                        }))
                      }
                      options={recordLockPolicyOptions.map((option) => ({ value: option, label: option }))}
                      error={fieldErrors.recordLockPolicy}
                    />
                  </ActionFormField>
                  <ActionFormField
                    label="Edit During Approval Policy"
                    required
                    tooltip="Decide whether users can edit the document after submitting it for approval."
                  >
                    <Select
                      value={draft.actions.editDuringApprovalPolicy}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          actions: updateActionSetting(current.actions, 'editDuringApprovalPolicy', event.target.value),
                        }))
                      }
                      options={editDuringApprovalPolicyOptions.map((option) => ({ value: option, label: option }))}
                      error={fieldErrors.editDuringApprovalPolicy}
                    />
                  </ActionFormField>
                  {draft.actions.recordLockPolicy !== 'Do Not Lock' && (
                    <div className="grid gap-2">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.actions.unlockOnRejection}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(current.actions, 'unlockOnRejection', event.target.checked),
                            }))
                          }
                        />
                        Unlock on rejection
                      </label>
                      {draft.actions.recallAllowed && (
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                          <input
                            type="checkbox"
                            checked={draft.actions.unlockOnRecall}
                            disabled={isReadOnly}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                actions: updateActionSetting(current.actions, 'unlockOnRecall', event.target.checked),
                              }))
                            }
                          />
                          Unlock on recall
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {isDetailedSetupMode && (
                  <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
                  <div className="mb-3 flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-[var(--color-text)]">Action builder</h5>
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            actions: {
                              ...current.actions,
                              actions: [...current.actions.actions, createActionRow()],
                            },
                          }))
                        }
                      >
                        <Plus size={14} />
                        Add action
                      </button>
                    )}
                  </div>
                  {fieldErrors.actionRows && <p className="text-xs text-[var(--color-danger)]">{fieldErrors.actionRows}</p>}
                  <div className="space-y-3">
                    {draft.actions.actions.map((actionRow) => {
                      const prefix = `action_${actionRow.id}`;
                      return (
                        <div key={actionRow.id} className="rounded-lg border border-[var(--color-border)] p-3">
                          <div className="grid gap-3 md:grid-cols-3">
                            <ActionFormField label="Event Type" required tooltip="Select when this action should run.">
                              <Select
                                value={actionRow.eventType}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    actions: {
                                      ...current.actions,
                                      actions: current.actions.actions.map((item) =>
                                        item.id === actionRow.id ? { ...item, eventType: event.target.value as ApprovalActionRow['eventType'] } : item
                                      ),
                                    },
                                  }))
                                }
                                options={[{ value: '', label: 'Select event' }, ...actionEventOptions.map((option) => ({ value: option, label: option }))]}
                                error={fieldErrors[`${prefix}_eventType`]}
                              />
                            </ActionFormField>
                            <ActionFormField label="Action Type" required tooltip="Select what the system should do when the selected event happens.">
                              <Select
                                value={actionRow.actionType}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    actions: {
                                      ...current.actions,
                                      actions: current.actions.actions.map((item) =>
                                        item.id === actionRow.id ? { ...item, actionType: event.target.value as ApprovalActionRow['actionType'] } : item
                                      ),
                                    },
                                  }))
                                }
                                options={[
                                  { value: '', label: 'Select action' },
                                  ...actionTypeOptions
                                    .filter((option) => (isDetailedSetupMode ? true : option !== 'API' && option !== 'Script'))
                                    .map((option) => ({ value: option, label: option })),
                                ]}
                                error={fieldErrors[`${prefix}_actionType`]}
                              />
                            </ActionFormField>
                            <ActionFormField label="Action Configuration" required tooltip="Configure details for the selected action using guided setup.">
                              <Input
                                value={actionRow.actionConfiguration}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    actions: {
                                      ...current.actions,
                                      actions: current.actions.actions.map((item) =>
                                        item.id === actionRow.id ? { ...item, actionConfiguration: event.target.value } : item
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Guided action config"
                                error={fieldErrors[`${prefix}_actionConfiguration`]}
                              />
                            </ActionFormField>
                          </div>

                          {actionRow.actionType === 'Field Update' && (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <ActionFormField label="Field to Update" required tooltip="Select the field that should be updated by the approval action.">
                                <Input
                                  value={actionRow.fieldToUpdate}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, fieldToUpdate: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="Select field"
                                  error={fieldErrors[`${prefix}_fieldToUpdate`]}
                                />
                              </ActionFormField>
                              <ActionFormField label="Update Value" required tooltip="Enter the value that should be updated in the selected field.">
                                <Input
                                  value={actionRow.updateValue}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, updateValue: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="Enter value"
                                  error={fieldErrors[`${prefix}_updateValue`]}
                                />
                              </ActionFormField>
                            </div>
                          )}

                          {actionRow.actionType === 'Task' && (
                            <div className="mt-3">
                              <ActionFormField label="Task Template" required tooltip="Select the task template to create a follow-up task.">
                                <Input
                                  value={actionRow.taskTemplate}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, taskTemplate: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="Select task template"
                                  error={fieldErrors[`${prefix}_taskTemplate`]}
                                />
                              </ActionFormField>
                            </div>
                          )}

                          {actionRow.actionType === 'API' && isDetailedSetupMode && (
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                              <ActionFormField label="API Endpoint / Integration Action" required tooltip="Select the external integration action to run after approval event.">
                                <Input
                                  value={actionRow.apiEndpoint}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, apiEndpoint: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="Select API action"
                                  error={fieldErrors[`${prefix}_apiEndpoint`]}
                                />
                              </ActionFormField>
                              <ActionFormField label="Idempotency Key Rule" required tooltip="Prevents duplicate API execution for the same approval event.">
                                <Input
                                  value={actionRow.idempotencyKeyRule}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, idempotencyKeyRule: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="e.g. ${documentNo}-${eventType}"
                                  error={fieldErrors[`${prefix}_idempotencyKeyRule`]}
                                />
                              </ActionFormField>
                              <ActionFormField label="Retry Policy" required tooltip="Select how system should retry if API action fails.">
                                <Select
                                  value={actionRow.retryPolicy}
                                  disabled={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, retryPolicy: event.target.value as ApprovalActionRow['retryPolicy'] } : item
                                        ),
                                      },
                                    }))
                                  }
                                  options={[{ value: '', label: 'Select retry policy' }, ...retryPolicyOptions.map((option) => ({ value: option, label: option }))]}
                                  error={fieldErrors[`${prefix}_retryPolicy`]}
                                />
                              </ActionFormField>
                              {(actionRow.retryPolicy === 'Fixed' || actionRow.retryPolicy === 'Exponential') && (
                                <ActionFormField label="Retry Count" required tooltip="Enter how many times system should retry the failed API action.">
                                  <Input
                                    value={actionRow.retryCount}
                                    readOnly={isReadOnly}
                                    onChange={(event) =>
                                      setDraft((current) => ({
                                        ...current,
                                        actions: {
                                          ...current.actions,
                                          actions: current.actions.actions.map((item) =>
                                            item.id === actionRow.id ? { ...item, retryCount: event.target.value } : item
                                          ),
                                        },
                                      }))
                                    }
                                    placeholder="3"
                                    error={fieldErrors[`${prefix}_retryCount`]}
                                  />
                                </ActionFormField>
                              )}
                              <ActionFormField label="Failure Handling" required tooltip="Select what should happen if API action fails even after retry.">
                                <Select
                                  value={actionRow.failureHandling}
                                  disabled={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, failureHandling: event.target.value as ApprovalActionRow['failureHandling'] } : item
                                        ),
                                      },
                                    }))
                                  }
                                  options={[{ value: '', label: 'Select failure handling' }, ...failureHandlingOptions.map((option) => ({ value: option, label: option }))]}
                                  error={fieldErrors[`${prefix}_failureHandling`]}
                                />
                              </ActionFormField>
                            </div>
                          )}

                          {actionRow.actionType === 'Script' && isDetailedSetupMode && (
                            <div className="mt-3">
                              <ActionFormField label="Script Action" required tooltip="Advanced action for approved technical scripts (developer/admin only).">
                                <Input
                                  value={actionRow.scriptAction}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: {
                                        ...current.actions,
                                        actions: current.actions.actions.map((item) =>
                                          item.id === actionRow.id ? { ...item, scriptAction: event.target.value } : item
                                        ),
                                      },
                                    }))
                                  }
                                  placeholder="Developer/Admin only script reference"
                                  error={fieldErrors[`${prefix}_scriptAction`]}
                                />
                              </ActionFormField>
                            </div>
                          )}

                          {!isReadOnly && draft.actions.actions.length > 1 && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm mt-2 text-[var(--color-danger)]"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: {
                                    ...current.actions,
                                    actions: current.actions.actions.filter((item) => item.id !== actionRow.id),
                                  },
                                }))
                              }
                            >
                              <Trash2 size={14} />
                              Remove action
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">5.2 Decision remarks & attachments</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Define mandatory remarks and supporting files for decisions.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {[
                    { key: 'remarksRequiredOnApprove', label: 'Remarks Required on Approve' },
                    { key: 'remarksRequiredOnReject', label: 'Remarks Required on Reject' },
                    { key: 'remarksRequiredOnRecall', label: 'Remarks Required on Recall', condition: draft.actions.recallAllowed },
                    { key: 'bulkActionRemarksRequired', label: 'Bulk Action Remarks Required', condition: draft.approvalSection.bulkApprovalAllowed },
                  ]
                    .filter((item) => item.condition === undefined || item.condition)
                    .map((item) => (
                      <label key={item.key} className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.actions[item.key as keyof ApprovalActionSettings])}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(
                                current.actions,
                                item.key as keyof ApprovalActionSettings,
                                event.target.checked
                              ),
                            }))
                          }
                        />
                        {item.label}
                      </label>
                    ))}

                  {isDetailedSetupMode && (
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={draft.actions.decisionAttachmentRequired}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'decisionAttachmentRequired', event.target.checked),
                          }))
                        }
                      />
                      Decision Attachment Required
                    </label>
                  )}
                </div>
                {isDetailedSetupMode && draft.actions.decisionAttachmentRequired && (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <ActionFormField label="Attachment Required Event" required tooltip="Select the decision event where attachment is mandatory.">
                      <div className="rounded-md border border-[var(--color-border)] p-2">
                        {attachmentRequiredEventOptions.map((option) => (
                          <label key={option} className="mr-3 inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.attachmentRequiredEvent.includes(option)}
                              disabled={isReadOnly}
                              onChange={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'attachmentRequiredEvent',
                                    toggleArrayValue(current.actions.attachmentRequiredEvent, option) as ApprovalActionSettings['attachmentRequiredEvent']
                                  ),
                                }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.attachmentRequiredEvent && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.attachmentRequiredEvent}</p>
                      )}
                    </ActionFormField>
                    <ActionFormField label="Allowed File Types" required tooltip="Select which file types are allowed for decision attachments.">
                      <div className="rounded-md border border-[var(--color-border)] p-2">
                        {allowedFileTypeOptions.map((option) => (
                          <label key={option} className="mr-3 inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.allowedFileTypes.includes(option)}
                              disabled={isReadOnly}
                              onChange={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'allowedFileTypes',
                                    toggleArrayValue(current.actions.allowedFileTypes, option)
                                  ),
                                }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.allowedFileTypes && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.allowedFileTypes}</p>
                      )}
                    </ActionFormField>
                    <ActionFormField label="Maximum File Size (MB)" required tooltip="Set maximum allowed attachment size.">
                      <Input
                        value={draft.actions.maximumFileSize}
                        readOnly={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'maximumFileSize', event.target.value),
                          }))
                        }
                        placeholder="10"
                        error={fieldErrors.maximumFileSize}
                      />
                    </ActionFormField>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">5.3 Notifications</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Select channels, recipients, events, and template mappings.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  {[
                    { key: 'inAppNotificationEnabled', label: 'In-App Notification Enabled' },
                    { key: 'emailNotificationEnabled', label: 'Email Notification Enabled' },
                    ...(isDetailedSetupMode
                      ? [
                          { key: 'smsNotificationEnabled', label: 'SMS Notification Enabled' },
                          { key: 'whatsAppNotificationEnabled', label: 'WhatsApp Notification Enabled' },
                        ]
                      : []),
                  ].map((item) => (
                    <label key={item.key} className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.actions[item.key as keyof ApprovalActionSettings])}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(
                              current.actions,
                              item.key as keyof ApprovalActionSettings,
                              event.target.checked
                            ),
                          }))
                        }
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
                {fieldErrors.notificationChannels && (
                  <p className="mt-2 text-xs text-[var(--color-danger)]">{fieldErrors.notificationChannels}</p>
                )}
                {hasNotificationChannel && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <ActionFormField label="Notification Events" required tooltip="Select events for which notification should be sent.">
                      <div className="rounded-md border border-[var(--color-border)] p-2">
                        {notificationEventOptions.map((option) => (
                          <label key={option} className="mr-3 inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.notificationEvents.includes(option)}
                              disabled={isReadOnly}
                              onChange={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'notificationEvents',
                                    toggleArrayValue(current.actions.notificationEvents, option) as ApprovalActionSettings['notificationEvents']
                                  ),
                                }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.notificationEvents && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.notificationEvents}</p>
                      )}
                    </ActionFormField>

                    <ActionFormField label="Notification Recipient Type" required tooltip="Select who should receive the notification.">
                      <div className="rounded-md border border-[var(--color-border)] p-2">
                        {notificationRecipientOptions.map((option) => (
                          <label key={option} className="mr-3 inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.notificationRecipientType.includes(option)}
                              disabled={isReadOnly}
                              onChange={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'notificationRecipientType',
                                    toggleArrayValue(current.actions.notificationRecipientType, option) as ApprovalActionSettings['notificationRecipientType']
                                  ),
                                }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.notificationRecipientType && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.notificationRecipientType}</p>
                      )}
                    </ActionFormField>

                    <ActionFormField label="Template Mapping" required tooltip="Map notification templates by event and channel.">
                      <Input
                        value={draft.actions.templateMapping}
                        readOnly={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'templateMapping', event.target.value),
                          }))
                        }
                        placeholder="Map templates by event and channel"
                        error={fieldErrors.templateMapping}
                      />
                    </ActionFormField>

                    {(draft.actions.emailNotificationEnabled || draft.actions.smsNotificationEnabled || draft.actions.whatsAppNotificationEnabled) && (
                      <ActionFormField label="Notification Language" tooltip="Select language rule for approval notifications.">
                        <Select
                          value={draft.actions.notificationLanguage}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(current.actions, 'notificationLanguage', event.target.value),
                            }))
                          }
                          options={notificationLanguageOptions.map((option) => ({ value: option, label: option }))}
                        />
                      </ActionFormField>
                    )}

                    {isDetailedSetupMode && (
                      <>
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                          <input
                            type="checkbox"
                            checked={draft.actions.digestNotificationEnabled}
                            disabled={isReadOnly}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                actions: updateActionSetting(
                                  current.actions,
                                  'digestNotificationEnabled',
                                  event.target.checked
                                ),
                              }))
                            }
                          />
                          Digest Notification Enabled
                        </label>
                        {draft.actions.digestNotificationEnabled && (
                          <ActionFormField label="Digest Frequency" required tooltip="Select how often grouped notifications should be sent.">
                            <Select
                              value={draft.actions.digestFrequency}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'digestFrequency', event.target.value),
                                }))
                              }
                              options={[{ value: '', label: 'Select digest frequency' }, ...digestFrequencyOptions.map((option) => ({ value: option, label: option }))]}
                              error={fieldErrors.digestFrequency}
                            />
                          </ActionFormField>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {isDetailedSetupMode && (
                <>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">5.4 SLA & escalation</h4>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Configure due time, reminders, escalation chain, and timeout behavior.</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.actions.slaEnabled}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(current.actions, 'slaEnabled', event.target.checked),
                            }))
                          }
                        />
                        SLA Enabled
                      </label>
                      {draft.actions.slaEnabled && (
                        <>
                          <ActionFormField label="SLA Duration" required tooltip="Enter how much time approver has to act before escalation or timeout.">
                            <Input
                              value={draft.actions.slaDuration}
                              readOnly={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'slaDuration', event.target.value),
                                }))
                              }
                              error={fieldErrors.slaDuration}
                            />
                          </ActionFormField>
                          <ActionFormField label="SLA Unit" required tooltip="Select whether SLA duration is in hours or days.">
                            <Select
                              value={draft.actions.slaUnit}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'slaUnit', event.target.value),
                                }))
                              }
                              options={[{ value: '', label: 'Select unit' }, ...slaUnitOptions.map((option) => ({ value: option, label: option }))]}
                              error={fieldErrors.slaUnit}
                            />
                          </ActionFormField>
                          <ActionFormField label="SLA Calendar" required tooltip="Select whether SLA should follow business hours/holidays or 24x7.">
                            <Select
                              value={draft.actions.slaCalendar}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'slaCalendar', event.target.value),
                                }))
                              }
                              options={[{ value: '', label: 'Select calendar' }, ...slaCalendarOptions.map((option) => ({ value: option, label: option }))]}
                              error={fieldErrors.slaCalendar}
                            />
                          </ActionFormField>
                          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.reminderBeforeDue}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'reminderBeforeDue', event.target.checked),
                                }))
                              }
                            />
                            Reminder Before Due
                          </label>
                          {draft.actions.reminderBeforeDue && (
                            <ActionFormField label="Reminder Time Before Due" required tooltip="Enter how early reminder should be sent before SLA due time.">
                              <Input
                                value={draft.actions.reminderTimeBeforeDue}
                                readOnly={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    actions: updateActionSetting(current.actions, 'reminderTimeBeforeDue', event.target.value),
                                  }))
                                }
                                error={fieldErrors.reminderTimeBeforeDue}
                              />
                            </ActionFormField>
                          )}
                          <ActionFormField label="Escalation Policy" tooltip="Define who should receive approval if current approver does not act within SLA.">
                            <Input
                              value={draft.actions.escalationPolicy}
                              readOnly={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'escalationPolicy', event.target.value),
                                }))
                              }
                              placeholder="User/Role/Queue/Manager Level chain"
                            />
                          </ActionFormField>
                          <ActionFormField label="Escalation Level Count" tooltip="Shows or defines number of escalation levels.">
                            <Input
                              value={draft.actions.escalationLevelCount}
                              readOnly={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'escalationLevelCount', event.target.value),
                                }))
                              }
                            />
                          </ActionFormField>
                          <ActionFormField label="Auto Action on Timeout" tooltip="Select what system should do when approval is not completed within SLA.">
                            <Select
                              value={draft.actions.autoActionOnTimeout}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'autoActionOnTimeout', event.target.value),
                                }))
                              }
                              options={autoActionOnTimeoutOptions.map((option) => ({ value: option, label: option }))}
                            />
                          </ActionFormField>
                          {(draft.actions.autoActionOnTimeout === 'Auto Approve' || draft.actions.autoActionOnTimeout === 'Auto Reject') && (
                            <div className="md:col-span-3">
                              <ActionFormField label="Timeout Justification" required tooltip="Explain why automatic approval or rejection is allowed on timeout.">
                                <Textarea
                                  rows={3}
                                  value={draft.actions.timeoutJustification}
                                  readOnly={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: updateActionSetting(current.actions, 'timeoutJustification', event.target.value),
                                    }))
                                  }
                                  error={fieldErrors.timeoutJustification}
                                />
                              </ActionFormField>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">5.5 External / link approval</h4>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Set secure link access and OTP controls for external approvers.</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.actions.externalApprovalEnabled}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(current.actions, 'externalApprovalEnabled', event.target.checked),
                            }))
                          }
                        />
                        External Approval Enabled
                      </label>

                      {draft.actions.externalApprovalEnabled && (
                        <>
                          <ActionFormField label="External Approval Mode" required tooltip="Select how external approver will access approval request.">
                            <Select
                              value={draft.actions.externalApprovalMode}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'externalApprovalMode', event.target.value),
                                }))
                              }
                              options={[{ value: '', label: 'Select mode' }, ...externalApprovalModeOptions.map((option) => ({ value: option, label: option }))]}
                              error={fieldErrors.externalApprovalMode}
                            />
                          </ActionFormField>
                          {draft.actions.externalApprovalMode === 'Secure Link' && (
                            <>
                              <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                                <input
                                  type="checkbox"
                                  checked={draft.actions.approveViaSecureLink}
                                  disabled={isReadOnly}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      actions: updateActionSetting(current.actions, 'approveViaSecureLink', event.target.checked),
                                    }))
                                  }
                                />
                                Approve via Secure Link
                              </label>
                              {draft.actions.approveViaSecureLink && (
                                <>
                                  <ActionFormField label="Token TTL (minutes)" required tooltip="Defines how long the secure approval link will remain valid.">
                                    <Input
                                      value={draft.actions.tokenTtl}
                                      readOnly={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          actions: updateActionSetting(current.actions, 'tokenTtl', event.target.value),
                                        }))
                                      }
                                      error={fieldErrors.tokenTtl}
                                    />
                                  </ActionFormField>
                                  <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                                    <input
                                      type="checkbox"
                                      checked={draft.actions.otpRequired}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          actions: updateActionSetting(current.actions, 'otpRequired', event.target.checked),
                                        }))
                                      }
                                    />
                                    OTP Required
                                  </label>
                                  {draft.actions.otpRequired && (
                                    <>
                                      <ActionFormField label="OTP Channel" required tooltip="Select where OTP should be sent.">
                                        <Select
                                          value={draft.actions.otpChannel}
                                          disabled={isReadOnly}
                                          onChange={(event) =>
                                            setDraft((current) => ({
                                              ...current,
                                              actions: updateActionSetting(current.actions, 'otpChannel', event.target.value),
                                            }))
                                          }
                                          options={[{ value: '', label: 'Select OTP channel' }, ...otpChannelOptions.map((option) => ({ value: option, label: option }))]}
                                          error={fieldErrors.otpChannel}
                                        />
                                      </ActionFormField>
                                      <ActionFormField label="Max OTP Attempts" required tooltip="Set maximum wrong OTP attempts allowed.">
                                        <Input
                                          value={draft.actions.maxOtpAttempts}
                                          readOnly={isReadOnly}
                                          onChange={(event) =>
                                            setDraft((current) => ({
                                              ...current,
                                              actions: updateActionSetting(current.actions, 'maxOtpAttempts', event.target.value),
                                            }))
                                          }
                                          error={fieldErrors.maxOtpAttempts}
                                        />
                                      </ActionFormField>
                                    </>
                                  )}
                                  <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                                    <input
                                      type="checkbox"
                                      checked={draft.actions.allowLinkResend}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          actions: updateActionSetting(current.actions, 'allowLinkResend', event.target.checked),
                                        }))
                                      }
                                    />
                                    Allow Link Resend
                                  </label>
                                  <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                                    <input
                                      type="checkbox"
                                      checked={draft.actions.revokeLinkOnDecision}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        setDraft((current) => ({
                                          ...current,
                                          actions: updateActionSetting(current.actions, 'revokeLinkOnDecision', event.target.checked),
                                        }))
                                      }
                                    />
                                    Revoke Link on Decision
                                  </label>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">5.6 Invalidation & resubmission</h4>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Define invalidation triggers and automatic resubmission behavior.</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={draft.actions.invalidationEnabled}
                          disabled={isReadOnly}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              actions: updateActionSetting(current.actions, 'invalidationEnabled', event.target.checked),
                            }))
                          }
                        />
                        Invalidation Enabled
                      </label>
                      {draft.actions.invalidationEnabled && (
                        <>
                          <ActionFormField label="Invalidation Triggers" required tooltip="Select fields or events that should invalidate approval.">
                            <Input
                              value={draft.actions.invalidationTriggers.join(', ')}
                              readOnly={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'invalidationTriggers',
                                    event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean)
                                  ),
                                }))
                              }
                              placeholder="amount, department, supplier"
                              error={fieldErrors.invalidationTriggers}
                            />
                          </ActionFormField>
                          <ActionFormField label="Invalidation Strategy" required tooltip="Decide whether only changed lines or full request should be invalidated.">
                            <Select
                              value={draft.actions.invalidationStrategy}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'invalidationStrategy', event.target.value),
                                }))
                              }
                              options={[{ value: '', label: 'Select strategy' }, ...invalidationStrategyOptions.map((option) => ({ value: option, label: option }))]}
                              error={fieldErrors.invalidationStrategy}
                            />
                          </ActionFormField>
                          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.autoResubmitOnSave}
                              disabled={isReadOnly}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(current.actions, 'autoResubmitOnSave', event.target.checked),
                                }))
                              }
                            />
                            Auto Resubmit on Save
                          </label>
                          {draft.actions.autoResubmitOnSave && (
                            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                              <input
                                type="checkbox"
                                checked={draft.actions.resubmissionRequiresRemarks}
                                disabled={isReadOnly}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    actions: updateActionSetting(
                                      current.actions,
                                      'resubmissionRequiresRemarks',
                                      event.target.checked
                                    ),
                                  }))
                                }
                              />
                              Resubmission Requires Remarks
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">5.7 Partial & rejection handling</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Manage partial outcomes, recall limits, and rejection paths.</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {isDetailedSetupMode && isLineOrHybridGranularity && (
                    <ActionFormField label="Header Aggregation Rule" tooltip="Shows how header approval status is calculated from line approval status.">
                      <Input value={draft.actions.headerAggregationRule} readOnly />
                    </ActionFormField>
                  )}
                  {isDetailedSetupMode && isLineOrHybridGranularity && (
                    <ActionFormField label="Partial Approval Policy" required tooltip="Decide what happens when only some lines are approved.">
                      <Select
                        value={draft.actions.partialApprovalPolicy}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'partialApprovalPolicy', event.target.value),
                          }))
                        }
                        options={[{ value: '', label: 'Select policy' }, ...partialApprovalPolicyOptions.map((option) => ({ value: option, label: option }))]}
                        error={fieldErrors.partialApprovalPolicy}
                      />
                    </ActionFormField>
                  )}
                  <ActionFormField label="Rejection Handling Policy" required tooltip="Decide what should happen when approval is rejected.">
                    <Select
                      value={draft.actions.rejectionHandlingPolicy}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          actions: updateActionSetting(current.actions, 'rejectionHandlingPolicy', event.target.value),
                        }))
                      }
                      options={[{ value: '', label: 'Select rejection policy' }, ...rejectionHandlingPolicyOptions.map((option) => ({ value: option, label: option }))]}
                      error={fieldErrors.rejectionHandlingPolicy}
                    />
                  </ActionFormField>
                  {isDetailedSetupMode && isLineOrHybridGranularity && (
                    <ActionFormField label="Rejected Line Edit Policy" required tooltip="Decide whether rejected lines can be edited, view-only, or excluded.">
                      <Select
                        value={draft.actions.rejectedLineEditPolicy}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'rejectedLineEditPolicy', event.target.value),
                          }))
                        }
                        options={[{ value: '', label: 'Select line edit policy' }, ...rejectedLineEditPolicyOptions.map((option) => ({ value: option, label: option }))]}
                        error={fieldErrors.rejectedLineEditPolicy}
                      />
                    </ActionFormField>
                  )}
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={draft.actions.recallAllowed}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          actions: updateActionSetting(current.actions, 'recallAllowed', event.target.checked),
                        }))
                      }
                    />
                    Recall Allowed
                  </label>
                  {draft.actions.recallAllowed && (
                    <ActionFormField label="Recall Allowed Until" required tooltip="Select until which stage the approval request can be recalled.">
                      <Select
                        value={draft.actions.recallAllowedUntil}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            actions: updateActionSetting(current.actions, 'recallAllowedUntil', event.target.value),
                          }))
                        }
                        options={[{ value: '', label: 'Select stage' }, ...recallAllowedUntilOptions.map((option) => ({ value: option, label: option }))]}
                        error={fieldErrors.recallAllowedUntil}
                      />
                    </ActionFormField>
                  )}
                  {isDetailedSetupMode && (
                    <ActionFormField label="Cancel Approval Permission" tooltip="Select who can cancel an approval request.">
                      <div className="rounded-md border border-[var(--color-border)] p-2">
                        {cancelApprovalPermissionOptions.map((option) => (
                          <label key={option} className="mr-3 inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
                            <input
                              type="checkbox"
                              checked={draft.actions.cancelApprovalPermission.includes(option)}
                              disabled={isReadOnly}
                              onChange={() =>
                                setDraft((current) => ({
                                  ...current,
                                  actions: updateActionSetting(
                                    current.actions,
                                    'cancelApprovalPermission',
                                    toggleArrayValue(current.actions.cancelApprovalPermission, option) as ApprovalActionSettings['cancelApprovalPermission']
                                  ),
                                }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </ActionFormField>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">5.8 Action preview & validation</h4>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Review current action setup and readiness checks at a glance.</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <h5 className="font-semibold text-[var(--color-text)]">Action Summary Preview</h5>
                    <div className="mt-2 space-y-1">
                      <div><strong>Record Lock Policy:</strong> {draft.actions.recordLockPolicy || '-'}</div>
                      <div><strong>Edit During Approval Policy:</strong> {draft.actions.editDuringApprovalPolicy || '-'}</div>
                      <div><strong>Configured actions:</strong> {draft.actions.actions.length}</div>
                      <div><strong>Notification channels:</strong> {[
                        draft.actions.inAppNotificationEnabled ? 'In-App' : '',
                        draft.actions.emailNotificationEnabled ? 'Email' : '',
                        draft.actions.smsNotificationEnabled ? 'SMS' : '',
                        draft.actions.whatsAppNotificationEnabled ? 'WhatsApp' : '',
                      ].filter(Boolean).join(', ') || '-'}</div>
                      <div><strong>SLA Enabled:</strong> {draft.actions.slaEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>External Approval:</strong> {draft.actions.externalApprovalEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>Invalidation Enabled:</strong> {draft.actions.invalidationEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>Rejection Handling Policy:</strong> {draft.actions.rejectionHandlingPolicy || '-'}</div>
                      <div><strong>Recall Allowed:</strong> {draft.actions.recallAllowed ? `Yes (${draft.actions.recallAllowedUntil || '-'})` : 'No'}</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <h5 className="font-semibold text-[var(--color-text)]">Action Validation Summary</h5>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--color-text)]">
                      <li>{draft.actions.recordLockPolicy ? 'PASS' : 'FAIL'} Record lock policy selected</li>
                      <li>{draft.actions.editDuringApprovalPolicy ? 'PASS' : 'FAIL'} Edit during approval policy selected</li>
                      <li>{isDetailedSetupMode ? (draft.actions.actions.length > 0 ? 'PASS' : 'FAIL') : 'PASS'} At least one action configured</li>
                      <li>{hasNotificationChannel ? 'PASS' : 'FAIL'} At least one notification channel enabled</li>
                      <li>{draft.actions.rejectionHandlingPolicy ? 'PASS' : 'FAIL'} Rejection handling policy selected</li>
                      <li>{draft.actions.recallAllowed ? (draft.actions.recallAllowedUntil ? 'PASS' : 'FAIL') : 'PASS'} Recall policy valid</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">6.1 Review Summary</h4>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-1 text-xs font-semibold',
                      isSetupComplete
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    )}
                  >
                    {isSetupComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-semibold text-[var(--color-text)]">Policy Summary</h5>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCurrentStep(0)}>Edit Basic Details</button>
                    </div>
                    <div><strong>Policy Name:</strong> {draft.name || '-'}</div>
                    <div><strong>Policy Code:</strong> {draft.policyCode || '-'}</div>
                    <div><strong>Setup Mode:</strong> {draft.setupMode}</div>
                    <div><strong>Module:</strong> {draft.businessDomain || '-'}</div>
                    <div><strong>Entity / Document:</strong> {draft.documentType || draft.entity || '-'}</div>
                    <div><strong>Scope:</strong> {draft.scopeLevel || '-'}{draft.scopeValues ? ` (${draft.scopeValues})` : ''}</div>
                    <div><strong>Policy Priority:</strong> {draft.policyPriority || '-'}</div>
                    <div><strong>Policy Owner:</strong> {draft.policyOwner || '-'}</div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-semibold text-[var(--color-text)]">Trigger Summary</h5>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCurrentStep(1)}>Edit Trigger</button>
                    </div>
                    <div><strong>Submission Trigger Mode:</strong> {draft.dataApplicability.submissionTriggerMode || '-'}</div>
                    <div><strong>Approval Granularity:</strong> {draft.approvalGranularity || '-'}</div>
                    <div><strong>Header Fields to Capture:</strong> {draft.dataApplicability.headerFieldsToCapture.length}</div>
                    <div><strong>Line Fields to Capture:</strong> {draft.dataApplicability.lineFieldsToCapture.length}</div>
                    <div><strong>Snapshot Mode:</strong> {draft.dataApplicability.snapshotMode || '-'}</div>
                    <div><strong>Entry Criteria Type:</strong> {draft.dataApplicability.entryCriteriaType || '-'}</div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-semibold text-[var(--color-text)]">Approver Summary</h5>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCurrentStep(2)}>Edit Approvers</button>
                    </div>
                    <div><strong>Approval Flow Type:</strong> {draft.approvalSection.flowType || '-'}</div>
                    <div><strong>Configured Stages/Steps:</strong> {draft.approvalSection.steps.length}</div>
                    <div><strong>Primary Step:</strong> {draft.approvalSection.steps[0]?.stepName || '-'}</div>
                    <div><strong>Required Approvals:</strong> {draft.approvalSection.steps[0]?.requiredApprovals || '-'}</div>
                    <div><strong>Resolution Type:</strong> {draft.approvalSection.steps[0]?.resolutionType || '-'}</div>
                    <div><strong>Fallback Levels:</strong> {draft.approvalSection.fallbackChain.length}</div>
                    <div><strong>Segregation of Duties:</strong> {draft.approvalSection.segregationOfDuties ? 'Enabled' : 'Disabled'}</div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-semibold text-[var(--color-text)]">Rule Summary</h5>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCurrentStep(3)}>Edit Rules</button>
                    </div>
                    <div><strong>Entry Criteria Type:</strong> {draft.dataApplicability.entryCriteriaType || '-'}</div>
                    <div><strong>Input Set Name:</strong> {draft.dataApplicability.inputSetName || '-'}</div>
                    <div><strong>Rule Inputs:</strong> {draft.dataApplicability.ruleInputs.length}</div>
                    <div><strong>Conditions:</strong> {draft.rules.length}</div>
                    <div><strong>Derivations:</strong> {draft.dataApplicability.derivationRules.length}</div>
                    <div><strong>Decision Rows:</strong> {draft.dataApplicability.decisionRows.length}</div>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm md:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                      <h5 className="font-semibold text-[var(--color-text)]">Action Summary</h5>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCurrentStep(4)}>Edit Actions</button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div><strong>Record Lock Policy:</strong> {draft.actions.recordLockPolicy || '-'}</div>
                      <div><strong>Edit During Approval:</strong> {draft.actions.editDuringApprovalPolicy || '-'}</div>
                      <div><strong>Configured Actions:</strong> {draft.actions.actions.length}</div>
                      <div><strong>Notification Events:</strong> {draft.actions.notificationEvents.length}</div>
                      <div><strong>SLA Enabled:</strong> {draft.actions.slaEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>External Approval:</strong> {draft.actions.externalApprovalEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>Invalidation Enabled:</strong> {draft.actions.invalidationEnabled ? 'Yes' : 'No'}</div>
                      <div><strong>Rejection Handling:</strong> {draft.actions.rejectionHandlingPolicy || '-'}</div>
                    </div>
                  </div>
                </div>
                {!isSetupComplete && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Approval setup is incomplete.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">6.2 Configuration Validation</h4>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn--outline btn--sm" onClick={handleValidateConfiguration} disabled={isReadOnly}>
                    Validate Configuration
                  </button>
                  <span className={cn(
                    'rounded-full border px-2 py-1 text-xs font-semibold',
                    publishValidationStatus === 'Passed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : publishValidationStatus === 'Failed'
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  )}>
                    Validation Status: {publishValidationStatus}
                  </span>
                  <span className={cn(
                    'rounded-full border px-2 py-1 text-xs font-semibold',
                    activationConflictPassed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                  )}>
                    Activation Conflict Check: {activationConflictPassed ? 'Passed' : 'Failed'}
                  </span>
                  <span className={cn(
                    'rounded-full border px-2 py-1 text-xs font-semibold',
                    duplicateScopePassed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
                  )}>
                    Duplicate Scope Check: {duplicateScopePassed ? 'Passed' : 'Failed'}
                  </span>
                </div>

                {publishValidationErrors.length > 0 && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <h5 className="text-xs font-semibold text-rose-700">Validation Error List</h5>
                    <ul className="mt-2 list-disc pl-4 text-xs text-rose-700">
                      {publishValidationErrors.map((errorItem) => (
                        <li key={errorItem}>{errorItem}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {isDetailedSetupMode && publishValidationWarnings.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h5 className="text-xs font-semibold text-amber-700">Validation Warning List</h5>
                    <ul className="mt-2 list-disc pl-4 text-xs text-amber-700">
                      {publishValidationWarnings.map((warningItem) => (
                        <li key={warningItem}>{warningItem}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isDetailedSetupMode && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">6.3 Simulation</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={simulationRequired}
                        disabled={isReadOnly}
                        onChange={(event) => setSimulationRequired(event.target.checked)}
                      />
                      Simulation Required
                    </label>
                    <ActionFormField label="Sample Data Source" required={simulationRequired} tooltip="Select how sample data should be provided for simulation.">
                      <Select
                        value={sampleDataSource}
                        disabled={isReadOnly}
                        onChange={(event) => setSampleDataSource(event.target.value as (typeof sampleDataSourceOptions)[number] | '')}
                        options={[{ value: '', label: 'Select source' }, ...sampleDataSourceOptions.map((option) => ({ value: option, label: option }))]}
                      />
                    </ActionFormField>
                    {sampleDataSource === 'Existing Record' && (
                      <ActionFormField label="Sample Record" required tooltip="Select an existing record to test the approval policy.">
                        <Input
                          value={sampleRecord}
                          readOnly={isReadOnly}
                          onChange={(event) => setSampleRecord(event.target.value)}
                          placeholder="Sample record reference"
                        />
                      </ActionFormField>
                    )}
                    {(sampleDataSource === 'Manual Entry' || sampleDataSource === 'Uploaded Sample') && (
                      <ActionFormField label="Sample Data Input" required tooltip="Enter sample values to test how approval will behave.">
                        <Textarea
                          rows={3}
                          value={sampleDataInput}
                          readOnly={isReadOnly}
                          onChange={(event) => setSampleDataInput(event.target.value)}
                          placeholder="Enter sample key/value data"
                        />
                      </ActionFormField>
                    )}
                    <div className="md:col-span-2">
                      <button type="button" className="btn btn--outline btn--sm" onClick={handleRunSimulation} disabled={isReadOnly || !sampleDataSource}>
                        Simulate on Sample Data
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                    <div className="rounded-lg border border-[var(--color-border)] p-3"><strong>Simulation Result:</strong> {simulationResult || '-'}</div>
                    <div className="rounded-lg border border-[var(--color-border)] p-3"><strong>Simulation Status:</strong> {simulationStatus}</div>
                    <div className="rounded-lg border border-[var(--color-border)] p-3"><strong>Approver Route Simulation:</strong> {approverRouteSimulation || '-'}</div>
                    <div className="rounded-lg border border-[var(--color-border)] p-3 md:col-span-3"><strong>Decision Trace:</strong> {decisionTrace || '-'}</div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">6.4 Activation Details</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <ActionFormField label="Effective From" required tooltip="Select when this approval policy should start working.">
                    <Input type="datetime-local" value={effectiveFrom} readOnly={isReadOnly} onChange={(event) => setEffectiveFrom(event.target.value)} />
                  </ActionFormField>
                  {isDetailedSetupMode && (
                    <ActionFormField label="Effective Time Zone" tooltip="Select the time zone for policy activation.">
                      <Select
                        value={effectiveTimeZone}
                        disabled={isReadOnly}
                        onChange={(event) => setEffectiveTimeZone(event.target.value as (typeof effectiveTimeZoneOptions)[number])}
                        options={effectiveTimeZoneOptions.map((option) => ({ value: option, label: option }))}
                      />
                    </ActionFormField>
                  )}
                  <ActionFormField label="Activation Type" required tooltip="Choose whether this policy should become active immediately or later.">
                    <Select
                      value={activationType}
                      disabled={isReadOnly}
                      onChange={(event) => setActivationType(event.target.value as (typeof activationTypeOptions)[number])}
                      options={activationTypeOptions.map((option) => ({ value: option, label: option }))}
                    />
                  </ActionFormField>
                  <ActionFormField label="Change Log" required tooltip="Write what changed in this approval policy version for audit tracking.">
                    <Textarea rows={3} value={changeLog} readOnly={isReadOnly} onChange={(event) => setChangeLog(event.target.value)} />
                  </ActionFormField>
                  <ActionFormField label="Version Action" required tooltip="Select how this policy version should be handled during activation.">
                    <Select
                      value={versionAction}
                      disabled={isReadOnly}
                      onChange={(event) => setVersionAction(event.target.value as (typeof versionActionOptions)[number] | '')}
                      options={[{ value: '', label: 'Select version action' }, ...versionActionOptions.map((option) => ({ value: option, label: option }))]}
                    />
                  </ActionFormField>
                  {isDetailedSetupMode && hasExistingVersionForScope && (
                    <>
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                        <input
                          type="checkbox"
                          checked={retirePreviousVersion}
                          disabled={isReadOnly}
                          onChange={(event) => setRetirePreviousVersion(event.target.checked)}
                        />
                        Retire Previous Version
                      </label>
                      <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                        <strong>Previous Version Reference:</strong> Active policy exists for same scope.
                      </div>
                      <ActionFormField label="Activation Notes" tooltip="Add any additional notes for activation, rollout, or support reference.">
                        <Textarea rows={3} value={activationNotes} readOnly={isReadOnly} onChange={(event) => setActivationNotes(event.target.value)} />
                      </ActionFormField>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">6.5 Publish Confirmation</h4>
                <div className="mt-3 rounded-lg border border-[var(--color-border)] p-3">
                  <h5 className="text-xs font-semibold text-[var(--color-text)]">Pre-Publish Checklist</h5>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--color-text)]">
                    {prePublishChecklist.map((item) => (
                      <li key={item.label} className={item.passed ? 'text-emerald-700' : 'text-rose-700'}>
                        {item.passed ? 'PASS' : 'FAIL'} {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={userConfirmation}
                    disabled={isReadOnly}
                    onChange={(event) => setUserConfirmation(event.target.checked)}
                  />
                  I confirm that I have reviewed this approval policy and want to publish it.
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn--primary btn--sm" onClick={handlePublish} disabled={!isPublishReady || isReadOnly}>
                    Activate Policy Version
                  </button>
                  <span className={cn(
                    'rounded-full border px-2 py-1 text-xs font-semibold',
                    publishStatus === 'Active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : publishStatus === 'Scheduled'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : publishStatus === 'Failed'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                  )}>
                    Publish Status: {publishStatus}
                  </span>
                  {activationResultMessage && <span className="text-xs text-[var(--color-text-muted)]">{activationResultMessage}</span>}
                  {(publishStatus === 'Active' || publishStatus === 'Scheduled') && (
                    <>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => workflowId && onNavigateToView(workflowId)}>
                        View Active Policy
                      </button>
                      {isDetailedSetupMode && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm text-[var(--color-danger)]"
                          onClick={() => setActivationResultMessage('Rollback/retire action is permission controlled and requires reason capture.')}
                        >
                          Rollback / Retire Policy Action
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {stepError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {stepError}
            </div>
          )}
        </section>

        <div className="h-2" />
      </div>
    </AppShell>
  );
};

export default CreateApprovalWorkflow;
