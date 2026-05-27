// ─── Area Master Helper Utilities ─────────────────────────────────────────────

import type { Area, AreaLevel, UsageTag, GeoBoundaryType } from '../types/areaMaster.types';

// ─── Parent Area filtering ─────────────────────────────────────────────────────

/**
 * Returns all Active areas whose area level is in the selected area level's
 * list of allowed parent level IDs. Returns empty array if parent is not required.
 */
export function getAllowedParentAreas(
  selectedAreaLevel: AreaLevel,
  allAreas: Area[],
): Area[] {
  if (!selectedAreaLevel.parentRequired) return [];
  return allAreas.filter(
    (a) =>
      a.status === 'Active' &&
      selectedAreaLevel.allowedParentLevelIds.includes(a.areaLevelId),
  );
}

// ─── Usage tag helpers ─────────────────────────────────────────────────────────

export function getAllowedUsageTagsForAreaLevel(areaLevel: AreaLevel): UsageTag[] {
  return areaLevel.allowedUsageTags;
}

export function getDefaultUsageTagsForAreaLevel(areaLevel: AreaLevel): UsageTag[] {
  return areaLevel.defaultUsageTags;
}

export function getMandatoryUsageTagsForAreaLevel(areaLevel: AreaLevel): UsageTag[] {
  return areaLevel.mandatoryUsageTags;
}

/**
 * Merges mandatory and default tags (without duplication) — the starting set
 * when an Area Level is first selected or changed.
 */
export function getInitialUsageTags(areaLevel: AreaLevel): UsageTag[] {
  return [...new Set([...areaLevel.mandatoryUsageTags, ...areaLevel.defaultUsageTags])];
}

// ─── Geo / Postal field validation ────────────────────────────────────────────

export interface GeoFieldErrors {
  latitude?: string;
  longitude?: string;
  radiusValue?: string;
  radiusUnit?: string;
  polygonReference?: string;
  mapProvider?: string;
  externalBoundaryId?: string;
  postalCode?: string;
}

export function validateGeoFields(area: {
  latitude?: number | null;
  longitude?: number | null;
  geoBoundaryType?: GeoBoundaryType | string;
  radiusValue?: number | null;
  radiusUnit?: string;
  polygonReference?: string;
  mapProvider?: string;
  externalBoundaryId?: string;
  postalCode?: string;
}): GeoFieldErrors {
  const errs: GeoFieldErrors = {};

  const hasLat = area.latitude !== null && area.latitude !== undefined && area.latitude !== ('' as unknown as number);
  const hasLon = area.longitude !== null && area.longitude !== undefined && area.longitude !== ('' as unknown as number);

  if (hasLat && !hasLon) errs.longitude = 'Longitude is required when Latitude is entered.';
  if (hasLon && !hasLat) errs.latitude = 'Latitude is required when Longitude is entered.';

  if (hasLat && typeof area.latitude === 'number' && (area.latitude < -90 || area.latitude > 90)) {
    errs.latitude = 'Latitude must be between −90 and +90.';
  }
  if (hasLon && typeof area.longitude === 'number' && (area.longitude < -180 || area.longitude > 180)) {
    errs.longitude = 'Longitude must be between −180 and +180.';
  }

  if (area.geoBoundaryType === 'Radius') {
    if (!area.radiusValue) errs.radiusValue = 'Radius Value is required.';
    if (!area.radiusUnit) errs.radiusUnit = 'Radius Unit is required.';
  }

  if (area.geoBoundaryType === 'Polygon' && !area.polygonReference) {
    errs.polygonReference = 'Polygon Reference is required.';
  }

  if (area.geoBoundaryType === 'External Map Reference') {
    if (!area.mapProvider) errs.mapProvider = 'Map Provider is required.';
    if (!area.externalBoundaryId) errs.externalBoundaryId = 'External Boundary ID is required.';
  }

  if (area.geoBoundaryType === 'Postal / Pin Code Based' && !area.postalCode) {
    errs.postalCode = 'Postal / Pin Code is required for this Geo Boundary Type.';
  }

  return errs;
}
