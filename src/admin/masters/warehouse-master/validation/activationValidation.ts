// ─── Warehouse Master — Activation Validation ────────────────────────────────

import type { HierarchyTemplate, Warehouse, WarehouseLocation, ValidationIssue } from '../types/warehouse.types';

/**
 * Returns all issues that block a warehouse from being activated.
 * An empty result means the warehouse is ready for activation.
 */
export function validateWarehouseForActivation(
  warehouse: Warehouse,
  templates: HierarchyTemplate[],
  locations: WarehouseLocation[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // ── identity completeness ──────────────────────────────────────────────
  if (!warehouse.warehouseCode?.trim()) {
    issues.push({
      field: 'warehouseCode',
      section: 'identity',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Warehouse Code is required.',
    });
  }

  if (!warehouse.warehouseName?.trim()) {
    issues.push({
      field: 'warehouseName',
      section: 'identity',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Warehouse Name is required.',
    });
  }

  // ── classification completeness ────────────────────────────────────────
  if (!warehouse.warehouseType) {
    issues.push({
      field: 'warehouseType',
      section: 'classification',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Warehouse Type is required before activation.',
    });
  }

  if (!warehouse.inventoryControlMode) {
    issues.push({
      field: 'inventoryControlMode',
      section: 'classification',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Inventory Control Mode is required before activation.',
    });
  }

  // ── status must be Draft ──────────────────────────────────────────────
  if (warehouse.status !== 'Draft') {
    issues.push({
      field: 'status',
      section: 'identity',
      severity: 'error',
      category: 'LifecycleConstraint',
      message: `Cannot activate a warehouse in "${warehouse.status}" status. Only Draft warehouses can be activated.`,
    });
  }

  // ── BIN-Level specific requirements ───────────────────────────────────
  if (warehouse.inventoryControlMode === 'Location-BIN-Level') {
    // Must have an active hierarchy template
    const hasActiveTemplate = templates.some(
      (t) => t.warehouseId === warehouse.id && t.status === 'Active',
    );
    if (!hasActiveTemplate) {
      issues.push({
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'DependencyMissing',
        message: 'An Active hierarchy template is required before activating a Location/BIN-Level warehouse.',
      });
    }

    // Must have at least one active, inventory-allowed location
    const hasActiveInventoryLocation = locations.some(
      (l) =>
        l.warehouseId === warehouse.id &&
        l.status === 'Active' &&
        l.profile.inventoryAllowed,
    );
    if (!hasActiveInventoryLocation) {
      issues.push({
        section: 'locations',
        severity: 'error',
        category: 'DependencyMissing',
        message: 'At least one Active, inventory-allowed location is required before activating a Location/BIN-Level warehouse.',
      });
    }

    // Auto Putaway / Picking cannot be enabled without strategies
    if (warehouse.autoPutaway?.enabled && !warehouse.autoPutaway.strategy) {
      issues.push({
        field: 'autoPutaway.strategy',
        section: 'autoPutaway',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Auto Putaway Strategy is required when Auto Putaway is enabled.',
      });
    }

    if (warehouse.autoPicking?.enabled && !warehouse.autoPicking.strategy) {
      issues.push({
        field: 'autoPicking.strategy',
        section: 'autoPicking',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Auto Picking Strategy is required when Auto Picking is enabled.',
      });
    }
  }

  // ── Warehouse-Level: auto putaway/picking must not be enabled ─────────
  if (warehouse.inventoryControlMode === 'Warehouse-Level') {
    if (warehouse.autoPutaway?.enabled) {
      issues.push({
        field: 'autoPutaway.enabled',
        section: 'autoPutaway',
        severity: 'error',
        category: 'PolicyConflict',
        message: 'Auto Putaway must be disabled in Warehouse-Level mode.',
      });
    }
    if (warehouse.autoPicking?.enabled) {
      issues.push({
        field: 'autoPicking.enabled',
        section: 'autoPicking',
        severity: 'error',
        category: 'PolicyConflict',
        message: 'Auto Picking must be disabled in Warehouse-Level mode.',
      });
    }
  }

  return issues;
}

/**
 * Returns true when no blocking issues exist.
 */
export function canActivateWarehouse(
  warehouse: Warehouse,
  templates: HierarchyTemplate[],
  locations: WarehouseLocation[],
): boolean {
  return validateWarehouseForActivation(warehouse, templates, locations).length === 0;
}
