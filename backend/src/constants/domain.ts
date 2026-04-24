export const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const APPROVAL_STATUS_VALUES = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Cancelled'] as const;

export const REQUISITION_LINE_STATUS_VALUES = [
  'Open',
  'Partially Cancelled',
  'Partially Ordered',
  'Fully Ordered',
  'Cancelled',
] as const;

export const REQUISITION_LIFECYCLE_VALUES = [
  'Open',
  'Partially Ordered',
  'Ordered',
  'Partially Cancelled',
  'Cancelled',
  'Closed',
] as const;

export const ORDER_LINE_STATUS_VALUES = [
  'Open',
  'Partially Received',
  'Received',
  'Cancelled',
] as const;

export const ORDER_LIFECYCLE_VALUES = [
  'Open',
  'Partially Received',
  'Received',
  'Partially Invoiced',
  'Invoiced',
  'Cancelled',
  'Closed',
] as const;

export const RECEIPT_LINE_STATUS_VALUES = [
  'Open',
  'Short Received',
  'Excess Received',
  'Received',
  'Cancelled',
] as const;

export const RECEIPT_LIFECYCLE_VALUES = [
  'Open',
  'Partially Received',
  'Received',
  'Short Received',
  'Excess Received',
  'Cancelled',
  'Closed',
] as const;

export const PAYMENT_MODE_VALUES = ['Cash', 'Credit'] as const;
export const DOCUMENT_PREFIX = {
  requisition: 'PR',
  order: 'PO',
  receipt: 'PRC',
} as const;

export type Priority = (typeof PRIORITY_VALUES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];
export type RequisitionLineStatus = (typeof REQUISITION_LINE_STATUS_VALUES)[number];
export type RequisitionLifecycleStatus = (typeof REQUISITION_LIFECYCLE_VALUES)[number];
export type OrderLineStatus = (typeof ORDER_LINE_STATUS_VALUES)[number];
export type OrderLifecycleStatus = (typeof ORDER_LIFECYCLE_VALUES)[number];
export type ReceiptLineStatus = (typeof RECEIPT_LINE_STATUS_VALUES)[number];
export type ReceiptLifecycleStatus = (typeof RECEIPT_LIFECYCLE_VALUES)[number];
