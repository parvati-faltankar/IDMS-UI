import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderTree, HelpCircle, Import, Rows3 } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { WarehouseDetails, WarehouseLocation } from '../types/warehouse.types';
import type { WarehouseStatus } from '../types/warehouse.enums';
import { deriveEffectiveLocationStatus } from '../utils/warehouseDerivations';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { LocationBulkCreateDrawer } from '../components/LocationBulkCreateDrawer';

interface LocationFilterState {
  level: string;
  levelRole: string;
  parentId: string;
  locationType: string;
  binType: string;
  status: string;
  inventoryAllowed: string;
  capacityWarning: string;
  putawayBlocked: string;
  pickingBlocked: string;
  eligibilityMode: string;
  issuesOnly: string;
  identifierIssues: string;
}

export interface LocationRowModel {
  readonly id: string;
  readonly locationCode: string;
  readonly levelCode: string;
  readonly levelRole: string;
  readonly parentFullIdentifier: string;
  readonly fullLocationIdentifier: string;
  readonly locationName: string;
  readonly fullPath: string;
  readonly level: number;
  readonly locationType: string;
  readonly binType: string;
  readonly inventoryAllowed: boolean;
  readonly capacityUtilization: string;
  readonly eligibilityMode: string;
  readonly putawayStatus: string;
  readonly pickingStatus: string;
  readonly effectiveStatus: string;
  readonly stockDependency: string;
  readonly hasIdentifierIssue: boolean;
}

const EMPTY_FILTERS: LocationFilterState = {
  level: '',
  levelRole: '',
  parentId: '',
  locationType: '',
  binType: '',
  status: '',
  inventoryAllowed: '',
  capacityWarning: '',
  putawayBlocked: '',
  pickingBlocked: '',
  eligibilityMode: '',
  issuesOnly: '',
  identifierIssues: '',
};

export function buildLocationRowModel(
  location: WarehouseLocation,
  warehouseStatus: WarehouseStatus,
  allLocations: WarehouseLocation[],
  duplicateFullIdentifiers: Set<string>,
): LocationRowModel {
  const capacityUtilization = location.capacity?.maxUnits && location.capacity.currentUnits !== undefined
    ? `${Math.round((location.capacity.currentUnits / location.capacity.maxUnits) * 100)}%`
    : 'n/a';

  const parent = location.parentLocationId
    ? allLocations.find((entry) => entry.id === location.parentLocationId)
    : undefined;
  const levelCode = location.profile.templateLevelCode ?? 'n/a';
  const levelRole = location.profile.locationRole ?? 'n/a';
  return {
    id: location.id,
    locationCode: location.locationCode,
    levelCode,
    levelRole,
    parentFullIdentifier: parent?.profile.fullCode ?? 'Warehouse root',
    fullLocationIdentifier: location.profile.fullCode,
    locationName: location.locationName,
    fullPath: location.profile.fullCode,
    level: location.profile.level,
    locationType: location.profile.locationType,
    binType: location.profile.binType ?? '—',
    inventoryAllowed: location.profile.inventoryAllowed,
    capacityUtilization,
    eligibilityMode: location.eligibilityPolicy?.mode ?? 'Warehouse default',
    putawayStatus: location.putawayBlocked ? 'Blocked' : 'Allowed',
    pickingStatus: location.pickingBlocked ? 'Blocked' : 'Allowed',
    effectiveStatus: deriveEffectiveLocationStatus(location.status, warehouseStatus),
    stockDependency: [
      location.stockStatuses.length > 0 ? location.stockStatuses.join(', ') : null,
      location.commitmentState !== 'Uncommitted' ? location.commitmentState : null,
      location.movementState !== 'Idle' ? location.movementState : null,
    ].filter(Boolean).join(' · ') || 'None',
    hasIdentifierIssue: duplicateFullIdentifiers.has(location.profile.fullCode.toUpperCase()),
  };
}

