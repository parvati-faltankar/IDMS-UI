// ─── Warehouse Master — Unit Tests ───────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import {
  deriveBinManaged,
  deriveInventoryControlRules,
  deriveInventoryAllowed,
  deriveIsLeafEndpoint,
  deriveSetupHealth,
  deriveAvailableActions,
  deriveEffectiveLocationStatus,
  evaluateCapacityState,
  evaluateConfigurationImpact,
  evaluateLocationEligibility,
} from '../utils/warehouseDerivations';
import {
  getAllowedWarehouseTransitions,
  getAllowedLocationTransitions,
  getWarehouseTransitionInfo,
  getLocationTransitionInfo,
  evaluateModeChangeEligibility,
  evaluatePreconditions,
} from '../utils/warehouseStatusRules';
import {
  buildLevelGeneratedCodeExample,
  buildTemplateIdentifierExamples,
  buildTemplatePathPreviews,
  validateTemplateLevelTree,
  isCircularHierarchy,
  buildFullLocationCode,
} from '../utils/hierarchyUtils';
import { resolveEligibility, resolveReservationLevel, detectPolicyConflicts, SOURCE_PRIORITY } from '../utils/rulePrecedence';
import { validateWarehouseForActivation } from '../validation/activationValidation';
import { validateWarehouseForSave } from '../validation/warehouseValidation';
import { validateLocationForSave } from '../validation/locationValidation';
import { validateHierarchyTemplateForSave } from '../validation/hierarchyValidation';
import { validateHierarchyTemplateLifecycleAction } from '../validation/hierarchyValidation';
import { mockAllPermissions, readOnlyPermissions } from '../types/warehouse.permissions';
import {
  WH_WAREHOUSE_LEVEL_ACTIVE,
  WH_BIN_LEVEL_ACTIVE,
  WH_BIN_LEVEL_DRAFT_BLOCKED,
  WH_BLOCKED,
  SEED_HIERARCHY_TEMPLATES,
  SEED_LOCATIONS,
} from '../fixtures/warehouseFixtures';
import { __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';

import type { EligibilityPolicy, WarehouseLocation, Warehouse, HierarchyTemplate } from '../types/warehouse.types';
import type { SetupHealth } from '../types/warehouse.types';
import type { RuleEntry } from '../utils/rulePrecedence';

// ─── deriveBinManaged ─────────────────────────────────────────────────────────

describe('deriveBinManaged', () => {
  it('returns true for Location-BIN-Level', () => {
    expect(deriveBinManaged('Location-BIN-Level')).toBe(true);
  });

  it('returns false for Warehouse-Level', () => {
    expect(deriveBinManaged('Warehouse-Level')).toBe(false);
  });
});

// ─── deriveInventoryControlRules ─────────────────────────────────────────────

describe('deriveInventoryControlRules', () => {
  it('Warehouse-Level: binManaged=false, allowWarehouseLevelPosting=true, allowBinToBin=false', () => {
    const rules = deriveInventoryControlRules('Warehouse-Level');
    expect(rules.binManaged).toBe(false);
    expect(rules.allowWarehouseLevelPosting).toBe(true);
    expect(rules.requireLocationForGRN).toBe(false);
    expect(rules.allowBinToBinTransfer).toBe(false);
  });

  it('Location-BIN-Level: binManaged=true, allowBinToBin=true, requireLocation=true', () => {
    const rules = deriveInventoryControlRules('Location-BIN-Level');
    expect(rules.binManaged).toBe(true);
    expect(rules.allowWarehouseLevelPosting).toBe(false);
    expect(rules.requireLocationForGRN).toBe(true);
    expect(rules.requireLocationForIssue).toBe(true);
    expect(rules.allowBinToBinTransfer).toBe(true);
  });
});

// ─── deriveInventoryAllowed ───────────────────────────────────────────────────

describe('deriveInventoryAllowed', () => {
  const baseLocation: WarehouseLocation = {
    id: 'L1',
    warehouseId: 'W1',
    locationCode: 'B01',
    locationName: 'BIN 01',
    status: 'Active',
    profile: {
      locationType: 'BIN',
      level: 1,
      fullCode: 'W1-B01',
      isLeafEndpoint: true,
      inventoryAllowed: true,
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

  it('Active leaf with putaway allowed → inventoryAllowed = true', () => {
    expect(deriveInventoryAllowed(baseLocation, [baseLocation])).toBe(true);
  });

  it('Draft location → inventoryAllowed = false', () => {
    const draft = { ...baseLocation, status: 'Draft' as const };
    expect(deriveInventoryAllowed(draft, [draft])).toBe(false);
  });

  it('putawayBlocked=true → inventoryAllowed = false', () => {
    const blocked = { ...baseLocation, putawayBlocked: true };
    expect(deriveInventoryAllowed(blocked, [baseLocation, blocked])).toBe(false);
  });

  it('Non-leaf with no flexible path → inventoryAllowed = false', () => {
    const parent: WarehouseLocation = {
      ...baseLocation,
      id: 'P1',
      locationCode: 'Z01',
      profile: { ...baseLocation.profile, level: 1, isLeafEndpoint: false, inventoryAllowed: false },
    };
    const child: WarehouseLocation = { ...baseLocation, id: 'C1', parentLocationId: 'P1' };
    expect(deriveInventoryAllowed(parent, [parent, child])).toBe(false);
  });

  it('Parent Blocked → child inventoryAllowed = false', () => {
    const blockedParent: WarehouseLocation = {
      ...baseLocation,
      id: 'P1',
      locationCode: 'Z01',
      status: 'Blocked',
      profile: { ...baseLocation.profile, level: 1, isLeafEndpoint: false, inventoryAllowed: false },
    };
    const child: WarehouseLocation = { ...baseLocation, id: 'C1', parentLocationId: 'P1' };
    expect(deriveInventoryAllowed(child, [blockedParent, child])).toBe(false);
  });
});

// ─── deriveEffectiveLocationStatus ───────────────────────────────────────────

describe('deriveEffectiveLocationStatus', () => {
  it('Active location in Active warehouse → Active', () => {
    expect(deriveEffectiveLocationStatus('Active', 'Active')).toBe('Active');
  });

  it('Active location in Blocked warehouse → Blocked', () => {
    expect(deriveEffectiveLocationStatus('Active', 'Blocked')).toBe('Blocked');
  });

  it('Active location in Inactive warehouse → Inactive', () => {
    expect(deriveEffectiveLocationStatus('Active', 'Inactive')).toBe('Inactive');
  });

  it('Draft location in Active warehouse → Draft', () => {
    expect(deriveEffectiveLocationStatus('Draft', 'Active')).toBe('Draft');
  });

  it('Blocked location in Active warehouse → Blocked', () => {
    expect(deriveEffectiveLocationStatus('Blocked', 'Active')).toBe('Blocked');
  });
});

// ─── deriveSetupHealth ────────────────────────────────────────────────────────

describe('deriveSetupHealth', () => {
  it('empty warehouse → overall empty, not ready for activation', () => {
    const health = deriveSetupHealth({}, [], []);
    expect(health.readyForActivation).toBe(false);
    expect(health.overallTone).toBe('empty');
    expect(health.blockingIssues.length).toBeGreaterThan(0);
  });

  it('Warehouse-Level with full identity + classification → complete + ready', () => {
    const health = deriveSetupHealth(WH_WAREHOUSE_LEVEL_ACTIVE, [], []);
    expect(health.readyForActivation).toBe(true);
    expect(['complete', 'partial']).toContain(health.overallTone);
  });

  it('BIN-Level Draft without template → not ready', () => {
    const health = deriveSetupHealth(WH_BIN_LEVEL_DRAFT_BLOCKED, [], []);
    expect(health.readyForActivation).toBe(false);
    expect(health.blockingIssues.some((i) => i.category === 'DependencyMissing')).toBe(true);
  });

  it('BIN-Level with active template but no active locations → not ready', () => {
    const activeTemplate: HierarchyTemplate = {
      ...SEED_HIERARCHY_TEMPLATES[0],
      warehouseId: WH_BIN_LEVEL_DRAFT_BLOCKED.id,
      status: 'Active',
    };
    const health = deriveSetupHealth(WH_BIN_LEVEL_DRAFT_BLOCKED, [], [activeTemplate]);
    // Still blocked — no active inventory locations
    expect(health.readyForActivation).toBe(false);
  });

  it('BIN-Level with active template and active inventory location → ready', () => {
    const activeTemplate: HierarchyTemplate = {
      ...SEED_HIERARCHY_TEMPLATES[0],
      warehouseId: WH_BIN_LEVEL_DRAFT_BLOCKED.id,
      status: 'Active',
    };
    const activeLocation: WarehouseLocation = {
      ...SEED_LOCATIONS[0],
      warehouseId: WH_BIN_LEVEL_DRAFT_BLOCKED.id,
      status: 'Active',
      profile: { ...SEED_LOCATIONS[0].profile, inventoryAllowed: true },
    };
    const health = deriveSetupHealth(WH_BIN_LEVEL_DRAFT_BLOCKED, [activeLocation], [activeTemplate]);
    expect(health.readyForActivation).toBe(true);
  });
});

// ─── Warehouse status transitions ─────────────────────────────────────────────

describe('warehouse status transitions', () => {
  it('Draft → Active is allowed', () => {
    const info = getWarehouseTransitionInfo('Draft', 'Active');
    expect(info.allowed).toBe(true);
    expect(info.requiresReason).toBe(false);
  });

  it('Draft → Blocked is NOT allowed', () => {
    const info = getWarehouseTransitionInfo('Draft', 'Blocked');
    expect(info.allowed).toBe(false);
  });

  it('Active → Blocked is allowed and requires reason', () => {
    const info = getWarehouseTransitionInfo('Active', 'Blocked');
    expect(info.allowed).toBe(true);
    expect(info.requiresReason).toBe(true);
  });

  it('Active → Inactive requires approval and reason', () => {
    const info = getWarehouseTransitionInfo('Active', 'Inactive');
    expect(info.allowed).toBe(true);
    expect(info.requiresApproval).toBe(true);
    expect(info.requiresReason).toBe(true);
  });

  it('Blocked → Active is allowed', () => {
    const info = getWarehouseTransitionInfo('Blocked', 'Active');
    expect(info.allowed).toBe(true);
  });

  it('Inactive → Draft is NOT allowed', () => {
    const info = getWarehouseTransitionInfo('Inactive', 'Draft');
    expect(info.allowed).toBe(false);
  });

  it('getAllowedWarehouseTransitions returns correct set for Active', () => {
    const allowed = getAllowedWarehouseTransitions('Active');
    expect(allowed).toContain('Blocked');
    expect(allowed).toContain('Inactive');
    expect(allowed).not.toContain('Draft');
  });
});

// ─── Location status transitions ──────────────────────────────────────────────

describe('location status transitions', () => {
  it('Draft → Active is allowed', () => {
    expect(getLocationTransitionInfo('Draft', 'Active').allowed).toBe(true);
  });

  it('Draft → Blocked is NOT allowed', () => {
    expect(getLocationTransitionInfo('Draft', 'Blocked').allowed).toBe(false);
  });

  it('Active → Blocked requires reason', () => {
    const info = getLocationTransitionInfo('Active', 'Blocked');
    expect(info.allowed).toBe(true);
    expect(info.requiresReason).toBe(true);
  });

  it('Active → Inactive requires no_location_stock precondition', () => {
    const info = getLocationTransitionInfo('Active', 'Inactive');
    expect(info.preconditions).toContain('no_location_stock');
  });
});

// ─── Activation blocking ──────────────────────────────────────────────────────

describe('warehouse activation validation', () => {
  it('Active warehouse cannot be activated again', () => {
    const issues = validateWarehouseForActivation(WH_WAREHOUSE_LEVEL_ACTIVE, [], []);
    expect(issues.some((i) => i.category === 'LifecycleConstraint')).toBe(true);
  });

  it('Blocked warehouse cannot be activated', () => {
    const issues = validateWarehouseForActivation(WH_BLOCKED, [], []);
    expect(issues.some((i) => i.category === 'LifecycleConstraint')).toBe(true);
  });

  it('BIN-Level Draft without template → blocked', () => {
    const issues = validateWarehouseForActivation(WH_BIN_LEVEL_DRAFT_BLOCKED, [], []);
    expect(issues.some((i) => i.section === 'hierarchyTemplate')).toBe(true);
    expect(issues.some((i) => i.section === 'locations')).toBe(true);
  });

  it('BIN-Level Draft with template + active location → can activate', () => {
    const draftWarehouse: Warehouse = { ...WH_BIN_LEVEL_DRAFT_BLOCKED };
    const template: HierarchyTemplate = { ...SEED_HIERARCHY_TEMPLATES[0], warehouseId: draftWarehouse.id, status: 'Active' };
    const location: WarehouseLocation = {
      ...SEED_LOCATIONS[0],
      warehouseId: draftWarehouse.id,
      status: 'Active',
      profile: { ...SEED_LOCATIONS[0].profile, inventoryAllowed: true },
    };
    const issues = validateWarehouseForActivation(draftWarehouse, [template], [location]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('Warehouse-Level with autoPutaway enabled → activation blocked', () => {
    const wh: Warehouse = {
      ...WH_BIN_LEVEL_DRAFT_BLOCKED,
      inventoryControlMode: 'Warehouse-Level',
      autoPutaway: { enabled: true, strategy: 'FIFO', strategySequence: [], overrideAllowed: false },
    };
    const issues = validateWarehouseForActivation(wh, [], []);
    expect(issues.some((i) => i.field === 'autoPutaway.enabled')).toBe(true);
  });
});

// ─── Permission-based actions ─────────────────────────────────────────────────

describe('deriveAvailableActions with permissions', () => {
  const setupHealth = deriveSetupHealth(WH_WAREHOUSE_LEVEL_ACTIVE, [], []);

  it('OrgAdmin gets Activate on Draft warehouse', () => {
    const draftWarehouse = { ...WH_WAREHOUSE_LEVEL_ACTIVE, status: 'Draft' as const };
    const health = deriveSetupHealth(draftWarehouse, [], []);
    const actions = deriveAvailableActions(draftWarehouse, health, mockAllPermissions(), false, false);
    const activate = actions.find((a) => a.action === 'Activate');
    expect(activate).toBeDefined();
    expect(activate?.available).toBe(true);
  });

  it('ReadOnly user cannot activate', () => {
    const draftWarehouse = { ...WH_WAREHOUSE_LEVEL_ACTIVE, status: 'Draft' as const };
    const health = deriveSetupHealth(draftWarehouse, [], []);
    const actions = deriveAvailableActions(draftWarehouse, health, readOnlyPermissions(), false, false);
    const activate = actions.find((a) => a.action === 'Activate');
    expect(activate?.available).toBe(false);
  });

  it('Active warehouse exposes Block action for OrgAdmin', () => {
    const actions = deriveAvailableActions(WH_WAREHOUSE_LEVEL_ACTIVE, setupHealth, mockAllPermissions(), false, false);
    const block = actions.find((a) => a.action === 'Block');
    expect(block?.available).toBe(true);
  });

  it('Inactivate blocked when open stock exists', () => {
    const actions = deriveAvailableActions(
      WH_WAREHOUSE_LEVEL_ACTIVE,
      setupHealth,
      mockAllPermissions(),
      true, // hasOpenStock
      false,
    );
    const inactivate = actions.find((a) => a.action === 'Inactivate');
    expect(inactivate?.available).toBe(false);
    expect(inactivate?.blockedBy?.length).toBeGreaterThan(0);
  });
});

// ─── Bulk preview validation ──────────────────────────────────────────────────

describe('bulk preview', () => {
  beforeEach(() => __resetMockStores());

  it('generates correct number of preview rows', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      locationType: 'BIN',
      codePrefix: 'TEST',
      namePrefix: 'Test BIN',
      startSequence: 1,
      count: 5,
      sequenceLength: 3,
      idempotencyKey: 'IDEM-001',
    });
    expect(preview.rows).toHaveLength(5);
    expect(preview.totalRows).toBe(5);
  });

  it('detects conflicts with existing location codes', async () => {
    // B001 and B002 already exist in WH-0002
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      templateLevelCode: 'BIN',
      locationType: 'BIN',
      codePrefix: 'B',
      namePrefix: 'BIN',
      startSequence: 1,
      count: 3,
      sequenceLength: 3,
      idempotencyKey: 'IDEM-002',
    });
    const conflicted = preview.rows.filter((r) => r.conflict);
    expect(conflicted.length).toBeGreaterThan(0);
  });

  it('generates correct sequential codes', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      locationType: 'BIN',
      codePrefix: 'XBN',
      namePrefix: 'Extra BIN',
      startSequence: 10,
      count: 3,
      sequenceLength: 3,
      idempotencyKey: 'IDEM-003',
    });
    expect(preview.rows[0].proposedCode).toBe('XBN010');
    expect(preview.rows[1].proposedCode).toBe('XBN011');
    expect(preview.rows[2].proposedCode).toBe('XBN012');
  });
});

