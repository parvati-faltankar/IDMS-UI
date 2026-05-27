import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  Edit2,
  Filter,
  Trash2,
  X,
} from 'lucide-react';
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
import type { AreaLevel, AreaLevelRole, AreaLevelStatus } from '../types/areaMaster.types';
import { areaLevelService } from '../services/areaLevelService';
import { canDeleteAreaLevel } from '../utils/areaLevelUsage';
import { validateAreaLevelForActivation } from '../utils/areaLevelValidation';
import { AREA_LEVEL_ROLES } from '../constants/areaMaster.constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: AreaLevelStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

function getRoleStyle(_role: AreaLevelRole): React.CSSProperties {
  return { background: '#EFF6FF', color: '#1D4ED8' };
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '6px',
  whiteSpace: 'nowrap',
};

const TAG_PILL: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 7px',
  fontSize: '10px',
  fontWeight: 500,
  borderRadius: '4px',
  background: '#F1F5F9',
  color: '#475569',
  whiteSpace: 'nowrap',
};

const GRID_COLUMNS =
  '88px minmax(130px, 1.5fr) minmax(110px, 1fr) 56px 150px 88px minmax(130px, 1fr) 80px 80px';

const COL_HEADERS = [
  { label: 'Code',         align: 'left'  },
  { label: 'Name',         align: 'left'  },
  { label: 'Display / Short', align: 'left' },
  { label: 'Seq',          align: 'center'},
  { label: 'Role',         align: 'left'  },
  { label: 'Parent Req.',  align: 'left'  },
  { label: 'Usage Tags',   align: 'left'  },
  { label: 'Status',       align: 'left'  },
  { label: 'Actions',      align: 'right' },
];

const MASTER_KEY = 'area-master';

// ─── Preview section builder ──────────────────────────────────────────────────

