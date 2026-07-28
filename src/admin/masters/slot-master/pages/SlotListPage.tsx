import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Filter } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { SlotRecord, SlotStatus } from '../types/slotMaster.types';
import { SLOT_STATUS_META, MASTER_KEY, MOCK_BRANCH, TRANSACTION_ENTITIES } from '../constants/slotMaster.constants';
import { slotService } from '../services/slotService';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableMetric,
  MasterTablePill,
  MasterTableTextCell,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';

function buildPreview(slot: SlotRecord): PreviewSection[] {
  return [
    {
      title: 'General',
      fields: [
        { label: 'Slot Code', value: slot.slotCode, mono: true },
        { label: 'Name', value: slot.name },
        { label: 'Display Name', value: slot.displayName || '-' },
        { label: 'Entity', value: slot.entity || '-' },
        { label: 'Branch', value: MOCK_BRANCH.name },
        { label: 'Status', value: slot.status },
      ],
    },
    {
      title: 'Schedule',
      fields: [
        { label: 'Start Date', value: slot.startDate || '-' },
        { label: 'End Date', value: slot.endDate || '-' },
        { label: 'Start Time', value: slot.slotStartTime || '-', mono: true },
        { label: 'End Time', value: slot.slotEndTime || '-', mono: true },
        { label: 'Duration', value: slot.slotDurationMin ? `${slot.slotDurationMin} min` : '-' },
        { label: 'Time Gap', value: slot.timeGapMin ? `${slot.timeGapMin} min` : '0 min' },
        { label: 'Active Days', value: slot.activeDays.join(', ') || '-' },
        { label: 'Daily Slots', value: String(slot.dailySlotCount) },
        { label: 'Total Slots', value: String(slot.totalSlotCount) },
        { label: 'Total Days', value: String(slot.totalDays) },
      ],
    },
    ...(slot.taggedEmployees.length > 0
      ? [{
          title: `Tagged Employees (${slot.taggedEmployees.length})`,
          fields: slot.taggedEmployees.map((employee) => ({
            label: employee.employeeName,
            value: employee.role,
          })),
        }]
      : []),
    ...(slot.description
      ? [{
          title: 'Description',
          fields: [{ label: 'Description', value: slot.description, span: 2 as const }],
        }]
      : []),
  ];
}

