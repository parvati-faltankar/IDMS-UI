// ─── Warehouse Master — API Adapter (real backend stub) ─────────────────────
//
// When a real backend is available, replace warehouseMockAdapter with this.
// Uses the same WarehouseService interface. All fetch calls conform to the
// backend contract gaps listed in Phase 0, Deliverable 8.

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
  QuickHierarchyPreviewInput,
  QuickHierarchyPreviewResult,
  BulkPreview,
  BulkResult,
  CommitBulkRequest,
  ControlledActionRequest,
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

const API_BASE = '/api/warehouse-master';

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: response.statusText };
    }
    throw Object.assign(new Error(`API error ${response.status}`), { status: response.status, body: errorBody });
  }

  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ─── API adapter ──────────────────────────────────────────────────────────────

export const warehouseApiAdapter: WarehouseService = {

  async listWarehouses(query: WarehouseListQuery): Promise<PagedResult<WarehouseSummary>> {
    return apiFetch(`${API_BASE}${buildQuery(query as Record<string, unknown>)}`);
  },

  async getWarehouse(id: string): Promise<WarehouseDetails> {
    return apiFetch(`${API_BASE}/${id}`);
  },

  async createWarehouse(input: CreateWarehouseInput): Promise<WarehouseDetails> {
    return apiFetch(API_BASE, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateWarehouse(id: string, version: number, input: UpdateWarehouseInput): Promise<WarehouseDetails> {
    return apiFetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'If-Match': String(version) },
      body: JSON.stringify(input),
    });
  },

  async validateWarehouse(input: WarehouseValidationInput): Promise<ValidationResult> {
    return apiFetch(`${API_BASE}/validate`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async activateWarehouse(id: string, request: ControlledActionRequest): Promise<ActionResult> {
    return apiFetch(`${API_BASE}/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async changeWarehouseStatus(id: string, request: StatusChangeRequest): Promise<ActionResult> {
    const actionPath = request.targetStatus === 'Blocked' ? 'block'
      : request.targetStatus === 'Active' ? 'unblock'
      : 'inactivate';
    return apiFetch(`${API_BASE}/${id}/${actionPath}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async listHierarchy(id: string): Promise<HierarchyNode[]> {
    return apiFetch(`${API_BASE}/${id}/hierarchy`);
  },

  async createLocation(warehouseId: string, input: CreateLocationInput): Promise<WarehouseLocation> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async previewLocationIdentifier(warehouseId: string, input: LocationIdentifierPreviewInput): Promise<LocationIdentifierPreviewResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/identifier-preview`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async listQuickHierarchyPatterns(warehouseId: string): Promise<QuickHierarchyPattern[]> {
    return apiFetch(`${API_BASE}/${warehouseId}/hierarchy/quick/patterns`);
  },

  async previewQuickHierarchy(warehouseId: string, input: QuickHierarchyPreviewInput): Promise<QuickHierarchyPreviewResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/hierarchy/quick/preview`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async validateQuickHierarchy(warehouseId: string, input: QuickHierarchyPreviewInput): Promise<ValidationResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/hierarchy/quick/validate`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async commitQuickHierarchy(warehouseId: string, request: QuickHierarchyCommitRequest): Promise<QuickHierarchyCommitResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/hierarchy/quick/commit`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async previewBulkLocationIdentifiers(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    return this.bulkPreviewLocations(warehouseId, input);
  },

  async validateLocationIdentifier(warehouseId: string, input: LocationIdentifierPreviewInput): Promise<ValidationResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/identifier-validate`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async listLocationIdentifierConflicts(warehouseId: string): Promise<LocationIdentifierConflict[]> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/identifier-conflicts`);
  },

  async getLocationCapacity(warehouseId: string, locationId: string): Promise<WarehouseLocation['capacity'] | undefined> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/${locationId}/capacity`);
  },

  async updateLocationCapacity(warehouseId: string, input: UpdateLocationCapacityInput): Promise<WarehouseLocation> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/${input.locationId}/capacity`, {
      method: 'PUT',
      headers: { 'If-Match': String(input.version) },
      body: JSON.stringify(input),
    });
  },

  async validateLocationCapacity(warehouseId: string, input: ValidateLocationCapacityInput): Promise<ValidationResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/${input.locationId}/capacity/validate`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async previewCapacityImpact(warehouseId: string, input: PreviewCapacityImpactInput): Promise<ProjectedPostingCapacityResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/capacity/preview-impact`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async listCapacityIssues(query: ListCapacityIssuesQuery): Promise<ValidationResult> {
    return apiFetch(`${API_BASE}/${query.warehouseId}/capacity/issues${buildQuery({ ...query })}`);
  },

  async bulkPreviewLocations(warehouseId: string, input: BulkLocationInput): Promise<BulkPreview> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/bulk-preview`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async commitBulkLocations(warehouseId: string, request: CommitBulkRequest): Promise<BulkResult> {
    return apiFetch(`${API_BASE}/${warehouseId}/locations/bulk-commit`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async validateImport(request: ImportValidationRequest): Promise<ImportValidationResult> {
    return apiFetch(`${API_BASE}/import/validate`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async commitImport(request: ImportCommitRequest): Promise<ImportResult> {
    return apiFetch(`${API_BASE}/import/commit`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getAudit(id: string, query: AuditQuery): Promise<PagedResult<AuditEvent>> {
    return apiFetch(`${API_BASE}/${id}/audit${buildQuery(query as Record<string, unknown>)}`);
  },
};
