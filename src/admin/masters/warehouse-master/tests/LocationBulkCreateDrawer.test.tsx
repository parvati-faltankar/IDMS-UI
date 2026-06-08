import { beforeEach, describe, expect, it } from 'vitest';
import { buildBulkPreviewFingerprint, isPreviewInvalidated, makeDefaultBulkState } from '../components/LocationBulkCreateDrawer';
import { activateHierarchyTemplateMock, createHierarchyTemplateMock, __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';

describe('LocationBulkCreateDrawer helpers', () => {
  it('invalidates preview when input changes', () => {
    const state = makeDefaultBulkState(null);
    const fingerprint = buildBulkPreviewFingerprint(state);
    expect(isPreviewInvalidated(fingerprint, { ...state, count: state.count + 1 })).toBe(true);
  });
});

describe('bulk preview and atomic commit simulation', () => {
  beforeEach(() => __resetMockStores());

  it('detects duplicate within generated batch', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      level: 5,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'B',
      namePrefix: 'BIN',
      startSequence: 1,
      count: 2,
      sequenceLength: 3,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-001',
    });
    expect(preview.conflictCount).toBeGreaterThan(0);
  });

  it('commits atomically when preview is valid', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      level: 5,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'XBN',
      namePrefix: 'Extra BIN',
      startSequence: 10,
      count: 2,
      sequenceLength: 3,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-002',
    });
    const result = await warehouseMockAdapter.commitBulkLocations('WH-0002', {
      warehouseId: 'WH-0002',
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'TEST-BULK-002',
    });
    expect(preview.rows[0].fullLocationIdentifier).toBe('WH-PUNE-01-Z01-A01-R01-S01-XBN010');
    expect(preview.rows[1].fullLocationIdentifier).toBe('WH-PUNE-01-Z01-A01-R01-S01-XBN011');
    expect(result.success).toBe(true);
    expect(result.createdCount).toBe(2);
  });

  it('previews expected BIN full identifiers from selected rack parent', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      level: 5,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'B',
      namePrefix: 'BIN',
      startSequence: 1,
      count: 2,
      sequenceLength: 2,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-003',
    });

    expect(preview.rows[0].fullLocationIdentifier).toBe('WH-PUNE-01-Z01-A01-R01-S01-B01');
    expect(preview.rows[1].fullLocationIdentifier).toBe('WH-PUNE-01-Z01-A01-R01-S01-B02');
  });

  it('previews WM02-Z01-A01-R01-B01 and WM02-Z01-A01-R01-B02 from rack parent', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WM02',
      warehouseName: 'Warehouse 02',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const template = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'STD-DIST',
      templateName: 'Standard Distribution',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: [
        { levelId: 'LVL-ZONE', levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'], allowedChildLevels: ['AISLE', 'BIN'], capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: false, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false, defaultResponsibilityRole: 'ZoneSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'Zone', autoGenerateCode: true, codePrefix: 'Z', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
        { levelId: 'LVL-AISLE', levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['ZONE'], allowedChildLevels: ['RACK'], capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: false, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false, defaultResponsibilityRole: 'AreaSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'Aisle', autoGenerateCode: true, codePrefix: 'A', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
        { levelId: 'LVL-RACK', levelCode: 'RACK', levelName: 'Rack', sequence: 3, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['AISLE'], allowedChildLevels: ['BIN'], capacityApplicable: true, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: true, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'Warning', capacityRollupMode: 'RollupFromChildren', allowCapabilityOverride: false, defaultResponsibilityRole: 'RackCustodian', defaultLocationRole: 'Structural', defaultLocationType: 'Rack', autoGenerateCode: true, codePrefix: 'R', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
        { levelId: 'LVL-BIN', levelCode: 'BIN', levelName: 'BIN', sequence: 4, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE', 'ZONE', 'RACK'], allowedChildLevels: [], capacityApplicable: true, itemEligibilityApplicable: true, responsibilityApplicable: true, inventoryEndpointEligible: true, barcodeApplicable: true, qrApplicable: true, transactionPurposes: ['Storage', 'Picking'], capacityEnforcementMode: 'HardBlock', capacityRollupMode: 'OwnCapacityOnly', allowCapabilityOverride: true, defaultResponsibilityRole: 'BinCustodian', defaultLocationRole: 'InventoryEndpoint', defaultLocationType: 'BIN', autoGenerateCode: true, codePrefix: 'B', startSequence: 1, sequenceLength: 2, separator: '', suffix: '' },
      ],
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, template.id);

    const zone = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationCode: 'Z01',
      locationName: 'Zone 01',
      locationType: 'Zone',
    });
    const aisle = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: zone.id,
      locationCode: 'A01',
      locationName: 'Aisle 01',
      locationType: 'Aisle',
    });
    const rack = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: aisle.id,
      locationCode: 'R01',
      locationName: 'Rack 01',
      locationType: 'Rack',
    });

    const preview = await warehouseMockAdapter.bulkPreviewLocations(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: rack.id,
      level: 4,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'B',
      namePrefix: 'BIN',
      startSequence: 1,
      count: 2,
      sequenceLength: 2,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-004',
    });

    expect(preview.rows[0].fullLocationIdentifier).toBe('WM02-Z01-A01-R01-B01');
    expect(preview.rows[1].fullLocationIdentifier).toBe('WM02-Z01-A01-R01-B02');
  });
});
