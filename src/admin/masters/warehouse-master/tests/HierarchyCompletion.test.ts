import { describe, expect, it } from 'vitest';
import {
  CUSTOM_HIERARCHY_TEMPLATE,
  SEED_LOCATIONS,
  WH_BIN_LEVEL_ACTIVE,
  WH_WAREHOUSE_LEVEL_ACTIVE,
} from '../fixtures/warehouseFixtures';
import type { HierarchyNode } from '../types/warehouse.types';
import { deriveHierarchyCompletionModel } from '../utils/warehouseDerivations';
import { getHierarchyNodeModeMatch } from '../components/HierarchyTree';
import { buildInspectorActionStates } from '../components/HierarchyNodeInspector';

describe('Hierarchy completion model', () => {
  it('returns not-applicable completion for warehouse-level mode', () => {
    const model = deriveHierarchyCompletionModel(WH_WAREHOUSE_LEVEL_ACTIVE, [], []);
    expect(model.hierarchyApplicable).toBe(false);
    expect(model.status).toBe('Complete');
  });

  it('marks active template with no nodes as incomplete and guides first node creation', () => {
    const model = deriveHierarchyCompletionModel(WH_BIN_LEVEL_ACTIVE, [], [CUSTOM_HIERARCHY_TEMPLATE]);
    expect(model.status).toBe('Incomplete');
    expect(model.nextRecommendedAction.toLowerCase()).toContain('no locations have been created');
  });

  it('detects missing inventory-allowed endpoint when hierarchy has no eligible active endpoint', () => {
    const locations = SEED_LOCATIONS.map((location) => ({
      ...location,
      putawayBlocked: true,
      profile: {
        ...location.profile,
        inventoryAllowed: false,
      },
    }));
    const model = deriveHierarchyCompletionModel(WH_BIN_LEVEL_ACTIVE, locations, [CUSTOM_HIERARCHY_TEMPLATE]);
    expect(model.inventoryAllowedCount).toBe(0);
    expect(model.status).toBe('Blocked');
  });
});

describe('Hierarchy tree mode matching', () => {
  const node: HierarchyNode = {
    id: 'N1',
    locationCode: 'B001',
    locationName: 'Bin 001',
    level: 3,
    levelCode: 'BIN',
    status: 'Active',
    fullCode: 'WH-A-B001',
    isLeaf: true,
    inventoryAllowed: true,
    children: [],
    inventoryEndpointEligible: true,
    capabilitySummary: {
      capacityApplicable: true,
      itemEligibilityApplicable: true,
      responsibilityApplicable: false,
      barcodeApplicable: true,
      qrApplicable: true,
    },
  };

  it('matches issues mode only when issue exists', () => {
    expect(getHierarchyNodeModeMatch(node, 'Issues View', true)).toBe(true);
    expect(getHierarchyNodeModeMatch(node, 'Issues View', false)).toBe(false);
  });

  it('matches capability modes using node capability summary', () => {
    expect(getHierarchyNodeModeMatch(node, 'Capacity View', false)).toBe(true);
    expect(getHierarchyNodeModeMatch(node, 'Responsibility View', false)).toBe(false);
  });
});

describe('Inspector action states', () => {
  it('provides explicit disabled reasons for setup actions when capability is not applicable', () => {
    const states = buildInspectorActionStates(null, false, {
      capacityApplicable: false,
      itemEligibilityApplicable: false,
      responsibilityApplicable: false,
      barcodeApplicable: false,
      qrApplicable: false,
      transactionPurposes: [],
    });
    expect(states.find((item) => item.key === 'manage-capacity')?.reason).toContain('not applicable');
    expect(states.find((item) => item.key === 'add-child')?.enabled).toBe(false);
  });
});
