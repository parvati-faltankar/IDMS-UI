// ─── Area Import Service — Mock (Phase 1 placeholder) ────────────────────────

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  rowCount: number;
}

export interface ImportResult {
  successCount: number;
  failCount: number;
  errors: string[];
}

export const areaImportService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateImportFile(_file: File): ImportValidationResult {
    return {
      isValid: false,
      errors: ['Import validation is not yet implemented. Available in a later phase.'],
      rowCount: 0,
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  importValidRows(_rows: Record<string, unknown>[]): ImportResult {
    return {
      successCount: 0,
      failCount: 0,
      errors: ['Bulk import is not yet implemented. Available in a later phase.'],
    };
  },
};
