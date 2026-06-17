// ─── Warehouse Master — Pure Derivation Functions ────────────────────────────
//
// All functions are pure (no side-effects, no I/O). The UI must call these
// functions to compute derived fields; derived fields must never be stored as
// editable inputs in form state.

import type {
  CapacityRollupResult,
  CapacityUsageSnapshot,
  ControlledAction,
  EffectiveCapacityPolicy,
  EffectiveResponsibility,
  EligibilityPolicy,
  HierarchyCompletionIssue,
  HierarchyCompletionModel,
  HierarchyTemplate,
  InventoryControlRules,
  ProjectedPostingCapacityInput,
  ProjectedPostingCapacityResult,
  SectionHealth,
  SetupHealth,
  StorageConstraints,
  Warehouse,
  WarehouseLocation,
  ValidationIssue,
} from '../types/warehouse.types';
import type {
  CapacityStatus,
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
  deriveEffectiveCapacityPolicy as deriveEffectiveCapacityPolicyFromTemplate,
  deriveEffectiveNodeCapabilities,
  getTemplateLevelForLocation,
} from './hierarchyUtils';

export interface HierarchyCompletionPolicyConfig {
  readonly capacityRequiredAsBlocker?: boolean;
  readonly itemEligibilityRequiredAsBlocker?: boolean;
  readonly responsibilityRequiredAsBlocker?: boolean;
}

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

function asNonNegative(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value) || value < 0) return 0;
  return value;
}

export function deriveCapacityApplicability(
  location: WarehouseLocation,
  template?: HierarchyTemplate,
): boolean {
  const level = getTemplateLevelForLocation(location, template);
  const capabilities = deriveEffectiveNodeCapabilities(template, level);
  return capabilities.capacityApplicable;
}

export function deriveEffectiveCapacityPolicy(
  warehouse: Warehouse,
  location: WarehouseLocation,
  template?: HierarchyTemplate,
): EffectiveCapacityPolicy {
  const fromTemplate = deriveEffectiveCapacityPolicyFromTemplate(template, location);
  const fromWarehouse = warehouse.capacityPolicy;
  return {
    applicable: fromTemplate.applicable,
    enforcementMode: fromTemplate.applicable
      ? (location.capacity?.enforcementMode
        ?? fromTemplate.enforcementMode
        ?? fromWarehouse?.defaultEnforcementMode
        ?? 'Informational')
      : 'None',
    rollupMode: fromTemplate.applicable
      ? (location.capacity?.rollupMode
        ?? fromTemplate.rollupMode
        ?? fromWarehouse?.defaultRollupMode
        ?? 'OwnCapacityOnly')
      : 'None',
    consumptionSources: fromTemplate.applicable
      ? [
        location.capacity?.consumptionSource
        ?? fromTemplate.consumptionSources[0]
        ?? fromWarehouse?.defaultConsumptionSource
        ?? 'DirectStock',
      ]
      : [],
  };
}

export function deriveCapacityUsage(location: WarehouseLocation): CapacityUsageSnapshot {
  const capacity = location.capacity;
  const currentUnits = asNonNegative(capacity?.currentUnits);
  const currentWeightKg = asNonNegative(capacity?.currentWeightKg);
  const currentVolumeM3 = asNonNegative(capacity?.currentVolumeM3);
  const reservedUnits = asNonNegative(capacity?.reservedUnits);
  const reservedWeightKg = asNonNegative(capacity?.reservedWeightKg);
  const reservedVolumeM3 = asNonNegative(capacity?.reservedVolumeM3);
  const maxUnits = capacity?.maxUnits;
  const maxWeightKg = capacity?.maxWeightKg;
  const maxVolumeM3 = capacity?.maxVolumeM3;
  const usedUnits = currentUnits + reservedUnits;
  const usedWeight = currentWeightKg + reservedWeightKg;
  const usedVolume = currentVolumeM3 + reservedVolumeM3;
  const utilizationPercent =
    maxUnits && maxUnits > 0
      ? Math.round((usedUnits / maxUnits) * 100)
      : maxWeightKg && maxWeightKg > 0
        ? Math.round((usedWeight / maxWeightKg) * 100)
        : maxVolumeM3 && maxVolumeM3 > 0
          ? Math.round((usedVolume / maxVolumeM3) * 100)
          : undefined;
  return {
    currentUnits,
    currentWeightKg,
    currentVolumeM3,
    reservedUnits,
    reservedWeightKg,
    reservedVolumeM3,
    availableUnits: maxUnits !== undefined ? maxUnits - usedUnits : undefined,
    availableWeightKg: maxWeightKg !== undefined ? maxWeightKg - usedWeight : undefined,
    availableVolumeM3: maxVolumeM3 !== undefined ? maxVolumeM3 - usedVolume : undefined,
    utilizationPercent,
  };
}

