// ─── Warehouse List Page ──────────────────────────────────────────────────────
//
// Phase 2: Full list page with filtering, search, preview, and lifecycle actions.
// Uses AdminListPageShell + SmartPreviewDrawer pattern.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Edit2, Filter, MoreVertical, Plus, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { WarehouseSummary } from '../types/warehouse.types';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge';
import { WarehouseScopeBadge } from '../components/WarehouseScopeBadge';
import { WarehouseModeBadge } from '../components/WarehouseModeBadge';
import { WarehouseSetupHealth } from '../components/WarehouseSetupHealth';
import { WarehousePreviewDrawer } from '../components/WarehousePreviewDrawer';
import { WarehouseControlledActionDrawer } from '../components/WarehouseControlledActionDrawer';
import { getReasonCodesForAction, parseWarehouseServiceError } from '../utils/governanceUtils';
import { formatDate } from '../../../../utils/dateFormat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  quickFilter: string;
  warehouseType: string;
  wmsEnabled: '' | 'yes' | 'no';
}

const EMPTY_FILTERS: FilterState = {
  quickFilter: 'all',
  warehouseType: '',
  wmsEnabled: '',
};

const MASTER_KEY = 'warehouse-master';

// ─── Pure filter function (exported for tests) ────────────────────────────────

