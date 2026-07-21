import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Edit2, Eye, Filter, Trash2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableBooleanValue,
  MasterTablePill,
  MasterTableTagList,
  MasterTableTextCell,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import type { AreaLevel, AreaLevelRole, AreaLevelStatus } from '../types/areaMaster.types';
import { areaLevelService } from '../services/areaLevelService';
import { canDeleteAreaLevel } from '../utils/areaLevelUsage';
import { validateAreaLevelForActivation } from '../utils/areaLevelValidation';
import { AREA_LEVEL_ROLES } from '../constants/areaMaster.constants';

const MASTER_KEY = 'area-master';

function buildLevelPreviewSections(level: AreaLevel, allLevels: AreaLevel[]): PreviewSection[] {
  const allowedParentNames = level.allowedParentLevelIds.length > 0
    ? level.allowedParentLevelIds.map((id) => allLevels.find((candidate) => candidate.id === id)?.areaLevelName ?? id).join(', ')
    : 'None';

  return [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Code', value: level.areaLevelCode, mono: true },
        { label: 'Name', value: level.areaLevelName },
        { label: 'Display Name', value: level.displayName || '-' },
        { label: 'Short Code', value: level.shortCode || '-', mono: true },
        { label: 'Level Sequence', value: level.levelSequence ? String(level.levelSequence) : '-' },
        { label: 'Role', value: level.areaLevelRole || '-' },
      ],
    },
    {
      title: 'Parent Configuration',
      fields: [
        { label: 'Parent Required', value: level.parentRequired ? 'Yes' : 'No' },
        { label: 'Allowed Parent Levels', value: allowedParentNames, span: 2 },
      ],
    },
    {
      title: 'Usage Tags',
      fields: [
        { label: 'Allowed', value: level.allowedUsageTags.join(', ') || 'None', span: 2 },
        { label: 'Default', value: level.defaultUsageTags.join(', ') || 'None', span: 2 },
        { label: 'Mandatory', value: level.mandatoryUsageTags.join(', ') || 'None', span: 2 },
      ],
    },
    ...(level.description || level.remarks
      ? [{
          title: 'Notes',
          fields: [
            ...(level.description ? [{ label: 'Description', value: level.description, span: 2 as const }] : []),
            ...(level.remarks ? [{ label: 'Remarks', value: level.remarks, span: 2 as const }] : []),
          ],
        }]
      : []),
  ];
}

