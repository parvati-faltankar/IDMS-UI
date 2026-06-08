// ─── Warehouse Master — Domain Types ─────────────────────────────────────────

import type {
  AllocationLevel,
  ApprovalStatus,
  AssignmentStatus,
  BinType,
  CommitmentState,
  ConfigurationSectionKey,
  CreationSource,
  CycleCountFrequency,
  CycleCountScope,
  DefaultLocationPurpose,
  EligibilityMode,
  HierarchyTemplateStatus,
  InventoryControlMode,
  LocationStatus,
  LocationType,
  MovementState,
  PickingStrategy,
  PutawayStrategy,
  ReservationLevel,
  SetupHealthTone,
  StockAvailabilityStatus,
  ValidationCategory,
  ValidationSeverity,
  WarehouseLifecycleAction,
  WarehouseOwnershipScope,
  WarehouseStatus,
  WarehouseType,
} from './warehouse.enums';

// ─── Versioning ───────────────────────────────────────────────────────────────

/** Optimistic-concurrency version number. Incremented on every mutation. */
export type RecordVersion = number;

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationIssue {
  readonly field?: string;
  readonly section?: ConfigurationSectionKey;
  readonly severity: ValidationSeverity;
  readonly category: ValidationCategory;
  readonly message: string;
  readonly detail?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: ValidationIssue[];
}

// ─── Approval ────────────────────────────────────────────────────────────────

export interface ApprovalRef {
  readonly approvalStatus: ApprovalStatus;
  readonly approvalId?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly rejectionReason?: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
  readonly id: string;
  readonly entityType: 'Warehouse' | 'Location' | 'HierarchyTemplate';
  readonly entityId: string;
  readonly action: string;
  readonly performedBy: string;
  readonly performedAt: string;
  readonly previousStatus?: string;
  readonly newStatus?: string;
  readonly reasonCode?: string;
  readonly reasonDescription?: string;
  readonly correlationId?: string;
  readonly source?: 'Manual' | 'Import' | 'Bulk' | 'Approval' | 'System';
  readonly referenceId?: string;
  readonly recordVersion?: number;
  readonly approvalStatus?: ApprovalStatus;
  readonly effectiveDate?: string;
  readonly approvalRoute?: string;
  readonly fieldChanges?: Array<{
    readonly field: string;
    readonly previousValue?: string;
    readonly newValue?: string;
  }>;
  readonly snapshot?: Record<string, unknown>;
}

// ─── Setup health ────────────────────────────────────────────────────────────

export interface SectionHealth {
  readonly section: ConfigurationSectionKey;
  readonly tone: SetupHealthTone;
  readonly completedFields: number;
  readonly totalFields: number;
  readonly issues: ValidationIssue[];
}

export interface SetupHealth {
  readonly overallTone: SetupHealthTone;
  readonly readyForActivation: boolean;
  readonly sections: SectionHealth[];
  readonly blockingIssues: ValidationIssue[];
}

// ─── Inventory owner ──────────────────────────────────────────────────────────

export interface InventoryOwner {
  readonly ownerCode: string;
  readonly ownerName: string;
  readonly ownerType: 'Company' | 'Branch' | 'BusinessUnit' | 'LegalEntity' | 'ThirdParty';
}

// ─── Branch assignment ────────────────────────────────────────────────────────

