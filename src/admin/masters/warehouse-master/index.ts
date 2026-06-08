// ─── Warehouse Master — Public API ───────────────────────────────────────────
//
// Import from this file to access the warehouse master domain layer.

// ── Types ────────────────────────────────────────────────────────────────────
export type * from './types/warehouse.enums';
export type * from './types/warehouse.types';
export type * from './types/warehouse.dto';
export type { WarehousePermissionKey, WarehousePermissions, WarehouseRole } from './types/warehouse.permissions';

// ── Permission helpers ────────────────────────────────────────────────────────
export { mockAllPermissions, readOnlyPermissions, ROLE_PERMISSIONS } from './types/warehouse.permissions';

// ── Derivation functions ──────────────────────────────────────────────────────
export {
  deriveBinManaged,
  deriveInventoryControlRules,
  deriveIsLeafEndpoint,
  deriveInventoryAllowed,
  deriveEffectiveLocationStatus,
  deriveSetupHealth,
  deriveAvailableActions,
  deriveRequiredConfigurationSections,
  determineApprovalRequirement,
  evaluateAssignmentAccess,
  evaluateLocationEligibility,
  evaluateCapacityState,
  evaluateConfigurationImpact,
} from './utils/warehouseDerivations';

// ── Status rules ──────────────────────────────────────────────────────────────
export {
  getWarehouseTransitionInfo,
  getLocationTransitionInfo,
  getAllowedWarehouseTransitions,
  getAllowedLocationTransitions,
  evaluateModeChangeEligibility,
  evaluatePreconditions,
} from './utils/warehouseStatusRules';

// ── Hierarchy utilities ───────────────────────────────────────────────────────
export {
  buildFullLocationCode,
  buildHierarchyTree,
  validateTemplateLevelTree,
  isCircularHierarchy,
  computeLocationLevel,
  validateHierarchyDepthConsistency,
} from './utils/hierarchyUtils';

// ── Rule precedence ───────────────────────────────────────────────────────────
export {
  resolveEligibility,
  resolveReservationLevel,
  detectPolicyConflicts,
} from './utils/rulePrecedence';

// ── Route utilities ───────────────────────────────────────────────────────────
export {
  WAREHOUSE_ROUTES,
  WAREHOUSE_MASTER_BASE,
  extractWarehouseId,
  extractLocationId,
  isCreateRoute,
} from './utils/routeUtils';

// ── Validation ────────────────────────────────────────────────────────────────
export {
  validateWarehouseForSave,
  validateWarehouseInput,
  hasWarehouseFieldErrors,
} from './validation/warehouseValidation';
export {
  validateWarehouseForActivation,
  canActivateWarehouse,
} from './validation/activationValidation';
export {
  validateLocationForSave,
  validateLocationForActivation,
  hasLocationFieldErrors,
} from './validation/locationValidation';
export {
  validateHierarchyTemplateForSave,
  validateHierarchyTemplateForActivation,
  hasHierarchyTemplateFieldErrors,
} from './validation/hierarchyValidation';
export {
  validatePutawayPolicy,
  validatePickingPolicy,
  validateCapacityPolicy,
  validateEligibilityPolicy,
  validateReservationPolicy,
  validateAllocationPolicy,
  validateCycleCountPolicy,
} from './validation/policyValidation';

export {
  addOrderedStrategy,
  removeOrderedStrategy,
  moveOrderedStrategy,
  restoreRecommendedOrder,
  canConfigureLocationEligibility,
  getEligibleDefaultLocations,
  validateCapacityAndConstraints,
  validateStockStateSeparation,
  validateReservationAllocationPolicies,
  simulatePutawayStrategy,
  simulatePickingStrategy,
} from './utils/policyWorkbench';

export {
  buildControlledActionPlan,
  actionNeedsApproval,
  getReasonCodesForAction,
  requiresControlledChangeApproval,
  buildImportCommitPayload,
  formatAuditEventLabel,
  filterAuditEvents,
  detectPermissionDenied,
  parseWarehouseServiceError,
} from './utils/governanceUtils';

// ── Service interface ─────────────────────────────────────────────────────────
export type { WarehouseService } from './services/warehouseService';

// ── Adapters (choose one at runtime) ─────────────────────────────────────────
export { warehouseMockAdapter } from './services/warehouseMockAdapter';
export { warehouseApiAdapter } from './services/warehouseApiAdapter';
export { warehouseMapper } from './services/warehouseMapper';

// ── Fixtures ──────────────────────────────────────────────────────────────────
export {
  SEED_WAREHOUSES,
  SEED_HIERARCHY_TEMPLATES,
  SEED_LOCATIONS,
  SEED_AUDIT_EVENTS,
  SAMPLE_VALIDATION_ISSUES,
  WH_WAREHOUSE_LEVEL_ACTIVE,
  WH_BIN_LEVEL_ACTIVE,
  WH_BIN_LEVEL_DRAFT_BLOCKED,
  WH_ORG_LEVEL_SHARED,
  WH_BLOCKED,
} from './fixtures/warehouseFixtures';
