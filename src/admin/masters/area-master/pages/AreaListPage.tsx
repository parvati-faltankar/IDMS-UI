import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Edit2, Filter, Trash2, X } from 'lucide-react';
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
import type { Area, AreaLevel, AreaStatus, UsageTag } from '../types/areaMaster.types';
import { areaService } from '../services/areaService';
import { areaLevelService } from '../services/areaLevelService';
import { validateAreaForActivation } from '../utils/areaValidation';
import { AREA_CATEGORIES, USAGE_TAGS } from '../constants/areaMaster.constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MASTER_KEY = 'area-master';

function buildAreaPreviewSections(area: Area, allLevels: AreaLevel[]): PreviewSection[] {
  const levelName = allLevels.find((l) => l.id === area.areaLevelId)?.areaLevelName ?? '—';
  return [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Area Code',    value: area.areaCode },
        { label: 'Area Name',    value: area.areaName },
        { label: 'Display Name', value: area.displayName || '—' },
        { label: 'External / Legacy Code', value: area.externalLegacyCode || '—' },
      ],
    },
    {
      title: 'Hierarchy',
      fields: [
        { label: 'Area Level',     value: levelName },
        { label: 'Category',       value: area.areaCategory || '—' },
        { label: 'Classification', value: area.areaClassification || '—' },
        { label: 'Hierarchy Path', value: area.hierarchyPath || '—' },
      ],
    },
    {
      title: 'Usage Tags',
      fields: [
        { label: 'Usage Tags', value: area.usageTags.length > 0 ? area.usageTags.join(', ') : '—' },
      ],
    },
    {
      title: 'Geo & Postal',
      fields: [
        { label: 'Postal Code',        value: area.postalCode || '—' },
        { label: 'Geo Boundary Type',  value: area.geoBoundaryType || '—' },
      ],
    },
  ];
}

function getStatusStyle(status: AreaStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', fontSize: '11px', fontWeight: 600,
  borderRadius: '6px', whiteSpace: 'nowrap',
};

const TAG_PILL: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 7px', fontSize: '10px', fontWeight: 500,
  borderRadius: '4px', background: '#F1F5F9', color: '#475569',
  whiteSpace: 'nowrap',
};

const GRID_COLS =
  'minmax(180px, 1fr) 120px minmax(110px, 1fr) minmax(160px, 1.5fr) minmax(120px, 1fr) 110px 90px 88px';

const COL_HEADERS = [
  'Code / Name', 'Area Level', 'Parent Area', 'Hierarchy Path',
  'Usage Tags', 'Category', 'Status', 'Actions',
];

// ─── Component ────────────────────────────────────────────────────────────────