function sumUsage(parts: CapacityUsageSnapshot[]): CapacityUsageSnapshot {
  const currentUnits = parts.reduce((sum, part) => sum + part.currentUnits, 0);
  const currentWeightKg = parts.reduce((sum, part) => sum + part.currentWeightKg, 0);
  const currentVolumeM3 = parts.reduce((sum, part) => sum + part.currentVolumeM3, 0);
  const reservedUnits = parts.reduce((sum, part) => sum + part.reservedUnits, 0);
  const reservedWeightKg = parts.reduce((sum, part) => sum + part.reservedWeightKg, 0);
  const reservedVolumeM3 = parts.reduce((sum, part) => sum + part.reservedVolumeM3, 0);
  return {
    currentUnits,
    currentWeightKg,
    currentVolumeM3,
    reservedUnits,
    reservedWeightKg,
    reservedVolumeM3,
  };
}

function collectChildren(parentId: string, allLocations: WarehouseLocation[]): WarehouseLocation[] {
  return allLocations.filter((item) => item.parentLocationId === parentId);
}

export function deriveCapacityRollup(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  warehouse: Warehouse,
  template?: HierarchyTemplate,
): CapacityRollupResult {
  const ownUsage = deriveCapacityUsage(location);
  const policy = deriveEffectiveCapacityPolicy(warehouse, location, template);
  const children = collectChildren(location.id, allLocations);
  const rolledChildUsage = policy.rollupMode === 'RollupFromChildren' || policy.rollupMode === 'SharedParentPool'
    ? sumUsage(children.map((child) => deriveCapacityUsage(child)))
    : sumUsage([]);
  const totalUsage = {
    currentUnits: ownUsage.currentUnits + rolledChildUsage.currentUnits,
    currentWeightKg: ownUsage.currentWeightKg + rolledChildUsage.currentWeightKg,
    currentVolumeM3: ownUsage.currentVolumeM3 + rolledChildUsage.currentVolumeM3,
    reservedUnits: ownUsage.reservedUnits + rolledChildUsage.reservedUnits,
    reservedWeightKg: ownUsage.reservedWeightKg + rolledChildUsage.reservedWeightKg,
    reservedVolumeM3: ownUsage.reservedVolumeM3 + rolledChildUsage.reservedVolumeM3,
    availableUnits: ownUsage.availableUnits,
    availableWeightKg: ownUsage.availableWeightKg,
    availableVolumeM3: ownUsage.availableVolumeM3,
    utilizationPercent: ownUsage.utilizationPercent,
  } satisfies CapacityUsageSnapshot;
  return {
    nodeId: location.id,
    ownUsage,
    rolledChildUsage,
    totalUsage,
    warning: (policy.rollupMode === 'RollupFromChildren' || policy.rollupMode === 'SharedParentPool') && children.length > 0
      ? 'Parent capacity includes child rollup usage.'
      : undefined,
  };
}

export function deriveCapacityUtilization(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  warehouse: Warehouse,
  template?: HierarchyTemplate,
): number | undefined {
  const rollup = deriveCapacityRollup(location, allLocations, warehouse, template);
  const maxUnits = location.capacity?.maxUnits;
  const maxWeightKg = location.capacity?.maxWeightKg;
  const maxVolumeM3 = location.capacity?.maxVolumeM3;
  const usedUnits = rollup.totalUsage.currentUnits + rollup.totalUsage.reservedUnits;
  const usedWeight = rollup.totalUsage.currentWeightKg + rollup.totalUsage.reservedWeightKg;
  const usedVolume = rollup.totalUsage.currentVolumeM3 + rollup.totalUsage.reservedVolumeM3;
  if (maxUnits && maxUnits > 0) return Math.round((usedUnits / maxUnits) * 100);
  if (maxWeightKg && maxWeightKg > 0) return Math.round((usedWeight / maxWeightKg) * 100);
  if (maxVolumeM3 && maxVolumeM3 > 0) return Math.round((usedVolume / maxVolumeM3) * 100);
  return undefined;
}

