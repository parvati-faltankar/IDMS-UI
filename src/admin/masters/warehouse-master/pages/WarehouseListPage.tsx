import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Edit2, Eye, Filter, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  createMasterIdentifierColumn,
  MasterDataTable,
  MasterTableMetric,
  MasterTableRowActions,
  MasterTableTextCell,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
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

export function filterWarehouseSummaries(
  warehouses: WarehouseSummary[],
  search: string,
  filters: FilterState,
): WarehouseSummary[] {
  const query = search.trim().toLowerCase();

  return warehouses.filter((warehouse) => {
    switch (filters.quickFilter) {
      case 'Active': if (warehouse.status !== 'Active') return false; break;
      case 'Draft': if (warehouse.status !== 'Draft') return false; break;
      case 'Blocked': if (warehouse.status !== 'Blocked') return false; break;
      case 'Inactive': if (warehouse.status !== 'Inactive') return false; break;
      case 'needs-attention': if (warehouse.setupHealth === 'complete') return false; break;
      case 'warehouse-level': if (warehouse.inventoryControlMode !== 'Warehouse-Level') return false; break;
      case 'bin-level': if (warehouse.inventoryControlMode !== 'Location-BIN-Level') return false; break;
      case 'shared': if (warehouse.ownershipScope !== 'Organization') return false; break;
      case 'my-branch': if (warehouse.ownershipScope !== 'Branch') return false; break;
    }

    if (filters.warehouseType && warehouse.warehouseType !== filters.warehouseType) return false;
    if (filters.wmsEnabled === 'yes' && !warehouse.wmsEnabled) return false;
    if (filters.wmsEnabled === 'no' && warehouse.wmsEnabled) return false;

    if (query) {
      const haystack = [
        warehouse.warehouseCode,
        warehouse.warehouseName,
        warehouse.owningCode ?? '',
        warehouse.warehouseType,
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export interface RowAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
  danger?: boolean;
}

export function deriveRowActions(
  warehouse: WarehouseSummary,
  onEdit: () => void,
  onStartConfigureOrActivate: () => void,
  onActivateOrBlock: () => void,
  onBlockOrInactivate: () => void,
  onInactivateMaybe?: () => void,
): RowAction[] {
  const onStartConfigure = onInactivateMaybe ? onStartConfigureOrActivate : onEdit;
  const onActivate = onInactivateMaybe ? onActivateOrBlock : onStartConfigureOrActivate;
  const onBlock = onInactivateMaybe ? onBlockOrInactivate : onActivateOrBlock;
  const onInactivate = onInactivateMaybe ?? onBlockOrInactivate;
  const actions: RowAction[] = [];

  actions.push({
    key: 'edit',
    label: 'Edit',
    icon: <Edit2 size={13} />,
    disabled: false,
    onClick: onEdit,
  });

  if (warehouse.setupHealth !== 'complete') {
    actions.push({
      key: 'start-configure',
      label: 'Start Configure',
      icon: <Check size={13} />,
      disabled: false,
      onClick: onStartConfigure,
    });
  }

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

const START_CONFIGURE_BUTTON_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '30px',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-primary)',
  background: 'color-mix(in srgb, var(--color-primary) 7%, white)',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const WarehouseListPage: React.FC = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [blockTarget, setBlockTarget] = useState<{ id: string; warehouseCode: string; warehouseName: string } | null>(null);
  const [blockReasonCode, setBlockReasonCode] = useState('');
  const [blockReasonDescription, setBlockReasonDescription] = useState('');
  const [blockEffectiveDate, setBlockEffectiveDate] = useState('');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const [inactivateTarget, setInactivateTarget] = useState<{ id: string; warehouseCode: string; warehouseName: string } | null>(null);
  const [inactivateReasonCode, setInactivateReasonCode] = useState('');
  const [inactivateReasonDescription, setInactivateReasonDescription] = useState('');
  const [inactivateEffectiveDate, setInactivateEffectiveDate] = useState('');
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [inactivateLoading, setInactivateLoading] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key,
        label: master.label,
        path: master.path,
        groupLabel: group.label,
        groupIconBg: group.iconBg,
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

  async function reload() {
    const result = await warehouseMockAdapter.listWarehouses({ page: 1, pageSize: 200 });
    setWarehouses(result.items);
  }

  const filtered = useMemo(
    () => filterWarehouseSummaries(warehouses, search, filters),
    [warehouses, search, filters],
  );

  const warehouseTypeOptions = useMemo(
    () => Array.from(new Set(warehouses.map((warehouse) => warehouse.warehouseType))).sort(),
    [warehouses],
  );

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

  const gridColumns: DataGridColumn<WarehouseSummary>[] = [
    createMasterIdentifierColumn<WarehouseSummary>({
      id: 'warehouseCode',
      label: 'Code',
      getValue: (warehouse) => warehouse.warehouseCode,
      onClick: (warehouse) => openPreview(warehouse.id),
      width: 138,
      minWidth: 124,
    }),
    {
      id: 'warehouseName',
      label: 'Warehouse',
      type: 'text',
      width: 240,
      minWidth: 210,
      getValue: (warehouse) => warehouse.warehouseName,
      renderCell: (warehouse) => (
        <MasterTableTextCell
          primary={warehouse.warehouseName}
          secondary={warehouse.wmsEnabled ? 'WMS enabled' : undefined}
          title={warehouse.warehouseName}
        />
      ),
    },
    {
      id: 'ownershipScope',
      label: 'Scope',
      type: 'text',
      width: 126,
      minWidth: 114,
      getValue: (warehouse) => warehouse.ownershipScope,
      renderCell: (warehouse) => <WarehouseScopeBadge scope={warehouse.ownershipScope} size="sm" />,
    },
    {
      id: 'owningCode',
      label: 'Owning Entity',
      type: 'text',
      width: 176,
      minWidth: 150,
      getValue: (warehouse) => warehouse.owningCode ?? '-',
      renderCell: (warehouse) => <MasterTableTruncate value={warehouse.owningCode ?? '-'} />,
    },
    {
      id: 'warehouseType',
      label: 'Type',
      type: 'text',
      width: 138,
      minWidth: 124,
      getValue: (warehouse) => warehouse.warehouseType,
      renderCell: (warehouse) => <MasterTableTruncate value={warehouse.warehouseType} />,
    },
    {
      id: 'inventoryControlMode',
      label: 'Mode',
      type: 'text',
      width: 162,
      minWidth: 144,
      getValue: (warehouse) => warehouse.inventoryControlMode,
      renderCell: (warehouse) => <WarehouseModeBadge mode={warehouse.inventoryControlMode} size="sm" />,
    },
    {
      id: 'branchCount',
      label: 'Branches',
      type: 'number',
      width: 104,
      minWidth: 94,
      getValue: (warehouse) => warehouse.branchCount,
      renderCell: (warehouse) => (
        warehouse.branchCount > 0
          ? <MasterTableMetric value={String(warehouse.branchCount)} tone="success" />
          : <MasterTableTruncate value="-" />
      ),
    },
    {
      id: 'locationBinCount',
      label: 'Locs / BINs',
      type: 'text',
      width: 132,
      minWidth: 118,
      getValue: (warehouse) => warehouse.locationCount > 0 ? `${warehouse.locationCount} / ${warehouse.activeBinCount}` : '-',
      renderCell: (warehouse) => (
        <MasterTableTruncate value={warehouse.locationCount > 0 ? `${warehouse.locationCount} / ${warehouse.activeBinCount}` : '-'} />
      ),
    },
    {
      id: 'setupHealth',
      label: 'Setup Health',
      type: 'text',
      width: 132,
      minWidth: 120,
      getValue: (warehouse) => warehouse.setupHealth,
      renderCell: (warehouse) => <WarehouseSetupHealth tone={warehouse.setupHealth} compact={false} showLabel={false} />,
    },
    {
      id: 'status',
      label: 'Status',
      type: 'text',
      width: 118,
      minWidth: 106,
      getValue: (warehouse) => warehouse.status,
      renderCell: (warehouse) => <WarehouseStatusBadge status={warehouse.status} size="sm" />,
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      type: 'text',
      width: 128,
      minWidth: 116,
      getValue: (warehouse) => warehouse.updatedAt,
      renderCell: (warehouse) => <MasterTableTruncate value={formatDate(warehouse.updatedAt)} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 218,
      minWidth: 198,
      defaultPin: 'right',
      getValue: (warehouse) => warehouse.id,
      renderCell: (warehouse) => {
        const showStartConfigure = warehouse.setupHealth !== 'complete';
        const actions = deriveRowActions(
          warehouse,
          () => navigate(WAREHOUSE_ROUTES.setup(warehouse.id)),
          () => navigate(WAREHOUSE_ROUTES.setup(warehouse.id)),
          () => { showToast('Activation wizard coming in Phase 3.', 'success'); },
          () => openBlock(warehouse),
          () => openInactivate(warehouse),
        );

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            {showStartConfigure ? (
              <button
                type="button"
                onClick={() => navigate(WAREHOUSE_ROUTES.setup(warehouse.id))}
                style={START_CONFIGURE_BUTTON_STYLE}
              >
                Start Configure
              </button>
            ) : null}
            <MasterTableRowActions
              rowLabel={warehouse.warehouseCode}
              inlineAction={{
                label: 'Edit warehouse',
                onClick: () => navigate(WAREHOUSE_ROUTES.setup(warehouse.id)),
                icon: <Edit2 size={13} />,
              }}
              menuActions={[
                {
                  label: 'Preview',
                  onSelect: () => openPreview(warehouse.id),
                  icon: <Eye size={13} />,
                },
                ...actions
                  .filter((action) => action.key !== 'edit' && action.key !== 'start-configure')
                  .map((action) => ({
                    label: action.label,
                    onSelect: action.onClick,
                    icon: action.icon,
                    disabled: action.disabled,
                    tone: action.danger ? 'danger' as const : 'default' as const,
                  })),
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <AdminShell>
      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      ) : null}

      <AdminListPageShell
        title="Warehouse Master"
        primaryAction={{ label: 'New Warehouse', onClick: () => navigate(WAREHOUSE_ROUTES.create) }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvancedFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: Boolean(filters.quickFilter !== 'all' || filters.warehouseType || filters.wmsEnabled),
        }]}
        searchValue={search}
        searchPlaceholder="Search by code, name, owning entity, type..."
        onSearchChange={setSearch}
        helpTopicId="warehouse-master-overview"
        onHelpClick={() => setHelpOpen(true)}
      >
        {loadError ? (
          <div style={{ padding: '10px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#92400E' }}>
            {loadError}
          </div>
        ) : null}

        {loadState === 'loading' ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            Loading warehouses...
          </div>
        ) : (
          <MasterDataTable
            gridId="warehouse-master-table"
            ariaLabel="Warehouses table"
            rows={filtered}
            columns={gridColumns}
            rowId={(warehouse) => warehouse.id}
            totalCount={warehouses.length}
            countLabel={warehouses.length === 1 ? 'warehouse' : 'warehouses'}
            emptyState={{
              title: warehouses.length === 0 ? 'No warehouses configured yet' : 'No warehouses match the current filters',
              description: warehouses.length === 0
                ? 'Create your first warehouse to get started.'
                : 'Try adjusting your search or filters.',
              ...(warehouses.length === 0
                ? { action: { label: 'New Warehouse', onClick: () => navigate(WAREHOUSE_ROUTES.create) } }
                : {}),
            }}
          />
        )}
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onReset={() => setFilters(EMPTY_FILTERS)}
        description="Filter warehouses by lifecycle view, warehouse type, and WMS enablement."
        fields={[
          {
            id: 'warehouse-status',
            label: 'Status',
            value: filters.quickFilter === 'all' ? '' : filters.quickFilter,
            placeholder: 'All statuses',
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Blocked', label: 'Blocked' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'needs-attention', label: 'Needs Attention' },
            ],
            onChange: (value) => setFilters((current) => ({ ...current, quickFilter: value || 'all' })),
          },
          {
            id: 'warehouse-type',
            label: 'Warehouse Type',
            value: filters.warehouseType,
            placeholder: 'All types',
            options: warehouseTypeOptions.map((type) => ({ value: type, label: type })),
            onChange: (value) => setFilters((current) => ({ ...current, warehouseType: value })),
          },
          {
            id: 'warehouse-wms',
            label: 'WMS Enabled',
            value: filters.wmsEnabled,
            placeholder: 'All values',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ],
            onChange: (value) => setFilters((current) => ({ ...current, wmsEnabled: value as '' | 'yes' | 'no' })),
          },
        ]}
      />

      <WarehousePreviewDrawer
        warehouseId={previewId}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewId(null);
        }}
        onBlockRequested={openBlock}
        onInactivateRequested={openInactivate}
      />

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

      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('warehouse-master-overview')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default WarehouseListPage;
