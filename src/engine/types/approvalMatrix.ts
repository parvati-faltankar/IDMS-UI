// Approval Matrix type contracts — derived from blueprint Section 9

export type ApprovalCategoryCode =
  | 'DISCOUNT_EXCEPTION'
  | 'PRICE_EXCEPTION'
  | 'CREDIT_EXCEPTION'
  | 'TAX_EXCEPTION'
  | 'EXPIRED_ORDER_EXCEPTION'
  | 'PROCESSED_SCOPE_EXCEPTION'
  | 'CANCELLATION_EXCEPTION';

export type ApprovalRole =
  | 'ASM'
  | 'HQ_MANAGER'
  | 'BRANCH_MANAGER'
  | 'SALES_MANAGER'
  | 'REGIONAL_MANAGER'
  | 'FINANCE_MANAGER'
  | 'SERVICE_MANAGER'
  | string;

export type ApprovalLevel = {
  level: number;
  role: ApprovalRole;
  escalationHours: number;
  escalationRole?: ApprovalRole;
  autoActionOnTimeout?: 'Approve' | 'Reject' | 'Escalate';
};

export type ApprovalEscalation = {
  triggerAfterHours: number;
  escalateTo: ApprovalRole;
  notifyRoles: ApprovalRole[];
};

export type ApprovalMatrixEntry = {
  entryId: string;
  approvalCategory: ApprovalCategoryCode;
  /** Free-text condition expression, e.g. "discountPercent > 10 && discountPercent <= 15" */
  conditionExpression: string;
  conditionLabel: string;
  entityName: string;
  tenantId?: string;
  levels: ApprovalLevel[];
  isActive: boolean;
};

export type ApprovalDelegation = {
  delegationId: string;
  delegatedFrom: string;
  delegatedTo: string;
  validFrom: string;
  validTo: string;
  approvalCategories: ApprovalCategoryCode[];
};

export type ApprovalTaskStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Returned'
  | 'Escalated'
  | 'Delegated'
  | 'Waiting'
  | 'Expired';

export type ApprovalActionLog = {
  logId: string;
  approvalCaseId: string;
  taskId: string;
  action: 'Approve' | 'Reject' | 'Return' | 'Escalate' | 'Delegate';
  performedBy: string;
  performedAt: string;
  comment?: string;
  level: number;
};