export interface BranchAssignment {
  readonly id: string;
  readonly branchCode: string;
  readonly branchName: string;
  readonly assignmentStatus: AssignmentStatus;
  readonly isDefaultForBranch: boolean;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly reasonCode?: string;
  readonly reasonDescription?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Default locations (purpose-specific) ────────────────────────────────────

export interface DefaultLocationRef {
  readonly purpose: DefaultLocationPurpose;
  readonly locationId?: string;
  readonly locationCode?: string;
  readonly locationName?: string;
}

export interface DefaultLocations {
  readonly putaway?: DefaultLocationRef;
  readonly picking?: DefaultLocationRef;
  readonly return?: DefaultLocationRef;
  readonly qc?: DefaultLocationRef;
  readonly staging?: DefaultLocationRef;
  readonly scrap?: DefaultLocationRef;
}

// ─── Inventory control rules (derived from mode) ──────────────────────────────

export interface InventoryControlRules {
  /** Derived: true when InventoryControlMode = 'Warehouse-Level' */
  readonly allowWarehouseLevelPosting: boolean;
  /** Derived: true when InventoryControlMode = 'Location-BIN-Level' */
  readonly requireLocationForGRN: boolean;
  /** Derived: true when InventoryControlMode = 'Location-BIN-Level' */
  readonly requireLocationForIssue: boolean;
  /** Derived: true when InventoryControlMode = 'Location-BIN-Level' */
  readonly allowBinToBinTransfer: boolean;
  /** Derived: binManaged = (mode === 'Location-BIN-Level') — NEVER user-editable */
  readonly binManaged: boolean;
}

// ─── Putaway policy ───────────────────────────────────────────────────────────

export interface PutawayPolicy {
  /** Must be false when InventoryControlMode = 'Warehouse-Level' */
  readonly enabled: boolean;
  readonly strategy: PutawayStrategy;
  readonly strategySequence: PutawayStrategy[];
  readonly overrideAllowed: boolean;
}

// ─── Picking policy ───────────────────────────────────────────────────────────

export interface PickingPolicy {
  /** Must be false when InventoryControlMode = 'Warehouse-Level' */
  readonly enabled: boolean;
  readonly strategy: PickingStrategy;
  readonly strategySequence: PickingStrategy[];
  readonly overrideAllowed: boolean;
}

// ─── Capacity / storage ───────────────────────────────────────────────────────

export interface CapacityPolicy {
  readonly trackingEnabled: boolean;
  readonly squareFootage?: number;
  readonly heightMeters?: number;
  readonly floorLoadKgPerSqm?: number;
  readonly rackLoadKg?: number;
  readonly dockCount?: number;
  readonly temperatureControlled: boolean;
  readonly hazardousStorage: boolean;
}

export interface StorageConstraints {
  readonly minTempCelsius?: number;
  readonly maxTempCelsius?: number;
  readonly humidityPercent?: number;
  readonly fireClass?: string;
  readonly hazmatClass?: string;
  readonly allowMixedItemStorage?: boolean;
  readonly allowMixedLotStorage?: boolean;
  readonly allowMixedOwnerStorage?: boolean;
  readonly complianceLockRequired?: boolean;
  readonly complianceLockCode?: string;
}

// ─── Timing / calendar ───────────────────────────────────────────────────────

export interface OperatingCalendar {
  readonly calendarCode?: string;
  readonly calendarName?: string;
  readonly timezone: string;
  readonly openTime?: string;
  readonly closeTime?: string;
  readonly receivingWindowStart?: string;
  readonly receivingWindowEnd?: string;
  readonly dispatchWindowStart?: string;
  readonly dispatchWindowEnd?: string;
}

// ─── Item eligibility ─────────────────────────────────────────────────────────

export interface EligibilityRule {
  readonly ruleId: string;
  readonly ruleType: 'ItemCode' | 'Category' | 'HsnCode' | 'Attribute';
  readonly ruleValue: string;
  readonly ruleLabel?: string;
  readonly allowedOrBlocked: 'Allowed' | 'Blocked';
}

export interface EligibilityPolicy {
  readonly mode: EligibilityMode;
  readonly rules: EligibilityRule[];
  readonly defaultFallback: 'Allow' | 'Block';
}

// ─── Reservation / allocation ─────────────────────────────────────────────────

export interface ReservationPolicy {
  readonly reservationLevel: ReservationLevel;
  readonly eligibleLocationTypes: LocationType[];
  readonly allowPartialReservation: boolean;
  readonly autoReleaseAfterHours?: number;
}

export interface AllocationPolicy {
  readonly allocationLevel: AllocationLevel;
  readonly eligibleLocationTypes: LocationType[];
  readonly allowPartialAllocation: boolean;
}

// ─── Cycle count ─────────────────────────────────────────────────────────────

export interface CycleCountPolicy {
  readonly enabled: boolean;
  readonly scope: CycleCountScope;
  readonly frequency: CycleCountFrequency;
  readonly freezeEnabled: boolean;
  readonly varianceTolerance: number;
  readonly varianceUnit: 'Percent' | 'Units';
}

// ─── Hierarchy template ───────────────────────────────────────────────────────

export interface HierarchyLevel {
  readonly levelCode: string;
  readonly levelName: string;
  readonly sequence: number;
  readonly mandatory: boolean;
  readonly leafEligible: boolean;
  readonly allowSkipLevel: boolean;
  readonly allowedParentLevels?: string[];
  readonly allowedChildLevels?: string[];
  readonly description?: string;
}

export interface HierarchyTemplateVersion {
  readonly versionNumber: number;
  readonly activatedAt?: string;
  readonly supersededAt?: string;
  readonly changeDescription?: string;
}

export interface HierarchyTemplate {
  readonly id: string;
  readonly warehouseId: string;
  readonly templateCode: string;
  readonly templateName: string;
  readonly status: HierarchyTemplateStatus;
  readonly flexiblePathEnabled: boolean;
  readonly levels: HierarchyLevel[];
  readonly currentVersion: HierarchyTemplateVersion;
  readonly versionHistory: HierarchyTemplateVersion[];
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: RecordVersion;
}

// ─── Hierarchy node (tree view projection) ───────────────────────────────────

export interface HierarchyNode {
  readonly id: string;
  readonly locationId?: string;
  readonly locationCode?: string;
  readonly locationName?: string;
  readonly levelCode: string;
  readonly levelName: string;
  readonly parentId?: string;
  readonly children: HierarchyNode[];
  readonly isLeaf: boolean;
  readonly inventoryAllowed: boolean;
  readonly status: LocationStatus;
  readonly fullCode: string;
}

// ─── Location / BIN ───────────────────────────────────────────────────────────

export interface LocationCapacity {
  readonly maxWeightKg?: number;
  readonly maxVolumeM3?: number;
  readonly maxUnits?: number;
  readonly currentWeightKg?: number;
  readonly currentVolumeM3?: number;
  readonly currentUnits?: number;
}

export interface LocationProfile {
  readonly locationType: LocationType;
  readonly binType?: BinType;
  readonly barcodeValue?: string;
  readonly rfidTag?: string;
  /** Derived from hierarchy level: never editable */
  readonly level: number;
  /** Derived: full path code (e.g. "WH01-Z01-A01-R01-S02-B003") */
  readonly fullCode: string;
  /** Derived: true when node has no children or is a leaf-eligible endpoint */
  readonly isLeafEndpoint: boolean;
  /** Derived: true when isLeafEndpoint && !putawayBlocked && parentInventoryAllowed */
  readonly inventoryAllowed: boolean;
}

export interface WarehouseLocation {
  readonly id: string;
  readonly warehouseId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly parentLocationId?: string;
  readonly status: LocationStatus;
  readonly profile: LocationProfile;
  readonly capacity?: LocationCapacity;
  readonly storageConstraints?: StorageConstraints;
  readonly eligibilityPolicy?: EligibilityPolicy;
  readonly putawayBlocked: boolean;
  readonly pickingBlocked: boolean;
  readonly movementState: MovementState;
  readonly commitmentState: CommitmentState;
  readonly stockStatuses: StockAvailabilityStatus[];
  readonly approval?: ApprovalRef;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: RecordVersion;
}

// ─── Location summary (list projection) ──────────────────────────────────────

export interface LocationSummary {
  readonly id: string;
  readonly warehouseId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly parentLocationId?: string;
  readonly status: LocationStatus;
  readonly locationType: LocationType;
  readonly level: number;
  readonly fullCode: string;
  readonly isLeafEndpoint: boolean;
  readonly inventoryAllowed: boolean;
  readonly movementState: MovementState;
}

// ─── Assignment profile (org-level sharing) ───────────────────────────────────

export interface AssignmentProfile {
  readonly assignments: BranchAssignment[];
  readonly sharedWithAllBranches: boolean;
  readonly inventoryOwner?: InventoryOwner;
  readonly companyCode?: string;
  readonly businessUnit?: string;
  readonly legalEntityCode?: string;
}

// ─── Warehouse (full record) ─────────────────────────────────────────────────

export interface Warehouse {
  // ── Identity ────────────────────────────────────────────────────────────
  readonly id: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly description?: string;