// ─── Rule precedence ──────────────────────────────────────────────────────────

describe('rule precedence — most restrictive wins', () => {
  const openPolicy: EligibilityPolicy = { mode: 'Open', rules: [], defaultFallback: 'Allow' };
  const restrictedPolicy: EligibilityPolicy = {
    mode: 'Restricted',
    rules: [{ ruleId: 'R1', ruleType: 'ItemCode', ruleValue: 'ITEM-A', allowedOrBlocked: 'Allowed' }],
    defaultFallback: 'Block',
  };
  const blockingPolicy: EligibilityPolicy = {
    mode: 'Advanced-Hybrid',
    rules: [{ ruleId: 'R2', ruleType: 'ItemCode', ruleValue: 'ITEM-A', allowedOrBlocked: 'Blocked' }],
    defaultFallback: 'Allow',
  };

  it('Open warehouse + Open location → eligible', () => {
    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'warehouse', rule: openPolicy, priority: SOURCE_PRIORITY['warehouse'] },
      { source: 'location', rule: openPolicy, priority: SOURCE_PRIORITY['location'] },
    ];
    expect(resolveEligibility('ITEM-A', 'CAT-X', entries).eligible).toBe(true);
  });

  it('Blocking location rule overrides allowing warehouse rule', () => {
    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'warehouse', rule: openPolicy, priority: SOURCE_PRIORITY['warehouse'] },
      { source: 'location', rule: blockingPolicy, priority: SOURCE_PRIORITY['location'] },
    ];
    const result = resolveEligibility('ITEM-A', 'CAT-X', entries);
    expect(result.eligible).toBe(false);
    expect(result.determinedBy).toBe('location');
  });

  it('Blocking warehouse rule overrides allowing location rule', () => {
    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'warehouse', rule: blockingPolicy, priority: SOURCE_PRIORITY['warehouse'] },
      { source: 'location', rule: openPolicy, priority: SOURCE_PRIORITY['location'] },
    ];
    const result = resolveEligibility('ITEM-A', 'CAT-X', entries);
    expect(result.eligible).toBe(false);
    expect(result.determinedBy).toBe('warehouse');
  });

  it('Restricted policy without matching allow → ineligible', () => {
    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'warehouse', rule: restrictedPolicy, priority: SOURCE_PRIORITY['warehouse'] },
    ];
    const result = resolveEligibility('ITEM-UNKNOWN', 'CAT-X', entries);
    expect(result.eligible).toBe(false);
  });

  it('Transaction source has highest priority (overrides warehouse block)', () => {
    const transactionAllowed: EligibilityPolicy = { mode: 'Open', rules: [], defaultFallback: 'Allow' };
    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'transaction', rule: transactionAllowed, priority: SOURCE_PRIORITY['transaction'] },
      { source: 'warehouse', rule: blockingPolicy, priority: SOURCE_PRIORITY['warehouse'] },
    ];
    // Most-restrictive-wins: block from warehouse should still block
    // Transaction being open doesn't override an explicit block from warehouse
    // Blocks always win — verify this
    const result = resolveEligibility('ITEM-A', 'CAT-X', entries);
    expect(result.eligible).toBe(false);
  });
});

