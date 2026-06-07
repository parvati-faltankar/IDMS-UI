// ─── Warehouse List — Component Tests ────────────────────────────────────────
//
// Tests use pure logic + renderToStaticMarkup (no @testing-library/react).
// Covers: filter, search, setup health display, disabled actions, empty state.

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

import {
  filterWarehouseSummaries,
  buildSummaryCounts,
  deriveRowActions,
} from '../pages/WarehouseListPage';
import { WarehouseStatusBadge }   from '../components/WarehouseStatusBadge';
import { WarehouseScopeBadge }     from '../components/WarehouseScopeBadge';
import { WarehouseModeBadge }      from '../components/WarehouseModeBadge';
import { WarehouseSetupHealth }    from '../components/WarehouseSetupHealth';
import { ValidationIssuePanel }    from '../components/ValidationIssuePanel';
import { __resetMockStores }        from '../services/warehouseMockAdapter';
import { warehouseMockAdapter }     from '../services/warehouseMockAdapter';
import type { WarehouseSummary }    from '../types/warehouse.types';

// ─── Fixture summaries ────────────────────────────────────────────────────────

const makeSummary = (overrides: Partial<WarehouseSummary>): WarehouseSummary => ({
  id: 'WH-TEST',
  warehouseCode: 'WH-TEST',
  warehouseName: 'Test Warehouse',
  ownershipScope: 'Branch',
  warehouseType: 'Physical',
  inventoryControlMode: 'Warehouse-Level',
  binManaged: false,
  wmsEnabled: false,
  status: 'Draft',
  branchCount: 1,
  locationCount: 0,
  activeBinCount: 0,
  setupHealth: 'empty',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
  owningCode: 'BR-TEST',
  ...overrides,
});

const WAREHOUSES: WarehouseSummary[] = [
  makeSummary({ id: 'W1', warehouseCode: 'WH-ALPHA', warehouseName: 'Alpha Store', status: 'Active',   inventoryControlMode: 'Warehouse-Level',   ownershipScope: 'Organization', owningCode: 'ORG-001', setupHealth: 'complete', binManaged: false }),
  makeSummary({ id: 'W2', warehouseCode: 'WH-BETA',  warehouseName: 'Beta Hub',    status: 'Active',   inventoryControlMode: 'Location-BIN-Level', ownershipScope: 'Branch',       owningCode: 'BR-HYD',  setupHealth: 'complete', binManaged: true }),
  makeSummary({ id: 'W3', warehouseCode: 'WH-GAMMA', warehouseName: 'Gamma Depot', status: 'Draft',    inventoryControlMode: 'Location-BIN-Level', ownershipScope: 'Branch',       owningCode: 'BR-PUNE', setupHealth: 'error',    binManaged: true }),
  makeSummary({ id: 'W4', warehouseCode: 'WH-DELTA', warehouseName: 'Delta Hub',   status: 'Blocked',  inventoryControlMode: 'Warehouse-Level',   ownershipScope: 'Organization', owningCode: 'ORG-001', setupHealth: 'complete', binManaged: false }),
  makeSummary({ id: 'W5', warehouseCode: 'WH-ECHO',  warehouseName: 'Echo Store',  status: 'Inactive', inventoryControlMode: 'Warehouse-Level',   ownershipScope: 'Branch',       owningCode: 'BR-MUM',  setupHealth: 'complete', binManaged: false, wmsEnabled: true }),
];

const EMPTY_FILTER = { quickFilter: 'all', warehouseType: '', wmsEnabled: '' as const };

// ─── filterWarehouseSummaries ─────────────────────────────────────────────────

