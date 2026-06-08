import type {
  AllocationPolicy,
  CapacityPolicy,
  DefaultLocations,
  EligibilityPolicy,
  LocationCapacity,
  ReservationPolicy,
  StorageConstraints,
  ValidationIssue,
  WarehouseLocation,
} from '../types/warehouse.types';
import type {
  AllocationLevel,
  DefaultLocationPurpose,
  InventoryControlMode,
  PickingStrategy,
  PutawayStrategy,
  ReservationLevel,
} from '../types/warehouse.enums';
import { evaluateCapacityState } from './warehouseDerivations';

const INVALID_STOCK_AVAILABILITY_STATES = ['Reserved', 'Allocated', 'Picked', 'Packed'] as const;

const PURPOSE_LABELS: Record<keyof DefaultLocations, DefaultLocationPurpose> = {
  putaway: 'Putaway',
  picking: 'Picking',
  return: 'Return',
  qc: 'QC',
  staging: 'Staging',
  scrap: 'Scrap',
};

const STRATEGY_RANKERS = {
  putaway: {
    FIFO: (location: WarehouseLocation) => location.createdAt,
    LIFO: (location: WarehouseLocation) => reverseLex(location.createdAt),
    FEFO: (location: WarehouseLocation) => location.updatedAt,
    'Nearest-Empty': (location: WarehouseLocation) => emptySpaceScore(location.capacity),
    'Fixed-BIN': (location: WarehouseLocation) => startsWithStrongPrefix(location.locationCode, 'B001'),
    Random: (location: WarehouseLocation) => location.id,
    'Zone-Directed': (location: WarehouseLocation) => location.parentLocationId ?? '',
    'Capacity-Optimised': (location: WarehouseLocation) => capacityScore(location.capacity),
  } satisfies Record<PutawayStrategy, (location: WarehouseLocation) => string | number>,
  picking: {
    FIFO: (location: WarehouseLocation) => location.createdAt,
    FEFO: (location: WarehouseLocation) => location.updatedAt,
    LIFO: (location: WarehouseLocation) => reverseLex(location.createdAt),
    LEFO: (location: WarehouseLocation) => reverseLex(location.updatedAt),
    'Zone-Wave': (location: WarehouseLocation) => location.parentLocationId ?? '',
    Batch: (location: WarehouseLocation) => location.locationCode,
    'Single-Order': (location: WarehouseLocation) => location.locationName,
    Cluster: (location: WarehouseLocation) => location.id,
  } satisfies Record<PickingStrategy, (location: WarehouseLocation) => string | number>,
};

function reverseLex(value: string): string {
  return [...value].reverse().join('');
}

function emptySpaceScore(capacity?: LocationCapacity): number {
  if (!capacity) return 999999;
  return (capacity.maxUnits ?? 0) - (capacity.currentUnits ?? 0);
}

function capacityScore(capacity?: LocationCapacity): number {
  if (!capacity) return 0;
  const max = capacity.maxUnits ?? capacity.maxWeightKg ?? capacity.maxVolumeM3 ?? 0;
  const current = capacity.currentUnits ?? capacity.currentWeightKg ?? capacity.currentVolumeM3 ?? 0;
  return max > 0 ? current / max : 0;
}

function startsWithStrongPrefix(value: string, preferredPrefix: string): number {
  return value.startsWith(preferredPrefix) ? 0 : 1;
}

function levelPriority(level: ReservationLevel | AllocationLevel): number {
  if (level === 'BIN') return 3;
  if (level === 'Location') return 2;
  return 1;
}

export function addOrderedStrategy<T extends string>(
  current: readonly T[],
  nextStrategy: T,
): T[] {
  return current.includes(nextStrategy) ? [...current] : [...current, nextStrategy];
}

export function removeOrderedStrategy<T extends string>(
  current: readonly T[],
  strategy: T,
): T[] {
  return current.filter((entry) => entry !== strategy);
}

export function moveOrderedStrategy<T>(
  current: readonly T[],
  index: number,
  direction: 'up' | 'down',
): T[] {
  const next = [...current];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= next.length || targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }

  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function restoreRecommendedOrder<T extends string>(
  current: readonly T[],
  recommended: readonly T[],
): T[] {
  const active = new Set(current);
  const ordered = recommended.filter((entry) => active.has(entry));
  const tail = current.filter((entry) => !ordered.includes(entry));
  return [...ordered, ...tail];
}

