// ─── Area Dashboard Utility Functions ────────────────────────────────────────

import type { Area, AreaLevel } from '../types/areaMaster.types';
import { isValidLatitude, isValidLongitude } from './geoValidation';
import { findHierarchyExceptions, getMaxHierarchyDepth, findOrphanAreas } from './hierarchyTreeUtils';

// ─── Area Level counts ─────────────────────────────────────────────────────────

export interface AreaLevelCounts {
  total: number;
  active: number;
  draft: number;
  inactive: number;
}

export function getAreaLevelCounts(areaLevels: AreaLevel[]): AreaLevelCounts {
  return {
    total:    areaLevels.length,
    active:   areaLevels.filter((l) => l.status === 'Active').length,
    draft:    areaLevels.filter((l) => l.status === 'Draft').length,
    inactive: areaLevels.filter((l) => l.status === 'Inactive').length,
  };
}

// ─── Area counts ───────────────────────────────────────────────────────────────

export interface AreaCounts {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  rootAreas: number;
}

export function getAreaCounts(areas: Area[]): AreaCounts {
  return {
    total:     areas.length,
    active:    areas.filter((a) => a.status === 'Active').length,
    draft:     areas.filter((a) => a.status === 'Draft').length,
    inactive:  areas.filter((a) => a.status === 'Inactive').length,
    rootAreas: areas.filter((a) => !a.parentAreaId).length,
  };
}

// ─── Areas missing required parent ────────────────────────────────────────────

/** Returns areas where the Area Level requires a parent but no parent is assigned. */
export function getAreasMissingParent(areas: Area[], areaLevels: AreaLevel[]): Area[] {
  const levelMap = new Map(areaLevels.map((l) => [l.id, l]));
  return areas.filter((a) => {
    const level = levelMap.get(a.areaLevelId);
    return level?.parentRequired === true && !a.parentAreaId;
  });
}

// ─── Areas missing usage tags ──────────────────────────────────────────────────

export function getAreasMissingUsageTags(areas: Area[]): Area[] {
  return areas.filter((a) => a.usageTags.length === 0);
}

// ─── Areas missing geo coordinates ────────────────────────────────────────────

export function getAreasMissingGeoCoordinates(areas: Area[]): Area[] {
  return areas.filter((a) => a.latitude === null || a.longitude === null);
}

// ─── Areas with invalid geo data ──────────────────────────────────────────────

/** Returns areas with out-of-range lat/lon, or with only one coordinate entered. */
export function getAreasWithInvalidGeoData(areas: Area[]): Area[] {
  return areas.filter((a) => {
    const hasLat = a.latitude !== null;
    const hasLon = a.longitude !== null;
    if (hasLat !== hasLon) return true; // partial entry
    if (hasLat && !isValidLatitude(a.latitude!))   return true;
    if (hasLon && !isValidLongitude(a.longitude!)) return true;
    return false;
  });
}

// ─── Hierarchy exceptions (re-exported for dashboard convenience) ──────────────

export { findHierarchyExceptions as getHierarchyExceptions } from './hierarchyTreeUtils';

// ─── Usage exceptions ──────────────────────────────────────────────────────────

export type UsageIssue = 'No Tags' | 'Invalid Tag' | 'Missing Mandatory Tag';

export interface UsageException {
  area: Area;
  issue: UsageIssue;
  tag?: string;
}

export function getUsageExceptions(areas: Area[], areaLevels: AreaLevel[]): UsageException[] {
  const levelMap = new Map(areaLevels.map((l) => [l.id, l]));
  const result: UsageException[] = [];

  for (const area of areas) {
    if (area.usageTags.length === 0) {
      result.push({ area, issue: 'No Tags' });
      continue;
    }
    const level = levelMap.get(area.areaLevelId);
    if (!level) continue;

    // Tags not in the allowed list
    if (level.allowedUsageTags.length > 0) {
      for (const tag of area.usageTags) {
        if (!level.allowedUsageTags.includes(tag)) {
          result.push({ area, issue: 'Invalid Tag', tag });
        }
      }
    }

    // Missing mandatory tags
    for (const mandatoryTag of level.mandatoryUsageTags) {
      if (!area.usageTags.includes(mandatoryTag)) {
        result.push({ area, issue: 'Missing Mandatory Tag', tag: mandatoryTag });
      }
    }
  }

  return result;
}

