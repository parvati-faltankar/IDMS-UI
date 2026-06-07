// ─── Warehouse Master — In-Memory Mock Adapter ───────────────────────────────
//
// Full implementation of WarehouseService against in-memory seed data.
// Includes concurrency (version check), lifecycle guards, derivation, and
// all bulk/import/audit stubs.

import type { WarehouseService } from './warehouseService';
import type {
  AuditQuery,
  BulkLocationInput,
  BulkPreview,
  BulkPreviewRow,
  BulkResult,
  CommitBulkRequest,
  ControlledActionRequest,
  CreateLocationInput,
  CreateWarehouseInput,
  ImportCommitRequest,
  ImportResult,
  ImportValidationRequest,
  ImportValidationResult,
  PagedResult,
  StatusChangeRequest,
  UpdateWarehouseInput,
  WarehouseListQuery,
  WarehouseValidationInput,
} from '../types/warehouse.dto';
import type {
  ActionResult,
  AuditEvent,
  HierarchyNode,
  ValidationResult,
  Warehouse,
  WarehouseDetails,
  WarehouseLocation,
  WarehouseSummary,
} from '../types/warehouse.types';
import type { WarehouseStatus } from '../types/warehouse.enums';

import {
  SEED_WAREHOUSES,
  SEED_HIERARCHY_TEMPLATES,
  SEED_LOCATIONS,
  SEED_AUDIT_EVENTS,
} from '../fixtures/warehouseFixtures';
import {
  deriveInventoryControlRules,
  deriveBinManaged,
  deriveSetupHealth,
  deriveIsLeafEndpoint,
  deriveInventoryAllowed,
} from '../utils/warehouseDerivations';
import { buildHierarchyTree } from '../utils/hierarchyUtils';
import { validateWarehouseForActivation, canActivateWarehouse } from '../validation/activationValidation';
import { validateWarehouseInput } from '../validation/warehouseValidation';
import { validateLocationForSave } from '../validation/locationValidation';
import { warehouseMapper } from './warehouseMapper';

// ─── Module-level in-memory stores ────────────────────────────────────────────