// ─── Hierarchy template validation ───────────────────────────────────────────

describe('hierarchy template validation', () => {
  it('empty levels → error', () => {
    const issues = validateTemplateLevelTree([]);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('duplicate sequence → error', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false },
      { levelCode: 'BIN', levelName: 'BIN', sequence: 1, mandatory: true, leafEligible: true, allowSkipLevel: false },
    ]);
    expect(issues.some((i) => i.message.includes('sequence'))).toBe(true);
  });

  it('no leaf-eligible level → error', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false },
    ]);
    expect(issues.some((i) => i.message.includes('Leaf Eligible'))).toBe(true);
  });

  it('mandatory + allowSkipLevel on same level → error', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: true },
      { levelCode: 'BIN', levelName: 'BIN', sequence: 2, mandatory: true, leafEligible: true, allowSkipLevel: false },
    ]);
    expect(issues.some((i) => i.message.includes('Mandatory') && i.message.includes('Skip'))).toBe(true);
  });

  it('valid template → no errors', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, levelRole: 'Structural' },
      { levelCode: 'RACK', levelName: 'Rack', sequence: 2, mandatory: false, leafEligible: false, allowSkipLevel: true, levelRole: 'Structural' },
      { levelCode: 'BIN', levelName: 'BIN', sequence: 3, mandatory: true, leafEligible: true, allowSkipLevel: false, levelRole: 'InventoryEndpoint', autoGenerateCode: true, codePrefix: 'B', startSequence: 1, sequenceLength: 3, separator: '-' },
    ]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('explicit cycle in level graph → error', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'A', levelName: 'A', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE', 'C'] },
      { levelCode: 'B', levelName: 'B', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['A'] },
      { levelCode: 'C', levelName: 'C', sequence: 3, mandatory: false, leafEligible: true, allowSkipLevel: true, allowedParentLevels: ['B'] },
    ]);
    expect(issues.some((issue) => issue.message.includes('cycle'))).toBe(true);
  });

  it('unreachable explicit level from warehouse root → error', () => {
    const issues = validateTemplateLevelTree([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'] },
      { levelCode: 'BIN', levelName: 'Bin', sequence: 2, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['ZONE'] },
      { levelCode: 'ORPHAN', levelName: 'Orphan', sequence: 3, mandatory: false, leafEligible: true, allowSkipLevel: true, allowedParentLevels: ['UNKNOWN'] },
    ]);
    expect(issues.some((issue) => issue.message.includes('unreachable'))).toBe(true);
  });

  it('builds preview paths from explicit parent rules', () => {
    const paths = buildTemplatePathPreviews([
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'] },
      { levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['ZONE'] },
      { levelCode: 'BIN', levelName: 'Bin', sequence: 3, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['ZONE', 'AISLE'] },
    ], true);
    expect(paths).toContain('WAREHOUSE -> ZONE -> BIN');
    expect(paths).toContain('WAREHOUSE -> ZONE -> AISLE -> BIN');
  });

  it('builds level code examples from coding policy fields', () => {
    const code = buildLevelGeneratedCodeExample({
      levelCode: 'BIN',
      levelName: 'BIN',
      sequence: 1,
      mandatory: true,
      leafEligible: true,
      allowSkipLevel: false,
      autoGenerateCode: true,
      codePrefix: 'B',
      startSequence: 7,
      sequenceLength: 4,
      separator: '-',
      suffix: 'A',
    });
    expect(code).toBe('B-0007-A');
  });

  it('builds full identifier examples without hardcoded path names', () => {
    const examples = buildTemplateIdentifierExamples({
      levels: [
        { levelCode: 'YARD', levelName: 'Yard', sequence: 1, mandatory: true, leafEligible: false, allowSkipLevel: false, allowedParentLevels: ['WAREHOUSE'], autoGenerateCode: true, codePrefix: 'Y', startSequence: 1, sequenceLength: 2, separator: '-', levelRole: 'Yard' },
        { levelCode: 'BAY', levelName: 'Bay', sequence: 2, mandatory: true, leafEligible: true, allowSkipLevel: false, allowedParentLevels: ['YARD'], autoGenerateCode: true, codePrefix: 'BA', startSequence: 10, sequenceLength: 2, separator: '-', levelRole: 'InventoryEndpoint' },
      ],
      flexiblePathEnabled: false,
      defaultPathSeparator: '/',
      includeWarehouseCodeInIdentifier: true,
      defaultSequenceLength: 2,
    }, 'WHX');

    expect(examples[0]).toContain('WHX/');
    expect(examples[0]).toContain('Y-01');
    expect(examples[0]).toContain('BA-10');
  });

  it('save validation rejects effective-to before effective-from', () => {
    const errors = validateHierarchyTemplateForSave({
      warehouseId: 'WH-TEST',
      templateCode: 'TPL-DATE',
      templateName: 'Date Rule',
      templateSource: 'UserDefined',
      templateScope: 'Warehouse',
      flexiblePathEnabled: true,
      effectiveFrom: '2026-06-10',
      effectiveTo: '2026-06-09',
      levels: [
        { levelCode: 'BIN', levelName: 'Bin', sequence: 1, mandatory: true, leafEligible: true, allowSkipLevel: false, levelRole: 'InventoryEndpoint', autoGenerateCode: true, codePrefix: 'B', startSequence: 1, sequenceLength: 3, separator: '-' },
      ],
    }, []);

    expect(errors.effectiveTo).toContain('Effective To');
  });

  it('lifecycle guard blocks inactivation of active template with dependencies', () => {
    const message = validateHierarchyTemplateLifecycleAction('Active', 'Inactive', true);
    expect(message).toContain('dependent hierarchy nodes');
  });
});

