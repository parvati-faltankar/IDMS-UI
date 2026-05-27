// ─── Geo Validation Utilities ─────────────────────────────────────────────────

import type { GeoBoundaryType } from '../types/areaMaster.types';

/** Returns true if the value is a valid latitude (−90 to +90). */
export function isValidLatitude(latitude: number): boolean {
  return latitude >= -90 && latitude <= 90;
}

/** Returns true if the value is a valid longitude (−180 to +180). */
export function isValidLongitude(longitude: number): boolean {
  return longitude >= -180 && longitude <= 180;
}

/**
 * Returns true if both coordinates are provided and both are within valid ranges.
 * Returns false if either is null/undefined, or if either is out of range.
 */
export function areCoordinatesValid(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) return false;
  return isValidLatitude(latitude) && isValidLongitude(longitude);
}

// ─── Geo Boundary Field Errors ─────────────────────────────────────────────────

export interface GeoBoundaryFieldErrors {
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  radiusValue?: string;
  radiusUnit?: string;
  polygonReference?: string;
  mapProvider?: string;
  externalBoundaryId?: string;
}

/**
 * Validates Geo / Postal fields against the selected Geo Boundary Type.
 * Intended for activation-time validation — all dependent fields are required.
 * Returns an object with field-level error messages.
 */
export function validateGeoBoundaryFields(area: {
  latitude?: number | null;
  longitude?: number | null;
  geoBoundaryType?: GeoBoundaryType | string;
  radiusValue?: number | null;
  radiusUnit?: string;
  polygonReference?: string;
  mapProvider?: string;
  externalBoundaryId?: string;
  postalCode?: string;
}): GeoBoundaryFieldErrors {
  const errors: GeoBoundaryFieldErrors = {};
  const hasLat = area.latitude !== null && area.latitude !== undefined;
  const hasLon = area.longitude !== null && area.longitude !== undefined;

  // Format validation — always run if a value is present
  if (hasLat && typeof area.latitude === 'number' && (area.latitude < -90 || area.latitude > 90)) {
    errors.latitude = 'Latitude must be between −90 and +90.';
  }
  if (hasLon && typeof area.longitude === 'number' && (area.longitude < -180 || area.longitude > 180)) {
    errors.longitude = 'Longitude must be between −180 and +180.';
  }

  // Paired entry rule
  if (hasLat && !hasLon) errors.longitude = 'Latitude and Longitude must be entered together.';
  if (hasLon && !hasLat) errors.latitude  = 'Latitude and Longitude must be entered together.';

  // Geo Boundary Type dependent rules
  if (area.geoBoundaryType === 'Radius') {
    if (!area.radiusValue) errors.radiusValue = 'Radius Value is required when Geo Boundary Type is Radius.';
    if (!area.radiusUnit)  errors.radiusUnit  = 'Radius Unit is required when Geo Boundary Type is Radius.';
    if (!hasLat || !hasLon) {
      const msg = 'Latitude and Longitude are required when Geo Boundary Type is Radius.';
      if (!errors.latitude)  errors.latitude  = msg;
      if (!errors.longitude) errors.longitude = msg;
    }
  }

  if (area.geoBoundaryType === 'Polygon' && !area.polygonReference) {
    errors.polygonReference = 'Polygon Reference is required when Geo Boundary Type is Polygon.';
  }

  if (area.geoBoundaryType === 'Postal / Pin Code Based' && !area.postalCode) {
    errors.postalCode = 'Postal / Pin Code is required when Geo Boundary Type is Postal / Pin Code Based.';
  }

  if (area.geoBoundaryType === 'External Map Reference') {
    if (!area.mapProvider)       errors.mapProvider       = 'Map Provider is required when Geo Boundary Type is External Map Reference.';
    if (!area.externalBoundaryId) errors.externalBoundaryId = 'External Boundary ID is required when Geo Boundary Type is External Map Reference.';
  }

  return errors;
}