export function canConfigureLocationEligibility(location: WarehouseLocation): boolean {
  return (
    location.status === 'Active'
    && location.profile.inventoryAllowed
    && location.profile.isLeafEndpoint
  );
}

export function getEligibleDefaultLocations(
  locations: WarehouseLocation[],
  purpose: keyof DefaultLocations,
): WarehouseLocation[] {
  return locations.filter((location) => {
    if (location.status !== 'Active') return false;

    switch (purpose) {
      case 'putaway':
        return location.profile.inventoryAllowed && location.profile.isLeafEndpoint && !location.putawayBlocked;
      case 'picking':
        return location.profile.inventoryAllowed && location.profile.isLeafEndpoint && !location.pickingBlocked;
      case 'return':
        return location.profile.locationType === 'Zone' || location.profile.locationType === 'Staging' || location.profile.locationType === 'BIN';
      case 'qc':
        return location.profile.locationType === 'QC';
      case 'staging':
        return location.profile.locationType === 'Staging';
      case 'scrap':
        return location.profile.locationType === 'Scrap';
      default:
        return false;
    }
  });
}

export function validateCapacityAndConstraints(
  capacityPolicy: Partial<CapacityPolicy> | undefined,
  storageConstraints: Partial<StorageConstraints> | undefined,
  scope: 'warehouse' | 'location',
  inventoryMode?: InventoryControlMode,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const capacity = capacityPolicy ?? {};
  const storage = storageConstraints ?? {};

  const positiveFields: Array<[keyof CapacityPolicy, string]> = [
    ['squareFootage', 'Square footage'],
    ['heightMeters', 'Height'],
    ['floorLoadKgPerSqm', 'Floor load'],
    ['rackLoadKg', 'Rack load'],
    ['dockCount', 'Dock count'],
  ];

  for (const [field, label] of positiveFields) {
    const value = capacity[field];
    if (typeof value === 'number' && value < 0) {
      issues.push({
        field: `capacityPolicy.${String(field)}`,
        section: 'capacityStorage',
        severity: 'error',
        category: 'FieldFormat',
        message: `${label} cannot be negative.`,
      });
    }
  }

  if (
    storage.minTempCelsius !== undefined
    && storage.maxTempCelsius !== undefined
    && storage.minTempCelsius > storage.maxTempCelsius
  ) {
    issues.push({
      field: 'storageConstraints.minTempCelsius',
      section: 'capacityStorage',
      severity: 'error',
      category: 'FieldFormat',
      message: 'Minimum temperature cannot be greater than maximum temperature.',
    });
  }

  if (
    storage.humidityPercent !== undefined
    && (storage.humidityPercent < 0 || storage.humidityPercent > 100)
  ) {
    issues.push({
      field: 'storageConstraints.humidityPercent',
      section: 'capacityStorage',
      severity: 'error',
      category: 'FieldFormat',
      message: 'Humidity must be between 0 and 100 percent.',
    });
  }

  if (!capacity.temperatureControlled && (storage.minTempCelsius !== undefined || storage.maxTempCelsius !== undefined)) {
    issues.push({
      field: 'capacityPolicy.temperatureControlled',
      section: 'capacityStorage',
      severity: 'warning',
      category: 'PolicyConflict',
      message: 'Temperature limits are configured while temperature-controlled storage is disabled.',
      detail: 'Enable temperature-controlled storage or clear the temperature limits.',
    });
  }

  if (!capacity.hazardousStorage && storage.hazmatClass) {
    issues.push({
      field: 'storageConstraints.hazmatClass',
      section: 'capacityStorage',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Hazmat class cannot be configured when hazardous storage is disabled.',
    });
  }

  if (storage.complianceLockRequired && !storage.complianceLockCode?.trim()) {
    issues.push({
      field: 'storageConstraints.complianceLockCode',
      section: 'capacityStorage',
      severity: 'error',
      category: 'FieldRequired',
      message: 'A compliance restriction code is required when compliance lock is enabled.',
    });
  }

  if (scope === 'location' && inventoryMode === 'Location-BIN-Level' && capacity.trackingEnabled === false) {
    issues.push({
      field: 'capacityPolicy.trackingEnabled',
      section: 'capacityStorage',
      severity: 'info',
      category: 'PolicyConflict',
      message: 'Location/BIN capacity remains hard only when capacity tracking is enabled for that node.',
    });
  }

  return issues;
}

