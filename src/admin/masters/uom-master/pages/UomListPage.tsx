// ─── UOM Master — List Page ───────────────────────────────────────────────────
// Follows the Supplier / Customer Master structural pattern:
//   • SmartPreviewDrawer on row click
//   • HelpDrawer via AdminListPageShell
//   • Confirmation modals for activate / inactivate / delete
//   • Advanced filter panel for Unit Type
//   • uomService for all data operations

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Filter,
  Ruler,
} from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { UomRecord, UomStatus } from '../types/uomMaster.types';
import { UNIT_TYPE_META, UNIT_TYPES } from '../constants/uomMaster.constants';
import { uomService } from '../services/uomService';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_COLUMNS = '90px minmax(150px, 1fr) 70px 160px 140px 80px 90px 90px';

const COL_HEADERS = [
  { label: 'Code',       align: 'left'   },
  { label: 'Name',       align: 'left'   },
  { label: 'Symbol',     align: 'left'   },
  { label: 'Unit Type',  align: 'left'   },
  { label: 'Rounding',   align: 'left'   },
  { label: 'Decimal',    align: 'center' },
  { label: 'Status',     align: 'left'   },
  { label: 'Actions',    align: 'right'  },
];

const MASTER_KEY = 'unit-of-measurement';

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '6px',
  whiteSpace: 'nowrap',
};

// ─── Style helpers ────────────────────────────────────────────────────────────

