// ─── Warehouse Master — Route Utilities ──────────────────────────────────────

export const WAREHOUSE_MASTER_BASE = '/admin/master/warehouse-master';

export const WAREHOUSE_ROUTES = {
  list:          WAREHOUSE_MASTER_BASE,
  create:        `${WAREHOUSE_MASTER_BASE}/new`,
  detail:        (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}`,
  setup:         (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/setup`,
  hierarchy:     (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/hierarchy`,
  locations:     (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/locations`,
  locationCreate:(id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/locations/new`,
  locationDetail:(id: string, locationId: string) => `${WAREHOUSE_MASTER_BASE}/${id}/locations/${locationId}`,
  importPage:     (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/import`,
  audit:          (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/audit`,
  configuration:  (id: string) => `${WAREHOUSE_MASTER_BASE}/${id}/configuration`,
} as const;

/** Returns the warehouse ID param from a location path segment. */
export function extractWarehouseId(pathname: string): string | null {
  const match = pathname.match(/\/admin\/master\/warehouse-master\/([^/]+)/);
  return match ? (match[1] === 'new' ? null : match[1]) : null;
}

/** Returns the location ID param from a location path segment. */
export function extractLocationId(pathname: string): string | null {
  const match = pathname.match(/\/admin\/master\/warehouse-master\/[^/]+\/locations\/([^/]+)/);
  return match ? (match[1] === 'new' ? null : match[1]) : null;
}

/** Returns true when the current path is the create route. */
export function isCreateRoute(pathname: string): boolean {
  return pathname === WAREHOUSE_ROUTES.create;
}
