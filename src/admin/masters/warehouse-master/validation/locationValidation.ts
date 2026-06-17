// ─── Warehouse Master — Location Validation ──────────────────────────────────

import type { CreateLocationInput } from '../types/warehouse.dto';
import type {
  LocationCapacity,
  HierarchyTemplate,
  ItemEligibilityMapping,
  ResponsibilityAssignment,
  Warehouse,
  WarehouseLocation,
  ValidationIssue,
} from '../types/warehouse.types';
import { isCircularHierarchy } from '../utils/hierarchyUtils';
import { isValidParentChildCombination } from '../utils/hierarchyUtils';
import {
  deriveFullLocationIdentifier,
  deriveLocationCodingPolicy,
  deriveEffectiveNodeCapabilities,
  resolveTemplateLevelForInput,
} from '../utils/hierarchyUtils';
import { deriveCapacityValidationIssues } from '../utils/warehouseDerivations';

// ─── Field-level save validation ──────────────────────────────────────────────

export interface LocationFieldErrors {
  locationCode?: string;
  locationName?: string;
  locationType?: string;
  parentLocationId?: string;
  capacity?: string;
  eligibilityPolicy?: string;
}

const LOCATION_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,29}$/;

export function validateLocationForSave(
  input: CreateLocationInput,
  warehouse: Warehouse,
  existingLocations: WarehouseLocation[],
  template?: HierarchyTemplate,
  editingId?: string,
): LocationFieldErrors {
  const errors: LocationFieldErrors = {};
  const parentLocation = input.parentLocationId
    ? existingLocations.find((location) => location.id === input.parentLocationId) ?? null
    : null;
  const matchedTemplateLevel = resolveTemplateLevelForInput(template, parentLocation, input);
  const effectiveCapabilities = deriveEffectiveNodeCapabilities(template, matchedTemplateLevel);

  // Code
  if (!input.locationCode?.trim()) {
    errors.locationCode = 'Location Code is required.';
  } else if (!LOCATION_CODE_PATTERN.test(input.locationCode.trim())) {
    errors.locationCode =
      'Location Code must be 1–30 uppercase letters, digits, hyphens, or underscores, starting with a letter or digit.';
  } else {
    const duplicate = existingLocations.find(
      (l) =>
        l.locationCode.trim().toUpperCase() === input.locationCode.trim().toUpperCase() &&
        l.warehouseId === input.warehouseId &&
        l.id !== editingId,
    );
    if (duplicate) {
      errors.locationCode = 'A location with this code already exists in this warehouse.';
    }
  }

  // Name
  if (!input.locationName?.trim()) {
    errors.locationName = 'Location Name is required.';
  } else if (input.locationName.trim().length > 100) {
    errors.locationName = 'Location Name must be 100 characters or fewer.';
  }

  // Type
  if (!input.locationType) {
    errors.locationType = 'Location Type is required.';
  }

  if (!input.parentLocationId && input.locationType && !isValidParentChildCombination(null, input.locationType, template)) {
    errors.locationType = template
      ? `Location Type "${input.locationType}" is not allowed directly under the warehouse root by the active template.`
      : 'Location Type is not valid at the warehouse root.';
  }

  // Circular hierarchy check
  if (editingId && input.parentLocationId) {
    if (isCircularHierarchy(editingId, input.parentLocationId, existingLocations)) {
      errors.parentLocationId = 'Selecting this parent would create a circular hierarchy.';
    }
  }

  // Parent must exist and be Active (if specified)
  if (input.parentLocationId) {
    if (!parentLocation) {
      errors.parentLocationId = 'Selected parent location does not exist.';
    } else if (parentLocation.status !== 'Active' && parentLocation.status !== 'Draft') {
      errors.parentLocationId = `Parent location is ${parentLocation.status} and cannot accept children.`;
    } else if (!isValidParentChildCombination(parentLocation, input.locationType, template)) {
      errors.parentLocationId = `Location Type "${input.locationType}" is not valid under parent "${parentLocation.locationCode}".`;
    }
  }

  const codingPolicy = deriveLocationCodingPolicy(template, matchedTemplateLevel);
  if (matchedTemplateLevel?.separator && matchedTemplateLevel.separator.length > 2) {
    errors.locationCode = 'Level separator must be at most 2 characters.';
  }
  if ((matchedTemplateLevel?.sequenceLength ?? codingPolicy.sequenceLength) > 12) {
    errors.locationCode = 'Sequence length cannot exceed 12.';
  }

  const fullCode = deriveFullLocationIdentifier({
    warehouseCode: warehouse.warehouseCode,
    activeTemplate: template,
    parentLocationId: input.parentLocationId,
    allLocations: existingLocations,
    nodeCode: input.locationCode,
  });
  const duplicateFullCode = existingLocations.find(
    (location) =>
      location.profile.fullCode.trim().toUpperCase() === fullCode.toUpperCase() &&
      location.id !== editingId,
  );
  if (duplicateFullCode) {
    errors.locationCode = 'This full location identifier would duplicate an existing node path.';
  }

  // Capacity sanity
  if (input.capacity) {
    if (template && !effectiveCapabilities.capacityApplicable) {
      errors.capacity = 'Capacity cannot be captured for this hierarchy level because Capacity Applicable is disabled in the active template.';
    }
    if (
      input.capacity.maxWeightKg !== undefined &&
      input.capacity.maxWeightKg < 0
    ) {
      errors.capacity = 'Maximum weight must be a positive number.';
    }
    if (
      input.capacity.maxVolumeM3 !== undefined &&
      input.capacity.maxVolumeM3 < 0
    ) {
      errors.capacity = 'Maximum volume must be a positive number.';
    }
    if (
      input.capacity.maxUnits !== undefined &&
      input.capacity.maxUnits < 0
    ) {
      errors.capacity = 'Maximum units must be a positive number.';
    }
  }

  const minTemp = input.storageConstraints?.minTempCelsius;
  const maxTemp = input.storageConstraints?.maxTempCelsius;
  if (minTemp !== undefined && maxTemp !== undefined && minTemp > maxTemp) {
    errors.capacity = 'Minimum temperature cannot be greater than maximum temperature.';
  }

  if (input.eligibilityPolicy && template && !effectiveCapabilities.itemEligibilityApplicable) {
    errors.eligibilityPolicy = 'Item eligibility cannot be configured for this hierarchy level because Item Eligibility Applicable is disabled in the active template.';
  }

  return errors;
}

