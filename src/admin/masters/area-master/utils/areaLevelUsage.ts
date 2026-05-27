// ─── Area Level Usage Detection ───────────────────────────────────────────────
// Phase 2 — mock implementation backed by mock areaService.
// Replace with real API calls when backend is available.

import { areaService } from '../services/areaService';

/** Returns true if any Area record references this Area Level. */
export function isAreaLevelUsed(areaLevelId: string): boolean {
  return areaService.getAll().some((a) => a.areaLevelId === areaLevelId);
}

/** Returns true if the Area Level can be deleted (unused and Draft). */
export function canDeleteAreaLevel(areaLevelId: string): boolean {
  return !isAreaLevelUsed(areaLevelId);
}

/** Returns true if the Level Sequence can be changed (Area Level not yet used). */
export function canChangeLevelSequence(areaLevelId: string): boolean {
  return !isAreaLevelUsed(areaLevelId);
}
