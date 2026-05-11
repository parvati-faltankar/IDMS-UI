export type ApprovalWorkflowStatus = 'Draft' | 'Active' | 'Paused' | 'Archived';
export type ApprovalWorkflowType = 'Single' | 'Sequential' | 'Parallel' | 'Conditional' | 'Fallback' | 'Multi-level';
export type ApprovalFlowType = 'Single' | 'Sequential' | 'Parallel' | 'Conditional' | 'Fallback';
export type ApprovalPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ApprovalVisibility = 'Private' | 'Team only' | 'Organization-wide' | 'Specific roles/users';
export type ApproverKind = 'individual' | 'team';
export type ApprovalBusinessDomain = 'Inventory' | 'Sales' | 'Service' | 'Procurement';
export type ApprovalGranularity = 'Header' | 'Line' | 'Hybrid';
export type ApprovalScopeLevel =
  | 'Global'
  | 'Organisation'
  | 'Branch'
  | 'Department'
  | 'Role'
  | 'User'
  | 'Custom'
  | 'Region'
  | 'Org';
export type SubmissionTriggerMode = 'User Submit' | 'System Event' | 'API';
export type SnapshotMode = 'Snapshot' | 'Live';
export type EntryCriteriaType =
  | 'Condition'
  | 'Formula'
  | 'Approval Eligibility Matrix'
  | 'Hybrid'
  | 'Decision Table';
export type RuleInputDataType = 'Number' | 'Text' | 'Date' | 'Boolean' | 'Lookup';
export type RuleInputSourceType = 'Record' | 'Related' | 'Related Record' | 'Context' | 'Constant' | 'Derived';
export type RuleInputNullHandling = 'Error' | 'Zero' | 'False' | 'Skip' | 'Use Default';
export type DecisionTableHitPolicy = 'FIRST_MATCH' | 'PRIORITY' | 'ALL_MATCH' | 'COLLECT';
export type DecisionTableStatus = 'Draft' | 'Active' | 'Retired';
export type ApprovalSetupMode = 'Quick Setup' | 'Detailed Setup';
export type StageExecutionMode = 'Sequential' | 'Parallel' | 'Any-One' | 'All';
export type RequiredApprovalsMode = 'ALL' | 'ANY' | 'N-of-M';
export type ResolutionType =
  | 'Role'
  | 'User'
  | 'Queue'
  | 'Hierarchy'
  | 'Approver Routing Matrix'
  | 'Attribute Rule';
export type FallbackLevelType = 'Queue' | 'Role' | 'User' | 'Admin';
export type MissingApproverAction = 'Use Fallback Chain' | 'Block Submission' | 'Send to Admin Queue';
export type DelegationSource = 'User Delegation' | 'Role Delegation' | 'System Delegation Rule';
export type ReassignmentAuthority = 'Current Approver' | 'Admin' | 'Policy Owner' | 'Same Role Manager';
export type ActionEventType =
  | 'OnSubmit'
  | 'StepApprove'
  | 'StepReject'
  | 'FinalApprove'
  | 'FinalReject'
  | 'Timeout'
  | 'Recall';
export type ActionType = 'Field Update' | 'Notify' | 'API' | 'Lock' | 'Unlock' | 'Task' | 'Script';
export type RetryPolicy = 'None' | 'Fixed' | 'Exponential';
export type FailureHandling = 'Reject' | 'Hold Pending' | 'Manual Review' | 'Retry Later';
export type RecordLockPolicy = 'Do Not Lock' | 'Lock on Submit' | 'Lock on Step Approval' | 'Lock on Final Approval';
export type EditDuringApprovalPolicy = 'No Edit' | 'Allow Edit with Invalidation' | 'Allow Edit without Invalidation';
export type AttachmentRequiredEvent = 'Approve' | 'Reject' | 'Recall' | 'Reassign';
export type NotificationEvent =
  | 'Submitted'
  | 'Assigned'
  | 'Approved'
  | 'Rejected'
  | 'Recalled'
  | 'Escalated'
  | 'Timed Out'
  | 'Failed'
  | 'Final Approved'
  | 'Final Rejected';
export type NotificationRecipientType =
  | 'Requester'
  | 'Current Approver'
  | 'Previous Approver'
  | 'Next Approver'
  | 'Policy Owner'
  | 'Admin'
  | 'Custom User'
  | 'Role'
  | 'Queue';
export type NotificationLanguage = 'Default' | 'User Preferred' | 'Specific Language';
export type DigestFrequency = 'Hourly' | 'Daily' | 'Weekly';
export type SlaUnit = 'Hours' | 'Days';
export type SlaCalendar = 'Business Calendar' | '24x7 Calendar';
export type AutoActionOnTimeout = 'None' | 'Auto Approve' | 'Auto Reject' | 'Escalate Only';
export type ExternalApprovalMode = 'Secure Link' | 'Login Required';
export type OtpChannel = 'SMS' | 'Email' | 'WhatsApp';
export type InvalidationStrategy = 'Invalidate Impacted Lines' | 'Invalidate Whole Request';
export type PartialApprovalPolicy = 'Block All' | 'Allow Approved Only' | 'Split Processing';
export type RejectionHandlingPolicy = 'Block + Edit + Resubmit' | 'Block Permanently' | 'Cancel';
export type RejectedLineEditPolicy = 'Allow Edit' | 'View Only' | 'Remove from Processing';
export type RecallAllowedUntil = 'Before First Approval' | 'Before Final Approval' | 'Anytime Before Completion';
export type CancelApprovalPermission = 'Requester' | 'Policy Owner' | 'Admin' | 'Approver';

export interface ApprovalApprover {
  id: string;
  kind: ApproverKind;
  name: string;
  required: boolean;
  fallbackApprover: string;
}

