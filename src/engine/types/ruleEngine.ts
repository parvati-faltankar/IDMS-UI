// Rule Engine type contracts — derived from blueprint Section 12
// Entity-agnostic: works for SaleOrder, PurchaseOrder, etc.

export type RuleEngineContext = {
  tenantId: string;
  entityName: string;
  viewCode: string;
  action: string;
  workflowCode: string;
  workflowInstanceId: string;
};

export type RuleEngineFacts = {
  header: Record<string, unknown>;
  lines: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  downstream?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

export type RuleEngineRequest = {
  ruleSetCode: string;
  facts: RuleEngineFacts;
  context: RuleEngineContext;
};

export type RuleError = {
  code: string;
  message: string;
  field?: string;
  lineId?: string;
  severity: 'Error';
};

export type RuleWarning = {
  code: string;
  message: string;
  field?: string;
  lineId?: string;
  severity: 'Warning';
};

export type DerivedValue = {
  field: string;
  value: unknown;
  lineId?: string;
};

/** Drives field-level behaviour in the form based on rule engine output */
export type UIActionType = 'SetReadonly' | 'SetHidden' | 'SetMandatory' | 'SetOptional' | 'SetVisible' | 'SetEditable';

export type UIAction = {
  actionType: UIActionType;
  fieldCode: string;
  lineId?: string;
  reason?: string;
};

export type ApprovalRequest = {
  approvalCategory: string;
  approvalReason: string;
  triggerRule: string;
  amount?: number;
  discountPercent?: number;
  priceOverridePercent?: number;
};

export type DataSourceFilter = {
  fieldCode: string;
  filterExpression: string;
};

export type RuleEngineResponse = {
  isValid: boolean;
  hasErrors: boolean;
  errors: RuleError[];
  warnings: RuleWarning[];
  derivedValues: DerivedValue[];
  approvalRequired: boolean;
  approvalRequests: ApprovalRequest[];
  uiActions: UIAction[];
  dataSourceFilters: DataSourceFilter[];
};
