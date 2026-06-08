import { describe, expect, it } from 'vitest';
import {
  buildHierarchySetupPanelModel,
  buildHierarchyTreeWithWarehouseRoot,
  canAddChildUnderNode,
  collectHierarchyIssueNodeIds,
} from '../pages/WarehouseHierarchyPage';
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
  it('builds setup panel model with required fields', () => {
    const details = {
      warehouse: WH_BIN_LEVEL_ACTIVE,
      hierarchyTemplates: [template],
      locations: [parent],
      setupHealth: { overallTone: 'partial', readyForActivation: false, sections: [], blockingIssues: [] },
      recentAuditEvents: [],
    };
    const model = buildHierarchySetupPanelModel(details, template);
    expect(model.inventoryControlMode).toBe('Location-BIN-Level');
    expect(model.activeTemplateName).toBe('Warehouse');
    expect(model.templateStatus).toBe('Active');
    expect(model.nodeCount).toBe(1);
  });

  it('returns empty hierarchy next action guidance', () => {
    const details = {
      warehouse: WH_BIN_LEVEL_ACTIVE,
      hierarchyTemplates: [template],
      locations: [],
      setupHealth: { overallTone: 'partial', readyForActivation: false, sections: [], blockingIssues: [] },
      recentAuditEvents: [],
    };
    const model = buildHierarchySetupPanelModel(details, template);
    expect(model.nextRecommendedAction).toContain('no locations have been created');
  });

  it('builds virtual warehouse root node for tree visibility', () => {
    const tree = buildHierarchyTreeWithWarehouseRoot('WM02', 'Warehouse 02', []);
    expect(tree).toHaveLength(1);
    expect(tree[0].locationCode).toBe('WM02');
    expect(tree[0].levelCode).toBe('WAREHOUSE');
  });

  it('blocks add child under invalid parent with stock/open dependency', () => {
    const blockedParent = { ...parent, stockStatuses: ['Available'] as const };
    const result = canAddChildUnderNode(blockedParent, 'Location-BIN-Level', template, [blockedParent]);
    expect(result.allowed).toBe(false);
  });

  it('allows add child from warehouse root when active template permits root child levels', () => {
    const result = canAddChildUnderNode(null, 'Location-BIN-Level', template, [parent]);
    expect(result.allowed).toBe(true);
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

  it('returns disabled reason when no child level is allowed under node', () => {
    const terminalTemplate: HierarchyTemplate = {
      ...template,
      levels: [
        { levelCode: 'BIN', levelName: 'BIN', sequence: 1, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'], allowedChildLevels: [] },
      ],
    };
    const terminalNode: WarehouseLocation = {
      ...parent,
      profile: {
        ...parent.profile,
        templateLevelCode: 'BIN',
      },
    };
    const result = canAddChildUnderNode(terminalNode, 'Location-BIN-Level', terminalTemplate, [terminalNode]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('No valid child levels remain');
  });
});
