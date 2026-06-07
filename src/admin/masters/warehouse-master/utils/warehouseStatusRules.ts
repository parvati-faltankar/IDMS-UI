// ─── Warehouse Master — Status Transition Rules ──────────────────────────────
//
// Encodes the full warehouse and location lifecycle as a pure data structure.
// The service layer and UI must consult this module before executing any
// lifecycle transition.

import type { LocationStatus, WarehouseStatus } from '../types/warehouse.enums';

// ─── Warehouse transition matrix ──────────────────────────────────────────────

interface TransitionRule {
  readonly requiresReason: boolean;
  readonly requiresApproval: boolean;
  /** When present, transition is blocked unless caller resolves all blockers. */
  readonly preconditions: string[];
}

type TransitionMatrix<S extends string> = Partial<Record<S, Partial<Record<S, TransitionRule>>>>;

const WAREHOUSE_TRANSITION_MATRIX: TransitionMatrix<WarehouseStatus> = {
  Draft: {
    Active: {
      requiresReason: false,
      requiresApproval: false,
      preconditions: [
        'setup_health_passes',        // setup health readyForActivation = true
        'identity_complete',          // warehouseCode + warehouseName present
        'classification_complete',    // warehouseType + inventoryControlMode present
        'bin_level_requires_template', // if BIN-Level: active hierarchy template exists
        'bin_level_requires_location', // if BIN-Level: ≥1 active inventory-allowed location
      ],
    },
  },
  Active: {
    Blocked: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: [],
    },
    Inactive: {
      requiresReason: true,
      requiresApproval: true,
      preconditions: ['no_open_stock'],
    },
  },
  Blocked: {
    Active: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: [],
    },
    Inactive: {
      requiresReason: true,
      requiresApproval: true,
      preconditions: ['no_open_stock'],
    },
  },
  Inactive: {
    // Reactivation: requires full re-validation (treat as fresh Draft → Active path)
    Active: {
      requiresReason: true,
      requiresApproval: true,
      preconditions: ['setup_health_passes'],
    },
  },
};

// ─── Location transition matrix ───────────────────────────────────────────────

const LOCATION_TRANSITION_MATRIX: TransitionMatrix<LocationStatus> = {
  Draft: {
    Active: {
      requiresReason: false,
      requiresApproval: false,
      preconditions: ['warehouse_active', 'identity_complete', 'hierarchy_valid'],
    },
  },
  Active: {
    Blocked: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: [],
    },
    Inactive: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: ['no_location_stock'],
    },
  },
  Blocked: {
    Active: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: [],
    },
    Inactive: {
      requiresReason: true,
      requiresApproval: false,
      preconditions: ['no_location_stock'],
    },
  },
};

// ─── Query helpers ─────────────────────────────────────────────────────────────

export interface TransitionInfo {
  readonly allowed: boolean;
  readonly requiresReason: boolean;
  readonly requiresApproval: boolean;
  readonly preconditions: string[];
}

export function getWarehouseTransitionInfo(
  from: WarehouseStatus,
  to: WarehouseStatus,
): TransitionInfo {
  const rule = WAREHOUSE_TRANSITION_MATRIX[from]?.[to];
  if (!rule) {
    return { allowed: false, requiresReason: false, requiresApproval: false, preconditions: [] };
  }
  return { allowed: true, ...rule };
}

export function getLocationTransitionInfo(
  from: LocationStatus,
  to: LocationStatus,
): TransitionInfo {
  const rule = LOCATION_TRANSITION_MATRIX[from]?.[to];
  if (!rule) {
    return { allowed: false, requiresReason: false, requiresApproval: false, preconditions: [] };
  }
  return { allowed: true, ...rule };
}

export function getAllowedWarehouseTransitions(from: WarehouseStatus): WarehouseStatus[] {
  return Object.keys(WAREHOUSE_TRANSITION_MATRIX[from] ?? {}) as WarehouseStatus[];
}

export function getAllowedLocationTransitions(from: LocationStatus): LocationStatus[] {
  return Object.keys(LOCATION_TRANSITION_MATRIX[from] ?? {}) as LocationStatus[];
}

// ─── Inventory Control Mode change rules ─────────────────────────────────────

/**
 * Rules that govern when the Inventory Control Mode can be changed.
 * The mode can NEVER revert if BIN stock or history exists in Location-BIN-Level mode.
 */
export interface ModeChangeEligibility {
  readonly allowed: boolean;
  readonly blockedReasons: string[];
}

export function evaluateModeChangeEligibility(
  currentStatus: WarehouseStatus,
  hasExistingBinStock: boolean,
  hasBinMovementHistory: boolean,
  currentMode: string,
  proposedMode: string,
): ModeChangeEligibility {
  const blocked: string[] = [];

  if (currentStatus !== 'Draft') {
    blocked.push('Inventory Control Mode can only be changed when the warehouse is in Draft status.');
  }

  if (currentMode === 'Location-BIN-Level' && proposedMode === 'Warehouse-Level') {
    if (hasExistingBinStock) {
      blocked.push('Cannot revert to Warehouse-Level: BIN stock exists. Clear all BIN stock first.');
    }
    if (hasBinMovementHistory) {
      blocked.push('Cannot revert to Warehouse-Level: BIN movement history exists. This transition is permanent once any movement has occurred.');
    }
  }

  return { allowed: blocked.length === 0, blockedReasons: blocked };
}

// ─── Precondition evaluation ─────────────────────────────────────────────────

export interface PreconditionContext {
  readonly setupHealthReady: boolean;
  readonly identityComplete: boolean;
  readonly classificationComplete: boolean;
  readonly hasActiveTemplate: boolean;
  readonly hasActiveInventoryLocation: boolean;
  readonly hasOpenStock: boolean;
  readonly warehouseStatus: WarehouseStatus;
  readonly hasLocationStock?: boolean;
  readonly hierarchyValid?: boolean;
}

export function evaluatePreconditions(
  preconditions: string[],
  ctx: PreconditionContext,
): { passed: boolean; failedConditions: string[] } {
  const failed: string[] = [];

  for (const condition of preconditions) {
    switch (condition) {
      case 'setup_health_passes':
        if (!ctx.setupHealthReady) failed.push('Setup health checks must pass before activation.');
        break;
      case 'identity_complete':
        if (!ctx.identityComplete) failed.push('Warehouse identity (code and name) must be complete.');
        break;
      case 'classification_complete':
        if (!ctx.classificationComplete) failed.push('Warehouse type and inventory control mode must be set.');
        break;
      case 'bin_level_requires_template':
        if (!ctx.hasActiveTemplate) failed.push('An Active hierarchy template is required for BIN-Level mode.');
        break;
      case 'bin_level_requires_location':
        if (!ctx.hasActiveInventoryLocation) failed.push('At least one Active, inventory-allowed location is required for BIN-Level mode.');
        break;
      case 'no_open_stock':
        if (ctx.hasOpenStock) failed.push('Warehouse has open stock. Transfer or clear stock before this action.');
        break;
      case 'warehouse_active':
        if (ctx.warehouseStatus !== 'Active') failed.push('The parent warehouse must be Active to activate a location.');
        break;
      case 'no_location_stock':
        if (ctx.hasLocationStock) failed.push('Location has stock. Transfer stock before inactivating.');
        break;
      case 'hierarchy_valid':
        if (!ctx.hierarchyValid) failed.push('Location must have a valid parent in the hierarchy.');
        break;
    }
  }

  return { passed: failed.length === 0, failedConditions: failed };
}
