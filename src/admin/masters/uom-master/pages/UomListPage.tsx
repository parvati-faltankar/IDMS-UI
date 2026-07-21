import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Filter, Ruler } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import {
  MASTER_OVERLAY_STYLE,
  MASTER_POPUP_SURFACE_STYLE,
} from '../../../../experience/components/overlay/overlayTokens';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { UomRecord, UomStatus } from '../types/uomMaster.types';
import { UNIT_TYPE_META, UNIT_TYPES } from '../constants/uomMaster.constants';
import { uomService } from '../services/uomService';
import {
  createMasterActionsColumn,
  createMasterIdentifierColumn,
  createMasterStatusColumn,
  createMasterTextColumn,
  MasterDataTable,
  MasterTableBooleanValue,
  MasterTablePill,
  MasterTableTextCell,
  MasterTableTruncate,
} from '../../../../components/common/MasterDataTable';
import MasterFilterDrawer from '../../../../components/common/MasterFilterDrawer';
import type { DataGridColumn } from '../../../../components/common/dataGridTypes';

const MASTER_KEY = 'unit-of-measurement';

function buildPreviewSections(uom: UomRecord): PreviewSection[] {
  const sections: PreviewSection[] = [
    {
      title: 'General Details',
      fields: [
        { label: 'Unit Code', value: uom.unitCode, mono: true },
        { label: 'Unit Name', value: uom.unitName },
        { label: 'Symbol', value: uom.unitSymbol, mono: true },
        { label: 'Unit Type', value: uom.unitType || '-' },
        { label: 'Rounding', value: uom.roundingRule || '-' },
        {
          label: 'Decimal',
          value: uom.allowDecimal
            ? `Yes - ${uom.qtyDecimalPrecision} decimal place${uom.qtyDecimalPrecision !== 1 ? 's' : ''}`
            : 'No',
        },
        ...(uom.effectiveFromDate ? [{ label: 'Effective From', value: uom.effectiveFromDate }] : []),
        ...(uom.effectiveToDate ? [{ label: 'Effective To', value: uom.effectiveToDate }] : []),
        ...(uom.description ? [{ label: 'Description', value: uom.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (uom.conversions.length > 0) {
    sections.push({
      title: `Unit Conversions (${uom.conversions.length})`,
      fields: uom.conversions.slice(0, 6).map((conversion) => ({
        label: `${conversion.fromUnitCode} -> ${conversion.toUnitCode}`,
        value: `x ${conversion.conversionFactor}${conversion.isAutoReverse ? '  (auto-reverse)' : ''}`,
        mono: true,
      })),
      note: uom.conversions.length > 6
        ? `+${uom.conversions.length - 6} more conversions - open the record to view all.`
        : undefined,
    });
  }

  return sections;
}

const UomListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<UomRecord[]>(() => uomService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUnitType, setFilterUnitType] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [previewUom, setPreviewUom] = useState<UomRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [activateTarget, setActivateTarget] = useState<UomRecord | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [inactivateTarget, setInactivateTarget] = useState<UomRecord | null>(null);
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UomRecord | null>(null);
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
    return records.filter((uom) => {
      if (filterStatus && uom.status !== filterStatus) return false;
      if (filterUnitType && uom.unitType !== filterUnitType) return false;
      if (query) {
        const haystack = `${uom.unitCode} ${uom.unitName} ${uom.unitSymbol} ${uom.unitType} ${uom.description}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterUnitType]);

  const hasFilters = Boolean(filterStatus || filterUnitType);

  function handleActivateClick(uom: UomRecord) {
    setActivateTarget(uom);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    uomService.activate(activateTarget.id);
    setRecords(uomService.getAll());
    if (previewUom?.id === activateTarget.id) {
      setPreviewUom(uomService.getById(activateTarget.id) ?? null);
    }
    setActivateOpen(false);
    showToast(`"${activateTarget.unitName}" activated.`, 'success');
    setActivateTarget(null);
  }

  function handleInactivateClick(uom: UomRecord) {
    setInactivateTarget(uom);
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget) return;
    uomService.inactivate(inactivateTarget.id);
    setRecords(uomService.getAll());
    if (previewUom?.id === inactivateTarget.id) {
      setPreviewUom(uomService.getById(inactivateTarget.id) ?? null);
    }
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.unitName}" marked inactive.`, 'success');
    setInactivateTarget(null);
  }

  function handleDeleteClick(uom: UomRecord) {
    setDeleteTarget(uom);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    uomService.delete(deleteTarget.id);
    setRecords(uomService.getAll());
    if (previewUom?.id === deleteTarget.id) setPreviewOpen(false);
    setDeleteOpen(false);
    showToast(`"${deleteTarget.unitName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  function handleEdit(uom: UomRecord) {
    setPreviewOpen(false);
    navigate(`/admin/master/unit-of-measurement/${uom.id}`);
  }

  const gridColumns: DataGridColumn<UomRecord>[] = [
    createMasterIdentifierColumn<UomRecord>({
      id: 'unitCode',
      label: 'Code',
      getValue: (uom) => uom.unitCode,
      onClick: (uom) => {
        setPreviewUom(uom);
        setPreviewOpen(true);
      },
      width: 104,
      minWidth: 92,
    }),
    createMasterTextColumn<UomRecord>({
      id: 'unitName',
      label: 'Name',
      primary: (uom) => uom.unitName,
      secondary: (uom) => uom.description || undefined,
      width: 220,
      minWidth: 180,
      hideable: false,
    }),
    {
      id: 'symbol',
      label: 'Symbol',
      type: 'text',
      width: 96,
      minWidth: 80,
      getValue: (uom) => uom.unitSymbol,
      renderCell: (uom) => <MasterTableTruncate value={uom.unitSymbol} mono />,
    },
    {
      id: 'unitType',
      label: 'Unit Type',
      type: 'enum',
      width: 166,
      minWidth: 144,
      getValue: (uom) => uom.unitType,
      options: UNIT_TYPES.map((value) => ({ value, label: value })),
      renderCell: (uom) => {
        if (!uom.unitType) return <MasterTableTruncate value="-" />;
        const typeMeta = UNIT_TYPE_META[uom.unitType as keyof typeof UNIT_TYPE_META];
        return <MasterTablePill label={uom.unitType} tone={typeMeta ? 'info' : 'neutral'} />;
      },
    },
    {
      id: 'roundingRule',
      label: 'Rounding',
      type: 'text',
      width: 150,
      minWidth: 130,
      getValue: (uom) => uom.roundingRule,
      renderCell: (uom) => <MasterTableTruncate value={uom.roundingRule || '-'} />,
    },
    {
      id: 'decimal',
      label: 'Decimal',
      type: 'boolean',
      width: 126,
      minWidth: 110,
      getValue: (uom) => uom.allowDecimal,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      renderCell: (uom) => (
        <MasterTableTextCell
          primary={uom.allowDecimal ? 'Yes' : 'No'}
          secondary={uom.allowDecimal ? `${uom.qtyDecimalPrecision ?? 0} dp` : undefined}
        />
      ),
    },
    {
      id: 'conversions',
      label: 'Conversions',
      type: 'number',
      width: 128,
      minWidth: 112,
      getValue: (uom) => uom.conversions.length,
      renderCell: (uom) => <MasterTableTruncate value={String(uom.conversions.length)} />,
    },
    createMasterStatusColumn<UomRecord>({
      getStatus: (uom) => uom.status,
      width: 126,
      minWidth: 112,
      options: ['Draft', 'Active', 'Inactive'],
    }),
    createMasterActionsColumn<UomRecord>({
      rowLabel: (uom) => uom.unitCode,
      inlineAction: (uom) => ({
        label: 'Edit unit',
        onClick: () => handleEdit(uom),
        icon: <Edit2 size={13} />,
      }),
      menuActions: (uom) => [
        {
          label: 'Preview details',
          onSelect: () => {
            setPreviewUom(uom);
            setPreviewOpen(true);
          },
          icon: <Eye size={13} />,
        },
        {
          label: 'Edit unit',
          onSelect: () => handleEdit(uom),
          icon: <Edit2 size={13} />,
        },
        ...(uom.status === 'Draft'
          ? [{
              label: 'Activate',
              onSelect: () => handleActivateClick(uom),
              dividerBefore: true,
            }]
          : []),
        ...(uom.status === 'Active'
          ? [{
              label: 'Mark Inactive',
              onSelect: () => handleInactivateClick(uom),
              tone: 'warning' as const,
              dividerBefore: true,
            }]
          : []),
        ...(uom.status === 'Draft'
          ? [{
              label: 'Delete Draft',
              onSelect: () => handleDeleteClick(uom),
              tone: 'danger' as const,
            }]
          : []),
      ],
    }),
  ];

  const previewStatusTone: 'active' | 'draft' | 'inactive' | 'warning' | undefined = !previewUom
    ? undefined
    : previewUom.status === 'Active'
      ? 'active'
      : previewUom.status === 'Inactive'
        ? 'inactive'
        : 'draft';

  const helpTopic = getHelpTopic('unit-of-measurement');

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#111827' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Unit of Measurement"
        description="Manage units used across inventory, procurement, and sales transactions."
        breadcrumbs={['Admin', 'Products & Catalogue', 'Unit of Measurement']}
        primaryAction={{ label: '+ New Unit', onClick: () => navigate('/admin/master/unit-of-measurement/new') }}
        secondaryActions={[{
          label: 'Filters',
          onClick: () => setShowAdvancedFilters(true),
          icon: <Filter size={13} />,
          iconOnly: true,
          title: 'Open filters',
          active: hasFilters,
        }]}
        searchValue={searchQuery}
        searchPlaceholder="Search by name, code, symbol or type..."
        onSearchChange={setSearchQuery}
        helpTopicId={helpTopic ? 'unit-of-measurement' : undefined}
        onHelpClick={helpTopic ? () => setHelpOpen(true) : undefined}
      >
        <MasterDataTable
          gridId="uom-master-table"
          rows={filtered}
          columns={gridColumns}
          rowId={(uom) => uom.id}
          totalCount={records.length}
          emptyState={{
            title: records.length === 0 ? 'No units of measurement yet' : 'No units match the current filters',
            description: records.length === 0
              ? 'Add units to define how quantities are measured across inventory, procurement, and sales.'
              : 'Try adjusting your search or filters.',
            ...(records.length === 0
              ? { action: { label: 'New Unit', onClick: () => navigate('/admin/master/unit-of-measurement/new') } }
              : {}),
          }}
        />
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onReset={() => {
          setFilterStatus('');
          setFilterUnitType('');
        }}
        description="Filter units by lifecycle status and measurement type."
        fields={[
          {
            id: 'uom-status',
            label: 'Status',
            value: filterStatus,
            placeholder: 'All statuses',
            options: ['Active', 'Draft', 'Inactive'].map((status) => ({ value: status, label: status })),
            onChange: setFilterStatus,
          },
          {
            id: 'uom-unit-type',
            label: 'Unit Type',
            value: filterUnitType,
            placeholder: 'All types',
            options: UNIT_TYPES.map((type) => ({ value: type, label: type })),
            onChange: setFilterUnitType,
          },
        ]}
      />

      {previewUom && (
        <SmartPreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={previewUom.unitName}
          subtitle={previewUom.unitCode}
          statusLabel={previewUom.status}
          statusTone={previewStatusTone}
          summaryFields={[
            { label: 'Symbol', value: previewUom.unitSymbol },
            { label: 'Unit Type', value: previewUom.unitType || '-' },
            { label: 'Conversions', value: String(previewUom.conversions.length) },
            { label: 'Decimal', value: previewUom.allowDecimal ? `${previewUom.qtyDecimalPrecision} dp` : 'Integer' },
          ]}
          sections={buildPreviewSections(previewUom)}
          primaryAction={{ label: 'Edit Unit', onClick: () => handleEdit(previewUom) }}
          secondaryActions={[
            ...(previewUom.status === 'Draft'
              ? [{ label: 'Activate', onClick: () => { setPreviewOpen(false); handleActivateClick(previewUom); } }]
              : []),
            ...(previewUom.status === 'Active'
              ? [{ label: 'Mark Inactive', onClick: () => { setPreviewOpen(false); handleInactivateClick(previewUom); } }]
              : []),
          ]}
          dangerAction={previewUom.status === 'Draft'
            ? { label: 'Delete Draft', onClick: () => { setPreviewOpen(false); handleDeleteClick(previewUom); } }
            : undefined}
        />
      )}

      {helpTopic && (
        <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} topic={helpTopic} />
      )}

      {activateOpen && activateTarget && (
        <div style={MASTER_OVERLAY_STYLE} onClick={() => setActivateOpen(false)}>
          <div style={{ ...MASTER_POPUP_SURFACE_STYLE, padding: '28px', maxWidth: '420px', width: '90%' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>Activate Unit</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Activate <strong>{activateTarget.unitName}</strong> ({activateTarget.unitCode})?
              Once active, this unit can be selected in transactions, item masters, and conversion rules.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setActivateOpen(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmActivate} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#16A34A', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Activate</button>
            </div>
          </div>
        </div>
      )}

      {inactivateOpen && inactivateTarget && (
        <div style={MASTER_OVERLAY_STYLE} onClick={() => setInactivateOpen(false)}>
          <div style={{ ...MASTER_POPUP_SURFACE_STYLE, padding: '28px', maxWidth: '420px', width: '90%' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>Mark as Inactive</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              <strong>{inactivateTarget.unitName}</strong> will no longer be selectable in new transactions.
              Existing records using this unit are not affected.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setInactivateOpen(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmInactivate} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Mark Inactive</button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && deleteTarget && (
        <div style={MASTER_OVERLAY_STYLE} onClick={() => setDeleteOpen(false)}>
          <div style={{ ...MASTER_POPUP_SURFACE_STYLE, padding: '28px', maxWidth: '420px', width: '90%' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>Delete Draft Unit</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Permanently delete <strong>{deleteTarget.unitName}</strong> ({deleteTarget.unitCode})?
              This action cannot be undone. Only Draft records can be deleted.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setDeleteOpen(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default UomListPage;
