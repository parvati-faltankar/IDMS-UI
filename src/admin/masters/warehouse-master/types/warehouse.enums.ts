// ─── Warehouse Master — Enumerations ─────────────────────────────────────────

// ─── Warehouse core ───────────────────────────────────────────────────────────

export type WarehouseStatus =
  | 'Draft'
  | 'Active'
  | 'Blocked'
  | 'Inactive';

export type WarehouseOwnershipScope =
  | 'Organization'
  | 'Branch';

export type WarehouseType =
  | 'Physical'
  | 'Virtual'
  | 'Transit'
  | 'Consignment'
  | 'Bonded'
  | 'Cold-Chain'
  | 'Hazardous';

/** Controls whether stock is tracked at warehouse-level or at location/BIN-level. */
export type InventoryControlMode =
  | 'Warehouse-Level'
  | 'Location-BIN-Level';

export type CreationSource =
  | 'Manual'
  | 'Bulk'
  | 'Import'
  | 'Integration';

// ─── Branch assignment ────────────────────────────────────────────────────────

export type AssignmentStatus =
  | 'Active'
  | 'Blocked'
  | 'Inactive';

// ─── Hierarchy template ───────────────────────────────────────────────────────

export type HierarchyTemplateStatus =
  | 'Draft'
  | 'Active'
  | 'Superseded'
  | 'Inactive';

// ─── Location ────────────────────────────────────────────────────────────────

export type LocationStatus =
  | 'Draft'
  | 'Active'
  | 'Blocked'
  | 'Inactive';

export type LocationType =
  | 'Zone'
  | 'Aisle'
  | 'Rack'
  | 'Shelf'
  | 'BIN'
  | 'Dock'
  | 'Staging'
  | 'QC'
  | 'Scrap'
  | 'Virtual'
  | 'General';

export type BinType =
  | 'Standard'
  | 'Bulk'
  | 'Cold-Chain'
  | 'Hazardous'
  | 'Overflow'
  | 'Return'
  | 'Quarantine';

// ─── Putaway / Picking strategies ────────────────────────────────────────────

export type PutawayStrategy =
  | 'FIFO'
  | 'LIFO'
  | 'FEFO'
  | 'Nearest-Empty'
  | 'Fixed-BIN'
  | 'Random'
  | 'Zone-Directed'
  | 'Capacity-Optimised';

export type PickingStrategy =
  | 'FIFO'
  | 'FEFO'
  | 'LIFO'
  | 'LEFO'
  | 'Zone-Wave'
  | 'Batch'
  | 'Single-Order'
  | 'Cluster';

// ─── Item eligibility ─────────────────────────────────────────────────────────

export type EligibilityMode =
  | 'Open'
  | 'Restricted'
  | 'Basic-Hybrid'
  | 'Category-Based'
  | 'Advanced-Hybrid';

// ─── Stock status ─────────────────────────────────────────────────────────────

export type StockAvailabilityStatus =
  | 'Available'
  | 'Reserved'
  | 'Allocated'
  | 'QC-Hold'
  | 'Damaged'
  | 'Scrap'
  | 'Blocked'
  | 'In-Transit'
  | 'Expired';

export type MovementState =
  | 'Idle'
  | 'In-Receipt'
  | 'In-Issue'
  | 'In-Transfer'
  | 'In-Adjustment'
  | 'In-Count'
  | 'Locked';

export type CommitmentState =
  | 'Uncommitted'
  | 'Soft-Reserved'
  | 'Hard-Reserved'
  | 'Allocated'
  | 'Dispatched';

// ─── Reservation / allocation ─────────────────────────────────────────────────

export type ReservationLevel =
  | 'Warehouse'
  | 'Location'
  | 'BIN';

export type AllocationLevel =
  | 'Warehouse'
  | 'Location'
  | 'BIN';

// ─── Cycle count ─────────────────────────────────────────────────────────────

export type CycleCountScope =
  | 'Full'
  | 'Category'
  | 'Zone'
  | 'ABC-Class';

export type CycleCountFrequency =
  | 'Daily'
  | 'Weekly'
  | 'Fortnightly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annually';

// ─── Approval ────────────────────────────────────────────────────────────────

export type ApprovalStatus =
  | 'NotRequired'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

// ─── Lifecycle actions ───────────────────────────────────────────────────────

export type WarehouseLifecycleAction =
  | 'Activate'
  | 'Block'
  | 'Unblock'
  | 'Inactivate'
  | 'Delete'
  | 'ChangeMode'
  | 'AssignBranch'
  | 'RevokeBranch';

export type LocationLifecycleAction =
  | 'Activate'
  | 'Block'
  | 'Unblock'
  | 'Inactivate'
  | 'Delete'
  | 'MarkInventoryAllowed'
  | 'MarkInventoryBlocked';

// ─── Default location purpose ────────────────────────────────────────────────

export type DefaultLocationPurpose =
  | 'Putaway'
  | 'Picking'
  | 'Return'
  | 'QC'
  | 'Staging'
  | 'Scrap';

// ─── Import / export ─────────────────────────────────────────────────────────

export type ImportEntityType =
  | 'Warehouse'
  | 'Location'
  | 'BIN'
  | 'ItemEligibility'
  | 'HierarchyTemplate';

export type ImportMode =
  | 'Full-Replace'
  | 'Incremental'
  | 'Dry-Run';

export type ExportFormat = 'xlsx' | 'csv' | 'json';

// ─── Validation / error categories ───────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationCategory =
  | 'FieldRequired'
  | 'FieldFormat'
  | 'DuplicateCode'
  | 'LifecycleConstraint'
  | 'DerivedFieldMismatch'
  | 'DependencyMissing'
  | 'PolicyConflict'
  | 'CircularReference'
  | 'CapacityExceeded'
  | 'StaleRecord'
  | 'PermissionDenied'
  | 'SystemConstraint';

// ─── Setup health ────────────────────────────────────────────────────────────

export type SetupHealthTone = 'complete' | 'partial' | 'empty' | 'error';

export type ConfigurationSectionKey =
  | 'identity'
  | 'classification'
  | 'branchAssignment'
  | 'inventoryControl'
  | 'defaultLocations'
  | 'autoPutaway'
  | 'autoPicking'
  | 'capacityStorage'
  | 'timingCalendar'
  | 'contactsAddresses'
  | 'hierarchyTemplate'
  | 'locations'
  | 'itemEligibility'
  | 'stockStatusGovernance'
  | 'reservationAllocation'
  | 'cycleCount';
