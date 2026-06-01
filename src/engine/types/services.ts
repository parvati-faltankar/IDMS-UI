// Business Service contract types — derived from blueprint Sections 5 & 11
// All 12 services follow the standard ServiceRequest / ServiceResponse shape

// ─── Standard Request / Response ────────────────────────────────────────────

export type ServiceRequest = {
  tenantId: string;
  entityName: string;
  entityId?: string;
  viewCode: string;
  workflowInstanceId: string;
  stepCode: string;
  action: string;
  header: Record<string, unknown>;
  lines: Record<string, unknown>[];
  context: Record<string, unknown>;
  derivedValues: Record<string, unknown>;
  ruleResults: Record<string, unknown>;
  correlationId: string;
  idempotencyKey: string;
};

export type ServiceError = {
  code: string;
  message: string;
  field?: string;
};

export type ServiceNextAction = 'Continue' | 'Stop' | 'Retry' | 'PauseForUser';

export type ServiceResponse<T = Record<string, unknown>> = {
  success: boolean;
  status: 'Completed' | 'Failed' | 'Pending';
  errors: ServiceError[];
  warnings: string[];
  data: T;
  serviceReference?: string;
  nextAction: ServiceNextAction;
  requiresUserIntervention: boolean;
  retryable: boolean;
};

// ─── NumberingService ────────────────────────────────────────────────────────

export type NumberingOutput = {
  documentNumber: string;
  documentTypeCode: string;
  documentSeries: string;
  documentNoInt: number;
};

// ─── PricingService ──────────────────────────────────────────────────────────

export type PricingLineOutput = {
  lineId: string;
  basePrice: number;
  rate: number;
  priceListCode: string;
};

export type PricingOutput = {
  pricingEngineReference: string;
  lines: PricingLineOutput[];
};

// ─── DiscountService ─────────────────────────────────────────────────────────

export type DiscountOutput = {
  discountPolicyReference: string;
  approvalSuggested: boolean;
  reason?: string;
  lines: {
    lineId: string;
    allowedDiscountPercent: number;
    discountAmount: number;
  }[];
};

// ─── TaxService ──────────────────────────────────────────────────────────────

export type TaxLineOutput = {
  lineId: string;
  taxableAmount: number;
  taxAmount: number;
  taxBreakdown: {
    taxCode: string;
    rate: number;
    amount: number;
  }[];
};

export type TaxOutput = {
  taxEngineReference: string;
  taxStructure: string;
  totalTaxAmount: number;
  lines: TaxLineOutput[];
};

// ─── ChargeService ───────────────────────────────────────────────────────────

export type ChargeOutput = {
  chargeEngineReference: string;
  charges: {
    chargeCode: string;
    chargeType: string;
    amount: number;
    applicableOn: string;
  }[];
  totalChargeAmount: number;
};

// ─── CurrencyService ─────────────────────────────────────────────────────────

export type CurrencyOutput = {
  currencyReference: string;
  transactionCurrency: string;
  baseCurrency: string;
  exchangeRate: number;
  exchangeRateDate: string;
  roundingPolicy: string;
};

// ─── SaleOrderService ────────────────────────────────────────────────────────

export type SaleOrderStatus =
  | 'Draft'
  | 'Open'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Hold'
  | 'Cancelled'
  | 'Closed'
  | 'ReturnedForCorrection'
  | 'Expired';

export type SaleOrderServiceOutput = {
  saleOrderId: string;
  documentNumber: string;
  status: SaleOrderStatus;
  rowVersion: number;
  downstreamReady: boolean;
  revisionNumber?: number;
};

// ─── ApprovalService ─────────────────────────────────────────────────────────

export type ApprovalTaskStatus = 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Escalated' | 'Delegated' | 'Waiting';

export type ApprovalTask = {
  taskId: string;
  level: number;
  role: string;
  assignedTo: string | null;
  status: ApprovalTaskStatus;
  slaHours?: number;
  escalationRole?: string;
};

export type ApprovalServiceOutput = {
  approvalCaseId: string;
  approvalTasks: ApprovalTask[];
  workflowAction: 'Pause' | 'Continue' | 'Reject';
};

// ─── AuditService ────────────────────────────────────────────────────────────

export type AuditEvent = {
  eventId: string;
  entityName: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  beforeValues?: Record<string, unknown>;
  afterValues?: Record<string, unknown>;
  stepCode?: string;
  workflowInstanceId?: string;
};

export type AuditOutput = {
  eventId: string;
  recorded: boolean;
};

// ─── IntegrationEventService ─────────────────────────────────────────────────

export type IntegrationEventOutput = {
  eventId: string;
  eventName: string;
  published: boolean;
  idempotencyKey: string;
  correlationId: string;
};

// ─── NotificationService ─────────────────────────────────────────────────────

export type NotificationOutput = {
  notificationId: string;
  sent: boolean;
  recipients: string[];
  channel: string;
};

// ─── SourceLineLedgerService ─────────────────────────────────────────────────

export type SourceLineLedgerEntry = {
  sourceLineRef: string;
  lineId: string;
  orderedQuantity: number;
  consumedQuantity: number;
  cancelledQuantity: number;
  pendingQuantity: number;
};

export type SourceLineLedgerOutput = {
  ledgerId: string;
  entityId: string;
  lines: SourceLineLedgerEntry[];
  downstreamReady: boolean;
};