describe('filterWarehouseSummaries — quick filter', () => {
  it('"all" returns everything', () => {
    expect(filterWarehouseSummaries(WAREHOUSES, '', EMPTY_FILTER)).toHaveLength(5);
  });

  it('"Active" returns only Active warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'Active' });
    expect(result.every((w) => w.status === 'Active')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('"Draft" returns only Draft warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'Draft' });
    expect(result.every((w) => w.status === 'Draft')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('"Blocked" returns only Blocked warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'Blocked' });
    expect(result.every((w) => w.status === 'Blocked')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('"Inactive" returns only Inactive warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'Inactive' });
    expect(result.every((w) => w.status === 'Inactive')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('"needs-attention" returns warehouses with non-complete setup health', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'needs-attention' });
    expect(result.every((w) => w.setupHealth !== 'complete')).toBe(true);
    expect(result).toHaveLength(1); // only W3 has setupHealth: 'error'
  });

  it('"warehouse-level" returns only Warehouse-Level warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'warehouse-level' });
    expect(result.every((w) => w.inventoryControlMode === 'Warehouse-Level')).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('"bin-level" returns only Location-BIN-Level warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'bin-level' });
    expect(result.every((w) => w.inventoryControlMode === 'Location-BIN-Level')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('"shared" returns Organization-scope warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'shared' });
    expect(result.every((w) => w.ownershipScope === 'Organization')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('"my-branch" returns Branch-scope warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'my-branch' });
    expect(result.every((w) => w.ownershipScope === 'Branch')).toBe(true);
    expect(result).toHaveLength(3);
  });
});

// ─── filterWarehouseSummaries — search ────────────────────────────────────────

describe('filterWarehouseSummaries — search', () => {
  it('matches by warehouse code (case-insensitive)', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, 'wh-alpha', EMPTY_FILTER);
    expect(result).toHaveLength(1);
    expect(result[0].warehouseCode).toBe('WH-ALPHA');
  });

  it('matches by warehouse name (partial)', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, 'beta hub', EMPTY_FILTER);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('W2');
  });

  it('matches by owning code', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, 'BR-PUNE', EMPTY_FILTER);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('W3');
  });

  it('returns empty array when no match', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, 'XXXXXXXXX', EMPTY_FILTER);
    expect(result).toHaveLength(0);
  });

  it('search + quick filter are combined (AND logic)', () => {
    // Active + name contains 'hub'
    const result = filterWarehouseSummaries(WAREHOUSES, 'hub', { ...EMPTY_FILTER, quickFilter: 'Active' });
    expect(result).toHaveLength(1);
    expect(result[0].warehouseName).toBe('Beta Hub');
  });
});

// ─── filterWarehouseSummaries — advanced filters ──────────────────────────────

describe('filterWarehouseSummaries — advanced filters', () => {
  it('warehouseType filter works', () => {
    const bonded = makeSummary({ id: 'WB', warehouseCode: 'WH-BOND', warehouseName: 'Bonded', warehouseType: 'Bonded', status: 'Active', setupHealth: 'complete' });
    const result = filterWarehouseSummaries([...WAREHOUSES, bonded], '', { ...EMPTY_FILTER, warehouseType: 'Bonded' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('WB');
  });

  it('wmsEnabled=yes filter returns only WMS warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, wmsEnabled: 'yes' });
    expect(result.every((w) => w.wmsEnabled)).toBe(true);
    expect(result).toHaveLength(1); // only W5
  });

  it('wmsEnabled=no filter excludes WMS warehouses', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, wmsEnabled: 'no' });
    expect(result.every((w) => !w.wmsEnabled)).toBe(true);
    expect(result).toHaveLength(4);
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('filterWarehouseSummaries — empty state', () => {
  it('returns empty array for empty input', () => {
    expect(filterWarehouseSummaries([], '', EMPTY_FILTER)).toHaveLength(0);
  });

  it('returns empty array when no warehouses match the filter', () => {
    const result = filterWarehouseSummaries(WAREHOUSES, '', { ...EMPTY_FILTER, quickFilter: 'Active', warehouseType: 'Bonded' });
    expect(result).toHaveLength(0);
  });
});

// ─── buildSummaryCounts ───────────────────────────────────────────────────────

describe('buildSummaryCounts', () => {
  it('counts all records correctly', () => {
    const counts = buildSummaryCounts(WAREHOUSES);
    expect(counts.all).toBe(5);
    expect(counts.active).toBe(2);
    expect(counts.draft).toBe(1);
    expect(counts.blocked).toBe(1);
    expect(counts.inactive).toBe(1);
    expect(counts.binManaged).toBe(2);
    expect(counts.setupIssues).toBe(1); // W3 has error health
    expect(counts.shared).toBe(2);
    expect(counts.myBranch).toBe(3);
    expect(counts.warehouseLevel).toBe(3);
    expect(counts.binLevel).toBe(2);
  });

  it('returns zeros for empty list', () => {
    const counts = buildSummaryCounts([]);
    expect(counts.all).toBe(0);
    expect(counts.active).toBe(0);
    expect(counts.setupIssues).toBe(0);
  });
});

// ─── deriveRowActions ─────────────────────────────────────────────────────────

describe('deriveRowActions', () => {
  const noop = () => {};

  it('Active warehouse: has Configure, Block, Inactivate', () => {
    const active = makeSummary({ status: 'Active', setupHealth: 'complete' });
    const actions = deriveRowActions(active, noop, noop, noop, noop);
    const keys = actions.map((a) => a.key);
    expect(keys).toContain('edit');
    expect(keys).toContain('block');
    expect(keys).toContain('inactivate');
    expect(keys).not.toContain('activate');
  });

  it('Draft warehouse: has Configure + disabled Activate if health not complete', () => {
    const draft = makeSummary({ status: 'Draft', setupHealth: 'error' });
    const actions = deriveRowActions(draft, noop, noop, noop, noop);
    const activate = actions.find((a) => a.key === 'activate');
    expect(activate).toBeDefined();
    expect(activate!.disabled).toBe(true);
    expect(activate!.disabledReason).toBeTruthy();
  });

  it('Draft warehouse: Activate enabled when health is complete', () => {
    const draft = makeSummary({ status: 'Draft', setupHealth: 'complete' });
    const actions = deriveRowActions(draft, noop, noop, noop, noop);
    const activate = actions.find((a) => a.key === 'activate');
    expect(activate!.disabled).toBe(false);
  });

  it('Draft warehouse: no Block or Inactivate actions', () => {
    const draft = makeSummary({ status: 'Draft', setupHealth: 'empty' });
    const actions = deriveRowActions(draft, noop, noop, noop, noop);
    const keys = actions.map((a) => a.key);
    expect(keys).not.toContain('block');
    expect(keys).not.toContain('inactivate');
  });

  it('Blocked warehouse: has Configure and Inactivate but no Block', () => {
    const blocked = makeSummary({ status: 'Blocked', setupHealth: 'complete' });
    const actions = deriveRowActions(blocked, noop, noop, noop, noop);
    const keys = actions.map((a) => a.key);
    expect(keys).toContain('edit');
    expect(keys).toContain('inactivate');
    expect(keys).not.toContain('block');
    expect(keys).not.toContain('activate');
  });

  it('Inactive warehouse: has only Configure', () => {
    const inactive = makeSummary({ status: 'Inactive', setupHealth: 'complete' });
    const actions = deriveRowActions(inactive, noop, noop, noop, noop);
    const keys = actions.map((a) => a.key);
    expect(keys).toContain('edit');
    expect(keys).not.toContain('block');
    expect(keys).not.toContain('inactivate');
    expect(keys).not.toContain('activate');
  });
});

// ─── WarehouseStatusBadge rendering ──────────────────────────────────────────

describe('WarehouseStatusBadge rendering', () => {
  it('renders Active badge with green background', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseStatusBadge, { status: 'Active' }));
    expect(html).toContain('Active');
    expect(html).toContain('#DCFCE7');
  });

  it('renders Draft badge', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseStatusBadge, { status: 'Draft' }));
    expect(html).toContain('Draft');
  });

  it('renders Blocked badge with amber background', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseStatusBadge, { status: 'Blocked' }));
    expect(html).toContain('Blocked');
    expect(html).toContain('#FEF3C7');
  });

  it('renders Inactive badge with red color', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseStatusBadge, { status: 'Inactive' }));
    expect(html).toContain('Inactive');
    expect(html).toContain('#DC2626');
  });
});

