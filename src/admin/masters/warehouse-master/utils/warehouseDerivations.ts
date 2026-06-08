// ─── Warehouse Master — Pure Derivation Functions ────────────────────────────
//
// All functions are pure (no side-effects, no I/O). The UI must call these
// functions to compute derived fields; derived fields must never be stored as
// editable inputs in form state.

import type {
  ControlledAction,
  EffectiveResponsibility,
  EligibilityPolicy,
  HierarchyTemplate,
  InventoryControlRules,
  SectionHealth,
  SetupHealth,
  Warehouse,
  WarehouseLocation,
  ValidationIssue,
} from '../types/warehouse.types';
import type {
  ConfigurationSectionKey,
  InventoryControlMode,
  LocationStatus,
  ResponsibilityStatus,
  SetupHealthTone,
  WarehouseLifecycleAction,
  WarehouseOwnershipScope,
  WarehouseStatus,
} from '../types/warehouse.enums';
import type { WarehousePermissions } from '../types/warehouse.permissions';
import {
  deriveEffectiveNodeCapabilities,
  getTemplateLevelForLocation,
} from './hierarchyUtils';

// ─── deriveBinManaged ─────────────────────────────────────────────────────────

/**
 * BIN Managed is ALWAYS derived from InventoryControlMode.
 * It must never be set directly by user input.
 */
export function deriveBinManaged(mode: InventoryControlMode): boolean {
  return mode === 'Location-BIN-Level';
}

// ─── deriveInventoryControlRules ─────────────────────────────────────────────

export function deriveInventoryControlRules(mode: InventoryControlMode): InventoryControlRules {
  const binManaged = deriveBinManaged(mode);
  return {
    binManaged,
    allowWarehouseLevelPosting: !binManaged,
    requireLocationForGRN: binManaged,
    requireLocationForIssue: binManaged,
    allowBinToBinTransfer: binManaged,
  };
}

// ─── deriveIsLeafEndpoint ─────────────────────────────────────────────────────

export function deriveIsLeafEndpoint(
  locationId: string,
  allLocations: WarehouseLocation[],
  hierarchyTemplate?: HierarchyTemplate,
): boolean {
  const location = allLocations.find((item) => item.id === locationId);
  if (!location) return false;

  const hasChildren = allLocations.some((item) => item.parentLocationId === locationId);
  if (hasChildren) return false;

  const level = getTemplateLevelForLocation(location, hierarchyTemplate);
  return level ? level.leafEligible : true;
}

export function deriveInventoryEndpointEligible(
  location: WarehouseLocation,
  hierarchyTemplate?: HierarchyTemplate,
): boolean {
  const level = getTemplateLevelForLocation(location, hierarchyTemplate);
  if (!level) {
    return location.profile.isLeafEndpoint;
  }

  const capabilities = deriveEffectiveNodeCapabilities(hierarchyTemplate, level);
  return capabilities.inventoryEndpointEligible && level.leafEligible;
}

// ─── deriveInventoryAllowed ───────────────────────────────────────────────────

export function deriveInventoryAllowed(
  location: Pick<WarehouseLocation, 'id' | 'parentLocationId' | 'status' | 'putawayBlocked'>,
  allLocations: WarehouseLocation[],
  hierarchyTemplate?: HierarchyTemplate,
): boolean {
  if (location.status !== 'Active') return false;
  if (location.putawayBlocked) return false;

  const warehouseLocation = allLocations.find((item) => item.id === location.id);
  if (!warehouseLocation) return false;

  if (!deriveIsLeafEndpoint(location.id, allLocations, hierarchyTemplate)) return false;
  if (!deriveInventoryEndpointEligible(warehouseLocation, hierarchyTemplate)) return false;

  if (location.parentLocationId) {
    const parent = allLocations.find((l) => l.id === location.parentLocationId);
    if (parent) {
      if (parent.status !== 'Active') return false;
    }
  }

  return true;
}

export function deriveResponsibilitySource(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
): EffectiveResponsibility['source'] {
  const assignment = location.responsibilityAssignment;
  if (!assignment || assignment.mode === 'NotApplicable') return 'NotApplicable';
  if (assignment.mode === 'AssignDirectly' && assignment.employee) return 'Direct';
  return findNearestResponsibleAncestor(location.parentLocationId, allLocations)
    ? 'Inherited'
    : 'Unassigned';
}

export function deriveEffectiveResponsibleEmployee(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
): EffectiveResponsibility['employee'] {
  const assignment = location.responsibilityAssignment;
  if (!assignment || assignment.mode === 'NotApplicable') return undefined;
  if (assignment.mode === 'AssignDirectly') return assignment.employee;
  return findNearestResponsibleAncestor(location.parentLocationId, allLocations)?.responsibilityAssignment?.employee;
}

