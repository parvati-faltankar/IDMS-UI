// ─── Area Hierarchy Tree Utilities ────────────────────────────────────────────

import type { Area, AreaLevel, UsageTag } from '../types/areaMaster.types';
import { isCircularHierarchy } from './hierarchyUtils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AreaTreeNode {
  area: Area;
  children: AreaTreeNode[];
  depth: number;
}

export type ExceptionType =
  | 'Missing Parent'
  | 'Inactive Parent'
  | 'Missing Area Level'
  | 'Inactive Area Level'
  | 'Circular Hierarchy'
  | 'Invalid Parent Level';

export interface HierarchyException {
  area: Area;
  exceptionType: ExceptionType;
  suggestedAction: string;
}

export interface TreeFilterOptions {
  search: string;
  levelId: string;
  status: string;
  usageTag: string;
}

// ─── Tree building ─────────────────────────────────────────────────────────────

/**
 * Converts a flat Area list into a parent-child tree.
 * Areas whose parentAreaId is absent from the list become root nodes.
 */
export function buildAreaTree(areas: Area[]): AreaTreeNode[] {
  const areaIds = new Set(areas.map((a) => a.id));

  function buildNode(area: Area, depth: number): AreaTreeNode {
    const children = areas
      .filter((a) => a.parentAreaId === area.id)
      .map((a) => buildNode(a, depth + 1));
    return { area, children, depth };
  }

  const roots = areas.filter((a) => !a.parentAreaId || !areaIds.has(a.parentAreaId));
  return roots.map((r) => buildNode(r, 0));
}

// ─── Flat-list queries ─────────────────────────────────────────────────────────

export function getRootAreas(areas: Area[]): Area[] {
  return areas.filter((a) => !a.parentAreaId);
}

export function getChildAreas(parentAreaId: string, areas: Area[]): Area[] {
  return areas.filter((a) => a.parentAreaId === parentAreaId);
}

export function getAreaDepth(areaId: string, areas: Area[]): number {
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  let depth = 0;
  let current = areaMap.get(areaId);
  const visited = new Set<string>();
  while (current?.parentAreaId) {
    if (visited.has(current.id)) break; // circular guard
    visited.add(current.id);
    depth++;
    current = areaMap.get(current.parentAreaId);
  }
  return depth;
}

export function getMaxHierarchyDepth(areas: Area[]): number {
  if (areas.length === 0) return 0;
  return Math.max(...areas.map((a) => getAreaDepth(a.id, areas)));
}

export function findOrphanAreas(areas: Area[]): Area[] {
  const areaIds = new Set(areas.map((a) => a.id));
  return areas.filter((a) => a.parentAreaId && !areaIds.has(a.parentAreaId));
}

// ─── Tree helpers ──────────────────────────────────────────────────────────────

/** Flattens a tree into a plain ordered array (pre-order traversal). */
export function flattenAreaTree(nodes: AreaTreeNode[]): Area[] {
  const result: Area[] = [];
  function walk(list: AreaTreeNode[]) {
    for (const node of list) {
      result.push(node.area);
      walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

/** Returns the IDs of all nodes in the tree (pre-order). Used for Expand All. */
export function getAllTreeNodeIds(nodes: AreaTreeNode[]): string[] {
  return flattenAreaTree(nodes).map((a) => a.id);
}

// ─── Tree filtering ────────────────────────────────────────────────────────────

function nodeDirectlyMatches(area: Area, opts: TreeFilterOptions): boolean {
  if (opts.levelId && area.areaLevelId !== opts.levelId) return false;
  if (opts.status && area.status !== opts.status) return false;
  if (opts.usageTag && !area.usageTags.includes(opts.usageTag as UsageTag)) return false;
  if (opts.search) {
    const q = opts.search.toLowerCase();
    const aliasHay = area.aliases
      .filter((al) => al.status === 'Active' && al.isSearchable)
      .map((al) => al.aliasName)
      .join(' ');
    const hay =
      `${area.areaCode} ${area.areaName} ${area.displayName} ${area.externalLegacyCode} ${area.hierarchyPath} ${aliasHay}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/**
 * Filters the tree recursively with parent-chain preservation.
 * A node is kept if it directly matches the filters, OR if any descendant matches.
 */
export function filterAreaTree(
  nodes: AreaTreeNode[],
  opts: TreeFilterOptions,
): AreaTreeNode[] {
  if (!opts.search && !opts.levelId && !opts.status && !opts.usageTag) return nodes;

  function filterNode(node: AreaTreeNode): AreaTreeNode | null {
    const filteredChildren = node.children.reduce<AreaTreeNode[]>((acc, child) => {
      const result = filterNode(child);
      if (result) acc.push(result);
      return acc;
    }, []);
    const selfMatches = nodeDirectlyMatches(node.area, opts);
    if (selfMatches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  return nodes.reduce<AreaTreeNode[]>((acc, node) => {
    const result = filterNode(node);
    if (result) acc.push(result);
    return acc;
  }, []);
}

// ─── Exception / anomaly detection ────────────────────────────────────────────

/**
 * Detects structural hierarchy anomalies across all area records.
 * Returns one entry per anomaly with type and suggested action.
 */
export function findHierarchyExceptions(
  areas: Area[],
  areaLevels: AreaLevel[],
): HierarchyException[] {
  const areaMap  = new Map(areas.map((a) => [a.id, a]));
  const levelMap = new Map(areaLevels.map((l) => [l.id, l]));
  const exceptions: HierarchyException[] = [];

  for (const area of areas) {
    // 1. Missing area level
    if (!area.areaLevelId || !levelMap.has(area.areaLevelId)) {
      exceptions.push({
        area,
        exceptionType: 'Missing Area Level',
        suggestedAction: 'Assign a valid active Area Level to this area.',
      });
      continue;
    }

    const level = levelMap.get(area.areaLevelId)!;

    // 2. Inactive area level but area is active
    if (level.status === 'Inactive' && area.status === 'Active') {
      exceptions.push({
        area,
        exceptionType: 'Inactive Area Level',
        suggestedAction: 'Reactivate the Area Level, or inactivate this area.',
      });
    }

    if (area.parentAreaId) {
      const parent = areaMap.get(area.parentAreaId);

      // 3. Missing parent
      if (!parent) {
        exceptions.push({
          area,
          exceptionType: 'Missing Parent',
          suggestedAction: 'Assign a valid parent area or clear the parent field.',
        });
        continue;
      }

      // 4. Inactive parent with active child
      if (parent.status === 'Inactive' && area.status === 'Active') {
        exceptions.push({
          area,
          exceptionType: 'Inactive Parent',
          suggestedAction: 'Reactivate the parent area, or inactivate this area.',
        });
      }

      // 5. Circular hierarchy
      if (isCircularHierarchy(area.id, area.parentAreaId, areas)) {
        exceptions.push({
          area,
          exceptionType: 'Circular Hierarchy',
          suggestedAction: 'Remove the circular parent reference from the Area form.',
        });
      }

      // 6. Invalid parent level
      if (
        level.allowedParentLevelIds.length > 0 &&
        !level.allowedParentLevelIds.includes(parent.areaLevelId)
      ) {
        exceptions.push({
          area,
          exceptionType: 'Invalid Parent Level',
          suggestedAction: 'Change the parent area to one at an allowed Area Level.',
        });
      }
    }
  }

  return exceptions;
}
