// Sale Order entity configuration
// Maps rule set codes, workflow codes, service action codes, and extension flags for SaleOrder.
// Template pattern: copy this file to create purchaseOrder.config.ts, purchaseRequisition.config.ts, etc.

export const SALE_ORDER_ENTITY = 'SaleOrder' as const;

// ─── Rule Set Codes ───────────────────────────────────────────────────────────

export const SALE_ORDER_RULE_SETS = {
  PRE_VALIDATION: 'SO_PRE_VALIDATION_RULES',
  HEADER_VALIDATION: 'SO_HEADER_VALIDATION_RULES',
  PARTY: 'SO_PARTY_RULES',
  FULFILLMENT: 'SO_FULFILLMENT_RULES',
  PAYMENT: 'SO_PAYMENT_RULES',
  FINANCE_EXTENSION: 'SO_FINANCE_EXTENSION_RULES',
  INSURANCE_EXTENSION: 'SO_INSURANCE_EXTENSION_RULES',
  LINE_VALIDATION: 'SO_LINE_VALIDATION_RULES',
  PRICING: 'SO_PRICING_RULES',
  DISCOUNT: 'SO_DISCOUNT_RULES',
  TAX: 'SO_TAX_RULES',
  CHARGE: 'SO_CHARGE_RULES',
  TOTAL_CALCULATION: 'SO_TOTAL_CALCULATION_RULES',
  APPROVAL_TRIGGER: 'SO_APPROVAL_TRIGGER_RULES',
  LIFECYCLE: 'SO_LIFECYCLE_RULES',
  HOLD_RELEASE: 'SO_HOLD_RELEASE_RULES',
  CANCELLATION: 'SO_CANCELLATION_RULES',
  AMENDMENT: 'SO_AMENDMENT_RULES',
  DOWNSTREAM_PROTECTION: 'SO_DOWNSTREAM_PROTECTION_RULES',
  SHORTCUT_ELIGIBILITY: 'SO_SHORTCUT_ELIGIBILITY_RULES',
  SECURITY_FIELD_BEHAVIOR: 'SO_SECURITY_FIELD_BEHAVIOR_RULES',
} as const;

export type SaleOrderRuleSetCode = (typeof SALE_ORDER_RULE_SETS)[keyof typeof SALE_ORDER_RULE_SETS];

// ─── Workflow Codes ───────────────────────────────────────────────────────────

export const SALE_ORDER_WORKFLOWS = {
  DRAFT_SAVE: 'WF_SO_DRAFT_SAVE',
  SUBMIT: 'WF_SO_SUBMIT',
  APPROVAL: 'WF_SO_APPROVAL',
  HOLD: 'WF_SO_HOLD',
  RELEASE: 'WF_SO_RELEASE',
  CANCEL: 'WF_SO_CANCEL',
  AMEND: 'WF_SO_AMEND',
} as const;

export type SaleOrderWorkflowCode = (typeof SALE_ORDER_WORKFLOWS)[keyof typeof SALE_ORDER_WORKFLOWS];

// ─── Service Action Codes ─────────────────────────────────────────────────────

export const SALE_ORDER_SERVICE_ACTIONS = [
  'CREATE_DRAFT',
  'UPDATE_DRAFT',
  'GENERATE_DOCUMENT_NUMBER',
  'CALCULATE_PRICING',
  'VALIDATE_PRICE_OVERRIDE',
  'CALCULATE_DISCOUNT',
  'VALIDATE_DISCOUNT',
  'DERIVE_TAX_CONTEXT',
  'VALIDATE_TAX_CONTEXT',
  'CALCULATE_TAX',
  'CALCULATE_CHARGES',
  'APPLY_ROUNDING',
  'CREATE_APPROVAL_CASE',
  'WAIT_FOR_APPROVAL',
  'WRITE_AUDIT_EVENT',
  'PUBLISH_DRAFT_CREATED',
  'PUBLISH_SUBMITTED',
  'PUBLISH_APPROVED',
  'PUBLISH_CANCELLED',
  'NOTIFY_CREATION',
  'NOTIFY_APPROVAL_PENDING',
  'NOTIFY_APPROVAL_DECISION',
  'GENERATE_SOURCE_LINE_REFERENCE',
  'VALIDATE_PROCESSED_SCOPE',
] as const;

// ─── Extension Activation ─────────────────────────────────────────────────────

/** Default extension flags — these should ideally come from backend config */
export const SALE_ORDER_DEFAULT_EXTENSIONS = {
  FINANCE: false,
  INSURANCE: false,
  INDIA_GST: false,
  INVENTORY_TRACEABILITY: false,
} as const;

// ─── Section → Rule Set Mapping (drives section-blur validation in the form) ─

export type SaleOrderFormSection =
  | 'customer'
  | 'header'
  | 'payment'
  | 'finance'
  | 'insurance'
  | 'line'
  | 'delivery';

export const SALE_ORDER_SECTION_RULE_SETS: Record<SaleOrderFormSection, SaleOrderRuleSetCode[]> = {
  customer: [SALE_ORDER_RULE_SETS.PARTY],
  header: [SALE_ORDER_RULE_SETS.HEADER_VALIDATION, SALE_ORDER_RULE_SETS.PRE_VALIDATION],
  payment: [SALE_ORDER_RULE_SETS.PAYMENT],
  finance: [SALE_ORDER_RULE_SETS.FINANCE_EXTENSION],
  insurance: [SALE_ORDER_RULE_SETS.INSURANCE_EXTENSION],
  line: [SALE_ORDER_RULE_SETS.LINE_VALIDATION],
  delivery: [SALE_ORDER_RULE_SETS.FULFILLMENT],
};
