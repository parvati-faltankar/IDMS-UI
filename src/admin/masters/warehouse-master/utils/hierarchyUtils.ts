// ─── Warehouse Master — Hierarchy Utilities ──────────────────────────────────

import type { HierarchyLevel, HierarchyNode, HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';
import type { LocationType } from '../types/warehouse.enums';

export const WAREHOUSE_ROOT_LEVEL_CODE = 'WAREHOUSE';

// ─── Build full location code ─────────────────────────────────────────────────

/**
 * Builds the full path code for a location by walking the parent chain.
 * e.g. "WH01-Z01-A01-R01-S02-B003"
 */
export function buildFullLocationCode(
  locationId: string,
  allLocations: WarehouseLocation[],
): string {
  const location = allLocations.find((l) => l.id === locationId);
  if (!location) return '';

  const codes: string[] = [location.locationCode];
  let parentId = location.parentLocationId;

  while (parentId) {
    const parent = allLocations.find((l) => l.id === parentId);
    if (!parent) break;
    codes.unshift(parent.locationCode);
    parentId = parent.parentLocationId;
  }

  return codes.join('-');
}

// ─── Build hierarchy tree ─────────────────────────────────────────────────────

/**
 * Builds a HierarchyNode tree from flat WarehouseLocation list.
 * Roots are locations with no parentLocationId.
 */
export function buildHierarchyTree(
  locations: WarehouseLocation[],
  template?: HierarchyTemplate,
): HierarchyNode[] {
  const nodeMap = new Map<string, HierarchyNode>();

  // First pass: build all nodes
  for (const loc of locations) {
    const isLeaf = !locations.some((l) => l.parentLocationId === loc.id);
    const levelCode = loc.profile.level;
    const level = template?.levels.find((lv) => lv.sequence === levelCode);

    nodeMap.set(loc.id, {
      id: loc.id,
      locationId: loc.id,
      locationCode: loc.locationCode,
      locationName: loc.locationName,
      levelCode: level?.levelCode ?? String(levelCode),
      levelName: level?.levelName ?? `Level ${levelCode}`,
      parentId: loc.parentLocationId,
      children: [],
      isLeaf,
      inventoryAllowed: loc.profile.inventoryAllowed,
      status: loc.status,
      fullCode: loc.profile.fullCode,
    });
  }

  const roots: HierarchyNode[] = [];

  // Second pass: attach children to parents
  for (const [id, node] of nodeMap) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        // HierarchyNode children is readonly, so we cast to mutable for building
        (parent.children as HierarchyNode[]).push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── Validate hierarchy level tree ────────────────────────────────────────────

/**
 * Validates the list of levels in a hierarchy template.
 * Returns an array of ValidationIssues (empty = valid).
 */
export function validateTemplateLevelTree(levels: HierarchyLevel[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (levels.length === 0) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'FieldRequired',
      message: 'At least one hierarchy level is required.',
    });
    return issues;
  }

  // Check sequence uniqueness
  const sequences = levels.map((l) => l.sequence);
  const uniqueSequences = new Set(sequences);
  if (uniqueSequences.size !== sequences.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Hierarchy level sequence numbers must be unique.',
    });
  }

  // Check level code uniqueness
  const codes = levels.map((l) => l.levelCode);
  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'DuplicateCode',
      message: 'Hierarchy level codes must be unique.',
    });
  }

  // At least one leaf-eligible level
  const hasLeafEligible = levels.some((l) => l.leafEligible);
  if (!hasLeafEligible) {
    issues.push({
      section: 'hierarchyTemplate',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'At least one level must be marked as Leaf Eligible.',
    });
  }

  // Sorted: check skip level consistency
  const sorted = [...levels].sort((a, b) => a.sequence - b.sequence);
  for (let i = 0; i < sorted.length; i++) {
    const level = sorted[i];

    // allowSkipLevel only valid when there is a level below
    if (level.allowSkipLevel && i === sorted.length - 1) {
      issues.push({
        field: `levels[${i}].allowSkipLevel`,
        section: 'hierarchyTemplate',
        severity: 'warning',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" is the last level — Allow Skip Level has no effect.`,
      });
    }

    // Mandatory + allowSkipLevel = contradictory
    if (level.mandatory && level.allowSkipLevel) {
      issues.push({
        field: `levels[${i}].mandatory`,
        section: 'hierarchyTemplate',
        severity: 'error',
        category: 'PolicyConflict',
        message: `Level "${level.levelCode}" cannot be both Mandatory and Allow Skip Level.`,
      });
    }
  }

  return issues;
}

