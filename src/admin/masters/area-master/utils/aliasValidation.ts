// ─── Alias / Alternate Name Validation ────────────────────────────────────────

import type { AreaAlias } from '../types/areaMaster.types';

export interface AliasRowErrors {
  aliasName?: string;
  aliasType?: string;
}

/**
 * Validates each alias row in an Area.
 * Returns a record keyed by row index containing field-level error messages.
 * An empty record means all rows are valid.
 *
 * Rules:
 * - Alias Name is required when a row exists.
 * - Alias Type is required when a row exists.
 * - Duplicate Alias Names (case-insensitive) within the same Area are blocked.
 * - Alias Name must differ from the Area Name.
 */
export function validateAliasRows(
  aliases: AreaAlias[],
  areaName?: string,
): Record<number, AliasRowErrors> {
  const result: Record<number, AliasRowErrors> = {};
  const seenNames = new Set<string>();

  aliases.forEach((alias, idx) => {
    const rowErr: AliasRowErrors = {};
    const name = alias.aliasName.trim();

    if (!name) {
      rowErr.aliasName = 'Alias Name is required.';
    } else {
      const lower = name.toLowerCase();
      if (seenNames.has(lower)) {
        rowErr.aliasName = 'Duplicate Alias Name within this Area.';
      } else {
        seenNames.add(lower);
      }
      if (areaName && lower === areaName.trim().toLowerCase()) {
        rowErr.aliasName = 'Alias Name must differ from the Area Name.';
      }
    }

    if (!alias.aliasType) {
      rowErr.aliasType = 'Alias Type is required.';
    }

    if (Object.keys(rowErr).length > 0) {
      result[idx] = rowErr;
    }
  });

  return result;
}

/**
 * Returns true if all alias rows pass validation.
 */
export function areAliasRowsValid(aliases: AreaAlias[], areaName?: string): boolean {
  return Object.keys(validateAliasRows(aliases, areaName)).length === 0;
}