// ─── Circular hierarchy detection ────────────────────────────────────────────

describe('isCircularHierarchy', () => {
  const loc1: WarehouseLocation = {
    ...SEED_LOCATIONS[0], id: 'CIR-1', locationCode: 'L1', parentLocationId: undefined,
  };
  const loc2: WarehouseLocation = {
    ...SEED_LOCATIONS[0], id: 'CIR-2', locationCode: 'L2', parentLocationId: 'CIR-1',
  };
  const loc3: WarehouseLocation = {
    ...SEED_LOCATIONS[0], id: 'CIR-3', locationCode: 'L3', parentLocationId: 'CIR-2',
  };

  it('setting parent to self → circular', () => {
    expect(isCircularHierarchy('CIR-1', 'CIR-1', [loc1, loc2, loc3])).toBe(true);
  });

  it('setting parent to direct child → circular', () => {
    expect(isCircularHierarchy('CIR-1', 'CIR-2', [loc1, loc2, loc3])).toBe(true);
  });

  it('setting parent to grandchild → circular', () => {
    expect(isCircularHierarchy('CIR-1', 'CIR-3', [loc1, loc2, loc3])).toBe(true);
  });

  it('setting parent to sibling → not circular', () => {
    const loc4: WarehouseLocation = { ...loc2, id: 'CIR-4', locationCode: 'L4' };
    expect(isCircularHierarchy('CIR-4', 'CIR-1', [loc1, loc2, loc3, loc4])).toBe(false);
  });

  it('no parent → not circular', () => {
    expect(isCircularHierarchy('CIR-1', undefined, [loc1, loc2, loc3])).toBe(false);
  });
});