// ─── Duplicate area risks ──────────────────────────────────────────────────────

export interface DuplicateGroup {
  areaName: string;
  areaLevelId: string;
  parentAreaId: string | null;
  count: number;
}

/** Detects areas sharing the same name + Area Level + Parent combination. */
export function getDuplicateAreaRisks(areas: Area[]): DuplicateGroup[] {
  const groups = new Map<string, Area[]>();
  for (const area of areas) {
    const key = `${area.areaName.trim().toLowerCase()}|${area.areaLevelId}|${area.parentAreaId ?? ''}`;
    const current = groups.get(key);
    if (current) current.push(area);
    else groups.set(key, [area]);
  }
  const result: DuplicateGroup[] = [];
  groups.forEach((list) => {
    if (list.length > 1) {
      result.push({
        areaName:     list[0].areaName,
        areaLevelId:  list[0].areaLevelId,
        parentAreaId: list[0].parentAreaId,
        count:        list.length,
      });
    }
  });
  return result;
}

// ─── Readiness calculation ─────────────────────────────────────────────────────

export type ReadinessStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Ready with Warnings'
  | 'Ready';

export interface ReadinessResult {
  status: ReadinessStatus;
  progressPercentage: number;
  criticalCount: number;
  warningCount: number;
  message: string;
}

export function calculateAreaReadinessStatus(
  areas: Area[],
  areaLevels: AreaLevel[],
): ReadinessResult {
  const hasAnyLevel    = areaLevels.length > 0;
  const hasAnyArea     = areas.length > 0;
  const hasActiveLevel = areaLevels.some((l) => l.status === 'Active');
  const hasActiveArea  = areas.some((a) => a.status === 'Active');

  if (!hasAnyLevel && !hasAnyArea) {
    return {
      status: 'Not Started', progressPercentage: 0, criticalCount: 0, warningCount: 0,
      message: 'No Area Levels or Areas have been configured yet.',
    };
  }

  if (!hasActiveLevel || !hasActiveArea) {
    return {
      status: 'In Progress', progressPercentage: 35, criticalCount: 0, warningCount: 0,
      message: 'Setup has started but no Active Area Level or Active Area is available yet.',
    };
  }

  // Critical issues — evaluated against active areas for operational readiness
  const activeAreas    = areas.filter((a) => a.status === 'Active');
  const hierarchyExc   = findHierarchyExceptions(activeAreas, areaLevels);
  const missingParent  = getAreasMissingParent(activeAreas, areaLevels);
  const usageExc       = getUsageExceptions(activeAreas, areaLevels)
    .filter((e) => e.issue === 'Invalid Tag' || e.issue === 'Missing Mandatory Tag');
  const dupes          = getDuplicateAreaRisks(areas);
  const invalidGeo     = getAreasWithInvalidGeoData(activeAreas);

  const criticalCount =
    hierarchyExc.length +
    missingParent.length +
    new Set(usageExc.map((e) => e.area.id)).size +
    dupes.length +
    invalidGeo.length;

  if (criticalCount > 0) {
    return {
      status: 'Blocked', progressPercentage: 50, criticalCount, warningCount: 0,
      message: `${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''} must be resolved before the Area setup is considered ready.`,
    };
  }

  // Warnings
  const draftLevels    = areaLevels.filter((l) => l.status === 'Draft').length;
  const draftAreas     = areas.filter((a) => a.status === 'Draft').length;
  const inactiveLevels = areaLevels.filter((l) => l.status === 'Inactive').length;
  const inactiveAreas  = areas.filter((a) => a.status === 'Inactive').length;
  const missingGeo     = getAreasMissingGeoCoordinates(areas).length;
  const missingPostal  = areas.filter((a) => !a.postalCode).length;
  const missingAlias   = areas.filter((a) => a.aliases.length === 0).length;
  const notApplicable  = areas.filter((a) => a.geoBoundaryType === 'Not Applicable').length;

  const warnFlags = [
    draftLevels > 0,
    draftAreas > 0,
    inactiveLevels > 0,
    inactiveAreas > 0,
    missingGeo > 0,
    missingPostal > 0,
    missingAlias > 0,
    notApplicable > 0,
  ];
  const warningCount = warnFlags.filter(Boolean).length;

  if (warningCount > 0) {
    return {
      status: 'Ready with Warnings', progressPercentage: 75, criticalCount: 0, warningCount,
      message: `Active setup looks good. ${warningCount} warning${warningCount !== 1 ? 's' : ''} should be reviewed.`,
    };
  }

  return {
    status: 'Ready', progressPercentage: 100, criticalCount: 0, warningCount: 0,
    message: 'Area Master setup is complete and ready.',
  };
}

