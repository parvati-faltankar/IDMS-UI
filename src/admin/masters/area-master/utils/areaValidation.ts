// ─── Area Activation Validation ──────────────────────────────────────────────

import type { Area, AreaLevel } from '../types/areaMaster.types';
import { isDuplicateArea } from './duplicateUtils';
import { validateAliasRows } from './aliasValidation';

// ─── Save (field-level) validation ────────────────────────────────────────────

export interface AreaFieldErrors {
  areaName?: string;
  areaLevelId?: string;
  parentAreaId?: string;
  usageTags?: string;
}

export function validateAreaForSave(
  area: Partial<Area>,
  areas: Area[],
): AreaFieldErrors {
  const errs: AreaFieldErrors = {};

  if (!area.areaName?.trim()) {
    errs.areaName = 'Area Name is required.';
  } else if (
    area.areaLevelId &&
    isDuplicateArea(area.areaName, area.areaLevelId, area.parentAreaId ?? null, areas, area.id)
  ) {
    errs.areaName = 'An Area with the same Name, Level, and Parent already exists.';
  }

  if (!area.areaLevelId) {
    errs.areaLevelId = 'Area Level is required.';
  }

  return errs;
}

/**
 * Validates an area record before it can be activated.
 * Returns an array of human-readable error messages.
 * An empty array means the area is ready for activation.
 */
export function validateAreaForActivation(
  area: Area,
  areaLevels: AreaLevel[],
  areas: Area[],
): string[] {
  const errors: string[] = [];

  // 1. Area Name is required
  if (!area.areaName.trim()) {
    errors.push('Area Name is required.');
  }

  // 2. Area Level is required
  if (!area.areaLevelId) {
    errors.push('Area Level is required.');
  }

  // 3. Selected Area Level must exist
  const level = areaLevels.find((l) => l.id === area.areaLevelId);
  if (area.areaLevelId && !level) {
    errors.push('Selected Area Level does not exist.');
  }

  // 4. Selected Area Level must be Active
  if (level && level.status !== 'Active') {
    errors.push('Selected Area Level must be Active.');
  }

  // 5. Parent Area is required if the selected level requires it
  if (level?.parentRequired && !area.parentAreaId) {
    errors.push('Parent Area is required for the selected Area Level.');
  }

  // 6. Parent Area must exist and be Active
  if (area.parentAreaId) {
    const parentArea = areas.find((a) => a.id === area.parentAreaId);
    if (!parentArea) {
      errors.push('Selected Parent Area does not exist.');
    } else {
      if (parentArea.status !== 'Active') {
        errors.push('Selected Parent Area must be Active.');
      }
      if (level && !level.allowedParentLevelIds.includes(parentArea.areaLevelId)) {
        errors.push('Selected Parent Area is not an allowed parent level for this Area Level.');
      }
    }
  }

  // 7. Duplicate check: same Name + Level + Parent
  if (isDuplicateArea(area.areaName, area.areaLevelId, area.parentAreaId, areas, area.id)) {
    errors.push('An Area with the same Name, Level, and Parent already exists.');
  }

  // 8. Latitude and Longitude must be entered together
  const hasLat = area.latitude !== null;
  const hasLon = area.longitude !== null;
  if (hasLat !== hasLon) {
    errors.push('Latitude and Longitude must be entered together.');
  }

  // 9. Latitude must be between −90 and +90
  if (hasLat && area.latitude !== null && (area.latitude < -90 || area.latitude > 90)) {
    errors.push('Latitude must be between −90 and +90.');
  }

  // 10. Longitude must be between −180 and +180
  if (hasLon && area.longitude !== null && (area.longitude < -180 || area.longitude > 180)) {
    errors.push('Longitude must be between −180 and +180.');
  }

  // 11. Geo Boundary Type dependent field checks
  if (area.geoBoundaryType === 'Radius') {
    if (!area.radiusValue) errors.push('Radius Value is required for Radius Geo Boundary Type.');
    if (!area.radiusUnit) errors.push('Radius Unit is required for Radius Geo Boundary Type.');
  }
  if (area.geoBoundaryType === 'Polygon' && !area.polygonReference) {
    errors.push('Polygon Reference is required for Polygon Geo Boundary Type.');
  }
  if (area.geoBoundaryType === 'External Map Reference') {
    if (!area.mapProvider) errors.push('Map Provider is required for External Map Reference.');
    if (!area.externalBoundaryId) errors.push('External Boundary ID is required for External Map Reference.');
  }
  if (area.geoBoundaryType === 'Postal / Pin Code Based' && !area.postalCode) {
    errors.push('Postal / Pin Code is required for Postal / Pin Code Based Geo Boundary Type.');
  }

  // Geo Radius: Latitude + Longitude required
  if (area.geoBoundaryType === 'Radius') {
    const hasLat = area.latitude !== null;
    const hasLon = area.longitude !== null;
    if (!hasLat || !hasLon) {
      errors.push('Latitude and Longitude are required when Geo Boundary Type is Radius.');
    }
  }

  // Alias / Alternate Name validation
  const aliasErrors = validateAliasRows(area.aliases, area.areaName);
  if (Object.keys(aliasErrors).length > 0) {
    errors.push('One or more alias rows have validation errors. Review the Aliases section.');
  }

  return errors;
}
