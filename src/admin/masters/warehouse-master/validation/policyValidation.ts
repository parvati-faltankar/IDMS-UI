// ─── Warehouse Master — Policy Validation ────────────────────────────────────

import type {
  AllocationPolicy,
  CapacityPolicy,
  CycleCountPolicy,
  EligibilityPolicy,
  PutawayPolicy,
  PickingPolicy,
  ReservationPolicy,
  StorageConstraints,
} from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';
import type { InventoryControlMode } from '../types/warehouse.enums';
import {
  validateCapacityAndConstraints,
  validateReservationAllocationPolicies,
} from '../utils/policyWorkbench';

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

  if (policy.enabled && (!policy.strategySequence || policy.strategySequence.length === 0)) {
    issues.push({
      field: 'autoPutaway.strategySequence',
      section: 'autoPutaway',
      severity: 'error',
      category: 'FieldRequired',
      message: 'At least one ordered putaway strategy is required when Auto Putaway is enabled.',
    });
  }

  if (policy.strategySequence && policy.strategySequence[0] !== policy.strategy) {
    issues.push({
      field: 'autoPutaway.strategySequence',
      section: 'autoPutaway',
      severity: 'warning',
      category: 'DerivedFieldMismatch',
      message: 'Primary putaway strategy should match the first entry in the ordered strategy list.',
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

  if (policy.enabled && (!policy.strategySequence || policy.strategySequence.length === 0)) {
    issues.push({
      field: 'autoPicking.strategySequence',
      section: 'autoPicking',
      severity: 'error',
      category: 'FieldRequired',
      message: 'At least one ordered picking strategy is required when Auto Picking is enabled.',
    });
  }

  if (policy.strategySequence && policy.strategySequence[0] !== policy.strategy) {
    issues.push({
      field: 'autoPicking.strategySequence',
      section: 'autoPicking',
      severity: 'warning',
      category: 'DerivedFieldMismatch',
      message: 'Primary picking strategy should match the first entry in the ordered strategy list.',
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
    const hasBlocked = policy.rules.some((rule) => rule.allowedOrBlocked === 'Blocked');
    const hasAllowed = policy.rules.some((rule) => rule.allowedOrBlocked === 'Allowed');

    if ((policy.mode === 'Basic-Hybrid' || policy.mode === 'Advanced-Hybrid') && !hasBlocked) {
      issues.push({
        section: 'itemEligibility',
        severity: 'info',
        category: 'PolicyConflict',
        message: 'Hybrid modes work best when explicit deny rules are configured before allow rules.',
      });
    }

    if (policy.mode === 'Category-Based' && !policy.rules.every((rule) => rule.ruleType === 'Category')) {
      issues.push({
        field: 'eligibilityPolicy.rules',
        section: 'itemEligibility',
        severity: 'warning',
        category: 'PolicyConflict',
        message: 'Category-Based mode should use category rules only.',
      });
    }

    if (policy.mode === 'Restricted' && !hasAllowed) {
      issues.push({
        field: 'eligibilityPolicy.rules',
        section: 'itemEligibility',
        severity: 'error',
        category: 'FieldRequired',
        message: 'Restricted mode requires at least one allow rule.',
      });
    }
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

  issues.push(...validateReservationAllocationPolicies(policy, undefined, mode));

  return issues;
}

export function validateAllocationPolicy(
  policy: Partial<AllocationPolicy> | undefined,
  reservationPolicy: Partial<ReservationPolicy> | undefined,
  mode: InventoryControlMode,
): ValidationIssue[] {
  return validateReservationAllocationPolicies(reservationPolicy, policy, mode).filter(
    (issue) =>
      issue.field === 'allocationPolicy.allocationLevel'
      || issue.field === 'allocationPolicy.eligibleLocationTypes',
  );
}

export function validateCapacityPolicy(
  policy: Partial<CapacityPolicy> | undefined,
  storageConstraints: Partial<StorageConstraints> | undefined,
  scope: 'warehouse' | 'location',
  mode?: InventoryControlMode,
): ValidationIssue[] {
  return validateCapacityAndConstraints(policy, storageConstraints, scope, mode);
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