const AreaListPage: React.FC = () => {
  const navigate = useNavigate();

  const [areas, setAreas]     = useState<Area[]>(() => areaService.getAll());
  const allLevels              = useMemo(() => areaLevelService.getAll(), []);

  // ── Filters ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterLevelId, setFilterLevelId]     = useState('');
  const [filterUsageTag, setFilterUsageTag]   = useState('');
  const [filterCategory, setFilterCategory]   = useState('');
  const [showAdvancedFilters, setShowAdvFilters] = useState(false);

  // ── Activate flow ──────────────────────────────────────────────────────
  const [activateTarget, setActivateTarget]   = useState<Area | null>(null);
  const [activateErrors, setActivateErrors]   = useState<string[]>([]);
  const [activateOpen, setActivateOpen]       = useState(false);

  // ── Inactivate flow ────────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<Area | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen, setInactivateOpen]     = useState(false);
  const [hasActiveChildrenError, setHasActiveChildrenError] = useState(false);

  // ── Delete flow ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]       = useState<Area | null>(null);
  const [deleteOpen, setDeleteOpen]           = useState(false);

  // ── Preview / Help ─────────────────────────────────────────────────────
  const [previewArea, setPreviewArea]   = useState<Area | null>(null);
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [helpOpen, setHelpOpen]         = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Record recent master on mount ──────────────────────────────────────
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

  // ── Lookup maps ────────────────────────────────────────────────────────
  const levelMap = useMemo(() => {
    const m = new Map<string, string>();
    allLevels.forEach((l) => m.set(l.id, l.areaLevelName));
    return m;
  }, [allLevels]);

  const areaNameMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a) => m.set(a.id, a.areaName));
    return m;
  }, [areas]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return areas.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterLevelId && a.areaLevelId !== filterLevelId) return false;
      if (filterUsageTag && !a.usageTags.includes(filterUsageTag as UsageTag)) return false;
      if (filterCategory && a.areaCategory !== filterCategory) return false;
      if (q) {
        const aliasHay = a.aliases
          .filter((al) => al.status === 'Active' && al.isSearchable)
          .map((al) => al.aliasName)
          .join(' ');
        const hay = `${a.areaCode} ${a.areaName} ${a.displayName} ${a.externalLegacyCode} ${a.postalCode} ${aliasHay}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [areas, searchQuery, filterStatus, filterLevelId, filterUsageTag, filterCategory]);

  // ── Quick filter counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      areas.length,
    Active:   areas.filter((a) => a.status === 'Active').length,
    Draft:    areas.filter((a) => a.status === 'Draft').length,
    Inactive: areas.filter((a) => a.status === 'Inactive').length,
  }), [areas]);

  // ── Actions ────────────────────────────────────────────────────────────

  function handleActivateClick(area: Area) {
    const others = areaService.getAll().filter((a) => a.id !== area.id);
    const errors = validateAreaForActivation(area, allLevels, others);
    setActivateTarget(area);
    setActivateErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    areaService.activate(activateTarget.id);
    setAreas(areaService.getAll());
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
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.areaName}" inactivated.`, 'success');
    setInactivateTarget(null);
    setInactivateReason('');
  }

  function handleDeleteClick(area: Area) {
    setDeleteTarget(area);
    setDeleteOpen(true);
  }

  function handlePreviewClick(area: Area) {
    setPreviewArea(area);
    setPreviewOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    areaService.delete(deleteTarget.id);
    setAreas(areaService.getAll());
    setDeleteOpen(false);
    showToast(`"${deleteTarget.areaName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputSel: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const hasAdvancedFilter = !!(filterLevelId || filterUsageTag || filterCategory);
  const activeQuickFilter = filterStatus || 'all';

  const advancedPanel = showAdvancedFilters ? (
    <div style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 200,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      padding: '16px 20px', minWidth: '280px', marginTop: '6px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Advanced Filters
      </p>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Area Level</label>
      <select value={filterLevelId} onChange={(e) => setFilterLevelId(e.target.value)} style={{ ...inputSel, marginBottom: '12px' }}>
        <option value="">All levels</option>
        {allLevels.map((l) => <option key={l.id} value={l.id}>{l.areaLevelName}</option>)}
      </select>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Usage Tag</label>
      <select value={filterUsageTag} onChange={(e) => setFilterUsageTag(e.target.value)} style={{ ...inputSel, marginBottom: '12px' }}>
        <option value="">All tags</option>
        {USAGE_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ ...inputSel, marginBottom: '16px' }}>
        <option value="">All categories</option>
        {AREA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button type="button" onClick={() => { setFilterLevelId(''); setFilterUsageTag(''); setFilterCategory(''); setShowAdvFilters(false); }}
        style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        Clear filters
      </button>
    </div>
  ) : null;

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setShowAdvFilters((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '7px 12px', fontSize: '12px', fontWeight: 500,
          border: '1px solid var(--color-border)', borderRadius: '8px',
          background: hasAdvancedFilter ? 'var(--color-primary)' : 'var(--color-surface)',
          color: hasAdvancedFilter ? 'white' : 'var(--color-text)', cursor: 'pointer',
        }}>
        <Filter size={13} />
        Filters {hasAdvancedFilter && `(${[filterLevelId, filterUsageTag, filterCategory].filter(Boolean).length})`}
        <ChevronDown size={13} />
      </button>
      {advancedPanel}
    </div>
  );

  const tableHeader = (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID_COLS, gap: 0,
      padding: '10px 20px', borderBottom: '2px solid var(--color-border)',
      background: 'var(--color-surface-subtle)',
      position: 'sticky', top: 0, zIndex: 10, minWidth: '940px',
    }}>
      {COL_HEADERS.map((h, i) => (
        <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingRight: '12px' }}>
          {h}
        </div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
      No areas found.{' '}
      {searchQuery && (
        <button type="button" onClick={() => setSearchQuery('')} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          Clear search
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((area) => {
        const levelName  = levelMap.get(area.areaLevelId) ?? '—';
        const parentName = area.parentAreaId ? (areaNameMap.get(area.parentAreaId) ?? '—') : '—';
        const canDel     = area.status === 'Draft' && areaService.getChildren(area.id).length === 0;

        return (
          <div
            key={area.id}
            style={{
              display: 'grid', gridTemplateColumns: GRID_COLS, gap: 0,
              padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
              alignItems: 'center', minWidth: '940px', transition: 'background 0.12s',
              cursor: 'pointer',
            }}
            onClick={() => handlePreviewClick(area)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Code / Name */}
            <div style={{ paddingRight: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginBottom: '2px' }}>{area.areaCode}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }}
                onClick={() => handlePreviewClick(area)}>
                {area.areaName}
              </div>
              {area.displayName && area.displayName !== area.areaName && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{area.displayName}</div>
              )}
            </div>

            {/* Area Level */}
            <div style={{ paddingRight: '12px' }}>
              <span style={{ ...BADGE_BASE, background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px' }}>{levelName}</span>
            </div>

            {/* Parent Area */}
            <div style={{ fontSize: '13px', color: 'var(--color-text)', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {parentName}
            </div>

            {/* Hierarchy Path */}
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={area.hierarchyPath}>
              {area.hierarchyPath || '—'}
            </div>

            {/* Usage Tags */}
            <div style={{ paddingRight: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {area.usageTags.length === 0
                ? <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
                : <>
                    {area.usageTags.slice(0, 2).map((t) => <span key={t} style={TAG_PILL}>{t}</span>)}
                    {area.usageTags.length > 2 && (
                      <span style={{ ...TAG_PILL, background: '#E0E7FF', color: '#3730A3' }}>+{area.usageTags.length - 2}</span>
                    )}
                  </>
              }
            </div>

            {/* Category */}
            <div style={{ paddingRight: '12px' }}>
              {area.areaCategory
                ? <span style={{ ...BADGE_BASE, background: '#F5F3FF', color: '#6D28D9', fontSize: '10px' }}>{area.areaCategory}</span>
                : <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
              }
            </div>

            {/* Status */}
            <div style={{ paddingRight: '12px' }}>
              <span style={{ ...BADGE_BASE, ...getStatusStyle(area.status) }}>{area.status}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              <button type="button" title="Edit" onClick={() => navigate(`/admin/areas/${area.id}`)}
                style={{ display: 'inline-flex', padding: '6px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <Edit2 size={13} />
              </button>
              {area.status === 'Draft' && (
                <button type="button" title="Activate" onClick={() => handleActivateClick(area)}
                  style={{ display: 'inline-flex', padding: '6px', border: '1px solid #BBFFD8', borderRadius: '6px', background: '#F0FDF4', cursor: 'pointer', color: '#15803D' }}>
                  <Check size={13} />
                </button>
              )}
              {area.status === 'Active' && (
                <button type="button" title="Inactivate" onClick={() => handleInactivateClick(area)}
                  style={{ display: 'inline-flex', padding: '6px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                  <X size={13} />
                </button>
              )}
              {canDel && (
                <button type="button" title="Delete" onClick={() => handleDeleteClick(area)}
                  style={{ display: 'inline-flex', padding: '6px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  const activationChecklist = activateErrors.length > 0
    ? activateErrors.map((e, i) => ({ id: String(i), label: e, passed: false }))
    : [{ id: 'ready', label: 'All required fields are complete and valid.', passed: true }];

  const deleteTarget_hasChildren = deleteTarget ? areaService.getChildren(deleteTarget.id).length > 0 : false;

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#15803D' : '#DC2626',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast.message}</div>
      )}

      <AdminListPageShell
        title="Area Master"
        description="Create and manage geographic areas linked to area level hierarchy for use across sales, service, and delivery operations."
        breadcrumbs={['Admin', 'Area Master']}
        primaryAction={{ label: 'New Area', onClick: () => navigate('/admin/areas/new') }}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or alias…"
        onSearchChange={setSearchQuery}
        summaryItems={[
          { label: 'Total',    value: String(counts.all),      tone: 'neutral' },
          { label: 'Active',   value: String(counts.Active),   tone: 'success' },
          { label: 'Draft',    value: String(counts.Draft),    tone: 'neutral' },
          { label: 'Inactive', value: String(counts.Inactive), tone: 'neutral' },
        ]}
        quickFilterItems={[
          { key: 'all',      label: 'All',      count: counts.all },
          { key: 'Active',   label: 'Active',   count: counts.Active },
          { key: 'Draft',    label: 'Draft',    count: counts.Draft },
          { key: 'Inactive', label: 'Inactive', count: counts.Inactive },
        ]}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={(key) => setFilterStatus(key === 'all' ? '' : key)}
        advancedFilterActive={hasAdvancedFilter}
        onAdvancedFilterClick={() => setShowAdvFilters((v) => !v)}
        toolbarActions={toolbarActions}
        helpTopicId="area-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '940px' }}>
              {tableHeader}
              {tableBody}
            </div>
          </div>
          {filtered.length > 0 && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filtered.length}</strong> of{' '}
                <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{areas.length}</strong> {areas.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          )}
        </div>
      </AdminListPageShell>

      {/* ── Preview Drawer ─────────────────────────────────── */}
      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewArea?.areaName ?? ''}
        subtitle={`Code: ${previewArea?.areaCode ?? ''}`}
        statusLabel={previewArea?.status}
        sections={previewArea ? buildAreaPreviewSections(previewArea, allLevels) : []}
        primaryAction={{
          label: 'Edit Area',
          onClick: () => { setPreviewOpen(false); if (previewArea) navigate(`/admin/areas/${previewArea.id}`); },
        }}
        secondaryActions={[
          ...(previewArea?.status === 'Draft' ? [{
            label: 'Activate',
            onClick: () => { const a = previewArea; setPreviewOpen(false); if (a) handleActivateClick(a); },
          }] : []),
          ...(previewArea?.status === 'Active' ? [{
            label: 'Inactivate',
            onClick: () => { const a = previewArea; setPreviewOpen(false); if (a) handleInactivateClick(a); },
          }] : []),
        ]}
      />

      {/* ── Inactivate Drawer ────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => { setInactivateOpen(false); setInactivateTarget(null); setInactivateReason(''); }}
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
                onChange={(e) => setInactivateReason(e.target.value)}
                rows={4}
                placeholder="Describe why this area is being inactivated…"
                style={{
                  width: '100%', padding: '9px 12px', fontSize: '13px',
                  border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
                  borderRadius: '8px', background: 'var(--color-surface)',
                  color: 'var(--color-text)', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.6,
                }}
              />
            </>
          )}
        </div>
      </SmartFormDrawer>

      {/* ── Activate Confirm ─────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => { setActivateOpen(false); setActivateTarget(null); setActivateErrors([]); }}
        title="Activate Area"
        subtitle={activateTarget?.areaName}
        description="Review the checklist before activating this area. Once active, it can be used as a parent area."
        checklist={activationChecklist}
        warningText={activateErrors.length > 0 ? 'Resolve all issues before activating.' : undefined}
        consequenceNote="Activated areas can be selected as parent areas and used in transactions. You can inactivate this area later."
        confirmLabel="Activate"
        confirmDisabled={activateErrors.length > 0}
        onConfirm={confirmActivate}
        onCancel={() => { setActivateOpen(false); setActivateTarget(null); setActivateErrors([]); }}
      />

      {/* ── Delete Confirm ────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        title="Delete Area"
        subtitle={deleteTarget?.areaName}
        description="This action is permanent and cannot be undone."
        checklist={[
          { id: 'draft',    label: 'Area is in Draft status.',               passed: deleteTarget?.status === 'Draft' },
          { id: 'nochildren', label: 'Area has no child areas.',             passed: !deleteTarget_hasChildren },
        ]}
        warningText="This record will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        confirmDisabled={deleteTarget_hasChildren || deleteTarget?.status !== 'Draft'}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />

      {/* ── Help Drawer ──────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-master')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaListPage;
