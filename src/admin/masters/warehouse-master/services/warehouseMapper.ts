// ─── Warehouse Master — Mapper ────────────────────────────────────────────────
//
// Transforms Warehouse domain objects into projected shapes used by the UI.

import type { Warehouse, WarehouseSummary, HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';
import type { SetupHealthTone } from '../types/warehouse.enums';
import { deriveBinManaged, deriveSetupHealth } from '../utils/warehouseDerivations';

export const warehouseMapper = {

  toSummary(
    warehouse: Warehouse,
    allLocations: WarehouseLocation[],
    allTemplates: HierarchyTemplate[],
  ): WarehouseSummary {
    const locations = allLocations.filter((l) => l.warehouseId === warehouse.id);
    const templates = allTemplates.filter((t) => t.warehouseId === warehouse.id);
    const setupHealth = deriveSetupHealth(warehouse, locations, templates);
    const activeBinCount = locations.filter(
      (l) => l.status === 'Active' && l.profile.inventoryAllowed,
    ).length;
    const uniqueBranches = new Set(
      warehouse.assignmentProfile.assignments
        .filter((a) => a.assignmentStatus === 'Active')
        .map((a) => a.branchCode),
    );

    return {
      id: warehouse.id,
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      ownershipScope: warehouse.ownershipScope,
      warehouseType: warehouse.warehouseType,
      inventoryControlMode: warehouse.inventoryControlMode,
      binManaged: deriveBinManaged(warehouse.inventoryControlMode),
      wmsEnabled: warehouse.wmsEnabled,
      status: warehouse.status,
      branchCount: uniqueBranches.size,
      locationCount: locations.length,
      activeBinCount,
      setupHealth: setupHealth.overallTone,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
      owningCode: warehouse.ownershipScope === 'Organization'
        ? warehouse.owningOrgCode
        : warehouse.owningBranchCode,
    };
  },

  /** Computes setup health tone without building the full SetupHealth object. */
  quickSetupHealthTone(
    warehouse: Warehouse,
    locations: WarehouseLocation[],
    templates: HierarchyTemplate[],
  ): SetupHealthTone {
    return deriveSetupHealth(warehouse, locations, templates).overallTone;
  },
};