export interface ApprovalRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  action: string;
  comparisonType?: 'Literal' | 'Field' | 'Expression' | '';
  joinLogic?: 'AND' | 'OR' | '';
  nullHandling?: 'Fail' | 'Treat as blank' | 'Skip' | '';
  priority?: string;
  enabled?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface ApprovalActionRow {
  id: string;
  eventType: ActionEventType | '';
  actionType: ActionType | '';
  actionConfiguration: string;
  fieldToUpdate: string;
  updateValue: string;
  taskTemplate: string;
  apiEndpoint: string;
  scriptAction: string;
  idempotencyKeyRule: string;
  retryPolicy: RetryPolicy | '';
  retryCount: string;
  failureHandling: FailureHandling | '';
}

export interface ApprovalActionSettings {
  recordLockPolicy: RecordLockPolicy | '';
  editDuringApprovalPolicy: EditDuringApprovalPolicy | '';
  unlockOnRejection: boolean;
  unlockOnRecall: boolean;
  actions: ApprovalActionRow[];
  remarksRequiredOnApprove: boolean;
  remarksRequiredOnReject: boolean;
  remarksRequiredOnRecall: boolean;
  bulkActionRemarksRequired: boolean;
  decisionAttachmentRequired: boolean;
  attachmentRequiredEvent: AttachmentRequiredEvent[];
  allowedFileTypes: string[];
  maximumFileSize: string;
  inAppNotificationEnabled: boolean;
  emailNotificationEnabled: boolean;
  smsNotificationEnabled: boolean;
  whatsAppNotificationEnabled: boolean;
  notificationEvents: NotificationEvent[];
  templateMapping: string;
  notificationRecipientType: NotificationRecipientType[];
  notificationLanguage: NotificationLanguage;
  digestNotificationEnabled: boolean;
  digestFrequency: DigestFrequency | '';
  slaEnabled: boolean;
  slaDuration: string;
  slaUnit: SlaUnit | '';
  slaCalendar: SlaCalendar | '';
  reminderBeforeDue: boolean;
  reminderTimeBeforeDue: string;
  escalationPolicy: string;
  escalationLevelCount: string;
  autoActionOnTimeout: AutoActionOnTimeout;
  timeoutJustification: string;
  externalApprovalEnabled: boolean;
  externalApprovalMode: ExternalApprovalMode | '';
  approveViaSecureLink: boolean;
  tokenTtl: string;
  otpRequired: boolean;
  otpChannel: OtpChannel | '';
  maxOtpAttempts: string;
  allowLinkResend: boolean;
  revokeLinkOnDecision: boolean;
  invalidationEnabled: boolean;
  invalidationTriggers: string[];
  invalidationStrategy: InvalidationStrategy | '';
  autoResubmitOnSave: boolean;
  resubmissionRequiresRemarks: boolean;
  headerAggregationRule: string;
  partialApprovalPolicy: PartialApprovalPolicy | '';
  rejectionHandlingPolicy: RejectionHandlingPolicy | '';
  rejectedLineEditPolicy: RejectedLineEditPolicy | '';
  recallAllowed: boolean;
  recallAllowedUntil: RecallAllowedUntil | '';
  cancelApprovalPermission: CancelApprovalPermission[];
}

export interface ApprovalPermissionSettings {
  visibility: ApprovalVisibility;
  roles: string;
  users: string;
}

export interface RuleInputRow {
  id: string;
  inputCode: string;
  inputDisplayName?: string;
  dataType: RuleInputDataType | '';
  sourceType: RuleInputSourceType | '';
  sourceMapping: string;
  constantValue?: string;
  defaultValue: string;
  nullHandling: RuleInputNullHandling | '';
  mandatoryForEvaluation?: boolean;
}

export interface DerivationRuleRow {
  id: string;
  derivedOutputCode: string;
  derivationExpression: string;
  derivationEvaluationOrder?: string;
}

export interface DecisionTableRow {
  id: string;
  conditionExpression: string;
  outputValue: string;
  priority: string;
  rowEffectiveFrom?: string;
  rowEffectiveTo?: string;
}

export interface ApprovalDataApplicabilitySettings {
  submissionTriggerMode: SubmissionTriggerMode | '';
  systemEvent?: string;
  apiTriggerKey?: string;
  headerFieldsToCapture: string[];
  lineFieldsToCapture: string[];
  includeRelatedFields?: boolean;
  relatedFieldsToCapture?: string[];
  snapshotMode: SnapshotMode | '';
  snapshotCapturePoint?: 'On Submit' | 'On Trigger Event' | 'On First Approval Step' | '';
  triggerDescription?: string;
  requireRemarksPerLine: boolean;
  requireAttachments: boolean;
  entryCriteriaType: EntryCriteriaType | '';
  ruleSetName?: string;
  ruleSetDescription?: string;
  conditionBuilderRules: string;
  conditionLogic?: 'AND' | 'OR' | 'Custom Logic' | '';
  formulaExpression: string;
  formulaTestResult?: 'True' | 'False' | 'Error' | '';
  ruleOutputWhenMatched?: 'Approval Required' | 'Approval Not Required' | 'Route to Matrix' | '';
  rulePriority?: string;
  decisionTableReference: string;
  reevaluateOnEdit: boolean;
  inputSetName: string;
  ruleInputs: RuleInputRow[];
  derivationRules: DerivationRuleRow[];
  decisionTableName: string;
  decisionTableHitPolicy: DecisionTableHitPolicy | '';
  decisionTableVersion: number;
  decisionTableStatus: DecisionTableStatus;
  decisionInputColumns: string[];
  decisionOutputColumns: string[];
  decisionRows: DecisionTableRow[];
  matrixEnabled?: boolean;
  noMatchHandling?: 'Approval Not Required' | 'Block Submission' | 'Send to Manual Review' | '';
  overlapDetectionPass: boolean;
  gapDetectionStatus?: 'Pass' | 'Warning' | 'Fail';
  sampleDataInput?: string;
  ruleResultPreview?: 'Approval Required' | 'Approval Not Required' | 'Manual Review' | 'Block Submission' | 'Error' | '';
  decisionTracePreview?: string;
  activationValidationChecks: string[];
}

