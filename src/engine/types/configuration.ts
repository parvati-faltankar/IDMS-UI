// Configuration object models — derived from blueprint Section 14
// Used by Config Admin UI and backend seeding

// ─── Rule Configuration ──────────────────────────────────────────────────────

export type RuleType =
  | 'Validation'
  | 'ConditionalValidation'
  | 'Derivation'
  | 'ApprovalTrigger'
  | 'FieldBehavior'
  | 'Eligibility'
  | 'BoundaryRule'
  | 'StatusDerivation'
  | 'SystemInvariant';

export type RuleAction =
  | 'RaiseError'
  | 'RaiseWarning'
  | 'DeriveValue'
  | 'RequireApproval'
  | 'CallService'
  | 'RouteToExtension'
  | 'ApplyMaskingPolicy'
  | 'SetFieldBehavior';

export type RuleOwner =
  | 'RuleEngine'
  | 'PricingService'
  | 'DiscountService'
  | 'TaxService'
  | 'ChargeService'
  | 'ApprovalService'
  | 'NumberingService'
  | 'SaleOrderService'
  | 'SourceLineLedgerService'
  | 'CalculationService'
  | 'RevisionService'
  | 'IntegrationEventService'
  | 'LifecycleService'
  | 'RBACService'
  | 'PrivacyService'
  | 'Workflow'
  | string;

export type RuleDefinition = {
  ruleCode: string;
  field?: string;
  ruleType: RuleType;
  action: RuleAction;
  owner: RuleOwner;
  description?: string;
  conditionExpression?: string;
  executionCondition?: string;
  isActive: boolean;
  order: number;
};

export type RuleSetConfig = {
  ruleSetCode: string;
  ruleSetName: string;
  entityName: string;
  description: string;
  version: number;
  isActive: boolean;
  rules: RuleDefinition[];
};

// ─── Workflow Configuration ──────────────────────────────────────────────────

export type WorkflowStepConfigType =
  | 'RuleTask'
  | 'ServiceTask'
  | 'Decision'
  | 'UserTask'
  | 'NotificationTask'
  | 'IntegrationTask'
  | 'Start'
  | 'End';

export type WorkflowStepFailureMode =
  | 'Stop'
  | 'ValidationFailed'
  | 'PendingApproval'
  | 'Retry'
  | 'NonBlocking';

export type WorkflowStepConfig = {
  seq: number;
  stepCode: string;
  stepType: WorkflowStepConfigType;
  calls: string;
  failureBehavior: WorkflowStepFailureMode;
  description?: string;
  isActive: boolean;
};

export type WorkflowTransitionConfig = {
  fromStep: string;
  toStep: string;
  condition?: string;
  label?: string;
};

export type WorkflowConfig = {
  workflowCode: string;
  workflowName: string;
  entityName: string;
  version: number;
  description: string;
  isActive: boolean;
  steps: WorkflowStepConfig[];
  transitions: WorkflowTransitionConfig[];
};

// ─── Service Configuration ───────────────────────────────────────────────────

export type ServiceRetryPolicy = {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
};

export type ServiceFallbackPolicy = 'ReturnError' | 'SkipStep' | 'UseLastKnown';

export type ServiceConfig = {
  serviceCode: string;
  serviceName: string;
  endpointUrl: string;
  timeoutMs: number;
  retryPolicy: ServiceRetryPolicy;
  fallbackPolicy: ServiceFallbackPolicy;
  isActive: boolean;
  actionCodes: string[];
};

// ─── Approval Config (config-side types, complements approvalMatrix types) ──

export type ApprovalCategoryConfig = {
  categoryCode: string;
  categoryName: string;
  description: string;
  entityName: string;
  isActive: boolean;
};

// ─── Entity Configuration ────────────────────────────────────────────────────

export type FieldPolicy = {
  fieldCode: string;
  isReadonly: boolean;
  isHidden: boolean;
  isMandatory: boolean;
};

export type EntityExtensionActivation = {
  entityName: string;
  extensionCode: string;
  isActive: boolean;
  tenantId?: string;
};

export type SaleOrderFieldPolicy = {
  entityName: 'SaleOrder';
  policies: FieldPolicy[];
};

export type SaleOrderDocumentTypeConfig = {
  documentTypeCode: string;
  documentTypeName: string;
  defaultWorkflowCode: string;
  submitWorkflowCode: string;
  cancelWorkflowCode: string;
  holdWorkflowCode: string;
  releaseWorkflowCode: string;
  amendWorkflowCode: string;
  approvalWorkflowCode: string;
  extensions: EntityExtensionActivation[];
  fieldPolicies: FieldPolicy[];
};
