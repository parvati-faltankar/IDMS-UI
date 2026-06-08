// ─── Warehouse Master — DTOs (input / query shapes) ──────────────────────────

import type {
  AllocationPolicy,
  CapacityPolicy,
  CycleCountPolicy,
  DefaultLocations,
  EligibilityPolicy,
  HierarchyLevel,
  InventoryControlMode,
  OperatingCalendar,
  PutawayPolicy,
  PickingPolicy,
  ReservationPolicy,
  StorageConstraints,
  WarehouseOwnershipScope,
  WarehouseStatus,
  WarehouseType,
} from './warehouse.types';

import type {
  ExportFormat,
  ImportEntityType,
  ImportMode,
  LocationType,
  WarehouseLifecycleAction,
} from './warehouse.enums';

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export interface WarehouseListQuery {
  readonly search?: string;
  readonly ownershipScope?: WarehouseOwnershipScope;
  readonly warehouseType?: WarehouseType;
  readonly status?: WarehouseStatus;
  readonly wmsEnabled?: boolean;
  readonly binManaged?: boolean;
  readonly branchCode?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: 'warehouseCode' | 'warehouseName' | 'status' | 'updatedAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface LocationListQuery {
  readonly warehouseId: string;
  readonly search?: string;
  readonly parentLocationId?: string;
  readonly locationType?: LocationType;
  readonly status?: string;
  readonly inventoryAllowed?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface AuditQuery {
  readonly entityType?: 'Warehouse' | 'Location' | 'HierarchyTemplate';
  readonly action?: string;
  readonly performedBy?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

// ─── Warehouse input DTOs ─────────────────────────────────────────────────────

export interface CreateWarehouseInput {
  readonly warehouseCode: string;
  readonly warehouseName: string;
  readonly description?: string;
  readonly ownershipScope: WarehouseOwnershipScope;
  readonly owningOrgCode?: string;
  readonly owningBranchCode?: string;
  readonly owningBranchCodes?: string[];
  readonly branchOwnershipRows?: Array<{
    readonly branchCode: string;
    readonly businessUnit?: string;
    readonly legalEntityCode?: string;
    readonly inventoryOwnerCode?: string;
  }>;
  readonly businessUnit?: string;
  readonly legalEntityCode?: string;
  readonly inventoryOwnerCode?: string;
  readonly sharedWithAllBranches?: boolean;
  readonly sharedBranchCodes?: string[];
  readonly warehouseType: WarehouseType;
  readonly wmsEnabled: boolean;
  readonly inventoryControlMode: InventoryControlMode;
  readonly defaultLocations?: Partial<DefaultLocations>;
  readonly autoPutaway?: Partial<PutawayPolicy>;
  readonly autoPicking?: Partial<PickingPolicy>;
  readonly capacityPolicy?: Partial<CapacityPolicy>;
  readonly storageConstraints?: Partial<StorageConstraints>;
  readonly operatingCalendar?: Partial<OperatingCalendar>;
  readonly eligibilityPolicy?: Partial<EligibilityPolicy>;
  readonly reservationPolicy?: Partial<ReservationPolicy>;
  readonly allocationPolicy?: Partial<AllocationPolicy>;
  readonly cycleCountPolicy?: Partial<CycleCountPolicy>;
}

export interface UpdateWarehouseInput extends Partial<CreateWarehouseInput> {
  readonly version: number;
}

export interface WarehouseValidationInput {
  readonly warehouseId?: string;
  readonly input: CreateWarehouseInput | UpdateWarehouseInput;
  readonly validationType: 'Save' | 'Activate' | 'ChangeMode';
}

// ─── Controlled action request ────────────────────────────────────────────────

export interface ControlledActionRequest {
  readonly action: WarehouseLifecycleAction;
  readonly reasonCode?: string;
  readonly reasonDescription?: string;
  readonly correlationId?: string;
  readonly effectiveDate?: string;
  readonly approvalRoute?: string;
  readonly approvalRequired?: boolean;
}

export interface StatusChangeRequest extends ControlledActionRequest {
  readonly targetStatus: WarehouseStatus;
  readonly approvalRef?: string;
}

// ─── Hierarchy DTOs ───────────────────────────────────────────────────────────

export interface CreateHierarchyTemplateInput {
  readonly warehouseId: string;
  readonly templateCode: string;
  readonly templateName: string;
  readonly versionNumber?: number;
  readonly flexiblePathEnabled: boolean;
  readonly levels: HierarchyLevel[];
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
}

export interface UpdateHierarchyTemplateInput extends Partial<CreateHierarchyTemplateInput> {
  readonly id: string;
  readonly version: number;
}

// ─── Location DTOs ────────────────────────────────────────────────────────────

export interface CreateLocationInput {
  readonly warehouseId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly parentLocationId?: string;
  readonly locationType: LocationType;
  readonly binType?: string;
  readonly barcodeValue?: string;
  readonly putawayBlocked?: boolean;
  readonly pickingBlocked?: boolean;
  readonly capacity?: {
    readonly maxWeightKg?: number;
    readonly maxVolumeM3?: number;
    readonly maxUnits?: number;
  };
  readonly storageConstraints?: Partial<StorageConstraints>;
  readonly eligibilityPolicy?: Partial<EligibilityPolicy>;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  readonly version: number;
}

// ─── Bulk create DTOs ─────────────────────────────────────────────────────────

export interface BulkLocationInput {
  readonly warehouseId: string;
  readonly parentLocationId?: string;
  readonly level?: number;
  readonly locationType: LocationType;
  readonly binType?: string;
  readonly codePrefix: string;
  readonly namePrefix: string;
  readonly startSequence: number;
  readonly count: number;
  readonly sequenceLength: number;
  readonly separator?: string;
  readonly suffix?: string;
  readonly locationProfileName?: string;
  readonly idempotencyKey: string;
}

export interface BulkPreviewRow {
  readonly sequenceNumber: number;
  readonly proposedCode: string;
  readonly proposedName: string;
  readonly conflict: boolean;
  readonly conflictReason?: string;
}

export interface BulkPreview {
  readonly previewToken: string;
  readonly warehouseId: string;
  readonly rows: BulkPreviewRow[];
  readonly totalRows: number;
  readonly conflictCount: number;
  readonly validCount: number;
  readonly generatedAt: string;
  readonly paramsHash: string;
}

export interface CommitBulkRequest {
  readonly warehouseId: string;
  readonly previewToken: string;
  readonly paramsHash: string;
  readonly idempotencyKey: string;
}

export interface BulkResult {
  readonly success: boolean;
  readonly createdCount: number;
  readonly failedCount: number;
  readonly errors: Array<{ code: string; name: string; reason: string }>;
  readonly correlationId: string;
}

// ─── Import / export DTOs ─────────────────────────────────────────────────────

export interface ImportValidationRequest {
  readonly entityType: ImportEntityType;
  readonly mode: ImportMode;
  readonly warehouseId?: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly templateVersion?: string;
  readonly fileHash?: string;
  readonly idempotencyKey: string;
}

export interface ImportValidationRow {
  readonly rowNumber: number;
  readonly status: 'Valid' | 'Warning' | 'Error';
  readonly code?: string;
  readonly name?: string;
  readonly action?: 'Create' | 'Update' | 'Unchanged';
  readonly issues: string[];
}

export interface ImportValidationResult {
  readonly importSessionId: string;
  readonly entityType: ImportEntityType;
  readonly warehouseId?: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly templateVersion?: string;
  readonly totalRows: number;
  readonly validRows: number;
  readonly warningRows: number;
  readonly errorRows: number;
  readonly createCount: number;
  readonly updateCount: number;
  readonly unchangedCount: number;
  readonly rows: ImportValidationRow[];
  readonly canCommit: boolean;
  readonly approvalRequired?: boolean;
  readonly requiresReason?: boolean;
  readonly idempotencyKey: string;
  readonly fileHash?: string;
}

export interface ImportCommitRequest {
  readonly importSessionId: string;
  readonly mode: ImportMode;
  readonly idempotencyKey: string;
  readonly fileHash?: string;
  readonly reasonCode?: string;
  readonly reasonDescription?: string;
  readonly approvalRoute?: string;
}

export interface ImportResult {
  readonly success: boolean;
  readonly importSessionId?: string;
  readonly entityType?: ImportEntityType;
  readonly warehouseId?: string;
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly templateVersion?: string;
  readonly totalRecords?: number;
  readonly validRecords?: number;
  readonly warningRecords?: number;
  readonly errorRecords?: number;
  readonly createCount?: number;
  readonly updateCount?: number;
  readonly unchangedCount?: number;
  readonly submittedForApproval?: boolean;
  readonly committedCount: number;
  readonly failedCount: number;
  readonly errorFileName?: string;
  readonly errors?: string[];
  readonly correlationId: string;
}

export interface ExportRequest {
  readonly entityType: ImportEntityType;
  readonly warehouseId?: string;
  readonly format: ExportFormat;
  readonly filters?: WarehouseListQuery;
}

// ─── Paged result ─────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  readonly items: T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