export function deriveResponsibilityStatus(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  today: string = new Date().toISOString().slice(0, 10),
): ResponsibilityStatus {
  const assignment = location.responsibilityAssignment;
  if (!assignment || assignment.mode === 'NotApplicable') return 'NotApplicable';
  if (assignment.effectiveTo && assignment.effectiveTo < today) return 'Expired';
  if (assignment.mode === 'AssignDirectly' && assignment.employee) return 'Assigned';
  return findNearestResponsibleAncestor(location.parentLocationId, allLocations)
    ? 'Inherited'
    : 'Unassigned';
}

export function deriveEffectiveResponsibility(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
): EffectiveResponsibility {
  const assignment = location.responsibilityAssignment;
  if (!assignment || assignment.mode === 'NotApplicable') {
    return {
      mode: 'NotApplicable',
      source: 'NotApplicable',
      status: 'NotApplicable',
    };
  }

  return {
    mode: assignment.mode,
    role: assignment.role,
    employee: deriveEffectiveResponsibleEmployee(location, allLocations),
    source: deriveResponsibilitySource(location, allLocations),
    sourceLocationId:
      assignment.mode === 'InheritFromParent'
        ? findNearestResponsibleAncestor(location.parentLocationId, allLocations)?.id
        : undefined,
    status: deriveResponsibilityStatus(location, allLocations),
  };
}

// ─── deriveEffectiveLocationStatus ───────────────────────────────────────────

/**
 * The effective status of a location considers its own status and the
 * status of its warehouse. A location cannot be Active if the warehouse is
 * Blocked or Inactive.
 */
export function deriveEffectiveLocationStatus(
  locationStatus: LocationStatus,
  warehouseStatus: WarehouseStatus,
): LocationStatus {
  if (warehouseStatus === 'Inactive') return 'Inactive';
  if (warehouseStatus === 'Blocked' && locationStatus === 'Active') return 'Blocked';
  return locationStatus;
}

// ─── deriveSetupHealth ────────────────────────────────────────────────────────

export function deriveSetupHealth(
  warehouse: Partial<Warehouse>,
  locations: WarehouseLocation[],
  templates: HierarchyTemplate[],
): SetupHealth {
  const issues: ValidationIssue[] = [];
  const sections: SectionHealth[] = [];

  // ── identity section ──────────────────────────────────────────────────────
  const identityIssues: ValidationIssue[] = [];
  let identityComplete = 0;
  const identityTotal = 3;

  if (warehouse.warehouseCode?.trim()) identityComplete++;
  else identityIssues.push({ field: 'warehouseCode', section: 'identity', severity: 'error', category: 'FieldRequired', message: 'Warehouse Code is required.' });

  if (warehouse.warehouseName?.trim()) identityComplete++;
  else identityIssues.push({ field: 'warehouseName', section: 'identity', severity: 'error', category: 'FieldRequired', message: 'Warehouse Name is required.' });

  if (warehouse.ownershipScope) identityComplete++;
  else identityIssues.push({ field: 'ownershipScope', section: 'identity', severity: 'error', category: 'FieldRequired', message: 'Ownership Scope is required.' });

  sections.push({
    section: 'identity',
    tone: identityComplete === identityTotal ? 'complete' : identityComplete > 0 ? 'partial' : 'empty',
    completedFields: identityComplete,
    totalFields: identityTotal,
    issues: identityIssues,
  });

  // ── classification section ────────────────────────────────────────────────
  const classIssues: ValidationIssue[] = [];
  let classComplete = 0;
  const classTotal = 3;

  if (warehouse.warehouseType) classComplete++;
  else classIssues.push({ field: 'warehouseType', section: 'classification', severity: 'error', category: 'FieldRequired', message: 'Warehouse Type is required.' });

  if (warehouse.inventoryControlMode) classComplete++;
  else classIssues.push({ field: 'inventoryControlMode', section: 'classification', severity: 'error', category: 'FieldRequired', message: 'Inventory Control Mode is required.' });

  // wmsEnabled is a boolean — presence is enough
  if (warehouse.wmsEnabled !== undefined) classComplete++;

  sections.push({
    section: 'classification',
    tone: classComplete === classTotal ? 'complete' : classComplete > 0 ? 'partial' : 'empty',
    completedFields: classComplete,
    totalFields: classTotal,
    issues: classIssues,
  });

  // ── hierarchy (BIN-level only) ────────────────────────────────────────────
  if (warehouse.inventoryControlMode === 'Location-BIN-Level') {
    const hierarchyIssues: ValidationIssue[] = [];
    const hasActiveTemplate = templates.some((t) => t.status === 'Active');

    if (!hasActiveTemplate) {
      hierarchyIssues.push({
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'DependencyMissing',
        message: 'An active hierarchy template is required before activation in BIN-Level mode.',
      });
    }

    sections.push({
      section: 'hierarchyTemplate',
      tone: hasActiveTemplate ? 'complete' : 'empty',
      completedFields: hasActiveTemplate ? 1 : 0,
      totalFields: 1,
      issues: hierarchyIssues,
    });

    // ── locations ─────────────────────────────────────────────────────────
    const activeInventoryLocations = locations.filter(
      (l) => l.status === 'Active' && l.profile.inventoryAllowed,
    );
    const locationIssues: ValidationIssue[] = [];

    if (activeInventoryLocations.length === 0) {
      locationIssues.push({
        section: 'locations',
        severity: 'error',
        category: 'DependencyMissing',
        message: 'At least one Active, inventory-allowed location is required before activation.',
      });
    }

    sections.push({
      section: 'locations',
      tone: activeInventoryLocations.length > 0 ? 'complete' : 'empty',
      completedFields: Math.min(activeInventoryLocations.length, 1),
      totalFields: 1,
      issues: locationIssues,
    });

    issues.push(...hierarchyIssues, ...locationIssues);
  }

  issues.push(...identityIssues, ...classIssues);

  const blockingIssues = issues.filter((i) => i.severity === 'error');
  const overallTone = computeOverallTone(sections);

  return {
    overallTone,
    readyForActivation: blockingIssues.length === 0,
    sections,
    blockingIssues,
  };
}