export function deriveCapacityStatus(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  warehouse: Warehouse,
  template?: HierarchyTemplate,
): CapacityStatus {
  const applicable = deriveCapacityApplicability(location, template);
  if (!applicable) return 'NotApplicable';
  const utilization = deriveCapacityUtilization(location, allLocations, warehouse, template);
  const hasConfiguredMax =
    location.capacity?.maxUnits !== undefined ||
    location.capacity?.maxWeightKg !== undefined ||
    location.capacity?.maxVolumeM3 !== undefined;
  if (!hasConfiguredMax) return 'NotConfigured';
  if (utilization === undefined) return 'WithinCapacity';
  const threshold = location.capacity?.warningThresholdPercent ?? warehouse.capacityPolicy?.warningThresholdPercent ?? 80;
  const policy = deriveEffectiveCapacityPolicy(warehouse, location, template);
  if (utilization > 100) {
    return policy.enforcementMode === 'ApprovalRequired' ? 'RequiresApproval' : 'Exceeded';
  }
  if (utilization >= threshold) {
    return policy.enforcementMode === 'ApprovalRequired' ? 'RequiresApproval' : 'NearCapacity';
  }
  return 'WithinCapacity';
}

export function deriveCapacityValidationIssues(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  warehouse: Warehouse,
  template?: HierarchyTemplate,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const capacity = location.capacity;
  const applicable = deriveCapacityApplicability(location, template);
  if (!applicable && capacity) {
    issues.push({
      field: 'capacity',
      section: 'capacityStorage',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Capacity data cannot be set for a non-applicable level.',
    });
    return issues;
  }
  if (!capacity) return issues;
  if (asNonNegative(capacity.maxUnits) < asNonNegative(capacity.currentUnits)) {
    issues.push({ field: 'capacity.maxUnits', section: 'capacityStorage', severity: 'error', category: 'CapacityExceeded', message: 'Maximum units cannot be lower than current units.' });
  }
  if (asNonNegative(capacity.maxUnits) < asNonNegative(capacity.reservedUnits)) {
    issues.push({ field: 'capacity.maxUnits', section: 'capacityStorage', severity: 'error', category: 'CapacityExceeded', message: 'Maximum units cannot be lower than reserved units.' });
  }
  const policy = deriveEffectiveCapacityPolicy(warehouse, location, template);
  const status = deriveCapacityStatus(location, allLocations, warehouse, template);
  if (status === 'Exceeded' && policy.enforcementMode === 'HardBlock') {
    issues.push({ field: 'capacity', section: 'capacityStorage', severity: 'error', category: 'CapacityExceeded', message: 'Hard block capacity is exceeded.' });
  }
  if (status === 'NearCapacity' && policy.enforcementMode === 'Warning') {
    issues.push({ field: 'capacity', section: 'capacityStorage', severity: 'warning', category: 'CapacityExceeded', message: 'Capacity warning threshold reached.' });
  }
  if (capacity.overrideReasonRequired && capacity.overrideAllowed && !capacity.overrideReason?.trim()) {
    issues.push({ field: 'capacity.overrideReason', section: 'capacityStorage', severity: 'error', category: 'FieldRequired', message: 'Override reason is required by policy.' });
  }
  return issues;
}

