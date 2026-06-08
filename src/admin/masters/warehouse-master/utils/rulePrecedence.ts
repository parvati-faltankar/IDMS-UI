// ─── Warehouse Master — Rule Precedence ──────────────────────────────────────
//
// When multiple rule sources exist (warehouse, location, item profile, owner,
// transaction), the most restrictive rule wins.
// This module provides the pure evaluation functions for that resolution.

import type {
  EligibilityPolicy,
  EligibilityRule,
  ReservationPolicy,
} from '../types/warehouse.types';
import type { ValidationIssue } from '../types/warehouse.types';

// ─── Rule sources ─────────────────────────────────────────────────────────────

export type RuleSource =
  | 'warehouse'
  | 'location'
  | 'itemProfile'
  | 'inventoryOwner'
  | 'transaction';

export interface RuleEntry<T> {
  readonly source: RuleSource;
  readonly rule: T;
  readonly priority: number; // lower = higher priority
}

// ─── Priority order (most restrictive / highest authority first) ─────────────

const SOURCE_PRIORITY: Record<RuleSource, number> = {
  transaction: 1,     // highest — in-flight transaction locks override everything
  inventoryOwner: 2,  // owner-level policies
  itemProfile: 3,     // item-specific rules
  location: 4,        // location-level rules
  warehouse: 5,       // warehouse-level default rules (lowest authority)
};

// ─── Eligibility resolution ───────────────────────────────────────────────────

export interface EligibilityResolution {
  readonly eligible: boolean;
  readonly determinedBy: RuleSource;
  readonly matchedRule?: EligibilityRule;
  readonly reason?: string;
}

/**
 * Resolves item eligibility across multiple rule sources using most-restrictive-wins.
 * A 'Blocked' result from any source overrides 'Allowed' from all others.
 */
export function resolveEligibility(
  itemCode: string,
  categoryCode: string,
  ruleEntries: RuleEntry<EligibilityPolicy>[],
): EligibilityResolution {
  const sorted = [...ruleEntries].sort((a, b) => a.priority - b.priority);

  let lastAllowed: EligibilityResolution | null = null;

  for (const entry of sorted) {
    const { result } = evaluateSinglePolicy(
      itemCode,
      categoryCode,
      entry.rule,
      entry.source,
    );

    if (result.eligible === false) {
      // First explicit block wins — most restrictive
      return result;
    }
    if (result.eligible === true) {
      lastAllowed = result;
    }
  }

  if (lastAllowed) return lastAllowed;

  // No rule matched — use the lowest-priority default fallback
  const fallbackEntry = sorted[sorted.length - 1];
  const fallback = fallbackEntry?.rule.defaultFallback ?? 'Allow';
  return {
    eligible: fallback === 'Allow',
    determinedBy: fallbackEntry?.source ?? 'warehouse',
    reason: `Default fallback (${fallback}) from ${fallbackEntry?.source ?? 'warehouse'} policy.`,
  };
}

