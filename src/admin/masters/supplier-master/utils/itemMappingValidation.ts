// ─── Supplier Master — Item Mapping Validation ───────────────────────────────

import type { BPItemMapping } from '../types/supplierMaster.types';

export interface ItemMappingFieldErrors {
  itemCode?: string;
  itemName?: string;
  orderUom?: string;
  minOrderQty?: string;
  maxOrderQty?: string;
  stdLeadTimeDays?: string;
  minLeadTimeDays?: string;
  maxLeadTimeDays?: string;
  returnPeriodDays?: string;
  effectiveToDate?: string;
}

export function validateItemMapping(
  item: Partial<BPItemMapping>,
  existingMappings: BPItemMapping[],
  editingId?: string,
): ItemMappingFieldErrors {
  const errors: ItemMappingFieldErrors = {};

  if (!item.itemCode?.trim()) errors.itemCode = 'Item code is required.';
  if (!item.itemName?.trim()) errors.itemName = 'Item name is required.';
  if (!item.orderUom) errors.orderUom = 'Order UOM is required.';

  if (item.minOrderQty !== undefined && item.minOrderQty < 0) {
    errors.minOrderQty = 'Minimum order quantity cannot be negative.';
  }

  if (item.maxOrderQty !== undefined && item.minOrderQty !== undefined) {
    if (item.maxOrderQty < item.minOrderQty) {
      errors.maxOrderQty = 'Maximum order quantity must be ≥ minimum order quantity.';
    }
  }

  if (item.minLeadTimeDays !== undefined && item.maxLeadTimeDays !== undefined) {
    if (item.maxLeadTimeDays < item.minLeadTimeDays) {
      errors.maxLeadTimeDays = 'Max lead time must be ≥ min lead time.';
    }
  }

  if (item.stdLeadTimeDays !== undefined && item.minLeadTimeDays !== undefined) {
    if (item.stdLeadTimeDays < item.minLeadTimeDays) {
      errors.stdLeadTimeDays = 'Standard lead time must be ≥ min lead time.';
    }
  }

  if (item.isReturnable && item.returnPeriodDays !== undefined && item.returnPeriodDays <= 0) {
    errors.returnPeriodDays = 'Return period must be greater than 0 days when returnable.';
  }

  if (item.effectiveFromDate && item.effectiveToDate) {
    if (item.effectiveToDate < item.effectiveFromDate) {
      errors.effectiveToDate = 'Effective To date must be on or after Effective From date.';
    }
  }

  // Duplicate item code check
  if (item.itemCode) {
    const dup = existingMappings.find(
      (m) => m.itemCode === item.itemCode && m.id !== editingId,
    );
    if (dup) errors.itemCode = 'This item is already mapped.';
  }

  return errors;
}