export interface ApprovalStepConfig {
  id: string;
  stageName: string;
  stageSequence: number;
  stageExecutionMode: StageExecutionMode | '';
  stepName: string;
  stepSequence: number;
  stepDescription: string;
  requiredApprovals: RequiredApprovalsMode;
  requiredApprovalCount: string;
  totalApproverCount: string;
  resolutionType: ResolutionType | '';
  role: string;
  users: string[];
  queue: string;
  managerLevel: string;
  approverRoutingMatrix: string;
  attributeRuleReference: string;
  allowMultipleApprovers: boolean;
}

export interface FallbackLevel {
  id: string;
  type: FallbackLevelType;
  value: string;
}

export interface ApprovalSectionConfig {
  setupMode: ApprovalSetupMode;
  flowType: ApprovalWorkflowType | '';
  stageSetupRequired: boolean;
  steps: ApprovalStepConfig[];
  approverAvailabilityCheck: boolean;
  fallbackChain: FallbackLevel[];
  finalFallbackOwner: string;
  segregationOfDuties: boolean;
  allowRequesterInApprovalQueue: boolean;
  delegationAllowed: boolean;
  delegationSource: DelegationSource | '';
  reassignmentAllowed: boolean;
  reassignmentAuthority: ReassignmentAuthority | '';
  bulkApprovalAllowed: boolean;
  maxBulkApprovalCount: string;
  missingApproverAction: MissingApproverAction;
}

export interface ApprovalWorkflowDraft {
  policyCode: string;
  name: string;
  description: string;
  setupMode: ApprovalSetupMode;
  category: string;
  businessDomain: ApprovalBusinessDomain | '';
  entity: string;
  documentType: string;
  approvalGranularity: ApprovalGranularity | '';
  scopeLevel: ApprovalScopeLevel | '';
  scopeValues: string;
  policyPriority: string;
  ownerTeam: string;
  policyOwner: string;
  tags: string[];
  priority: ApprovalPriority;
  type: ApprovalWorkflowType | '';
  dataApplicability: ApprovalDataApplicabilitySettings;
  approvalSection: ApprovalSectionConfig;
  approvers: ApprovalApprover[];
  rules: ApprovalRule[];
  actions: ApprovalActionSettings;
  permissions: ApprovalPermissionSettings;
}

