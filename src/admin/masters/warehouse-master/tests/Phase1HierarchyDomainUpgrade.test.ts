import { beforeEach, describe, expect, it } from 'vitest';

import {
  CUSTOM_HIERARCHY_TEMPLATE,
  MOCK_RESPONSIBLE_EMPLOYEES,
  SIMPLE_ROOT_BIN_TEMPLATE,
  WH_BIN_LEVEL_ACTIVE,
} from '../fixtures/warehouseFixtures';
import {
  __resetMockStores,
  createHierarchyTemplateMock,
  activateHierarchyTemplateMock,
  updateHierarchyTemplateStatusMock,
  warehouseMockAdapter,
} from '../services/warehouseMockAdapter';
import type {
  HierarchyTemplate,
  ItemEligibilityMapping,
  WarehouseLocation,
} from '../types/warehouse.types';
import {
  deriveEffectiveCapacityPolicy,
  explainChildLevelAllowance,
  getAllowedChildLevels,
  getTemplateLevelByCode,
} from '../utils/hierarchyUtils';
import {
  deriveEffectiveResponsibility,
  deriveEffectiveResponsibleEmployee,
  deriveInventoryAllowed,
  deriveInventoryEndpointEligible,
  deriveIsLeafEndpoint,
  deriveResponsibilitySource,
} from '../utils/warehouseDerivations';
import {
  validateEligibilityMappingUniqueness,
  validateLocationForSave,
  validateResponsibilityAssignment,
} from '../validation/locationValidation';
import { validateWarehouseForSave } from '../validation/warehouseValidation';

describe('Phase 1 ownership normalization', () => {
  it('branch-level warehouse with one owning branch passes', () => {
    const errors = validateWarehouseForSave({
      warehouseCode: 'WH-BR-01',
      warehouseName: 'Branch Warehouse',
      ownershipScope: 'Branch',
      owningBranchCode: 'BR-PUNE',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
      branchOwnershipRows: [
        {
          branchCode: 'BR-PUNE',
          businessUnit: 'BU-PUNE',
          legalEntityCode: 'LE-PUNE',
          inventoryOwnerCode: 'INV-PUNE',
        },
      ],
    }, []);

    expect(Object.values(errors).filter(Boolean)).toHaveLength(0);
  });

  it('branch-level warehouse with multiple owning branches fails', () => {
    const errors = validateWarehouseForSave({
      warehouseCode: 'WH-BR-02',
      warehouseName: 'Branch Warehouse',
      ownershipScope: 'Branch',
      owningBranchCode: 'BR-PUNE',
      owningBranchCodes: ['BR-PUNE', 'BR-MUM'],
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    }, []);

    expect(errors.owningBranchCodes).toContain('only one owning branch');
  });

  it('organization-level warehouse can have multiple shared branches', async () => {
    __resetMockStores();
    const details = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-ORG-01',
      warehouseName: 'Org Shared Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-ORG',
      legalEntityCode: 'LE-ORG',
      inventoryOwnerCode: 'INV-ORG',
      sharedBranchCodes: ['BR-PUNE', 'BR-MUM', 'BR-DEL'],
      warehouseType: 'Physical',
      wmsEnabled: false,
      inventoryControlMode: 'Warehouse-Level',
    });

    expect(details.warehouse.assignmentProfile.assignments).toHaveLength(3);
  });
});

