// ─── Warehouse Master — In-Memory Mock Adapter ───────────────────────────────
//
// Full implementation of WarehouseService against in-memory seed data.
// Includes concurrency (version check), lifecycle guards, derivation, and
// all bulk/import/audit stubs.

import type { WarehouseService } from './warehouseService';
import type {
  AuditQuery,
  BulkLocationInput,
  LocationIdentifierConflict,
  LocationIdentifierPreviewInput,
  LocationIdentifierPreviewResult,
  QuickHierarchyCommitRequest,
  QuickHierarchyCommitResult,
  QuickHierarchyPattern,
  QuickHierarchyPatternLevel,
  QuickHierarchyPreviewInput,
  QuickHierarchyPreviewResult,
  QuickHierarchyPreviewRow,
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
  ImportValidationRow,
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
import type { HierarchyTemplateStatus, WarehouseStatus } from '../types/warehouse.enums';

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
  deriveFullLocationIdentifier,
  deriveLocationCodingPolicy,
  generateNodeCode,
  resolveLocationTypeForLevel,
  resolveTemplateLevelForInput,
} from '../utils/hierarchyUtils';
import { validateWarehouseForActivation } from '../validation/activationValidation';
import { validateWarehouseInput } from '../validation/warehouseValidation';
import { validateLocationForSave } from '../validation/locationValidation';
import {
  validateHierarchyTemplateForActivation,
  validateHierarchyTemplateForSave,
  validateHierarchyTemplateLifecycleAction,
} from '../validation/hierarchyValidation';
import { warehouseMapper } from './warehouseMapper';

// ─── Module-level in-memory stores ────────────────────────────────────────────

let warehouseStore: Warehouse[] = [...SEED_WAREHOUSES];
let templateStore = [...SEED_HIERARCHY_TEMPLATES];
let locationStore: WarehouseLocation[] = [...SEED_LOCATIONS];
let auditStore: AuditEvent[] = [...SEED_AUDIT_EVENTS];
let bulkPreviewStore = new Map<string, { warehouseId: string; input: BulkLocationInput; paramsHash: string; rows: BulkPreviewRow[] }>();
let quickHierarchyPreviewStore = new Map<string, {
  warehouseId: string;
  input: QuickHierarchyPreviewInput;
  paramsHash: string;
  rows: QuickHierarchyPreviewRow[];
}>();
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

