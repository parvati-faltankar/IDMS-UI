import { describe, expect, it } from 'vitest';
import { buildInspectorActionStates } from '../components/HierarchyNodeInspector';
import { getHierarchyNodeModeMatch } from '../components/HierarchyTree';
import { filterLocationRows } from '../pages/WarehouseLocationsPage';
import { CUSTOM_HIERARCHY_TEMPLATE, WH_BIN_LEVEL_ACTIVE } from '../fixtures/warehouseFixtures';
import type { HierarchyNode, HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import { validateCapacityPolicy } from '../validation/policyValidation';
import { validateLocationCapacityForUpdate } from '../validation/locationValidation';
import { validateWarehouseForActivation } from '../validation/activationValidation';
import {
  deriveCapacityApplicability,
  deriveCapacityRollup,
  deriveCapacityStatus,
  deriveEffectiveCapacityPolicy,
  deriveEffectiveStorageConstraints,
  evaluateCapacityForProjectedPosting,
} from '../utils/warehouseDerivations';

function makeLocation(partial: Partial<WarehouseLocation>): WarehouseLocation {
  return {
    id: partial.id ?? 'LOC-1',
    warehouseId: partial.warehouseId ?? WH_BIN_LEVEL_ACTIVE.id,
    locationCode: partial.locationCode ?? 'F01',
    locationName: partial.locationName ?? 'Floor 01',
    parentLocationId: partial.parentLocationId,
    status: partial.status ?? 'Active',
    profile: {
      locationType: partial.profile?.locationType ?? 'General',
      templateLevelCode: partial.profile?.templateLevelCode ?? 'FLOOR',
      level: partial.profile?.level ?? 1,
      fullCode: partial.profile?.fullCode ?? 'WH-PUNE-01-F01',
      isLeafEndpoint: partial.profile?.isLeafEndpoint ?? false,
      inventoryAllowed: partial.profile?.inventoryAllowed ?? false,
      locationRole: partial.profile?.locationRole,
      templateLevelId: partial.profile?.templateLevelId,
      binType: partial.profile?.binType,
      barcodeValue: partial.profile?.barcodeValue,
      qrValue: partial.profile?.qrValue,
      rfidTag: partial.profile?.rfidTag,
    },
    capacity: partial.capacity,
    storageConstraints: partial.storageConstraints,
    eligibilityPolicy: partial.eligibilityPolicy,
    eligibilityMappings: partial.eligibilityMappings,
    responsibilityAssignment: partial.responsibilityAssignment,
    effectiveResponsibility: partial.effectiveResponsibility,
    putawayBlocked: partial.putawayBlocked ?? false,
    pickingBlocked: partial.pickingBlocked ?? false,
    movementState: partial.movementState ?? 'Idle',
    commitmentState: partial.commitmentState ?? 'Uncommitted',
    stockStatuses: partial.stockStatuses ?? [],
    approval: partial.approval,
    createdAt: partial.createdAt ?? '2026-06-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-06-01T00:00:00.000Z',
    version: partial.version ?? 1,
  };
}

describe('Phase 6 capacity governance', () => {
  it('supports capacity applicability on custom Floor/Room/Shelf levels', () => {
    const floor = makeLocation({ profile: { locationType: 'General', templateLevelCode: 'FLOOR', level: 1, fullCode: 'WH-PUNE-01-F01', isLeafEndpoint: false, inventoryAllowed: false } });
    const room = makeLocation({ id: 'LOC-2', parentLocationId: 'LOC-1', profile: { locationType: 'General', templateLevelCode: 'ROOM', level: 2, fullCode: 'WH-PUNE-01-F01-R01', isLeafEndpoint: false, inventoryAllowed: false } });
    const shelf = makeLocation({ id: 'LOC-3', parentLocationId: 'LOC-2', profile: { locationType: 'Shelf', templateLevelCode: 'SHELF', level: 3, fullCode: 'WH-PUNE-01-F01-R01-S01', isLeafEndpoint: true, inventoryAllowed: true } });

    expect(deriveCapacityApplicability(floor, CUSTOM_HIERARCHY_TEMPLATE)).toBe(true);
    expect(deriveCapacityApplicability(room, CUSTOM_HIERARCHY_TEMPLATE)).toBe(true);
    expect(deriveCapacityApplicability(shelf, CUSTOM_HIERARCHY_TEMPLATE)).toBe(true);
  });

  it('returns not-applicable controls for non-capacity level', () => {
    const nonCapacityTemplate: HierarchyTemplate = {
      ...CUSTOM_HIERARCHY_TEMPLATE,
      levels: CUSTOM_HIERARCHY_TEMPLATE.levels.map((level) =>
        level.levelCode === 'ROOM' ? { ...level, capacityApplicable: false } : level,
      ),
    };
    const room = makeLocation({ profile: { locationType: 'General', templateLevelCode: 'ROOM', level: 2, fullCode: 'WH-PUNE-01-F01-R01', isLeafEndpoint: false, inventoryAllowed: false } });
    expect(deriveCapacityApplicability(room, nonCapacityTemplate)).toBe(false);
    const actions = buildInspectorActionStates(room, true, {
      capacityApplicable: false,
      itemEligibilityApplicable: false,
      responsibilityApplicable: false,
      barcodeApplicable: false,
      qrApplicable: false,
      transactionPurposes: [],
    });
    expect(actions.find((item) => item.key === 'manage-capacity')?.reason).toContain('not applicable');
  });

  it('uses informational warehouse default policy and supports hard-block and approval-required modes', () => {
    const warehouse: Warehouse = {
      ...WH_BIN_LEVEL_ACTIVE,
      capacityPolicy: {
        ...WH_BIN_LEVEL_ACTIVE.capacityPolicy,
        trackingEnabled: true,
        defaultEnforcementMode: 'Informational',
        defaultRollupMode: 'OwnCapacityOnly',
        warningThresholdPercent: 80,
      },
    };
    const node = makeLocation({
      profile: { locationType: 'Shelf', templateLevelCode: 'SHELF', level: 3, fullCode: 'WH-PUNE-01-F01-R01-S01', isLeafEndpoint: true, inventoryAllowed: true },
      capacity: { maxUnits: 100, currentUnits: 120, reservedUnits: 0, enforcementMode: 'HardBlock' },
    });
    const policy = deriveEffectiveCapacityPolicy(warehouse, node, CUSTOM_HIERARCHY_TEMPLATE);
    expect(policy.enforcementMode).toBe('HardBlock');
    const projectedBlocked = evaluateCapacityForProjectedPosting({ warehouse, targetNode: node, allLocations: [node], activeTemplate: CUSTOM_HIERARCHY_TEMPLATE, quantity: 1 });
    expect(projectedBlocked.blocked).toBe(true);

    const approvalNode = { ...node, id: 'LOC-4', capacity: { ...node.capacity, enforcementMode: 'ApprovalRequired' as const } };
    const projectedApproval = evaluateCapacityForProjectedPosting({ warehouse, targetNode: approvalNode, allLocations: [approvalNode], activeTemplate: CUSTOM_HIERARCHY_TEMPLATE, quantity: 1 });
    expect(projectedApproval.approvalRequired).toBe(true);
  });

  it('rolls up child usage and validates max/current/reserved/negative constraints', () => {
    const warehouse = WH_BIN_LEVEL_ACTIVE;
    const parent = makeLocation({
      id: 'P1',
      profile: { locationType: 'General', templateLevelCode: 'FLOOR', level: 1, fullCode: 'WH-PUNE-01-F01', isLeafEndpoint: false, inventoryAllowed: false },
      capacity: { maxUnits: 200, currentUnits: 10, reservedUnits: 5, rollupMode: 'RollupFromChildren' },
    });
    const child = makeLocation({
      id: 'C1',
      parentLocationId: 'P1',
      profile: { locationType: 'Shelf', templateLevelCode: 'SHELF', level: 2, fullCode: 'WH-PUNE-01-F01-S01', isLeafEndpoint: true, inventoryAllowed: true },
      capacity: { maxUnits: 80, currentUnits: 40, reservedUnits: 10 },
    });
    const rollup = deriveCapacityRollup(parent, [parent, child], warehouse, CUSTOM_HIERARCHY_TEMPLATE);
    expect(rollup.totalUsage.currentUnits).toBeGreaterThanOrEqual(50);

    const invalid = validateLocationCapacityForUpdate(parent, warehouse, [parent, child], { maxUnits: -1 }, CUSTOM_HIERARCHY_TEMPLATE);
    expect(invalid.some((issue) => issue.message.toLowerCase().includes('negative'))).toBe(true);

    const belowCurrent = validateLocationCapacityForUpdate(parent, warehouse, [parent, child], { maxUnits: 2, currentUnits: 10 }, CUSTOM_HIERARCHY_TEMPLATE);
    expect(belowCurrent.some((issue) => issue.message.includes('current units'))).toBe(true);

    const belowReserved = validateLocationCapacityForUpdate(parent, warehouse, [parent, child], { maxUnits: 2, reservedUnits: 8 }, CUSTOM_HIERARCHY_TEMPLATE);
    expect(belowReserved.some((issue) => issue.message.includes('reserved units'))).toBe(true);
  });

  it('applies restrictive parent-child constraints and validates temperature ranges', () => {
    const warehouse: Warehouse = {
      ...WH_BIN_LEVEL_ACTIVE,
      storageConstraints: {
        temperatureZone: 'Ambient',
        hazardAllowed: true,
        allowMixedItemStorage: true,
        allowMixedLotStorage: true,
        allowMixedOwnerStorage: true,
      },
    };
    const parent = makeLocation({ id: 'P2', storageConstraints: { hazardAllowed: false, maxTempCelsius: 4, minTempCelsius: 1 } });
    const child = makeLocation({ id: 'C2', parentLocationId: 'P2', storageConstraints: { hazardAllowed: true, maxTempCelsius: 10, minTempCelsius: -1 } });
    const effective = deriveEffectiveStorageConstraints(child, [parent, child], warehouse);
    expect(effective.hazardAllowed).toBe(false);
    expect((effective.maxTempCelsius ?? 0) <= 4).toBe(true);

    const policyIssues = validateCapacityPolicy(
      { trackingEnabled: true },
      { minTempCelsius: 10, maxTempCelsius: 2 },
      'location',
      'Location-BIN-Level',
    );
    expect(policyIssues.some((issue) => issue.message.toLowerCase().includes('temperature'))).toBe(true);
  });

  it('updates capacity tree/list/activation helpers with issue visibility', () => {
    const warehouse = WH_BIN_LEVEL_ACTIVE;
    const endpoint = makeLocation({
      id: 'E1',
      locationCode: 'S01',
      profile: { locationType: 'Shelf', templateLevelCode: 'SHELF', level: 3, fullCode: 'WH-PUNE-01-F01-R01-S01', isLeafEndpoint: true, inventoryAllowed: true },
      capacity: { maxUnits: 100, currentUnits: 120, reservedUnits: 0, enforcementMode: 'HardBlock' },
    });
    const node: HierarchyNode = {
      id: endpoint.id,
      locationId: endpoint.id,
      locationCode: endpoint.locationCode,
      locationName: endpoint.locationName,
      levelCode: 'SHELF',
      levelName: 'Shelf',
      parentId: endpoint.parentLocationId,
      children: [],
      isLeaf: true,
      inventoryAllowed: endpoint.profile.inventoryAllowed,
      status: endpoint.status,
      fullCode: endpoint.profile.fullCode,
      capabilitySummary: {
        capacityApplicable: true,
        capacityStatus: 'Exceeded',
        capacityHardBlocked: true,
      },
    };
    expect(getHierarchyNodeModeMatch(node, 'Capacity View', false)).toBe(true);

    const rows = filterLocationRows(
      warehouse,
      CUSTOM_HIERARCHY_TEMPLATE,
      [endpoint],
      warehouse.status,
      '',
      {
        level: '',
        levelRole: '',
        parentId: '',
        locationType: '',
        binType: '',
        status: '',
        inventoryAllowed: '',
        capacityWarning: '',
        capacityApplicable: 'yes',
        capacityStatus: 'Exceeded',
        hardBlock: 'yes',
        approvalRequired: '',
        putawayBlocked: '',
        pickingBlocked: '',
        eligibilityMode: '',
        issuesOnly: '',
        identifierIssues: '',
      },
    );
    expect(rows).toHaveLength(1);

    const activationIssues = validateWarehouseForActivation(warehouse, [CUSTOM_HIERARCHY_TEMPLATE], [endpoint]);
    expect(activationIssues.some((issue) => issue.message.includes('Capacity exceeded'))).toBe(true);
    expect(deriveCapacityStatus(endpoint, [endpoint], warehouse, CUSTOM_HIERARCHY_TEMPLATE)).toBe('Exceeded');
  });
});