export interface ApprovalWorkflowRecord extends ApprovalWorkflowDraft {
  id: string;
  status: ApprovalWorkflowStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

const APPROVAL_STUDIO_STORAGE_KEY = 'approval-studio:workflows';
const DEFAULT_OWNER = 'Alex Kumar';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createDefaultActionRow(): ApprovalActionRow {
  return {
    id: createId('action-row'),
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

function createDefaultApprovalActionSettings(): ApprovalActionSettings {
  return {
    recordLockPolicy: 'Lock on Submit',
    editDuringApprovalPolicy: 'No Edit',
    unlockOnRejection: true,
    unlockOnRecall: true,
    actions: [createDefaultActionRow()],
    remarksRequiredOnApprove: false,
    remarksRequiredOnReject: true,
    remarksRequiredOnRecall: true,
    bulkActionRemarksRequired: true,
    decisionAttachmentRequired: false,
    attachmentRequiredEvent: [],
    allowedFileTypes: ['PDF'],
    maximumFileSize: '10',
    inAppNotificationEnabled: true,
    emailNotificationEnabled: false,
    smsNotificationEnabled: false,
    whatsAppNotificationEnabled: false,
    notificationEvents: ['Submitted', 'Assigned'],
    templateMapping: '',
    notificationRecipientType: ['Current Approver'],
    notificationLanguage: 'Default',
    digestNotificationEnabled: false,
    digestFrequency: '',
    slaEnabled: false,
    slaDuration: '',
    slaUnit: '',
    slaCalendar: '',
    reminderBeforeDue: false,
    reminderTimeBeforeDue: '',
    escalationPolicy: '',
    escalationLevelCount: '',
    autoActionOnTimeout: 'Escalate Only',
    timeoutJustification: '',
    externalApprovalEnabled: false,
    externalApprovalMode: '',
    approveViaSecureLink: true,
    tokenTtl: '120',
    otpRequired: true,
    otpChannel: 'SMS',
    maxOtpAttempts: '3',
    allowLinkResend: true,
    revokeLinkOnDecision: true,
    invalidationEnabled: false,
    invalidationTriggers: [],
    invalidationStrategy: '',
    autoResubmitOnSave: false,
    resubmissionRequiresRemarks: true,
    headerAggregationRule: 'Header status reflects aggregate of line decisions',
    partialApprovalPolicy: '',
    rejectionHandlingPolicy: 'Block + Edit + Resubmit',
    rejectedLineEditPolicy: '',
    recallAllowed: true,
    recallAllowedUntil: 'Before Final Approval',
    cancelApprovalPermission: ['Requester'],
  };
}

export function createEmptyApprovalWorkflowDraft(): ApprovalWorkflowDraft {
  return {
    policyCode: '',
    name: '',
    description: '',
    setupMode: 'Quick Setup',
    category: '',
    businessDomain: '',
    entity: '',
    documentType: '',
    approvalGranularity: 'Header',
    scopeLevel: 'Global',
    scopeValues: '',
    policyPriority: '1',
    ownerTeam: '',
    policyOwner: '',
    tags: [],
    priority: 'Medium',
    type: '',
    dataApplicability: {
      submissionTriggerMode: 'User Submit',
      systemEvent: '',
      apiTriggerKey: '',
      headerFieldsToCapture: [],
      lineFieldsToCapture: [],
      includeRelatedFields: false,
      relatedFieldsToCapture: [],
      snapshotMode: 'Snapshot',
      snapshotCapturePoint: 'On Submit',
      triggerDescription: '',
      requireRemarksPerLine: false,
      requireAttachments: false,
      entryCriteriaType: 'Condition',
      ruleSetName: '',
      ruleSetDescription: '',
      conditionBuilderRules: '',
      conditionLogic: 'AND',
      formulaExpression: '',
      formulaTestResult: '',
      ruleOutputWhenMatched: 'Approval Required',
      rulePriority: '',
      decisionTableReference: '',
      reevaluateOnEdit: false,
      inputSetName: '',
      ruleInputs: [],
      derivationRules: [],
      decisionTableName: '',
      decisionTableHitPolicy: '',
      decisionTableVersion: 1,
      decisionTableStatus: 'Draft',
      decisionInputColumns: [],
      decisionOutputColumns: [],
      decisionRows: [],
      matrixEnabled: false,
      noMatchHandling: 'Approval Not Required',
      overlapDetectionPass: true,
      gapDetectionStatus: 'Pass',
      sampleDataInput: '',
      ruleResultPreview: '',
      decisionTracePreview: '',
      activationValidationChecks: ['Schema complete', 'At least one decision row'],
    },
    approvalSection: {
      setupMode: 'Quick Setup',
      flowType: 'Single',
      stageSetupRequired: false,
      steps: [
        {
          id: createId('approval-step'),
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
        },
      ],
      approverAvailabilityCheck: true,
      fallbackChain: [{ id: createId('fallback'), type: 'Role', value: '' }],
      finalFallbackOwner: '',
      segregationOfDuties: true,
      allowRequesterInApprovalQueue: false,
      delegationAllowed: false,
      delegationSource: '',
      reassignmentAllowed: false,
      reassignmentAuthority: '',
      bulkApprovalAllowed: false,
      maxBulkApprovalCount: '',
      missingApproverAction: 'Use Fallback Chain',
    },
    approvers: [],
    rules: [],
    actions: createDefaultApprovalActionSettings(),
    permissions: {
      visibility: 'Team only',
      roles: '',
      users: '',
    },
  };
}

function seedApprovalWorkflows(): ApprovalWorkflowRecord[] {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const makeDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * oneDay).toISOString();

  return [
    {
      id: 'apv-0001',
      policyCode: 'PO_HIGH_VALUE_APPROVAL',
      name: 'Purchase Order High Value',
      description: 'High value purchase orders require finance and procurement signoff',
      setupMode: 'Detailed Setup',
      category: 'Procurement',
      businessDomain: 'Procurement',
      entity: 'Ordering',
      documentType: 'Purchase Order',
      approvalGranularity: 'Header',
      scopeLevel: 'Org',
      scopeValues: 'North Procurement Org',
      policyPriority: '1',
      ownerTeam: 'Procurement Control',
      policyOwner: 'Alex Kumar',
      tags: ['Purchase', 'High Value', 'Finance'],
      priority: 'High',
      type: 'Sequential',
      dataApplicability: {
        submissionTriggerMode: 'User Submit',
        headerFieldsToCapture: ['documentNo', 'requester', 'department'],
        lineFieldsToCapture: ['itemCode', 'qty'],
        snapshotMode: 'Snapshot',
        requireRemarksPerLine: true,
        requireAttachments: true,
        entryCriteriaType: 'Condition',
        conditionBuilderRules: 'amount > 500000 AND department = Procurement',
        formulaExpression: '',
        decisionTableReference: '',
        reevaluateOnEdit: true,
        inputSetName: 'HighValuePOInputSet',
        ruleInputs: [],
        derivationRules: [],
        decisionTableName: 'PO Value Routing',
        decisionTableHitPolicy: 'FIRST_MATCH',
        decisionTableVersion: 1,
        decisionTableStatus: 'Active',
        decisionInputColumns: ['amount', 'department'],
        decisionOutputColumns: ['approvalPath'],
        decisionRows: [],
        overlapDetectionPass: true,
        activationValidationChecks: ['Schema complete', 'Decision rows valid'],
      },
      approvalSection: {
        setupMode: 'Detailed Setup',
        flowType: 'Sequential',
        stageSetupRequired: true,
        steps: [
          {
            id: 'approval-step-1',
            stageName: 'Level 1 Approval',
            stageSequence: 1,
            stageExecutionMode: 'Sequential',
            stepName: 'Branch Manager Approval',
            stepSequence: 1,
            stepDescription: 'Initial branch manager approval',
            requiredApprovals: 'ALL',
            requiredApprovalCount: '',
            totalApproverCount: '2',
            resolutionType: 'Role',
            role: 'Branch Manager',
            users: [],
            queue: '',
            managerLevel: '',
            approverRoutingMatrix: '',
            attributeRuleReference: '',
            allowMultipleApprovers: false,
          },
        ],
        approverAvailabilityCheck: true,
        fallbackChain: [
          { id: 'fallback-1', type: 'Role', value: 'Regional Manager' },
          { id: 'fallback-2', type: 'Queue', value: 'Admin Queue' },
        ],
        finalFallbackOwner: 'Admin Queue',
        segregationOfDuties: true,
        allowRequesterInApprovalQueue: false,
        delegationAllowed: true,
        delegationSource: 'User Delegation',
        reassignmentAllowed: true,
        reassignmentAuthority: 'Admin',
        bulkApprovalAllowed: false,
        maxBulkApprovalCount: '',
        missingApproverAction: 'Use Fallback Chain',
      },
      status: 'Active',
      owner: 'Alex Kumar',
      createdAt: makeDate(28),
      updatedAt: makeDate(2),
      approvers: [
        { id: 'apr-1', kind: 'individual', name: 'Neha Sharma', required: true, fallbackApprover: 'Rohit Menon' },
        { id: 'apr-2', kind: 'team', name: 'Finance Team', required: true, fallbackApprover: '' },
      ],
      rules: [
        { id: 'rule-1', field: 'Amount', operator: '>', value: '500000', action: 'Require CFO approval' },
      ],
      actions: createDefaultApprovalActionSettings(),
      permissions: {
        visibility: 'Team only',
        roles: 'Procurement Lead, Finance Lead',
        users: '',
      },
    },
    {
      id: 'apv-0002',
      policyCode: 'SALES_DISCOUNT_OVERRIDE',
      name: 'Sales Discount Override',
      description: 'Controls approvals for discount override above standard slab',
      setupMode: 'Detailed Setup',
      category: 'Sales',
      businessDomain: 'Sales',
      entity: 'Invoicing',
      documentType: 'Sale Invoice',
      approvalGranularity: 'Hybrid',
      scopeLevel: 'Region',
      scopeValues: 'West Region',
      policyPriority: '2',
      ownerTeam: 'Sales Operations',
      policyOwner: 'Rohit Menon',
      tags: ['Sales', 'Discount', 'Critical'],
      priority: 'Critical',
      type: 'Conditional',
      dataApplicability: {
        submissionTriggerMode: 'API',
        headerFieldsToCapture: ['customer', 'discount'],
        lineFieldsToCapture: ['lineDiscount'],
        snapshotMode: 'Live',
        requireRemarksPerLine: false,
        requireAttachments: false,
        entryCriteriaType: 'Formula',
        conditionBuilderRules: '',
        formulaExpression: 'discount >= 15',
        decisionTableReference: '',
        reevaluateOnEdit: true,
        inputSetName: 'DiscountOverrideInputSet',
        ruleInputs: [],
        derivationRules: [],
        decisionTableName: 'Discount Approval',
        decisionTableHitPolicy: 'PRIORITY',
        decisionTableVersion: 2,
        decisionTableStatus: 'Draft',
        decisionInputColumns: ['discount', 'region'],
        decisionOutputColumns: ['requiredRole'],
        decisionRows: [],
        overlapDetectionPass: true,
        activationValidationChecks: ['Schema complete'],
      },
      approvalSection: {
        setupMode: 'Detailed Setup',
        flowType: 'Conditional',
        stageSetupRequired: true,
        steps: [
          {
            id: 'approval-step-2',
            stageName: 'Discount Control',
            stageSequence: 1,
            stageExecutionMode: 'Any-One',
            stepName: 'Regional Sales Approval',
            stepSequence: 1,
            stepDescription: 'Sales leadership approval for discount exceptions',
            requiredApprovals: 'ANY',
            requiredApprovalCount: '',
            totalApproverCount: '3',
            resolutionType: 'Queue',
            role: '',
            users: [],
            queue: 'Sales Leadership Queue',
            managerLevel: '',
            approverRoutingMatrix: '',
            attributeRuleReference: '',
            allowMultipleApprovers: true,
          },
        ],
        approverAvailabilityCheck: true,
        fallbackChain: [{ id: 'fallback-3', type: 'Admin', value: 'Central Admin Queue' }],
        finalFallbackOwner: 'Central Admin Queue',
        segregationOfDuties: true,
        allowRequesterInApprovalQueue: false,
        delegationAllowed: false,
        delegationSource: '',
        reassignmentAllowed: true,
        reassignmentAuthority: 'Policy Owner',
        bulkApprovalAllowed: true,
        maxBulkApprovalCount: '25',
        missingApproverAction: 'Use Fallback Chain',
      },
      status: 'Draft',
      owner: 'Rohit Menon',
      createdAt: makeDate(12),
      updatedAt: makeDate(1),
      approvers: [{ id: 'apr-3', kind: 'team', name: 'Sales Leadership', required: true, fallbackApprover: '' }],
      rules: [
        { id: 'rule-2', field: 'Discount %', operator: '>=', value: '15', action: 'Require regional head approval' },
      ],
      actions: createDefaultApprovalActionSettings(),
      permissions: {
        visibility: 'Organization-wide',
        roles: '',
        users: '',
      },
    },
    {
      id: 'apv-0003',
      policyCode: 'INTER_BRANCH_STOCK_TRANSFER',
      name: 'Inter-branch Stock Transfer',
      description: 'Parallel approval for urgent inter branch stock movement',
      setupMode: 'Quick Setup',
      category: 'Inventory',
      businessDomain: 'Inventory',
      entity: 'Stock Transfer',
      documentType: 'Stock Transfer',
      approvalGranularity: 'Line',
      scopeLevel: 'Branch',
      scopeValues: 'Pune Branch',
      policyPriority: '3',
      ownerTeam: 'Inventory Planning',
      policyOwner: 'Priya Nair',
      tags: ['Inventory', 'Branch'],
      priority: 'Medium',
      type: 'Parallel',
      dataApplicability: {
        submissionTriggerMode: 'System Event',
        headerFieldsToCapture: ['transferType', 'branch'],
        lineFieldsToCapture: ['item', 'qty'],
        snapshotMode: 'Snapshot',
        requireRemarksPerLine: false,
        requireAttachments: false,
        entryCriteriaType: 'Decision Table',
        conditionBuilderRules: '',
        formulaExpression: '',
        decisionTableReference: 'DT-INV-001',
        reevaluateOnEdit: false,
        inputSetName: 'StockTransferInputSet',
        ruleInputs: [],
        derivationRules: [],
        decisionTableName: 'Stock Transfer Routing',
        decisionTableHitPolicy: 'COLLECT',
        decisionTableVersion: 1,
        decisionTableStatus: 'Active',
        decisionInputColumns: ['transferType', 'riskLevel'],
        decisionOutputColumns: ['approvalGroup'],
        decisionRows: [],
        overlapDetectionPass: true,
        activationValidationChecks: ['Decision rows valid'],
      },
      approvalSection: {
        setupMode: 'Quick Setup',
        flowType: 'Parallel',
        stageSetupRequired: false,
        steps: [
          {
            id: 'approval-step-3',
            stageName: '',
            stageSequence: 1,
            stageExecutionMode: 'Parallel',
            stepName: 'Inventory Controller Approval',
            stepSequence: 1,
            stepDescription: '',
            requiredApprovals: 'ALL',
            requiredApprovalCount: '',
            totalApproverCount: '2',
            resolutionType: 'User',
            role: '',
            users: ['Arjun Patel', 'Priya Nair'],
            queue: '',
            managerLevel: '',
            approverRoutingMatrix: '',
            attributeRuleReference: '',
            allowMultipleApprovers: true,
          },
        ],
        approverAvailabilityCheck: true,
        fallbackChain: [{ id: 'fallback-4', type: 'Role', value: 'Inventory Head' }],
        finalFallbackOwner: 'Inventory Head',
        segregationOfDuties: true,
        allowRequesterInApprovalQueue: false,
        delegationAllowed: false,
        delegationSource: '',
        reassignmentAllowed: false,
        reassignmentAuthority: '',
        bulkApprovalAllowed: false,
        maxBulkApprovalCount: '',
        missingApproverAction: 'Use Fallback Chain',
      },
      status: 'Paused',
      owner: 'Priya Nair',
      createdAt: makeDate(34),
      updatedAt: makeDate(9),
      approvers: [{ id: 'apr-4', kind: 'individual', name: 'Arjun Patel', required: true, fallbackApprover: '' }],
      rules: [
        { id: 'rule-3', field: 'Transfer type', operator: '=', value: 'Urgent', action: 'Notify inventory control' },
      ],
      actions: createDefaultApprovalActionSettings(),
      permissions: {
        visibility: 'Specific roles/users',
        roles: 'Inventory Controller',
        users: 'arjun.patel',
      },
    },
  ];
}

function readFromStorage(): ApprovalWorkflowRecord[] {
  if (typeof window === 'undefined') {
    return seedApprovalWorkflows();
  }

  try {
    const rawValue = window.localStorage.getItem(APPROVAL_STUDIO_STORAGE_KEY);
    if (!rawValue) {
      const seeded = seedApprovalWorkflows();
      writeToStorage(seeded);
      return seeded;
    }

    const parsed = JSON.parse(rawValue) as ApprovalWorkflowRecord[];
    if (!Array.isArray(parsed)) {
      const seeded = seedApprovalWorkflows();
      writeToStorage(seeded);
      return seeded;
    }

    return parsed.map(normalizeApprovalWorkflowRecord);
  } catch {
    const seeded = seedApprovalWorkflows();
    writeToStorage(seeded);
    return seeded;
  }
}

function normalizeApprovalWorkflowRecord(record: ApprovalWorkflowRecord): ApprovalWorkflowRecord {
  const legacyRecord = record as ApprovalWorkflowRecord & {
    notifications?: {
      notifyApproversOnRequest?: boolean;
      notifyRequesterOnDecision?: boolean;
      reminderFrequency?: string;
      escalationAfterHours?: string;
      customMessageTemplate?: string;
    };
  };
  const fallbackBusinessDomain = (
    record.businessDomain ??
    (record.category as ApprovalBusinessDomain | undefined) ??
    ''
  ) as ApprovalBusinessDomain | '';

  const normalizedApprovalSection: ApprovalSectionConfig = {
    setupMode: record.approvalSection?.setupMode ?? 'Quick Setup',
    flowType: record.approvalSection?.flowType ?? record.type ?? 'Single',
    stageSetupRequired: record.approvalSection?.stageSetupRequired ?? false,
    steps:
      record.approvalSection?.steps?.map((step) => {
        const legacyStep = step as unknown as {
          decisionTable?: string;
          abacRule?: string;
          resolutionType?: string;
        };
        return {
        id: step.id ?? createId('approval-step'),
        stageName: step.stageName ?? '',
        stageSequence: step.stageSequence ?? 1,
        stageExecutionMode: step.stageExecutionMode ?? '',
        stepName: step.stepName ?? '',
        stepSequence: step.stepSequence ?? 1,
        stepDescription: step.stepDescription ?? '',
        requiredApprovals: step.requiredApprovals ?? 'ALL',
        requiredApprovalCount: step.requiredApprovalCount ?? '',
        totalApproverCount: step.totalApproverCount ?? '',
        resolutionType:
          legacyStep.resolutionType === 'Decision Table'
            ? 'Approver Routing Matrix'
            : legacyStep.resolutionType === 'ABAC'
              ? 'Attribute Rule'
              : step.resolutionType ?? 'Role',
        role: step.role ?? '',
        users: step.users ?? [],
        queue: step.queue ?? '',
        managerLevel: step.managerLevel ?? '',
        approverRoutingMatrix: step.approverRoutingMatrix ?? legacyStep.decisionTable ?? '',
        attributeRuleReference: step.attributeRuleReference ?? legacyStep.abacRule ?? '',
        allowMultipleApprovers: step.allowMultipleApprovers ?? false,
      };
      }) ??
      [
        {
          id: createId('approval-step'),
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
        },
      ],
    approverAvailabilityCheck: record.approvalSection?.approverAvailabilityCheck ?? true,
    fallbackChain:
      record.approvalSection?.fallbackChain?.map((level) => ({
        id: level.id ?? createId('fallback'),
        type: level.type ?? 'Role',
        value: level.value ?? '',
      })) ?? [{ id: createId('fallback'), type: 'Role', value: '' }],
    finalFallbackOwner: record.approvalSection?.finalFallbackOwner ?? '',
    segregationOfDuties: record.approvalSection?.segregationOfDuties ?? true,
    allowRequesterInApprovalQueue: record.approvalSection?.allowRequesterInApprovalQueue ?? false,
    delegationAllowed: record.approvalSection?.delegationAllowed ?? false,
    delegationSource: record.approvalSection?.delegationSource ?? '',
    reassignmentAllowed: record.approvalSection?.reassignmentAllowed ?? false,
    reassignmentAuthority: record.approvalSection?.reassignmentAuthority ?? '',
    bulkApprovalAllowed: record.approvalSection?.bulkApprovalAllowed ?? false,
    maxBulkApprovalCount: record.approvalSection?.maxBulkApprovalCount ?? '',
    missingApproverAction: record.approvalSection?.missingApproverAction ?? 'Use Fallback Chain',
  };

  const defaultActionSettings = createDefaultApprovalActionSettings();
  const normalizedActions: ApprovalActionSettings = {
    ...defaultActionSettings,
    ...(record.actions ?? {}),
    actions:
      record.actions?.actions?.map((actionRow) => ({
        ...createDefaultActionRow(),
        ...actionRow,
        id: actionRow.id ?? createId('action-row'),
      })) ??
      defaultActionSettings.actions,
    notificationEvents:
      record.actions?.notificationEvents ??
      (legacyRecord.notifications?.notifyApproversOnRequest || legacyRecord.notifications?.notifyRequesterOnDecision
        ? ['Submitted', 'Assigned']
        : defaultActionSettings.notificationEvents),
    templateMapping:
      record.actions?.templateMapping ?? legacyRecord.notifications?.customMessageTemplate ?? defaultActionSettings.templateMapping,
    reminderTimeBeforeDue:
      record.actions?.reminderTimeBeforeDue ??
      legacyRecord.notifications?.escalationAfterHours ??
      defaultActionSettings.reminderTimeBeforeDue,
  };

  return {
    ...record,
    policyCode: record.policyCode ?? '',
    setupMode: record.setupMode ?? record.approvalSection?.setupMode ?? 'Quick Setup',
    category: record.category ?? fallbackBusinessDomain,
    businessDomain: fallbackBusinessDomain,
    entity: record.entity ?? '',
    documentType: record.documentType ?? '',
    approvalGranularity: record.approvalGranularity ?? '',
    scopeLevel: record.scopeLevel ?? 'Global',
    scopeValues: record.scopeValues ?? '',
    policyPriority: record.policyPriority ?? '1',
    ownerTeam: record.ownerTeam ?? '',
    policyOwner: record.policyOwner ?? '',
    tags: record.tags ?? [],
    dataApplicability: {
      submissionTriggerMode: record.dataApplicability?.submissionTriggerMode ?? '',
      systemEvent: record.dataApplicability?.systemEvent ?? '',
      apiTriggerKey: record.dataApplicability?.apiTriggerKey ?? '',
      headerFieldsToCapture: record.dataApplicability?.headerFieldsToCapture ?? [],
      lineFieldsToCapture: record.dataApplicability?.lineFieldsToCapture ?? [],
      includeRelatedFields: record.dataApplicability?.includeRelatedFields ?? false,
      relatedFieldsToCapture: record.dataApplicability?.relatedFieldsToCapture ?? [],
      snapshotMode: record.dataApplicability?.snapshotMode ?? '',
      snapshotCapturePoint: record.dataApplicability?.snapshotCapturePoint ?? 'On Submit',
      triggerDescription: record.dataApplicability?.triggerDescription ?? '',
      requireRemarksPerLine: record.dataApplicability?.requireRemarksPerLine ?? false,
      requireAttachments: record.dataApplicability?.requireAttachments ?? false,
      entryCriteriaType: record.dataApplicability?.entryCriteriaType ?? '',
      ruleSetName: record.dataApplicability?.ruleSetName ?? '',
      ruleSetDescription: record.dataApplicability?.ruleSetDescription ?? '',
      conditionBuilderRules: record.dataApplicability?.conditionBuilderRules ?? '',
      conditionLogic: record.dataApplicability?.conditionLogic ?? 'AND',
      formulaExpression: record.dataApplicability?.formulaExpression ?? '',
      formulaTestResult: record.dataApplicability?.formulaTestResult ?? '',
      ruleOutputWhenMatched: record.dataApplicability?.ruleOutputWhenMatched ?? 'Approval Required',
      rulePriority: record.dataApplicability?.rulePriority ?? '',
      decisionTableReference: record.dataApplicability?.decisionTableReference ?? '',
      reevaluateOnEdit: record.dataApplicability?.reevaluateOnEdit ?? false,
      inputSetName: record.dataApplicability?.inputSetName ?? '',
      ruleInputs:
        record.dataApplicability?.ruleInputs?.map((row) => ({
          ...row,
          inputDisplayName: row.inputDisplayName ?? '',
          constantValue: row.constantValue ?? '',
          mandatoryForEvaluation: row.mandatoryForEvaluation ?? true,
        })) ?? [],
      derivationRules:
        record.dataApplicability?.derivationRules?.map((row) => ({
          ...row,
          derivationEvaluationOrder: row.derivationEvaluationOrder ?? '',
        })) ?? [],
      decisionTableName: record.dataApplicability?.decisionTableName ?? '',
      decisionTableHitPolicy: record.dataApplicability?.decisionTableHitPolicy ?? '',
      decisionTableVersion: record.dataApplicability?.decisionTableVersion ?? 1,
      decisionTableStatus: record.dataApplicability?.decisionTableStatus ?? 'Draft',
      decisionInputColumns: record.dataApplicability?.decisionInputColumns ?? [],
      decisionOutputColumns: record.dataApplicability?.decisionOutputColumns ?? [],
      decisionRows:
        record.dataApplicability?.decisionRows?.map((row) => ({
          ...row,
          rowEffectiveFrom: row.rowEffectiveFrom ?? '',
          rowEffectiveTo: row.rowEffectiveTo ?? '',
        })) ?? [],
      matrixEnabled: record.dataApplicability?.matrixEnabled ?? false,
      noMatchHandling: record.dataApplicability?.noMatchHandling ?? 'Approval Not Required',
      overlapDetectionPass: record.dataApplicability?.overlapDetectionPass ?? true,
      gapDetectionStatus: record.dataApplicability?.gapDetectionStatus ?? 'Pass',
      sampleDataInput: record.dataApplicability?.sampleDataInput ?? '',
      ruleResultPreview: record.dataApplicability?.ruleResultPreview ?? '',
      decisionTracePreview: record.dataApplicability?.decisionTracePreview ?? '',
      activationValidationChecks: record.dataApplicability?.activationValidationChecks ?? [],
    },
    approvalSection: normalizedApprovalSection,
    actions: normalizedActions,
  };
}

function writeToStorage(records: ApprovalWorkflowRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APPROVAL_STUDIO_STORAGE_KEY, JSON.stringify(records));
}

export async function fetchApprovalWorkflows(options?: { fail?: boolean }): Promise<ApprovalWorkflowRecord[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 420));

  if (options?.fail) {
    throw new Error('Failed to load approval components.');
  }

  return readFromStorage().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getApprovalWorkflowById(workflowId: string | null | undefined): ApprovalWorkflowRecord | undefined {
  if (!workflowId) {
    return undefined;
  }

  return readFromStorage().find((record) => record.id === workflowId);
}

