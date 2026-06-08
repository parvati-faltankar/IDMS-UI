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
  CreateHierarchyTemplateInput,
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
  HierarchyTemplate,
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
  deriveBinManaged,
  deriveInventoryControlRules,
  deriveSetupHealth,
  deriveIsLeafEndpoint,
  deriveInventoryAllowed,
} from '../utils/warehouseDerivations';
import {
  buildFullLocationCodeFromParent,
  buildHierarchyTree,
  getAllowedChildTemplateLevels,
} from '../utils/hierarchyUtils';
import { validateWarehouseForActivation, canActivateWarehouse } from '../validation/activationValidation';
import { validateWarehouseInput } from '../validation/warehouseValidation';
import { validateLocationForSave } from '../validation/locationValidation';
import { validateHierarchyTemplateForActivation, validateHierarchyTemplateForSave } from '../validation/hierarchyValidation';
import { warehouseMapper } from './warehouseMapper';

// ─── Module-level in-memory stores ────────────────────────────────────────────

let warehouseStore: Warehouse[] = [...SEED_WAREHOUSES];
let templateStore = [...SEED_HIERARCHY_TEMPLATES];
let locationStore: WarehouseLocation[] = [...SEED_LOCATIONS];
let auditStore: AuditEvent[] = [...SEED_AUDIT_EVENTS];
let bulkPreviewStore = new Map<string, { warehouseId: string; input: BulkLocationInput; paramsHash: string; rows: BulkPreviewRow[] }>();
let importValidationStore = new Map<string, ImportValidationResult>();
let committedImportKeys = new Set<string>();

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

function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return `H${Math.abs(hash)}`;
}

function buildDetails(warehouse: Warehouse): WarehouseDetails {
  const templates = templateStore.filter((t) => t.warehouseId === warehouse.id);
  const locations = locationStore.filter((l) => l.warehouseId === warehouse.id);
  const setupHealth = deriveSetupHealth(warehouse, locations, templates);
  const recentAuditEvents = auditStore
    .filter((a) => a.entityId === warehouse.id)
    .slice(0, 10);

  return { warehouse, hierarchyTemplates: templates, locations, setupHealth, recentAuditEvents };
}

function computeLocationLevelFromParent(parentLocationId: string | undefined): number {
  if (!parentLocationId) return 1;
  const parent = locationStore.find((location) => location.id === parentLocationId);
  return parent ? parent.profile.level + 1 : 1;
}

function computeFullLocationCode(
  warehouseCode: string,
  locationCode: string,
  parentLocationId?: string,
): string {
  const codeParts: string[] = [];
  let currentParentId = parentLocationId;

  while (currentParentId) {
    const parent = locationStore.find((location) => location.id === currentParentId);
    if (!parent) break;
    codeParts.unshift(parent.locationCode);
    currentParentId = parent.parentLocationId;
  }

  codeParts.push(locationCode.trim().toUpperCase());
  return [warehouseCode, ...codeParts].join('-');
}

function recomputeDerivedLocationState(
  warehouseId: string,
  nextLocations: WarehouseLocation[],
): WarehouseLocation[] {
  const activeTemplate = templateStore.find(
    (template) => template.warehouseId === warehouseId && template.status === 'Active',
  );

  return nextLocations.map((location) => {
    const fullCode = buildFullLocationCodeFromParent(
      warehouseStore.find((warehouse) => warehouse.id === warehouseId)?.warehouseCode ?? '',
      location.locationCode,
      location.parentLocationId,
      nextLocations,
    );
    const leafEndpoint = deriveIsLeafEndpoint(location.id, nextLocations, activeTemplate);
    const inventoryAllowed = deriveInventoryAllowed(location, nextLocations, activeTemplate);
    return {
      ...location,
      profile: {
        ...location.profile,
        fullCode,
        isLeafEndpoint: leafEndpoint,
        inventoryAllowed,
      },
    };
  });
}

