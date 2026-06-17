import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Workflow } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { AdminListPageShell } from '../../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import MasterFilterDrawer from '../../../../../components/common/MasterFilterDrawer';
import { findGroupForMasterKey, findMasterByKey } from '../../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../../adminStorage';
import type { WorkflowConfig } from '../services/workflowConfigService';
import { loadWorkflows, removeWorkflow } from '../services/workflowConfigService';

const MASTER_KEY = 'workflow-config';
const GRID_COLUMNS = '180px 120px minmax(180px,1fr) 80px 70px 80px 100px';
const COL_HEADERS = [
  { label: 'Workflow Code', align: 'left' },
  { label: 'Entity',        align: 'left' },
  { label: 'Name',          align: 'left' },
  { label: 'Version',       align: 'center' },
  { label: 'Steps',         align: 'center' },
  { label: 'Active',        align: 'center' },
  { label: 'Actions',       align: 'right' },
];

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap',
};

function getActiveStyle(isActive: boolean): React.CSSProperties {
  return isActive ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FEF2F2', color: '#DC2626' };
}

function buildPreviewSections(wf: WorkflowConfig): PreviewSection[] {
  const byType: Record<string, number> = {};
  for (const s of wf.steps) { byType[s.stepType] = (byType[s.stepType] ?? 0) + 1; }
  return [
    {
      title: 'Workflow Details',
      fields: [
        { label: 'Workflow Code', value: wf.workflowCode, mono: true },
        { label: 'Entity',        value: wf.entityName },
        { label: 'Version',       value: String(wf.version) },
        { label: 'Status',        value: wf.isActive ? 'Active' : 'Inactive' },
        ...(wf.description ? [{ label: 'Description', value: wf.description, span: 2 as const }] : []),
      ],
    },
    ...(wf.steps.length > 0
      ? [{ title: `Steps (${wf.steps.length})`, fields: Object.entries(byType).map(([type, count]) => ({ label: type, value: `${count} step${count !== 1 ? 's' : ''}`, mono: true })) }]
      : []),
  ];
}

const WorkflowConfigList: React.FC = () => {
  const navigate = useNavigate();
  const [records,      setRecords]      = useState<WorkflowConfig[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isOffline,    setIsOffline]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [preview,      setPreview]      = useState<WorkflowConfig | null>(null);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkflowConfig | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, isOffline: offline } = await loadWorkflows();
      setRecords(data); setIsOffline(offline);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRecords(); }, [fetchRecords]);

  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY); const group = findGroupForMasterKey(MASTER_KEY);
    if (master && group) recordRecentAdminMaster({ key: master.key, label: master.label, path: master.path, groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor });
  }, []);

  const entities = useMemo(() => [...new Set(records.map((r) => r.entityName))].sort(), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filterEntity && r.entityName !== filterEntity) return false;
      if (filterActive === 'active' && !r.isActive) return false;
      if (filterActive === 'inactive' && r.isActive) return false;
      if (q && !`${r.workflowCode} ${r.workflowName} ${r.entityName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [records, search, filterEntity, filterActive]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeWorkflow(deleteTarget.workflowCode);
    setRecords((prev) => prev.filter((r) => r.workflowCode !== deleteTarget.workflowCode));
    if (preview?.workflowCode === deleteTarget.workflowCode) setPreviewOpen(false);
    setDeleteOpen(false);
    showToast(`"${deleteTarget.workflowName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  const hasFilters = Boolean(filterEntity || filterActive);

  const tableHeader = (
    <div style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center', height: '36px', padding: '0 16px', borderBottom: '1.5px solid var(--color-border)', background: 'var(--color-surface-subtle)', position: 'sticky', top: 0, zIndex: 10 }}>
      {COL_HEADERS.map(({ label, align }, i) => (
        <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: align as React.CSSProperties['textAlign'], paddingRight: i < COL_HEADERS.length - 1 ? '8px' : '0' }}>{label}</div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Workflow size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {isLoading ? 'Loading workflows…' : records.length === 0 ? 'No workflow definitions configured' : 'No workflows match the current filters'}
      </div>
    </div>
  ) : (
    <>
      {filtered.map((wf, idx) => (
        <div key={wf.workflowCode} style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center', height: '44px', padding: '0 16px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.10s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
          onClick={() => { setPreview(wf); setPreviewOpen(true); }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{wf.workflowCode}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{wf.entityName}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{wf.workflowName}</div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '8px' }}>v{wf.version}</div>
          <div style={{ textAlign: 'center', paddingRight: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', borderRadius: '4px', padding: '1px 6px' }}>{wf.steps.length}</span>
          </div>
          <div style={{ textAlign: 'center', paddingRight: '8px' }}>
            <span style={{ ...BADGE_BASE, ...getActiveStyle(wf.isActive) }}>{wf.isActive ? 'Yes' : 'No'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate(`/admin/engine-config/workflows/${wf.workflowCode}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>Edit</button>
            <button onClick={() => { setDeleteTarget(wf); setDeleteOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: '6px', fontSize: '13px', color: '#9CA3AF' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>×</button>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <AdminShell>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#111827' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.message}</div>}
      <AdminListPageShell
        title="Workflow Configuration"
        description="Manage workflow definitions that orchestrate multi-step business processes across entities."
        breadcrumbs={['Admin', 'Engine Configuration', 'Workflows']}
        primaryAction={{ label: '+ New Workflow', onClick: () => navigate('/admin/engine-config/workflows/new') }}
        secondaryActions={[{ label: 'Filters', onClick: () => setShowFilters(true), icon: <Filter size={13} />, iconOnly: true, title: 'Open filters', active: hasFilters }]}
        searchValue={search} searchPlaceholder="Search by code, name or entity…" onSearchChange={setSearch}>
        {isOffline && <div style={{ padding: '8px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>⚠ Engine API is offline — showing seed data. Changes will not be persisted.</div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
          {tableHeader}
          <div style={{ flex: 1, overflowY: 'auto' }}>{tableBody}</div>
        </div>
      </AdminListPageShell>

      <MasterFilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={() => { setFilterEntity(''); setFilterActive(''); }}
        description="Filter workflows by entity and active status."
        fields={[
          { id: 'workflow-entity', label: 'Entity', value: filterEntity, placeholder: 'All entities', options: entities.map((entity) => ({ value: entity, label: entity })), onChange: setFilterEntity },
          { id: 'workflow-status', label: 'Status', value: filterActive, placeholder: 'All statuses', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], onChange: setFilterActive },
        ]}
      />

      <SmartPreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} title={preview?.workflowName ?? ''} subtitle={preview?.workflowCode} statusLabel={preview ? (preview.isActive ? 'Active' : 'Inactive') : undefined} statusTone={preview ? (preview.isActive ? 'active' : 'inactive') : undefined} sections={preview ? buildPreviewSections(preview) : []}
        primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); if (preview) navigate(`/admin/engine-config/workflows/${preview.workflowCode}`); } }}
        dangerAction={{ label: 'Delete', onClick: () => { setPreviewOpen(false); if (preview) { setDeleteTarget(preview); setDeleteOpen(true); } } }} />

      {deleteOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>Delete workflow?</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}><strong>{deleteTarget.workflowName}</strong> and all its {deleteTarget.steps.length} step{deleteTarget.steps.length !== 1 ? 's' : ''} will be permanently removed.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text)' }}>Cancel</button>
              <button type="button" onClick={() => { void handleDelete(); }} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#DC2626', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default WorkflowConfigList;
