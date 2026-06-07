// ─── Warehouse Master — Hierarchy Utilities ──────────────────────────────────

import type { HierarchyLevel, HierarchyNode, HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';

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
