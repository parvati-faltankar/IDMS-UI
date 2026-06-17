import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Edit2, Eye, Filter, Trash2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartFormDrawer } from '../../../../experience/components/SmartFormDrawer';
import { SmartReviewDrawer } from '../../../../experience/components/SmartReviewDrawer';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
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
  MasterTablePill,
  MasterTableTagList,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';
import type { Area, AreaLevel, AreaStatus, UsageTag } from '../types/areaMaster.types';
import { areaService } from '../services/areaService';
import { areaLevelService } from '../services/areaLevelService';
import { validateAreaForActivation } from '../utils/areaValidation';
import { AREA_CATEGORIES, USAGE_TAGS } from '../constants/areaMaster.constants';

const MASTER_KEY = 'area-master';

function buildAreaPreviewSections(area: Area, allLevels: AreaLevel[]): PreviewSection[] {
  const levelName = allLevels.find((level) => level.id === area.areaLevelId)?.areaLevelName ?? '-';

  return [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Area Code', value: area.areaCode, mono: true },
        { label: 'Area Name', value: area.areaName },
        { label: 'Display Name', value: area.displayName || '-' },
        { label: 'External / Legacy Code', value: area.externalLegacyCode || '-' },
      ],
    },
    {
      title: 'Hierarchy',
      fields: [
        { label: 'Area Level', value: levelName },
        { label: 'Category', value: area.areaCategory || '-' },
        { label: 'Classification', value: area.areaClassification || '-' },
        { label: 'Hierarchy Path', value: area.hierarchyPath || '-' },
      ],
    },
    {
      title: 'Usage Tags',
      fields: [
        { label: 'Usage Tags', value: area.usageTags.length > 0 ? area.usageTags.join(', ') : '-' },
      ],
    },
    {
      title: 'Geo & Postal',
      fields: [
        { label: 'Postal Code', value: area.postalCode || '-' },
        { label: 'Geo Boundary Type', value: area.geoBoundaryType || '-' },
      ],
    },
  ];
}