function computeOverallTone(sections: SectionHealth[]): SetupHealthTone {
  // 'error' tone only when a section is explicitly in an error/conflict state —
  // not when it is simply empty (required fields not yet filled in an unfilled form).
  if (sections.some((s) => s.tone === 'error')) return 'error';
  if (sections.every((s) => s.tone === 'complete')) return 'complete';
  if (sections.some((s) => s.tone !== 'empty')) return 'partial';
  return 'empty';
}

// ─── deriveAvailableActions ───────────────────────────────────────────────────

/**
 * Returns the set of lifecycle actions available for a warehouse given its
 * current status, setup health, and caller permissions.
 */
export function deriveAvailableActions(
  warehouse: Pick<Warehouse, 'status' | 'inventoryControlMode'>,
  setupHealth: SetupHealth,
  permissions: WarehousePermissions,
  hasOpenStock: boolean,
  _hasActiveLocations: boolean,
): ControlledAction[] {
  const actions: ControlledAction[] = [];

  const { status } = warehouse;

  const addAction = (
    action: WarehouseLifecycleAction,
    available: boolean,
    requiresReason: boolean,
    requiresApproval: boolean,
    blockedBy?: string[],
  ) => {
    actions.push({ action, available, requiresReason, requiresApproval, blockedBy });
  };

  // Activate
  if (status === 'Draft') {
    const canActivate = permissions['warehouse.activate'];
    const activationBlockers: string[] = [];
    if (!setupHealth.readyForActivation) {
      activationBlockers.push(...setupHealth.blockingIssues.map((i) => i.message));
    }
    addAction('Activate', canActivate && activationBlockers.length === 0, false, false, activationBlockers);
  }

  // Block
  if (status === 'Active') {
    addAction('Block', permissions['warehouse.block'], true, false);
  }

  // Unblock
  if (status === 'Blocked') {
    addAction('Unblock', permissions['warehouse.unblock'], true, false);
  }

  // Inactivate
  if (status === 'Active' || status === 'Blocked') {
    const inactivateBlockers: string[] = [];
    if (hasOpenStock) inactivateBlockers.push('Warehouse has open stock. Transfer stock before inactivating.');
    addAction('Inactivate', permissions['warehouse.inactivate'] && inactivateBlockers.length === 0, true, true, inactivateBlockers);
  }

  // Delete
  if (status === 'Draft') {
    addAction('Delete', permissions['warehouse.delete'], false, false);
  }

  // ChangeMode
  if (status === 'Draft') {
    addAction('ChangeMode', permissions['warehouse.changeInventoryMode'], false, false);
  }

  // AssignBranch (org-level only)
  if (warehouse.inventoryControlMode !== undefined) {
    addAction('AssignBranch', permissions['warehouse.assignBranch'], false, false);
    addAction('RevokeBranch', permissions['warehouse.revokeBranch'], true, false);
  }

  return actions;
}