export function validateLocationCapacityForUpdate(
  location: WarehouseLocation,
  warehouse: Warehouse,
  allLocations: WarehouseLocation[],
  nextCapacity: Partial<LocationCapacity>,
  template?: HierarchyTemplate,
): ValidationIssue[] {
  const merged: WarehouseLocation = {
    ...location,
    capacity: {
      ...(location.capacity ?? {}),
      ...nextCapacity,
    },
  };

  const issues = deriveCapacityValidationIssues(merged, allLocations, warehouse, template);
  const checkNegative = (
    field: keyof LocationCapacity,
    label: string,
  ) => {
    const value = merged.capacity?.[field];
    if (typeof value === 'number' && value < 0) {
      issues.push({
        field: `capacity.${field}`,
        section: 'capacityStorage',
        severity: 'error',
        category: 'FieldFormat',
        message: `${label} cannot be negative.`,
      });
    }
  };

  checkNegative('maxUnits', 'Maximum units');
  checkNegative('maxWeightKg', 'Maximum weight');
  checkNegative('maxVolumeM3', 'Maximum volume');
  checkNegative('currentUnits', 'Current units');
  checkNegative('currentWeightKg', 'Current weight');
  checkNegative('currentVolumeM3', 'Current volume');
  checkNegative('reservedUnits', 'Reserved units');
  checkNegative('reservedWeightKg', 'Reserved weight');
  checkNegative('reservedVolumeM3', 'Reserved volume');

  if (
    merged.capacity?.maxUnits !== undefined &&
    merged.capacity.currentUnits !== undefined &&
    merged.capacity.maxUnits < merged.capacity.currentUnits
  ) {
    issues.push({
      field: 'capacity.maxUnits',
      section: 'capacityStorage',
      severity: 'error',
      category: 'CapacityExceeded',
      message: 'Maximum units cannot be lower than current units.',
    });
  }
  if (
    merged.capacity?.maxUnits !== undefined &&
    merged.capacity.reservedUnits !== undefined &&
    merged.capacity.maxUnits < merged.capacity.reservedUnits
  ) {
    issues.push({
      field: 'capacity.maxUnits',
      section: 'capacityStorage',
      severity: 'error',
      category: 'CapacityExceeded',
      message: 'Maximum units cannot be lower than reserved units.',
    });
  }

  return issues;
}

// ─── Activation validation ────────────────────────────────────────────────────