function getStatusStyle(status: UomStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

// ─── Preview section builder ──────────────────────────────────────────────────

function buildPreviewSections(uom: UomRecord): PreviewSection[] {
  const sections: PreviewSection[] = [
    {
      title: 'General Details',
      fields: [
        { label: 'Unit Code',  value: uom.unitCode,   mono: true },
        { label: 'Unit Name',  value: uom.unitName },
        { label: 'Symbol',     value: uom.unitSymbol, mono: true },
        { label: 'Unit Type',  value: uom.unitType   || '—' },
        { label: 'Rounding',   value: uom.roundingRule || '—' },
        {
          label: 'Decimal',
          value: uom.allowDecimal
            ? `Yes — ${uom.qtyDecimalPrecision} decimal place${uom.qtyDecimalPrecision !== 1 ? 's' : ''}`
            : 'No',
        },
        ...(uom.effectiveFromDate ? [{ label: 'Effective From', value: uom.effectiveFromDate }] : []),
        ...(uom.effectiveToDate   ? [{ label: 'Effective To',   value: uom.effectiveToDate   }] : []),
        ...(uom.description ? [{ label: 'Description', value: uom.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (uom.conversions.length > 0) {
    sections.push({
      title: `Unit Conversions (${uom.conversions.length})`,
      fields: uom.conversions.slice(0, 6).map((c) => ({
        label: `${c.fromUnitCode} → ${c.toUnitCode}`,
        value: `× ${c.conversionFactor}${c.isAutoReverse ? '  (auto-reverse)' : ''}`,
        mono: true,
      })),
      note: uom.conversions.length > 6
        ? `+${uom.conversions.length - 6} more conversions — open the record to view all.`
        : undefined,
    });
  }

  return sections;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UomListPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<UomRecord[]>(() => uomService.getAll());

  // ── Filters ───────────────────────────────────────────────────────────
  const [searchQuery,         setSearchQuery]         = useState('');
  const [filterStatus,        setFilterStatus]        = useState('');
  const [filterUnitType,      setFilterUnitType]      = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Preview ───────────────────────────────────────────────────────────
  const [previewUom,  setPreviewUom]  = useState<UomRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Help ──────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);

  // ── Activate flow ─────────────────────────────────────────────────────
  const [activateTarget, setActivateTarget] = useState<UomRecord | null>(null);
  const [activateOpen,   setActivateOpen]   = useState(false);

  // ── Inactivate flow ───────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<UomRecord | null>(null);
  const [inactivateOpen,   setInactivateOpen]   = useState(false);

  // ── Delete flow ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UomRecord | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Recent admin master tracking ───────────────────────────────────────
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
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((uom) => {
      if (filterStatus   && uom.status   !== filterStatus)   return false;
      if (filterUnitType && uom.unitType !== filterUnitType) return false;
      if (q) {
        const hay = `${uom.unitCode} ${uom.unitName} ${uom.unitSymbol} ${uom.unitType} ${uom.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterUnitType]);

  // ── Quick filter counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      records.length,
    Active:   records.filter((u) => u.status === 'Active').length,
    Draft:    records.filter((u) => u.status === 'Draft').length,
    Inactive: records.filter((u) => u.status === 'Inactive').length,
  }), [records]);

  // ── Actions ───────────────────────────────────────────────────────────
  function handleQuickFilter(key: string) {
    setFilterStatus(key === 'all' ? '' : key);
  }

  function handleActivateClick(uom: UomRecord, e?: React.MouseEvent) {
    e?.stopPropagation();
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

  function handleInactivateClick(uom: UomRecord, e?: React.MouseEvent) {
    e?.stopPropagation();
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

  function handleDeleteClick(uom: UomRecord, e?: React.MouseEvent) {
    e?.stopPropagation();
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

  function handleEdit(uom: UomRecord, e?: React.MouseEvent) {
    e?.stopPropagation();
    setPreviewOpen(false);
    navigate(`/admin/master/unit-of-measurement/${uom.id}`);
  }

  // ── Inline styles ──────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  // ── Render ────────────────────────────────────────────────────────────
  const activeFilter = filterStatus || 'all';

  const quickFilterItems = [
    { key: 'all',      label: 'All',      count: counts.all      },
    { key: 'Active',   label: 'Active',   count: counts.Active   },
    { key: 'Draft',    label: 'Draft',    count: counts.Draft    },
    { key: 'Inactive', label: 'Inactive', count: counts.Inactive },
  ];

  const advancedFilterPanel = showAdvancedFilters ? (
    <div
      style={{
        position: 'absolute', top: '100%', right: 0, zIndex: 200,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        padding: '16px 20px', minWidth: '220px', marginTop: '6px',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Advanced Filters
      </p>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
        Unit Type
      </label>
      <select
        value={filterUnitType}
        onChange={(e) => setFilterUnitType(e.target.value)}
        style={{ ...inputBase, marginBottom: '16px' }}
      >
        <option value="">All types</option>
        {UNIT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => { setFilterUnitType(''); setShowAdvancedFilters(false); }}
        style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Clear filters
      </button>
    </div>
  ) : null;

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowAdvancedFilters((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '0 10px', height: '30px', fontSize: '12px', fontWeight: 500,
          border: `1px solid ${filterUnitType ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          background: filterUnitType ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
          color: filterUnitType ? 'var(--color-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
      >
        <Filter size={11} />
        Filters
        {filterUnitType && (
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
        )}
        <ChevronDown size={10} style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {advancedFilterPanel}
    </div>
  );

  const tableHeader = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID_COLUMNS,
        alignItems: 'center',
        height: '36px',
        padding: '0 16px',
        borderBottom: '1.5px solid var(--color-border)',
        background: 'var(--color-surface-subtle)',
        position: 'sticky', top: 0, zIndex: 10,
      }}
    >
      {COL_HEADERS.map(({ label, align }, i) => (
        <div
          key={i}
          style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            textAlign: align as React.CSSProperties['textAlign'],
            paddingRight: i < COL_HEADERS.length - 1 ? '8px' : '0',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        {records.length === 0
          ? <Ruler size={20} style={{ color: 'var(--color-text-muted)' }} />
          : <Filter size={20} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {records.length === 0 ? 'No units of measurement yet' : 'No units match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
        {records.length === 0
          ? 'Add units to define how quantities are measured across inventory, procurement, and sales.'
          : 'Try adjusting your search or filters.'}
      </div>
      {records.length === 0 && (
        <button
          type="button"
          onClick={() => navigate('/admin/master/unit-of-measurement/new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '32px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
        >
          + New Unit
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((uom, idx) => {
        const isLast   = idx === filtered.length - 1;
        const canDel   = uom.status === 'Draft';
        const typeMeta = uom.unitType ? UNIT_TYPE_META[uom.unitType as keyof typeof UNIT_TYPE_META] : null;
        return (
          <div
            key={uom.id}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              alignItems: 'center',
              height: '44px',
              padding: '0 16px',
              borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'background 0.10s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            onClick={() => { setPreviewUom(uom); setPreviewOpen(true); }}
          >
            {/* Code */}
            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {uom.unitCode}
            </div>

            {/* Name */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uom.unitName}
              </div>
              {uom.description && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uom.description}
                </div>
              )}
            </div>

            {/* Symbol */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1px 6px' }}>
                {uom.unitSymbol}
              </span>
            </div>

            {/* Unit Type */}
            <div style={{ paddingRight: '8px' }}>
              {uom.unitType ? (
                <span style={{ ...BADGE_BASE, background: typeMeta?.bgColor ?? '#F3F4F6', color: typeMeta?.color ?? '#374151' }}>
                  {uom.unitType}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
              )}
            </div>

            {/* Rounding */}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {uom.roundingRule || '—'}
            </div>

            {/* Decimal */}
            <div style={{ textAlign: 'center', paddingRight: '8px' }}>
              {uom.allowDecimal ? (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', borderRadius: '4px', padding: '1px 6px' }}>
                  {uom.qtyDecimalPrecision ?? '—'}
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
              )}
            </div>

            {/* Status */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE_BASE, ...getStatusStyle(uom.status) }}>
                {uom.status}
              </span>
            </div>

            {/* Actions */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                title="Edit"
                onClick={(e) => handleEdit(uom, e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
              >
                Edit
              </button>
              {uom.status === 'Draft' && (
                <button
                  title="Activate"
                  onClick={(e) => handleActivateClick(uom, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#15803D' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#DCFCE7'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  Activate
                </button>
              )}
              {uom.status === 'Active' && (
                <button
                  title="Mark Inactive"
                  onClick={(e) => handleInactivateClick(uom, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#DC2626' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  Inactivate
                </button>
              )}
              {canDel && (
                <button
                  title="Delete Draft"
                  onClick={(e) => handleDeleteClick(uom, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: '6px', fontSize: '13px', color: '#9CA3AF' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  // ── Preview drawer status ──────────────────────────────────────────────
  const previewStatusTone: 'active' | 'draft' | 'inactive' | 'warning' | undefined = !previewUom
    ? undefined
    : previewUom.status === 'Active'   ? 'active'
    : previewUom.status === 'Inactive' ? 'inactive'
    : 'draft';

  const helpTopic = getHelpTopic('unit-of-measurement');

  return (
    <AdminShell>
      {/* Toast */}
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
        breadcrumbs={[
          'Admin',
          'Products & Catalogue',
          'Unit of Measurement',
        ]}
        primaryAction={{
          label: '+ New Unit',
          onClick: () => navigate('/admin/master/unit-of-measurement/new'),
        }}
        searchValue={searchQuery}
        searchPlaceholder="Search by name, code, symbol or type…"
        onSearchChange={setSearchQuery}
        quickFilterItems={quickFilterItems}
        activeQuickFilter={activeFilter}
        onQuickFilterChange={handleQuickFilter}
        toolbarActions={toolbarActions}
        helpTopicId={helpTopic ? 'unit-of-measurement' : undefined}
        onHelpClick={helpTopic ? () => setHelpOpen(true) : undefined}
      >
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--color-border)', borderRadius: '12px',
          background: 'var(--color-surface)',
        }}>
          {tableHeader}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tableBody}
          </div>
        </div>
      </AdminListPageShell>

      {/* SmartPreviewDrawer */}
      {previewUom && (
        <SmartPreviewDrawer
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={previewUom.unitName}
          subtitle={previewUom.unitCode}
          statusLabel={previewUom.status}
          statusTone={previewStatusTone}
          summaryFields={[
            { label: 'Symbol',      value: previewUom.unitSymbol },
            { label: 'Unit Type',   value: previewUom.unitType || '—' },
            { label: 'Conversions', value: String(previewUom.conversions.length) },
            { label: 'Decimal',     value: previewUom.allowDecimal ? `${previewUom.qtyDecimalPrecision} dp` : 'Integer' },
          ]}
          sections={buildPreviewSections(previewUom)}
          primaryAction={{
            label: 'Edit Unit',
            onClick: () => handleEdit(previewUom),
          }}
          secondaryActions={[
            ...(previewUom.status === 'Draft' ? [{
              label: 'Activate',
              onClick: () => { setPreviewOpen(false); handleActivateClick(previewUom); },
            }] : []),
            ...(previewUom.status === 'Active' ? [{
              label: 'Mark Inactive',
              onClick: () => { setPreviewOpen(false); handleInactivateClick(previewUom); },
            }] : []),
          ]}
          dangerAction={previewUom.status === 'Draft' ? {
            label: 'Delete Draft',
            onClick: () => { setPreviewOpen(false); handleDeleteClick(previewUom); },
          } : undefined}
        />
      )}

      {/* HelpDrawer */}
      {helpTopic && (
        <HelpDrawer
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          topic={helpTopic}
        />
      )}

      {/* Activate Confirmation */}
      {activateOpen && activateTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActivateOpen(false)}
        >
          <div
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Inactivate Confirmation */}
      {inactivateOpen && inactivateTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setInactivateOpen(false)}
        >
          <div
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* Delete Confirmation */}
      {deleteOpen && deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setDeleteOpen(false)}
        >
          <div
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
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
