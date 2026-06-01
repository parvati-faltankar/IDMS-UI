import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, GitBranch } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { AdminListPageShell } from '../../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { findGroupForMasterKey, findMasterByKey } from '../../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../../adminStorage';
import type { RuleSetConfig } from '../services/ruleSetService';
import { loadRuleSets, removeRuleSet } from '../services/ruleSetService';

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'rule-engine-config';
const GRID_COLUMNS = '160px 120px minmax(180px,1fr) 80px 70px 80px 100px';
const COL_HEADERS = [
  { label: 'Rule Set Code', align: 'left' },
  { label: 'Entity',        align: 'left' },
  { label: 'Name',          align: 'left' },
  { label: 'Version',       align: 'center' },
  { label: 'Rules',         align: 'center' },
  { label: 'Active',        align: 'center' },
  { label: 'Actions',       align: 'right' },
];

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', fontSize: '11px', fontWeight: 600,
  borderRadius: '6px', whiteSpace: 'nowrap',
};

function getActiveStyle(isActive: boolean): React.CSSProperties {
  return isActive
    ? { background: '#DCFCE7', color: '#15803D' }
    : { background: '#FEF2F2', color: '#DC2626' };
}

function buildPreviewSections(rs: RuleSetConfig): PreviewSection[] {
  const byType: Record<string, number> = {};
  for (const r of rs.rules) {
    byType[r.ruleType] = (byType[r.ruleType] ?? 0) + 1;
  }
  return [
    {
      title: 'Rule Set Details',
      fields: [
        { label: 'Rule Set Code', value: rs.ruleSetCode, mono: true },
        { label: 'Entity',        value: rs.entityName },
        { label: 'Version',       value: String(rs.version) },
        { label: 'Status',        value: rs.isActive ? 'Active' : 'Inactive' },
        ...(rs.description ? [{ label: 'Description', value: rs.description, span: 2 as const }] : []),
      ],
    },
    ...(rs.rules.length > 0
      ? [{
          title: `Rules (${rs.rules.length})`,
          fields: Object.entries(byType).map(([type, count]) => ({
            label: type,
            value: `${count} rule${count !== 1 ? 's' : ''}`,
            mono: true,
          })),
        }]
      : []),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

const RuleEngineConfigList: React.FC = () => {
  const navigate = useNavigate();

  const [records,    setRecords]    = useState<RuleSetConfig[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isOffline,  setIsOffline]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [preview,      setPreview]      = useState<RuleSetConfig | null>(null);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RuleSetConfig | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const { data, isOffline: offline } = await loadRuleSets();
    setRecords(data);
    setIsOffline(offline);
    setIsLoading(false);
  }, []);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group  = findGroupForMasterKey(MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, []);

  const entities = useMemo(
    () => [...new Set(records.map((r) => r.entityName))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filterEntity && r.entityName !== filterEntity) return false;
      if (filterActive === 'active' && !r.isActive) return false;
      if (filterActive === 'inactive' && r.isActive) return false;
      if (q) {
        const hay = `${r.ruleSetCode} ${r.ruleSetName} ${r.entityName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, search, filterEntity, filterActive]);

  const counts = useMemo(() => ({
    all:      records.length,
    active:   records.filter((r) => r.isActive).length,
    inactive: records.filter((r) => !r.isActive).length,
  }), [records]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeRuleSet(deleteTarget.ruleSetCode);
    setRecords((prev) => prev.filter((r) => r.ruleSetCode !== deleteTarget.ruleSetCode));
    if (preview?.ruleSetCode === deleteTarget.ruleSetCode) setPreviewOpen(false);
    setDeleteOpen(false);
    showToast(`"${deleteTarget.ruleSetName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  const activeQuickFilter = filterActive || 'all';

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '0 10px', height: '30px', fontSize: '12px', fontWeight: 500,
          border: `1px solid ${filterEntity ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          background: filterEntity ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
          color: filterEntity ? 'var(--color-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        <Filter size={11} /> Filters
        {filterEntity && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
      </button>
      {showFilters && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 200, marginTop: '6px',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '16px 20px', minWidth: '220px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Filters</p>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Entity</label>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} style={{ ...inputBase, marginBottom: '12px' }}>
            <option value="">All entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <button type="button" onClick={() => { setFilterEntity(''); setShowFilters(false); }}
            style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );

  const tableHeader = (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center',
      height: '36px', padding: '0 16px', borderBottom: '1.5px solid var(--color-border)',
      background: 'var(--color-surface-subtle)', position: 'sticky', top: 0, zIndex: 10,
    }}>
      {COL_HEADERS.map(({ label, align }, i) => (
        <div key={i} style={{
          fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          textAlign: align as React.CSSProperties['textAlign'],
          paddingRight: i < COL_HEADERS.length - 1 ? '8px' : '0',
        }}>{label}</div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <GitBranch size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {isLoading ? 'Loading rule sets…' : records.length === 0 ? 'No rule sets configured' : 'No rule sets match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
        {isLoading ? '' : records.length === 0 ? 'Add rule sets to configure business validation and derivation logic.' : 'Try adjusting your search or filters.'}
      </div>
    </div>
  ) : (
    <>
      {filtered.map((rs, idx) => (
        <div
          key={rs.ruleSetCode}
          style={{
            display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center',
            height: '44px', padding: '0 16px',
            borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
            cursor: 'pointer', transition: 'background 0.10s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
          onClick={() => { setPreview(rs); setPreviewOpen(true); }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {rs.ruleSetCode}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {rs.entityName}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {rs.ruleSetName}
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '8px' }}>v{rs.version}</div>
          <div style={{ textAlign: 'center', paddingRight: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', borderRadius: '4px', padding: '1px 6px' }}>{rs.rules.length}</span>
          </div>
          <div style={{ textAlign: 'center', paddingRight: '8px' }}>
            <span style={{ ...BADGE_BASE, ...getActiveStyle(rs.isActive) }}>{rs.isActive ? 'Yes' : 'No'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate(`/admin/engine-config/rule-sets/${rs.ruleSetCode}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>Edit</button>
            <button onClick={() => { setDeleteTarget(rs); setDeleteOpen(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: '6px', fontSize: '13px', color: '#9CA3AF' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>×</button>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#111827' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast.message}</div>
      )}
      <AdminListPageShell
        title="Rule Engine Configuration"
        description="Manage rule sets that govern validation, derivation, and approval triggers across entities."
        breadcrumbs={['Admin', 'Engine Configuration', 'Rule Engine']}
        primaryAction={{ label: '+ New Rule Set', onClick: () => navigate('/admin/engine-config/rule-sets/new') }}
        searchValue={search}
        searchPlaceholder="Search by code, name or entity…"
        onSearchChange={setSearch}
        quickFilterItems={[
          { key: 'all',      label: 'All',      count: counts.all },
          { key: 'active',   label: 'Active',   count: counts.active },
          { key: 'inactive', label: 'Inactive', count: counts.inactive },
        ]}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={(k) => setFilterActive(k === 'all' ? '' : k)}
        toolbarActions={toolbarActions}
      >
        {isOffline && (
          <div style={{ padding: '8px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>
            ⚠ Engine API is offline — showing seed data. Changes will not be persisted.
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
          {tableHeader}
          <div style={{ flex: 1, overflowY: 'auto' }}>{tableBody}</div>
        </div>
      </AdminListPageShell>

      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={preview?.ruleSetName ?? ''}
        subtitle={preview?.ruleSetCode}
        statusLabel={preview ? (preview.isActive ? 'Active' : 'Inactive') : undefined}
        statusTone={preview ? (preview.isActive ? 'active' : 'inactive') : undefined}
        sections={preview ? buildPreviewSections(preview) : []}
        primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); if (preview) navigate(`/admin/engine-config/rule-sets/${preview.ruleSetCode}`); } }}
        dangerAction={{ label: 'Delete', onClick: () => { setPreviewOpen(false); if (preview) { setDeleteTarget(preview); setDeleteOpen(true); } } }}
      />

      {deleteOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>Delete rule set?</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              <strong>{deleteTarget.ruleSetName}</strong> and all its {deleteTarget.rules.length} rule{deleteTarget.rules.length !== 1 ? 's' : ''} will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}
                style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="button" onClick={() => { void handleDelete(); }}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default RuleEngineConfigList;