// ─── Capacity state ───────────────────────────────────────────────────────────

describe('evaluateCapacityState', () => {
  it('empty location → available', () => {
    expect(evaluateCapacityState({ maxWeightKg: 100, currentWeightKg: 0 })).toBe('available');
  });

  it('at 90% weight → nearFull', () => {
    expect(evaluateCapacityState({ maxWeightKg: 100, currentWeightKg: 90 })).toBe('nearFull');
  });

  it('at 100% weight → full', () => {
    expect(evaluateCapacityState({ maxWeightKg: 100, currentWeightKg: 100 })).toBe('full');
  });

  it('multiple dimensions — highest used percent determines state', () => {
    expect(evaluateCapacityState({
      maxWeightKg: 100, currentWeightKg: 50,
      maxVolumeM3: 10, currentVolumeM3: 9.5, // 95% → nearFull
    })).toBe('nearFull');
  });
});

// ─── Mode change eligibility ──────────────────────────────────────────────────

describe('evaluateModeChangeEligibility', () => {
  it('Draft warehouse can change mode freely', () => {
    const result = evaluateModeChangeEligibility('Draft', false, false, 'Warehouse-Level', 'Location-BIN-Level');
    expect(result.allowed).toBe(true);
  });

  it('Active warehouse cannot change mode', () => {
    const result = evaluateModeChangeEligibility('Active', false, false, 'Warehouse-Level', 'Location-BIN-Level');
    expect(result.allowed).toBe(false);
  });

  it('BIN→Warehouse revert blocked when stock exists', () => {
    const result = evaluateModeChangeEligibility('Draft', true, false, 'Location-BIN-Level', 'Warehouse-Level');
    expect(result.allowed).toBe(false);
    expect(result.blockedReasons.some((r) => r.includes('stock'))).toBe(true);
  });

  it('BIN→Warehouse revert blocked when movement history exists', () => {
    const result = evaluateModeChangeEligibility('Draft', false, true, 'Location-BIN-Level', 'Warehouse-Level');
    expect(result.allowed).toBe(false);
    expect(result.blockedReasons.some((r) => r.includes('history'))).toBe(true);
  });

  it('Warehouse→BIN in Draft is always allowed', () => {
    const result = evaluateModeChangeEligibility('Draft', false, false, 'Warehouse-Level', 'Location-BIN-Level');
    expect(result.allowed).toBe(true);
  });
});