// ─── WarehouseSetupHealth rendering ──────────────────────────────────────────

describe('WarehouseSetupHealth rendering', () => {
  it('complete tone renders green', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseSetupHealth, { tone: 'complete' }));
    expect(html).toContain('#15803D');
  });

  it('error tone renders red and "Has issues"', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseSetupHealth, { tone: 'error' }));
    expect(html).toContain('#DC2626');
    expect(html).toContain('Has issues');
  });

  it('partial tone renders amber and "Partial"', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseSetupHealth, { tone: 'partial' }));
    expect(html).toContain('#D97706');
    expect(html).toContain('Partial');
  });

  it('shows blocking count when provided', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseSetupHealth, { tone: 'error', blockingCount: 3 }));
    expect(html).toContain('(3)');
  });

  it('compact mode renders without label text', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseSetupHealth, { tone: 'error', compact: true }));
    expect(html).not.toContain('Has issues');
  });
});

// ─── WarehouseScopeBadge rendering ───────────────────────────────────────────

describe('WarehouseScopeBadge rendering', () => {
  it('Organization scope renders blue badge', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseScopeBadge, { scope: 'Organization' }));
    expect(html).toContain('Organization');
    expect(html).toContain('#1D4ED8');
  });

  it('Branch scope renders purple badge', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseScopeBadge, { scope: 'Branch' }));
    expect(html).toContain('Branch');
    expect(html).toContain('#6D28D9');
  });
});