// ─── Detect circular hierarchy ────────────────────────────────────────────────

/**
 * Returns true when assigning parentId to locationId would create a cycle.
 */
export function isCircularHierarchy(
  locationId: string,
  proposedParentId: string | undefined,
  allLocations: WarehouseLocation[],
): boolean {
  if (!proposedParentId) return false;
  if (proposedParentId === locationId) return true;

  let currentId: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const parent = allLocations.find((l) => l.id === currentId);
    if (!parent) break;
    if (parent.parentLocationId === locationId) return true;
    currentId = parent.parentLocationId;
  }

  return false;
}

// ─── Compute location level number ───────────────────────────────────────────

/**
 * Computes the depth level of a location (1 = root).
 */
export function computeLocationLevel(
  locationId: string,
  allLocations: WarehouseLocation[],
): number {
  let level = 1;
  let parentId = allLocations.find((l) => l.id === locationId)?.parentLocationId;

  while (parentId) {
    level++;
    parentId = allLocations.find((l) => l.id === parentId)?.parentLocationId;
    if (level > 20) break; // safety guard against circular data
  }

  return level;
}

// ─── Check flexible path validity ────────────────────────────────────────────

/**
 * When flexible paths are disabled, all hierarchy paths must be the same depth.
 * Returns validation issues when paths have inconsistent depths.
 */
export function validateHierarchyDepthConsistency(
  locations: WarehouseLocation[],
  template: HierarchyTemplate,
): ValidationIssue[] {
  if (template.flexiblePathEnabled) return [];

  const leaves = locations.filter((l) => l.profile.isLeafEndpoint);
  if (leaves.length === 0) return [];

  const depths = new Set(leaves.map((l) => l.profile.level));
  if (depths.size <= 1) return [];

  return [
    {
      section: 'hierarchyTemplate',
      severity: 'warning',
      category: 'PolicyConflict',
      message: `Flexible paths are disabled but leaf locations exist at different depths (${[...depths].join(', ')}). Enable Flexible Paths or adjust the hierarchy.`,
    },
  ];
}

export function buildFullLocationCodeFromParent(
  warehouseCode: string,
  locationCode: string,
  parentLocationId: string | undefined,
  allLocations: WarehouseLocation[],
): string {
  const locationSegment = locationCode.trim().toUpperCase();
  if (!parentLocationId) {
    return [warehouseCode, locationSegment].filter(Boolean).join('-');
  }

  const parent = allLocations.find((item) => item.id === parentLocationId);
  if (!parent) {
    return [warehouseCode, locationSegment].filter(Boolean).join('-');
  }

  return [parent.profile.fullCode, locationSegment].filter(Boolean).join('-');
}

const DEFAULT_LOCATION_TYPE_ORDER: LocationType[] = [
  'Zone',
  'Aisle',
  'Rack',
  'Shelf',
  'BIN',
];

function normalizeLevelName(levelName: string): LocationType | null {
  const normal = levelName.trim().toUpperCase();
  if (normal === 'ZONE') return 'Zone';
  if (normal === 'AISLE') return 'Aisle';
  if (normal === 'RACK') return 'Rack';
  if (normal === 'SHELF') return 'Shelf';
  if (normal === 'BIN') return 'BIN';
  if (normal === 'DOCK') return 'Dock';
  if (normal === 'STAGING') return 'Staging';
  if (normal === 'QC') return 'QC';
  if (normal === 'SCRAP') return 'Scrap';
  if (normal === 'VIRTUAL') return 'Virtual';
  if (normal === 'GENERAL') return 'General';
  return null;
}

export function getTemplateLevelForLocation(
  location: WarehouseLocation | null,
  template?: HierarchyTemplate,
): HierarchyLevel | undefined {
  if (!location || !template) return undefined;
  return template.levels.find(
    (level) =>
      level.sequence === location.profile.level ||
      level.levelCode.toUpperCase() === location.profile.locationType.toUpperCase(),
  );
}

