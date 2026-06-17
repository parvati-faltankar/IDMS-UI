// ─── Warehouse Master — Service Interface ─────────────────────────────────────

import type {
  AuditQuery,
  BulkLocationInput,
  LocationIdentifierConflict,
  LocationIdentifierPreviewInput,
  LocationIdentifierPreviewResult,
  QuickHierarchyCommitRequest,
  QuickHierarchyCommitResult,
  QuickHierarchyPattern,
  QuickHierarchyPreviewInput,
  QuickHierarchyPreviewResult,
  BulkPreview,
  BulkResult,
  CommitBulkRequest,
  CreateLocationInput,
  CreateWarehouseInput,
  ImportCommitRequest,
  ImportResult,
  ImportValidationRequest,
  ImportValidationResult,
  ListCapacityIssuesQuery,
  PreviewCapacityImpactInput,
  PagedResult,
  StatusChangeRequest,
  UpdateLocationCapacityInput,
  UpdateWarehouseInput,
  ValidateLocationCapacityInput,
  WarehouseListQuery,
  WarehouseValidationInput,
  ControlledActionRequest,
} from '../types/warehouse.dto';
import type {
  ActionResult,
  AuditEvent,
  HierarchyNode,
  ProjectedPostingCapacityResult,
  ValidationResult,
  WarehouseDetails,
  WarehouseLocation,
  WarehouseSummary,
} from '../types/warehouse.types';

// ─── Service interface ────────────────────────────────────────────────────────

export interface WarehouseService {
  listWarehouses(query: WarehouseListQuery): Promise<PagedResult<WarehouseSummary>>;
  getWarehouse(id: string): Promise<WarehouseDetails>;
  createWarehouse(input: CreateWarehouseInput): Promise<WarehouseDetails>;
  updateWarehouse(id: string, version: number, input: UpdateWarehouseInput): Promise<WarehouseDetails>;
  validateWarehouse(input: WarehouseValidationInput): Promise<ValidationResult>;
  activateWarehouse(id: string, request: ControlledActionRequest): Promise<ActionResult>;
  changeWarehouseStatus(id: string, request: StatusChangeRequest): Promise<ActionResult>;
  listHierarchy(id: string): Promise<HierarchyNode[]>;
  createLocation(id: string, input: CreateLocationInput): Promise<WarehouseLocation>;
  previewLocationIdentifier(id: string, input: LocationIdentifierPreviewInput): Promise<LocationIdentifierPreviewResult>;
  listQuickHierarchyPatterns(id: string): Promise<QuickHierarchyPattern[]>;
  previewQuickHierarchy(id: string, input: QuickHierarchyPreviewInput): Promise<QuickHierarchyPreviewResult>;
  validateQuickHierarchy(id: string, input: QuickHierarchyPreviewInput): Promise<ValidationResult>;
  commitQuickHierarchy(id: string, request: QuickHierarchyCommitRequest): Promise<QuickHierarchyCommitResult>;
  previewBulkLocationIdentifiers(id: string, input: BulkLocationInput): Promise<BulkPreview>;
  validateLocationIdentifier(id: string, input: LocationIdentifierPreviewInput): Promise<ValidationResult>;
  listLocationIdentifierConflicts(id: string): Promise<LocationIdentifierConflict[]>;
  getLocationCapacity(warehouseId: string, locationId: string): Promise<WarehouseLocation['capacity'] | undefined>;
  updateLocationCapacity(warehouseId: string, input: UpdateLocationCapacityInput): Promise<WarehouseLocation>;
  validateLocationCapacity(warehouseId: string, input: ValidateLocationCapacityInput): Promise<ValidationResult>;
  previewCapacityImpact(warehouseId: string, input: PreviewCapacityImpactInput): Promise<ProjectedPostingCapacityResult>;
  listCapacityIssues(query: ListCapacityIssuesQuery): Promise<ValidationResult>;
  bulkPreviewLocations(id: string, input: BulkLocationInput): Promise<BulkPreview>;
  commitBulkLocations(id: string, request: CommitBulkRequest): Promise<BulkResult>;
  validateImport(request: ImportValidationRequest): Promise<ImportValidationResult>;
  commitImport(request: ImportCommitRequest): Promise<ImportResult>;
  getAudit(id: string, query: AuditQuery): Promise<PagedResult<AuditEvent>>;
}