// ─── deriveRequiredConfigurationSections ─────────────────────────────────────

/**
 * Returns the list of sections that should be shown in AdminConfigShell
 * based on warehouse classification. BIN-level shows hierarchy + locations;
 * Warehouse-level does not.
 */
export function deriveRequiredConfigurationSections(
  mode: InventoryControlMode,
  _ownershipScope: WarehouseOwnershipScope,
): ConfigurationSectionKey[] {
  const base: ConfigurationSectionKey[] = [
    'identity',
    'classification',
    'branchAssignment',
    'inventoryControl',
    'defaultLocations',
    'capacityStorage',
    'timingCalendar',
    'contactsAddresses',
    'itemEligibility',
    'stockStatusGovernance',
    'reservationAllocation',
    'cycleCount',
  ];

  if (mode === 'Location-BIN-Level') {
    // Insert hierarchy template and locations after inventoryControl
    const insertAfter = base.indexOf('inventoryControl');
    base.splice(insertAfter + 1, 0, 'hierarchyTemplate', 'locations');
    // Insert autoPutaway/autoPicking after inventoryControl
    base.splice(insertAfter + 1, 0, 'autoPutaway', 'autoPicking');
  }

  return base;
}


// ─── determineApprovalRequirement ────────────────────────────────────────────

/**
 * Certain actions require approval (e.g. inactivation).
 * Returns true when the action on a warehouse with the given status needs
 * approval workflow to be triggered.
 */
export function determineApprovalRequirement(
  action: WarehouseLifecycleAction,
  warehouseStatus: WarehouseStatus,
  _hasOpenStock: boolean,
): boolean {
  if (action === 'Inactivate') return true;
  if (action === 'ChangeMode' && warehouseStatus === 'Active') return true;
  return false;
}

// ─── evaluateAssignmentAccess ─────────────────────────────────────────────────

/**
 * Returns whether a given branch can access a warehouse.
 * Considers: assignment status, assignment effective dates, isDefaultForBranch.
 */
export function evaluateAssignmentAccess(
  branchCode: string,
  warehouse: Warehouse,
  today: string = new Date().toISOString().slice(0, 10),
): { canAccess: boolean; isDefault: boolean; reason?: string } {
  if (warehouse.ownershipScope === 'Organization') {
    // Org-level warehouses: check explicit assignments
    const assignment = warehouse.assignmentProfile.assignments.find(
      (a) => a.branchCode === branchCode,
    );

    if (!assignment) {
      if (warehouse.assignmentProfile.sharedWithAllBranches) {
        return { canAccess: true, isDefault: false };
      }
      return { canAccess: false, isDefault: false, reason: 'No active assignment for this branch.' };
    }

    if (assignment.assignmentStatus !== 'Active') {
      return { canAccess: false, isDefault: false, reason: `Assignment is ${assignment.assignmentStatus}.` };
    }

    if (assignment.effectiveTo && assignment.effectiveTo < today) {
      return { canAccess: false, isDefault: false, reason: 'Assignment has expired.' };
    }

    return { canAccess: true, isDefault: assignment.isDefaultForBranch };
  }

  // Branch-level: only the owning branch can access
  if (warehouse.ownershipScope === 'Branch') {
    const canAccess = warehouse.owningBranchCode === branchCode;
    return {
      canAccess,
      isDefault: canAccess,
      reason: canAccess ? undefined : 'This is a branch-level warehouse belonging to a different branch.',
    };
  }

  return { canAccess: false, isDefault: false, reason: 'Unknown ownership scope.' };
}

// ─── evaluateLocationEligibility ─────────────────────────────────────────────

/**
 * Determines whether an item is eligible to be stored at a location.
 * Applies the most-restrictive-wins rule across warehouse and location policies.
 */
