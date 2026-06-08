import { describe, expect, it } from 'vitest';

import { resolveEligibility, SOURCE_PRIORITY } from '../utils/rulePrecedence';
import {
  addOrderedStrategy,
  moveOrderedStrategy,
  restoreRecommendedOrder,
  simulatePickingStrategy,
  simulatePutawayStrategy,
  validateCapacityAndConstraints,
  validateReservationAllocationPolicies,
  validateStockStateSeparation,
} from '../utils/policyWorkbench';
import type { EligibilityPolicy, WarehouseLocation } from '../types/warehouse.types';
import type { RuleEntry } from '../utils/rulePrecedence';

function makeLocation(overrides: Partial<WarehouseLocation> = {}): WarehouseLocation {
  return {
    id: 'LOC-001',
    warehouseId: 'WH-001',
    locationCode: 'B001',
    locationName: 'Bin 001',
    status: 'Active',
    parentLocationId: 'SHELF-1',
    profile: {
      locationType: 'BIN',
      binType: 'Standard',
      level: 5,
      fullCode: 'WH-001-Z01-A01-R01-S01-B001',
      isLeafEndpoint: true,
      inventoryAllowed: true,
    },
    capacity: {
      maxUnits: 100,
      currentUnits: 20,
    },
    putawayBlocked: false,
    pickingBlocked: false,
    movementState: 'Idle',
    commitmentState: 'Uncommitted',
    stockStatuses: ['Available'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

describe('validateCapacityAndConstraints', () => {
  it('flags negative capacity values', () => {
    const issues = validateCapacityAndConstraints(
      { trackingEnabled: true, squareFootage: -1, temperatureControlled: false, hazardousStorage: false },
      {},
      'warehouse',
    );
    expect(issues.some((issue) => issue.field === 'capacityPolicy.squareFootage')).toBe(true);
  });

  it('blocks hazmat class when hazardous storage is disabled', () => {
    const issues = validateCapacityAndConstraints(
      { trackingEnabled: true, temperatureControlled: false, hazardousStorage: false },
      { hazmatClass: 'Class III' },
      'warehouse',
    );
    expect(issues.some((issue) => issue.field === 'storageConstraints.hazmatClass')).toBe(true);
  });
});

describe('eligibility deny before allow', () => {
  it('returns blocked when both allow and deny rules match', () => {
    const policy: EligibilityPolicy = {
      mode: 'Advanced-Hybrid',
      defaultFallback: 'Allow',
      rules: [
        { ruleId: 'ALLOW-1', ruleType: 'ItemCode', ruleValue: 'ITEM-1', allowedOrBlocked: 'Allowed' },
        { ruleId: 'BLOCK-1', ruleType: 'ItemCode', ruleValue: 'ITEM-1', allowedOrBlocked: 'Blocked' },
      ],
    };

    const entries: RuleEntry<EligibilityPolicy>[] = [
      { source: 'warehouse', priority: SOURCE_PRIORITY.warehouse, rule: policy },
    ];

    const result = resolveEligibility('ITEM-1', 'CAT-1', entries);
    expect(result.eligible).toBe(false);
    expect(result.matchedRule?.allowedOrBlocked).toBe('Blocked');
  });
});

describe('ordered strategy helpers', () => {
  it('adds strategy only once and preserves order', () => {
    expect(addOrderedStrategy(['FEFO', 'FIFO'], 'FEFO')).toEqual(['FEFO', 'FIFO']);
    expect(addOrderedStrategy(['FEFO', 'FIFO'], 'Zone-Directed')).toEqual(['FEFO', 'FIFO', 'Zone-Directed']);
  });

  it('moves putaway strategies up and down in order', () => {
    expect(moveOrderedStrategy(['FEFO', 'FIFO', 'Zone-Directed'], 2, 'up')).toEqual(['FEFO', 'Zone-Directed', 'FIFO']);
  });

  it('restores recommended picking order while keeping active members only', () => {
    expect(restoreRecommendedOrder(['Cluster', 'FEFO', 'Batch'], ['FEFO', 'FIFO', 'Batch', 'Cluster'])).toEqual(['FEFO', 'Batch', 'Cluster']);
  });
});

describe('strategy simulations', () => {
  const locations = [
    makeLocation({ id: '1', locationCode: 'B001', capacity: { maxUnits: 100, currentUnits: 50 } }),
    makeLocation({ id: '2', locationCode: 'B002', capacity: { maxUnits: 100, currentUnits: 10 }, updatedAt: '2024-01-01T00:00:00.000Z' }),
    makeLocation({ id: '3', locationCode: 'B003', putawayBlocked: true, pickingBlocked: true }),
  ];

  it('uses the first putaway strategy as the ordering driver', () => {
    const result = simulatePutawayStrategy(['Capacity-Optimised', 'FEFO'], locations);
    expect(result.orderedStrategies[0]).toBe('Capacity-Optimised');
    expect(result.selectedResult?.locationCode).toBe('B002');
  });

  it('uses the first picking strategy as the ordering driver after filters', () => {
    const result = simulatePickingStrategy(['FEFO', 'FIFO'], locations);
    expect(result.orderedStrategies[0]).toBe('FEFO');
    expect(result.candidates.every((candidate) => candidate.locationCode !== 'B003')).toBe(true);
  });
});

describe('stock state separation', () => {
  it('rejects reserved and allocated as stock availability states', () => {
    const issues = validateStockStateSeparation(['Available', 'Reserved', 'Allocated']);
    expect(issues.some((issue) => issue.field === 'stockStatuses')).toBe(true);
  });
});

describe('reservation and allocation validation', () => {
  it('blocks broader allocation than reservation scope', () => {
    const issues = validateReservationAllocationPolicies(
      { reservationLevel: 'BIN', eligibleLocationTypes: ['BIN'], allowPartialReservation: true },
      { allocationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialAllocation: true },
      'Location-BIN-Level',
    );
    expect(issues.some((issue) => issue.field === 'allocationPolicy.allocationLevel')).toBe(true);
  });

  it('blocks location reservation in warehouse-level mode', () => {
    const issues = validateReservationAllocationPolicies(
      { reservationLevel: 'Location', eligibleLocationTypes: ['BIN'], allowPartialReservation: true },
      { allocationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialAllocation: true },
      'Warehouse-Level',
    );
    expect(issues.some((issue) => issue.field === 'reservationPolicy.reservationLevel')).toBe(true);
  });
});