function getLocationTypeForTemplateLevel(levelCode: string): WarehouseLocation['profile']['locationType'] {
  switch (levelCode.trim().toUpperCase()) {
    case 'ZONE':
      return 'Zone';
    case 'AISLE':
      return 'Aisle';
    case 'RACK':
      return 'Rack';
    case 'SHELF':
      return 'Shelf';
    case 'BIN':
      return 'BIN';
    case 'DOCK':
      return 'Dock';
    case 'STAGING':
      return 'Staging';
    case 'QC':
      return 'QC';
    case 'SCRAP':
      return 'Scrap';
    case 'VIRTUAL':
      return 'Virtual';
    default:
      return 'General';
  }
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
    const selectedBranchCodes =
      input.ownershipScope === 'Branch'
        ? input.owningBranchCodes?.length
          ? input.owningBranchCodes
          : input.owningBranchCode
            ? [input.owningBranchCode]
            : []
        : input.sharedBranchCodes ?? [];
    const branchOwnershipSource = input.branchOwnershipRows?.[0];
    const inventoryOwnerCode = input.inventoryOwnerCode ?? branchOwnershipSource?.inventoryOwnerCode;
    const newWarehouse: Warehouse = {
      id,
      warehouseCode: input.warehouseCode.trim().toUpperCase(),
      warehouseName: input.warehouseName.trim(),
      description: input.description,
      ownershipScope: input.ownershipScope,
      owningOrgCode: input.owningOrgCode,
      owningBranchCode:
        input.ownershipScope === 'Branch'
          ? selectedBranchCodes[0]
          : input.owningBranchCode,
      warehouseType: input.warehouseType,
      wmsEnabled: input.wmsEnabled,
      inventoryControlMode: input.inventoryControlMode,
      inventoryControlRules: deriveInventoryControlRules(input.inventoryControlMode),
      status: 'Draft',
      creationSource: 'Manual',
      assignmentProfile: {
        assignments: selectedBranchCodes.map((branchCode) => ({
          branchCode,
          branchName: branchCode,
          assignmentStatus: 'Active',
          isDefaultForBranch: branchCode === selectedBranchCodes[0],
          effectiveFrom: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
        sharedWithAllBranches: input.sharedWithAllBranches ?? false,
        businessUnit: input.businessUnit ?? branchOwnershipSource?.businessUnit,
        legalEntityCode: input.legalEntityCode ?? branchOwnershipSource?.legalEntityCode,
        inventoryOwner: inventoryOwnerCode
          ? {
              ownerCode: inventoryOwnerCode,
              ownerName: inventoryOwnerCode,
              ownerType: input.ownershipScope === 'Branch' ? 'Branch' : 'Company',
            }
          : undefined,
      },
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
    appendAudit({ entityType: 'Warehouse', entityId: id, action: 'Create', performedBy: 'current-user', performedAt: timestamp, newStatus: 'Draft', source: 'Manual', recordVersion: 1 });
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
    appendAudit({
      entityType: 'Warehouse',
      entityId: id,
      action: 'Update',
      performedBy: 'current-user',
      performedAt: updated.updatedAt,
      source: 'Manual',
      recordVersion: updated.version,
      fieldChanges: Object.keys(input).map((field) => ({
        field,
        previousValue: String((existing as Record<string, unknown>)[field] ?? ''),
        newValue: String((updated as Record<string, unknown>)[field] ?? ''),
      })),
    });
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
      source: 'Manual',
      recordVersion: activated.version,
      reasonCode: request.reasonCode,
      reasonDescription: request.reasonDescription,
      approvalRoute: request.approvalRoute,
      effectiveDate: request.effectiveDate,
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
      source: 'Manual',
      recordVersion: updated.version,
      approvalRoute: request.approvalRoute,
      effectiveDate: request.effectiveDate,
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
    const activeTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
    const fieldErrors = validateLocationForSave(input, warehouse, warehouseLocations, activeTemplate);
    if (Object.values(fieldErrors).some(Boolean)) {
      throw Object.assign(new Error('Location validation failed'), { fieldErrors });
    }

    const id = nextId('LOC', locationStore);
    const timestamp = now();
    const parentLocation = input.parentLocationId
      ? warehouseLocations.find((location) => location.id === input.parentLocationId) ?? null
      : null;
    const allowedTemplateLevels = getAllowedChildTemplateLevels(parentLocation, activeTemplate);
    const matchedTemplateLevel = allowedTemplateLevels.find((levelDef) => {
      const upperLocationType = input.locationType.toUpperCase();
      return (
        levelDef.levelCode.toUpperCase() === upperLocationType ||
        levelDef.levelName.toUpperCase() === upperLocationType
      );
    });
    const level = matchedTemplateLevel?.sequence ?? computeLocationLevelFromParent(input.parentLocationId);
    const fullCode = buildFullLocationCodeFromParent(
      warehouse.warehouseCode,
      input.locationCode,
      input.parentLocationId,
      warehouseLocations,
    );

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

    locationStore = recomputeDerivedLocationState(warehouseId, [...locationStore, newLocation]);
    appendAudit({ entityType: 'Location', entityId: id, action: 'Create', performedBy: 'current-user', performedAt: timestamp, newStatus: 'Draft' });
    return locationStore.find((location) => location.id === id) ?? newLocation;
  },

  async bulkPreviewLocations(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    const warehouse = warehouseStore.find((w) => w.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);
    const activeTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
    const warehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
    const parentLocation = input.parentLocationId
      ? warehouseLocations.find((location) => location.id === input.parentLocationId) ?? null
      : null;
    const allowedTemplateLevels = getAllowedChildTemplateLevels(parentLocation, activeTemplate);
    const matchedLevel = allowedTemplateLevels.find(
      (level) => getLocationTypeForTemplateLevel(level.levelCode) === input.locationType,
    );
    if (activeTemplate && !matchedLevel) {
      throw new Error('Bulk create child level is not allowed under the selected parent by the active template.');
    }

    const existingFullCodes = new Set(
      locationStore.filter((l) => l.warehouseId === warehouseId).map((l) => l.profile.fullCode.toUpperCase()),
    );

    const paramsHash = btoa(JSON.stringify({ ...input, warehouseId }));
    const rows: BulkPreviewRow[] = [];
    const seenCodes = new Set<string>();
    const separator = input.separator ?? '';
    const suffix = input.suffix ?? '';
    const level = matchedLevel?.sequence ?? input.level ?? computeLocationLevelFromParent(input.parentLocationId);

    for (let i = 0; i < input.count; i++) {
      const seq = input.startSequence + i;
      const seqStr = String(seq).padStart(input.sequenceLength, '0');
      const code = `${input.codePrefix}${separator}${seqStr}${suffix}`.toUpperCase();
      const name = `${input.namePrefix}${separator}${seqStr}${suffix}`.trim();
      const fullCode = buildFullLocationCodeFromParent(
        warehouse.warehouseCode,
        code,
        input.parentLocationId,
        warehouseLocations,
      ).toUpperCase();
      let conflict = false;
      let conflictReason: string | undefined;

      if (seenCodes.has(code)) {
        conflict = true;
        conflictReason = `Duplicate code "${code}" generated within this batch.`;
      } else if (existingFullCodes.has(fullCode)) {
        conflict = true;
        conflictReason = `Full location path "${fullCode}" already exists in this warehouse.`;
      }

      seenCodes.add(code);
      rows.push({
        sequenceNumber: seq,
        proposedCode: code,
        proposedName: name,
        conflict,
        conflictReason,
      });
    }

    const previewToken = `PREV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    bulkPreviewStore.set(previewToken, {
      warehouseId,
      input: {
        ...input,
        level,
        locationType: matchedLevel ? getLocationTypeForTemplateLevel(matchedLevel.levelCode) : input.locationType,
      },
      paramsHash,
      rows,
    });

    return {
      previewToken,
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

    const preview = bulkPreviewStore.get(request.previewToken);
    if (!preview || preview.warehouseId !== warehouseId) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        errors: [{ code: 'PREVIEW', name: 'Preview session', reason: 'Bulk preview has expired or is invalid.' }],
        correlationId: `COR-BULK-${Date.now()}`,
      };
    }

    if (preview.paramsHash !== request.paramsHash) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        errors: [{ code: 'STALE', name: 'Bulk input', reason: 'Preview is stale. Regenerate preview before commit.' }],
        correlationId: `COR-BULK-${Date.now()}`,
      };
    }

    const conflictRows = preview.rows.filter((row) => row.conflict);
    if (conflictRows.length > 0) {
      return {
        success: false,
        createdCount: 0,
        failedCount: conflictRows.length,
        errors: conflictRows.map((row) => ({
          code: row.proposedCode,
          name: row.proposedName,
          reason: row.conflictReason ?? 'Conflict detected.',
        })),
        correlationId: `COR-BULK-${Date.now()}`,
      };
    }

    const level = preview.input.level ?? computeLocationLevelFromParent(preview.input.parentLocationId);
    const parentLocationId = preview.input.parentLocationId;
    const locationType = preview.input.locationType;
    const binType = preview.input.binType;
    const timestamp = now();
    const existingFullCodes = new Set(
      locationStore.filter((location) => location.warehouseId === warehouseId).map((location) => location.profile.fullCode.toUpperCase()),
    );
    const newLocations: WarehouseLocation[] = [];

    for (const row of preview.rows) {
      const fullCode = computeFullLocationCode(warehouse.warehouseCode, row.proposedCode, parentLocationId).toUpperCase();
      if (existingFullCodes.has(fullCode)) {
        return {
          success: false,
          createdCount: 0,
          failedCount: 1,
          errors: [{ code: row.proposedCode, name: row.proposedName, reason: `Full location path "${fullCode}" already exists.` }],
          correlationId: `COR-BULK-${Date.now()}`,
        };
      }

      const id = nextId('LOC', [...locationStore, ...newLocations]);
      const location: WarehouseLocation = {
        id,
        warehouseId,
        locationCode: row.proposedCode,
        locationName: row.proposedName,
        parentLocationId,
        status: 'Draft',
        profile: {
          locationType,
          binType: binType as WarehouseLocation['profile']['binType'],
          level,
          fullCode,
          isLeafEndpoint: true,
          inventoryAllowed: false,
        },
        putawayBlocked: false,
        pickingBlocked: false,
        movementState: 'Idle',
        commitmentState: 'Uncommitted',
        stockStatuses: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1,
      };

      newLocations.push(location);
      existingFullCodes.add(fullCode);
    }

    const recomputedWarehouseLocations = recomputeDerivedLocationState(
      warehouseId,
      [...locationStore.filter((location) => location.warehouseId === warehouseId), ...newLocations],
    );
    locationStore = [
      ...recomputedWarehouseLocations,
      ...locationStore.filter((location) => location.warehouseId !== warehouseId),
    ];
    const correlationId = `COR-BULK-${Date.now()}`;
    for (const location of newLocations) {
      appendAudit({
        entityType: 'Location',
        entityId: location.id,
        action: 'BulkCreate',
        performedBy: 'current-user',
        performedAt: timestamp,
        newStatus: 'Draft',
        correlationId,
        source: 'Bulk',
        recordVersion: location.version,
      });
    }
    appendAudit({
      entityType: 'Warehouse',
      entityId: warehouseId,
      action: 'BulkCreate',
      performedBy: 'current-user',
      performedAt: timestamp,
      correlationId,
      source: 'Bulk',
    });
    bulkPreviewStore.delete(request.previewToken);

    return {
      success: true,
      createdCount: newLocations.length,
      failedCount: 0,
      errors: [],
      correlationId,
    };
  },

  async validateImport(request: ImportValidationRequest): Promise<ImportValidationResult> {
    const importSessionId = `IMP-${Date.now()}`;
    const fileHash = request.fileHash ?? simpleHash([request.entityType, request.fileName, request.fileSize, request.templateVersion ?? 'v1'].join('|'));
    const lowerName = request.fileName.toLowerCase();
    const hasDerivedField = lowerName.includes('derived');
    const hasControlledChange = lowerName.includes('controlled') || lowerName.includes('approval');
    const hasWarnings = lowerName.includes('warn') || request.mode === 'Incremental';
    const totalRows = lowerName.includes('empty') ? 0 : (request.entityType === 'Warehouse' ? 6 : 8);
    const rows: ImportValidationRow[] = [];

    for (let index = 1; index <= totalRows; index++) {
      const status = hasDerivedField && index === 2
        ? 'Error'
        : hasWarnings && index === totalRows
          ? 'Warning'
          : 'Valid';
      rows.push({
        rowNumber: index,
        status,
        code: `${request.entityType.slice(0, 3).toUpperCase()}-${String(index).padStart(3, '0')}`,
        name: `${request.entityType} Row ${index}`,
        action: index % 5 === 0 ? 'Unchanged' : index % 2 === 0 ? 'Update' : 'Create',
        issues: status === 'Error'
          ? ['Derived fields must not be imported. Remove computed columns and retry.']
          : status === 'Warning'
            ? ['Controlled field change will require approval on submit.']
            : [],
      });
    }

    const validRows = rows.filter((row) => row.status === 'Valid').length;
    const warningRows = rows.filter((row) => row.status === 'Warning').length;
    const errorRows = rows.filter((row) => row.status === 'Error').length;
    const createCount = rows.filter((row) => row.action === 'Create').length;
    const updateCount = rows.filter((row) => row.action === 'Update').length;
    const unchangedCount = rows.filter((row) => row.action === 'Unchanged').length;
    const result: ImportValidationResult = {
      importSessionId,
      entityType: request.entityType,
      warehouseId: request.warehouseId,
      fileName: request.fileName,
      fileSize: request.fileSize,
      templateVersion: request.templateVersion ?? 'WM-TPL-1.0',
      totalRows,
      validRows,
      warningRows,
      errorRows,
      createCount,
      updateCount,
      unchangedCount,
      rows,
      canCommit: totalRows > 0 && errorRows === 0,
      approvalRequired: hasControlledChange,
      requiresReason: hasControlledChange,
      idempotencyKey: request.idempotencyKey,
      fileHash,
    };

    importValidationStore.set(importSessionId, result);
    appendAudit({
      entityType: 'Warehouse',
      entityId: request.warehouseId ?? 'GLOBAL',
      action: 'ImportValidate',
      performedBy: 'current-user',
      performedAt: now(),
      correlationId: importSessionId,
      source: 'Import',
      referenceId: request.fileName,
    });
    return result;
  },

  async commitImport(request: ImportCommitRequest): Promise<ImportResult> {
    const validation = importValidationStore.get(request.importSessionId);
    const correlationId = `COR-IMP-${Date.now()}`;

    if (!validation) {
      return {
        success: false,
        committedCount: 0,
        failedCount: 1,
        errors: ['Import session is missing or expired. Revalidate before commit.'],
        correlationId,
      };
    }

    if (!validation.canCommit) {
      return {
        success: false,
        importSessionId: validation.importSessionId,
        entityType: validation.entityType,
        warehouseId: validation.warehouseId,
        fileName: validation.fileName,
        fileSize: validation.fileSize,
        templateVersion: validation.templateVersion,
        totalRecords: validation.totalRows,
        validRecords: validation.validRows,
        warningRecords: validation.warningRows,
        errorRecords: validation.errorRows,
        createCount: validation.createCount,
        updateCount: validation.updateCount,
        unchangedCount: validation.unchangedCount,
        committedCount: 0,
        failedCount: validation.errorRows,
        errorFileName: `${validation.fileName}.errors.csv`,
        errors: ['Import contains validation errors. Commit is blocked until those are resolved.'],
        correlationId,
      };
    }

    if (committedImportKeys.has(request.idempotencyKey) || (request.fileHash && committedImportKeys.has(request.fileHash))) {
      return {
        success: false,
        importSessionId: validation.importSessionId,
        entityType: validation.entityType,
        warehouseId: validation.warehouseId,
        fileName: validation.fileName,
        fileSize: validation.fileSize,
        templateVersion: validation.templateVersion,
        totalRecords: validation.totalRows,
        validRecords: validation.validRows,
        warningRecords: validation.warningRows,
        errorRecords: validation.errorRows,
        createCount: validation.createCount,
        updateCount: validation.updateCount,
        unchangedCount: validation.unchangedCount,
        committedCount: 0,
        failedCount: validation.totalRows,
        errors: ['Duplicate submission detected by idempotency key or file hash.'],
        correlationId,
      };
    }

    if (validation.approvalRequired && !request.reasonCode) {
      return {
        success: false,
        importSessionId: validation.importSessionId,
        entityType: validation.entityType,
        warehouseId: validation.warehouseId,
        fileName: validation.fileName,
        fileSize: validation.fileSize,
        templateVersion: validation.templateVersion,
        totalRecords: validation.totalRows,
        validRecords: validation.validRows,
        warningRecords: validation.warningRows,
        errorRecords: validation.errorRows,
        createCount: validation.createCount,
        updateCount: validation.updateCount,
        unchangedCount: validation.unchangedCount,
        committedCount: 0,
        failedCount: validation.warningRows,
        errors: ['Controlled field changes require a reason code before submit.'],
        correlationId,
      };
    }

    committedImportKeys.add(request.idempotencyKey);
    if (request.fileHash) committedImportKeys.add(request.fileHash);

    appendAudit({
      entityType: 'Warehouse',
      entityId: validation.warehouseId ?? 'GLOBAL',
      action: validation.approvalRequired ? 'ImportSubmittedForApproval' : 'ImportCommit',
      performedBy: 'current-user',
      performedAt: now(),
      correlationId,
      source: 'Import',
      referenceId: validation.fileName,
      reasonCode: request.reasonCode,
      reasonDescription: request.reasonDescription,
      approvalRoute: request.approvalRoute,
      approvalStatus: validation.approvalRequired ? 'Pending' : 'NotRequired',
      snapshot: {
        entityType: validation.entityType,
        totalRows: validation.totalRows,
        createCount: validation.createCount,
        updateCount: validation.updateCount,
        unchangedCount: validation.unchangedCount,
      },
    });

    return {
      success: true,
      importSessionId: validation.importSessionId,
      entityType: validation.entityType,
      warehouseId: validation.warehouseId,
      fileName: validation.fileName,
      fileSize: validation.fileSize,
      templateVersion: validation.templateVersion,
      totalRecords: validation.totalRows,
      validRecords: validation.validRows,
      warningRecords: validation.warningRows,
      errorRecords: validation.errorRows,
      createCount: validation.createCount,
      updateCount: validation.updateCount,
      unchangedCount: validation.unchangedCount,
      submittedForApproval: Boolean(validation.approvalRequired),
      committedCount: validation.approvalRequired ? 0 : validation.validRows + validation.warningRows,
      failedCount: 0,
      correlationId,
      errorFileName: validation.errorRows > 0 ? `${validation.fileName}.errors.csv` : undefined,
    };
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

export async function createHierarchyTemplateMock(
  input: CreateHierarchyTemplateInput,
): Promise<HierarchyTemplate> {
  const warehouseTemplates = templateStore.filter((template) => template.warehouseId === input.warehouseId);
  const fieldErrors = validateHierarchyTemplateForSave(
    input,
    warehouseTemplates,
  );
  if (Object.values(fieldErrors).some(Boolean)) {
    throw Object.assign(new Error('Hierarchy template validation failed'), { fieldErrors });
  }

  const timestamp = now();
  const siblingVersions = warehouseTemplates
    .filter((template) => template.templateCode.trim().toUpperCase() === input.templateCode.trim().toUpperCase())
    .map((template) => template.currentVersion.versionNumber);
  const versionNumber = input.versionNumber ?? (siblingVersions.length > 0 ? Math.max(...siblingVersions) + 1 : 1);
  const template: HierarchyTemplate = {
    id: nextId('HTPL', templateStore),
    warehouseId: input.warehouseId,
    templateCode: input.templateCode.trim().toUpperCase(),
    templateName: input.templateName.trim(),
    status: 'Draft',
    flexiblePathEnabled: input.flexiblePathEnabled,
    levels: [...input.levels].sort((left, right) => left.sequence - right.sequence),
    currentVersion: { versionNumber },
    versionHistory: [{ versionNumber, changeDescription: 'Initial version' }],
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  };

  templateStore = [template, ...templateStore];
  appendAudit({
    entityType: 'HierarchyTemplate',
    entityId: template.id,
    action: 'Create',
    performedBy: 'current-user',
    performedAt: timestamp,
    source: 'Manual',
    recordVersion: template.version,
  });
  return template;
}

export async function activateHierarchyTemplateMock(
  warehouseId: string,
  templateId: string,
): Promise<HierarchyTemplate> {
  const target = templateStore.find((template) => template.id === templateId && template.warehouseId === warehouseId);
  if (!target) {
    throw new Error(`Hierarchy template not found: ${templateId}`);
  }

  const issues = validateHierarchyTemplateForActivation(
    target,
    templateStore.filter((template) => template.warehouseId === warehouseId),
  );
  if (issues.some((issue) => issue.severity === 'error')) {
    throw Object.assign(new Error('Hierarchy template cannot be activated'), { issues });
  }

  const timestamp = now();
  templateStore = templateStore.map((template) => {
    if (template.warehouseId !== warehouseId) return template;
    if (template.id === templateId) {
      const nextVersionNumber = target.currentVersion.versionNumber + (target.status === 'Draft' ? 0 : 1);
      return {
        ...template,
        status: 'Active',
        currentVersion: {
          versionNumber: nextVersionNumber,
          activatedAt: timestamp,
          changeDescription: 'Activated template version',
        },
        versionHistory: [
          ...template.versionHistory,
          { versionNumber: nextVersionNumber, activatedAt: timestamp, changeDescription: 'Activated template version' },
        ],
        updatedAt: timestamp,
        version: template.version + 1,
      };
    }

    if (template.status === 'Active') {
      return {
        ...template,
        status: 'Superseded',
        currentVersion: {
          ...template.currentVersion,
          supersededAt: timestamp,
        },
        updatedAt: timestamp,
        version: template.version + 1,
      };
    }

    return template;
  });

  const warehouseSpecificLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
  const otherLocations = locationStore.filter((location) => location.warehouseId !== warehouseId);
  locationStore = [
    ...recomputeDerivedLocationState(warehouseId, warehouseSpecificLocations),
    ...otherLocations,
  ];

  const activeTemplate = templateStore.find((template) => template.id === templateId)!;
  appendAudit({
    entityType: 'HierarchyTemplate',
    entityId: templateId,
    action: 'Activate',
    performedBy: 'current-user',
    performedAt: timestamp,
    previousStatus: target.status,
    newStatus: 'Active',
    source: 'Manual',
    recordVersion: activeTemplate.version,
  });

  return activeTemplate;
}

export function __resetMockStores(): void {
  warehouseStore = [...SEED_WAREHOUSES];
  templateStore = [...SEED_HIERARCHY_TEMPLATES];
  locationStore = [...SEED_LOCATIONS];
  auditStore = [...SEED_AUDIT_EVENTS];
  bulkPreviewStore = new Map();
  importValidationStore = new Map();
  committedImportKeys = new Set();
}