// ─── Warehouse save validation ────────────────────────────────────────────────

describe('validateWarehouseForSave', () => {
  const baseInput = {
    warehouseCode: 'WH-TEST',
    warehouseName: 'Test Warehouse',
    ownershipScope: 'Branch' as const,
    owningBranchCode: 'BR-TEST',
    warehouseType: 'Physical' as const,
    wmsEnabled: false,
    inventoryControlMode: 'Warehouse-Level' as const,
  };

  it('valid input → no errors', () => {
    const errors = validateWarehouseForSave(baseInput, []);
    expect(Object.values(errors).filter(Boolean)).toHaveLength(0);
  });

  it('missing code → error', () => {
    const errors = validateWarehouseForSave({ ...baseInput, warehouseCode: '' }, []);
    expect(errors.warehouseCode).toBeTruthy();
  });

  it('duplicate code → error', () => {
    const errors = validateWarehouseForSave(baseInput, [WH_WAREHOUSE_LEVEL_ACTIVE]);
    // WH-TEST doesn't clash with WH-MAIN but WH-MAIN code used directly would
    const errors2 = validateWarehouseForSave({ ...baseInput, warehouseCode: 'WH-MAIN' }, [WH_WAREHOUSE_LEVEL_ACTIVE]);
    expect(errors2.warehouseCode).toContain('exists');
  });

  it('invalid code format → error', () => {
    const errors = validateWarehouseForSave({ ...baseInput, warehouseCode: 'wh-lower' }, []);
    expect(errors.warehouseCode).toBeTruthy();
  });

  it('Branch ownership without branch code → error', () => {
    const errors = validateWarehouseForSave({ ...baseInput, owningBranchCode: '' }, []);
    expect(errors.owningBranchCode).toBeTruthy();
  });

  it('autoPutaway.enabled in Warehouse-Level mode → error', () => {
    const errors = validateWarehouseForSave({
      ...baseInput,
      autoPutaway: { enabled: true, strategy: 'FIFO', strategySequence: [], overrideAllowed: false },
    }, []);
    expect(errors.autoPutaway).toBeTruthy();
  });
});