  // ── Classification ──────────────────────────────────────────────────────
  readonly ownershipScope: WarehouseOwnershipScope;
  readonly owningOrgCode?: string;
  readonly owningBranchCode?: string;
  readonly warehouseType: WarehouseType;
  readonly wmsEnabled: boolean;
  readonly inventoryControlMode: InventoryControlMode;

  // ── Derived (never editable) ─────────────────────────────────────────────
  readonly inventoryControlRules: InventoryControlRules;

  // ── Status ──────────────────────────────────────────────────────────────
  readonly status: WarehouseStatus;
  readonly creationSource: CreationSource;

  // ── Assignment ──────────────────────────────────────────────────────────
  readonly assignmentProfile: AssignmentProfile;

  // ── Default locations ────────────────────────────────────────────────────
  readonly defaultLocations: DefaultLocations;

  // ── Policies ────────────────────────────────────────────────────────────
  readonly autoPutaway?: PutawayPolicy;
  readonly autoPicking?: PickingPolicy;
  readonly capacityPolicy?: CapacityPolicy;
  readonly storageConstraints?: StorageConstraints;
  readonly operatingCalendar?: OperatingCalendar;
  readonly eligibilityPolicy?: EligibilityPolicy;
  readonly reservationPolicy?: ReservationPolicy;
  readonly allocationPolicy?: AllocationPolicy;
  readonly cycleCountPolicy?: CycleCountPolicy;