function buildLevelPreviewSections(level: AreaLevel, allLevels: AreaLevel[]): PreviewSection[] {
  const allowedParentNames = level.allowedParentLevelIds.length > 0
    ? level.allowedParentLevelIds.map((id) => allLevels.find((l) => l.id === id)?.areaLevelName ?? id).join(', ')
    : 'None';
  return [
    {
      title: 'Basic Information',
      fields: [
        { label: 'Code', value: level.areaLevelCode, mono: true },
        { label: 'Name', value: level.areaLevelName },
        { label: 'Display Name', value: level.displayName || '—' },
        { label: 'Short Code', value: level.shortCode || '—', mono: true },
        { label: 'Level Sequence', value: level.levelSequence ? String(level.levelSequence) : '—' },
        { label: 'Role', value: level.areaLevelRole || '—' },
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
    ...(level.description || level.remarks ? [{
      title: 'Notes',
      fields: [
        ...(level.description ? [{ label: 'Description', value: level.description, span: 2 as const }] : []),
        ...(level.remarks ? [{ label: 'Remarks', value: level.remarks, span: 2 as const }] : []),
      ],
    }] : []),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

const AreaLevelListPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────
  const [levels, setLevels] = useState<AreaLevel[]>(() => areaLevelService.getAll());

  // ── Filters ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterStatus, setFilterStatus]         = useState('');
  const [filterRole, setFilterRole]             = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Activate flow ─────────────────────────────────────────────────────
  const [activateTarget, setActivateTarget]     = useState<AreaLevel | null>(null);
  const [activateErrors, setActivateErrors]     = useState<string[]>([]);
  const [activateOpen, setActivateOpen]         = useState(false);

  // ── Inactivate flow ───────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<AreaLevel | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen, setInactivateOpen]     = useState(false);

  // ── Delete flow ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]         = useState<AreaLevel | null>(null);
  const [deleteOpen, setDeleteOpen]             = useState(false);
  // ── Preview ───────────────────────────────────────────────────────────
  const [previewLevel, setPreviewLevel] = useState<AreaLevel | null>(null);
  const [previewOpen, setPreviewOpen]   = useState(false);

  // ── Help ─────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);
  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Recent admin master tracking ──────────────────────────────────────
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
    return levels.filter((l) => {
      if (filterStatus && l.status !== filterStatus) return false;
      if (filterRole && l.areaLevelRole !== filterRole) return false;
      if (q) {
        const haystack =
          `${l.areaLevelCode} ${l.areaLevelName} ${l.displayName} ${l.shortCode}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [levels, searchQuery, filterStatus, filterRole]);

  // ── Quick filter counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      levels.length,
    Active:   levels.filter((l) => l.status === 'Active').length,
    Draft:    levels.filter((l) => l.status === 'Draft').length,
    Inactive: levels.filter((l) => l.status === 'Inactive').length,
  }), [levels]);

  // ── Actions ───────────────────────────────────────────────────────────

  function handleQuickFilter(key: string) {
    setFilterStatus(key === 'all' ? '' : key);
  }

  function handleActivateClick(level: AreaLevel) {
    const allLevels = areaLevelService.getAll();
    const others = allLevels.filter((l) => l.id !== level.id);
    const errors = validateAreaLevelForActivation(level, others);
    setActivateTarget(level);
    setActivateErrors(errors);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    areaLevelService.activate(activateTarget.id);
    setLevels(areaLevelService.getAll());
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
    setDeleteOpen(false);
    showToast(`"${deleteTarget.areaLevelName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  function handlePreviewClick(level: AreaLevel) {
    setPreviewLevel(level);
    setPreviewOpen(true);
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const activeFilter = filterStatus || 'all';

  const quickFilterItems = [
    { key: 'all',      label: 'All',      count: counts.all },
    { key: 'Active',   label: 'Active',   count: counts.Active },
    { key: 'Draft',    label: 'Draft',    count: counts.Draft },
    { key: 'Inactive', label: 'Inactive', count: counts.Inactive },
  ];

  const advancedFilterPanel = showAdvancedFilters ? (
    <div
      style={{
        position: 'absolute', top: '100%', right: 0, zIndex: 200,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        padding: '16px 20px', minWidth: '260px', marginTop: '6px',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Advanced Filters
      </p>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
        Area Level Role
      </label>
      <select
        value={filterRole}
        onChange={(e) => setFilterRole(e.target.value)}
        style={{ ...inputBase, marginBottom: '16px' }}
      >
        <option value="">All roles</option>
        {AREA_LEVEL_ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => { setFilterRole(''); setShowAdvancedFilters(false); }}
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
          border: `1px solid ${filterRole ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          background: filterRole ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
          color: filterRole ? 'var(--color-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
      >
        <Filter size={11} />
        Filters
        {filterRole && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
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
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Filter size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {levels.length === 0 ? 'No area levels yet' : 'No area levels match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto 24px', lineHeight: 1.6 }}>
        {levels.length === 0
          ? 'Create an Area Level to define the hierarchy structure for your geographic master data.'
          : 'Try adjusting your search or filters to find what you\'re looking for.'}
      </div>
      {levels.length === 0 && (
        <button type="button" onClick={() => navigate('/admin/area-levels/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '32px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
          + New Area Level
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((level, idx) => {
        const isLast = idx === filtered.length - 1;
        const canDel = level.status === 'Draft' && canDeleteAreaLevel(level.id);
        return (
          <div
            key={level.id}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              alignItems: 'center',
              height: '44px',
              padding: '0 16px',
              borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
              transition: 'background 0.1s',
              cursor: 'pointer',
            }}
            onClick={() => handlePreviewClick(level)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Code */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                {level.areaLevelCode}
              </span>
            </div>

            {/* Name */}
            <div style={{ minWidth: 0, paddingRight: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {level.areaLevelName}
              </span>
            </div>

            {/* Display / Short */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {level.displayName || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                {level.shortCode}
              </div>
            </div>

            {/* Seq */}
            <div style={{ paddingRight: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                {level.levelSequence || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
              </span>
            </div>

            {/* Role */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE_BASE, ...getRoleStyle(level.areaLevelRole), fontSize: '10px' }}>
                {level.areaLevelRole || '—'}
              </span>
            </div>

            {/* Parent Required */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{
                ...BADGE_BASE, fontSize: '11px',
                background: level.parentRequired ? '#F0FDF4' : '#F8FAFC',
                color: level.parentRequired ? '#15803D' : '#64748B',
              }}>
                {level.parentRequired ? 'Yes' : 'No'}
              </span>
            </div>

            {/* Usage Tags */}
            <div style={{ paddingRight: '8px', display: 'flex', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', overflow: 'hidden' }}>
              {level.allowedUsageTags.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
              ) : (
                <>
                  {level.allowedUsageTags.slice(0, 2).map((t) => (
                    <span key={t} style={TAG_PILL}>{t}</span>
                  ))}
                  {level.allowedUsageTags.length > 2 && (
                    <span style={{ ...TAG_PILL, background: '#E0E7FF', color: '#3730A3' }}>
                      +{level.allowedUsageTags.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Status */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', whiteSpace: 'nowrap', ...getStatusStyle(level.status) }}>
                {level.status}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button" title="Edit"
                onClick={() => navigate(`/admin/area-levels/${level.id}`)}
                style={{ display: 'inline-flex', padding: '5px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <Edit2 size={13} />
              </button>
              {level.status === 'Draft' && (
                <button
                  type="button" title="Activate"
                  onClick={() => handleActivateClick(level)}
                  style={{ display: 'inline-flex', padding: '5px', border: '1px solid #BBFFD8', borderRadius: '6px', background: '#F0FDF4', cursor: 'pointer', color: '#15803D' }}
                >
                  <Check size={13} />
                </button>
              )}
              {level.status === 'Active' && (
                <button
                  type="button" title="Inactivate"
                  onClick={() => handleInactivateClick(level)}
                  style={{ display: 'inline-flex', padding: '5px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}
                >
                  <X size={13} />
                </button>
              )}
              {canDel && (
                <button
                  type="button" title="Delete"
                  onClick={() => handleDeleteClick(level)}
                  style={{ display: 'inline-flex', padding: '5px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}
                >
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
    : [{ id: 'ready', label: 'All required fields are filled and valid.', passed: true }];

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            color: 'white', padding: '12px 20px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Area Level Configuration"
        description="Define hierarchical levels such as Country, State, City, and Area for use across masters and transactions."
        breadcrumbs={['Admin', 'Area Master', 'Area Level Configuration']}
        primaryAction={{ label: 'New Area Level', onClick: () => navigate('/admin/area-levels/new') }}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or short code…"
        onSearchChange={setSearchQuery}
        quickFilterItems={quickFilterItems}
        activeQuickFilter={activeFilter}
        onQuickFilterChange={handleQuickFilter}
        advancedFilterActive={!!filterRole}
        onAdvancedFilterClick={() => setShowAdvancedFilters((v) => !v)}
        toolbarActions={toolbarActions}
        helpTopicId="area-level-setup"
        onHelpClick={() => setHelpOpen(true)}
      >
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '900px' }}>
              {tableHeader}
              {tableBody}
            </div>
          </div>
          {filtered.length > 0 && (
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filtered.length}</strong> of{' '}
                <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{levels.length}</strong> {levels.length === 1 ? 'record' : 'records'}
              </span>
            </div>
          )}
        </div>
      </AdminListPageShell>

      {/* ── Preview Drawer ─────────────────────────────────────────── */}
      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewLevel?.areaLevelName ?? ''}
        subtitle={previewLevel?.areaLevelCode}
        statusLabel={previewLevel?.status}
        statusTone={previewLevel?.status === 'Active' ? 'active' : previewLevel?.status === 'Inactive' ? 'inactive' : 'draft'}
        sections={previewLevel ? buildLevelPreviewSections(previewLevel, levels) : []}
        primaryAction={{ label: 'Edit Area Level', onClick: () => { setPreviewOpen(false); navigate(`/admin/area-levels/${previewLevel?.id}`); } }}
        secondaryActions={[
          ...(previewLevel?.status === 'Draft' ? [{ label: 'Activate', onClick: () => { const l = previewLevel; setPreviewOpen(false); if (l) handleActivateClick(l); } }] : []),
          ...(previewLevel?.status === 'Active' ? [{ label: 'Inactivate', onClick: () => { const l = previewLevel; setPreviewOpen(false); if (l) handleInactivateClick(l); } }] : []),
        ]}
      />

      {/* ── Inactivate Drawer ─────────────────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => { setInactivateOpen(false); setInactivateTarget(null); setInactivateReason(''); }}
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
            onChange={(e) => setInactivateReason(e.target.value)}
            rows={4}
            placeholder="Describe why this area level is being inactivated…"
            style={{
              width: '100%', padding: '9px 12px', fontSize: '13px',
              border: `1px solid ${inactivateReason.trim() ? 'var(--color-border)' : '#FCA5A5'}`,
              borderRadius: '8px', background: 'var(--color-surface)',
              color: 'var(--color-text)', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />
        </div>
      </SmartFormDrawer>

      {/* ── Activate Confirm ──────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => { setActivateOpen(false); setActivateTarget(null); setActivateErrors([]); }}
        title="Activate Area Level"
        subtitle={activateTarget?.areaLevelName}
        description="Review the checklist below before activating this area level. Once active, it becomes available for use in Area Master."
        checklist={activationChecklist}
        warningText={activateErrors.length > 0 ? 'Fix the issues above before activating.' : undefined}
        consequenceNote="Activated area levels can be used to define geographic hierarchies. This action can be reversed by inactivating."
        confirmLabel="Activate"
        confirmDisabled={activateErrors.length > 0}
        onConfirm={confirmActivate}
        onCancel={() => { setActivateOpen(false); setActivateTarget(null); setActivateErrors([]); }}
      />

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
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
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
      />
      {/* ── Help Drawer ───────────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('area-level-setup')}
        onClose={() => setHelpOpen(false)}
      />
    </AdminShell>
  );
};

export default AreaLevelListPage;