// ─── Location save validation ─────────────────────────────────────────────────

describe('validateLocationForSave', () => {
  const warehouse = WH_BIN_LEVEL_ACTIVE;

  it('valid input → no errors', () => {
    const errors = validateLocationForSave(
      {
        warehouseId: warehouse.id,
        parentLocationId: 'LOC-0008',
        templateLevelCode: 'BIN',
        locationCode: 'NEWBIN',
        locationName: 'New BIN',
        locationType: 'BIN',
      },
      warehouse, SEED_LOCATIONS,
      SEED_HIERARCHY_TEMPLATES[0],
    );
    expect(Object.values(errors).filter(Boolean)).toHaveLength(0);
  });

  it('duplicate code in same warehouse → error', () => {
    const errors = validateLocationForSave(
      { warehouseId: warehouse.id, locationCode: 'B001', locationName: 'Duplicate', locationType: 'BIN' },
      warehouse, SEED_LOCATIONS,
    );
    expect(errors.locationCode).toBeTruthy();
  });

  it('lowercase code → error', () => {
    const errors = validateLocationForSave(
      { warehouseId: warehouse.id, locationCode: 'b001', locationName: 'Lower', locationType: 'BIN' },
      warehouse, SEED_LOCATIONS,
    );
    expect(errors.locationCode).toBeTruthy();
  });
});
