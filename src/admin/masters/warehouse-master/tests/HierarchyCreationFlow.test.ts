import { beforeEach, describe, expect, it } from 'vitest';
import { activateHierarchyTemplateMock, createHierarchyTemplateMock, __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { buildTemplateIdentifierExamples, getAllowedChildTemplateLevels } from '../utils/hierarchyUtils';
import type { HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';

const flowTemplateLevels: HierarchyTemplate['levels'] = [
  { levelId: 'LVL-ZONE', levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'], allowedChildLevels: ['AISLE', 'BIN'], capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: false, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false, defaultResponsibilityRole: 'ZoneSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'Zone' },
  { levelId: 'LVL-AISLE', levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['ZONE'], allowedChildLevels: ['RACK'], capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: false, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false, defaultResponsibilityRole: 'AreaSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'Aisle' },
  { levelId: 'LVL-RACK', levelCode: 'RACK', levelName: 'Rack', sequence: 3, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['AISLE'], allowedChildLevels: ['BIN'], capacityApplicable: true, itemEligibilityApplicable: false, responsibilityApplicable: true, inventoryEndpointEligible: false, barcodeApplicable: true, qrApplicable: false, transactionPurposes: ['Storage'], capacityEnforcementMode: 'Warning', capacityRollupMode: 'RollupFromChildren', allowCapabilityOverride: false, defaultResponsibilityRole: 'RackCustodian', defaultLocationRole: 'Structural', defaultLocationType: 'Rack' },
  { levelId: 'LVL-BIN', levelCode: 'BIN', levelName: 'BIN', sequence: 4, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE', 'ZONE', 'RACK'], allowedChildLevels: [], capacityApplicable: true, itemEligibilityApplicable: true, responsibilityApplicable: true, inventoryEndpointEligible: true, barcodeApplicable: true, qrApplicable: true, transactionPurposes: ['Storage', 'Picking'], capacityEnforcementMode: 'HardBlock', capacityRollupMode: 'OwnCapacityOnly', allowCapabilityOverride: true, defaultResponsibilityRole: 'BinCustodian', defaultLocationRole: 'InventoryEndpoint', defaultLocationType: 'BIN' },
];

describe('Hierarchy creation flow', () => {
  beforeEach(() => __resetMockStores());

  it('supports active-template-driven Warehouse -> Zone -> Aisle -> Rack -> BIN creation', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-FLOW',
      warehouseName: 'Warehouse Flow',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const createdTemplate = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'FLOW-TPL',
      templateName: 'Zone Aisle Rack BIN',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: flowTemplateLevels,
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, createdTemplate.id);

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
    const bin = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: rack.id,
      locationCode: 'B01',
      locationName: 'BIN 01',
      locationType: 'BIN',
      binType: 'Standard',
    });

    expect(zone.profile.level).toBe(1);
    expect(aisle.profile.level).toBe(2);
    expect(rack.profile.level).toBe(3);
    expect(bin.profile.level).toBe(4);
    expect(zone.profile.fullCode).toBe('WH-FLOW-Z01');
    expect(aisle.profile.fullCode).toBe('WH-FLOW-Z01-A01');
    expect(rack.profile.fullCode).toBe('WH-FLOW-Z01-A01-R01');
    expect(bin.profile.fullCode).toBe('WH-FLOW-Z01-A01-R01-B01');

    const details = await warehouseMockAdapter.getWarehouse(createdWarehouse.warehouse.id);
    const reloadedZone = details.locations.find((location) => location.id === zone.id)!;
    const reloadedRack = details.locations.find((location) => location.id === rack.id)!;
    const reloadedBin = details.locations.find((location) => location.id === bin.id)!;

    expect(reloadedZone.profile.isLeafEndpoint).toBe(false);
    expect(reloadedZone.profile.inventoryAllowed).toBe(false);
    expect(reloadedRack.profile.isLeafEndpoint).toBe(false);
    expect(reloadedBin.profile.isLeafEndpoint).toBe(true);
    expect(reloadedBin.profile.inventoryAllowed).toBe(false);
  });

  it('supports active-template-driven Warehouse -> BIN creation when the root path allows BIN', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-ROOT',
      warehouseName: 'Warehouse Root BIN',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const createdTemplate = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'ROOT-BIN',
      templateName: 'Warehouse Root BIN',
      versionNumber: 1,
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: flowTemplateLevels,
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, createdTemplate.id);

    const rootBin = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationCode: 'BROOT',
      locationName: 'Root BIN',
      locationType: 'BIN',
      binType: 'Standard',
    });

    expect(rootBin.profile.level).toBe(4);
    expect(rootBin.profile.fullCode).toBe('WH-ROOT-BROOT');

    const details = await warehouseMockAdapter.getWarehouse(createdWarehouse.warehouse.id);
    const reloadedRootBin = details.locations.find((location) => location.id === rootBin.id)!;
    expect(reloadedRootBin.profile.isLeafEndpoint).toBe(true);
  });

  it('derives allowed child levels from the active template path rules', () => {
    const template: HierarchyTemplate = {
      id: 'T-001',
      warehouseId: 'WH-TEST',
      templateCode: 'TEST',
      templateName: 'Test',
      status: 'Active',
      flexiblePathEnabled: true,
      levels: flowTemplateLevels,
      currentVersion: { versionNumber: 1 },
      versionHistory: [],
      effectiveFrom: '2026-06-08',
      createdAt: '2026-06-08T00:00:00.000Z',
      updatedAt: '2026-06-08T00:00:00.000Z',
      version: 1,
    };

    const zone: WarehouseLocation = {
      id: 'LOC-ZONE',
      warehouseId: 'WH-TEST',
      locationCode: 'Z01',
      locationName: 'Zone 01',
      status: 'Draft',
      profile: {
        locationType: 'Zone',
        templateLevelId: 'LVL-ZONE',
        templateLevelCode: 'ZONE',
        locationRole: 'Structural',
        level: 1,
        fullCode: 'WH-TEST-Z01',
        isLeafEndpoint: false,
        inventoryAllowed: false,
      },
      putawayBlocked: false,
      pickingBlocked: false,
      movementState: 'Idle',
      commitmentState: 'Uncommitted',
      stockStatuses: [],
      createdAt: '2026-06-08T00:00:00.000Z',
      updatedAt: '2026-06-08T00:00:00.000Z',
      version: 1,
    };

    expect(getAllowedChildTemplateLevels(null, template).map((level) => level.levelCode)).toEqual(['ZONE', 'BIN']);
    expect(getAllowedChildTemplateLevels(zone, template).map((level) => level.levelCode)).toEqual(['AISLE', 'BIN']);
  });

  it('builds full identifier examples from runtime level policies', () => {
    const examples = buildTemplateIdentifierExamples({
      levels: [
        { levelCode: 'YARD', levelName: 'Yard', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'], autoGenerateCode: true, codePrefix: 'Y', startSequence: 2, sequenceLength: 2, separator: '-', levelRole: 'Yard' },
        { levelCode: 'BIN', levelName: 'BIN', sequence: 2, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['YARD'], autoGenerateCode: true, codePrefix: 'B', startSequence: 9, sequenceLength: 3, separator: '-', levelRole: 'InventoryEndpoint' },
      ],
      flexiblePathEnabled: false,
      defaultPathSeparator: '/',
      includeWarehouseCodeInIdentifier: true,
      defaultSequenceLength: 3,
    }, 'WH-FLOW');

    expect(examples).toHaveLength(1);
    expect(examples[0]).toBe('WH-FLOW/Y-02/B-009');
  });

  it('supports custom Warehouse -> Floor -> Room -> Shelf path', async () => {
    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WM02',
      warehouseName: 'Warehouse Floor Path',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-MFG',
      legalEntityCode: 'LE-INDIA-001',
      inventoryOwnerCode: 'OWN-001',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const createdTemplate = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'FLOOR-PATH',
      templateName: 'Floor Room Shelf',
      versionNumber: 1,
      flexiblePathEnabled: false,
      effectiveFrom: '2026-06-08',
      levels: [
        {
          levelId: 'LVL-FLR', levelCode: 'FLR', levelName: 'Floor', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false,
          allowedParentLevels: ['WAREHOUSE'], allowedChildLevels: ['ROOM'], inventoryEndpointEligible: false,
          capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, barcodeApplicable: false, qrApplicable: false,
          transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false,
          defaultResponsibilityRole: 'AreaSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'General',
          autoGenerateCode: true, codePrefix: 'F', startSequence: 1, sequenceLength: 2, separator: '-', suffix: '',
        },
        {
          levelId: 'LVL-ROOM', levelCode: 'ROOM', levelName: 'Room', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false,
          allowedParentLevels: ['FLR'], allowedChildLevels: ['SHLF'], inventoryEndpointEligible: false,
          capacityApplicable: false, itemEligibilityApplicable: false, responsibilityApplicable: true, barcodeApplicable: false, qrApplicable: false,
          transactionPurposes: ['Storage'], capacityEnforcementMode: 'None', capacityRollupMode: 'None', allowCapabilityOverride: false,
          defaultResponsibilityRole: 'AreaSupervisor', defaultLocationRole: 'Structural', defaultLocationType: 'General',
          autoGenerateCode: true, codePrefix: 'RM', startSequence: 1, sequenceLength: 2, separator: '-', suffix: '',
        },
        {
          levelId: 'LVL-SHLF', levelCode: 'SHLF', levelName: 'Shelf', sequence: 3, mandatory: true, leafEligible: true, allowSkipLevel: false,
          allowedParentLevels: ['ROOM'], allowedChildLevels: [], inventoryEndpointEligible: true,
          capacityApplicable: true, itemEligibilityApplicable: true, responsibilityApplicable: true, barcodeApplicable: false, qrApplicable: false,
          transactionPurposes: ['Storage'], capacityEnforcementMode: 'Warning', capacityRollupMode: 'OwnCapacityOnly', allowCapabilityOverride: false,
          defaultResponsibilityRole: 'AreaSupervisor', defaultLocationRole: 'InventoryEndpoint', defaultLocationType: 'General',
          autoGenerateCode: true, codePrefix: 'S', startSequence: 1, sequenceLength: 2, separator: '-', suffix: '',
        },
      ],
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, createdTemplate.id);

    const floor = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationCode: 'F01',
      locationName: 'Floor 01',
      locationType: 'General',
      templateLevelCode: 'FLR',
    });
    const room = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: floor.id,
      locationCode: 'RM01',
      locationName: 'Room 01',
      locationType: 'General',
      templateLevelCode: 'ROOM',
    });
    const shelf = await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      parentLocationId: room.id,
      locationCode: 'S01',
      locationName: 'Shelf 01',
      locationType: 'General',
      templateLevelCode: 'SHLF',
    });

    expect(floor.profile.fullCode).toBe('WM02-F01');
    expect(room.profile.fullCode).toBe('WM02-F01-RM01');
    expect(shelf.profile.fullCode).toBe('WM02-F01-RM01-S01');
  });
});