export function validateStockStateSeparation(
  statuses: readonly string[],
  movementState?: string,
  commitmentState?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const invalidStatuses = statuses.filter((status) =>
    INVALID_STOCK_AVAILABILITY_STATES.includes(status as (typeof INVALID_STOCK_AVAILABILITY_STATES)[number]),
  );

  if (invalidStatuses.length > 0) {
    issues.push({
      field: 'stockStatuses',
      section: 'stockStatusGovernance',
      severity: 'error',
      category: 'PolicyConflict',
      message: `Stock Availability Status cannot contain ${invalidStatuses.join(', ')}.`,
      detail: 'Use Commitment State or workflow progress for reserved, allocated, picked, or packed quantities.',
    });
  }

  if (movementState === 'Locked' && commitmentState === 'Uncommitted') {
    issues.push({
      field: 'movementState',
      section: 'stockStatusGovernance',
      severity: 'warning',
      category: 'PolicyConflict',
      message: 'Movement state is locked while commitment state is still uncommitted.',
    });
  }

  return issues;
}

export function validateReservationAllocationPolicies(
  reservationPolicy: Partial<ReservationPolicy> | undefined,
  allocationPolicy: Partial<AllocationPolicy> | undefined,
  mode: InventoryControlMode,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const reservation = reservationPolicy ?? {};
  const allocation = allocationPolicy ?? {};

  if (
    mode === 'Warehouse-Level'
    && (reservation.reservationLevel === 'Location' || reservation.reservationLevel === 'BIN')
  ) {
    issues.push({
      field: 'reservationPolicy.reservationLevel',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Warehouse-Level mode cannot reserve at Location or BIN granularity.',
    });
  }

  if (
    mode === 'Warehouse-Level'
    && (allocation.allocationLevel === 'Location' || allocation.allocationLevel === 'BIN')
  ) {
    issues.push({
      field: 'allocationPolicy.allocationLevel',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Warehouse-Level mode cannot allocate at Location or BIN granularity.',
    });
  }

  if (
    reservation.reservationLevel
    && allocation.allocationLevel
    && levelPriority(allocation.allocationLevel) < levelPriority(reservation.reservationLevel)
  ) {
    issues.push({
      field: 'allocationPolicy.allocationLevel',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Allocation cannot be broader than the reservation scope.',
      detail: 'Reservation protects quantity first; allocation must lock the same or a narrower source scope.',
    });
  }

  if (
    reservation.reservationLevel
    && reservation.reservationLevel !== 'Warehouse'
    && reservation.eligibleLocationTypes
    && reservation.eligibleLocationTypes.length === 0
  ) {
    issues.push({
      field: 'reservationPolicy.eligibleLocationTypes',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Eligible location types are required for Location or BIN reservation.',
    });
  }

  if (
    allocation.allocationLevel
    && allocation.allocationLevel !== 'Warehouse'
    && allocation.eligibleLocationTypes
    && allocation.eligibleLocationTypes.length === 0
  ) {
    issues.push({
      field: 'allocationPolicy.eligibleLocationTypes',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Eligible location types are required for Location or BIN allocation.',
    });
  }

  return issues;
}

export interface StrategySimulationCandidate {
  readonly locationId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly capacityState?: 'available' | 'nearFull' | 'full';
  readonly filtersApplied: string[];
  readonly exclusions: string[];
}

export interface StrategySimulationResult<T extends string> {
  readonly orderedStrategies: T[];
  readonly candidates: StrategySimulationCandidate[];
  readonly selectedResult?: StrategySimulationCandidate;
  readonly tieBreaker?: string;
  readonly warnings: string[];
  readonly previewLabel: string;
}

function sortByStrategy(
  locations: WarehouseLocation[],
  type: 'putaway' | 'picking',
  strategy: PutawayStrategy | PickingStrategy,
): WarehouseLocation[] {
  const ranker = (STRATEGY_RANKERS[type] as Record<string, (location: WarehouseLocation) => string | number>)[strategy];
  return [...locations].sort((left, right) => {
    const leftRank = ranker(left);
    const rightRank = ranker(right);
    if (leftRank < rightRank) return -1;
    if (leftRank > rightRank) return 1;
    return left.locationCode.localeCompare(right.locationCode);
  });
}