export function deriveEffectiveStorageConstraints(
  location: WarehouseLocation,
  allLocations: WarehouseLocation[],
  warehouse: Warehouse,
): StorageConstraints {
  const lineage: WarehouseLocation[] = [];
  let current: WarehouseLocation | undefined = location;
  while (current) {
    lineage.push(current);
    current = current.parentLocationId
      ? allLocations.find((item) => item.id === current?.parentLocationId)
      : undefined;
  }

  const inherited = [...lineage].reverse().reduce<StorageConstraints>((acc, node) => ({
    ...acc,
    ...(node.storageConstraints ?? {}),
  }), warehouse.storageConstraints ?? {});

  return {
    ...inherited,
    minTempCelsius: lineage
      .map((node) => node.storageConstraints?.minTempCelsius)
      .filter((value): value is number => value !== undefined)
      .reduce<number | undefined>((max, value) => (max === undefined ? value : Math.max(max, value)), inherited.minTempCelsius),
    maxTempCelsius: lineage
      .map((node) => node.storageConstraints?.maxTempCelsius)
      .filter((value): value is number => value !== undefined)
      .reduce<number | undefined>((min, value) => (min === undefined ? value : Math.min(min, value)), inherited.maxTempCelsius),
    hazardAllowed:
      [warehouse.storageConstraints?.hazardAllowed, ...lineage.map((node) => node.storageConstraints?.hazardAllowed)]
        .filter((value): value is boolean => value !== undefined)
        .every((value) => value),
    allowMixedItemStorage:
      [warehouse.storageConstraints?.allowMixedItemStorage, ...lineage.map((node) => node.storageConstraints?.allowMixedItemStorage)]
        .filter((value): value is boolean => value !== undefined)
        .every((value) => value),
    allowMixedLotStorage:
      [warehouse.storageConstraints?.allowMixedLotStorage, ...lineage.map((node) => node.storageConstraints?.allowMixedLotStorage)]
        .filter((value): value is boolean => value !== undefined)
        .every((value) => value),
    allowMixedOwnerStorage:
      [warehouse.storageConstraints?.allowMixedOwnerStorage, ...lineage.map((node) => node.storageConstraints?.allowMixedOwnerStorage)]
        .filter((value): value is boolean => value !== undefined)
        .every((value) => value),
  };
}

