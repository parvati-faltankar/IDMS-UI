// Approval matrix sample data — derived from blueprint Section 9.2.
// Backend seeding reference only.

import type { ApprovalMatrixEntry } from '../types/approvalMatrix';

export const SALE_ORDER_APPROVAL_MATRIX_SEED: ApprovalMatrixEntry[] = [
  {
    entryId: 'APM-001',
    approvalCategory: 'DISCOUNT_EXCEPTION',
    conditionExpression: 'discountPercent > 10 && discountPercent <= 15',
    conditionLabel: 'Discount between 10% and 15%',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'ASM', escalationHours: 24, escalationRole: 'HQ_MANAGER' },
    ],
  },
  {
    entryId: 'APM-002',
    approvalCategory: 'DISCOUNT_EXCEPTION',
    conditionExpression: 'discountPercent > 15',
    conditionLabel: 'Discount above 15%',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'ASM', escalationHours: 12, escalationRole: 'HQ_MANAGER' },
      { level: 2, role: 'HQ_MANAGER', escalationHours: 24 },
    ],
  },
  {
    entryId: 'APM-003',
    approvalCategory: 'PRICE_EXCEPTION',
    conditionExpression: 'priceOverridePercent > tolerance',
    conditionLabel: 'Price override beyond tolerance',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'BRANCH_MANAGER', escalationHours: 24, escalationRole: 'REGIONAL_MANAGER' },
    ],
  },
  {
    entryId: 'APM-004',
    approvalCategory: 'CREDIT_EXCEPTION',
    conditionExpression: 'creditLimitExceeded === true',
    conditionLabel: 'Customer credit limit exceeded',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'FINANCE_MANAGER', escalationHours: 24, escalationRole: 'HQ_MANAGER' },
    ],
  },
  {
    entryId: 'APM-005',
    approvalCategory: 'CANCELLATION_EXCEPTION',
    conditionExpression: 'consumedQuantity > 0',
    conditionLabel: 'Cancellation after partial processing',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'SALES_MANAGER', escalationHours: 12, escalationRole: 'REGIONAL_MANAGER' },
    ],
  },
  {
    entryId: 'APM-006',
    approvalCategory: 'PROCESSED_SCOPE_EXCEPTION',
    conditionExpression: 'amendmentAfterProcessing === true',
    conditionLabel: 'Amendment after downstream processing',
    entityName: 'SaleOrder',
    isActive: true,
    levels: [
      { level: 1, role: 'REGIONAL_MANAGER', escalationHours: 24 },
    ],
  },
];