function candidateFromLocation(
  location: WarehouseLocation,
  filtersApplied: string[],
  exclusions: string[],
): StrategySimulationCandidate {
  return {
    locationId: location.id,
    locationCode: location.locationCode,
    locationName: location.locationName,
    capacityState: location.capacity ? evaluateCapacityState(location.capacity) : undefined,
    filtersApplied,
    exclusions,
  };
}

export function simulatePutawayStrategy(
  orderedStrategies: readonly PutawayStrategy[],
  locations: WarehouseLocation[],
): StrategySimulationResult<PutawayStrategy> {
  const fallbackStrategies: PutawayStrategy[] = ['FEFO', 'Nearest-Empty', 'Capacity-Optimised'];
  const activeStrategies: PutawayStrategy[] = orderedStrategies.length > 0 ? [...orderedStrategies] : fallbackStrategies;
  const filtered = locations.filter((location) => {
    if (location.status !== 'Active') return false;
    if (!location.profile.inventoryAllowed || !location.profile.isLeafEndpoint) return false;
    if (location.putawayBlocked) return false;
    if (location.capacity && evaluateCapacityState(location.capacity) === 'full') return false;
    return true;
  });

  const warnings: string[] = [];
  if (filtered.length === 0) {
    warnings.push('No eligible destination locations remain after putaway filters.');
  }

  const primary = activeStrategies[0];
  const sorted = sortByStrategy(filtered, 'putaway', primary);
  const candidates = sorted.map((location) =>
    candidateFromLocation(
      location,
      ['Active leaf location', 'Inventory allowed', 'Putaway not blocked', 'Hard-capacity candidate check'],
      location.capacity && evaluateCapacityState(location.capacity) === 'nearFull'
        ? ['Near capacity']
        : [],
    ),
  );

  return {
    orderedStrategies: activeStrategies,
    candidates,
    selectedResult: candidates[0],
    tieBreaker: candidates.length > 1 ? 'Location code ascending after strategy ranking.' : undefined,
    warnings,
    previewLabel: 'Configuration preview only. This is not a production stock decision.',
  };
}

export function simulatePickingStrategy(
  orderedStrategies: readonly PickingStrategy[],
  locations: WarehouseLocation[],
): StrategySimulationResult<PickingStrategy> {
  const fallbackStrategies: PickingStrategy[] = ['FEFO', 'FIFO', 'Zone-Wave'];
  const activeStrategies: PickingStrategy[] = orderedStrategies.length > 0 ? [...orderedStrategies] : fallbackStrategies;
  const filtered = locations.filter((location) => {
    if (location.status !== 'Active') return false;
    if (!location.profile.inventoryAllowed || !location.profile.isLeafEndpoint) return false;
    if (location.pickingBlocked) return false;
    if (!location.stockStatuses.includes('Available')) return false;
    return true;
  });

  const warnings: string[] = [];
  if (filtered.length === 0) {
    warnings.push('No eligible source locations remain after picking filters.');
  }

  const primary = activeStrategies[0];
  const sorted = sortByStrategy(filtered, 'picking', primary);
  const candidates = sorted.map((location) =>
    candidateFromLocation(
      location,
      ['Active leaf location', 'Inventory allowed', 'Picking not blocked', 'Available stock required'],
      location.commitmentState !== 'Uncommitted'
        ? [`Commitment state ${location.commitmentState}`]
        : [],
    ),
  );

  return {
    orderedStrategies: activeStrategies,
    candidates,
    selectedResult: candidates[0],
    tieBreaker: candidates.length > 1 ? 'Location code ascending after strategy ranking.' : undefined,
    warnings,
    previewLabel: 'Configuration preview only. This is not a production stock decision.',
  };
}

export function summarizeEligibilityRuleMode(policy: Partial<EligibilityPolicy> | undefined): string {
  if (!policy?.mode) return 'No eligibility mode configured yet.';
  if (policy.mode === 'Open') return 'All items are allowed unless a location-level deny rule blocks them.';
  if (policy.mode === 'Restricted') return 'Only explicitly allowed items or categories remain eligible.';
  if (policy.mode === 'Category-Based') return 'Category rules drive eligibility with deny rules evaluated first.';
  if (policy.mode === 'Advanced-Hybrid') return 'Hybrid mode evaluates explicit deny rules before allow rules and fallback.';
  return 'Hybrid mode combines allow and deny rules with a fallback outcome.';
}

export { INVALID_STOCK_AVAILABILITY_STATES, PURPOSE_LABELS };
