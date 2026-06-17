// ─── Warehouse Master — Activation Validation ────────────────────────────────

import type { HierarchyTemplate, Warehouse, WarehouseLocation, ValidationIssue } from '../types/warehouse.types';
import {
  deriveCapacityStatus,
  deriveEffectiveCapacityPolicy,
  deriveHierarchyCompletionModel,
} from '../utils/warehouseDerivations';

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
    const completion = deriveHierarchyCompletionModel(
      warehouse,
      locations.filter((location) => location.warehouseId === warehouse.id),
      templates.filter((template) => template.warehouseId === warehouse.id),
    );

    for (const blocker of completion.blockers) {
      issues.push({
        section: blocker.actionTarget === 'Template' ? 'hierarchyTemplate' : 'locations',
        severity: 'error',
        category: 'DependencyMissing',
        message: blocker.issueMessage,
        detail: blocker.recommendedAction,
      });
    }

    for (const warning of completion.warnings) {
      issues.push({
        section: warning.actionTarget === 'Template' ? 'hierarchyTemplate' : 'locations',
        severity: 'warning',
        category: 'PolicyConflict',
        message: warning.issueMessage,
        detail: warning.recommendedAction,
      });
    }

    const activeTemplate = templates.find((template) => template.warehouseId === warehouse.id && template.status === 'Active');
    const scopedLocations = locations.filter((location) => location.warehouseId === warehouse.id);
    for (const location of scopedLocations) {
      const capacityPolicy = deriveEffectiveCapacityPolicy(warehouse, location, activeTemplate);
      const capacityStatus = deriveCapacityStatus(location, scopedLocations, warehouse, activeTemplate);
      if (
        location.status === 'Active'
        && location.profile.inventoryAllowed
        && capacityStatus === 'Exceeded'
        && capacityPolicy.enforcementMode === 'HardBlock'
      ) {
        issues.push({
          field: 'capacity',
          section: 'capacityStorage',
          severity: 'error',
          category: 'CapacityExceeded',
          message: `Capacity exceeded for inventory endpoint ${location.locationCode} under hard-block enforcement.`,
          detail: 'Open Capacity View and resolve exceeded node capacity before activation.',
        });
      }

      if (capacityStatus === 'NotConfigured') {
        issues.push({
          field: 'capacity',
          section: 'capacityStorage',
          severity: warehouse.capacityPolicy?.requireCapacityOnApplicableLevels ? 'error' : 'warning',
          category: 'DependencyMissing',
          message: `Capacity is not configured for applicable node ${location.locationCode}.`,
          detail: 'Open Capacity View to configure max values and enforcement settings.',
        });
      }
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