function hasTemplateDependencies(warehouseId: string): { hasNodes: boolean; hasStock: boolean; hasTransactions: boolean } {
  const warehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
  const hasNodes = warehouseLocations.length > 0;
  const hasStock = warehouseLocations.some((location) =>
    (location.capacity?.currentUnits ?? 0) > 0 ||
    (location.capacity?.currentWeightKg ?? 0) > 0 ||
    (location.capacity?.currentVolumeM3 ?? 0) > 0,
  );
  const hasTransactions = warehouseLocations.some((location) => location.updatedAt !== location.createdAt);
  return { hasNodes, hasStock, hasTransactions };
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

function listSiblingCodes(warehouseId: string, parentLocationId?: string): string[] {
  return locationStore
    .filter((location) => location.warehouseId === warehouseId && location.parentLocationId === parentLocationId)
    .map((location) => location.locationCode);
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

const QUICK_HIERARCHY_PATTERNS: QuickHierarchyPattern[] = [
  {
    key: 'simple-root-bin',
    label: 'Warehouse -> BIN',
    description: 'Fastest setup with direct BIN endpoints below warehouse root.',
    levels: [
      { levelCode: 'BIN', levelName: 'Bin', sequence: 1, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'BIN' },
    ],
  },
  {
    key: 'zone-bin',
    label: 'Zone -> BIN',
    description: 'Operational zoning with BIN endpoints under each zone.',
    levels: [
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Zone' },
      { levelCode: 'BIN', levelName: 'Bin', sequence: 2, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'BIN' },
    ],
  },
  {
    key: 'standard-distribution',
    label: 'Standard Distribution',
    description: 'ZONE -> AISLE -> RACK -> BIN standard WMS layout.',
    levels: [
      { levelCode: 'ZONE', levelName: 'Zone', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Zone' },
      { levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Aisle' },
      { levelCode: 'RACK', levelName: 'Rack', sequence: 3, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Rack' },
      { levelCode: 'BIN', levelName: 'Bin', sequence: 4, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'BIN' },
    ],
  },
  {
    key: 'floor-room-shelf',
    label: 'Floor -> Room -> Shelf',
    description: 'Multi-floor building model with room and shelf endpoints.',
    levels: [
      { levelCode: 'FLOOR', levelName: 'Floor', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'General' },
      { levelCode: 'ROOM', levelName: 'Room', sequence: 2, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'General' },
      { levelCode: 'SHELF', levelName: 'Shelf', sequence: 3, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'Shelf' },
    ],
  },
  {
    key: 'yard-lane-bay',
    label: 'Yard -> Lane -> Bay',
    description: 'Outdoor staging hierarchy for yard operations.',
    levels: [
      { levelCode: 'YARD', levelName: 'Yard', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Staging' },
      { levelCode: 'LANE', levelName: 'Lane', sequence: 2, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'Staging' },
      { levelCode: 'BAY', levelName: 'Bay', sequence: 3, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'Staging' },
    ],
  },
  {
    key: 'cold-room-chamber-position',
    label: 'Cold Room -> Chamber -> Position',
    description: 'Temperature-controlled model for cold-chain storage.',
    levels: [
      { levelCode: 'COLDROOM', levelName: 'Cold Room', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'General' },
      { levelCode: 'CHAMBER', levelName: 'Chamber', sequence: 2, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'General' },
      { levelCode: 'POSITION', levelName: 'Position', sequence: 3, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'BIN' },
    ],
  },
  {
    key: 'custom-pattern',
    label: 'Custom Pattern',
    description: 'Custom levels selected through quick wizard configuration.',
    levels: [
      { levelCode: 'L1', levelName: 'Level 1', sequence: 1, leafEligible: false, inventoryEndpointEligible: false, defaultLocationType: 'General' },
      { levelCode: 'L2', levelName: 'Level 2', sequence: 2, leafEligible: true, inventoryEndpointEligible: true, defaultLocationType: 'BIN' },
    ],
  },
];

function toParamsHash(input: QuickHierarchyPreviewInput): string {
  return btoa(JSON.stringify(input));
}

function createDefaultCoding(level: QuickHierarchyPatternLevel) {
  const compactCode = level.levelCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return {
    levelCode: level.levelCode,
    codePrefix: compactCode.slice(0, Math.min(compactCode.length, 3)) || 'LVL',
    startSequence: 1,
    sequenceLength: 2,
    separator: '',
    suffix: '',
  };
}

function buildNodeCode(prefix: string, sequence: number, length: number, separator?: string, suffix?: string): string {
  return [
    prefix.trim().toUpperCase(),
    String(sequence).padStart(length, '0'),
    (suffix ?? '').trim().toUpperCase(),
  ].filter(Boolean).join(separator ?? '');
}

function resolveQuickLocationType(levelCode: string, inventoryEndpointEligible: boolean): WarehouseLocation['profile']['locationType'] {
  const normalized = levelCode.toUpperCase();
  if (normalized.includes('ZONE')) return 'Zone';
  if (normalized.includes('AISLE')) return 'Aisle';
  if (normalized.includes('RACK')) return 'Rack';
  if (normalized.includes('SHELF')) return 'Shelf';
  if (normalized.includes('BIN') || normalized.includes('POSITION') || inventoryEndpointEligible) return 'BIN';
  if (normalized.includes('YARD') || normalized.includes('LANE') || normalized.includes('BAY')) return 'Staging';
  return 'General';
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
        ? [input.owningBranchCode ?? input.owningBranchCodes?.[0]].filter(
            (branchCode): branchCode is string => Boolean(branchCode?.trim()),
          )
        : (input.sharedBranchCodes ?? []).filter((branchCode) => branchCode.trim().length > 0);
    const branchOwnershipSource = input.branchOwnershipRows?.find(
      (row) =>
        row.branchCode.trim().toUpperCase() ===
        (selectedBranchCodes[0]?.trim().toUpperCase() ?? ''),
    ) ?? input.branchOwnershipRows?.[0];
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
        assignments: selectedBranchCodes.map((branchCode, assignmentIndex) => ({
          id: `ASSIGN-${String(assignmentIndex + 1).padStart(4, '0')}`,
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
              ownerType: input.ownershipScope === 'Branch' ? 'Branch' : 'LegalEntity',
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
          previousValue: String((existing as unknown as Record<string, unknown>)[field] ?? ''),
          newValue: String((updated as unknown as Record<string, unknown>)[field] ?? ''),
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
    const matchedTemplateLevel = resolveTemplateLevelForInput(
      activeTemplate,
      parentLocation,
      input,
    );
    if (activeTemplate && !matchedTemplateLevel) {
      throw new Error('Selected child level is not allowed under the selected parent by the active template.');
    }
    const level = matchedTemplateLevel?.sequence ?? computeLocationLevelFromParent(input.parentLocationId);
    const locationType = matchedTemplateLevel
      ? resolveLocationTypeForLevel(matchedTemplateLevel)
      : input.locationType;
    const policy = deriveLocationCodingPolicy(activeTemplate, matchedTemplateLevel);
    const normalizedCode = input.locationCode.trim().toUpperCase();
    const resolvedCode = normalizedCode || generateNodeCode({
      policy,
      existingSiblingCodes: listSiblingCodes(warehouseId, input.parentLocationId),
      autoGenerate: true,
    }).nodeCode;
    const fullCode = deriveFullLocationIdentifier({
      warehouseCode: warehouse.warehouseCode,
      activeTemplate,
      parentLocationId: input.parentLocationId,
      allLocations: warehouseLocations,
      nodeCode: resolvedCode,
    });
    const fullCodeExists = warehouseLocations.some(
      (location) => location.profile.fullCode.toUpperCase() === fullCode.toUpperCase(),
    );
    if (fullCodeExists) {
      throw new Error(`Full location identifier "${fullCode}" already exists in this warehouse.`);
    }

    const newLocation: WarehouseLocation = {
      id,
      warehouseId,
      locationCode: resolvedCode,
      locationName: input.locationName.trim(),
      parentLocationId: input.parentLocationId,
      status: 'Draft',
      profile: {
        locationType,
        templateLevelId: matchedTemplateLevel?.levelId,
        templateLevelCode: matchedTemplateLevel?.levelCode,
        locationRole: matchedTemplateLevel?.defaultLocationRole,
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

  async previewLocationIdentifier(warehouseId: string, input: LocationIdentifierPreviewInput): Promise<LocationIdentifierPreviewResult> {
    const warehouse = warehouseStore.find((item) => item.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);
    const activeTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
    const warehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
    const parent = input.parentLocationId
      ? warehouseLocations.find((location) => location.id === input.parentLocationId)
      : undefined;
    const matchedLevel = resolveTemplateLevelForInput(activeTemplate, parent ?? null, {
      templateLevelCode: input.templateLevelCode,
      templateLevelId: input.templateLevelId,
      locationType: 'BIN',
    });
    const policy = deriveLocationCodingPolicy(activeTemplate, matchedLevel);
    const generated = generateNodeCode({
      policy,
      existingSiblingCodes: listSiblingCodes(warehouseId, input.parentLocationId),
      manualCode: input.nodeCode,
      autoGenerate: input.autoGenerate ?? !input.manualOverride,
    });
    const fullLocationIdentifier = deriveFullLocationIdentifier({
      warehouseCode: warehouse.warehouseCode,
      activeTemplate,
      parentLocationId: input.parentLocationId,
      allLocations: warehouseLocations,
      nodeCode: generated.nodeCode,
    });
    const conflict = warehouseLocations.some(
      (location) => location.profile.fullCode.toUpperCase() === fullLocationIdentifier.toUpperCase(),
    );
    return {
      nodeCode: generated.nodeCode,
      fullLocationIdentifier,
      conflict,
      conflictReason: conflict ? `Full location identifier "${fullLocationIdentifier}" already exists.` : undefined,
    };
  },

  async previewBulkLocationIdentifiers(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    return this.bulkPreviewLocations(warehouseId, input);
  },

  async validateLocationIdentifier(warehouseId: string, input: LocationIdentifierPreviewInput): Promise<ValidationResult> {
    const preview = await this.previewLocationIdentifier(warehouseId, input);
    return {
      valid: !preview.conflict,
      issues: preview.conflict
        ? [{ field: 'locationCode', severity: 'error', category: 'DuplicateCode', message: preview.conflictReason ?? 'Identifier conflict detected.' }]
        : [],
    };
  },

  async listQuickHierarchyPatterns(): Promise<QuickHierarchyPattern[]> {
    return QUICK_HIERARCHY_PATTERNS;
  },

  async previewQuickHierarchy(warehouseId: string, input: QuickHierarchyPreviewInput): Promise<QuickHierarchyPreviewResult> {
    const warehouse = warehouseStore.find((item) => item.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);

    const issues: string[] = [];
    if (warehouse.inventoryControlMode !== 'Location-BIN-Level') {
      issues.push('Quick hierarchy wizard is available only for Location-BIN-Level warehouses.');
    }

    const pattern = QUICK_HIERARCHY_PATTERNS.find((item) => item.key === input.patternKey);
    if (!pattern) {
      throw new Error(`Unsupported quick hierarchy pattern: ${input.patternKey}`);
    }

    const activeTemplate = templateStore.find(
      (template) => template.warehouseId === warehouseId && template.status === 'Active',
    );
    if (input.templateAction === 'reuse-active' && !activeTemplate) {
      issues.push('No active hierarchy template found. Select Create from pattern or activate a template first.');
    }

    const levels = pattern.levels;
    const codingByLevel = new Map(
      input.codingByLevel.map((coding) => [coding.levelCode.toUpperCase(), coding]),
    );

    for (const level of levels) {
      const count = input.countsByLevel[level.levelCode] ?? 0;
      if (!Number.isFinite(count) || count < 1) {
        issues.push(`Count for level ${level.levelCode} must be at least 1.`);
      }
      if (count > 500) {
        issues.push(`Count for level ${level.levelCode} exceeds limit (500).`);
      }
      const coding = codingByLevel.get(level.levelCode.toUpperCase()) ?? createDefaultCoding(level);
      if (!coding.codePrefix.trim()) {
        issues.push(`Code prefix for level ${level.levelCode} is required.`);
      }
      if (coding.sequenceLength < 1 || coding.sequenceLength > 6) {
        issues.push(`Sequence length for level ${level.levelCode} must be between 1 and 6.`);
      }
    }

    const warehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
    const existingFullCodes = new Set(warehouseLocations.map((location) => location.profile.fullCode.toUpperCase()));
    const pathSeparator = activeTemplate?.defaultPathSeparator ?? '-';

    type ParentNode = {
      tempNodeId: string;
      nodeCode: string;
      fullLocationIdentifier: string;
    };
    let parentNodes: ParentNode[] = [{
      tempNodeId: 'ROOT',
      nodeCode: warehouse.warehouseCode,
      fullLocationIdentifier: warehouse.warehouseCode,
    }];
    const rows: QuickHierarchyPreviewRow[] = [];
    const seenFullCodes = new Set<string>();

    for (const level of levels) {
      const count = input.countsByLevel[level.levelCode] ?? 1;
      const coding = codingByLevel.get(level.levelCode.toUpperCase()) ?? createDefaultCoding(level);
      const nextParents: ParentNode[] = [];

      for (const parent of parentNodes) {
        const siblingCodes = new Set<string>();
        for (let index = 0; index < count; index++) {
          const sequence = coding.startSequence + index;
          const nodeCode = buildNodeCode(
            coding.codePrefix,
            sequence,
            coding.sequenceLength,
            coding.separator,
            coding.suffix,
          );
          const fullLocationIdentifier = `${parent.fullLocationIdentifier}${pathSeparator}${nodeCode}`.toUpperCase();
          let conflictReason: string | undefined;
          if (siblingCodes.has(nodeCode.toUpperCase())) {
            conflictReason = `Duplicate node code ${nodeCode} generated under parent ${parent.nodeCode}.`;
          } else if (seenFullCodes.has(fullLocationIdentifier)) {
            conflictReason = `Duplicate full location identifier ${fullLocationIdentifier} generated in preview.`;
          } else if (existingFullCodes.has(fullLocationIdentifier)) {
            conflictReason = `Full location identifier ${fullLocationIdentifier} already exists.`;
          }

          siblingCodes.add(nodeCode.toUpperCase());
          seenFullCodes.add(fullLocationIdentifier);
          const tempNodeId = `TMP-${level.levelCode}-${parent.tempNodeId}-${index + 1}`;
          rows.push({
            tempNodeId,
            parentTempNodeId: parent.tempNodeId === 'ROOT' ? undefined : parent.tempNodeId,
            level: level.sequence,
            levelCode: level.levelCode,
            levelName: level.levelName,
            parentCode: parent.tempNodeId === 'ROOT' ? warehouse.warehouseCode : parent.nodeCode,
            nodeCode,
            nodeName: `${level.levelName} ${String(sequence).padStart(coding.sequenceLength, '0')}`,
            fullLocationIdentifier,
            leafEndpointPreview: level.leafEligible,
            inventoryEndpointEligible: level.inventoryEndpointEligible,
            capacityApplicable: false,
            itemEligibilityApplicable: false,
            responsibilityApplicable: false,
            status: 'Draft',
            validationStatus: conflictReason ? 'Conflict' : 'Valid',
            conflictReason,
          });
          nextParents.push({ tempNodeId, nodeCode, fullLocationIdentifier });
        }
      }

      parentNodes = nextParents;
    }

    const previewToken = `QPREV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const paramsHash = toParamsHash(input);
    quickHierarchyPreviewStore.set(previewToken, {
      warehouseId,
      input,
      paramsHash,
      rows,
    });

    const conflictCount = rows.filter((row) => row.validationStatus === 'Conflict').length;
    return {
      previewToken,
      warehouseId,
      patternKey: input.patternKey,
      rows,
      totalGeneratedNodes: rows.length,
      conflictCount,
      validCount: rows.length - conflictCount,
      generatedAt: now(),
      paramsHash,
      warnings: issues,
    };
  },

  async validateQuickHierarchy(warehouseId: string, input: QuickHierarchyPreviewInput): Promise<ValidationResult> {
    const preview = await this.previewQuickHierarchy(warehouseId, input);
    const issues = [
      ...preview.warnings.map((message) => ({
        field: 'quickHierarchy',
        severity: 'error' as const,
        category: 'SystemConstraint' as const,
        message,
      })),
      ...preview.rows
        .filter((row) => row.validationStatus === 'Conflict')
        .slice(0, 25)
        .map((row) => ({
          field: row.levelCode,
          severity: 'error' as const,
          category: 'DuplicateCode' as const,
          message: row.conflictReason ?? `Conflict detected for ${row.fullLocationIdentifier}.`,
        })),
    ];

    return {
      valid: issues.length === 0,
      issues,
    };
  },

  async commitQuickHierarchy(warehouseId: string, request: QuickHierarchyCommitRequest): Promise<QuickHierarchyCommitResult> {
    const warehouse = warehouseStore.find((item) => item.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);

    const preview = quickHierarchyPreviewStore.get(request.previewToken);
    if (!preview || preview.warehouseId !== warehouseId) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdFullIdentifiers: [],
        errors: [{ code: 'PREVIEW', name: 'Preview', reason: 'Quick hierarchy preview not found or expired.' }],
        correlationId: `COR-QH-${Date.now()}`,
      };
    }

    if (preview.paramsHash !== request.paramsHash) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdFullIdentifiers: [],
        errors: [{ code: 'STALE', name: 'Preview', reason: 'Quick hierarchy preview is stale. Generate a new preview.' }],
        correlationId: `COR-QH-${Date.now()}`,
      };
    }

    const conflictRows = preview.rows.filter((row) => row.validationStatus === 'Conflict');
    if (preview.input.templateAction === 'reuse-active') {
      const activeTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
      if (!activeTemplate) {
        conflictRows.push({
          tempNodeId: 'TEMPLATE',
          level: 0,
          levelCode: 'TEMPLATE',
          levelName: 'Template',
          nodeCode: 'TEMPLATE',
          nodeName: 'Template',
          fullLocationIdentifier: warehouse.warehouseCode,
          leafEndpointPreview: false,
          inventoryEndpointEligible: false,
          capacityApplicable: false,
          itemEligibilityApplicable: false,
          responsibilityApplicable: false,
          status: 'Draft',
          validationStatus: 'Conflict',
          conflictReason: 'No active hierarchy template available for reuse.',
        });
      }
    }
    if (conflictRows.length > 0) {
      return {
        success: false,
        createdCount: 0,
        failedCount: conflictRows.length,
        createdFullIdentifiers: [],
        errors: conflictRows.map((row) => ({
          code: row.nodeCode,
          name: row.nodeName,
          reason: row.conflictReason ?? 'Conflict detected.',
        })),
        correlationId: `COR-QH-${Date.now()}`,
      };
    }

    const timestamp = now();
    if (preview.input.templateAction === 'create-from-pattern') {
      const existingTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
      if (!existingTemplate || preview.input.activateTemplateOnCommit) {
        const pattern = QUICK_HIERARCHY_PATTERNS.find((item) => item.key === preview.input.patternKey)!;
        const createdTemplate = await createHierarchyTemplateMock({
          warehouseId,
          templateCode: `QH-${pattern.key.slice(0, 10).toUpperCase()}`,
          templateName: `Quick ${pattern.label}`,
          effectiveFrom: timestamp.slice(0, 10),
          defaultPathSeparator: '-',
          includeWarehouseCodeInIdentifier: true,
          defaultSequenceLength: 2,
          levels: pattern.levels.map((level, index) => ({
            levelId: `QH-${level.levelCode}-${index + 1}`,
            levelCode: level.levelCode,
            levelName: level.levelName,
            sequence: index + 1,
            mandatory: true,
            allowSkipLevel: false,
            allowedParentLevels: index === 0 ? ['WAREHOUSE'] : [pattern.levels[index - 1].levelCode],
            allowedChildLevels: index < pattern.levels.length - 1 ? [pattern.levels[index + 1].levelCode] : [],
            autoGenerateCode: true,
            codePrefix: level.levelCode.slice(0, 2).toUpperCase(),
            startSequence: 1,
            sequenceLength: 2,
            separator: '-',
            leafEligible: level.leafEligible,
            inventoryEndpointEligible: level.inventoryEndpointEligible,
            capacityApplicable: level.inventoryEndpointEligible,
            itemEligibilityApplicable: level.inventoryEndpointEligible,
            responsibilityApplicable: true,
            barcodeApplicable: false,
            qrApplicable: false,
            transactionPurposes: ['Storage'],
            capacityEnforcementMode: 'None',
            capacityRollupMode: 'None',
            allowCapabilityOverride: false,
            defaultLocationRole: level.inventoryEndpointEligible ? 'InventoryEndpoint' : 'Structural',
            defaultLocationType: level.defaultLocationType ?? resolveQuickLocationType(level.levelCode, level.inventoryEndpointEligible),
          })),
          flexiblePathEnabled: false,
        });
        await activateHierarchyTemplateMock(warehouseId, createdTemplate.id);
      }
    }

    const existingWarehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
    const existingFullCodes = new Set(existingWarehouseLocations.map((location) => location.profile.fullCode.toUpperCase()));
    const newLocations: WarehouseLocation[] = [];
    const createdFullIdentifiers: string[] = [];
    const idMap = new Map<string, string>();

    for (const row of preview.rows.sort((left, right) => left.level - right.level)) {
      const parentLocationId = row.parentTempNodeId ? idMap.get(row.parentTempNodeId) : undefined;
      const fullCode = deriveFullLocationIdentifier({
        warehouseCode: warehouse.warehouseCode,
        activeTemplate: templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active'),
        parentLocationId,
        allLocations: [...existingWarehouseLocations, ...newLocations],
        nodeCode: row.nodeCode,
      }).toUpperCase();
      if (existingFullCodes.has(fullCode)) {
        return {
          success: false,
          createdCount: 0,
          failedCount: 1,
          createdFullIdentifiers: [],
          errors: [{ code: row.nodeCode, name: row.nodeName, reason: `Full location path ${fullCode} already exists.` }],
          correlationId: `COR-QH-${Date.now()}`,
        };
      }

      const locationId = nextId('LOC', [...locationStore, ...newLocations]);
      idMap.set(row.tempNodeId, locationId);
      existingFullCodes.add(fullCode);
      createdFullIdentifiers.push(fullCode);
      newLocations.push({
        id: locationId,
        warehouseId,
        locationCode: row.nodeCode,
        locationName: row.nodeName,
        parentLocationId,
        status: 'Draft',
        profile: {
          locationType: resolveQuickLocationType(row.levelCode, row.inventoryEndpointEligible),
          templateLevelCode: row.levelCode,
          locationRole: row.inventoryEndpointEligible ? 'InventoryEndpoint' : 'Structural',
          level: row.level,
          fullCode,
          isLeafEndpoint: row.leafEndpointPreview,
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
      });
    }

    const recomputedWarehouseLocations = recomputeDerivedLocationState(
      warehouseId,
      [...existingWarehouseLocations, ...newLocations],
    );
    locationStore = [
      ...recomputedWarehouseLocations,
      ...locationStore.filter((location) => location.warehouseId !== warehouseId),
    ];

    const correlationId = `COR-QH-${Date.now()}`;
    appendAudit({
      entityType: 'Warehouse',
      entityId: warehouseId,
      action: 'QuickHierarchyCommit',
      performedBy: 'current-user',
      performedAt: timestamp,
      source: 'Manual',
      correlationId,
      snapshot: {
        patternKey: preview.input.patternKey,
        createdCount: newLocations.length,
      },
    });
    quickHierarchyPreviewStore.delete(request.previewToken);

    return {
      success: true,
      createdCount: newLocations.length,
      failedCount: 0,
      firstCreatedLocationId: newLocations[0]?.id,
      createdFullIdentifiers,
      errors: [],
      correlationId,
    };
  },

  async listLocationIdentifierConflicts(warehouseId: string): Promise<LocationIdentifierConflict[]> {
    const scoped = locationStore.filter((location) => location.warehouseId === warehouseId);
    const grouped = scoped.reduce<Map<string, WarehouseLocation[]>>((acc, location) => {
      const key = location.profile.fullCode.toUpperCase();
      const current = acc.get(key) ?? [];
      current.push(location);
      acc.set(key, current);
      return acc;
    }, new Map());

    const conflicts: LocationIdentifierConflict[] = [];
    grouped.forEach((locations, fullCode) => {
      if (locations.length < 2) return;
      locations.forEach((location) => {
        conflicts.push({
          locationId: location.id,
          locationCode: location.locationCode,
          fullLocationIdentifier: fullCode,
          reason: 'Duplicate full location identifier detected.',
        });
      });
    });
    return conflicts;
  },

  async bulkPreviewLocations(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    const warehouse = warehouseStore.find((w) => w.id === warehouseId);
    if (!warehouse) throw new Error(`Warehouse not found: ${warehouseId}`);
    const activeTemplate = templateStore.find((template) => template.warehouseId === warehouseId && template.status === 'Active');
    const warehouseLocations = locationStore.filter((location) => location.warehouseId === warehouseId);
    const parentLocation = input.parentLocationId
      ? warehouseLocations.find((location) => location.id === input.parentLocationId) ?? null
      : null;
    const matchedLevel = resolveTemplateLevelForInput(activeTemplate, parentLocation, input);
    if (activeTemplate && !matchedLevel) {
      throw new Error('Bulk create child level is not allowed under the selected parent by the active template.');
    }

    const existingFullCodes = new Set(
      warehouseLocations.map((location) => location.profile.fullCode.toUpperCase()),
    );
    const existingCodes = new Set(
      warehouseLocations.map((location) => location.locationCode.toUpperCase()),
    );

    const paramsHash = btoa(JSON.stringify({ ...input, warehouseId }));
    const rows: BulkPreviewRow[] = [];
    const seenCodes = new Set<string>();
    const seenFullCodes = new Set<string>();
    const level = matchedLevel?.sequence ?? input.level ?? computeLocationLevelFromParent(input.parentLocationId);

    for (let i = 0; i < input.count; i++) {
      const seq = input.startSequence + i;
      const code = [
        input.codePrefix.trim().toUpperCase(),
        String(seq).padStart(input.sequenceLength, '0'),
        (input.suffix ?? '').trim().toUpperCase(),
      ].filter(Boolean).join(input.separator ?? '');
      const name = `${input.namePrefix}${input.separator ?? ''}${String(seq).padStart(input.sequenceLength, '0')}${input.suffix ?? ''}`.trim();
      const fullCode = deriveFullLocationIdentifier({
        warehouseCode: warehouse.warehouseCode,
        activeTemplate,
        parentLocationId: input.parentLocationId,
        allLocations: warehouseLocations,
        nodeCode: code,
      }).toUpperCase();
      let conflict = false;
      let conflictReason: string | undefined;

      if (seenCodes.has(code)) {
        conflict = true;
        conflictReason = `Duplicate code "${code}" generated within this batch.`;
      } else if (existingCodes.has(code)) {
        conflict = true;
        conflictReason = `Location code "${code}" already exists in this warehouse.`;
      } else if (seenFullCodes.has(fullCode)) {
        conflict = true;
        conflictReason = `Duplicate full location identifier "${fullCode}" generated within this batch.`;
      } else if (existingFullCodes.has(fullCode)) {
        conflict = true;
        conflictReason = `Full location path "${fullCode}" already exists in this warehouse.`;
      }

      seenCodes.add(code);
      seenFullCodes.add(fullCode);
      rows.push({
        sequenceNumber: seq,
        levelCode: matchedLevel?.levelCode,
        parentCode: parentLocation?.locationCode,
        parentFullLocationIdentifier: parentLocation?.profile.fullCode,
        proposedCode: code,
        proposedName: name,
        fullLocationIdentifier: fullCode,
        leafEndpointPreview: matchedLevel?.leafEligible,
        inventoryEndpointEligible: matchedLevel?.inventoryEndpointEligible,
        inventoryAllowedPreview: false,
        validationStatus: conflict ? 'Conflict' : 'Valid',
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
        templateLevelId: matchedLevel?.levelId ?? input.templateLevelId,
        templateLevelCode: matchedLevel?.levelCode ?? input.templateLevelCode,
        locationType: matchedLevel ? resolveLocationTypeForLevel(matchedLevel) : input.locationType,
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
    const templateLevelCode = preview.input.templateLevelCode;
    const templateLevelId = preview.input.templateLevelId;
    const activeTemplate = templateStore.find(
      (template) => template.warehouseId === warehouseId && template.status === 'Active',
    );
    const matchedLevel = resolveTemplateLevelForInput(
      activeTemplate,
      parentLocationId
        ? locationStore.find((location) => location.id === parentLocationId) ?? null
        : null,
      preview.input,
    );
    const timestamp = now();
    const existingFullCodes = new Set(
      locationStore.filter((location) => location.warehouseId === warehouseId).map((location) => location.profile.fullCode.toUpperCase()),
    );
    const existingCodes = new Set(
      locationStore.filter((location) => location.warehouseId === warehouseId).map((location) => location.locationCode.toUpperCase()),
    );
    const newLocations: WarehouseLocation[] = [];

    for (const row of preview.rows) {
      if (existingCodes.has(row.proposedCode.toUpperCase())) {
        return {
          success: false,
          createdCount: 0,
          failedCount: 1,
          errors: [{ code: row.proposedCode, name: row.proposedName, reason: `Location code "${row.proposedCode}" already exists.` }],
          correlationId: `COR-BULK-${Date.now()}`,
        };
      }
      const fullCode = deriveFullLocationIdentifier({
        warehouseCode: warehouse.warehouseCode,
        activeTemplate,
        parentLocationId,
        allLocations: [...locationStore, ...newLocations],
        nodeCode: row.proposedCode,
      }).toUpperCase();
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
          templateLevelId: templateLevelId ?? matchedLevel?.levelId,
          templateLevelCode: templateLevelCode ?? matchedLevel?.levelCode,
          locationRole: matchedLevel?.defaultLocationRole,
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
      existingCodes.add(row.proposedCode.toUpperCase());
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
    templateSource: input.templateSource ?? 'UserDefined',
    templateScope: input.templateScope ?? 'Warehouse',
    defaultPathSeparator: input.defaultPathSeparator ?? '-',
    includeWarehouseCodeInIdentifier: input.includeWarehouseCodeInIdentifier ?? true,
    defaultSequenceLength: input.defaultSequenceLength ?? 3,
    manualNodeCodeAllowed: input.manualNodeCodeAllowed ?? true,
    autoGenerateNodeCodeAllowed: input.autoGenerateNodeCodeAllowed ?? true,
    codeLockedAfterActivation: input.codeLockedAfterActivation ?? true,
    dependencyMarker: input.dependencyMarker ?? hasTemplateDependencies(input.warehouseId),
    status: 'Draft',
    flexiblePathEnabled: input.flexiblePathEnabled,
    levels: [...input.levels].sort((left, right) => left.sequence - right.sequence),
    currentVersion: { versionNumber },
    versionHistory: [{ versionNumber, changeDescription: input.changeDescription ?? 'Initial version' }],
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
        codeLockedAfterActivation: template.codeLockedAfterActivation ?? true,
        dependencyMarker: hasTemplateDependencies(warehouseId),
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

export async function updateHierarchyTemplateStatusMock(
  warehouseId: string,
  templateId: string,
  targetStatus: Extract<HierarchyTemplateStatus, 'Active' | 'Blocked' | 'Inactive'>,
  reason?: string,
): Promise<HierarchyTemplate> {
  const target = templateStore.find((template) => template.id === templateId && template.warehouseId === warehouseId);
  if (!target) {
    throw new Error(`Hierarchy template not found: ${templateId}`);
  }

  if (targetStatus === 'Active') {
    return activateHierarchyTemplateMock(warehouseId, templateId);
  }

  const dependencies = hasTemplateDependencies(warehouseId);
  const lifecycleError = validateHierarchyTemplateLifecycleAction(
    target.status,
    targetStatus,
    dependencies.hasNodes || dependencies.hasStock || dependencies.hasTransactions,
  );
  if (lifecycleError) {
    throw new Error(lifecycleError);
  }

  if (targetStatus === 'Blocked' && !reason?.trim()) {
    throw new Error('Reason is required to set template status to Blocked.');
  }

  const timestamp = now();
  templateStore = templateStore.map((template) => {
    if (template.id !== templateId) return template;
    return {
      ...template,
      status: targetStatus,
      dependencyMarker: dependencies,
      updatedAt: timestamp,
      version: template.version + 1,
    };
  });

  const updated = templateStore.find((template) => template.id === templateId)!;
  appendAudit({
    entityType: 'HierarchyTemplate',
    entityId: templateId,
    action: `SetStatus:${targetStatus}`,
    performedBy: 'current-user',
    performedAt: timestamp,
    previousStatus: target.status,
    newStatus: targetStatus,
    reasonDescription: reason?.trim(),
    source: 'Manual',
    recordVersion: updated.version,
  });
  return updated;
}

export function __resetMockStores(): void {
  warehouseStore = [...SEED_WAREHOUSES];
  templateStore = [...SEED_HIERARCHY_TEMPLATES];
  locationStore = [...SEED_LOCATIONS];
  auditStore = [...SEED_AUDIT_EVENTS];
  bulkPreviewStore = new Map();
  quickHierarchyPreviewStore = new Map();
  importValidationStore = new Map();
  committedImportKeys = new Set();
}
