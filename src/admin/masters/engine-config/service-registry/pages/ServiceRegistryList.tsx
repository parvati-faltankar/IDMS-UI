import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server } from 'lucide-react';
import AdminShell from '../../../../AdminShell';
import { AdminListPageShell } from '../../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { findGroupForMasterKey, findMasterByKey } from '../../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../../adminStorage';
import type { ServiceConfig } from '../services/serviceRegistryService';
import { loadServices } from '../services/serviceRegistryService';

const MASTER_KEY = 'service-registry';
const GRID_COLUMNS = '160px minmax(150px,1fr) minmax(180px,1fr) 90px 80px 100px';
const COL_HEADERS = [
  { label: 'Service Code', align: 'left' },
  { label: 'Service Name', align: 'left' },
  { label: 'Endpoint URL', align: 'left' },
  { label: 'Timeout (ms)', align: 'center' },
  { label: 'Active',       align: 'center' },
  { label: 'Actions',      align: 'right' },
];

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap',
};

function getActiveStyle(isActive: boolean): React.CSSProperties {
  return isActive ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FEF2F2', color: '#DC2626' };
}

function buildPreviewSections(svc: ServiceConfig): PreviewSection[] {
  return [
    {
      title: 'Service Details',
      fields: [
        { label: 'Service Code',  value: svc.serviceCode, mono: true },
        { label: 'Endpoint URL',  value: svc.endpointUrl, mono: true, span: 2 },
        { label: 'Timeout (ms)',  value: String(svc.timeoutMs) },
        { label: 'Status',        value: svc.isActive ? 'Active' : 'Inactive' },
        { label: 'Fallback',      value: svc.fallbackPolicy },
      ],
    },
    {
      title: 'Retry Policy',
      fields: [
        { label: 'Max Retries',  value: String(svc.retryPolicy.maxRetries) },
        { label: 'Delay (ms)',   value: String(svc.retryPolicy.retryDelayMs) },
        { label: 'Backoff',      value: `×${svc.retryPolicy.backoffMultiplier}` },
      ],
    },
    ...(svc.actionCodes.length > 0
      ? [{ title: `Action Codes (${svc.actionCodes.length})`, fields: svc.actionCodes.map((c) => ({ label: '', value: c, mono: true })) }]
      : []),
  ];
}

const ServiceRegistryList: React.FC = () => {
  const navigate = useNavigate();
  const [records,      setRecords]      = useState<ServiceConfig[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isOffline,    setIsOffline]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [preview,      setPreview]      = useState<ServiceConfig | null>(null);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone }); setTimeout(() => setToast(null), 3500);
  }

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, isOffline: offline } = await loadServices();
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filterActive === 'active' && !r.isActive) return false;
      if (filterActive === 'inactive' && r.isActive) return false;
      if (q && !`${r.serviceCode} ${r.serviceName} ${r.endpointUrl}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [records, search, filterActive]);

  const counts = useMemo(() => ({ all: records.length, active: records.filter((r) => r.isActive).length, inactive: records.filter((r) => !r.isActive).length }), [records]);

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
        <Server size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {isLoading ? 'Loading services…' : records.length === 0 ? 'No services registered' : 'No services match the current filters'}
      </div>
    </div>
  ) : (
    <>
      {filtered.map((svc, idx) => (
        <div key={svc.serviceCode} style={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, alignItems: 'center', height: '44px', padding: '0 16px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', transition: 'background 0.10s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
          onClick={() => { setPreview(svc); setPreviewOpen(true); }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{svc.serviceCode}</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{svc.serviceName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{svc.endpointUrl}</div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '8px' }}>{svc.timeoutMs.toLocaleString()}</div>
          <div style={{ textAlign: 'center', paddingRight: '8px' }}>
            <span style={{ ...BADGE_BASE, ...getActiveStyle(svc.isActive) }}>{svc.isActive ? 'Yes' : 'No'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate(`/admin/engine-config/services/${svc.serviceCode}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>Edit</button>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <AdminShell>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: toast.tone === 'success' ? '#111827' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.message}</div>}
      <AdminListPageShell
        title="Service Registry"
        description="Manage backend service registrations including endpoints, timeouts, retry policies, and action codes."
        breadcrumbs={['Admin', 'Engine Configuration', 'Service Registry']}
        primaryAction={{ label: '+ New Service', onClick: () => navigate('/admin/engine-config/services/new') }}
        searchValue={search} searchPlaceholder="Search by code, name or endpoint…" onSearchChange={setSearch}
        quickFilterItems={[{ key: 'all', label: 'All', count: counts.all }, { key: 'active', label: 'Active', count: counts.active }, { key: 'inactive', label: 'Inactive', count: counts.inactive }]}
        activeQuickFilter={filterActive || 'all'} onQuickFilterChange={(k) => setFilterActive(k === 'all' ? '' : k)}>
        {isOffline && <div style={{ padding: '8px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>⚠ Engine API is offline — showing seed data. Changes will not be persisted.</div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
          {tableHeader}
          <div style={{ flex: 1, overflowY: 'auto' }}>{tableBody}</div>
        </div>
      </AdminListPageShell>

      <SmartPreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} title={preview?.serviceName ?? ''} subtitle={preview?.serviceCode} statusLabel={preview ? (preview.isActive ? 'Active' : 'Inactive') : undefined} statusTone={preview ? (preview.isActive ? 'active' : 'inactive') : undefined} sections={preview ? buildPreviewSections(preview) : []}
        primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); if (preview) navigate(`/admin/engine-config/services/${preview.serviceCode}`); } }} />
    </AdminShell>
  );
};

export default ServiceRegistryList;