function previewStatusTone(status: SlotStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

const SlotListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<SlotRecord[]>(() => slotService.getAll());
  const [searchQuery, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [previewSlot, setPreviewSlot] = useState<SlotRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [activateTarget, setActivateTarget] = useState<SlotRecord | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [inactivateTarget, setInactivateTarget] = useState<SlotRecord | null>(null);
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SlotRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter((record) => {
      if (filterStatus && record.status !== filterStatus) return false;
      if (filterEntity && record.entity !== filterEntity) return false;
      if (query) {
        const haystack = `${record.slotCode} ${record.name} ${record.displayName} ${record.entity} ${record.description}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterEntity]);

  const hasFilters = Boolean(filterStatus || filterEntity);

  function confirmActivate() {
    if (!activateTarget) return;
    slotService.activate(activateTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === activateTarget.id) {
      setPreviewSlot(slotService.getById(activateTarget.id) ?? null);
    }
    setActivateOpen(false);
    showToast(`"${activateTarget.name}" activated.`, 'success');
    setActivateTarget(null);
  }

  function confirmInactivate() {
    if (!inactivateTarget) return;
    slotService.inactivate(inactivateTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === inactivateTarget.id) {
      setPreviewSlot(slotService.getById(inactivateTarget.id) ?? null);
    }
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.name}" marked inactive.`, 'success');
    setInactivateTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    slotService.delete(deleteTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === deleteTarget.id) setPreviewOpen(false);
    setDeleteOpen(false);
    showToast(`"${deleteTarget.name}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  const gridColumns: DataGridColumn<SlotRecord>[] = [
    createMasterIdentifierColumn<SlotRecord>({
      id: 'slotCode',
      label: 'Code',
      getValue: (record) => record.slotCode,
      onClick: (record) => {
        setPreviewSlot(record);
        setPreviewOpen(true);
      },
      width: 106,
      minWidth: 96,
    }),
    createMasterTextColumn<SlotRecord>({
      id: 'name',
      label: 'Name',
      primary: (record) => record.name,
      secondary: (record) => record.displayName && record.displayName !== record.name ? record.displayName : undefined,
      width: 220,
      minWidth: 180,
      hideable: false,
    }),
    {
      id: 'entity',
      label: 'Entity',
      type: 'text',
      width: 146,
      minWidth: 126,
      getValue: (record) => record.entity,
      renderCell: (record) => <MasterTablePill label={record.entity || '-'} tone="info" />,
    },
    {
      id: 'branch',
      label: 'Branch',
      type: 'text',
      width: 132,
      minWidth: 120,
      getValue: () => MOCK_BRANCH.name,
      renderCell: () => <MasterTableTruncate value={MOCK_BRANCH.name} />,
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'text',
      width: 200,
      minWidth: 178,
      getValue: (record) => `${record.startDate || '-'} ${record.endDate || '-'}`,
      renderCell: (record) => (
        <MasterTableTextCell
          primary={`${record.startDate || '-'} -> ${record.endDate || '-'}`}
          secondary={`${record.slotStartTime || '-'} - ${record.slotEndTime || '-'}`}
        />
      ),
    },
    {
      id: 'dailySlotCount',
      label: 'Daily',
      type: 'number',
      width: 92,
      minWidth: 84,
      getValue: (record) => record.dailySlotCount,
      renderCell: (record) => <MasterTableMetric value={String(record.dailySlotCount)} />,
    },
    {
      id: 'totalSlotCount',
      label: 'Total',
      type: 'number',
      width: 92,
      minWidth: 84,
      getValue: (record) => record.totalSlotCount,
      renderCell: (record) => <MasterTableMetric value={String(record.totalSlotCount)} tone={record.totalSlotCount > 0 ? 'success' : 'default'} />,
    },
    {
      id: 'employees',
      label: 'Employees',
      type: 'number',
      width: 118,
      minWidth: 104,
      getValue: (record) => record.taggedEmployees.length,
      renderCell: (record) => (
        <MasterTableTruncate
          value={record.taggedEmployees.length > 0 ? `${record.taggedEmployees.length} tagged` : '-'}
        />
      ),
    },
    createMasterStatusColumn<SlotRecord>({
      getStatus: (record) => record.status,
      getTone: (status) =>
        status === 'Active' ? 'success' : status === 'Inactive' ? 'danger' : 'neutral',
      width: 126,
      minWidth: 112,
      options: ['Draft', 'Active', 'Inactive'],
    }),
    createMasterActionsColumn<SlotRecord>({
      rowLabel: (record) => record.slotCode,
      inlineAction: (record) => ({
        label: 'Edit slot',
        onClick: () => navigate(`/admin/master/slot-master/${record.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (record) => [
        {
          label: 'Preview details',
          onSelect: () => {
            setPreviewSlot(record);
            setPreviewOpen(true);
          },
          icon: <Eye size={13} />,
        },
        {
          label: 'Edit slot',
          onSelect: () => navigate(`/admin/master/slot-master/${record.id}`),
          icon: <Edit2 size={13} />,
        },
        ...(record.status === 'Draft'
          ? [{
              label: 'Activate',
              onSelect: () => {
                setActivateTarget(record);
                setActivateOpen(true);
              },
              dividerBefore: true,
            }]
          : []),
        ...(record.status === 'Active'
          ? [{
              label: 'Deactivate',
              onSelect: () => {
                setInactivateTarget(record);
                setInactivateOpen(true);
              },
              tone: 'warning' as const,
              dividerBefore: true,
            }]
          : []),
        ...(record.status === 'Draft'
          ? [{
              label: 'Delete',
              onSelect: () => {
                setDeleteTarget(record);
                setDeleteOpen(true);
              },
              tone: 'danger' as const,
            }]
          : []),
      ],
    }),
  ];

  return (
    <AdminShell>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: toast.tone === 'success' ? '#111827' : '#DC2626',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Slot Master"
        description="Manage appointment and scheduling slots across entities and branches."
        breadcrumbs={['Admin', 'Location & Territory', 'Slot Master']}
        primaryAction={{ label: '+ New Slot', onClick: () => navigate('/admin/master/slot-master/new') }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code, name, entity..."
        helpTopicId="slot-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        <MasterDataTable
          gridId="slot-master-table"
          ariaLabel="Slots table"
          rows={filtered}
          columns={gridColumns}
          rowId={(record) => record.id}
          totalCount={records.length}
          emptyState={{
            title: records.length === 0 ? 'No slot configurations yet' : 'No slots match the current filters',
            description: records.length === 0
              ? 'Create slot configurations to manage appointment scheduling across entities and branches.'
              : 'Try adjusting your search or filters.',
            ...(records.length === 0
              ? { action: { label: 'New Slot', onClick: () => navigate('/admin/master/slot-master/new') } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterEntity('');
        }}
        description="Filter slots by lifecycle status and transaction entity."
        fields={[
          {
            id: 'slot-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: setFilterStatus,
          },
          {
            id: 'slot-entity',
            label: 'Entity',
            value: filterEntity,
            placeholder: 'All entities',
            options: TRANSACTION_ENTITIES.map((entity) => ({ value: entity, label: entity })),
            onChange: setFilterEntity,
          },
        ]}
      />

      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewSlot?.name ?? ''}
        subtitle={previewSlot?.slotCode}
        statusLabel={previewSlot?.status}
        statusTone={previewSlot ? previewStatusTone(previewSlot.status) : undefined}
        sections={previewSlot ? buildPreview(previewSlot) : []}
        primaryAction={{ label: 'Edit Slot', onClick: () => { setPreviewOpen(false); navigate(`/admin/master/slot-master/${previewSlot?.id}`); } }}
      />

      <HelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        topic={getHelpTopic('slot-master') ?? getHelpTopic('generic-master')}
      />

      {activateOpen && activateTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Activate Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{activateTarget.name}</strong>" will be marked Active. Generated slots will become visible to users.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActivateOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmActivate} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#15803D', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Activate</button>
            </div>
          </div>
        </div>
      )}

      {inactivateOpen && inactivateTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Deactivate Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{inactivateTarget.name}</strong>" will be marked Inactive. Generated slots will be hidden from users.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInactivateOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmInactivate} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>Delete Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{deleteTarget.name}</strong>" will be permanently deleted. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default SlotListPage;
