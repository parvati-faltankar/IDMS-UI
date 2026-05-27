// ─── Area Master — TypeScript Types ──────────────────────────────────────────

export type AreaLevelRole =
  | 'Structural'
  | 'Operational'
  | 'Structural + Operational'
  | 'Reporting Only'
  | 'Geo Only';

export type AreaLevelStatus = 'Draft' | 'Active' | 'Inactive';

export type AreaStatus = 'Draft' | 'Active' | 'Inactive';

export type UsageTag =
  | 'Geographic'
  | 'Sales'
  | 'Service'
  | 'Delivery'
  | 'Collection'
  | 'Reporting'
  | 'Access Control'
  | 'Beat / Route'
  | 'Dealer / Distributor Territory'
  | 'Geo Boundary'
  | 'Postal / Pin Code';

export type GeoBoundaryType =
  | 'Not Applicable'
  | 'Radius'
  | 'Polygon'
  | 'Postal / Pin Code Based'
  | 'External Map Reference';

export type AliasType =
  | 'Old Name'
  | 'Local Name'
  | 'Abbreviation'
  | 'Migration Name'
  | 'Alternate Spelling'
  | 'External Name';

// ─── Area Level ───────────────────────────────────────────────────────────────

export interface AreaLevel {
  id: string;
  areaLevelCode: string;
  areaLevelName: string;
  displayName: string;
  shortCode: string;
  levelSequence: number;
  areaLevelRole: AreaLevelRole;
  parentRequired: boolean;
  allowedParentLevelIds: string[];
  allowedUsageTags: UsageTag[];
  defaultUsageTags: UsageTag[];
  mandatoryUsageTags: UsageTag[];
  status: AreaLevelStatus;
  description: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Area Alias ───────────────────────────────────────────────────────────────

export interface AreaAlias {
  id: string;
  aliasName: string;
  aliasType: AliasType;
  languageLocale: string;
  isSearchable: boolean;
  status: AreaStatus;
}

// ─── Area ─────────────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  areaCode: string;
  areaName: string;
  displayName: string;
  externalLegacyCode: string;
  areaLevelId: string;
  parentAreaId: string | null;
  hierarchyPath: string;
  usageTags: UsageTag[];
  areaCategory: string;
  areaClassification: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  geoBoundaryType: GeoBoundaryType;
  radiusValue: number | null;
  radiusUnit: string;
  polygonReference: string;
  mapProvider: string;
  externalBoundaryId: string;
  aliases: AreaAlias[];
  status: AreaStatus;
  description: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}