export function getAllowedChildTemplateLevels(
  parent: WarehouseLocation | null,
  template?: HierarchyTemplate,
): HierarchyLevel[] {
  if (!template) return [];

  const parentLevelCode = parent
    ? getTemplateLevelForLocation(parent, template)?.levelCode ?? parent.profile.locationType.toUpperCase()
    : WAREHOUSE_ROOT_LEVEL_CODE;

  const explicitMatches = template.levels
    .filter((level) => (level.allowedParentLevels ?? []).map((code) => code.toUpperCase()).includes(parentLevelCode.toUpperCase()))
    .sort((left, right) => left.sequence - right.sequence);

  if (explicitMatches.length > 0) return explicitMatches;

  if (!parent) {
    const rootLevels = template.levels.filter((level) => level.sequence === 1);
    return rootLevels.sort((left, right) => left.sequence - right.sequence);
  }

  const parentLevel = getTemplateLevelForLocation(parent, template);
  if (!parentLevel) return [];

  if (!template.flexiblePathEnabled) {
    const nextLevel = template.levels.find((level) => level.sequence === parentLevel.sequence + 1);
    return nextLevel ? [nextLevel] : [];
  }

  const sortedLevels = [...template.levels].sort((left, right) => left.sequence - right.sequence);
  return sortedLevels.filter((candidate) => {
    if (candidate.sequence <= parentLevel.sequence) return false;
    const betweenLevels = sortedLevels.filter(
      (level) => level.sequence > parentLevel.sequence && level.sequence < candidate.sequence,
    );
    return betweenLevels.every((level) => level.allowSkipLevel || !level.mandatory);
  });
}

export function explainChildLevelAllowance(
  parent: WarehouseLocation | null,
  childLevelCode: string,
  template?: HierarchyTemplate,
): { allowed: boolean; reason: string } {
  if (!template) {
    return { allowed: false, reason: 'No active hierarchy template is available.' };
  }

  const childLevel = template.levels.find(
    (level) => level.levelCode.toUpperCase() === childLevelCode.toUpperCase(),
  );
  if (!childLevel) {
    return { allowed: false, reason: `Level ${childLevelCode} is not part of the active template.` };
  }

  const allowedLevels = getAllowedChildTemplateLevels(parent, template);
  const match = allowedLevels.find((level) => level.levelCode === childLevel.levelCode);
  if (match) {
    const parentLabel = parent ? parent.locationCode : 'warehouse root';
    return {
      allowed: true,
      reason: `${match.levelName} is allowed under ${parentLabel} by the active template path rules.`,
    };
  }

  const parentLevelCode = parent
    ? getTemplateLevelForLocation(parent, template)?.levelCode ?? parent.profile.locationType.toUpperCase()
    : WAREHOUSE_ROOT_LEVEL_CODE;
  const explicitParents = childLevel.allowedParentLevels?.length
    ? childLevel.allowedParentLevels.join(', ')
    : 'the next valid template level';
  return {
    allowed: false,
    reason: `${childLevel.levelName} is not allowed under ${parentLevelCode}. Allowed parent level(s): ${explicitParents}.`,
  };
}

export function getAllowedChildLocationTypes(
  parent: WarehouseLocation | null,
  template?: HierarchyTemplate,
): LocationType[] {
  if (template) {
    return getAllowedChildTemplateLevels(parent, template).map((level) =>
      normalizeLevelName(level.levelCode) ?? normalizeLevelName(level.levelName) ?? 'General',
    );
  }

  if (!parent) return [DEFAULT_LOCATION_TYPE_ORDER[0]];
  const nextIndex = DEFAULT_LOCATION_TYPE_ORDER.indexOf(parent.profile.locationType) + 1;
  return nextIndex > 0 && nextIndex < DEFAULT_LOCATION_TYPE_ORDER.length
    ? [DEFAULT_LOCATION_TYPE_ORDER[nextIndex]]
    : [];
}

export function isValidParentChildCombination(
  parent: WarehouseLocation | null,
  childType: LocationType,
  template?: HierarchyTemplate,
): boolean {
  const allowed = getAllowedChildLocationTypes(parent, template);
  return allowed.includes(childType);
}