export function filterLocationRows(
  locations: WarehouseLocation[],
  warehouseStatus: WarehouseStatus,
  search: string,
  filters: LocationFilterState,
): LocationRowModel[] {
  const q = search.trim().toLowerCase();
  const fullCodeCounts = locations.reduce<Map<string, number>>((acc, location) => {
    const key = location.profile.fullCode.toUpperCase();
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map());
  const duplicateFullIdentifiers = new Set(
    Array.from(fullCodeCounts.entries()).filter(([, count]) => count > 1).map(([key]) => key),
  );
  return locations
    .map((location) => buildLocationRowModel(location, warehouseStatus, locations, duplicateFullIdentifiers))
    .filter((row) => {
      if (filters.level && String(row.level) !== filters.level) return false;
      if (filters.levelRole && row.levelRole !== filters.levelRole) return false;
      if (filters.parentId) {
        const parent = locations.find((location) => location.id === row.id);
        if (parent?.parentLocationId !== filters.parentId) return false;
      }
      if (filters.locationType && row.locationType !== filters.locationType) return false;
      if (filters.binType && row.binType !== filters.binType) return false;
      if (filters.status && row.effectiveStatus !== filters.status) return false;
      if (filters.inventoryAllowed === 'yes' && !row.inventoryAllowed) return false;
      if (filters.inventoryAllowed === 'no' && row.inventoryAllowed) return false;
      if (filters.capacityWarning === 'yes' && row.capacityUtilization !== 'n/a') {
        const numeric = Number(row.capacityUtilization.replace('%', ''));
        if (!(numeric >= 80)) return false;
      }
      if (filters.putawayBlocked === 'yes' && row.putawayStatus !== 'Blocked') return false;
      if (filters.pickingBlocked === 'yes' && row.pickingStatus !== 'Blocked') return false;
      if (filters.eligibilityMode && row.eligibilityMode !== filters.eligibilityMode) return false;
      if (filters.issuesOnly === 'yes' && row.stockDependency === 'None' && row.effectiveStatus === 'Active' && row.inventoryAllowed) return false;
      if (filters.identifierIssues === 'yes' && !row.hasIdentifierIssue) return false;
      if (q) {
        const hay = [
          row.locationCode,
          row.locationName,
          row.fullPath,
          row.fullLocationIdentifier,
          row.parentFullIdentifier,
          row.locationType,
          row.binType,
          row.levelCode,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
}

export function getLocationEmptyState(
  totalCount: number,
  filteredCount: number,
  hasFilters: boolean,
): string {
  if (totalCount === 0) return 'No locations configured yet.';
  if (filteredCount === 0 && hasFilters) return 'No locations match the current filters.';
  return '';
}

const WarehouseLocationsPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<LocationFilterState>(EMPTY_FILTERS);
  const [bulkParent, setBulkParent] = useState<WarehouseLocation | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1100);

  async function load() {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const next = await warehouseMockAdapter.getWarehouse(warehouseId);
      setDetails(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [warehouseId]);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filtered = useMemo(
    () => details ? filterLocationRows(details.locations, details.warehouse.status, search, filters) : [],
    [details, filters, search],
  );

  if (!details) {
    return (
      <AdminShell>
        <div style={{ padding: '28px', color: 'var(--color-text-muted)' }}>{loading ? 'Loading locations…' : 'Location workspace unavailable.'}</div>
      </AdminShell>
    );
  }

  const hasFilters = search.trim().length > 0 || Object.values(filters).some(Boolean);
  const emptyState = getLocationEmptyState(details.locations.length, filtered.length, hasFilters);

  return (
    <AdminShell>
      <AdminListPageShell
        title="Warehouse Locations"
        description={`Browse and govern the hierarchy nodes and BIN records for ${details.warehouse.warehouseName}.`}
        breadcrumbs={['Admin', 'Warehouse & Inventory', 'Warehouse Master', details.warehouse.warehouseCode, 'Locations']}
        searchValue={search}
        searchPlaceholder="Search code, name, path, type, or BIN type"
        onSearchChange={setSearch}
        summaryItems={[
          { label: 'Total', value: details.locations.length },
          { label: 'Inventory Allowed', value: details.locations.filter((location) => location.profile.inventoryAllowed).length, tone: 'success' },
          { label: 'Issues', value: details.locations.filter((location) => location.putawayBlocked || location.pickingBlocked || location.status !== 'Active').length, tone: 'warning' },
        ]}
        toolbarActions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setHelpOpen(true)} style={toolbarBtn}>
              <HelpCircle size={14} /> Help
            </button>
            <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))} style={toolbarBtn}>
              <FolderTree size={14} /> Hierarchy
            </button>
            <button type="button" onClick={() => { setBulkParent(null); setBulkOpen(true); }} style={toolbarBtn}>
              <Rows3 size={14} /> Bulk create
            </button>
            <button type="button" style={{ ...toolbarBtn, opacity: 0.55 }}>
              <Import size={14} /> Import
            </button>
          </div>
        }
      >
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <select value={filters.level} onChange={(event) => setFilters((state) => ({ ...state, level: event.target.value }))} style={filterInput}>
              <option value="">All Levels</option>
              {[...new Set(details.locations.map((location) => String(location.profile.level)))].map((level) => <option key={level} value={level}>{`Level ${level}`}</option>)}
            </select>
            <select value={filters.levelRole} onChange={(event) => setFilters((state) => ({ ...state, levelRole: event.target.value }))} style={filterInput}>
              <option value="">All Level Roles</option>
              {[...new Set(details.locations.map((location) => location.profile.locationRole).filter(Boolean))].map((role) => <option key={role} value={role ?? ''}>{role}</option>)}
            </select>
            <select value={filters.parentId} onChange={(event) => setFilters((state) => ({ ...state, parentId: event.target.value }))} style={filterInput}>
              <option value="">All Parents</option>
              {details.locations.filter((location) => !location.parentLocationId).map((location) => <option key={location.id} value={location.id}>{location.locationCode}</option>)}
            </select>
            <select value={filters.locationType} onChange={(event) => setFilters((state) => ({ ...state, locationType: event.target.value }))} style={filterInput}>
              <option value="">All Types</option>
              {[...new Set(details.locations.map((location) => location.profile.locationType))].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={filters.binType} onChange={(event) => setFilters((state) => ({ ...state, binType: event.target.value }))} style={filterInput}>
              <option value="">All BIN Types</option>
              {[...new Set(details.locations.map((location) => location.profile.binType).filter(Boolean))].map((type) => <option key={type} value={type ?? ''}>{type}</option>)}
            </select>
            <select value={filters.status} onChange={(event) => setFilters((state) => ({ ...state, status: event.target.value }))} style={filterInput}>
              <option value="">All Statuses</option>
              {['Draft', 'Active', 'Blocked', 'Inactive'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={filters.inventoryAllowed} onChange={(event) => setFilters((state) => ({ ...state, inventoryAllowed: event.target.value }))} style={filterInput}>
              <option value="">Inventory Allowed</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <select value={filters.capacityWarning} onChange={(event) => setFilters((state) => ({ ...state, capacityWarning: event.target.value }))} style={filterInput}>
              <option value="">Capacity Warning</option>
              <option value="yes">80%+ utilized</option>
            </select>
            <select value={filters.putawayBlocked} onChange={(event) => setFilters((state) => ({ ...state, putawayBlocked: event.target.value }))} style={filterInput}>
              <option value="">Putaway Status</option>
              <option value="yes">Blocked</option>
            </select>
            <select value={filters.pickingBlocked} onChange={(event) => setFilters((state) => ({ ...state, pickingBlocked: event.target.value }))} style={filterInput}>
              <option value="">Picking Status</option>
              <option value="yes">Blocked</option>
            </select>
            <select value={filters.eligibilityMode} onChange={(event) => setFilters((state) => ({ ...state, eligibilityMode: event.target.value }))} style={filterInput}>
              <option value="">Eligibility Mode</option>
              {[...new Set(details.locations.map((location) => location.eligibilityPolicy?.mode).filter(Boolean))].map((mode) => <option key={mode} value={mode ?? ''}>{mode}</option>)}
            </select>
            <select value={filters.issuesOnly} onChange={(event) => setFilters((state) => ({ ...state, issuesOnly: event.target.value }))} style={filterInput}>
              <option value="">Issue Filter</option>
              <option value="yes">Issues only</option>
            </select>
            <select value={filters.identifierIssues} onChange={(event) => setFilters((state) => ({ ...state, identifierIssues: event.target.value }))} style={filterInput}>
              <option value="">Identifier Issues</option>
              <option value="yes">Duplicate full identifier</option>
            </select>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} style={rowActionBtn}>
              Clear filters
            </button>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--color-surface)' }}>
            {emptyState ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                {emptyState}
              </div>
            ) : isNarrow ? (
              <div style={{ display: 'grid', gap: '12px', padding: '12px' }}>
                {filtered.map((row) => (
                  <div key={row.id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', background: 'var(--color-surface-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{row.locationCode}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{row.locationName}</div>
                      </div>
                      <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))} style={rowActionBtn}>
                        Inspect
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '12px' }}>
                      <div><strong>Path:</strong> {row.fullPath}</div>
                      <div><strong>Level:</strong> {row.level}</div>
                      <div><strong>Type:</strong> {row.locationType}</div>
                      <div><strong>BIN:</strong> {row.binType}</div>
                      <div><strong>Inventory:</strong> {row.inventoryAllowed ? 'Allowed' : 'Blocked'}</div>
                      <div><strong>Capacity:</strong> {row.capacityUtilization}</div>
                      <div><strong>Eligibility:</strong> {row.eligibilityMode}</div>
                      <div><strong>Status:</strong> {row.effectiveStatus}</div>
                      <div><strong>Putaway:</strong> {row.putawayStatus}</div>
                      <div><strong>Picking:</strong> {row.pickingStatus}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Dependency:</strong> {row.stockDependency}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 150px 200px 200px 60px 110px 100px 110px 110px 120px 110px 110px 110px 160px 110px 90px', gap: '10px', padding: '12px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {['Location Code', 'Location Name', 'Full Identifier', 'Parent Identifier', 'Level', 'Level Code', 'Location Type', 'BIN Type', 'Inventory Allowed', 'Capacity Utilization', 'Eligibility Mode', 'Putaway Status', 'Picking Status', 'Effective Status', 'Stock/Dependency', 'Actions'].map((header) => (
                    <div key={header}>{header}</div>
                  ))}
                </div>
                {filtered.map((row) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '100px 150px 200px 200px 60px 110px 100px 110px 110px 120px 110px 110px 110px 160px 110px 90px', gap: '10px', padding: '12px 14px', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text)' }}>
                    <div>{row.locationCode}</div>
                    <div>{row.locationName}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: row.hasIdentifierIssue ? '#B91C1C' : undefined }}>{row.fullLocationIdentifier}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.parentFullIdentifier}</div>
                    <div>{row.level}</div>
                    <div>{row.levelCode}</div>
                    <div>{row.locationType}</div>
                    <div>{row.binType}</div>
                    <div>{row.inventoryAllowed ? 'Yes' : 'No'}</div>
                    <div>{row.capacityUtilization}</div>
                    <div>{row.eligibilityMode}</div>
                    <div>{row.putawayStatus}</div>
                    <div>{row.pickingStatus}</div>
                    <div>{row.effectiveStatus}</div>
                    <div>{row.stockDependency}</div>
                    <div>
                      <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))} style={rowActionBtn}>
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </AdminListPageShell>

      {bulkOpen && (
        <LocationBulkCreateDrawer
          open={bulkOpen}
          warehouse={details.warehouse}
          parentLocation={bulkParent}
          onClose={() => setBulkOpen(false)}
          onCommitted={load}
        />
      )}
      <HelpDrawer open={helpOpen} topic={getHelpTopic('warehouse-locations')} onClose={() => setHelpOpen(false)} />
    </AdminShell>
  );
};

const toolbarBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const filterInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
};

const rowActionBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text)',
  fontSize: '12px',
  cursor: 'pointer',
};

export default WarehouseLocationsPage;
