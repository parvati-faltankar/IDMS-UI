import { beforeEach, describe, expect, it } from 'vitest';
import { __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { QuickHierarchyPreviewInput } from '../types/warehouse.dto';

function buildQuickInput(
  warehouseId: string,
  patternKey: QuickHierarchyPreviewInput['patternKey'],
  countsByLevel: Record<string, number>,
): QuickHierarchyPreviewInput {
  return {
    warehouseId,
    patternKey,
    templateAction: 'create-from-pattern',
    activateTemplateOnCommit: true,
    countsByLevel,
    codingByLevel: Object.keys(countsByLevel).map((levelCode) => ({
      levelCode,
      codePrefix: levelCode.slice(0, 2).toUpperCase(),
      startSequence: 1,
      sequenceLength: 2,
      separator: '',
      suffix: '',
    })),
    defaults: { status: 'Draft' },
  };
}

describe('Quick hierarchy wizard service flow', () => {
  beforeEach(() => __resetMockStores());

  it('lists supported quick hierarchy patterns', async () => {
    const patterns = await warehouseMockAdapter.listQuickHierarchyPatterns('WH-0002');
    expect(patterns.map((item) => item.key)).toEqual(expect.arrayContaining([
      'simple-root-bin',
      'zone-bin',
      'standard-distribution',
      'floor-room-shelf',
      'yard-lane-bay',
      'cold-room-chamber-position',
      'custom-pattern',
    ]));
  });

  it('covers preview generation for all required quick patterns', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM-ALL',
      warehouseName: 'Quick Pattern Coverage Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const scenarios: Array<{ pattern: QuickHierarchyPreviewInput['patternKey']; counts: Record<string, number> }> = [
      { pattern: 'simple-root-bin', counts: { BIN: 1 } },
      { pattern: 'zone-bin', counts: { ZONE: 1, BIN: 1 } },
      { pattern: 'standard-distribution', counts: { ZONE: 1, AISLE: 1, RACK: 1, BIN: 1 } },
      { pattern: 'floor-room-shelf', counts: { FLOOR: 1, ROOM: 1, SHELF: 1 } },
      { pattern: 'yard-lane-bay', counts: { YARD: 1, LANE: 1, BAY: 1 } },
      { pattern: 'cold-room-chamber-position', counts: { COLDROOM: 1, CHAMBER: 1, POSITION: 1 } },
      { pattern: 'custom-pattern', counts: { L1: 1, L2: 1 } },
    ];

    for (const scenario of scenarios) {
      const preview = await warehouseMockAdapter.previewQuickHierarchy(
        createdWarehouse.warehouse.id,
        buildQuickInput(createdWarehouse.warehouse.id, scenario.pattern, scenario.counts),
      );
      expect(preview.totalGeneratedNodes).toBeGreaterThan(0);
      expect(preview.validCount + preview.conflictCount).toBe(preview.totalGeneratedNodes);
    }
  });

  it('previews deterministic node counts for Zone -> BIN pattern', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM01',
      warehouseName: 'Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const input = buildQuickInput(createdWarehouse.warehouse.id, 'zone-bin', {
      ZONE: 2,
      BIN: 3,
    });
    const preview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, input);

    expect(preview.totalGeneratedNodes).toBe(8);
    expect(preview.conflictCount).toBe(0);
    expect(preview.validCount).toBe(8);
  });

  it('fails validation when level count is invalid', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM02',
      warehouseName: 'Invalid Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const input = buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', {
      BIN: 0,
    });
    const validation = await warehouseMockAdapter.validateQuickHierarchy(createdWarehouse.warehouse.id, input);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some((issue) => issue.message.includes('must be at least 1'))).toBe(true);
  });

  it('commits preview and appends quick hierarchy audit event', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM03',
      warehouseName: 'Commit Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const input = buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', {
      BIN: 2,
    });
    const preview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, input);
    const result = await warehouseMockAdapter.commitQuickHierarchy(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'QH-COMMIT-001',
    });

    expect(result.success).toBe(true);
    expect(result.createdCount).toBe(2);

    const details = await warehouseMockAdapter.getWarehouse(createdWarehouse.warehouse.id);
    expect(details.locations).toHaveLength(2);

    const audit = await warehouseMockAdapter.getAudit(createdWarehouse.warehouse.id, { page: 1, pageSize: 20 });
    expect(audit.items.some((item) => item.action === 'QuickHierarchyCommit')).toBe(true);
  });

  it('enforces all-or-nothing when preview has conflicts', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM04',
      warehouseName: 'Conflict Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const initialInput = buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', {
      BIN: 1,
    });
    const initialPreview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, initialInput);
    const initialCommit = await warehouseMockAdapter.commitQuickHierarchy(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: initialPreview.previewToken,
      paramsHash: initialPreview.paramsHash,
      idempotencyKey: 'QH-COMMIT-CONFLICT-BASE',
    });
    expect(initialCommit.success).toBe(true);

    const input = buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', {
      BIN: 1,
    });
    const preview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, input);
    expect(preview.conflictCount).toBeGreaterThan(0);

    const result = await warehouseMockAdapter.commitQuickHierarchy(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'QH-COMMIT-002',
    });

    expect(result.success).toBe(false);
    const details = await warehouseMockAdapter.getWarehouse(createdWarehouse.warehouse.id);
    expect(details.locations).toHaveLength(1);
  });

  it('keeps manual add child and bulk create functional after quick commit', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM05',
      warehouseName: 'Regression Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const input = buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', {
      BIN: 1,
    });
    const preview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, input);
    const quickResult = await warehouseMockAdapter.commitQuickHierarchy(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'QH-COMMIT-003',
    });
    expect(quickResult.success).toBe(true);

    const manualLocation = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationCode: 'BI20',
      locationName: 'Manual Bin 20',
      locationType: 'BIN',
    });
    expect(manualLocation.locationCode).toBe('BI20');

    const bulkPreview = await warehouseMockAdapter.bulkPreviewLocations(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationType: 'BIN',
      level: 1,
      codePrefix: 'BI',
      namePrefix: 'Bulk Bin',
      startSequence: 30,
      count: 2,
      sequenceLength: 2,
      separator: '',
      suffix: '',
      idempotencyKey: 'QH-BULK-001',
    });
    const bulkResult = await warehouseMockAdapter.commitBulkLocations(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: bulkPreview.previewToken,
      paramsHash: bulkPreview.paramsHash,
      idempotencyKey: 'QH-BULK-001',
    });

    expect(bulkResult.success).toBe(true);
    expect(bulkResult.createdCount).toBe(2);
  });

  it('blocks preview and commit when permission is denied', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'QH-WM06',
      warehouseName: 'Permission Quick Wizard Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const input: QuickHierarchyPreviewInput = {
      ...buildQuickInput(createdWarehouse.warehouse.id, 'simple-root-bin', { BIN: 1 }),
      permissionGranted: false,
    };
    const preview = await warehouseMockAdapter.previewQuickHierarchy(createdWarehouse.warehouse.id, input);
    expect(preview.warnings.some((message) => message.toLowerCase().includes('permission'))).toBe(true);

    const commit = await warehouseMockAdapter.commitQuickHierarchy(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'QH-COMMIT-NO-PERMISSION',
    });
    expect(commit.success).toBe(false);
    expect(commit.errors.some((error) => error.code === 'PERMISSION')).toBe(true);
  });
});