// ─── WarehouseModeBadge rendering ────────────────────────────────────────────

describe('WarehouseModeBadge rendering', () => {
  it('Warehouse-Level renders indigo badge', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseModeBadge, { mode: 'Warehouse-Level' }));
    expect(html).toContain('Warehouse-Level');
    expect(html).toContain('#3730A3');
  });

  it('Location-BIN-Level renders teal badge', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseModeBadge, { mode: 'Location-BIN-Level' }));
    expect(html).toContain('Location-BIN-Level');
    expect(html).toContain('#065F46');
  });

  it('sm size shows short label', () => {
    const html = renderToStaticMarkup(React.createElement(WarehouseModeBadge, { mode: 'Warehouse-Level', size: 'sm' }));
    expect(html).toContain('WH-Level');
  });
});

// ─── ValidationIssuePanel rendering ──────────────────────────────────────────

describe('ValidationIssuePanel rendering', () => {
  it('renders nothing for empty issue list', () => {
    const html = renderToStaticMarkup(React.createElement(ValidationIssuePanel, { issues: [] }));
    expect(html).toBe('');
  });

  it('renders error issue with red styling', () => {
    const issues = [
      { severity: 'error' as const, category: 'IdentityMissing' as const, section: 'identity', message: 'Warehouse code is required.' },
    ];
    const html = renderToStaticMarkup(React.createElement(ValidationIssuePanel, { issues }));
    expect(html).toContain('Warehouse code is required.');
    expect(html).toContain('#DC2626');
  });

  it('compact mode shows error count summary', () => {
    const issues = [
      { severity: 'error' as const, category: 'IdentityMissing' as const, section: 'identity', message: 'Error A.' },
      { severity: 'error' as const, category: 'IdentityMissing' as const, section: 'identity', message: 'Error B.' },
    ];
    const html = renderToStaticMarkup(React.createElement(ValidationIssuePanel, { issues, compact: true }));
    expect(html).toContain('2 blocking issues');
  });

  it('maxVisible truncates visible issues', () => {
    const issues = Array.from({ length: 5 }, (_, i) => ({
      severity: 'warning' as const,
      category: 'PolicyConflict' as const,
      section: 'policy',
      message: `Warning ${i + 1}`,
    }));
    const html = renderToStaticMarkup(React.createElement(ValidationIssuePanel, { issues, maxVisible: 2 }));
    expect(html).toContain('+3 more issues');
    expect(html).toContain('Warning 1');
    expect(html).not.toContain('Warning 5');
  });
});

// ─── Mock adapter integration ─────────────────────────────────────────────────

describe('warehouseMockAdapter.listWarehouses', () => {
  beforeEach(() => __resetMockStores());

  it('returns seed warehouses with summary shape', async () => {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 20 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('setupHealth');
    expect(result.items[0]).toHaveProperty('binManaged');
  });

  it('search filter narrows results', async () => {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 20, search: 'WH-PUNE' });
    expect(result.items.length).toBe(1);
    expect(result.items[0].warehouseCode).toBe('WH-PUNE-01');
  });

  it('status filter works', async () => {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 20, status: 'Active' });
    expect(result.items.every((w) => w.status === 'Active')).toBe(true);
  });

  it('includes owningCode in returned summaries', async () => {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 20 });
    const orgScoped = result.items.find((w) => w.ownershipScope === 'Organization');
    expect(orgScoped?.owningCode).toBeTruthy();
  });
});
