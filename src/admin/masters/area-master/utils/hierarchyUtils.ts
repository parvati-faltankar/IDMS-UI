// ─── Hierarchy Utilities ──────────────────────────────────────────────────────

import type { Area } from '../types/areaMaster.types';

/**
 * Build the display hierarchy path for an area given its name and parent area.
 */
export function buildHierarchyPath(areaName: string, parentArea: Area | null): string {
  if (!parentArea) return areaName;
  return `${parentArea.hierarchyPath} > ${areaName}`;
}

/**
 * Detect whether selecting `selectedParentAreaId` as the parent of `areaId`
 * would create a circular hierarchy.
 */
export function isCircularHierarchy(
  areaId: string,
  selectedParentAreaId: string | null,
  areas: Area[],
): boolean {
  if (!selectedParentAreaId) return false;
  if (selectedParentAreaId === areaId) return true;

  // Walk up the ancestor chain of the selected parent
  let currentId: string | null = selectedParentAreaId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break; // guard against existing circular data
    visited.add(currentId);
    const parent = areas.find((a) => a.id === currentId);
    if (!parent) break;
    if (parent.parentAreaId === areaId) return true;
    currentId = parent.parentAreaId;
  }

  return false;
}