export function evaluateCapacityForProjectedPosting(
  input: ProjectedPostingCapacityInput,
): ProjectedPostingCapacityResult {
  const { warehouse, targetNode, allLocations, activeTemplate } = input;
  const policy = deriveEffectiveCapacityPolicy(warehouse, targetNode, activeTemplate);
  const status = deriveCapacityStatus(targetNode, allLocations, warehouse, activeTemplate);
  const constraints = deriveEffectiveStorageConstraints(targetNode, allLocations, warehouse);
  const reasons: string[] = [];
  const affectedCapacityScopes = [targetNode.id];

  if (input.itemAttributes?.temperatureZone === 'Frozen' && constraints.maxTempCelsius !== undefined && constraints.maxTempCelsius > 0) {
    reasons.push('Temperature constraint mismatch detected for frozen item posting.');
  }
  if (input.itemAttributes?.hazardClass && constraints.hazardAllowed === false) {
    reasons.push('Hazard class is not allowed by effective node constraints.');
  }

  if (reasons.length > 0 && policy.enforcementMode === 'HardBlock') {
    return {
      decision: 'blocked',
      allowed: false,
      warning: false,
      blocked: true,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }

  if (reasons.length > 0 && (policy.enforcementMode === 'Warning' || policy.enforcementMode === 'Informational')) {
    return {
      decision: 'warning',
      allowed: true,
      warning: true,
      blocked: false,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }
  if (status === 'NotApplicable') {
    return {
      decision: 'allowed',
      allowed: true,
      warning: false,
      blocked: false,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }
  if (status === 'NotConfigured') {
    reasons.push('Capacity is not configured for this applicable level.');
    return {
      decision: 'warning',
      allowed: true,
      warning: true,
      blocked: false,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }
  if (status === 'Exceeded' && policy.enforcementMode === 'HardBlock') {
    reasons.push('Projected posting is blocked because hard-block capacity is exceeded.');
    return {
      decision: 'blocked',
      allowed: false,
      warning: false,
      blocked: true,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }
  if (status === 'RequiresApproval' || policy.enforcementMode === 'ApprovalRequired') {
    reasons.push('Projected posting requires approval under capacity policy.');
    return {
      decision: 'approval-required',
      allowed: false,
      warning: false,
      blocked: false,
      approvalRequired: true,
      affectedCapacityScopes,
      reasons,
    };
  }
  if (status === 'NearCapacity') {
    reasons.push('Projected posting is near configured capacity threshold.');
    return {
      decision: 'warning',
      allowed: true,
      warning: true,
      blocked: false,
      approvalRequired: false,
      affectedCapacityScopes,
      reasons,
    };
  }
  return {
    decision: 'allowed',
    allowed: true,
    warning: false,
    blocked: false,
    approvalRequired: false,
    affectedCapacityScopes,
    reasons,
  };
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

export function deriveHierarchyCompletionModel(
  warehouse: Warehouse,
  locations: WarehouseLocation[],
  templates: HierarchyTemplate[],
  policy: HierarchyCompletionPolicyConfig = {},
): HierarchyCompletionModel {
  if (warehouse.inventoryControlMode === 'Warehouse-Level') {
    return {
      status: 'Complete',
      hierarchyApplicable: false,
      activeTemplateExists: false,
      templateValid: true,
      hasActualRootOrVirtualRoot: true,
      actualNodeCount: locations.length,
      leafEndpointCount: 0,
      inventoryEndpointEligibleCount: 0,
      inventoryAllowedCount: 0,
      blockedOrInactiveNodeCount: 0,
      identifierIssueCount: 0,
      missingCapacitySetupCount: 0,
      missingItemEligibilitySetupCount: 0,
      missingResponsibilitySetupCount: 0,
      defaultLocationsConfigured: false,
      blockers: [],
      warnings: [],
      infos: [],
      checklist: [
        {
          key: 'active-template-exists',
          label: 'Active template exists',
          status: 'Not Applicable',
          severity: 'None',
          affectedCount: 0,
        },
      ],
      nextRecommendedAction: 'Hierarchy completion is not required for Warehouse-Level inventory mode.',
    };
  }

  const activeTemplate = templates.find((template) => template.status === 'Active');
  const actualNodeCount = locations.length;
  const leafNodes = locations.filter((location) => location.profile.isLeafEndpoint);
  const inventoryEndpointEligibleNodes = locations.filter((location) => {
    const level = getTemplateLevelForLocation(location, activeTemplate);
    const capabilities = deriveEffectiveNodeCapabilities(activeTemplate, level);
    return capabilities.inventoryEndpointEligible;
  });
  const activeInventoryAllowedNodes = locations.filter(
    (location) => location.status === 'Active' && location.profile.inventoryAllowed,
  );
  const blockedOrInactiveNodes = locations.filter(
    (location) => location.status === 'Blocked' || location.status === 'Inactive',
  );

  const identifierMap = new Map<string, WarehouseLocation[]>();
  for (const location of locations) {
    const key = location.profile.fullCode.trim().toUpperCase();
    identifierMap.set(key, [...(identifierMap.get(key) ?? []), location]);
  }
  const duplicateIdentifierGroups = Array.from(identifierMap.values()).filter((group) => group.length > 1);
  const duplicateIdentifierNodes = duplicateIdentifierGroups.flat();

  const missingCapacityNodes = locations.filter((location) => {
    const level = getTemplateLevelForLocation(location, activeTemplate);
    const capabilities = deriveEffectiveNodeCapabilities(activeTemplate, level);
    if (!capabilities.capacityApplicable) return false;
    const capacity = location.capacity;
    if (!capacity) return true;
    return (
      capacity.maxWeightKg === undefined &&
      capacity.maxVolumeM3 === undefined &&
      capacity.maxUnits === undefined
    );
  });

  const hardBlockedCapacityNodes = locations.filter((location) => {
    const status = deriveCapacityStatus(location, locations, warehouse, activeTemplate);
    const policyMode = deriveEffectiveCapacityPolicy(warehouse, location, activeTemplate).enforcementMode;
    return location.status === 'Active' && location.profile.inventoryAllowed && status === 'Exceeded' && policyMode === 'HardBlock';
  });

  const approvalRequiredCapacityNodes = locations.filter((location) => {
    const status = deriveCapacityStatus(location, locations, warehouse, activeTemplate);
    return status === 'RequiresApproval';
  });

  const missingEligibilityNodes = locations.filter((location) => {
    const level = getTemplateLevelForLocation(location, activeTemplate);
    const capabilities = deriveEffectiveNodeCapabilities(activeTemplate, level);
    if (!capabilities.itemEligibilityApplicable) return false;
    return !location.eligibilityPolicy && (!location.eligibilityMappings || location.eligibilityMappings.length === 0);
  });

  const missingResponsibilityNodes = locations.filter((location) => {
    const level = getTemplateLevelForLocation(location, activeTemplate);
    const capabilities = deriveEffectiveNodeCapabilities(activeTemplate, level);
    if (!capabilities.responsibilityApplicable) return false;
    const status = location.effectiveResponsibility?.status;
    return !status || status === 'Unassigned' || status === 'Expired';
  });

  const defaultLocationsConfigured = Boolean(
    warehouse.defaultLocations.putaway?.locationId ||
    warehouse.defaultLocations.picking?.locationId ||
    warehouse.defaultLocations.return?.locationId ||
    warehouse.defaultLocations.qc?.locationId ||
    warehouse.defaultLocations.staging?.locationId ||
    warehouse.defaultLocations.scrap?.locationId,
  );

  const blockers: HierarchyCompletionIssue[] = [];
  const warnings: HierarchyCompletionIssue[] = [];
  const infos: HierarchyCompletionIssue[] = [];

  const pushIssue = (
    bucket: HierarchyCompletionIssue[],
    issue: Omit<HierarchyCompletionIssue, 'issueId'>,
  ) => {
    bucket.push({ issueId: `HC-${bucket.length + blockers.length + warnings.length + infos.length + 1}`, ...issue });
  };

  if (!activeTemplate) {
    pushIssue(blockers, {
      severity: 'Blocker',
      issueType: 'Missing Active Template',
      issueMessage: 'No active hierarchy template found.',
      recommendedAction: 'Create or activate a hierarchy template.',
      actionTarget: 'Template',
    });
  }

  if (actualNodeCount === 0) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: 'No Actual Nodes',
      issueMessage: 'No actual hierarchy nodes have been created.',
      recommendedAction: 'Create the first actual location under warehouse root.',
      actionTarget: 'Hierarchy',
    });
  }

  if (actualNodeCount > 0 && leafNodes.length === 0) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: 'No Leaf Endpoint',
      issueMessage: 'Hierarchy has nodes but no leaf endpoint.',
      recommendedAction: 'Continue creating child levels until an inventory endpoint is reached.',
      actionTarget: 'Hierarchy',
    });
  }

  if (inventoryEndpointEligibleNodes.length === 0) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: 'No Inventory Endpoint',
      issueMessage: 'No inventory-endpoint-eligible node exists.',
      recommendedAction: 'Ensure at least one endpoint-capable level is created.',
      actionTarget: 'Hierarchy',
    });
  }

  if (activeInventoryAllowedNodes.length === 0) {
    pushIssue(blockers, {
      severity: 'Blocker',
      issueType: 'No Inventory Allowed Node',
      issueMessage: 'No active inventory-allowed endpoint is available.',
      recommendedAction: 'Activate at least one endpoint location.',
      actionTarget: 'Locations',
    });
  }

  if (duplicateIdentifierNodes.length > 0) {
    for (const node of duplicateIdentifierNodes) {
      pushIssue(blockers, {
        severity: 'Blocker',
        issueType: 'Duplicate Identifier',
        nodeId: node.id,
        fullLocationIdentifier: node.profile.fullCode,
        issueMessage: `Duplicate full identifier detected for ${node.profile.fullCode}.`,
        recommendedAction: 'Resolve duplicate full identifier conflict.',
        actionTarget: 'Hierarchy',
      });
    }
  }

  for (const node of blockedOrInactiveNodes) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: node.status === 'Blocked' ? 'Node Blocked' : 'Node Inactive',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `${node.locationCode} is ${node.status}.`,
      recommendedAction: 'Resolve blocked/inactive parent path issues.',
      actionTarget: 'Locations',
    });
  }

  const missingCapacityBucket = policy.capacityRequiredAsBlocker ? blockers : warnings;
  for (const node of missingCapacityNodes) {
    pushIssue(missingCapacityBucket, {
      severity: policy.capacityRequiredAsBlocker ? 'Blocker' : 'Warning',
      issueType: 'Capacity Required Missing',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `Capacity setup is missing for ${node.locationCode}.`,
      recommendedAction: 'Configure required capacity for capacity-controlled levels.',
      actionTarget: 'CapacityView',
    });
  }

  for (const node of hardBlockedCapacityNodes) {
    pushIssue(blockers, {
      severity: 'Blocker',
      issueType: 'Capacity Exceeded Hard Block',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `Hard-block capacity exceeded on active inventory endpoint ${node.locationCode}.`,
      recommendedAction: 'Open Capacity View and increase capacity or reduce usage.',
      actionTarget: 'CapacityView',
    });
  }

  for (const node of approvalRequiredCapacityNodes) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: 'Capacity Approval Required',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `Capacity policy requires approval for ${node.locationCode}.`,
      recommendedAction: 'Open Capacity View and complete required approval/override flow.',
      actionTarget: 'CapacityView',
    });
  }

  const missingEligibilityBucket = policy.itemEligibilityRequiredAsBlocker ? blockers : warnings;
  for (const node of missingEligibilityNodes) {
    pushIssue(missingEligibilityBucket, {
      severity: policy.itemEligibilityRequiredAsBlocker ? 'Blocker' : 'Warning',
      issueType: 'Item Eligibility Required Missing',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `Item eligibility setup is missing for ${node.locationCode}.`,
      recommendedAction: 'Configure item eligibility where policy requires it.',
      actionTarget: 'Locations',
    });
  }

  const missingResponsibilityBucket = policy.responsibilityRequiredAsBlocker ? blockers : warnings;
  for (const node of missingResponsibilityNodes) {
    pushIssue(missingResponsibilityBucket, {
      severity: policy.responsibilityRequiredAsBlocker ? 'Blocker' : 'Warning',
      issueType: 'Responsibility Required Missing',
      nodeId: node.id,
      fullLocationIdentifier: node.profile.fullCode,
      issueMessage: `Responsibility setup is missing for ${node.locationCode}.`,
      recommendedAction: 'Configure required responsibility for controlled levels.',
      actionTarget: 'Locations',
    });
  }

  if (!defaultLocationsConfigured) {
    pushIssue(warnings, {
      severity: 'Warning',
      issueType: 'Lifecycle Action Blocked',
      issueMessage: 'No default locations are configured.',
      recommendedAction: 'Configure default locations if your operation requires default routing.',
      actionTarget: 'defaultLocations',
    });
  }

  const checklist: HierarchyCompletionModel['checklist'] = [
    {
      key: 'active-template-exists',
      label: 'Active template exists',
      status: activeTemplate ? 'Passed' : 'Failed',
      severity: activeTemplate ? 'None' : 'Blocker',
      affectedCount: activeTemplate ? 0 : 1,
      actionLabel: activeTemplate ? undefined : 'Design Template',
      actionTarget: activeTemplate ? undefined : 'Template',
    },
    {
      key: 'valid-hierarchy-path-exists',
      label: 'Valid hierarchy path exists',
      status: actualNodeCount > 0 ? 'Passed' : 'Failed',
      severity: actualNodeCount > 0 ? 'None' : 'Blocker',
      affectedCount: actualNodeCount > 0 ? 0 : 1,
      actionLabel: actualNodeCount > 0 ? undefined : 'Add First Child',
      actionTarget: actualNodeCount > 0 ? undefined : 'Hierarchy',
    },
    {
      key: 'actual-nodes-created',
      label: 'Actual nodes created',
      status: actualNodeCount > 0 ? 'Passed' : 'Failed',
      severity: actualNodeCount > 0 ? 'None' : 'Blocker',
      affectedCount: actualNodeCount,
      actionLabel: actualNodeCount > 0 ? undefined : 'Create Hierarchy Quickly',
      actionTarget: actualNodeCount > 0 ? undefined : 'Hierarchy',
    },
    {
      key: 'leaf-endpoint-exists',
      label: 'At least one leaf endpoint exists',
      status: leafNodes.length > 0 ? 'Passed' : 'Failed',
      severity: leafNodes.length > 0 ? 'None' : 'Blocker',
      affectedCount: leafNodes.length,
      actionTarget: 'Hierarchy',
    },
    {
      key: 'inventory-endpoint-eligible-exists',
      label: 'At least one inventory endpoint eligible node exists',
      status: inventoryEndpointEligibleNodes.length > 0 ? 'Passed' : 'Failed',
      severity: inventoryEndpointEligibleNodes.length > 0 ? 'None' : 'Blocker',
      affectedCount: inventoryEndpointEligibleNodes.length,
      actionTarget: 'Hierarchy',
    },
    {
      key: 'active-inventory-allowed-node-exists',
      label: 'At least one active inventory-allowed node exists',
      status: activeInventoryAllowedNodes.length > 0 ? 'Passed' : 'Failed',
      severity: activeInventoryAllowedNodes.length > 0 ? 'None' : 'Blocker',
      affectedCount: activeInventoryAllowedNodes.length,
      actionTarget: 'Locations',
    },
    {
      key: 'full-identifiers-valid-unique',
      label: 'Full identifiers are valid and unique',
      status: duplicateIdentifierNodes.length === 0 ? 'Passed' : 'Failed',
      severity: duplicateIdentifierNodes.length === 0 ? 'None' : 'Blocker',
      affectedCount: duplicateIdentifierNodes.length,
      actionLabel: duplicateIdentifierNodes.length > 0 ? 'Show Issues' : undefined,
      actionTarget: 'Hierarchy',
    },
    {
      key: 'required-capacity-setup-complete',
      label: 'Required capacity setup complete',
      status: missingCapacityNodes.length === 0 ? 'Passed' : policy.capacityRequiredAsBlocker ? 'Failed' : 'Warning',
      severity: missingCapacityNodes.length === 0 ? 'None' : policy.capacityRequiredAsBlocker ? 'Blocker' : 'Warning',
      affectedCount: missingCapacityNodes.length,
      actionTarget: 'Locations',
    },
    {
      key: 'required-item-eligibility-setup-complete',
      label: 'Required item eligibility setup complete',
      status: missingEligibilityNodes.length === 0 ? 'Passed' : policy.itemEligibilityRequiredAsBlocker ? 'Failed' : 'Warning',
      severity: missingEligibilityNodes.length === 0 ? 'None' : policy.itemEligibilityRequiredAsBlocker ? 'Blocker' : 'Warning',
      affectedCount: missingEligibilityNodes.length,
      actionTarget: 'Locations',
    },
    {
      key: 'required-responsibility-setup-complete',
      label: 'Required responsibility setup complete',
      status: missingResponsibilityNodes.length === 0 ? 'Passed' : policy.responsibilityRequiredAsBlocker ? 'Failed' : 'Warning',
      severity: missingResponsibilityNodes.length === 0 ? 'None' : policy.responsibilityRequiredAsBlocker ? 'Blocker' : 'Warning',
      affectedCount: missingResponsibilityNodes.length,
      actionTarget: 'Locations',
    },
    {
      key: 'blocked-parent-path-issues-resolved',
      label: 'Blocked/inactive parent path issues resolved',
      status: blockedOrInactiveNodes.length === 0 ? 'Passed' : 'Warning',
      severity: blockedOrInactiveNodes.length === 0 ? 'None' : 'Warning',
      affectedCount: blockedOrInactiveNodes.length,
      actionTarget: 'Locations',
    },
  ];

  const coreIncomplete =
    Boolean(activeTemplate) && (
      actualNodeCount === 0 ||
      leafNodes.length === 0 ||
      inventoryEndpointEligibleNodes.length === 0
    );

  let status: HierarchyCompletionModel['status'] = 'Complete';
  if (actualNodeCount === 0 && activeTemplate) status = 'Incomplete';
  else if (blockers.length > 0) status = 'Blocked';
  else if (coreIncomplete) status = 'Incomplete';
  else if (warnings.length > 0) status = 'Warning';

  const nextRecommendedAction = actualNodeCount === 0 && activeTemplate
    ? 'Active template exists, but no locations have been created. Select the warehouse root and create the first child.'
    : blockers[0]?.recommendedAction
      ?? warnings[0]?.recommendedAction
      ?? 'Hierarchy setup is complete for activation readiness.';

  if (actualNodeCount === 0 && activeTemplate) {
    infos.push({
      issueId: 'HC-INFO-1',
      severity: 'Info',
      issueType: 'No Actual Nodes',
      issueMessage: 'Template is active but no actual nodes exist yet.',
      recommendedAction: 'Create the first actual location under warehouse root.',
      actionTarget: 'Hierarchy',
    });
  }

  return {
    status,
    hierarchyApplicable: true,
    activeTemplateExists: Boolean(activeTemplate),
    templateValid: Boolean(activeTemplate),
    templateVersion: activeTemplate?.currentVersion.versionNumber,
    hasActualRootOrVirtualRoot: true,
    actualNodeCount,
    leafEndpointCount: leafNodes.length,
    inventoryEndpointEligibleCount: inventoryEndpointEligibleNodes.length,
    inventoryAllowedCount: activeInventoryAllowedNodes.length,
    blockedOrInactiveNodeCount: blockedOrInactiveNodes.length,
    identifierIssueCount: duplicateIdentifierNodes.length,
    missingCapacitySetupCount: missingCapacityNodes.length,
    missingItemEligibilitySetupCount: missingEligibilityNodes.length,
    missingResponsibilitySetupCount: missingResponsibilityNodes.length,
    defaultLocationsConfigured,
    blockers,
    warnings,
    infos,
    checklist,
    nextRecommendedAction,
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
