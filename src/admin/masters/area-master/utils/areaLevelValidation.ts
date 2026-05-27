// ─── Area Level Validation Utilities ─────────────────────────────────────────

import type { AreaLevel, AreaLevelRole, UsageTag } from '../types/areaMaster.types';

// ─── Role → recommended usage tags ───────────────────────────────────────────

export const ROLE_RECOMMENDED_USAGE: Record<AreaLevelRole, UsageTag[]> = {
  'Structural': ['Geographic', 'Reporting'],
  'Operational': ['Sales', 'Service', 'Delivery', 'Collection', 'Beat / Route', 'Dealer / Distributor Territory'],
  'Structural + Operational': ['Geographic', 'Reporting', 'Sales', 'Service', 'Delivery', 'Collection', 'Beat / Route'],
  'Reporting Only': ['Reporting'],
  'Geo Only': ['Geographic', 'Geo Boundary', 'Postal / Pin Code'],
};

export function getRecommendedUsageTagsByRole(role: AreaLevelRole): UsageTag[] {
  return ROLE_RECOMMENDED_USAGE[role] ?? [];
}

export function validateUsageTagsAgainstRole(_role: AreaLevelRole, selectedTags: UsageTag[]): boolean {
  return selectedTags.length > 0;
}

// ─── Duplicate checks ─────────────────────────────────────────────────────────

export function isDuplicateAreaLevelName(
  name: string,
  existingLevels: AreaLevel[],
  currentId?: string,
): boolean {
  const n = name.trim().toLowerCase();
  return existingLevels.some((l) => l.id !== currentId && l.areaLevelName.trim().toLowerCase() === n);
}

export function isDuplicateShortCode(
  shortCode: string,
  existingLevels: AreaLevel[],
  currentId?: string,
): boolean {
  const n = shortCode.trim().toLowerCase();
  return existingLevels.some((l) => l.id !== currentId && l.shortCode.trim().toLowerCase() === n);
}

export function isDuplicateLevelSequence(
  sequence: number,
  existingLevels: AreaLevel[],
  currentId?: string,
): boolean {
  return existingLevels.some((l) => l.id !== currentId && l.levelSequence === sequence);
}

// ─── Usage tag subset validation ──────────────────────────────────────────────

export interface UsageTagValidationResult {
  defaultErrors: string[];
  mandatoryErrors: string[];
}

export function validateDefaultAndMandatoryUsageTags(
  allowedUsageTags: UsageTag[],
  defaultUsageTags: UsageTag[],
  mandatoryUsageTags: UsageTag[],
): UsageTagValidationResult {
  const allowedSet = new Set(allowedUsageTags);
  const defaultErrors = defaultUsageTags
    .filter((t) => !allowedSet.has(t))
    .map((t) => `"${t}" is not in Allowed Usage Tags.`);
  const mandatoryErrors = mandatoryUsageTags
    .filter((t) => !allowedSet.has(t))
    .map((t) => `"${t}" is not in Allowed Usage Tags.`);
  return { defaultErrors, mandatoryErrors };
}

// ─── Field-level save validation ──────────────────────────────────────────────

export interface AreaLevelFieldErrors {
  areaLevelName?: string;
  shortCode?: string;
  levelSequence?: string;
  areaLevelRole?: string;
  parentRequired?: string;
  allowedParentLevelIds?: string;
  allowedUsageTags?: string;
  defaultUsageTags?: string;
  mandatoryUsageTags?: string;
}

export function validateAreaLevelForSave(
  level: Partial<AreaLevel>,
  existingLevels: AreaLevel[],
): AreaLevelFieldErrors {
  const errs: AreaLevelFieldErrors = {};

  if (!level.areaLevelName?.trim()) {
    errs.areaLevelName = 'Area Level Name is required.';
  } else if (isDuplicateAreaLevelName(level.areaLevelName, existingLevels, level.id)) {
    errs.areaLevelName = 'Area Level Name already exists.';
  }

  if (!level.shortCode?.trim()) {
    errs.shortCode = 'Short Code is required.';
  } else if (isDuplicateShortCode(level.shortCode, existingLevels, level.id)) {
    errs.shortCode = 'Short Code already exists.';
  }

  return errs;
}

// ─── Activation validation ────────────────────────────────────────────────────

export function validateAreaLevelForActivation(
  level: Partial<AreaLevel>,
  existingLevels: AreaLevel[],
): string[] {
  const errors: string[] = [];

  if (!level.areaLevelCode?.trim()) errors.push('Area Level Code is required.');

  if (!level.areaLevelName?.trim()) {
    errors.push('Area Level Name is required.');
  } else if (isDuplicateAreaLevelName(level.areaLevelName, existingLevels, level.id)) {
    errors.push('Area Level Name already exists.');
  }

  if (!level.shortCode?.trim()) {
    errors.push('Short Code is required.');
  } else if (isDuplicateShortCode(level.shortCode, existingLevels, level.id)) {
    errors.push('Short Code already exists.');
  }

  if (!level.levelSequence && level.levelSequence !== 0) {
    errors.push('Level Sequence is required.');
  } else if (isDuplicateLevelSequence(level.levelSequence as number, existingLevels, level.id)) {
    errors.push('Level Sequence already exists for another Area Level.');
  }

  if (level.parentRequired === undefined || level.parentRequired === null) {
    errors.push('Parent Required must be specified.');
  }

  if (level.parentRequired && (!level.allowedParentLevelIds || level.allowedParentLevelIds.length === 0)) {
    errors.push('At least one Allowed Parent Level is required when Parent Required is Yes.');
  }

  if (!level.areaLevelRole) errors.push('Area Level Role is required.');

  if (!level.allowedUsageTags || level.allowedUsageTags.length === 0) {
    errors.push('At least one Allowed Usage Tag is required.');
  }

  if (level.allowedUsageTags && level.defaultUsageTags) {
    const allowedSet = new Set(level.allowedUsageTags);
    const invalid = level.defaultUsageTags.filter((t) => !allowedSet.has(t));
    if (invalid.length > 0)
      errors.push(`Default Usage Tags contain tags not in Allowed: ${invalid.join(', ')}.`);
  }

  if (level.allowedUsageTags && level.mandatoryUsageTags) {
    const allowedSet = new Set(level.allowedUsageTags);
    const invalid = level.mandatoryUsageTags.filter((t) => !allowedSet.has(t));
    if (invalid.length > 0)
      errors.push(`Mandatory Usage Tags contain tags not in Allowed: ${invalid.join(', ')}.`);
  }

  return errors;
}