export function validateLocationForActivation(
  location: WarehouseLocation,
  warehouse: Warehouse,
  allLocations: WarehouseLocation[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (location.status !== 'Draft') {
    issues.push({
      field: 'status',
      severity: 'error',
      category: 'LifecycleConstraint',
      message: `Only Draft locations can be activated. Current status: ${location.status}.`,
    });
  }

  if (!location.locationCode?.trim()) {
    issues.push({
      field: 'locationCode',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Location Code is required.',
    });
  }

  if (!location.locationName?.trim()) {
    issues.push({
      field: 'locationName',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Location Name is required.',
    });
  }

  if (!location.profile.locationType) {
    issues.push({
      field: 'locationType',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Location Type is required.',
    });
  }

  // Warehouse must be Active
  if (warehouse.status !== 'Active') {
    issues.push({
      severity: 'error',
      category: 'LifecycleConstraint',
      message: `Cannot activate a location when the parent warehouse is ${warehouse.status}.`,
    });
  }

  // Parent location (if any) must be Active
  if (location.parentLocationId) {
    const parent = allLocations.find((l) => l.id === location.parentLocationId);
    if (!parent) {
      issues.push({
        field: 'parentLocationId',
        severity: 'error',
        category: 'DependencyMissing',
        message: 'Parent location not found.',
      });
    } else if (parent.status !== 'Active') {
      issues.push({
        field: 'parentLocationId',
        severity: 'error',
        category: 'LifecycleConstraint',
        message: `Parent location "${parent.locationCode}" must be Active before activating this location.`,
      });
    }
  }

  return issues;
}

export function hasLocationFieldErrors(errors: LocationFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateEligibilityMappingUniqueness(
  mappings: ItemEligibilityMapping[],
  candidate: ItemEligibilityMapping,
  editingId?: string,
): ValidationIssue[] {
  const conflicts = mappings.filter((mapping) => {
    if (mapping.id === editingId || mapping.id === candidate.id) return false;
    if (mapping.warehouseId !== candidate.warehouseId) return false;
    if (mapping.scopeType !== candidate.scopeType || mapping.scopeId !== candidate.scopeId) return false;
    if (mapping.ruleDirection !== candidate.ruleDirection) return false;
    if (mapping.subjectType !== candidate.subjectType) return false;
    if (mapping.subjectCode.trim().toUpperCase() !== candidate.subjectCode.trim().toUpperCase()) return false;
    return doDateRangesOverlap(
      mapping.effectiveFrom,
      mapping.effectiveTo,
      candidate.effectiveFrom,
      candidate.effectiveTo,
    );
  });

  return conflicts.map((conflict) => ({
    field: 'eligibilityMappings',
    section: 'itemEligibility',
    severity: 'error',
    category: 'DuplicateCode',
    message: `Eligibility mapping duplicates ${conflict.subjectType} ${conflict.subjectCode} for the same scope, rule direction, and overlapping effective period.`,
  }));
}

export function validateEffectiveDateRange(
  entityLabel: string,
  effectiveFrom: string | undefined,
  effectiveTo: string | undefined,
  section: ValidationIssue['section'],
): ValidationIssue[] {
  if (!effectiveFrom || !effectiveTo) return [];
  if (effectiveTo >= effectiveFrom) return [];

  return [
    {
      field: 'effectiveTo',
      section,
      severity: 'error',
      category: 'FieldFormat',
      message: `${entityLabel} Effective To must be on or after Effective From.`,
    },
  ];
}

export function validateResponsibilityAssignment(
  assignment: ResponsibilityAssignment | undefined,
): ValidationIssue[] {
  if (!assignment) return [];

  const issues = validateEffectiveDateRange(
    'Responsibility assignment',
    assignment.effectiveFrom,
    assignment.effectiveTo,
    'contactsAddresses',
  );

  if (assignment.mode === 'AssignDirectly' && !assignment.employee) {
    issues.push({
      field: 'responsibilityAssignment.employee',
      section: 'contactsAddresses',
      severity: 'error',
      category: 'FieldRequired',
      message: 'A direct responsibility assignment requires a responsible employee reference.',
    });
  }

  return issues;
}

function doDateRangesOverlap(
  leftFrom: string,
  leftTo: string | undefined,
  rightFrom: string,
  rightTo: string | undefined,
): boolean {
  const normalizedLeftTo = leftTo ?? '9999-12-31';
  const normalizedRightTo = rightTo ?? '9999-12-31';
  return leftFrom <= normalizedRightTo && rightFrom <= normalizedLeftTo;
}