  // ── Reason history (for governed transitions) ────────────────────────────
  readonly blockReason?: string;
  readonly blockReasonCode?: string;
  readonly inactiveReason?: string;

  // ── Timestamps ──────────────────────────────────────────────────────────
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly activatedAt?: string;

  // ── Concurrency ─────────────────────────────────────────────────────────
  readonly version: RecordVersion;
}

// ─── WarehouseSummary (list projection) ──────────────────────────────────────

export interface WarehouseSummary {
  readonly id: string;
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly ownershipScope: WarehouseOwnershipScope;
  readonly warehouseType: WarehouseType;
  readonly inventoryControlMode: InventoryControlMode;
  readonly binManaged: boolean;
  readonly wmsEnabled: boolean;
  readonly status: WarehouseStatus;
  readonly branchCount: number;
  readonly locationCount: number;
  readonly activeBinCount: number;
  readonly setupHealth: SetupHealthTone;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Owning entity code — org code for Organization scope, branch code for Branch scope */
  readonly owningCode?: string;
  /** Physical facility code if available */
  readonly facilityCode?: string;
}

// ─── WarehouseDetails (full record + related entities) ───────────────────────

export interface WarehouseDetails {
  readonly warehouse: Warehouse;
  readonly hierarchyTemplates: HierarchyTemplate[];
  readonly locations: WarehouseLocation[];
  readonly setupHealth: SetupHealth;
  readonly recentAuditEvents: AuditEvent[];
}

// ─── Controlled action ────────────────────────────────────────────────────────

export interface ControlledAction {
  readonly action: WarehouseLifecycleAction;
  readonly available: boolean;
  readonly requiresReason: boolean;
  readonly requiresApproval: boolean;
  readonly blockedBy?: string[];
}

export interface ActionResult {
  readonly success: boolean;
  readonly warehouse?: Warehouse;
  readonly issues: ValidationIssue[];
  readonly approvalRef?: ApprovalRef;
  readonly correlationId?: string;
}
