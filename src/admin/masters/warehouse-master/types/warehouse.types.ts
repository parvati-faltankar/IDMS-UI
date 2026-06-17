// ─── Warehouse Master — Domain Types ─────────────────────────────────────────

import type {
  AllocationLevel,
  ApprovalStatus,
  AssignmentStatus,
  BinType,
  CapacityConsumptionSource,
  CapacityEnforcementMode,
  CapacityProjectedDecision,
  CapacityRollupMode,
  CapacityStatus,
  CommitmentState,
  ConfigurationSectionKey,
  CreationSource,
  CycleCountFrequency,
  CycleCountScope,
  DefaultLocationPurpose,
  EligibilityRuleDirection,
  EligibilityScopeType,
  EligibilitySubjectType,
  EligibilityMode,
  HierarchyLevelRole,
  HierarchyTemplateStatus,
  InventoryControlMode,
  LocationTransactionPurpose,
  LocationStatus,
  LocationType,
  MovementState,
  PickingStrategy,
  PutawayStrategy,
  ReservationLevel,
  ResponsibilityMode,
  ResponsibilityRole,
  ResponsibilityStatus,
  SetupHealthTone,
  StockAvailabilityStatus,
  TemperatureZone,
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

export type HierarchyCompletionSeverity = 'Complete' | 'Incomplete' | 'Blocked' | 'Warning';
export type HierarchyChecklistStatus = 'Passed' | 'Failed' | 'Warning' | 'Not Applicable';
export type HierarchyIssueSeverity = 'Blocker' | 'Warning' | 'Info';

export type HierarchyIssueType =
  | 'Missing Active Template'
  | 'No Actual Nodes'
  | 'No Leaf Endpoint'
  | 'No Inventory Endpoint'
  | 'No Inventory Allowed Node'
  | 'Duplicate Identifier'
  | 'Invalid Parent Path'
  | 'Parent Blocked'
  | 'Node Blocked'
  | 'Node Inactive'
  | 'Capacity Required Missing'
  | 'Capacity Exceeded Hard Block'
  | 'Capacity Approval Required'
  | 'Item Eligibility Required Missing'
  | 'Responsibility Required Missing'
  | 'Identifier Locked'
  | 'Lifecycle Action Blocked';

export interface HierarchyCompletionIssue {
  readonly issueId: string;
  readonly severity: HierarchyIssueSeverity;
  readonly issueType: HierarchyIssueType;
  readonly nodeId?: string;
  readonly fullLocationIdentifier?: string;
  readonly issueMessage: string;
  readonly recommendedAction: string;
  readonly actionTarget?: ConfigurationSectionKey | 'Hierarchy' | 'Locations' | 'Template' | 'CapacityView';
}

export interface HierarchyCompletionChecklistItem {
  readonly key:
    | 'active-template-exists'
    | 'valid-hierarchy-path-exists'
    | 'actual-nodes-created'
    | 'leaf-endpoint-exists'
    | 'inventory-endpoint-eligible-exists'
    | 'active-inventory-allowed-node-exists'
    | 'full-identifiers-valid-unique'
    | 'required-capacity-setup-complete'
    | 'required-item-eligibility-setup-complete'
    | 'required-responsibility-setup-complete'
    | 'blocked-parent-path-issues-resolved';
  readonly label: string;
  readonly status: HierarchyChecklistStatus;
  readonly severity: HierarchyIssueSeverity | 'None';
  readonly affectedCount: number;
  readonly actionLabel?: string;
  readonly actionTarget?: ConfigurationSectionKey | 'Hierarchy' | 'Locations' | 'Template' | 'CapacityView';
}

export interface HierarchyCompletionModel {
  readonly status: HierarchyCompletionSeverity;
  readonly hierarchyApplicable: boolean;
  readonly activeTemplateExists: boolean;
  readonly templateValid: boolean;
  readonly templateVersion?: number;
  readonly hasActualRootOrVirtualRoot: boolean;
  readonly actualNodeCount: number;
  readonly leafEndpointCount: number;
  readonly inventoryEndpointEligibleCount: number;
  readonly inventoryAllowedCount: number;
  readonly blockedOrInactiveNodeCount: number;
  readonly identifierIssueCount: number;
  readonly missingCapacitySetupCount: number;
  readonly missingItemEligibilitySetupCount: number;
  readonly missingResponsibilitySetupCount: number;
  readonly defaultLocationsConfigured: boolean;
  readonly blockers: HierarchyCompletionIssue[];
  readonly warnings: HierarchyCompletionIssue[];
  readonly infos: HierarchyCompletionIssue[];
  readonly checklist: HierarchyCompletionChecklistItem[];
  readonly nextRecommendedAction: string;
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
  readonly defaultEnforcementMode?: CapacityEnforcementMode;
  readonly defaultRollupMode?: CapacityRollupMode;
  readonly defaultConsumptionSource?: CapacityConsumptionSource;
  readonly warningThresholdPercent?: number;
  readonly overrideAllowed?: boolean;
  readonly overrideApprovalRequired?: boolean;
  readonly overrideReasonRequired?: boolean;
  readonly requireCapacityOnApplicableLevels?: boolean;
  readonly squareFootage?: number;
  readonly heightMeters?: number;
  readonly floorLoadKgPerSqm?: number;
  readonly rackLoadKg?: number;
  readonly dockCount?: number;
  readonly temperatureControlled: boolean;
  readonly hazardousStorage: boolean;
}

export interface StorageConstraints {
  readonly temperatureZone?: TemperatureZone;
  readonly minTempCelsius?: number;
  readonly maxTempCelsius?: number;
  readonly humidityPercent?: number;
  readonly hazardAllowed?: boolean;
  readonly hazardClassAllowed?: string[];
  readonly fireClass?: string;
  readonly hazmatClass?: string;
  readonly allowMixedItemStorage?: boolean;
  readonly allowMixedLotStorage?: boolean;
  readonly allowMixedOwnerStorage?: boolean;
  readonly inheritedFromLocationId?: string;
  readonly complianceLockRequired?: boolean;
  readonly complianceLockCode?: string;
  readonly storageConditionNotes?: string;
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

export interface EligibilityEffectiveScope {
  readonly scopeType: EligibilityScopeType;
  readonly warehouseId: string;
  readonly locationId?: string;
  readonly templateLevelCode?: string;
  readonly locationProfileCode?: string;
  readonly scopeLabel: string;
  readonly applicable: boolean;
}

export interface ItemEligibilityMapping {
  readonly id: string;
  readonly warehouseId: string;
  readonly scopeType: EligibilityScopeType;
  readonly scopeId: string;
  readonly scopeLabel: string;
  readonly templateLevelCode?: string;
  readonly subjectType: EligibilitySubjectType;
  readonly subjectCode: string;
  readonly subjectLabel?: string;
  readonly ruleDirection: EligibilityRuleDirection;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly reasonCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
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

export interface ResponsibleEmployeeRef {
  readonly employeeCode: string;
  readonly employeeName: string;
  readonly employeeEmail?: string;
  readonly employeeMasterId?: string;
  readonly sourceSystem?: 'EmployeeMaster' | 'Fixture';
}

export interface ResponsibilityAssignment {
  readonly mode: ResponsibilityMode;
  readonly role?: ResponsibilityRole;
  readonly employee?: ResponsibleEmployeeRef;
  readonly inheritedFromLocationId?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
}

export interface EffectiveResponsibility {
  readonly mode: ResponsibilityMode;
  readonly role?: ResponsibilityRole;
  readonly employee?: ResponsibleEmployeeRef;
  readonly source: 'Direct' | 'Inherited' | 'NotApplicable' | 'Unassigned';
  readonly sourceLocationId?: string;
  readonly status: ResponsibilityStatus;
}

export interface EffectiveNodeCapabilities {
  readonly capacityApplicable: boolean;
  readonly itemEligibilityApplicable: boolean;
  readonly responsibilityApplicable: boolean;
  readonly inventoryEndpointEligible: boolean;
  readonly barcodeApplicable: boolean;
  readonly qrApplicable: boolean;
  readonly transactionPurposes: LocationTransactionPurpose[];
  readonly capacityEnforcementMode: CapacityEnforcementMode;
  readonly capacityRollupMode: CapacityRollupMode;
  readonly allowCapabilityOverride: boolean;
  readonly defaultResponsibilityRole?: ResponsibilityRole;
  readonly defaultLocationRole: HierarchyLevelRole;
  readonly defaultLocationType?: LocationType;
}

export interface EffectiveCapacityPolicy {
  readonly applicable: boolean;
  readonly enforcementMode: CapacityEnforcementMode;
  readonly rollupMode: CapacityRollupMode;
  readonly consumptionSources: CapacityConsumptionSource[];
}

// ─── Hierarchy template ───────────────────────────────────────────────────────

export interface HierarchyLevel {
  readonly levelId?: string;
  readonly levelCode: string;
  readonly levelName: string;
  readonly sequence: number;
  readonly levelRole?: HierarchyLevelRole;
  readonly mandatory: boolean;
  readonly leafEligible: boolean;
  readonly allowSkipLevel: boolean;
  readonly allowedParentLevels?: string[];
  readonly allowedChildLevels?: string[];
  readonly autoGenerateCode?: boolean;
  readonly codePrefix?: string;
  readonly startSequence?: number;
  readonly sequenceLength?: number;
  readonly separator?: string;
  readonly suffix?: string;
  readonly description?: string;
  readonly capacityApplicable?: boolean;
  readonly itemEligibilityApplicable?: boolean;
  readonly responsibilityApplicable?: boolean;
  readonly inventoryEndpointEligible?: boolean;
  readonly barcodeApplicable?: boolean;
  readonly qrApplicable?: boolean;
  readonly transactionPurposes?: LocationTransactionPurpose[];
  readonly capacityEnforcementMode?: CapacityEnforcementMode;
  readonly capacityRollupMode?: CapacityRollupMode;
  readonly capacityConsumptionSources?: CapacityConsumptionSource[];
  readonly allowCapabilityOverride?: boolean;
  readonly defaultResponsibilityRole?: ResponsibilityRole;
  readonly defaultLocationRole?: HierarchyLevelRole;
  readonly defaultLocationType?: LocationType;
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
  readonly templateSource?: 'System' | 'UserDefined' | 'Imported' | 'Cloned';
  readonly templateScope?: 'Warehouse' | 'Organization';
  readonly defaultPathSeparator?: string;
  readonly includeWarehouseCodeInIdentifier?: boolean;
  readonly defaultSequenceLength?: number;
  readonly manualNodeCodeAllowed?: boolean;
  readonly autoGenerateNodeCodeAllowed?: boolean;
  readonly codeLockedAfterActivation?: boolean;
  readonly dependencyMarker?: {
    readonly hasNodes?: boolean;
    readonly hasStock?: boolean;
    readonly hasTransactions?: boolean;
  };
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
  readonly inventoryEndpointEligible?: boolean;
  readonly inventoryAllowed: boolean;
  readonly effectiveStatus?: LocationStatus;
  readonly capabilitySummary?: {
    readonly capacityApplicable?: boolean;
    readonly itemEligibilityApplicable?: boolean;
    readonly responsibilityApplicable?: boolean;
    readonly capacityStatus?: CapacityStatus;
    readonly capacityHardBlocked?: boolean;
    readonly capacityApprovalRequired?: boolean;
    readonly capacityRollupWarning?: boolean;
    readonly utilizationPercent?: number;
  };
  readonly status: LocationStatus;
  readonly fullCode: string;
}

// ─── Location / BIN ───────────────────────────────────────────────────────────

export interface LocationCapacity {
  readonly trackingEnabled?: boolean;
  readonly enforcementMode?: CapacityEnforcementMode;
  readonly rollupMode?: CapacityRollupMode;
  readonly consumptionSource?: CapacityConsumptionSource;
  readonly palletPositions?: number;
  readonly maxWeightKg?: number;
  readonly maxVolumeM3?: number;
  readonly maxUnits?: number;
  readonly currentWeightKg?: number;
  readonly currentVolumeM3?: number;
  readonly currentUnits?: number;
  readonly reservedWeightKg?: number;
  readonly reservedVolumeM3?: number;
  readonly reservedUnits?: number;
  readonly availableWeightKg?: number;
  readonly availableVolumeM3?: number;
  readonly availableUnits?: number;
  readonly utilizationPercent?: number;
  readonly warningThresholdPercent?: number;
  readonly status?: CapacityStatus;
  readonly overrideAllowed?: boolean;
  readonly overrideApprovalRequired?: boolean;
  readonly overrideReasonRequired?: boolean;
  readonly overrideReason?: string;
}

export interface CapacityUsageSnapshot {
  readonly currentUnits: number;
  readonly currentWeightKg: number;
  readonly currentVolumeM3: number;
  readonly reservedUnits: number;
  readonly reservedWeightKg: number;
  readonly reservedVolumeM3: number;
  readonly availableUnits?: number;
  readonly availableWeightKg?: number;
  readonly availableVolumeM3?: number;
  readonly utilizationPercent?: number;
}

export interface CapacityRollupResult {
  readonly nodeId: string;
  readonly ownUsage: CapacityUsageSnapshot;
  readonly rolledChildUsage: CapacityUsageSnapshot;
  readonly totalUsage: CapacityUsageSnapshot;
  readonly warning?: string;
}

export interface ProjectedPostingCapacityInput {
  readonly warehouse: Warehouse;
  readonly targetNode: WarehouseLocation;
  readonly allLocations: WarehouseLocation[];
  readonly activeTemplate?: HierarchyTemplate;
  readonly quantity?: number;
  readonly weightKg?: number;
  readonly volumeM3?: number;
  readonly inboundReservation?: boolean;
  readonly itemAttributes?: {
    readonly temperatureZone?: TemperatureZone;
    readonly hazardClass?: string;
    readonly complianceClass?: string;
  };
}

export interface ProjectedPostingCapacityResult {
  readonly decision: CapacityProjectedDecision;
  readonly allowed: boolean;
  readonly warning: boolean;
  readonly blocked: boolean;
  readonly approvalRequired: boolean;
  readonly affectedCapacityScopes: string[];
  readonly reasons: string[];
}

export interface LocationProfile {
  readonly locationType: LocationType;
  readonly templateLevelId?: string;
  readonly templateLevelCode?: string;
  readonly locationRole?: HierarchyLevelRole;
  readonly binType?: BinType;
  readonly barcodeValue?: string;
  readonly qrValue?: string;
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
  readonly eligibilityMappings?: ItemEligibilityMapping[];
  readonly responsibilityAssignment?: ResponsibilityAssignment;
  readonly effectiveResponsibility?: EffectiveResponsibility;
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
  readonly itemEligibilityMappings?: ItemEligibilityMapping[];
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