export function listApprovalWorkflows(): ApprovalWorkflowRecord[] {
  return readFromStorage();
}

function mapDraftToRecord(
  draft: ApprovalWorkflowDraft,
  status: ApprovalWorkflowStatus,
  existing?: ApprovalWorkflowRecord
): ApprovalWorkflowRecord {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? createId('apv'),
    status,
    owner: existing?.owner ?? DEFAULT_OWNER,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    name: draft.name.trim(),
    policyCode: draft.policyCode.trim(),
    description: draft.description.trim(),
    setupMode: draft.setupMode,
    category: draft.businessDomain || draft.category.trim(),
    businessDomain: draft.businessDomain,
    entity: draft.entity.trim(),
    documentType: draft.documentType.trim(),
    approvalGranularity: draft.approvalGranularity,
    scopeLevel: draft.scopeLevel,
    scopeValues: draft.scopeValues.trim(),
    policyPriority: draft.policyPriority.trim(),
    ownerTeam: draft.ownerTeam.trim(),
    policyOwner: draft.policyOwner.trim(),
    tags: draft.tags,
    priority: draft.priority,
    type: draft.type as ApprovalWorkflowType,
    dataApplicability: draft.dataApplicability,
    approvalSection: draft.approvalSection,
    approvers: draft.approvers,
    rules: draft.rules,
    actions: draft.actions,
    permissions: draft.permissions,
  };
}