export function evaluateLocationEligibility(
  itemCode: string,
  categoryCode: string,
  warehousePolicy: EligibilityPolicy | undefined,
  locationPolicy: EligibilityPolicy | undefined,
): { eligible: boolean; reason?: string } {
  const checkPolicy = (
    policy: EligibilityPolicy | undefined,
    context: 'warehouse' | 'location',
  ): { eligible: boolean; reason?: string } | null => {
    if (!policy) return null;
    if (policy.mode === 'Open') return { eligible: true };
    if (policy.mode === 'Restricted') {
      const allowed = policy.rules.some(
        (r) =>
          r.allowedOrBlocked === 'Allowed' &&
          ((r.ruleType === 'ItemCode' && r.ruleValue === itemCode) ||
            (r.ruleType === 'Category' && r.ruleValue === categoryCode)),
      );
      if (!allowed) {
        return { eligible: false, reason: `Item not in ${context} allowed list (Restricted mode).` };
      }
      return { eligible: true };
    }
    // For Hybrid / Category modes: check blocked rules first
    const blocked = policy.rules.find(
      (r) =>
        r.allowedOrBlocked === 'Blocked' &&
        ((r.ruleType === 'ItemCode' && r.ruleValue === itemCode) ||
          (r.ruleType === 'Category' && r.ruleValue === categoryCode)),
    );
    if (blocked) {
      return { eligible: false, reason: `Item explicitly blocked at ${context} level.` };
    }
    return { eligible: true };
  };

  const warehouseResult = checkPolicy(warehousePolicy, 'warehouse');
  const locationResult = checkPolicy(locationPolicy, 'location');

  // Most restrictive wins
  if (warehouseResult?.eligible === false) return warehouseResult;
  if (locationResult?.eligible === false) return locationResult;
  return { eligible: true };
}

function findNearestResponsibleAncestor(
  parentLocationId: string | undefined,
  allLocations: WarehouseLocation[],
): WarehouseLocation | undefined {
  let currentParentId = parentLocationId;

  while (currentParentId) {
    const parent = allLocations.find((location) => location.id === currentParentId);
    if (!parent) return undefined;

    if (
      parent.responsibilityAssignment?.mode === 'AssignDirectly' &&
      parent.responsibilityAssignment.employee
    ) {
      return parent;
    }

    currentParentId = parent.parentLocationId;
  }

  return undefined;
}

// ─── evaluateCapacityState ────────────────────────────────────────────────────

/**
 * Determines whether a location has capacity to accept more stock.
 * Returns 'available', 'nearFull', or 'full'.
 */
export function evaluateCapacityState(
  capacity: NonNullable<WarehouseLocation['capacity']>,
): 'available' | 'nearFull' | 'full' {
  const checks: Array<{ current?: number; max?: number }> = [
    { current: capacity.currentWeightKg, max: capacity.maxWeightKg },
    { current: capacity.currentVolumeM3, max: capacity.maxVolumeM3 },
    { current: capacity.currentUnits, max: capacity.maxUnits },
  ];

  let maxUsedPercent = 0;

  for (const { current, max } of checks) {
    if (max && max > 0 && current !== undefined) {
      const percent = current / max;
      if (percent > maxUsedPercent) maxUsedPercent = percent;
    }
  }

  if (maxUsedPercent >= 1) return 'full';
  if (maxUsedPercent >= 0.85) return 'nearFull';
  return 'available';
}

// ─── evaluateConfigurationImpact ─────────────────────────────────────────────

/**
 * When a user changes Inventory Control Mode from Warehouse-Level to
 * Location-BIN-Level (or vice versa), this function returns the list of
 * configuration impacts (fields that will be reset or locked).
 */
export function evaluateConfigurationImpact(
  currentMode: InventoryControlMode,
  proposedMode: InventoryControlMode,
  warehouse: Partial<Warehouse>,
): ValidationIssue[] {
  if (currentMode === proposedMode) return [];

  const impacts: ValidationIssue[] = [];

  if (proposedMode === 'Warehouse-Level') {
    if (warehouse.autoPutaway?.enabled) {
      impacts.push({
        field: 'autoPutaway.enabled',
        section: 'autoPutaway',
        severity: 'warning',
        category: 'PolicyConflict',
        message: 'Auto Putaway will be disabled — not supported in Warehouse-Level mode.',
      });
    }
    if (warehouse.autoPicking?.enabled) {
      impacts.push({
        field: 'autoPicking.enabled',
        section: 'autoPicking',
        severity: 'warning',
        category: 'PolicyConflict',
        message: 'Auto Picking will be disabled — not supported in Warehouse-Level mode.',
      });
    }
    impacts.push({
      section: 'hierarchyTemplate',
      severity: 'info',
      category: 'PolicyConflict',
      message: 'Hierarchy Templates are not applicable in Warehouse-Level mode.',
    });
    impacts.push({
      section: 'locations',
      severity: 'info',
      category: 'PolicyConflict',
      message: 'Individual Location/BIN management is not applicable in Warehouse-Level mode.',
    });
  }

  if (proposedMode === 'Location-BIN-Level') {
    impacts.push({
      section: 'hierarchyTemplate',
      severity: 'info',
      category: 'DependencyMissing',
      message: 'An Active Hierarchy Template must be configured before activation.',
    });
    impacts.push({
      section: 'locations',
      severity: 'info',
      category: 'DependencyMissing',
      message: 'At least one Active, inventory-allowed location must exist before activation.',
    });
  }

  return impacts;
}
