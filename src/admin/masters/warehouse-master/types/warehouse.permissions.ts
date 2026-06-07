// ─── Warehouse Master — Permission Keys and Types ────────────────────────────

// ─── Permission key catalogue ─────────────────────────────────────────────────

export type WarehousePermissionKey =
  // Warehouse-level
  | 'warehouse.create'
  | 'warehouse.view'
  | 'warehouse.edit'
  | 'warehouse.activate'
  | 'warehouse.block'
  | 'warehouse.unblock'
  | 'warehouse.inactivate'
  | 'warehouse.delete'
  | 'warehouse.assignBranch'
  | 'warehouse.revokeBranch'
  | 'warehouse.changeInventoryMode'
  | 'warehouse.export'
  | 'warehouse.import'
  // Hierarchy
  | 'hierarchy.create'
  | 'hierarchy.edit'
  | 'hierarchy.activate'
  | 'hierarchy.inactivate'
  // Location / BIN
  | 'location.create'
  | 'location.view'
  | 'location.edit'
  | 'location.activate'
  | 'location.block'
  | 'location.unblock'
  | 'location.inactivate'
  | 'location.delete'
  | 'location.editCapacity'
  | 'location.editEligibility'
  | 'location.bulkCreate'
  // Policies
  | 'putawayOverride.grant'
  | 'pickingOverride.grant'
  | 'cycleCount.configure'
  | 'stockStatus.govern'
  // Audit
  | 'audit.view';

// ─── Role to permission mapping ───────────────────────────────────────────────

/** Roles defined in the FRD. Frontend mock only — replaced by RBAC at runtime. */
export type WarehouseRole =
  | 'OrgAdmin'
  | 'BranchAdmin'
  | 'WarehouseAdmin'
  | 'InventoryManager'
  | 'OperationsUser'
  | 'Auditor'
  | 'ReadOnly';

export type WarehousePermissions = Readonly<Record<WarehousePermissionKey, boolean>>;

/** Returns all permissions as true — used in mock mode. */
export function mockAllPermissions(): WarehousePermissions {
  const allKeys: WarehousePermissionKey[] = [
    'warehouse.create',
    'warehouse.view',
    'warehouse.edit',
    'warehouse.activate',
    'warehouse.block',
    'warehouse.unblock',
    'warehouse.inactivate',
    'warehouse.delete',
    'warehouse.assignBranch',
    'warehouse.revokeBranch',
    'warehouse.changeInventoryMode',
    'warehouse.export',
    'warehouse.import',
    'hierarchy.create',
    'hierarchy.edit',
    'hierarchy.activate',
    'hierarchy.inactivate',
    'location.create',
    'location.view',
    'location.edit',
    'location.activate',
    'location.block',
    'location.unblock',
    'location.inactivate',
    'location.delete',
    'location.editCapacity',
    'location.editEligibility',
    'location.bulkCreate',
    'putawayOverride.grant',
    'pickingOverride.grant',
    'cycleCount.configure',
    'stockStatus.govern',
    'audit.view',
  ];
  return Object.fromEntries(allKeys.map((k) => [k, true])) as WarehousePermissions;
}

/** Minimal permissions for a read-only viewer. */
export function readOnlyPermissions(): WarehousePermissions {
  return {
    'warehouse.create': false,
    'warehouse.view': true,
    'warehouse.edit': false,
    'warehouse.activate': false,
    'warehouse.block': false,
    'warehouse.unblock': false,
    'warehouse.inactivate': false,
    'warehouse.delete': false,
    'warehouse.assignBranch': false,
    'warehouse.revokeBranch': false,
    'warehouse.changeInventoryMode': false,
    'warehouse.export': true,
    'warehouse.import': false,
    'hierarchy.create': false,
    'hierarchy.edit': false,
    'hierarchy.activate': false,
    'hierarchy.inactivate': false,
    'location.create': false,
    'location.view': true,
    'location.edit': false,
    'location.activate': false,
    'location.block': false,
    'location.unblock': false,
    'location.inactivate': false,
    'location.delete': false,
    'location.editCapacity': false,
    'location.editEligibility': false,
    'location.bulkCreate': false,
    'putawayOverride.grant': false,
    'pickingOverride.grant': false,
    'cycleCount.configure': false,
    'stockStatus.govern': false,
    'audit.view': true,
  };
}

/** Permissions by role. */
export const ROLE_PERMISSIONS: Record<WarehouseRole, Partial<WarehousePermissions>> = {
  OrgAdmin: mockAllPermissions(),
  BranchAdmin: {
    ...readOnlyPermissions(),
    'warehouse.create': true,
    'warehouse.edit': true,
    'warehouse.activate': true,
    'warehouse.block': true,
    'warehouse.unblock': true,
    'warehouse.assignBranch': true,
    'warehouse.export': true,
    'warehouse.import': true,
    'hierarchy.create': true,
    'hierarchy.edit': true,
    'hierarchy.activate': true,
    'location.create': true,
    'location.edit': true,
    'location.activate': true,
    'location.block': true,
    'location.unblock': true,
    'location.bulkCreate': true,
    'location.editCapacity': true,
    'location.editEligibility': true,
  },
  WarehouseAdmin: {
    ...readOnlyPermissions(),
    'warehouse.edit': true,
    'warehouse.block': true,
    'hierarchy.create': true,
    'hierarchy.edit': true,
    'hierarchy.activate': true,
    'location.create': true,
    'location.edit': true,
    'location.activate': true,
    'location.block': true,
    'location.unblock': true,
    'location.bulkCreate': true,
    'location.editCapacity': true,
    'location.editEligibility': true,
  },
  InventoryManager: {
    ...readOnlyPermissions(),
    'warehouse.edit': true,
    'location.create': true,
    'location.edit': true,
    'location.editCapacity': true,
    'location.editEligibility': true,
    'putawayOverride.grant': true,
    'pickingOverride.grant': true,
    'cycleCount.configure': true,
  },
  OperationsUser: {
    ...readOnlyPermissions(),
    'location.view': true,
  },
  Auditor: {
    ...readOnlyPermissions(),
    'audit.view': true,
    'warehouse.export': true,
  },
  ReadOnly: readOnlyPermissions(),
};
