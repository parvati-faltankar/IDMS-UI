// ─── Warehouse Master — Policy Validation ────────────────────────────────────

import type {
  AllocationPolicy,
  CycleCountPolicy,
  EligibilityPolicy,
  PutawayPolicy,
  PickingPolicy,
  ReservationPolicy,
} from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';
import type { InventoryControlMode } from '../types/warehouse.enums';

// ─── Auto Putaway policy ──────────────────────────────────────────────────────

export function validatePutawayPolicy(
  policy: Partial<PutawayPolicy> | undefined,
  mode: InventoryControlMode,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!policy) return issues;

  if (mode === 'Warehouse-Level' && policy.enabled) {
    issues.push({
      field: 'autoPutaway.enabled',
      section: 'autoPutaway',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Auto Putaway is not applicable in Warehouse-Level mode.',
    });
  }

  if (mode === 'Location-BIN-Level' && policy.enabled && !policy.strategy) {
    issues.push({
      field: 'autoPutaway.strategy',
      section: 'autoPutaway',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Putaway Strategy is required when Auto Putaway is enabled.',
    });
  }

  if (policy.strategySequence && policy.strategySequence.length > 5) {
    issues.push({
      field: 'autoPutaway.strategySequence',
      section: 'autoPutaway',
      severity: 'warning',
      category: 'PolicyConflict',
      message: 'More than 5 strategy fallbacks may cause performance degradation.',
    });
  }

  return issues;
}

// ─── Auto Picking policy ──────────────────────────────────────────────────────

export function validatePickingPolicy(
  policy: Partial<PickingPolicy> | undefined,
  mode: InventoryControlMode,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!policy) return issues;

  if (mode === 'Warehouse-Level' && policy.enabled) {
    issues.push({
      field: 'autoPicking.enabled',
      section: 'autoPicking',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Auto Picking is not applicable in Warehouse-Level mode.',
    });
  }

  if (mode === 'Location-BIN-Level' && policy.enabled && !policy.strategy) {
    issues.push({
      field: 'autoPicking.strategy',
      section: 'autoPicking',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Picking Strategy is required when Auto Picking is enabled.',
    });
  }

  return issues;
}

// ─── Eligibility policy ───────────────────────────────────────────────────────

export function validateEligibilityPolicy(
  policy: Partial<EligibilityPolicy> | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!policy) return issues;

  if (!policy.mode) {
    issues.push({
      field: 'eligibilityPolicy.mode',
      section: 'itemEligibility',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Eligibility Mode is required.',
    });
  }

  if (policy.mode === 'Restricted' && (!policy.rules || policy.rules.length === 0)) {
    issues.push({
      section: 'itemEligibility',
      severity: 'error',
      category: 'FieldRequired',
      message: 'Restricted eligibility mode requires at least one allowed item or category rule.',
    });
  }

  if (policy.rules) {
    for (const rule of policy.rules) {
      if (!rule.ruleValue?.trim()) {
        issues.push({
          section: 'itemEligibility',
          severity: 'error',
          category: 'FieldRequired',
          message: 'All eligibility rules must have a value.',
        });
        break;
      }
    }
  }

  return issues;
}

// ─── Reservation policy ───────────────────────────────────────────────────────

export function validateReservationPolicy(
  policy: Partial<ReservationPolicy> | undefined,
  mode: InventoryControlMode,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!policy) return issues;

  if (
    mode === 'Warehouse-Level' &&
    (policy.reservationLevel === 'Location' || policy.reservationLevel === 'BIN')
  ) {
    issues.push({
      field: 'reservationPolicy.reservationLevel',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'PolicyConflict',
      message: 'Reservation at Location or BIN level is not possible in Warehouse-Level mode.',
    });
  }

  if (
    policy.autoReleaseAfterHours !== undefined &&
    (policy.autoReleaseAfterHours < 0 || policy.autoReleaseAfterHours > 8760)
  ) {
    issues.push({
      field: 'reservationPolicy.autoReleaseAfterHours',
      section: 'reservationAllocation',
      severity: 'error',
      category: 'FieldFormat',
      message: 'Auto release hours must be between 0 and 8760 (1 year).',
    });
  }

  return issues;
}

// ─── Cycle count policy ───────────────────────────────────────────────────────

export function validateCycleCountPolicy(
  policy: Partial<CycleCountPolicy> | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!policy) return issues;

  if (policy.enabled) {
    if (!policy.scope) {
      issues.push({
        field: 'cycleCountPolicy.scope',
        section: 'cycleCount',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Cycle Count Scope is required when Cycle Count is enabled.',
      });
    }
    if (!policy.frequency) {
      issues.push({
        field: 'cycleCountPolicy.frequency',
        section: 'cycleCount',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Cycle Count Frequency is required when Cycle Count is enabled.',
      });
    }
    if (
      policy.varianceTolerance !== undefined &&
      (policy.varianceTolerance < 0 || policy.varianceTolerance > 100)
    ) {
      issues.push({
        field: 'cycleCountPolicy.varianceTolerance',
        section: 'cycleCount',
        severity: 'error',
        category: 'FieldFormat',
        message: 'Variance Tolerance must be between 0 and 100.',
      });
    }
  }

  return issues;
}
