import { describe, expect, it } from 'vitest';
import { buildLocationRowModel, filterLocationRows, getLocationEmptyState } from '../pages/WarehouseLocationsPage';
import { SEED_LOCATIONS, WH_BIN_LEVEL_ACTIVE } from '../fixtures/warehouseFixtures';

describe('WarehouseLocationsPage helpers', () => {
  it('builds row model with derived effective status and path', () => {
    const row = buildLocationRowModel(SEED_LOCATIONS[0], WH_BIN_LEVEL_ACTIVE.status);
    expect(row.fullPath).toContain('WH-PUNE-01');
    expect(row.effectiveStatus).toBe('Active');
  });

  it('filters by inventory allowed and search', () => {
    const rows = filterLocationRows(SEED_LOCATIONS, WH_BIN_LEVEL_ACTIVE.status, 'B001', {
      level: '',
      parentId: '',
      locationType: '',
      binType: '',
      status: '',
      inventoryAllowed: 'yes',
      capacityWarning: '',
      putawayBlocked: '',
      pickingBlocked: '',
      eligibilityMode: '',
      issuesOnly: '',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].locationCode).toBe('B001');
  });

  it('returns empty state for no-result filter case', () => {
    expect(getLocationEmptyState(4, 0, true)).toBe('No locations match the current filters.');
    expect(getLocationEmptyState(0, 0, false)).toBe('No locations configured yet.');
  });
});
