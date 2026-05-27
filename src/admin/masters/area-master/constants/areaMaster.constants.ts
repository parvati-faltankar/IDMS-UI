// ─── Area Master — Constants ──────────────────────────────────────────────────

import type { AreaLevelRole, AreaLevelStatus, AreaStatus, UsageTag, GeoBoundaryType, AliasType } from '../types/areaMaster.types';

export const AREA_LEVEL_ROLES: AreaLevelRole[] = [
  'Structural',
  'Operational',
  'Structural + Operational',
  'Reporting Only',
  'Geo Only',
];

export const AREA_LEVEL_STATUSES: AreaLevelStatus[] = ['Draft', 'Active', 'Inactive'];

export const AREA_STATUSES: AreaStatus[] = ['Draft', 'Active', 'Inactive'];

export const USAGE_TAGS: UsageTag[] = [
  'Geographic',
  'Sales',
  'Service',
  'Delivery',
  'Collection',
  'Reporting',
  'Access Control',
  'Beat / Route',
  'Dealer / Distributor Territory',
  'Geo Boundary',
  'Postal / Pin Code',
];

export const GEO_BOUNDARY_TYPES: GeoBoundaryType[] = [
  'Not Applicable',
  'Radius',
  'Polygon',
  'Postal / Pin Code Based',
  'External Map Reference',
];

export const AREA_CATEGORIES: string[] = [
  'Urban',
  'Rural',
  'Semi-Urban',
  'Metro',
  'Tier 1',
  'Tier 2',
  'Industrial',
  'Residential',
  'Commercial',
  'Mixed',
];

export const AREA_CLASSIFICATIONS: string[] = [
  'High Potential',
  'Priority Market',
  'Low Coverage',
  'Restricted',
  'Emerging',
  'Focus Area',
];

export const ALIAS_TYPES: AliasType[] = [
  'Old Name',
  'Local Name',
  'Abbreviation',
  'Migration Name',
  'Alternate Spelling',
  'External Name',
];

export const RADIUS_UNITS: string[] = ['KM', 'Miles'];

export const MAP_PROVIDERS: string[] = [
  'Google Maps',
  'Mapbox',
  'OpenStreetMap',
  'Other',
];

export const ALIAS_STATUSES: AreaStatus[] = ['Active', 'Inactive'];
