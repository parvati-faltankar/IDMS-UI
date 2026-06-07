// ─── Warehouse Configuration Page — Tests ────────────────────────────────────
//
// Tests use pure logic + renderToStaticMarkup (no @testing-library/react).
// Covers: computeSectionStatuses, isInventoryModeChangeLocked, getAvailablePageActions,
//         validateSectionSave, WarehouseSectionNav rendering.

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

import {
  computeSectionStatuses,
  isInventoryModeChangeLocked,
  getAvailablePageActions,
  validateSectionSave,
} from '../pages/WarehouseConfigurationPage';
import { WarehouseSectionNav } from '../components/WarehouseSectionNav';
import type { WarehouseSectionItem } from '../components/WarehouseSectionNav';
import { __resetMockStores } from '../services/warehouseMockAdapter';
import type { Warehouse, HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';
import { mockAllPermissions, readOnlyPermissions } from '../types/warehouse.permissions';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeWarehouse(overrides: Partial<Warehouse> = {}): Warehouse {
  const base: Warehouse = {
    id: 'WH-TEST',
    warehouseCode: 'WH-TEST',
    warehouseName: 'Test Warehouse',
    ownershipScope: 'Organization',
    owningOrgCode: 'ORG-001',
    warehouseType: 'Physical',
    wmsEnabled: false,
    inventoryControlMode: 'Warehouse-Level',
    inventoryControlRules: {
      requireLocationForGRN: false,
      requireLocationForIssue: false,
      allowBinToBinTransfer: false,
    },
    status: 'Draft',
    creationSource: 'Manual',
    assignmentProfile: {
      assignments: [],
      sharedWithAllBranches: false,
    },
    defaultLocations: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1,
  };
  return { ...base, ...overrides };
}

function makeTemplate(status: HierarchyTemplate['status'] = 'Active'): HierarchyTemplate {
  return {
    id: 'TMPL-001',
    warehouseId: 'WH-TEST',
    templateCode: 'TMPL-001',
    templateName: 'Default Template',
    status,
    flexiblePathEnabled: false,
    levels: [],
    currentVersion: 1,
    versionHistory: [],
    effectiveFrom: '2024-01-01',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1,
  };
}

function makeLocation(overrides: Partial<WarehouseLocation> = {}): WarehouseLocation {
  const base: WarehouseLocation = {
    id: 'LOC-001',
    warehouseId: 'WH-TEST',
    locationCode: 'LOC-001',
    locationName: 'Location 001',
    parentLocationId: undefined,
    status: 'Active',
    putawayBlocked: false,
    profile: {
      level: 1,
      locationType: 'BIN',
      binType: 'Standard',
      inventoryAllowed: true,
      isLeafEndpoint: true,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1,
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  __resetMockStores();
});

// ─── isInventoryModeChangeLocked ──────────────────────────────────────────────

describe('isInventoryModeChangeLocked', () => {
  it('returns false for Draft', () => {
    expect(isInventoryModeChangeLocked(makeWarehouse({ status: 'Draft' }))).toBe(false);
  });

  it('returns true for Active', () => {
    expect(isInventoryModeChangeLocked(makeWarehouse({ status: 'Active' }))).toBe(true);
  });

  it('returns true for Blocked', () => {
    expect(isInventoryModeChangeLocked(makeWarehouse({ status: 'Blocked' }))).toBe(true);
  });

  it('returns false for Inactive', () => {
    expect(isInventoryModeChangeLocked(makeWarehouse({ status: 'Inactive' }))).toBe(false);
  });
});

// ─── computeSectionStatuses — Warehouse-Level ─────────────────────────────────

describe('computeSectionStatuses — Warehouse-Level inventory mode', () => {
  const wh = makeWarehouse();
  const statuses = computeSectionStatuses(wh, [], []);

  it('overview is always complete', () => {
    expect(statuses.overview).toBe('complete');
  });

  it('governance is always complete', () => {
    expect(statuses.governance).toBe('complete');
  });

  it('ownership is complete when scope + owning entity present', () => {
    expect(statuses.ownership).toBe('complete');
  });

  it('inventoryControl is complete for Draft with mode set', () => {
    expect(statuses.inventoryControl).toBe('complete');
  });

  it('hierarchyTemplate is empty for Warehouse-Level', () => {
    expect(statuses.hierarchyTemplate).toBe('empty');
  });

  it('putaway is locked for Warehouse-Level', () => {
    expect(statuses.putaway).toBe('locked');
  });

  it('picking is locked for Warehouse-Level', () => {
    expect(statuses.picking).toBe('locked');
  });

  it('locationDefaults is empty when no defaults set', () => {
    expect(statuses.locationDefaults).toBe('empty');
  });

  it('capacity is empty when no capacity set', () => {
    expect(statuses.capacity).toBe('empty');
  });

  it('eligibility is partial when no policy set', () => {
    expect(statuses.eligibility).toBe('partial');
  });

  it('stockGovernance is partial when no policies set', () => {
    expect(statuses.stockGovernance).toBe('partial');
  });

  it('cycleCount is empty when not configured', () => {
    expect(statuses.cycleCount).toBe('empty');
  });
});

// ─── computeSectionStatuses — BIN-Level ──────────────────────────────────────

describe('computeSectionStatuses — Location-BIN-Level', () => {
  const wh = makeWarehouse({ inventoryControlMode: 'Location-BIN-Level' });

  it('hierarchyTemplate is error when no active template', () => {
    const s = computeSectionStatuses(wh, [], []);
    expect(s.hierarchyTemplate).toBe('error');
  });

  it('hierarchyTemplate is error when template exists but is Draft', () => {
    const s = computeSectionStatuses(wh, [makeTemplate('Draft')], []);
    expect(s.hierarchyTemplate).toBe('error');
  });

  it('hierarchyTemplate is complete when active template present', () => {
    const s = computeSectionStatuses(wh, [makeTemplate('Active')], []);
    expect(s.hierarchyTemplate).toBe('complete');
  });

  it('putaway is empty when no autoPutaway configured', () => {
    const s = computeSectionStatuses(wh, [], []);
    expect(s.putaway).toBe('empty');
  });

  it('putaway is complete when autoPutaway is set', () => {
    const wWithPutaway = makeWarehouse({
      inventoryControlMode: 'Location-BIN-Level',
      autoPutaway: { enabled: true, strategy: 'FIFO', strategySequence: 1, overrideAllowed: true },
    });
    const s = computeSectionStatuses(wWithPutaway, [], []);
    expect(s.putaway).toBe('complete');
  });

  it('picking is empty when no autoPicking configured', () => {
    const s = computeSectionStatuses(wh, [], []);
    expect(s.picking).toBe('empty');
  });

  it('picking is complete when autoPicking is set', () => {
    const wWithPicking = makeWarehouse({
      inventoryControlMode: 'Location-BIN-Level',
      autoPicking: { enabled: true, strategy: 'FIFO', strategySequence: 1, overrideAllowed: true },
    });
    const s = computeSectionStatuses(wWithPicking, [], []);
    expect(s.picking).toBe('complete');
  });
});

// ─── computeSectionStatuses — ownership ──────────────────────────────────────

describe('computeSectionStatuses — ownership', () => {
  it('is error when ownershipScope is missing', () => {
    const wh = makeWarehouse({ ownershipScope: undefined as unknown as 'Organization', owningOrgCode: undefined });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.ownership).toBe('error');
  });

  it('is error when Branch scope but no owningBranchCode', () => {
    const wh = makeWarehouse({ ownershipScope: 'Branch', owningBranchCode: undefined });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.ownership).toBe('error');
  });

  it('is complete for Branch scope with owningBranchCode', () => {
    const wh = makeWarehouse({ ownershipScope: 'Branch', owningBranchCode: 'BR-HYD', owningOrgCode: undefined });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.ownership).toBe('complete');
  });
});