let warehouseStore: Warehouse[] = [...SEED_WAREHOUSES];
let templateStore = [...SEED_HIERARCHY_TEMPLATES];
let locationStore: WarehouseLocation[] = [...SEED_LOCATIONS];
let auditStore: AuditEvent[] = [...SEED_AUDIT_EVENTS];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function nextId(prefix: string, store: Array<{ id: string }>): string {
  const max = store.reduce((m, item) => {
    const n = parseInt(item.id.replace(`${prefix}-`, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function appendAudit(event: Omit<AuditEvent, 'id'>): void {
  auditStore = [{ ...event, id: nextId('AUD', auditStore) }, ...auditStore];
}

function buildDetails(warehouse: Warehouse): WarehouseDetails {
  const templates = templateStore.filter((t) => t.warehouseId === warehouse.id);
  const locations = locationStore.filter((l) => l.warehouseId === warehouse.id);
  const setupHealth = deriveSetupHealth(warehouse, locations, templates);
  const recentAuditEvents = auditStore
    .filter((a) => a.entityId === warehouse.id)
    .slice(0, 10);

  return { warehouse, hierarchyTemplates: templates, setupHealth, recentAuditEvents };
}

function applyPagination<T>(items: T[], page: number, pageSize: number): PagedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
  };
}

// ─── Mock adapter ─────────────────────────────────────────────────────────────

export const warehouseMockAdapter: WarehouseService = {

  async listWarehouses(query: WarehouseListQuery): Promise<PagedResult<WarehouseSummary>> {
    let results = [...warehouseStore];

    if (query.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (w) =>
          w.warehouseCode.toLowerCase().includes(q) ||
          w.warehouseName.toLowerCase().includes(q),
      );
    }
    if (query.ownershipScope) {
      results = results.filter((w) => w.ownershipScope === query.ownershipScope);
    }
    if (query.warehouseType) {
      results = results.filter((w) => w.warehouseType === query.warehouseType);
    }
    if (query.status) {
      results = results.filter((w) => w.status === query.status);
    }
    if (query.binManaged !== undefined) {
      results = results.filter((w) => deriveBinManaged(w.inventoryControlMode) === query.binManaged);
    }

    // Sort
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    results.sort((a, b) => {
      const av = a[sortBy as keyof Warehouse] as string;
      const bv = b[sortBy as keyof Warehouse] as string;
      return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    const summaries = results.map((w) => warehouseMapper.toSummary(w, locationStore, templateStore));
    return applyPagination(summaries, query.page ?? 1, query.pageSize ?? 20);
  },

  async getWarehouse(id: string): Promise<WarehouseDetails> {
    const warehouse = warehouseStore.find((w) => w.id === id);
    if (!warehouse) throw new Error(`Warehouse not found: ${id}`);
    return buildDetails(warehouse);
  },

  async createWarehouse(input: CreateWarehouseInput): Promise<WarehouseDetails> {
    const fieldIssues = validateWarehouseInput(input, warehouseStore);
    if (fieldIssues.some((i) => i.severity === 'error')) {
      throw Object.assign(new Error('Validation failed'), { issues: fieldIssues });
    }

    const id = nextId('WH', warehouseStore);
    const timestamp = now();
    const newWarehouse: Warehouse = {
      id,
      warehouseCode: input.warehouseCode.trim().toUpperCase(),
      warehouseName: input.warehouseName.trim(),
      description: input.description,
      ownershipScope: input.ownershipScope,
      owningOrgCode: input.owningOrgCode,
      owningBranchCode: input.owningBranchCode,
      warehouseType: input.warehouseType,
      wmsEnabled: input.wmsEnabled,
      inventoryControlMode: input.inventoryControlMode,
      inventoryControlRules: deriveInventoryControlRules(input.inventoryControlMode),
      status: 'Draft',
      creationSource: 'Manual',
      assignmentProfile: { assignments: [], sharedWithAllBranches: false },
      defaultLocations: input.defaultLocations ?? {},
      autoPutaway: input.autoPutaway as Warehouse['autoPutaway'],
      autoPicking: input.autoPicking as Warehouse['autoPicking'],
      capacityPolicy: input.capacityPolicy as Warehouse['capacityPolicy'],
      storageConstraints: input.storageConstraints as Warehouse['storageConstraints'],
      operatingCalendar: input.operatingCalendar as Warehouse['operatingCalendar'],
      eligibilityPolicy: input.eligibilityPolicy as Warehouse['eligibilityPolicy'],
      reservationPolicy: input.reservationPolicy as Warehouse['reservationPolicy'],
      allocationPolicy: input.allocationPolicy as Warehouse['allocationPolicy'],
      cycleCountPolicy: input.cycleCountPolicy as Warehouse['cycleCountPolicy'],
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    };

    warehouseStore = [...warehouseStore, newWarehouse];
    appendAudit({ entityType: 'Warehouse', entityId: id, action: 'Create', performedBy: 'current-user', performedAt: timestamp, newStatus: 'Draft' });
    return buildDetails(newWarehouse);
  },

  async updateWarehouse(id: string, version: number, input: UpdateWarehouseInput): Promise<WarehouseDetails> {
    const idx = warehouseStore.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Warehouse not found: ${id}`);

    const existing = warehouseStore[idx];
    if (existing.version !== version) {
      throw Object.assign(new Error('Stale record'), {
        issues: [{ severity: 'error', category: 'StaleRecord', message: 'Warehouse has been modified by another user. Please reload and retry.' }],
      });
    }

    const updated: Warehouse = {
      ...existing,
      ...(input as Partial<Warehouse>),
      id,
      inventoryControlRules: deriveInventoryControlRules(
        input.inventoryControlMode ?? existing.inventoryControlMode,
      ),
      updatedAt: now(),
      version: existing.version + 1,
    };

    warehouseStore = [...warehouseStore.slice(0, idx), updated, ...warehouseStore.slice(idx + 1)];
    appendAudit({ entityType: 'Warehouse', entityId: id, action: 'Update', performedBy: 'current-user', performedAt: updated.updatedAt });
    return buildDetails(updated);
  },

  async validateWarehouse(input: WarehouseValidationInput): Promise<ValidationResult> {
    const issues = validateWarehouseInput(
      input.input as CreateWarehouseInput,
      warehouseStore,
      input.warehouseId,
    );
    return { valid: issues.filter((i) => i.severity === 'error').length === 0, issues };
  },

  async activateWarehouse(id: string, request: ControlledActionRequest): Promise<ActionResult> {
    const warehouse = warehouseStore.find((w) => w.id === id);
    if (!warehouse) throw new Error(`Warehouse not found: ${id}`);

    const templates = templateStore.filter((t) => t.warehouseId === id);
    const locations = locationStore.filter((l) => l.warehouseId === id);

    const issues = validateWarehouseForActivation(warehouse, templates, locations);
    if (issues.some((i) => i.severity === 'error')) {
      return { success: false, issues };
    }

    const timestamp = now();
    const activated: Warehouse = {
      ...warehouse,
      status: 'Active',
      activatedAt: timestamp,
      updatedAt: timestamp,
      version: warehouse.version + 1,
    };

    const idx = warehouseStore.findIndex((w) => w.id === id);
    warehouseStore = [...warehouseStore.slice(0, idx), activated, ...warehouseStore.slice(idx + 1)];
    appendAudit({
      entityType: 'Warehouse',
      entityId: id,
      action: 'Activate',
      performedBy: 'current-user',
      performedAt: timestamp,
      previousStatus: 'Draft',
      newStatus: 'Active',
      correlationId: request.correlationId,
    });

    return { success: true, warehouse: activated, issues: [] };
  },

  async changeWarehouseStatus(id: string, request: StatusChangeRequest): Promise<ActionResult> {
    const idx = warehouseStore.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Warehouse not found: ${id}`);

    const warehouse = warehouseStore[idx];
    const target: WarehouseStatus = request.targetStatus;

    // Require reason for Block / Inactivate
    if ((target === 'Blocked' || target === 'Inactive') && !request.reasonCode) {
      return {
        success: false,
        issues: [{ severity: 'error', category: 'FieldRequired', message: 'Reason code is required for this action.' }],
      };
    }

    const timestamp = now();
    const updated: Warehouse = {
      ...warehouse,
      status: target,
      blockReason: target === 'Blocked' ? request.reasonDescription : warehouse.blockReason,
      blockReasonCode: target === 'Blocked' ? request.reasonCode : warehouse.blockReasonCode,
      inactiveReason: target === 'Inactive' ? request.reasonDescription : warehouse.inactiveReason,
      updatedAt: timestamp,
      version: warehouse.version + 1,
    };

    warehouseStore = [...warehouseStore.slice(0, idx), updated, ...warehouseStore.slice(idx + 1)];
    appendAudit({
      entityType: 'Warehouse',
      entityId: id,
      action: request.action,
      performedBy: 'current-user',
      performedAt: timestamp,
      previousStatus: warehouse.status,
      newStatus: target,
      reasonCode: request.reasonCode,
      reasonDescription: request.reasonDescription,
      correlationId: request.correlationId,
    });

    return { success: true, warehouse: updated, issues: [] };
  },

  async listHierarchy(id: string): Promise<HierarchyNode[]> {
    const locations = locationStore.filter((l) => l.warehouseId === id);
    const activeTemplate = templateStore.find((t) => t.warehouseId === id && t.status === 'Active');
    return buildHierarchyTree(locations, activeTemplate);
  },

  async createLocation(warehouseId: string, input: CreateLocationInput): Promise<WarehouseLocation> {
    const warehouse = warehouseStore.find((w) => w.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);

    const warehouseLocations = locationStore.filter((l) => l.warehouseId === warehouseId);
    const fieldErrors = validateLocationForSave(input, warehouse, warehouseLocations);
    if (Object.values(fieldErrors).some(Boolean)) {
      throw Object.assign(new Error('Location validation failed'), { fieldErrors });
    }

    const id = nextId('LOC', locationStore);
    const timestamp = now();
    const activeTemplate = templateStore.find((t) => t.warehouseId === warehouseId && t.status === 'Active');

    // Compute level
    let level = 1;
    if (input.parentLocationId) {
      const parent = locationStore.find((l) => l.id === input.parentLocationId);
      if (parent) level = parent.profile.level + 1;
    }

    // Build provisional full code (will need to be recomputed after persist in a real system)
    const codeParts: string[] = [];
    let parentId: string | undefined = input.parentLocationId;
    while (parentId) {
      const parent = locationStore.find((l) => l.id === parentId);
      if (!parent) break;
      codeParts.unshift(parent.locationCode);
      parentId = parent.parentLocationId;
    }
    codeParts.push(input.locationCode.trim().toUpperCase());
    const fullCode = [warehouse.warehouseCode, ...codeParts].join('-');

    const newLocation: WarehouseLocation = {
      id,
      warehouseId,
      locationCode: input.locationCode.trim().toUpperCase(),
      locationName: input.locationName.trim(),
      parentLocationId: input.parentLocationId,
      status: 'Draft',
      profile: {
        locationType: input.locationType,
        binType: input.binType as WarehouseLocation['profile']['binType'],
        barcodeValue: input.barcodeValue,
        level,
        fullCode,
        isLeafEndpoint: true, // provisional — no children yet
        inventoryAllowed: false, // Draft: not yet allowed
      },
      capacity: input.capacity
        ? { maxWeightKg: input.capacity.maxWeightKg, maxVolumeM3: input.capacity.maxVolumeM3, maxUnits: input.capacity.maxUnits }
        : undefined,
      storageConstraints: input.storageConstraints as WarehouseLocation['storageConstraints'],
      eligibilityPolicy: input.eligibilityPolicy as WarehouseLocation['eligibilityPolicy'],
      putawayBlocked: input.putawayBlocked ?? false,
      pickingBlocked: input.pickingBlocked ?? false,
      movementState: 'Idle',
      commitmentState: 'Uncommitted',
      stockStatuses: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    };

    locationStore = [...locationStore, newLocation];
    appendAudit({ entityType: 'Location', entityId: id, action: 'Create', performedBy: 'current-user', performedAt: timestamp, newStatus: 'Draft' });
    return newLocation;
  },

  async bulkPreviewLocations(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    const warehouse = warehouseStore.find((w) => w.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);

    const existingCodes = new Set(
      locationStore.filter((l) => l.warehouseId === warehouseId).map((l) => l.locationCode.toUpperCase()),
    );

    const paramsHash = btoa(JSON.stringify({ ...input, warehouseId }));
    const rows: BulkPreviewRow[] = [];

    for (let i = 0; i < input.count; i++) {
      const seq = input.startSequence + i;
      const seqStr = String(seq).padStart(input.sequenceLength, '0');
      const code = `${input.codePrefix}${seqStr}`.toUpperCase();
      const name = `${input.namePrefix} ${seqStr}`;
      const conflict = existingCodes.has(code);
      rows.push({
        sequenceNumber: seq,
        proposedCode: code,
        proposedName: name,
        conflict,
        conflictReason: conflict ? `Code "${code}" already exists in this warehouse.` : undefined,
      });
    }

    return {
      previewToken: `PREV-${Date.now()}`,
      warehouseId,
      rows,
      totalRows: rows.length,
      conflictCount: rows.filter((r) => r.conflict).length,
      validCount: rows.filter((r) => !r.conflict).length,
      generatedAt: now(),
      paramsHash,
    };
  },

  async commitBulkLocations(warehouseId: string, request: CommitBulkRequest): Promise<BulkResult> {
    const warehouse = warehouseStore.find((w) => w.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);

    // In a real system we'd look up the preview session. Here we return success.
    const correlationId = `COR-BULK-${Date.now()}`;
    appendAudit({
      entityType: 'Warehouse',
      entityId: warehouseId,
      action: 'BulkCreate',
      performedBy: 'current-user',
      performedAt: now(),
      correlationId,
    });

    return { success: true, createdCount: 0, failedCount: 0, errors: [], correlationId };
  },

  async validateImport(request: ImportValidationRequest): Promise<ImportValidationResult> {
    // Stub — real implementation parses the file
    return {
      importSessionId: `IMP-${Date.now()}`,
      entityType: request.entityType,
      totalRows: 0,
      validRows: 0,
      warningRows: 0,
      errorRows: 0,
      rows: [],
      canCommit: false,
    };
  },

  async commitImport(request: ImportCommitRequest): Promise<ImportResult> {
    return { success: false, committedCount: 0, failedCount: 0, correlationId: `COR-IMP-${Date.now()}` };
  },

  async getAudit(id: string, query: AuditQuery): Promise<PagedResult<AuditEvent>> {
    let events = auditStore.filter((a) => a.entityId === id);

    if (query.entityType) events = events.filter((a) => a.entityType === query.entityType);
    if (query.action) events = events.filter((a) => a.action === query.action);
    if (query.fromDate) events = events.filter((a) => a.performedAt >= query.fromDate!);
    if (query.toDate) events = events.filter((a) => a.performedAt <= query.toDate!);

    events.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
    return applyPagination(events, query.page ?? 1, query.pageSize ?? 20);
  },
};

// ─── Expose store reset for tests ─────────────────────────────────────────────

export function __resetMockStores(): void {
  warehouseStore = [...SEED_WAREHOUSES];
  templateStore = [...SEED_HIERARCHY_TEMPLATES];
  locationStore = [...SEED_LOCATIONS];
  auditStore = [...SEED_AUDIT_EVENTS];
}
