import { describe, expect, it, beforeEach } from 'vitest';

import {
  buildImportCommitPayload,
  detectPermissionDenied,
  parseWarehouseServiceError,
  requiresControlledChangeApproval,
} from '../utils/governanceUtils';
import {
  buildErrorFileContents,
  buildImportSummary,
  canSubmitImport,
  deriveImportChecklist,
} from '../pages/WarehouseImportPage';
import { buildAuditRows, renderAuditListMarkup } from '../pages/WarehouseAuditPage';
import { __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { readOnlyPermissions } from '../types/warehouse.permissions';

beforeEach(() => {
  __resetMockStores();
});

describe('import validation', () => {
  it('returns summary counts for a normal validation run', async () => {
    const result = await warehouseMockAdapter.validateImport({
      entityType: 'Location',
      mode: 'Dry-Run',
      warehouseId: 'WH-0002',
      fileName: 'location-import.csv',
      fileSize: 2048,
      templateVersion: 'WM-TPL-1.0',
      idempotencyKey: 'LOC-IMPORT-1',
    });

    expect(result.totalRows).toBeGreaterThan(0);
    expect(buildImportSummary(result).some((item) => item.label === 'Create')).toBe(true);
  });

  it('rejects derived fields during validation', async () => {
    const result = await warehouseMockAdapter.validateImport({
      entityType: 'Warehouse',
      mode: 'Dry-Run',
      warehouseId: 'WH-0002',
      fileName: 'warehouse-derived-fields.csv',
      fileSize: 4096,
      templateVersion: 'WM-TPL-1.0',
      idempotencyKey: 'WH-IMPORT-DERIVED',
    });

    expect(result.errorRows).toBeGreaterThan(0);
    expect(result.rows.some((row) => row.issues.some((issue) => issue.includes('Derived fields')))).toBe(true);
    expect(buildErrorFileContents(result)).toContain('Derived fields must not be imported');
  });
});

describe('controlled import approval', () => {
  it('marks controlled changes as approval-required', async () => {
    const result = await warehouseMockAdapter.validateImport({
      entityType: 'Warehouse',
      mode: 'Incremental',
      warehouseId: 'WH-0002',
      fileName: 'warehouse-controlled-update.csv',
      fileSize: 8192,
      templateVersion: 'WM-TPL-1.0',
      idempotencyKey: 'WH-IMPORT-CONTROLLED',
    });

    expect(requiresControlledChangeApproval(result)).toBe(true);
  });

  it('requires reason code before commit when approval is needed', async () => {
    const validation = await warehouseMockAdapter.validateImport({
      entityType: 'Warehouse',
      mode: 'Incremental',
      warehouseId: 'WH-0002',
      fileName: 'warehouse-controlled-approval.csv',
      fileSize: 8192,
      templateVersion: 'WM-TPL-1.0',
      idempotencyKey: 'WH-IMPORT-CONTROLLED-2',
    });

    const payload = buildImportCommitPayload(validation, { mode: 'Incremental' });
    const result = await warehouseMockAdapter.commitImport(payload);
    expect(result.success).toBe(false);
    expect(result.errors?.join(' ')).toContain('reason code');
  });

  it('enables submit only when validation is commit-safe and reason is captured', async () => {
    const validation = await warehouseMockAdapter.validateImport({
      entityType: 'Warehouse',
      mode: 'Incremental',
      warehouseId: 'WH-0002',
      fileName: 'warehouse-controlled-submit.csv',
      fileSize: 8192,
      templateVersion: 'WM-TPL-1.0',
      idempotencyKey: 'WH-IMPORT-CONTROLLED-3',
    });

    expect(canSubmitImport(validation, '', '')).toBe(false);
    expect(canSubmitImport(validation, 'CONTROLLED-FIELD-CHANGE', 'Need approval for sensitive update')).toBe(true);
    expect(deriveImportChecklist(validation, '', '').some((item) => item.id === 'reason' && !item.passed)).toBe(true);
  });
});

describe('audit rendering helpers', () => {
  it('renders audit rows with correlation and version details', async () => {
    const result = await warehouseMockAdapter.getAudit('WH-0002', { page: 1, pageSize: 50 });
    const rows = buildAuditRows(result.items);
    expect(rows.length).toBeGreaterThan(0);
    expect(renderAuditListMarkup(result.items)).toContain(rows[0].title);
  });
});

describe('stale update conflict', () => {
  it('returns a stale-record error when version is outdated', async () => {
    await expect(
      warehouseMockAdapter.updateWarehouse('WH-0002', 0, { version: 0, warehouseName: 'New Name' }),
    ).rejects.toThrow(/stale/i);
  });
});

describe('permission denied handling', () => {
  it('produces a permission denied issue for read-only users', () => {
    const issues = detectPermissionDenied(readOnlyPermissions(), 'warehouse.import');
    expect(issues[0]?.category).toBe('PermissionDenied');
  });

  it('formats stale service errors into a user-facing warning', () => {
    const parsed = parseWarehouseServiceError(new Error('Stale record'));
    expect(parsed.tone).toBe('warning');
  });
});