// ─── computeSectionStatuses — inventoryControl locked ────────────────────────

describe('computeSectionStatuses — inventoryControl locking', () => {
  it('is locked when warehouse is Active', () => {
    const wh = makeWarehouse({ status: 'Active' });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.inventoryControl).toBe('locked');
  });

  it('is locked when warehouse is Blocked', () => {
    const wh = makeWarehouse({ status: 'Blocked' });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.inventoryControl).toBe('locked');
  });

  it('is complete when warehouse is Draft with mode set', () => {
    const wh = makeWarehouse({ status: 'Draft' });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.inventoryControl).toBe('complete');
  });

  it('is error when mode is not set', () => {
    const wh = makeWarehouse({ inventoryControlMode: undefined as unknown as 'Warehouse-Level' });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.inventoryControl).toBe('error');
  });
});

// ─── computeSectionStatuses — branchAccess ────────────────────────────────────

describe('computeSectionStatuses — branchAccess', () => {
  it('is warning when no shared and no active assignments (org-level)', () => {
    const wh = makeWarehouse({
      ownershipScope: 'Organization',
      assignmentProfile: { assignments: [], sharedWithAllBranches: false },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.branchAccess).toBe('warning');
  });

  it('is complete when sharedWithAllBranches is true', () => {
    const wh = makeWarehouse({
      ownershipScope: 'Organization',
      assignmentProfile: { assignments: [], sharedWithAllBranches: true },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.branchAccess).toBe('complete');
  });

  it('is complete when at least one Active assignment exists', () => {
    const wh = makeWarehouse({
      ownershipScope: 'Organization',
      assignmentProfile: {
        sharedWithAllBranches: false,
        assignments: [{
          id: 'A1', branchCode: 'BR-HYD', branchName: 'HYD',
          assignmentStatus: 'Active', isDefaultForBranch: true,
          effectiveFrom: '2024-01-01',
          createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
        }],
      },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.branchAccess).toBe('complete');
  });

  it('is complete for branch-owned warehouse (not applicable)', () => {
    const wh = makeWarehouse({
      ownershipScope: 'Branch',
      owningBranchCode: 'BR-HYD',
      owningOrgCode: undefined,
      assignmentProfile: { assignments: [], sharedWithAllBranches: false },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.branchAccess).toBe('complete');
  });
});

// ─── computeSectionStatuses — capacity ────────────────────────────────────────

describe('computeSectionStatuses — capacity', () => {
  it('is empty when capacityPolicy is undefined', () => {
    const wh = makeWarehouse();
    const s = computeSectionStatuses(wh, [], []);
    expect(s.capacity).toBe('empty');
  });

  it('is partial when tracking is enabled', () => {
    const wh = makeWarehouse({
      capacityPolicy: { trackingEnabled: true, temperatureControlled: false, hazardousStorage: false },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.capacity).toBe('partial');
  });

  it('is partial when squareFootage is set', () => {
    const wh = makeWarehouse({
      capacityPolicy: { trackingEnabled: false, squareFootage: 10000, temperatureControlled: false, hazardousStorage: false },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.capacity).toBe('partial');
  });
});

// ─── computeSectionStatuses — stockGovernance ────────────────────────────────

describe('computeSectionStatuses — stockGovernance', () => {
  it('is complete when both reservation and allocation policy are set', () => {
    const wh = makeWarehouse({
      reservationPolicy: { reservationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialReservation: true },
      allocationPolicy: { allocationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialAllocation: true },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.stockGovernance).toBe('complete');
  });

  it('is partial when only one policy is set', () => {
    const wh = makeWarehouse({
      reservationPolicy: { reservationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialReservation: true },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.stockGovernance).toBe('partial');
  });
});

// ─── computeSectionStatuses — cycleCount ──────────────────────────────────────

describe('computeSectionStatuses — cycleCount', () => {
  it('is empty when no policy', () => {
    const wh = makeWarehouse();
    const s = computeSectionStatuses(wh, [], []);
    expect(s.cycleCount).toBe('empty');
  });

  it('is empty when policy exists but disabled', () => {
    const wh = makeWarehouse({
      cycleCountPolicy: {
        enabled: false, scope: 'Full', frequency: 'Monthly',
        freezeEnabled: false, varianceTolerance: 0, varianceUnit: 'Quantity',
      },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.cycleCount).toBe('empty');
  });

  it('is complete when policy is enabled', () => {
    const wh = makeWarehouse({
      cycleCountPolicy: {
        enabled: true, scope: 'Full', frequency: 'Monthly',
        freezeEnabled: false, varianceTolerance: 0, varianceUnit: 'Quantity',
      },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.cycleCount).toBe('complete');
  });
});

// ─── computeSectionStatuses — locationDefaults ───────────────────────────────

describe('computeSectionStatuses — locationDefaults', () => {
  it('is empty when no defaults', () => {
    const wh = makeWarehouse({ defaultLocations: {} });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.locationDefaults).toBe('empty');
  });

  it('is partial when at least one default is set', () => {
    const wh = makeWarehouse({
      defaultLocations: { putaway: { locationId: 'LOC-001', locationCode: 'LOC-001' } },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.locationDefaults).toBe('partial');
  });
});

// ─── getAvailablePageActions ──────────────────────────────────────────────────

describe('getAvailablePageActions', () => {
  it('Draft warehouse has Activate action', () => {
    const wh = makeWarehouse({ status: 'Draft' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    expect(actions.some((a) => a.key === 'activate')).toBe(true);
  });

  it('Active warehouse has Block and Inactivate actions', () => {
    const wh = makeWarehouse({ status: 'Active' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    expect(actions.some((a) => a.key === 'block')).toBe(true);
    expect(actions.some((a) => a.key === 'inactivate')).toBe(true);
  });

  it('Blocked warehouse has Unblock and Inactivate actions', () => {
    const wh = makeWarehouse({ status: 'Blocked' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    expect(actions.some((a) => a.key === 'unblock')).toBe(true);
    expect(actions.some((a) => a.key === 'inactivate')).toBe(true);
  });

  it('Inactive warehouse has Re-activate action', () => {
    const wh = makeWarehouse({ status: 'Inactive' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    expect(actions.some((a) => a.key === 'activate')).toBe(true);
  });

  it('Draft warehouse Activate is disabled when user lacks permission', () => {
    const wh = makeWarehouse({ status: 'Draft' });
    const perms = readOnlyPermissions();
    const actions = getAvailablePageActions(wh, perms);
    const activate = actions.find((a) => a.key === 'activate');
    expect(activate?.disabled).toBe(true);
  });

  it('Active Block is enabled with full permissions', () => {
    const wh = makeWarehouse({ status: 'Active' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    const block = actions.find((a) => a.key === 'block');
    expect(block?.disabled).toBe(false);
  });

  it('Active Block is disabled with read-only permissions', () => {
    const wh = makeWarehouse({ status: 'Active' });
    const actions = getAvailablePageActions(wh, readOnlyPermissions());
    const block = actions.find((a) => a.key === 'block');
    expect(block?.disabled).toBe(true);
  });

  it('Blocked Inactivate action has variant danger', () => {
    const wh = makeWarehouse({ status: 'Blocked' });
    const actions = getAvailablePageActions(wh, mockAllPermissions());
    const inact = actions.find((a) => a.key === 'inactivate');
    expect(inact?.variant).toBe('danger');
  });
});

// ─── validateSectionSave ──────────────────────────────────────────────────────

describe('validateSectionSave', () => {
  it('ownership: valid when scope + org code present', () => {
    const result = validateSectionSave('ownership', {
      ownershipScope: 'Organization', owningOrgCode: 'ORG-001',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('ownership: invalid when scope missing', () => {
    const result = validateSectionSave('ownership', { owningOrgCode: 'ORG-001' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /scope/i.test(e))).toBe(true);
  });

  it('ownership: invalid when owning entity missing', () => {
    const result = validateSectionSave('ownership', { ownershipScope: 'Organization' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /owning/i.test(e))).toBe(true);
  });

  it('ownership: valid for Branch scope with branchCode', () => {
    const result = validateSectionSave('ownership', {
      ownershipScope: 'Branch', owningBranchCode: 'BR-HYD',
    });
    expect(result.valid).toBe(true);
  });

  it('inventoryControl: valid when mode set', () => {
    const result = validateSectionSave('inventoryControl', { inventoryControlMode: 'Warehouse-Level' });
    expect(result.valid).toBe(true);
  });

  it('inventoryControl: invalid when mode missing', () => {
    const result = validateSectionSave('inventoryControl', {});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /mode/i.test(e))).toBe(true);
  });

  it('overview section has no required fields — always valid', () => {
    const result = validateSectionSave('overview', {});
    expect(result.valid).toBe(true);
  });

  it('cycleCount section has no required fields — always valid', () => {
    const result = validateSectionSave('cycleCount', {});
    expect(result.valid).toBe(true);
  });

  it('governance section has no required fields — always valid', () => {
    const result = validateSectionSave('governance', {});
    expect(result.valid).toBe(true);
  });
});

// ─── WarehouseSectionNav — rendering ─────────────────────────────────────────

describe('WarehouseSectionNav', () => {
  const sections: WarehouseSectionItem[] = [
    { key: 'overview', label: 'Overview', status: 'complete', description: 'desc' },
    { key: 'ownership', label: 'Ownership', status: 'error', issueCount: 2, description: 'desc' },
    { key: 'inventoryControl', label: 'Inventory Control', status: 'locked', description: 'desc' },
    { key: 'putaway', label: 'Auto Putaway', status: 'empty', description: 'desc' },
  ];

  it('renders all section buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(WarehouseSectionNav, {
        sections,
        activeKey: 'overview',
        onSelect: () => {},
      }),
    );
    expect(html).toContain('data-testid="warehouse-section-nav"');
    expect(html).toContain('data-testid="section-nav-overview"');
    expect(html).toContain('data-testid="section-nav-ownership"');
    expect(html).toContain('data-testid="section-nav-inventoryControl"');
    expect(html).toContain('data-testid="section-nav-putaway"');
  });

  it('shows section labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(WarehouseSectionNav, {
        sections,
        activeKey: 'overview',
        onSelect: () => {},
      }),
    );
    expect(html).toContain('Overview');
    expect(html).toContain('Ownership');
    expect(html).toContain('Inventory Control');
  });

  it('shows issue count badge for error section', () => {
    const html = renderToStaticMarkup(
      React.createElement(WarehouseSectionNav, {
        sections,
        activeKey: 'overview',
        onSelect: () => {},
      }),
    );
    // Ownership has issueCount=2 and error status (has badgeBg)
    expect(html).toContain('>2<');
  });

  it('disabled sections render with correct attribute', () => {
    const sectionsWithDisabled: WarehouseSectionItem[] = [
      { key: 'cap', label: 'Capacity', status: 'empty', disabled: true, description: 'desc' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(WarehouseSectionNav, {
        sections: sectionsWithDisabled,
        activeKey: '',
        onSelect: () => {},
      }),
    );
    // Disabled button should have opacity 0.45
    expect(html).toContain('opacity:0.45');
  });

  it('active section item uses bold font', () => {
    const html = renderToStaticMarkup(
      React.createElement(WarehouseSectionNav, {
        sections,
        activeKey: 'ownership',
        onSelect: () => {},
      }),
    );
    // The active item label should have font-weight:700
    expect(html).toContain('font-weight:700');
  });
});

// ─── computeSectionStatuses — all 13 sections are present ────────────────────

describe('computeSectionStatuses — completeness', () => {
  it('returns all 13 section keys', () => {
    const wh = makeWarehouse();
    const s = computeSectionStatuses(wh, [], []);
    const keys = Object.keys(s);
    expect(keys).toContain('overview');
    expect(keys).toContain('ownership');
    expect(keys).toContain('branchAccess');
    expect(keys).toContain('inventoryControl');
    expect(keys).toContain('hierarchyTemplate');
    expect(keys).toContain('locationDefaults');
    expect(keys).toContain('putaway');
    expect(keys).toContain('picking');
    expect(keys).toContain('capacity');
    expect(keys).toContain('eligibility');
    expect(keys).toContain('stockGovernance');
    expect(keys).toContain('cycleCount');
    expect(keys).toContain('governance');
    expect(keys).toHaveLength(13);
  });
});

// ─── computeSectionStatuses — eligibility ────────────────────────────────────

describe('computeSectionStatuses — eligibility', () => {
  it('is partial when no eligibility policy', () => {
    const wh = makeWarehouse();
    const s = computeSectionStatuses(wh, [], []);
    expect(s.eligibility).toBe('partial');
  });

  it('is complete when eligibility policy is set', () => {
    const wh = makeWarehouse({
      eligibilityPolicy: { mode: 'Open', rules: [], defaultFallback: 'Allow' },
    });
    const s = computeSectionStatuses(wh, [], []);
    expect(s.eligibility).toBe('complete');
  });
});

// ─── Integration: all sections get valid status values ───────────────────────

describe('computeSectionStatuses — valid status values only', () => {
  const validStatuses = new Set<string>([
    'complete', 'partial', 'warning', 'error', 'locked', 'approval-pending', 'empty',
  ]);

  it('all statuses are valid for a default warehouse', () => {
    const wh = makeWarehouse();
    const s = computeSectionStatuses(wh, [], []);
    for (const val of Object.values(s)) {
      expect(validStatuses.has(val)).toBe(true);
    }
  });

  it('all statuses are valid for a BIN-Level warehouse with full config', () => {
    const wh = makeWarehouse({
      status: 'Active',
      inventoryControlMode: 'Location-BIN-Level',
      autoPutaway: { enabled: true, strategy: 'FIFO', strategySequence: 1, overrideAllowed: true },
      autoPicking: { enabled: true, strategy: 'FIFO', strategySequence: 1, overrideAllowed: true },
      reservationPolicy: { reservationLevel: 'BIN', eligibleLocationTypes: [], allowPartialReservation: true },
      allocationPolicy: { allocationLevel: 'BIN', eligibleLocationTypes: [], allowPartialAllocation: true },
      cycleCountPolicy: { enabled: true, scope: 'Full', frequency: 'Monthly', freezeEnabled: false, varianceTolerance: 0, varianceUnit: 'Quantity' },
      eligibilityPolicy: { mode: 'Open', rules: [], defaultFallback: 'Allow' },
      defaultLocations: { putaway: { locationId: 'LOC-001', locationCode: 'LOC-001' } },
      capacityPolicy: { trackingEnabled: true, temperatureControlled: true, hazardousStorage: false },
      assignmentProfile: { assignments: [], sharedWithAllBranches: true },
    });
    const s = computeSectionStatuses(wh, [makeTemplate('Active')], [makeLocation()]);
    for (const val of Object.values(s)) {
      expect(validStatuses.has(val)).toBe(true);
    }
  });
});