// ─── Setup Checklist ───────────────────────────────────────────────────────────

export type ChecklistStatus = 'Completed' | 'Pending' | 'Warning' | 'Blocked';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  actionLabel?: string;
  actionPath?: string;
}

export function buildSetupChecklist(areas: Area[], areaLevels: AreaLevel[]): ChecklistItem[] {
  const hasAnyLevel    = areaLevels.length > 0;
  const hasActiveLevel = areaLevels.some((l) => l.status === 'Active');
  const hasAnyArea     = areas.length > 0;
  const hasActiveArea  = areas.some((a) => a.status === 'Active');

  const levelsNeedingParent = areaLevels.filter((l) => l.parentRequired);
  const parentRulesOk = levelsNeedingParent.length === 0 ||
    levelsNeedingParent.every((l) => l.allowedParentLevelIds.length > 0);

  const activeLevels = areaLevels.filter((l) => l.status === 'Active');
  const usageApplicabilityOk = activeLevels.length === 0 ||
    activeLevels.every((l) => l.allowedUsageTags.length > 0);

  const hierarchyExc     = findHierarchyExceptions(areas, areaLevels);
  const hierarchyCritical = hierarchyExc.some((e) => e.area.status === 'Active');

  const usageExc      = getUsageExceptions(areas, areaLevels);
  const usageCritical = usageExc.some(
    (e) => e.area.status === 'Active' && (e.issue === 'Invalid Tag' || e.issue === 'Missing Mandatory Tag'),
  );

  const missingGeoCount = getAreasMissingGeoCoordinates(areas).length;

  return [
    {
      id: 'level-created',
      label: 'Area Level Configuration created',
      description: 'At least one Area Level record must exist.',
      status: hasAnyLevel ? 'Completed' : 'Pending',
      actionLabel: hasAnyLevel ? undefined : 'Add Area Level',
      actionPath:  hasAnyLevel ? undefined : '/admin/area-levels/new',
    },
    {
      id: 'level-active',
      label: 'Active Area Levels available',
      description: 'At least one Area Level must have Active status.',
      status: hasActiveLevel ? 'Completed' : hasAnyLevel ? 'Blocked' : 'Pending',
      actionLabel: hasActiveLevel ? undefined : 'Open Area Levels',
      actionPath:  hasActiveLevel ? undefined : '/admin/area-levels',
    },
    {
      id: 'parent-rules',
      label: 'Parent rules configured',
      description: 'Area Levels requiring a parent must have allowed parent levels defined.',
      status: parentRulesOk ? 'Completed' : 'Warning',
      actionLabel: parentRulesOk ? undefined : 'Review Area Levels',
      actionPath:  parentRulesOk ? undefined : '/admin/area-levels',
    },
    {
      id: 'usage-configured',
      label: 'Usage applicability configured',
      description: 'Active Area Levels should have allowed usage tags defined.',
      status: !hasActiveLevel ? 'Pending' : usageApplicabilityOk ? 'Completed' : 'Warning',
      actionLabel: usageApplicabilityOk ? undefined : 'Review Area Levels',
      actionPath:  usageApplicabilityOk ? undefined : '/admin/area-levels',
    },
    {
      id: 'areas-created',
      label: 'Area Master records created',
      description: 'At least one Area record must exist.',
      status: hasAnyArea ? 'Completed' : 'Pending',
      actionLabel: hasAnyArea ? undefined : 'Add Area',
      actionPath:  hasAnyArea ? undefined : '/admin/areas/new',
    },
    {
      id: 'areas-active',
      label: 'Active Area records available',
      description: 'At least one Area must have Active status.',
      status: hasActiveArea ? 'Completed' : hasAnyArea ? 'Blocked' : 'Pending',
      actionLabel: hasActiveArea ? undefined : 'Open Areas',
      actionPath:  hasActiveArea ? undefined : '/admin/areas',
    },
    {
      id: 'hierarchy-valid',
      label: 'Hierarchy is valid',
      description: 'No critical hierarchy issues such as missing parent, circular reference, or invalid level combination.',
      status: !hasAnyArea ? 'Pending' : hierarchyCritical ? 'Blocked' : 'Completed',
      actionLabel: hierarchyCritical ? 'View Hierarchy Tree' : undefined,
      actionPath:  hierarchyCritical ? '/admin/area-tree' : undefined,
    },
    {
      id: 'usage-valid',
      label: 'Usage tags valid',
      description: 'No area uses invalid usage tags or is missing mandatory usage tags.',
      status: !hasAnyArea ? 'Pending' : usageCritical ? 'Blocked' : 'Completed',
      actionLabel: usageCritical ? 'Review Areas' : undefined,
      actionPath:  usageCritical ? '/admin/areas' : undefined,
    },
    {
      id: 'geo-reviewed',
      label: 'Geo data reviewed',
      description: 'Areas with a Geo Boundary Type configured should have valid coordinates.',
      status: !hasAnyArea ? 'Pending' : missingGeoCount > 0 ? 'Warning' : 'Completed',
      actionLabel: missingGeoCount > 0 ? 'Review Areas' : undefined,
      actionPath:  missingGeoCount > 0 ? '/admin/areas' : undefined,
    },
    {
      id: 'tree-reviewed',
      label: 'Tree view reviewed',
      description: 'Review the hierarchy tree to confirm the structure looks correct.',
      status: !hasAnyArea ? 'Pending' : 'Completed',
      actionLabel: 'Open Hierarchy Tree',
      actionPath:  '/admin/area-tree',
    },
  ];
}