describe('Phase 1 generic hierarchy domain', () => {
  const customTemplate: HierarchyTemplate = CUSTOM_HIERARCHY_TEMPLATE;

  it('arbitrary hierarchy level names are valid', () => {
    expect(customTemplate.levels.map((level) => level.levelCode)).toEqual(['FLOOR', 'ROOM', 'SHELF']);
  });

  it('Warehouse -> Floor -> Room -> Shelf validates when template allows it', () => {
    const floorLevel = getAllowedChildLevels(null, customTemplate).map((level) => level.levelCode);
    expect(floorLevel).toContain('FLOOR');

    const floorLocation: WarehouseLocation = {
      id: 'LOC-FLOOR',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'F01',
      locationName: 'Floor 01',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelId: 'LVL-FLOOR',
        templateLevelCode: 'FLOOR',
        locationRole: 'Structural',
        level: 1,
        fullCode: 'WM02-F01',
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

    const roomAllowance = explainChildLevelAllowance(floorLocation, 'ROOM', customTemplate);
    expect(roomAllowance.allowed).toBe(true);
  });

  it('invalid parent-child combination fails', () => {
    const floorLocation: WarehouseLocation = {
      id: 'LOC-FLOOR',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'F01',
      locationName: 'Floor 01',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelId: 'LVL-FLOOR',
        templateLevelCode: 'FLOOR',
        locationRole: 'Structural',
        level: 1,
        fullCode: 'WM02-F01',
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

    const roomAllowance = explainChildLevelAllowance(floorLocation, 'BIN', customTemplate);
    expect(roomAllowance.allowed).toBe(false);
  });

  it('leaf endpoint derivation works for custom level names', () => {
    const shelf: WarehouseLocation = {
      id: 'LOC-SHELF',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'SH01',
      locationName: 'Shelf 01',
      parentLocationId: 'LOC-ROOM',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelId: 'LVL-SHELF-CUSTOM',
        templateLevelCode: 'SHELF',
        locationRole: 'InventoryEndpoint',
        level: 3,
        fullCode: 'WM02-F01-RM01-SH01',
        isLeafEndpoint: true,
        inventoryAllowed: true,
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

    expect(deriveIsLeafEndpoint(shelf.id, [shelf], customTemplate)).toBe(true);
  });

  it('inventory endpoint eligibility is capability-driven', () => {
    const shelf: WarehouseLocation = {
      id: 'LOC-SHELF',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'SH01',
      locationName: 'Shelf 01',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelId: 'LVL-SHELF-CUSTOM',
        templateLevelCode: 'SHELF',
        locationRole: 'InventoryEndpoint',
        level: 3,
        fullCode: 'WM02-F01-RM01-SH01',
        isLeafEndpoint: true,
        inventoryAllowed: true,
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

    expect(deriveInventoryEndpointEligible(shelf, customTemplate)).toBe(true);
    expect(deriveInventoryAllowed(shelf, [shelf], customTemplate)).toBe(true);
  });
});

describe('Phase 1 full identifier derivation', () => {
  const warehouseCode = 'WM02';

  it('derives WM02-B01', async () => {
    __resetMockStores();
    const details = await warehouseMockAdapter.createWarehouse({
      warehouseCode,
      warehouseName: 'Root BIN Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-ORG',
      legalEntityCode: 'LE-ORG',
      inventoryOwnerCode: 'INV-ORG',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const template = await createHierarchyTemplateMock({
      warehouseId: details.warehouse.id,
      templateCode: SIMPLE_ROOT_BIN_TEMPLATE.templateCode,
      templateName: SIMPLE_ROOT_BIN_TEMPLATE.templateName,
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: SIMPLE_ROOT_BIN_TEMPLATE.levels,
    });
    await activateHierarchyTemplateMock(details.warehouse.id, template.id);

    const bin = await warehouseMockAdapter.createLocation(details.warehouse.id, {
      warehouseId: details.warehouse.id,
      templateLevelCode: 'BIN',
      locationType: 'BIN',
      locationCode: 'B01',
      locationName: 'BIN 01',
    });

    expect(bin.profile.fullCode).toBe('WM02-B01');
  });

  it('derives WM02-Z01-B01', () => {
    const zone: WarehouseLocation = {
      id: 'LOC-Z01',
      warehouseId: 'WH-TEST',
      locationCode: 'Z01',
      locationName: 'Zone 01',
      status: 'Active',
      profile: {
        locationType: 'Zone',
        templateLevelCode: 'ZONE',
        locationRole: 'Structural',
        level: 1,
        fullCode: 'WM02-Z01',
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
    const candidateErrors = validateLocationForSave(
      {
        warehouseId: WH_BIN_LEVEL_ACTIVE.id,
        parentLocationId: zone.id,
        templateLevelCode: 'BIN',
        locationType: 'BIN',
        locationCode: 'B01',
        locationName: 'BIN 01',
      },
      { ...WH_BIN_LEVEL_ACTIVE, warehouseCode },
      [zone],
      SIMPLE_ROOT_BIN_TEMPLATE,
    );

    expect(candidateErrors.locationCode).toBeUndefined();
  });

  it('duplicate full identifier fails', () => {
    const shelfLocation: WarehouseLocation = {
      id: 'LOC-SHELF',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'SH01',
      locationName: 'Shelf 01',
      parentLocationId: 'LOC-ROOM',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelCode: 'SHELF',
        locationRole: 'InventoryEndpoint',
        level: 3,
        fullCode: 'WM02-F01-RM01-SH01',
        isLeafEndpoint: true,
        inventoryAllowed: true,
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

    const errors = validateLocationForSave(
      {
        warehouseId: 'WH-CUSTOM-0001',
        parentLocationId: 'LOC-ROOM',
        templateLevelCode: 'SHELF',
        locationType: 'General',
        locationCode: 'SH01',
        locationName: 'Shelf 01 copy',
      },
      { ...WH_BIN_LEVEL_ACTIVE, id: 'WH-CUSTOM-0001', warehouseCode },
      [shelfLocation],
      CUSTOM_HIERARCHY_TEMPLATE,
    );

    expect(errors.locationCode).toContain('already exists');
  });
});

describe('Phase 1 capacity, eligibility, and responsibility', () => {
  it('capacity can be applicable at any configured level', () => {
    const floorLevel = getTemplateLevelByCode(CUSTOM_HIERARCHY_TEMPLATE, 'FLOOR');
    const policy = deriveEffectiveCapacityPolicy(CUSTOM_HIERARCHY_TEMPLATE, floorLevel);
    expect(policy.applicable).toBe(true);
    expect(policy.enforcementMode).toBe('Warning');
  });

  it('capacity disabled level does not expose capacity policy', () => {
    const zoneLevel = getTemplateLevelByCode(CUSTOM_HIERARCHY_TEMPLATE, 'FLOOR');
    const policy = deriveEffectiveCapacityPolicy(undefined, {
      ...zoneLevel!,
      capacityApplicable: false,
      capacityEnforcementMode: 'None',
      capacityRollupMode: 'None',
    });
    expect(policy.applicable).toBe(false);
  });

  it('same item in different scopes is allowed', () => {
    const mappings: ItemEligibilityMapping[] = [
      {
        id: 'MAP-1',
        warehouseId: 'WH-TEST',
        scopeType: 'HierarchyNode',
        scopeId: 'LOC-A',
        scopeLabel: 'Node A',
        subjectType: 'Item',
        subjectCode: 'ITEM-1',
        ruleDirection: 'Allow',
        effectiveFrom: '2026-06-01',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const issues = validateEligibilityMappingUniqueness(mappings, {
      id: 'MAP-2',
      warehouseId: 'WH-TEST',
      scopeType: 'HierarchyNode',
      scopeId: 'LOC-B',
      scopeLabel: 'Node B',
      subjectType: 'Item',
      subjectCode: 'ITEM-1',
      ruleDirection: 'Allow',
      effectiveFrom: '2026-06-01',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    expect(issues).toHaveLength(0);
  });

  it('same item/same scope/same direction/overlapping period fails', () => {
    const mappings: ItemEligibilityMapping[] = [
      {
        id: 'MAP-1',
        warehouseId: 'WH-TEST',
        scopeType: 'HierarchyNode',
        scopeId: 'LOC-A',
        scopeLabel: 'Node A',
        subjectType: 'Item',
        subjectCode: 'ITEM-1',
        ruleDirection: 'Allow',
        effectiveFrom: '2026-06-01',
        effectiveTo: '2026-06-30',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      },
    ];

    const issues = validateEligibilityMappingUniqueness(mappings, {
      id: 'MAP-2',
      warehouseId: 'WH-TEST',
      scopeType: 'HierarchyNode',
      scopeId: 'LOC-A',
      scopeLabel: 'Node A',
      subjectType: 'Item',
      subjectCode: 'ITEM-1',
      ruleDirection: 'Allow',
      effectiveFrom: '2026-06-15',
      createdAt: '2026-06-15T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
    });

    expect(issues).toHaveLength(1);
  });

  it('direct assignment derives effective employee and remains separate from inventory owner', () => {
    const shelf: WarehouseLocation = {
      id: 'LOC-SHELF',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'SH01',
      locationName: 'Shelf 01',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelCode: 'SHELF',
        locationRole: 'InventoryEndpoint',
        level: 3,
        fullCode: 'WM02-F01-RM01-SH01',
        isLeafEndpoint: true,
        inventoryAllowed: true,
      },
      responsibilityAssignment: {
        mode: 'AssignDirectly',
        role: 'RackCustodian',
        employee: MOCK_RESPONSIBLE_EMPLOYEES[2],
        effectiveFrom: '2026-06-01',
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

    expect(deriveEffectiveResponsibleEmployee(shelf, [shelf])?.employeeCode).toBe('EMP-SHF-001');
    expect(deriveEffectiveResponsibility(shelf, [shelf]).employee?.employeeCode).toBe('EMP-SHF-001');
    expect(WH_BIN_LEVEL_ACTIVE.assignmentProfile.inventoryOwner?.ownerCode).not.toBe('EMP-SHF-001');
  });

  it('inherited responsibility derives nearest parent employee', () => {
    const floor: WarehouseLocation = {
      id: 'LOC-FLOOR',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'F01',
      locationName: 'Floor 01',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelCode: 'FLOOR',
        locationRole: 'Structural',
        level: 1,
        fullCode: 'WM02-F01',
        isLeafEndpoint: false,
        inventoryAllowed: false,
      },
      responsibilityAssignment: {
        mode: 'AssignDirectly',
        role: 'AreaSupervisor',
        employee: MOCK_RESPONSIBLE_EMPLOYEES[0],
        effectiveFrom: '2026-06-01',
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
    const room: WarehouseLocation = {
      id: 'LOC-ROOM',
      warehouseId: 'WH-CUSTOM-0001',
      locationCode: 'RM01',
      locationName: 'Room 01',
      parentLocationId: 'LOC-FLOOR',
      status: 'Active',
      profile: {
        locationType: 'General',
        templateLevelCode: 'ROOM',
        locationRole: 'Custom',
        level: 2,
        fullCode: 'WM02-F01-RM01',
        isLeafEndpoint: false,
        inventoryAllowed: false,
      },
      responsibilityAssignment: {
        mode: 'InheritFromParent',
        role: 'AreaSupervisor',
        effectiveFrom: '2026-06-01',
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

    expect(deriveResponsibilitySource(room, [floor, room])).toBe('Inherited');
    expect(deriveEffectiveResponsibleEmployee(room, [floor, room])?.employeeCode).toBe('EMP-FLR-001');
  });

  it('effective-date validation catches invalid responsibility ranges', () => {
    const issues = validateResponsibilityAssignment({
      mode: 'AssignDirectly',
      role: 'WarehouseManager',
      employee: MOCK_RESPONSIBLE_EMPLOYEES[0],
      effectiveFrom: '2026-06-10',
      effectiveTo: '2026-06-01',
    });

    expect(issues).toHaveLength(1);
  });
});

describe('Phase 2 hierarchy template lifecycle', () => {
  it('keeps exactly one active version when a new template is activated', async () => {
    __resetMockStores();

    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-PH2-001',
      warehouseName: 'Phase 2 Lifecycle Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-01',
      legalEntityCode: 'LE-01',
      inventoryOwnerCode: 'INV-01',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const firstTemplate = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'PH2-TPL',
      templateName: 'Version 1',
      templateSource: 'UserDefined',
      templateScope: 'Warehouse',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: SIMPLE_ROOT_BIN_TEMPLATE.levels,
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, firstTemplate.id);

    const secondTemplate = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'PH2-TPL',
      templateName: 'Version 2',
      templateSource: 'UserDefined',
      templateScope: 'Warehouse',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-09',
      levels: SIMPLE_ROOT_BIN_TEMPLATE.levels,
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, secondTemplate.id);

    const details = await warehouseMockAdapter.getWarehouse(createdWarehouse.warehouse.id);
    const activeTemplates = details.hierarchyTemplates.filter((template) => template.status === 'Active');
    const supersededTemplates = details.hierarchyTemplates.filter((template) => template.status === 'Superseded');

    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].id).toBe(secondTemplate.id);
    expect(supersededTemplates.some((template) => template.id === firstTemplate.id)).toBe(true);
  });

  it('requires reason when setting template to blocked', async () => {
    __resetMockStores();

    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-PH2-002',
      warehouseName: 'Phase 2 Block Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-01',
      legalEntityCode: 'LE-01',
      inventoryOwnerCode: 'INV-01',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const template = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'PH2-BLK',
      templateName: 'Block Test',
      templateSource: 'UserDefined',
      templateScope: 'Warehouse',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: SIMPLE_ROOT_BIN_TEMPLATE.levels,
    });

    await expect(updateHierarchyTemplateStatusMock(createdWarehouse.warehouse.id, template.id, 'Blocked')).rejects.toThrow('Reason is required');
  });

  it('blocks inactivation of active template when dependency nodes exist', async () => {
    __resetMockStores();

    const createdWarehouse = await warehouseMockAdapter.createWarehouse({
      warehouseCode: 'WH-PH2-003',
      warehouseName: 'Phase 2 Dependency Lock Warehouse',
      ownershipScope: 'Organization',
      owningOrgCode: 'ORG-001',
      businessUnit: 'BU-01',
      legalEntityCode: 'LE-01',
      inventoryOwnerCode: 'INV-01',
      warehouseType: 'Physical',
      wmsEnabled: true,
      inventoryControlMode: 'Location-BIN-Level',
    });

    const template = await createHierarchyTemplateMock({
      warehouseId: createdWarehouse.warehouse.id,
      templateCode: 'PH2-LOCK',
      templateName: 'Lock Test',
      templateSource: 'UserDefined',
      templateScope: 'Warehouse',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-08',
      levels: SIMPLE_ROOT_BIN_TEMPLATE.levels,
    });
    await activateHierarchyTemplateMock(createdWarehouse.warehouse.id, template.id);

    await warehouseMockAdapter.createLocation(createdWarehouse.warehouse.id, {
      warehouseId: createdWarehouse.warehouse.id,
      locationCode: 'B01',
      locationName: 'BIN 01',
      locationType: 'BIN',
      binType: 'Standard',
    });

    await expect(updateHierarchyTemplateStatusMock(createdWarehouse.warehouse.id, template.id, 'Inactive')).rejects.toThrow('dependent hierarchy nodes');
  });
});