function getPreviewStatusTone(status?: AreaStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

const AreaListPage: React.FC = () => {
  const navigate = useNavigate();

  const [areas, setAreas] = useState<Area[]>(() => areaService.getAll());
  const allLevels = useMemo(() => areaLevelService.getAll(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('');
  const [filterUsageTag, setFilterUsageTag] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAdvancedFilters, setShowAdvFilters] = useState(false);

  const [activateTarget, setActivateTarget] = useState<Area | null>(null);
  const [activateErrors, setActivateErrors] = useState<string[]>([]);
  const [activateOpen, setActivateOpen] = useState(false);

  const [inactivateTarget, setInactivateTarget] = useState<Area | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [hasActiveChildrenError, setHasActiveChildrenError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [previewArea, setPreviewArea] = useState<Area | null>(null);
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

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    allLevels.forEach((level) => map.set(level.id, level.areaLevelName));
    return map;
  }, [allLevels]);

  const areaNameMap = useMemo(() => {
    const map = new Map<string, string>();
    areas.forEach((area) => map.set(area.id, area.areaName));
    return map;
  }, [areas]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return areas.filter((area) => {
      if (filterStatus && area.status !== filterStatus) return false;
      if (filterLevelId && area.areaLevelId !== filterLevelId) return false;
      if (filterUsageTag && !area.usageTags.includes(filterUsageTag as UsageTag)) return false;
      if (filterCategory && area.areaCategory !== filterCategory) return false;

      if (query) {
        const aliasHaystack = area.aliases
          .filter((alias) => alias.status === 'Active' && alias.isSearchable)
          .map((alias) => alias.aliasName)
          .join(' ');
        const haystack = [
          area.areaCode,
          area.areaName,
          area.displayName,
          area.externalLegacyCode,
          area.postalCode,
          aliasHaystack,
        ].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [areas, searchQuery, filterStatus, filterLevelId, filterUsageTag, filterCategory]);

  function handleActivateClick(area: Area) {
    const others = areaService.getAll().filter((candidate) => candidate.id !== area.id);
    const errors = validateAreaForActivation(area, allLevels, others);
    setActivateTarget(area);
    setActivateErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    areaService.activate(activateTarget.id);
    setAreas(areaService.getAll());
    if (previewArea?.id === activateTarget.id) {
      setPreviewArea(areaService.getById(activateTarget.id) ?? null);
    }
    setActivateOpen(false);
    showToast(`"${activateTarget.areaName}" activated.`, 'success');
    setActivateTarget(null);
    setActivateErrors([]);
  }

  function handleInactivateClick(area: Area) {
    const blocked = areaService.hasActiveChildren(area.id);
    setInactivateTarget(area);
    setInactivateReason('');
    setHasActiveChildrenError(blocked);
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget || !inactivateReason.trim() || hasActiveChildrenError) return;
    areaService.inactivate(inactivateTarget.id, inactivateReason.trim());
    setAreas(areaService.getAll());
    if (previewArea?.id === inactivateTarget.id) {
      setPreviewArea(areaService.getById(inactivateTarget.id) ?? null);
    }
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.areaName}" inactivated.`, 'success');
    setInactivateTarget(null);
    setInactivateReason('');
  }

  function handleDeleteClick(area: Area) {
    setDeleteTarget(area);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    areaService.delete(deleteTarget.id);
    setAreas(areaService.getAll());
    if (previewArea?.id === deleteTarget.id) {
      setPreviewOpen(false);
      setPreviewArea(null);
    }
    setDeleteOpen(false);
    showToast(`"${deleteTarget.areaName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  function handlePreviewClick(area: Area) {
    setPreviewArea(area);
    setPreviewOpen(true);
  }

  const hasFilters = Boolean(filterStatus || filterLevelId || filterUsageTag || filterCategory);

  const gridColumns: DataGridColumn<Area>[] = [
    createMasterIdentifierColumn<Area>({
      id: 'areaCode',
      label: 'Code',
      getValue: (area) => area.areaCode,
      onClick: handlePreviewClick,
      width: 132,
      minWidth: 120,
    }),
    createMasterTextColumn<Area>({
      id: 'areaName',
      label: 'Area Name',
      primary: (area) => area.areaName,
      secondary: (area) => area.displayName && area.displayName !== area.areaName ? area.displayName : undefined,
      title: (area) => area.areaName,
      width: 240,
      minWidth: 220,
      hideable: false,
    }),
    {
      id: 'areaLevel',
      label: 'Area Level',
      type: 'text',
      width: 160,
      minWidth: 144,
      getValue: (area) => levelMap.get(area.areaLevelId) ?? '-',
      renderCell: (area) => <MasterTablePill label={levelMap.get(area.areaLevelId) ?? '-'} tone="info" />,
    },
    {
      id: 'parentArea',
      label: 'Parent Area',
      type: 'text',
      width: 210,
      minWidth: 180,
      getValue: (area) => area.parentAreaId ? areaNameMap.get(area.parentAreaId) ?? '-' : '-',
      renderCell: (area) => (
        <MasterTableTruncate value={area.parentAreaId ? areaNameMap.get(area.parentAreaId) ?? '-' : '-'} />
      ),
    },
    {
      id: 'hierarchyPath',
      label: 'Hierarchy Path',
      type: 'text',
      width: 260,
      minWidth: 220,
      getValue: (area) => area.hierarchyPath || '-',
      renderCell: (area) => <MasterTableTruncate value={area.hierarchyPath || '-'} title={area.hierarchyPath || '-'} />,
    },
    {
      id: 'usageTags',
      label: 'Usage Tags',
      type: 'text',
      width: 196,
      minWidth: 168,
      getValue: (area) => area.usageTags.join(', '),
      renderCell: (area) => <MasterTableTagList labels={area.usageTags} />,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'text',
      width: 148,
      minWidth: 132,
      getValue: (area) => area.areaCategory || '-',
      renderCell: (area) => (
        area.areaCategory
          ? <MasterTablePill label={area.areaCategory} tone="neutral" />
          : <MasterTableTruncate value="-" />
      ),
    },
    createMasterStatusColumn<Area>({
      getStatus: (area) => area.status,
      width: 130,
      minWidth: 118,
    }),
    createMasterActionsColumn<Area>({
      rowLabel: (area) => area.areaName,
      inlineAction: (area) => ({
        label: 'Edit area',
        onClick: () => navigate(`/admin/areas/${area.id}`),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (area) => {
        const canDelete = area.status === 'Draft' && areaService.getChildren(area.id).length === 0;

        return [
          {
            label: 'Preview',
            onSelect: () => handlePreviewClick(area),
            icon: <Eye size={13} />,
          },
          {
            label: 'Edit',
            onSelect: () => navigate(`/admin/areas/${area.id}`),
            icon: <Edit2 size={13} />,
          },
          {
            label: 'Activate',
            onSelect: () => handleActivateClick(area),
            icon: <Check size={13} />,
            hidden: area.status !== 'Draft',
          },
          {
            label: 'Inactivate',
            onSelect: () => handleInactivateClick(area),
            icon: <X size={13} />,
            hidden: area.status !== 'Active',
          },
          {
            label: 'Delete',
            onSelect: () => handleDeleteClick(area),
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
    : [{ id: 'ready', label: 'All required fields are complete and valid.', passed: true }];

  const deleteTargetHasChildren = deleteTarget ? areaService.getChildren(deleteTarget.id).length > 0 : false;

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
        title="Area Master"
        description="Create and manage geographic areas linked to area level hierarchy for use across sales, service, and delivery operations."
        breadcrumbs={['Admin', 'Area Master']}
        primaryAction={{ label: 'New Area', onClick: () => navigate('/admin/areas/new') }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or alias..."
        onSearchChange={setSearchQuery}
        helpTopicId="area-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        <MasterDataTable
          gridId="area-master-table"
          rows={filtered}
          columns={gridColumns}
          rowId={(area) => area.id}
          totalCount={areas.length}
          emptyState={{
            title: areas.length === 0 ? 'No areas yet' : 'No areas match the current filters',
            description: areas.length === 0
              ? 'Create your first area to start building the operational geography hierarchy.'
              : 'Try adjusting your search or filters.',
            ...(areas.length === 0
              ? { action: { label: 'New Area', onClick: () => navigate('/admin/areas/new') } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showAdvancedFilters}
        onClose={() => setShowAdvFilters(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterLevelId('');
          setFilterUsageTag('');
          setFilterCategory('');
        }}
        description="Filter areas by status, hierarchy level, usage tag, and category."
        fields={[
          {
            id: 'area-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: (value) => setFilterStatus(value as AreaStatus | ''),
          },
          {
            id: 'area-level',
            label: 'Area Level',
            value: filterLevelId,
            placeholder: 'All levels',
            options: allLevels.map((level) => ({ value: level.id, label: level.areaLevelName })),
            onChange: setFilterLevelId,
          },
          {
            id: 'area-usage-tag',
            label: 'Usage Tag',
            value: filterUsageTag,
            placeholder: 'All tags',
            options: USAGE_TAGS.map((tag) => ({ value: tag, label: tag })),
            onChange: (value) => setFilterUsageTag(value as UsageTag | ''),
          },
          {
            id: 'area-category',
            label: 'Category',
            value: filterCategory,
            placeholder: 'All categories',
            options: AREA_CATEGORIES.map((category) => ({ value: category, label: category })),
            onChange: setFilterCategory,
          },
        ]}
      />

      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewArea?.areaName ?? ''}
        subtitle={`Code: ${previewArea?.areaCode ?? ''}`}
        statusLabel={previewArea?.status}
        statusTone={getPreviewStatusTone(previewArea?.status)}
        sections={previewArea ? buildAreaPreviewSections(previewArea, allLevels) : []}
        primaryAction={{
          label: 'Edit Area',
          onClick: () => {
            setPreviewOpen(false);
            if (previewArea) navigate(`/admin/areas/${previewArea.id}`);
          },
        }}
        secondaryActions={[
          ...(previewArea?.status === 'Draft'
            ? [{ label: 'Activate', onClick: () => { const area = previewArea; setPreviewOpen(false); if (area) handleActivateClick(area); } }]
            : []),
          ...(previewArea?.status === 'Active'
            ? [{ label: 'Inactivate', onClick: () => { const area = previewArea; setPreviewOpen(false); if (area) handleInactivateClick(area); } }]
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
        title="Inactivate Area"
        subtitle={inactivateTarget?.areaName}
        width="sm"
        onSave={confirmInactivate}
        saveLabel="Inactivate"
        saveDisabled={hasActiveChildrenError || !inactivateReason.trim()}
        validationErrors={
          hasActiveChildrenError
            ? ['This area has active child areas. Inactivate all child areas first.']
            : !inactivateReason.trim()
              ? ['Reason is required.']
              : undefined
        }
      >
        <div>
          {hasActiveChildrenError ? (
            <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '13px', color: '#DC2626', lineHeight: 1.6 }}>
              This area has one or more <strong>active child areas</strong>. You must inactivate all child areas before inactivating this area.
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.6 }}>
                Inactivating this area will prevent it from being selected as a parent for new areas. Provide a reason below.
              </p>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
                Reason <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                value={inactivateReason}
                onChange={(event) => setInactivateReason(event.target.value)}
                rows={4}
                placeholder="Describe why this area is being inactivated..."
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
            </>
          )}
        </div>
      </SmartFormDrawer>

      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => {
          setActivateOpen(false);
          setActivateTarget(null);
          setActivateErrors([]);
        }}
        title="Activate Area"
        subtitle={activateTarget?.areaName}
        description="Review the checklist before activating this area. Once active, it can be used as a parent area."
        checklist={activationChecklist}
        warningText={activateErrors.length > 0 ? 'Resolve all issues before activating.' : undefined}
        consequenceNote="Activated areas can be selected as parent areas and used in transactions. You can inactivate this area later."
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
        title="Delete Area"
        subtitle={deleteTarget?.areaName}
        description="This action is permanent and cannot be undone."
        checklist={[
          { id: 'draft', label: 'Area is in Draft status.', passed: deleteTarget?.status === 'Draft' },
          { id: 'nochildren', label: 'Area has no child areas.', passed: !deleteTargetHasChildren },
        ]}
        warningText="This record will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        confirmDisabled={deleteTargetHasChildren || deleteTarget?.status !== 'Draft'}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
      />

      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-master')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaListPage;
