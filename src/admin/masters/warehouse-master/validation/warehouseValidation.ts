// ─── Warehouse Master — Core Warehouse Validation ────────────────────────────

import type { CreateWarehouseInput } from '../types/warehouse.dto';
import type { Warehouse } from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';

// ─── Field-level save validation ──────────────────────────────────────────────

export interface WarehouseFieldErrors {
  warehouseCode?: string;
  warehouseName?: string;
  ownershipScope?: string;
  owningOrgCode?: string;
  owningBranchCode?: string;
  owningBranchCodes?: string;
  branchOwnershipRows?: string;
  businessUnit?: string;
  legalEntityCode?: string;
  inventoryOwnerCode?: string;
  warehouseType?: string;
  inventoryControlMode?: string;
  autoPutaway?: string;
  autoPicking?: string;
  version?: string;
}

const WAREHOUSE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,19}$/;

export function validateWarehouseForSave(
  input: CreateWarehouseInput,
  existingWarehouses: Warehouse[],
  editingId?: string,
): WarehouseFieldErrors {
  const errors: WarehouseFieldErrors = {};

  // Code
  if (!input.warehouseCode?.trim()) {
    errors.warehouseCode = 'Warehouse Code is required.';
  } else if (!WAREHOUSE_CODE_PATTERN.test(input.warehouseCode.trim())) {
    errors.warehouseCode =
      'Warehouse Code must be 2–20 uppercase letters, digits, hyphens, or underscores, starting with a letter or digit.';
  } else {
    const duplicate = existingWarehouses.find(
      (w) =>
        w.warehouseCode.trim().toUpperCase() === input.warehouseCode.trim().toUpperCase() &&
        w.id !== editingId,
    );
    if (duplicate) {
      errors.warehouseCode = 'A warehouse with this code already exists.';
    }
  }

  // Name
  if (!input.warehouseName?.trim()) {
    errors.warehouseName = 'Warehouse Name is required.';
  } else if (input.warehouseName.trim().length > 120) {
    errors.warehouseName = 'Warehouse Name must be 120 characters or fewer.';
  }

  // Ownership scope
  if (!input.ownershipScope) {
    errors.ownershipScope = 'Ownership Scope is required.';
  } else if (input.ownershipScope === 'Organization' && !input.owningOrgCode?.trim()) {
    errors.owningOrgCode = 'Owning Organisation is required for Org-level warehouses.';
  } else if (input.ownershipScope === 'Organization' && !input.businessUnit?.trim()) {
    errors.businessUnit = 'Business Unit is required for Org-level warehouses.';
  } else if (input.ownershipScope === 'Organization' && !input.legalEntityCode?.trim()) {
    errors.legalEntityCode = 'Legal Entity is required for Org-level warehouses.';
  } else if (input.ownershipScope === 'Organization' && !input.inventoryOwnerCode?.trim()) {
    errors.inventoryOwnerCode = 'Inventory Owner is required for Org-level warehouses.';
  } else if (input.ownershipScope === 'Branch') {
    const normalizedOwningBranchCode = input.owningBranchCode?.trim();
    const normalizedOwningBranchCodes = (input.owningBranchCodes ?? [])
      .map((branchCode) => branchCode.trim())
      .filter(Boolean);
    const submittedBranchCodes = Array.from(
      new Set(
        [
          ...(normalizedOwningBranchCode ? [normalizedOwningBranchCode] : []),
          ...normalizedOwningBranchCodes,
        ].map((branchCode) => branchCode.toUpperCase()),
      ),
    );

    if (submittedBranchCodes.length === 0) {
      errors.owningBranchCode = 'Exactly one Owning Branch is required for Branch-level warehouses.';
    } else if (submittedBranchCodes.length > 1) {
      errors.owningBranchCodes = 'Branch-level warehouses can have only one owning branch.';
    }

    const branchRows = input.branchOwnershipRows ?? [];
    if (branchRows.length > 1) {
      errors.branchOwnershipRows = 'Branch-level warehouses support exactly one primary owning branch row.';
    } else if (branchRows.length === 1) {
      const branchRow = branchRows[0];
      if (
        !branchRow.businessUnit?.trim() ||
        !branchRow.legalEntityCode?.trim() ||
        !branchRow.inventoryOwnerCode?.trim()
      ) {
        errors.branchOwnershipRows = `Complete Business Unit, Legal Entity, and Inventory Owner for ${branchRow.branchCode}.`;
      } else if (
        submittedBranchCodes.length === 1 &&
        branchRow.branchCode.trim().toUpperCase() !== submittedBranchCodes[0]
      ) {
        errors.branchOwnershipRows = 'Owning Branch row must match the primary Owning Branch.';
      }
    }
  }

  // Type
  if (!input.warehouseType) {
    errors.warehouseType = 'Warehouse Type is required.';
  }

  // Inventory control mode
  if (!input.inventoryControlMode) {
    errors.inventoryControlMode = 'Inventory Control Mode is required.';
  }

  // Auto Putaway / Picking only valid in BIN-Level mode
  if (input.inventoryControlMode === 'Warehouse-Level') {
    if (input.autoPutaway?.enabled) {
      errors.autoPutaway =
        'Auto Putaway is not supported in Warehouse-Level mode. Disable it or switch to Location/BIN-Level mode.';
    }
    if (input.autoPicking?.enabled) {
      errors.autoPicking =
        'Auto Picking is not supported in Warehouse-Level mode. Disable it or switch to Location/BIN-Level mode.';
    }
  }

  return errors;
}

export function hasWarehouseFieldErrors(errors: WarehouseFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// ─── Full validation result (for ValidationResult type) ─────────────────────

export function validateWarehouseInput(
  input: CreateWarehouseInput,
  existingWarehouses: Warehouse[],
  editingId?: string,
): ValidationIssue[] {
  const fieldErrors = validateWarehouseForSave(input, existingWarehouses, editingId);
  const issues: ValidationIssue[] = [];

  for (const [field, message] of Object.entries(fieldErrors)) {
    if (message) {
      issues.push({
        field,
        section: fieldToSection(field),
        severity: 'error',
        category: message.includes('exists') ? 'DuplicateCode' : 'FieldRequired',
        message,
      });
    }
  }

  return issues;
}

function fieldToSection(field: string): import('../types/warehouse.enums').ConfigurationSectionKey {
  if (['warehouseCode', 'warehouseName', 'ownershipScope', 'owningOrgCode', 'owningBranchCode', 'owningBranchCodes', 'branchOwnershipRows', 'businessUnit', 'legalEntityCode', 'inventoryOwnerCode'].includes(field)) {
    return 'identity';
  }
  if (['warehouseType', 'inventoryControlMode', 'wmsEnabled'].includes(field)) {
    return 'classification';
  }
  if (field.startsWith('autoPutaway')) return 'autoPutaway';
  if (field.startsWith('autoPicking')) return 'autoPicking';
  return 'identity';
}
