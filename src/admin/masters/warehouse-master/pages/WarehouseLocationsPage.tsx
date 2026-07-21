import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Filter, FolderTree, HelpCircle, Import, Rows3 } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell, AdminListToolbarButton } from '../../../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { MasterFilterDrawer } from '../../../../components/common/MasterFilterDrawer';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { HierarchyTemplate, WarehouseDetails, WarehouseLocation } from '../types/warehouse.types';
import type { WarehouseStatus } from '../types/warehouse.enums';
import { deriveCapacityStatus, deriveCapacityUtilization, deriveEffectiveLocationStatus } from '../utils/warehouseDerivations';
import { deriveEffectiveNodeCapabilities, getTemplateLevelForLocation } from '../utils/hierarchyUtils';
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
  capacityApplicable: string;
  capacityStatus: string;
  hardBlock: string;
  approvalRequired: string;
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
  readonly capacityApplicable: boolean;
  readonly capacityStatus: string;
  readonly availableCapacitySummary: string;
  readonly hardBlock: boolean;
  readonly approvalRequired: boolean;
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
  capacityApplicable: '',
  capacityStatus: '',
  hardBlock: '',
  approvalRequired: '',
  putawayBlocked: '',
  pickingBlocked: '',
  eligibilityMode: '',
  issuesOnly: '',
  identifierIssues: '',
};