function evaluateSinglePolicy(
  itemCode: string,
  categoryCode: string,
  policy: EligibilityPolicy,
  source: RuleSource,
): { policy: EligibilityPolicy; source: RuleSource; result: EligibilityResolution } {
  if (policy.mode === 'Open') {
    return { policy, source, result: { eligible: true, determinedBy: source } };
  }

  // Check blocked first (most restrictive)
  for (const rule of policy.rules) {
    if (rule.allowedOrBlocked === 'Blocked') {
      const matches =
        (rule.ruleType === 'ItemCode' && rule.ruleValue === itemCode) ||
        (rule.ruleType === 'Category' && rule.ruleValue === categoryCode);
      if (matches) {
        return {
          policy,
          source,
          result: {
            eligible: false,
            determinedBy: source,
            matchedRule: rule,
            reason: `Blocked by ${source} policy rule: ${rule.ruleLabel ?? rule.ruleValue}`,
          },
        };
      }
    }
  }

  if (policy.mode === 'Restricted') {
    // In Restricted mode, item must be in the allowed list
    const allowed = policy.rules.find(
      (r) =>
        r.allowedOrBlocked === 'Allowed' &&
        ((r.ruleType === 'ItemCode' && r.ruleValue === itemCode) ||
          (r.ruleType === 'Category' && r.ruleValue === categoryCode)),
    );
    if (!allowed) {
      return {
        policy,
        source,
        result: {
          eligible: false,
          determinedBy: source,
          reason: `Item not in allowed list for Restricted ${source} policy.`,
        },
      };
    }
    return {
      policy,
      source,
      result: { eligible: true, determinedBy: source, matchedRule: allowed },
    };
  }

  // Hybrid / Category-Based: no explicit block found → check for an allow rule
  const allowRule = policy.rules.find(
    (r) =>
      r.allowedOrBlocked === 'Allowed' &&
      ((r.ruleType === 'ItemCode' && r.ruleValue === itemCode) ||
        (r.ruleType === 'Category' && r.ruleValue === categoryCode)),
  );
  if (allowRule) {
    return {
      policy,
      source,
      result: { eligible: true, determinedBy: source, matchedRule: allowRule },
    };
  }

  // Fall to default fallback
  return {
    policy,
    source,
    result: {
      eligible: policy.defaultFallback === 'Allow',
      determinedBy: source,
      reason: `Default fallback (${policy.defaultFallback}) from ${source}.`,
    },
  };
}

// ─── Reservation resolution ───────────────────────────────────────────────────

export interface ReservationResolution {
  readonly effectiveLevel: 'Warehouse' | 'Location' | 'BIN';
  readonly determinedBy: RuleSource;
  readonly reason?: string;
}

/**
 * Most restrictive reservation level wins:
 * BIN > Location > Warehouse (BIN = most granular = most restrictive).
 */
export function resolveReservationLevel(
  warehousePolicy: ReservationPolicy | undefined,
  locationPolicy: ReservationPolicy | undefined,
): ReservationResolution {
  const levelPriority: Record<'Warehouse' | 'Location' | 'BIN', number> = {
    BIN: 3,
    Location: 2,
    Warehouse: 1,
  };

  let highest: { level: 'Warehouse' | 'Location' | 'BIN'; source: RuleSource } = {
    level: 'Warehouse',
    source: 'warehouse',
  };

  if (warehousePolicy) {
    const lp = levelPriority[warehousePolicy.reservationLevel];
    if (lp > levelPriority[highest.level]) {
      highest = { level: warehousePolicy.reservationLevel, source: 'warehouse' };
    }
  }
  if (locationPolicy) {
    const lp = levelPriority[locationPolicy.reservationLevel];
    if (lp > levelPriority[highest.level]) {
      highest = { level: locationPolicy.reservationLevel, source: 'location' };
    }
  }

  return {
    effectiveLevel: highest.level,
    determinedBy: highest.source,
    reason: `Effective reservation level is ${highest.level} (determined by ${highest.source} policy).`,
  };
}

// ─── Policy conflict detection ────────────────────────────────────────────────

/**
 * Identifies conflicts between policies from different sources.
 * Returns validation issues for each detected conflict.
 */
export function detectPolicyConflicts(
  warehousePolicy: EligibilityPolicy | undefined,
  locationPolicy: EligibilityPolicy | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!warehousePolicy || !locationPolicy) return issues;

  // A warehouse-level blocked rule superseded by a location-level allowed rule
  for (const warehouseRule of warehousePolicy.rules) {
    if (warehouseRule.allowedOrBlocked !== 'Blocked') continue;
    const locationConflict = locationPolicy.rules.find(
      (lr) =>
        lr.allowedOrBlocked === 'Allowed' &&
        lr.ruleType === warehouseRule.ruleType &&
        lr.ruleValue === warehouseRule.ruleValue,
    );
    if (locationConflict) {
      issues.push({
        section: 'itemEligibility',
        severity: 'warning',
        category: 'PolicyConflict',
        message: `Item/category "${warehouseRule.ruleValue}" is blocked at warehouse level but allowed at location level. Warehouse block takes precedence.`,
        detail: 'Most-restrictive-wins: the warehouse block will override the location allow rule.',
      });
    }
  }

  return issues;
}

// ─── Export source priority for tests ────────────────────────────────────────

export { SOURCE_PRIORITY };
