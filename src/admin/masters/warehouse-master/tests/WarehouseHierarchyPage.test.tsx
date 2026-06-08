import { describe, expect, it } from 'vitest';
import { canAddChildUnderNode, collectHierarchyIssueNodeIds } from '../pages/WarehouseHierarchyPage';
import { WH_BIN_LEVEL_ACTIVE } from '../fixtures/warehouseFixtures';
import type { HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';

const parent: WarehouseLocation = {
  id: 'P1',
  warehouseId: 'WH-0002',
  locationCode: 'R01',
  locationName: 'Rack 01',
  status: 'Active',
  profile: {
    locationType: 'Rack',
    level: 3,
    fullCode: 'WH-PUNE-01-Z01-A01-R01',
    isLeafEndpoint: false,
    inventoryAllowed: false,
  },
  putawayBlocked: false,
  pickingBlocked: false,
  movementState: 'Idle',
  commitmentState: 'Uncommitted',
  stockStatuses: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  version: 1,
};

const template: HierarchyTemplate = {
  id: 'TPL',
  warehouseId: 'WH-0002',
  templateCode: 'TPL',
  templateName: 'Warehouse',
  status: 'Active',
  flexiblePathEnabled: false,
  levels: [
    { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false },
    { levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false },
    { levelCode: 'RACK', levelName: 'Rack', sequence: 3, mandatory: true, leafEligible: false, allowSkipLevel: false },
    { levelCode: 'SHELF', levelName: 'Shelf', sequence: 4, mandatory: true, leafEligible: false, allowSkipLevel: false },
    { levelCode: 'BIN', levelName: 'BIN', sequence: 5, mandatory: true, leafEligible: true, allowSkipLevel: false },
  ],
  currentVersion: { versionNumber: 1 },
  versionHistory: [],
  effectiveFrom: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  version: 1,
};

describe('WarehouseHierarchyPage helpers', () => {
  it('blocks add child under invalid parent with stock/open dependency', () => {
    const blockedParent = { ...parent, stockStatuses: ['Available'] as const };
    const result = canAddChildUnderNode(blockedParent, 'Location-BIN-Level', template, [blockedParent]);
    expect(result.allowed).toBe(false);
  });

  it('allows add child under valid parent in BIN-level mode', () => {
    const result = canAddChildUnderNode(parent, 'Location-BIN-Level', template, [parent]);
    expect(result.allowed).toBe(true);
  });

  it('collects blocked and non-inventory-allowed nodes as issues', () => {
    const locations: WarehouseLocation[] = [
      parent,
      { ...parent, id: 'P2', locationCode: 'R02', status: 'Blocked' },
    ];
    const issues = collectHierarchyIssueNodeIds(locations);
    expect(issues.has('P1')).toBe(true);
    expect(issues.has('P2')).toBe(true);
  });

  it('blocks hierarchy actions for warehouse-level mode', () => {
    const result = canAddChildUnderNode(parent, 'Warehouse-Level', template, [parent]);
    expect(result.allowed).toBe(false);
  });
});