export function buildLocationRowModel(
  location: WarehouseLocation,
  warehouse: WarehouseDetails['warehouse'] | undefined,
  activeTemplate: HierarchyTemplate | undefined,
  warehouseStatus: WarehouseStatus,
  allLocations: WarehouseLocation[],
  duplicateFullIdentifiers: Set<string>,
): LocationRowModel {
  const level = getTemplateLevelForLocation(location, activeTemplate);
  const capabilities = deriveEffectiveNodeCapabilities(activeTemplate, level);
  const utilizationNumber = warehouse
    ? deriveCapacityUtilization(location, allLocations, warehouse, activeTemplate)
    : location.capacity?.utilizationPercent;
  const capacityUtilization = utilizationNumber !== undefined ? `${utilizationNumber}%` : 'n/a';
  const capacityStatus = warehouse
    ? deriveCapacityStatus(location, allLocations, warehouse, activeTemplate)
    : (location.capacity?.status ?? 'NotConfigured');
  const availableCapacitySummary = `U:${location.capacity?.availableUnits ?? 'n/a'} W:${location.capacity?.availableWeightKg ?? 'n/a'} V:${location.capacity?.availableVolumeM3 ?? 'n/a'}`;

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
    capacityApplicable: capabilities.capacityApplicable,
    capacityStatus,
    availableCapacitySummary,
    hardBlock: (location.capacity?.enforcementMode ?? warehouse?.capacityPolicy?.defaultEnforcementMode) === 'HardBlock',
    approvalRequired: (location.capacity?.enforcementMode ?? warehouse?.capacityPolicy?.defaultEnforcementMode) === 'ApprovalRequired',
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
  warehouseOrLocations: WarehouseDetails['warehouse'] | WarehouseLocation[],
  activeTemplateOrStatus: HierarchyTemplate | WarehouseStatus | undefined,
  locationsOrSearch: WarehouseLocation[] | string,
  warehouseStatusOrFilters: WarehouseStatus | LocationFilterState,
  searchOrUndefined?: string,
  filtersMaybe?: LocationFilterState,
): LocationRowModel[] {
  const usingLegacySignature = Array.isArray(warehouseOrLocations);
  const warehouse = usingLegacySignature ? undefined : warehouseOrLocations;
  const activeTemplate = usingLegacySignature ? undefined : activeTemplateOrStatus as HierarchyTemplate | undefined;
  const locations = (usingLegacySignature ? warehouseOrLocations : locationsOrSearch) as WarehouseLocation[];
  const warehouseStatus = (usingLegacySignature ? activeTemplateOrStatus : warehouseStatusOrFilters) as WarehouseStatus;
  const search = ((usingLegacySignature ? locationsOrSearch : searchOrUndefined) as string | undefined) ?? '';
  const filters = ((usingLegacySignature ? warehouseStatusOrFilters : filtersMaybe) as LocationFilterState | undefined) ?? EMPTY_FILTERS;

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
    .map((location) => buildLocationRowModel(location, warehouse, activeTemplate, warehouseStatus, locations, duplicateFullIdentifiers))
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
      if (filters.capacityApplicable === 'yes' && !row.capacityApplicable) return false;
      if (filters.capacityApplicable === 'no' && row.capacityApplicable) return false;
      if (filters.capacityStatus && row.capacityStatus !== filters.capacityStatus) return false;
      if (filters.hardBlock === 'yes' && !row.hardBlock) return false;
      if (filters.approvalRequired === 'yes' && !row.approvalRequired) return false;
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
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
    () => details ? filterLocationRows(details.warehouse, details.hierarchyTemplates.find((template) => template.status === 'Active'), details.locations, details.warehouse.status, search, filters) : [],
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
        searchValue={search}
        searchPlaceholder="Search code, name, path, type, or BIN type"
        onSearchChange={setSearch}
        secondaryActions={[
          {
            label: 'Help',
            tone: 'secondary',
            icon: <HelpCircle size={14} />,
            onClick: () => setHelpOpen(true),
          },
          {
            label: 'Filters',
            tone: 'secondary',
            icon: <Filter size={14} />,
            onClick: () => setFilterDrawerOpen(true),
          },
        ]}
        toolbarActions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <AdminListToolbarButton
              label="Hierarchy"
              icon={<FolderTree size={14} />}
              onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))}
            />
            <AdminListToolbarButton
              label="Bulk create"
              icon={<Rows3 size={14} />}
              onClick={() => { setBulkParent(null); setBulkOpen(true); }}
            />
            <div style={{ opacity: 0.55 }}>
              <AdminListToolbarButton
                label="Import"
                icon={<Import size={14} />}
                onClick={() => undefined}
              />
            </div>
          </div>
        }
      >
        <div style={{ padding: '0 24px 24px' }}>
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
                      <AdminListToolbarButton
                        label="Inspect"
                        onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))}
                      />
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
                <div style={{ display: 'grid', gridTemplateColumns: '100px 130px 190px 180px 60px 100px 100px 90px 90px 110px 120px 130px 110px 110px 110px 150px 90px', gap: '10px', padding: '12px 14px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {['Location Code', 'Location Name', 'Full Identifier', 'Parent Identifier', 'Level', 'Level Code', 'Location Type', 'BIN Type', 'Inventory Allowed', 'Capacity Applicable', 'Capacity Status', 'Available Capacity', 'Capacity Utilization', 'Putaway Status', 'Picking Status', 'Stock/Dependency', 'Actions'].map((header) => (
                    <div key={header}>{header}</div>
                  ))}
                </div>
                {filtered.map((row) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '100px 130px 190px 180px 60px 100px 100px 90px 90px 110px 120px 130px 110px 110px 110px 150px 90px', gap: '10px', padding: '12px 14px', borderTop: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text)' }}>
                    <div>{row.locationCode}</div>
                    <div>{row.locationName}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: row.hasIdentifierIssue ? '#B91C1C' : undefined }}>{row.fullLocationIdentifier}</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.parentFullIdentifier}</div>
                    <div>{row.level}</div>
                    <div>{row.levelCode}</div>
                    <div>{row.locationType}</div>
                    <div>{row.binType}</div>
                    <div>{row.inventoryAllowed ? 'Yes' : 'No'}</div>
                    <div>{row.capacityApplicable ? 'Yes' : 'No'}</div>
                    <div>{row.capacityStatus}</div>
                    <div>{row.availableCapacitySummary}</div>
                    <div>{row.capacityUtilization}</div>
                    <div>{row.putawayStatus}</div>
                    <div>{row.pickingStatus}</div>
                    <div>{row.stockDependency}</div>
                    <div>
                      <AdminListToolbarButton
                        label="Inspect"
                        onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))}
                      />
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
      <MasterFilterDrawer
        open={filterDrawerOpen}
        title="Location Filters"
        description="Apply reusable master filters for warehouse locations."
        fields={[
          {
            id: 'level',
            label: 'Level',
            value: filters.level,
            placeholder: 'All Levels',
            options: [
              { value: '', label: 'All Levels' },
              ...[...new Set(details.locations.map((location) => String(location.profile.level)))].map((level) => ({
                value: level,
                label: `Level ${level}`,
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, level: value })),
          },
          {
            id: 'levelRole',
            label: 'Level Role',
            value: filters.levelRole,
            placeholder: 'All Level Roles',
            options: [
              { value: '', label: 'All Level Roles' },
              ...[...new Set(details.locations.map((location) => location.profile.locationRole).filter(Boolean))].map((role) => ({
                value: role ?? '',
                label: role ?? '',
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, levelRole: value })),
          },
          {
            id: 'parentId',
            label: 'Parent',
            value: filters.parentId,
            placeholder: 'All Parents',
            options: [
              { value: '', label: 'All Parents' },
              ...details.locations
                .filter((location) => !location.parentLocationId)
                .map((location) => ({ value: location.id, label: location.locationCode })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, parentId: value })),
          },
          {
            id: 'locationType',
            label: 'Location Type',
            value: filters.locationType,
            placeholder: 'All Types',
            options: [
              { value: '', label: 'All Types' },
              ...[...new Set(details.locations.map((location) => location.profile.locationType))].map((type) => ({
                value: type,
                label: type,
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, locationType: value })),
          },
          {
            id: 'binType',
            label: 'BIN Type',
            value: filters.binType,
            placeholder: 'All BIN Types',
            options: [
              { value: '', label: 'All BIN Types' },
              ...[...new Set(details.locations.map((location) => location.profile.binType).filter(Boolean))].map((type) => ({
                value: type ?? '',
                label: type ?? '',
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, binType: value })),
          },
          {
            id: 'status',
            label: 'Status',
            value: filters.status,
            placeholder: 'All Statuses',
            options: [
              { value: '', label: 'All Statuses' },
              ...['Draft', 'Active', 'Blocked', 'Inactive'].map((status) => ({ value: status, label: status })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, status: value })),
          },
          {
            id: 'inventoryAllowed',
            label: 'Inventory Allowed',
            value: filters.inventoryAllowed,
            placeholder: 'Inventory Allowed',
            options: [
              { value: '', label: 'Inventory Allowed' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, inventoryAllowed: value })),
          },
          {
            id: 'capacityWarning',
            label: 'Capacity Warning',
            value: filters.capacityWarning,
            placeholder: 'Capacity Warning',
            options: [
              { value: '', label: 'Capacity Warning' },
              { value: 'yes', label: '80%+ utilized' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, capacityWarning: value })),
          },
          {
            id: 'capacityApplicable',
            label: 'Capacity Applicable',
            value: filters.capacityApplicable,
            placeholder: 'Capacity Applicable',
            options: [
              { value: '', label: 'Capacity Applicable' },
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, capacityApplicable: value })),
          },
          {
            id: 'capacityStatus',
            label: 'Capacity Status',
            value: filters.capacityStatus,
            placeholder: 'Capacity Status',
            options: [
              { value: '', label: 'Capacity Status' },
              ...['NotApplicable', 'NotConfigured', 'WithinCapacity', 'NearCapacity', 'Exceeded', 'RequiresApproval'].map((status) => ({
                value: status,
                label: status,
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, capacityStatus: value })),
          },
          {
            id: 'hardBlock',
            label: 'Hard Block',
            value: filters.hardBlock,
            placeholder: 'Hard Block',
            options: [
              { value: '', label: 'Hard Block' },
              { value: 'yes', label: 'Yes' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, hardBlock: value })),
          },
          {
            id: 'approvalRequired',
            label: 'Approval Required',
            value: filters.approvalRequired,
            placeholder: 'Approval Required',
            options: [
              { value: '', label: 'Approval Required' },
              { value: 'yes', label: 'Yes' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, approvalRequired: value })),
          },
          {
            id: 'putawayBlocked',
            label: 'Putaway Status',
            value: filters.putawayBlocked,
            placeholder: 'Putaway Status',
            options: [
              { value: '', label: 'Putaway Status' },
              { value: 'yes', label: 'Blocked' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, putawayBlocked: value })),
          },
          {
            id: 'pickingBlocked',
            label: 'Picking Status',
            value: filters.pickingBlocked,
            placeholder: 'Picking Status',
            options: [
              { value: '', label: 'Picking Status' },
              { value: 'yes', label: 'Blocked' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, pickingBlocked: value })),
          },
          {
            id: 'eligibilityMode',
            label: 'Eligibility Mode',
            value: filters.eligibilityMode,
            placeholder: 'Eligibility Mode',
            options: [
              { value: '', label: 'Eligibility Mode' },
              ...[...new Set(details.locations.map((location) => location.eligibilityPolicy?.mode).filter(Boolean))].map((mode) => ({
                value: mode ?? '',
                label: mode ?? '',
              })),
            ],
            onChange: (value) => setFilters((state) => ({ ...state, eligibilityMode: value })),
          },
          {
            id: 'issuesOnly',
            label: 'Issue Filter',
            value: filters.issuesOnly,
            placeholder: 'Issue Filter',
            options: [
              { value: '', label: 'Issue Filter' },
              { value: 'yes', label: 'Issues only' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, issuesOnly: value })),
          },
          {
            id: 'identifierIssues',
            label: 'Identifier Issues',
            value: filters.identifierIssues,
            placeholder: 'Identifier Issues',
            options: [
              { value: '', label: 'Identifier Issues' },
              { value: 'yes', label: 'Duplicate full identifier' },
            ],
            onChange: (value) => setFilters((state) => ({ ...state, identifierIssues: value })),
          },
        ]}
        onClose={() => setFilterDrawerOpen(false)}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />
      <HelpDrawer open={helpOpen} topic={getHelpTopic('warehouse-locations')} onClose={() => setHelpOpen(false)} />
    </AdminShell>
  );
};

export default WarehouseLocationsPage;