export function filterWarehouseSummaries(
  warehouses: WarehouseSummary[],
  search: string,
  filters: FilterState,
): WarehouseSummary[] {
  const q = search.trim().toLowerCase();

  return warehouses.filter((w) => {
    // Quick filter
    switch (filters.quickFilter) {
      case 'Active':          if (w.status !== 'Active') return false; break;
      case 'Draft':           if (w.status !== 'Draft') return false; break;
      case 'Blocked':         if (w.status !== 'Blocked') return false; break;
      case 'Inactive':        if (w.status !== 'Inactive') return false; break;
      case 'needs-attention': if (w.setupHealth === 'complete') return false; break;
      case 'warehouse-level': if (w.inventoryControlMode !== 'Warehouse-Level') return false; break;
      case 'bin-level':       if (w.inventoryControlMode !== 'Location-BIN-Level') return false; break;
      case 'shared':          if (w.ownershipScope !== 'Organization') return false; break;
      case 'my-branch':       if (w.ownershipScope !== 'Branch') return false; break;
    }

    // Advanced filters
    if (filters.warehouseType && w.warehouseType !== filters.warehouseType) return false;
    if (filters.wmsEnabled === 'yes' && !w.wmsEnabled) return false;
    if (filters.wmsEnabled === 'no'  &&  w.wmsEnabled) return false;

    // Search
    if (q) {
      const hay = [
        w.warehouseCode,
        w.warehouseName,
        w.owningCode ?? '',
        w.warehouseType,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

/** Compute counts for summary chips and quick-filter badges. */
export function buildSummaryCounts(warehouses: WarehouseSummary[]) {
  return {
    all:          warehouses.length,
    active:       warehouses.filter((w) => w.status === 'Active').length,
    draft:        warehouses.filter((w) => w.status === 'Draft').length,
    blocked:      warehouses.filter((w) => w.status === 'Blocked').length,
    inactive:     warehouses.filter((w) => w.status === 'Inactive').length,
    binManaged:   warehouses.filter((w) => w.binManaged).length,
    setupIssues:  warehouses.filter((w) => w.setupHealth !== 'complete').length,
    needsAttention: warehouses.filter((w) => w.setupHealth !== 'complete').length,
    shared:       warehouses.filter((w) => w.ownershipScope === 'Organization').length,
    myBranch:     warehouses.filter((w) => w.ownershipScope === 'Branch').length,
    warehouseLevel: warehouses.filter((w) => w.inventoryControlMode === 'Warehouse-Level').length,
    binLevel:     warehouses.filter((w) => w.inventoryControlMode === 'Location-BIN-Level').length,
  };
}

// ─── Row action helpers ───────────────────────────────────────────────────────

export interface RowAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
  danger?: boolean;
}

/** Derive context-aware row actions for a summary row. */
export function deriveRowActions(
  warehouse: WarehouseSummary,
  onEdit: () => void,
  onActivate: () => void,
  onBlock: () => void,
  onInactivate: () => void,
): RowAction[] {
  const actions: RowAction[] = [];

  // Edit — always visible
  actions.push({
    key: 'edit',
    label: 'Configure',
    icon: <Edit2 size={13} />,
    disabled: false,
    onClick: onEdit,
  });

  // Activate — only for Draft
  if (warehouse.status === 'Draft') {
    const ready = warehouse.setupHealth === 'complete';
    actions.push({
      key: 'activate',
      label: 'Activate',
      icon: <Check size={13} />,
      disabled: !ready,
      disabledReason: !ready ? 'Setup must be complete before activating.' : undefined,
      onClick: onActivate,
    });
  }

  // Block — only for Active
  if (warehouse.status === 'Active') {
    actions.push({
      key: 'block',
      label: 'Block',
      icon: <X size={13} />,
      disabled: false,
      danger: true,
      onClick: onBlock,
    });
  }

  // Inactivate — for Active or Blocked (not if draft or already inactive)
  if (warehouse.status === 'Active' || warehouse.status === 'Blocked') {
    actions.push({
      key: 'inactivate',
      label: 'Inactivate',
      icon: <X size={13} />,
      disabled: false,
      danger: true,
      onClick: onInactivate,
    });
  }

  return actions;
}

// ─── Table layout ─────────────────────────────────────────────────────────────

const GRID_COLS =
  '36px minmax(130px,1fr) minmax(170px,1.4fr) 100px minmax(110px,1fr) 100px 130px 65px 80px 110px 80px 90px 70px';

const COL_HEADERS = [
  '',
  'Code',
  'Warehouse Name',
  'Scope',
  'Owning Entity',
  'Type',
  'Mode',
  'Branches',
  'Locs / BINs',
  'Setup Health',
  'Status',
  'Updated',
  'Actions',
];

// ─── Inline style helpers ─────────────────────────────────────────────────────

const CELL: React.CSSProperties = { paddingRight: '10px', overflow: 'hidden' };

const TEXT_MONO: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: 'var(--color-text-muted)',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: '7px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Component ────────────────────────────────────────────────────────────────

const WarehouseListPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Data ────────────────────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');

  // ── UI state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Row action menu ──────────────────────────────────────────────────────
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // ── Preview ──────────────────────────────────────────────────────────────
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Block flow ────────────────────────────────────────────────────────────
  const [blockTarget, setBlockTarget] = useState<{ id: string; warehouseCode: string; warehouseName: string } | null>(null);
  const [blockReasonCode, setBlockReasonCode] = useState('');
  const [blockReasonDescription, setBlockReasonDescription] = useState('');
  const [blockEffectiveDate, setBlockEffectiveDate] = useState('');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // ── Inactivate flow ───────────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<{ id: string; warehouseCode: string; warehouseName: string } | null>(null);
  const [inactivateReasonCode, setInactivateReasonCode] = useState('');
  const [inactivateReasonDescription, setInactivateReasonDescription] = useState('');
  const [inactivateEffectiveDate, setInactivateEffectiveDate] = useState('');
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [inactivateLoading, setInactivateLoading] = useState(false);

  const blockReason = blockReasonDescription;
  const setBlockReason = setBlockReasonDescription;
  const inactivateReason = inactivateReasonDescription;
  const setInactivateReason = setInactivateReasonDescription;


  // ── Help ──────────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Mount: record recent + load data ──────────────────────────────────────
  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group  = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key:            master.key,
        label:          master.label,
        path:           master.path,
        groupLabel:     group.label,
        groupIconBg:    group.iconBg,
        groupIconColor: group.iconColor,
      });
    }

    warehouseMockAdapter
      .listWarehouses({ page: 1, pageSize: 200 })
      .then((result) => {
        setWarehouses(result.items);
        setLoadState('ready');
      })
      .catch(() => {
        setLoadError('Failed to load warehouses. Using cached data.');
        setLoadState('error');
      });
  }, []);

  // ── Reload after mutation ──────────────────────────────────────────────────
  async function reload() {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 200 });
    setWarehouses(result.items);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const counts = useMemo(() => buildSummaryCounts(warehouses), [warehouses]);

  const filtered = useMemo(
    () => filterWarehouseSummaries(warehouses, search, filters),
    [warehouses, search, filters],
  );

  // ── Action handlers ────────────────────────────────────────────────────────

  function openPreview(id: string) {
    setPreviewId(id);
    setPreviewOpen(true);
  }

  function openBlock(target: { id: string; warehouseCode: string; warehouseName: string }) {
    setBlockTarget(target);
    setBlockReasonCode('COMPLIANCE');
    setBlockReasonDescription('');
    setBlockEffectiveDate('');
    setBlockOpen(true);
  }

  function openInactivate(target: { id: string; warehouseCode: string; warehouseName: string }) {
    setInactivateTarget(target);
    setInactivateReasonCode('SITE-CLOSED');
    setInactivateReasonDescription('');
    setInactivateEffectiveDate('');
    setInactivateOpen(true);
  }

  function closeBlockDrawer() {
    setBlockOpen(false);
    setBlockTarget(null);
    setBlockReasonCode('');
    setBlockReasonDescription('');
    setBlockEffectiveDate('');
  }

  function closeInactivateDrawer() {
    setInactivateOpen(false);
    setInactivateTarget(null);
    setInactivateReasonCode('');
    setInactivateReasonDescription('');
    setInactivateEffectiveDate('');
  }

  async function confirmBlock() {
    if (!blockTarget || !blockReasonCode || !blockReasonDescription.trim()) return;
    setBlockLoading(true);
    try {
      await warehouseMockAdapter.changeWarehouseStatus(blockTarget.id, {
        action: 'Block',
        targetStatus: 'Blocked',
        reasonCode: blockReasonCode,
        reasonDescription: blockReasonDescription.trim(),
        effectiveDate: blockEffectiveDate || undefined,
        approvalRequired: false,
      });
      await reload();
      closeBlockDrawer();
      showToast(`"${blockTarget.warehouseName}" has been blocked.`, 'success');
    } catch (error) {
      showToast(parseWarehouseServiceError(error).message, 'error');
    } finally {
      setBlockLoading(false);
    }
  }

  async function confirmInactivate() {
    if (!inactivateTarget || !inactivateReasonCode || !inactivateReasonDescription.trim()) return;
    setInactivateLoading(true);
    try {
      await warehouseMockAdapter.changeWarehouseStatus(inactivateTarget.id, {
        action: 'Inactivate',
        targetStatus: 'Inactive',
        reasonCode: inactivateReasonCode,
        reasonDescription: inactivateReasonDescription.trim(),
        effectiveDate: inactivateEffectiveDate || undefined,
        approvalRequired: true,
        approvalRoute: 'Operations Governance',
      });
      await reload();
      closeInactivateDrawer();
      showToast(`"${inactivateTarget.warehouseName}" has been inactivated.`, 'success');
    } catch (error) {
      showToast(parseWarehouseServiceError(error).message, 'error');
    } finally {
      setInactivateLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((w) => w.id)));
    }
  }

  // ── Advanced filter panel ──────────────────────────────────────────────────
  const hasAdvanced = !!(filters.warehouseType || filters.wmsEnabled);

  const advPanel = showAdvFilter ? (
    <div
      style={{
        position: 'absolute', top: '100%', right: 0, zIndex: 300,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        padding: '16px 20px', minWidth: '260px', marginTop: '6px',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Advanced Filters
      </p>

      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px' }}>
        Warehouse Type
      </label>
      <select
        value={draftFilters.warehouseType}
        onChange={(e) => setDraftFilters((d) => ({ ...d, warehouseType: e.target.value }))}
        style={{ ...INPUT_STYLE, marginBottom: '12px' }}
      >
        <option value="">All types</option>
        <option value="Physical">Physical</option>
        <option value="Virtual">Virtual</option>
        <option value="Transit">Transit</option>
        <option value="Bonded">Bonded</option>
        <option value="Consignment">Consignment</option>
      </select>

      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px' }}>
        WMS Enabled
      </label>
      <select
        value={draftFilters.wmsEnabled}
        onChange={(e) => setDraftFilters((d) => ({ ...d, wmsEnabled: e.target.value as FilterState['wmsEnabled'] }))}
        style={{ ...INPUT_STYLE, marginBottom: '16px' }}
      >
        <option value="">All</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => { setFilters((f) => ({ ...f, warehouseType: draftFilters.warehouseType, wmsEnabled: draftFilters.wmsEnabled })); setShowAdvFilter(false); }}
          style={{ flex: 1, padding: '7px 0', fontSize: '12px', fontWeight: 600, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer' }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setDraftFilters(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setShowAdvFilter(false); }}
          style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 500, background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '7px', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    </div>
  ) : null;

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setDraftFilters(filters); setShowAdvFilter((v) => !v); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '7px 12px', fontSize: '12px', fontWeight: 500,
          border: '1px solid var(--color-border)', borderRadius: '8px',
          background: hasAdvanced ? 'var(--color-primary)' : 'var(--color-surface)',
          color: hasAdvanced ? 'white' : 'var(--color-text)', cursor: 'pointer',
        }}
      >
        <Filter size={13} />
        Filters {hasAdvanced && `(${[filters.warehouseType, filters.wmsEnabled].filter(Boolean).length})`}
        <ChevronDown size={13} />
      </button>
      {advPanel}
    </div>
  );

  // ── Table header ───────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const tableHeader = (
    <div
      style={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: 0,
        padding: '9px 16px',
        borderBottom: '2px solid var(--color-border)',
        background: 'var(--color-surface-subtle)',
        position: 'sticky', top: 0, zIndex: 10,
        minWidth: '1180px',
      }}
    >
      {/* Select all */}
      <div style={CELL}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          aria-label="Select all"
          style={{ cursor: 'pointer' }}
        />
      </div>
      {COL_HEADERS.slice(1).map((h, i) => (
        <div
          key={i}
          style={{ ...CELL, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {h}
        </div>
      ))}
    </div>
  );

  // ── Table body ─────────────────────────────────────────────────────────────

  const tableBody = (() => {
    if (loadState === 'loading') {
      return (
        <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Loading warehouses…
        </div>
      );
    }

    if (filtered.length === 0) {
      const hasActiveFilter = filters.quickFilter !== 'all' || search || hasAdvanced;
      return (
        <div style={{ padding: '64px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
            {hasActiveFilter ? 'No warehouses match your filters.' : 'No warehouses configured yet.'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            {hasActiveFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first warehouse to get started.'}
          </div>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilters(EMPTY_FILTERS); }}
              style={{ fontSize: '13px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all filters
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(WAREHOUSE_ROUTES.create)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                background: 'var(--color-primary)', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              New Warehouse
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {filtered.map((wh) => {
          const isSelected = selectedIds.has(wh.id);
          const rowActions = deriveRowActions(
            wh,
            () => navigate(WAREHOUSE_ROUTES.detail(wh.id)),
            () => { /* Activate flow — TBD in Phase 3 */ showToast('Activation wizard coming in Phase 3.', 'success'); },
            () => openBlock(wh),
            () => openInactivate(wh),
          );

          return (
            <div
              key={wh.id}
              data-testid={`wh-row-${wh.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                gap: 0,
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
                minWidth: '1180px',
                background: isSelected ? '#F8FAFF' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onClick={() => openPreview(wh.id)}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-subtle)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Select */}
              <div style={CELL} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(wh.id)}
                  aria-label={`Select ${wh.warehouseCode}`}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Code */}
              <div style={{ ...CELL }}>
                <div style={TEXT_MONO}>{wh.warehouseCode}</div>
              </div>

              {/* Name */}
              <div style={{ ...CELL }}>
                <div
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}
                  onClick={(e) => { e.stopPropagation(); openPreview(wh.id); }}
                >
                  {wh.warehouseName}
                </div>
                {wh.wmsEnabled && (
                  <div style={{ fontSize: '10px', color: '#0891B2', fontWeight: 600, marginTop: '1px' }}>WMS</div>
                )}
              </div>

              {/* Scope */}
              <div style={CELL}>
                <WarehouseScopeBadge scope={wh.ownershipScope} size="sm" />
              </div>

              {/* Owning entity */}
              <div style={{ ...CELL, fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {wh.owningCode ?? '—'}
              </div>

              {/* Type */}
              <div style={{ ...CELL, fontSize: '12px', color: 'var(--color-text)' }}>
                {wh.warehouseType}
              </div>

              {/* Mode */}
              <div style={CELL}>
                <WarehouseModeBadge mode={wh.inventoryControlMode} size="sm" />
              </div>

              {/* Branches */}
              <div style={{ ...CELL, fontSize: '12px', color: 'var(--color-text)', textAlign: 'center' }}>
                {wh.branchCount > 0 ? String(wh.branchCount) : '—'}
              </div>

              {/* Locs / BINs */}
              <div style={{ ...CELL, fontSize: '12px', color: 'var(--color-text)' }}>
                {wh.locationCount > 0
                  ? `${wh.locationCount} / ${wh.activeBinCount}`
                  : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
              </div>

              {/* Setup health */}
              <div style={CELL}>
                <WarehouseSetupHealth tone={wh.setupHealth} compact={false} showLabel={false} />
              </div>

              {/* Status */}
              <div style={CELL}>
                <WarehouseStatusBadge status={wh.status} size="sm" />
              </div>

              {/* Updated */}
              <div style={{ ...CELL, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {formatDate(wh.updatedAt)}
              </div>

              {/* Actions */}
              <div
                style={{ position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  title="Actions"
                  aria-label={`Actions for ${wh.warehouseCode}`}
                  onClick={() => setActionMenuId((prev) => (prev === wh.id ? null : wh.id))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px',
                    border: '1px solid var(--color-border)', borderRadius: '6px',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <MoreVertical size={13} />
                </button>

                {actionMenuId === wh.id && (
                  <div
                    style={{
                      position: 'absolute', top: '100%', right: 0, zIndex: 400,
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                      padding: '4px', minWidth: '160px', marginTop: '4px',
                    }}
                  >
                    {rowActions.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        title={action.disabled ? action.disabledReason : undefined}
                        disabled={action.disabled}
                        onClick={() => {
                          setActionMenuId(null);
                          action.onClick();
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                          padding: '8px 12px', fontSize: '13px', fontWeight: 500,
                          background: 'none', border: 'none', borderRadius: '7px',
                          cursor: action.disabled ? 'not-allowed' : 'pointer',
                          color: action.disabled
                            ? 'var(--color-text-muted)'
                            : action.danger
                              ? '#DC2626'
                              : 'var(--color-text)',
                          opacity: action.disabled ? 0.5 : 1,
                          textAlign: 'left',
                        }}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  })();

  // ── Click-outside to close action menu ────────────────────────────────────
  useEffect(() => {
    function handleClickOutside() {
      setActionMenuId(null);
      setShowAdvFilter(false);
    }
    if (actionMenuId || showAdvFilter) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuId, showAdvFilter]);

  // ── Page render ────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            color: 'white', padding: '12px 20px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Warehouse Master"
        description="Manage warehouse ownership, branch access, hierarchy, inventory control, and operational policies"
        breadcrumbs={['Admin', 'Warehouse & Inventory', 'Warehouse Master']}
        primaryAction={{
          label: 'New Warehouse',
          onClick: () => navigate(WAREHOUSE_ROUTES.create),
        }}
        searchValue={search}
        searchPlaceholder="Search by code, name, owning entity, type…"
        onSearchChange={(v) => { setSearch(v); }}
        summaryItems={[
          { label: 'Total',        value: counts.all,         tone: 'neutral' },
          { label: 'Active',       value: counts.active,      tone: 'success' },
          { label: 'Draft',        value: counts.draft,       tone: 'neutral' },
          { label: 'Blocked',      value: counts.blocked,     tone: counts.blocked > 0 ? 'warning' : 'neutral' },
          { label: 'Inactive',     value: counts.inactive,    tone: 'neutral' },
          { label: 'BIN-managed',  value: counts.binManaged,  tone: 'neutral' },
          { label: 'Setup issues', value: counts.setupIssues, tone: counts.setupIssues > 0 ? 'danger' : 'neutral' },
        ]}
        quickFilterItems={[
          { key: 'all',             label: 'All',              count: counts.all },
          { key: 'Active',          label: 'Active',           count: counts.active },
          { key: 'Draft',           label: 'Draft',            count: counts.draft },
          { key: 'Blocked',         label: 'Blocked',          count: counts.blocked },
          { key: 'Inactive',        label: 'Inactive',         count: counts.inactive },
          { key: 'needs-attention', label: 'Needs attention',  count: counts.needsAttention },
          { key: 'warehouse-level', label: 'Warehouse-Level',  count: counts.warehouseLevel },
          { key: 'bin-level',       label: 'Location/BIN',     count: counts.binLevel },
          { key: 'shared',          label: 'Shared',           count: counts.shared },
          { key: 'my-branch',       label: 'My branch',        count: counts.myBranch },
        ]}
        activeQuickFilter={filters.quickFilter}
        onQuickFilterChange={(key) => setFilters((f) => ({ ...f, quickFilter: key }))}
        advancedFilterActive={hasAdvanced}
        onAdvancedFilterClick={() => { setDraftFilters(filters); setShowAdvFilter((v) => !v); }}
        toolbarActions={toolbarActions}
        helpTopicId="warehouse-master-overview"
        onHelpClick={() => setHelpOpen(true)}
      >
        {loadError && (
          <div style={{ padding: '10px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#92400E' }}>
            {loadError}
          </div>
        )}

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '1180px' }}>
              {tableHeader}
              {tableBody}
            </div>
          </div>

          {filtered.length > 0 && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {selectedIds.size > 0 && (
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selectedIds.size} selected
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                Showing{' '}
                <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filtered.length}</strong>
                {' '}of{' '}
                <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{warehouses.length}</strong>
                {' '}{warehouses.length === 1 ? 'warehouse' : 'warehouses'}
              </span>
            </div>
          )}
        </div>
      </AdminListPageShell>

      {/* ── Preview Drawer ─────────────────────────────────── */}
      <WarehousePreviewDrawer
        warehouseId={previewId}
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewId(null); }}
        onBlockRequested={openBlock}
        onInactivateRequested={openInactivate}
      />

      {/* ── Block Confirm ──────────────────────────────────── */}
      <WarehouseControlledActionDrawer
        open={blockOpen}
        plan={blockTarget ? {
          kind: 'Block',
          title: 'Block Warehouse',
          summary: 'Blocking this warehouse will prevent new inventory transactions while preserving visibility and history.',
          impactSummary: [
            `${blockTarget.warehouseName} (${blockTarget.warehouseCode})`,
            'New inventory posting will be blocked.',
            'Existing history remains available for review.',
          ],
          approvalRequired: false,
          checklist: [
            { id: 'reason-code', label: 'Reason code captured', passed: Boolean(blockReasonCode), detail: 'Select why the warehouse is being blocked.' },
            { id: 'reason-description', label: 'Explanation captured', passed: Boolean(blockReasonDescription.trim()), detail: 'Add operational context for audit history.' },
            { id: 'effective-date', label: 'No effective date required', passed: true },
          ],
          consequenceNote: 'The warehouse remains searchable but transactions will be blocked until it is unblocked.',
          request: {
            action: 'Block',
            reasonCode: blockReasonCode,
            reasonDescription: blockReasonDescription,
            effectiveDate: blockEffectiveDate || undefined,
            approvalRequired: false,
          },
        } : null}
        reasonCode={blockReasonCode}
        reasonDescription={blockReasonDescription}
        effectiveDate={blockEffectiveDate}
        saving={blockLoading}
        onClose={closeBlockDrawer}
        onReasonCodeChange={setBlockReasonCode}
        onReasonDescriptionChange={setBlockReasonDescription}
        onEffectiveDateChange={setBlockEffectiveDate}
        onConfirm={confirmBlock}
        reasonCodeOptions={getReasonCodesForAction('Block')}
      />

      <WarehouseControlledActionDrawer
        open={inactivateOpen}
        plan={inactivateTarget ? {
          kind: 'Inactivate',
          title: 'Inactivate Warehouse',
          summary: 'Inactivation retires the warehouse from active use and requires approval routing.',
          impactSummary: [
            `${inactivateTarget.warehouseName} (${inactivateTarget.warehouseCode})`,
            'New warehouse activity will be stopped.',
            'Operations Governance approval is required before completion.',
          ],
          approvalRequired: true,
          approverRoute: 'Operations Governance',
          checklist: [
            { id: 'reason-code', label: 'Reason code captured', passed: Boolean(inactivateReasonCode), detail: 'Select the governance reason for inactivation.' },
            { id: 'reason-description', label: 'Explanation captured', passed: Boolean(inactivateReasonDescription.trim()), detail: 'Add business context for the approval route.' },
            { id: 'effective-date', label: 'Effective date provided where applicable', passed: Boolean(inactivateEffectiveDate), detail: 'Choose when the inactivation should take effect.' },
          ],
          consequenceNote: 'Historical data remains available, and the warehouse can be reactivated later if governance approves it.',
          request: {
            action: 'Inactivate',
            reasonCode: inactivateReasonCode,
            reasonDescription: inactivateReasonDescription,
            effectiveDate: inactivateEffectiveDate || undefined,
            approvalRequired: true,
            approvalRoute: 'Operations Governance',
          },
        } : null}
        reasonCode={inactivateReasonCode}
        reasonDescription={inactivateReasonDescription}
        effectiveDate={inactivateEffectiveDate}
        saving={inactivateLoading}
        onClose={closeInactivateDrawer}
        onReasonCodeChange={setInactivateReasonCode}
        onReasonDescriptionChange={setInactivateReasonDescription}
        onEffectiveDateChange={setInactivateEffectiveDate}
        onConfirm={confirmInactivate}
        reasonCodeOptions={getReasonCodesForAction('Inactivate')}
      />

      <SmartReviewDrawer
        open={false}
        onClose={() => { setBlockOpen(false); setBlockTarget(null); setBlockReason(''); }}
        title="Block Warehouse"
        subtitle={blockTarget ? `${blockTarget.warehouseName} (${blockTarget.warehouseCode})` : undefined}
        description="Blocking this warehouse will prevent new inventory transactions. Existing open transactions are not affected."
        checklist={[
          { id: 'reason', label: 'A reason has been provided.', passed: blockReason.trim().length > 0 },
        ]}
        warningText={!blockReason.trim() ? 'A reason is required to block this warehouse.' : undefined}
        consequenceNote="The warehouse remains searchable but transactions will be blocked. You can unblock it later."
        confirmLabel="Block Warehouse"
        confirmDisabled={!blockReason.trim() || blockLoading}
        loading={blockLoading}
        onConfirm={confirmBlock}
        onCancel={() => { setBlockOpen(false); setBlockTarget(null); setBlockReason(''); }}
        summaryFields={[
          {
            label: 'Reason',
            value: (
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
                placeholder="Describe why this warehouse is being blocked…"
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px',
                  border: `1px solid ${blockReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
                  borderRadius: '8px', background: 'var(--color-surface)',
                  color: 'var(--color-text)', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.6, marginTop: '4px',
                }}
              />
            ),
          },
        ]}
      />

      {/* ── Inactivate Confirm ─────────────────────────────── */}
      <SmartReviewDrawer
        open={false}
        onClose={() => { setInactivateOpen(false); setInactivateTarget(null); setInactivateReason(''); }}
        title="Inactivate Warehouse"
        subtitle={inactivateTarget ? `${inactivateTarget.warehouseName} (${inactivateTarget.warehouseCode})` : undefined}
        description="Inactivating this warehouse will prevent any new activity. This action requires approval if there is open stock."
        checklist={[
          { id: 'reason', label: 'A reason has been provided.', passed: inactivateReason.trim().length > 0 },
        ]}
        warningText={!inactivateReason.trim() ? 'A reason is required to inactivate this warehouse.' : undefined}
        consequenceNote="Inactivated warehouses can be reactivated if needed. Historical data is preserved."
        confirmLabel="Inactivate Warehouse"
        confirmDisabled={!inactivateReason.trim() || inactivateLoading}
        loading={inactivateLoading}
        onConfirm={confirmInactivate}
        onCancel={() => { setInactivateOpen(false); setInactivateTarget(null); setInactivateReason(''); }}
        summaryFields={[
          {
            label: 'Reason',
            value: (
              <textarea
                value={inactivateReason}
                onChange={(e) => setInactivateReason(e.target.value)}
                rows={3}
                placeholder="Describe why this warehouse is being inactivated…"
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px',
                  border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
                  borderRadius: '8px', background: 'var(--color-surface)',
                  color: 'var(--color-text)', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.6, marginTop: '4px',
                }}
              />
            ),
          },
        ]}
      />

      {/* ── Help Drawer ────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('warehouse-master-overview')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default WarehouseListPage;