// ─── Exception Summary Builder ─────────────────────────────────────────────────

export type ExceptionSeverity = 'Critical' | 'Warning' | 'Info';

export interface ExceptionItem {
  severity: ExceptionSeverity;
  issueType: string;
  count: number;
  description: string;
  actionLabel: string;
  actionPath: string;
}

function uniqueAreaCount<T extends { area: Area }>(items: T[]): number {
  return new Set(items.map((i) => i.area.id)).size;
}

export function buildExceptionSummary(areas: Area[], areaLevels: AreaLevel[]): ExceptionItem[] {
  if (areas.length === 0 && areaLevels.length === 0) return [];

  const activeAreas    = areas.filter((a) => a.status === 'Active');
  const hierarchyExc   = findHierarchyExceptions(areas, areaLevels);
  const missingParent  = getAreasMissingParent(activeAreas, areaLevels);
  const usageExc       = getUsageExceptions(activeAreas, areaLevels);
  const dupes          = getDuplicateAreaRisks(areas);
  const invalidGeo     = getAreasWithInvalidGeoData(activeAreas);

  const draftLevels    = areaLevels.filter((l) => l.status === 'Draft').length;
  const draftAreas     = areas.filter((a) => a.status === 'Draft').length;
  const inactiveLevels = areaLevels.filter((l) => l.status === 'Inactive').length;
  const inactiveAreas  = areas.filter((a) => a.status === 'Inactive').length;
  const missingGeo     = getAreasMissingGeoCoordinates(areas).length;
  const missingPostal  = areas.filter((a) => !a.postalCode).length;
  const missingAlias   = areas.filter((a) => a.aliases.length === 0).length;
  const noAppGeo       = areas.filter((a) => a.geoBoundaryType === 'Not Applicable').length;
  const orphans        = findOrphanAreas(areas).length;

  const roots          = areas.filter((a) => !a.parentAreaId).length;
  const maxDepth       = getMaxHierarchyDepth(areas);
  const categories     = new Set(areas.map((a) => a.areaCategory).filter(Boolean)).size;
  const classifications = new Set(areas.map((a) => a.areaClassification).filter(Boolean)).size;

  const invalidTagAreaCount      = uniqueAreaCount(usageExc.filter((e) => e.issue === 'Invalid Tag'));
  const missingMandatoryAreaCount = uniqueAreaCount(usageExc.filter((e) => e.issue === 'Missing Mandatory Tag'));

  const items: ExceptionItem[] = [];

  // ─── Critical ─────────────────────────────────────────────────────────────────

  if (hierarchyExc.length > 0) {
    items.push({
      severity: 'Critical', issueType: 'Hierarchy Exceptions', count: hierarchyExc.length,
      description: 'Active areas with missing parent, inactive parent, circular reference, or invalid level combination.',
      actionLabel: 'View Tree', actionPath: '/admin/area-tree',
    });
  }
  if (missingParent.length > 0) {
    items.push({
      severity: 'Critical', issueType: 'Missing Required Parent', count: missingParent.length,
      description: 'Active areas where the Area Level requires a parent but no parent is assigned.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (invalidTagAreaCount > 0) {
    items.push({
      severity: 'Critical', issueType: 'Invalid Usage Tags', count: invalidTagAreaCount,
      description: 'Active areas with usage tags not permitted by their Area Level.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (missingMandatoryAreaCount > 0) {
    items.push({
      severity: 'Critical', issueType: 'Missing Mandatory Tags', count: missingMandatoryAreaCount,
      description: 'Active areas missing one or more mandatory usage tags from their Area Level.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (dupes.length > 0) {
    items.push({
      severity: 'Critical', issueType: 'Duplicate Area Risk', count: dupes.length,
      description: 'Multiple areas share the same name, Area Level, and parent combination.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (invalidGeo.length > 0) {
    items.push({
      severity: 'Critical', issueType: 'Invalid Geo Coordinates', count: invalidGeo.length,
      description: 'Active areas with out-of-range or partially entered latitude/longitude values.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }

  // ─── Warnings ─────────────────────────────────────────────────────────────────

  if (draftLevels > 0) {
    items.push({
      severity: 'Warning', issueType: 'Draft Area Levels', count: draftLevels,
      description: 'Area Levels in Draft status have not been activated yet.',
      actionLabel: 'Open Levels', actionPath: '/admin/area-levels',
    });
  }
  if (draftAreas > 0) {
    items.push({
      severity: 'Warning', issueType: 'Draft Areas', count: draftAreas,
      description: 'Areas in Draft status have not been activated yet.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (inactiveLevels > 0) {
    items.push({
      severity: 'Warning', issueType: 'Inactive Area Levels', count: inactiveLevels,
      description: 'Area Level records that have been deactivated.',
      actionLabel: 'Open Levels', actionPath: '/admin/area-levels',
    });
  }
  if (inactiveAreas > 0) {
    items.push({
      severity: 'Warning', issueType: 'Inactive Areas', count: inactiveAreas,
      description: 'Area records that have been deactivated.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (missingGeo > 0) {
    items.push({
      severity: 'Warning', issueType: 'Missing Geo Coordinates', count: missingGeo,
      description: 'Areas with no latitude or longitude recorded.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (missingPostal > 0) {
    items.push({
      severity: 'Warning', issueType: 'Missing Postal Code', count: missingPostal,
      description: 'Areas without a postal/pin code configured.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (missingAlias > 0) {
    items.push({
      severity: 'Warning', issueType: 'No Aliases Configured', count: missingAlias,
      description: 'Areas with no alternate names or aliases registered.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (noAppGeo > 0) {
    items.push({
      severity: 'Warning', issueType: 'Geo Boundary: Not Applicable', count: noAppGeo,
      description: 'Areas with Geo Boundary Type set to Not Applicable — may need review.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (orphans > 0) {
    items.push({
      severity: 'Warning', issueType: 'Orphan Areas', count: orphans,
      description: 'Areas referencing a parent area that no longer exists.',
      actionLabel: 'View Tree', actionPath: '/admin/area-tree',
    });
  }

  // ─── Informational ────────────────────────────────────────────────────────────

  items.push({
    severity: 'Info', issueType: 'Root Areas', count: roots,
    description: 'Areas at the top level with no parent configured.',
    actionLabel: 'View Tree', actionPath: '/admin/area-tree',
  });

  if (maxDepth > 0) {
    items.push({
      severity: 'Info', issueType: 'Maximum Hierarchy Depth', count: maxDepth,
      description: 'Deepest nesting level across all configured areas.',
      actionLabel: 'View Tree', actionPath: '/admin/area-tree',
    });
  }
  if (categories > 0) {
    items.push({
      severity: 'Info', issueType: 'Area Categories Used', count: categories,
      description: 'Distinct area category values across all area records.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }
  if (classifications > 0) {
    items.push({
      severity: 'Info', issueType: 'Area Classifications Used', count: classifications,
      description: 'Distinct area classification values across all area records.',
      actionLabel: 'Open Areas', actionPath: '/admin/areas',
    });
  }

  return items;
}