function getPreviewStatusTone(status?: AreaLevelStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

function getRoleTone(role: AreaLevelRole): 'neutral' | 'info' {
  return role ? 'info' : 'neutral';
}

const AreaLevelListPage: React.FC = () => {
  const navigate = useNavigate();

  const [levels, setLevels] = useState<AreaLevel[]>(() => areaLevelService.getAll());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activateTarget, setActivateTarget] = useState<AreaLevel | null>(null);
  const [activateErrors, setActivateErrors] = useState<string[]>([]);
  const [activateOpen, setActivateOpen] = useState(false);

  const [inactivateTarget, setInactivateTarget] = useState<AreaLevel | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen, setInactivateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AreaLevel | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [previewLevel, setPreviewLevel] = useState<AreaLevel | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return levels.filter((level) => {
      if (filterStatus && level.status !== filterStatus) return false;
      if (filterRole && level.areaLevelRole !== filterRole) return false;

      if (query) {
        const haystack = `${level.areaLevelCode} ${level.areaLevelName} ${level.displayName} ${level.shortCode}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [levels, searchQuery, filterStatus, filterRole]);

  function handleQuickFilter(key: string) {
    setFilterStatus(key === 'all' ? '' : key);
  }

  function handleActivateClick(level: AreaLevel) {
    const allLevels = areaLevelService.getAll();
    const others = allLevels.filter((candidate) => candidate.id !== level.id);
    const errors = validateAreaLevelForActivation(level, others);
    setActivateTarget(level);
    setActivateErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    areaLevelService.activate(activateTarget.id);
    setLevels(areaLevelService.getAll());
    if (previewLevel?.id === activateTarget.id) {
      setPreviewLevel(areaLevelService.getById(activateTarget.id) ?? null);
    }
    setActivateOpen(false);
    setActivateTarget(null);
    setActivateErrors([]);
    showToast(`"${activateTarget.areaLevelName}" activated successfully.`, 'success');
  }

  function handleInactivateClick(level: AreaLevel) {
    setInactivateTarget(level);
    setInactivateReason('');
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget || !inactivateReason.trim()) return;
    areaLevelService.inactivate(inactivateTarget.id, inactivateReason.trim());
    setLevels(areaLevelService.getAll());
    if (previewLevel?.id === inactivateTarget.id) {
      setPreviewLevel(areaLevelService.getById(inactivateTarget.id) ?? null);
    }
    setInactivateOpen(false);
    setInactivateTarget(null);
    setInactivateReason('');
    showToast(`"${inactivateTarget.areaLevelName}" inactivated.`, 'success');
  }

  function handleDeleteClick(level: AreaLevel) {
    setDeleteTarget(level);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    areaLevelService.delete(deleteTarget.id);
    setLevels(areaLevelService.getAll());
    if (previewLevel?.id === deleteTarget.id) {
      setPreviewOpen(false);
      setPreviewLevel(null);
    }
    setDeleteOpen(false);
    showToast(`"${deleteTarget.areaLevelName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  function handlePreviewClick(level: AreaLevel) {
    setPreviewLevel(level);
    setPreviewOpen(true);
  }

  const hasFilters = Boolean(filterStatus || filterRole);

  const gridColumns: DataGridColumn<AreaLevel>[] = [
    createMasterIdentifierColumn<AreaLevel>({
      id: 'areaLevelCode',
      label: 'Code',
      getValue: (level) => level.areaLevelCode,
      onClick: handlePreviewClick,
      width: 132,
      minWidth: 120,
    }),
    createMasterTextColumn<AreaLevel>({
      id: 'areaLevelName',
      label: 'Name',
      primary: (level) => level.areaLevelName,
      secondary: (level) => level.description || undefined,
      title: (level) => level.areaLevelName,
      width: 240,
      minWidth: 220,
      hideable: false,
    }),
    {
      id: 'displayShort',
      label: 'Display / Short',
      type: 'text',
      width: 190,
      minWidth: 168,
      getValue: (level) => `${level.displayName || '-'} ${level.shortCode || ''}`.trim(),
      renderCell: (level) => (
        <MasterTableTextCell
          primary={level.displayName || '-'}
          secondary={level.shortCode || undefined}
          title={level.displayName || level.areaLevelName}
        />
      ),
    },
    {
      id: 'levelSequence',
      label: 'Seq',
      type: 'number',
      width: 92,
      minWidth: 84,
      getValue: (level) => level.levelSequence ?? 0,
      renderCell: (level) => <MasterTableTruncate value={level.levelSequence ? String(level.levelSequence) : '-'} />,
    },
    {
      id: 'areaLevelRole',
      label: 'Role',
      type: 'text',
      width: 170,
      minWidth: 150,
      getValue: (level) => level.areaLevelRole || '-',
      renderCell: (level) => (
        level.areaLevelRole
          ? <MasterTablePill label={level.areaLevelRole} tone={getRoleTone(level.areaLevelRole)} />
          : <MasterTableTruncate value="-" />
      ),
    },
    {
      id: 'parentRequired',
      label: 'Parent Req.',
      type: 'boolean',
      width: 142,
      minWidth: 128,
      getValue: (level) => level.parentRequired,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      renderCell: (level) => <MasterTableBooleanValue value={level.parentRequired} />,
    },
    {
      id: 'allowedUsageTags',
      label: 'Usage Tags',
      type: 'text',
      width: 196,
      minWidth: 168,
      getValue: (level) => level.allowedUsageTags.join(', '),
      renderCell: (level) => <MasterTableTagList labels={level.allowedUsageTags} />,
    },
    createMasterStatusColumn<AreaLevel>({
      getStatus: (level) => level.status,
      width: 128,
      minWidth: 116,
    }),
    createMasterActionsColumn<AreaLevel>({
      rowLabel: (level) => level.areaLevelName,
      inlineAction: (level) => ({
        label: 'Edit area level',
        onClick: () => navigate(`/admin/area-levels/${level.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (level) => {
        const canDelete = level.status === 'Draft' && canDeleteAreaLevel(level.id);

        return [
          {
            label: 'Preview',
            onSelect: () => handlePreviewClick(level),
            icon: <Eye size={13} />,
          },
          {
            label: 'Edit',
            onSelect: () => navigate(`/admin/area-levels/${level.id}`),
            icon: <Edit2 size={13} />,
          },
          {
            label: 'Activate',
            onSelect: () => handleActivateClick(level),
            icon: <Check size={13} />,
            hidden: level.status !== 'Draft',
          },
          {
            label: 'Inactivate',
            onSelect: () => handleInactivateClick(level),
            icon: <X size={13} />,
            hidden: level.status !== 'Active',
          },
          {
            label: 'Delete',
            onSelect: () => handleDeleteClick(level),
            icon: <Trash2 size={13} />,
            tone: 'danger',
            dividerBefore: true,
            hidden: !canDelete,
          },
        ];
      },
      width: 120,
      minWidth: 108,
    }),
  ];

  const activationChecklist = activateErrors.length > 0
    ? activateErrors.map((error, index) => ({ id: String(index), label: error, passed: false }))
    : [{ id: 'ready', label: 'All required fields are filled and valid.', passed: true }];

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
        title="Area Level Configuration"
        primaryAction={{ label: 'New Area Level', onClick: () => navigate('/admin/area-levels/new') }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvancedFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or short code..."
        onSearchChange={setSearchQuery}
        helpTopicId="area-level-setup"
        onHelpClick={() => setHelpOpen(true)}
      >
        <MasterDataTable
          gridId="area-level-master-table"
          rows={filtered}
          columns={gridColumns}
          rowId={(level) => level.id}
          totalCount={levels.length}
          emptyState={{
            title: levels.length === 0 ? 'No area levels yet' : 'No area levels match the current filters',
            description: levels.length === 0
              ? 'Create an area level to define the hierarchy structure for your geographic master data.'
              : 'Try adjusting your search or filters.',
            ...(levels.length === 0
              ? { action: { label: 'New Area Level', onClick: () => navigate('/admin/area-levels/new') } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterRole('');
        }}
        description="Filter area levels by status and assigned role."
        fields={[
          {
            id: 'area-level-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: handleQuickFilter,
          },
          {
            id: 'area-level-role',
            label: 'Area Level Role',
            value: filterRole,
            placeholder: 'All roles',
            options: AREA_LEVEL_ROLES.map((role) => ({ value: role, label: role })),
            onChange: setFilterRole,
          },
        ]}
      />

      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewLevel?.areaLevelName ?? ''}
        subtitle={previewLevel?.areaLevelCode}
        statusLabel={previewLevel?.status}
        statusTone={getPreviewStatusTone(previewLevel?.status)}
        sections={previewLevel ? buildLevelPreviewSections(previewLevel, levels) : []}
        primaryAction={{
          label: 'Edit Area Level',
          onClick: () => {
            setPreviewOpen(false);
            if (previewLevel) navigate(`/admin/area-levels/${previewLevel.id}`);
          },
        }}
        secondaryActions={[
          ...(previewLevel?.status === 'Draft'
            ? [{ label: 'Activate', onClick: () => { const level = previewLevel; setPreviewOpen(false); if (level) handleActivateClick(level); } }]
            : []),
          ...(previewLevel?.status === 'Active'
            ? [{ label: 'Inactivate', onClick: () => { const level = previewLevel; setPreviewOpen(false); if (level) handleInactivateClick(level); } }]
            : []),
        ]}
      />

      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => {
          setInactivateOpen(false);
          setInactivateTarget(null);
          setInactivateReason('');
        }}
        title="Inactivate Area Level"
        subtitle={inactivateTarget?.areaLevelName}
        width="sm"
        onSave={confirmInactivate}
        saveLabel="Inactivate"
        saveDisabled={!inactivateReason.trim()}
        validationErrors={!inactivateReason.trim() ? ['Reason is required.'] : undefined}
      >
        <div style={{ padding: '4px 0 0' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.6 }}>
            Inactivating this area level will prevent it from being used in new Area Master records. Provide a reason below.
          </p>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
            Reason <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={inactivateReason}
            onChange={(event) => setInactivateReason(event.target.value)}
            rows={4}
            placeholder="Describe why this area level is being inactivated..."
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: '13px',
              border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
              borderRadius: '8px',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
        </div>
      </SmartFormDrawer>

      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => {
          setActivateOpen(false);
          setActivateTarget(null);
          setActivateErrors([]);
        }}
        title="Activate Area Level"
        subtitle={activateTarget?.areaLevelName}
        description="Review the checklist below before activating this area level. Once active, it becomes available for use in Area Master."
        checklist={activationChecklist}
        warningText={activateErrors.length > 0 ? 'Fix the issues above before activating.' : undefined}
        consequenceNote="Activated area levels can be used to define geographic hierarchies. This action can be reversed by inactivating."
        confirmLabel="Activate"
        confirmDisabled={activateErrors.length > 0}
        onConfirm={confirmActivate}
        onCancel={() => {
          setActivateOpen(false);
          setActivateTarget(null);
          setActivateErrors([]);
        }}
      />

      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        title="Delete Area Level"
        subtitle={deleteTarget?.areaLevelName}
        description="This action is permanent and cannot be undone. The area level record will be removed."
        checklist={[
          { id: 'draft', label: 'Area Level is in Draft status.', passed: deleteTarget?.status === 'Draft' },
          { id: 'unused', label: 'Area Level is not referenced by any Area records.', passed: deleteTarget ? canDeleteAreaLevel(deleteTarget.id) : false },
        ]}
        warningText="This action cannot be undone. The record will be permanently deleted."
        consequenceNote="Deleted area levels cannot be recovered. Ensure no configuration depends on this record."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
      />

      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-level-setup')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaLevelListPage;
