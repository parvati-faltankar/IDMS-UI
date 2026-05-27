// ─── Duplicate Check Utilities ───────────────────────────────────────────────

import type { Area } from '../types/areaMaster.types';

/**
 * Returns true if an area with the same name, level, and parent already exists.
 * Optionally excludes the current area (for edit scenarios).
 */
export function isDuplicateArea(
  areaName: string,
  areaLevelId: string,
  parentAreaId: string | null,
  areas: Area[],
  currentAreaId?: string,
): boolean {
  const normalised = areaName.trim().toLowerCase();
  return areas.some(
    (a) =>
      a.id !== currentAreaId &&
      a.areaName.trim().toLowerCase() === normalised &&
      a.areaLevelId === areaLevelId &&
      a.parentAreaId === parentAreaId,
  );
}