export function saveApprovalWorkflowDraft(
  draft: ApprovalWorkflowDraft,
  existingId?: string | null
): ApprovalWorkflowRecord {
  const records = readFromStorage();
  const existing = existingId ? records.find((record) => record.id === existingId) : undefined;
  const nextRecord = mapDraftToRecord(draft, 'Draft', existing);
  const nextRecords = existing
    ? records.map((record) => (record.id === existing.id ? nextRecord : record))
    : [nextRecord, ...records];

  writeToStorage(nextRecords);
  return nextRecord;
}

export function publishApprovalWorkflow(
  draft: ApprovalWorkflowDraft,
  existingId?: string | null
): ApprovalWorkflowRecord {
  const records = readFromStorage();
  const existing = existingId ? records.find((record) => record.id === existingId) : undefined;
  const nextRecord = mapDraftToRecord(draft, 'Active', existing);
  const nextRecords = existing
    ? records.map((record) => (record.id === existing.id ? nextRecord : record))
    : [nextRecord, ...records];

  writeToStorage(nextRecords);
  return nextRecord;
}

export function duplicateApprovalWorkflow(workflowId: string): ApprovalWorkflowRecord | null {
  const records = readFromStorage();
  const sourceRecord = records.find((record) => record.id === workflowId);

  if (!sourceRecord) {
    return null;
  }

  const now = new Date().toISOString();
  const duplicatedRecord: ApprovalWorkflowRecord = {
    ...sourceRecord,
    id: createId('apv'),
    name: `${sourceRecord.name} (Copy)`,
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
  };

  writeToStorage([duplicatedRecord, ...records]);
  return duplicatedRecord;
}

export function archiveApprovalWorkflow(workflowId: string): ApprovalWorkflowRecord | null {
  const records = readFromStorage();
  const sourceRecord = records.find((record) => record.id === workflowId);

  if (!sourceRecord) {
    return null;
  }

  const archivedRecord: ApprovalWorkflowRecord = {
    ...sourceRecord,
    status: 'Archived',
    updatedAt: new Date().toISOString(),
  };

  writeToStorage(records.map((record) => (record.id === workflowId ? archivedRecord : record)));
  return archivedRecord;
}

export function deleteApprovalWorkflow(workflowId: string): boolean {
  const records = readFromStorage();
  const hasRecord = records.some((record) => record.id === workflowId);

  if (!hasRecord) {
    return false;
  }

  writeToStorage(records.filter((record) => record.id !== workflowId));
  return true;
}
