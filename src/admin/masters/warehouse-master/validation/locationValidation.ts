// ─── Warehouse Master — Location Validation ──────────────────────────────────

import type { CreateLocationInput } from '../types/warehouse.dto';
import type { Warehouse, WarehouseLocation, ValidationIssue } from '../types/warehouse.types';
import { isCircularHierarchy } from '../utils/hierarchyUtils';

// ─── Field-level save validation ──────────────────────────────────────────────

export interface LocationFieldErrors {
  locationCode?: string;
  locationName?: string;
  locationType?: string;
  parentLocationId?: string;
  capacity?: string;
}

const LOCATION_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{0,29}$/;

export function validateLocationForSave(
  input: CreateLocationInput,
  warehouse: Warehouse,
  existingLocations: WarehouseLocation[],
  editingId?: string,
): LocationFieldErrors {
  const errors: LocationFieldErrors = {};

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

  // Circular hierarchy check
  if (editingId && input.parentLocationId) {
    if (isCircularHierarchy(editingId, input.parentLocationId, existingLocations)) {
      errors.parentLocationId = 'Selecting this parent would create a circular hierarchy.';
    }
  }

  // Parent must exist and be Active (if specified)
  if (input.parentLocationId) {
    const parent = existingLocations.find((l) => l.id === input.parentLocationId);
    if (!parent) {
      errors.parentLocationId = 'Selected parent location does not exist.';
    } else if (parent.status !== 'Active' && parent.status !== 'Draft') {
      errors.parentLocationId = `Parent location is ${parent.status} and cannot accept children.`;
    }
  }

  // Capacity sanity
  if (input.capacity) {
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

  return errors;
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
