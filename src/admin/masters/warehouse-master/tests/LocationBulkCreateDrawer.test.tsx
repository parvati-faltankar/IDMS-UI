import { beforeEach, describe, expect, it } from 'vitest';
import { buildBulkPreviewFingerprint, isPreviewInvalidated, makeDefaultBulkState } from '../components/LocationBulkCreateDrawer';
import { __resetMockStores, warehouseMockAdapter } from '../services/warehouseMockAdapter';

describe('LocationBulkCreateDrawer helpers', () => {
  it('invalidates preview when input changes', () => {
    const state = makeDefaultBulkState(null);
    const fingerprint = buildBulkPreviewFingerprint(state);
    expect(isPreviewInvalidated(fingerprint, { ...state, count: state.count + 1 })).toBe(true);
  });
});

describe('bulk preview and atomic commit simulation', () => {
  beforeEach(() => __resetMockStores());

  it('detects duplicate within generated batch', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      level: 5,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'B',
      namePrefix: 'BIN',
      startSequence: 1,
      count: 2,
      sequenceLength: 3,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-001',
    });
    expect(preview.conflictCount).toBeGreaterThan(0);
  });

  it('commits atomically when preview is valid', async () => {
    const preview = await warehouseMockAdapter.bulkPreviewLocations('WH-0002', {
      warehouseId: 'WH-0002',
      parentLocationId: 'LOC-0008',
      level: 5,
      locationType: 'BIN',
      binType: 'Standard',
      codePrefix: 'XBN',
      namePrefix: 'Extra BIN',
      startSequence: 10,
      count: 2,
      sequenceLength: 3,
      separator: '',
      suffix: '',
      idempotencyKey: 'TEST-BULK-002',
    });
    const result = await warehouseMockAdapter.commitBulkLocations('WH-0002', {
      warehouseId: 'WH-0002',
      previewToken: preview.previewToken,
      paramsHash: preview.paramsHash,
      idempotencyKey: 'TEST-BULK-002',
    });
    expect(result.success).toBe(true);
    expect(result.createdCount).toBe(2);
  });
});
