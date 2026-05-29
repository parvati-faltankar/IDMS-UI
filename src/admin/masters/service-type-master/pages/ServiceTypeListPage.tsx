// ─── Service Type Master — List Page ─────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { ServiceTypeRecord, STStatus } from '../types/serviceTypeMaster.types';
import { serviceTypeService } from '../services/serviceTypeService';
import { MASTER_KEY } from '../constants/serviceTypeMaster.constants';
import ServiceTypePickerDialog from '../components/ServiceTypePickerDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusTone(status: STStatus): 'active' | 'draft' | 'inactive' {
  if (status === 'Active') return 'active';
  if (status === 'Inactive') return 'inactive';
  return 'draft';
}

function statusStyle(status: STStatus): React.CSSProperties {
  if (status === 'Active') return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap',
};

const GRID_COLS = '90px minmax(180px,1fr) 130px 80px 80px 80px 90px';
const COL_HEADERS = [
  { label: 'Code',              align: 'left'   },
  { label: 'Name',              align: 'left'   },
  { label: 'Posting Type',      align: 'left'   },
  { label: 'Saleable',          align: 'center' },
  { label: 'Contract Req.',     align: 'center' },
  { label: 'Active',            align: 'center' },
  { label: 'Status',            align: 'left'   },
];

type QuickFilter = 'all' | 'active' | 'draft' | 'inactive' | 'saleable' | 'contract';

const QUICK_FILTER_ITEMS = [
  { key: 'all',      label: 'All'              },
  { key: 'active',   label: 'Active'           },
  { key: 'draft',    label: 'Draft'            },
  { key: 'inactive', label: 'Inactive'         },
  { key: 'saleable', label: 'Saleable'         },
  { key: 'contract', label: 'Contract Required'},
];

// ─── Preview builder ──────────────────────────────────────────────────────────

function buildPreviewSections(r: ServiceTypeRecord): PreviewSection[] {
  const flags: string[] = [];
  if (r.saleable) flags.push('Saleable');
  if (r.taxExempted) flags.push('Tax Exempt');
  if (r.contractRequired) flags.push('Contract Req.');
  if (r.subscriptionApplicable) flags.push('Subscription');
  if (r.active) flags.push('Active');
  if (r.isHeader) flags.push('Is Header');
  if (r.isLine) flags.push('Is Line');

  const sections: PreviewSection[] = [
    {
      title: 'Details',
      fields: [
        { label: 'Code',         value: r.code,                mono: true },
        { label: 'Name',         value: r.name },
        { label: 'Posting Type', value: r.postingType || '—' },
        { label: 'Status',       value: r.status },
        ...(r.serviceDeliveryMode ? [{ label: 'Delivery Mode', value: r.serviceDeliveryMode }] : []),
        ...(r.billingResponsibility ? [{ label: 'Billing Responsibility', value: r.billingResponsibility }] : []),
        ...(r.description ? [{ label: 'Description', value: r.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (flags.length > 0) {
    sections.push({
      title: 'Configuration Flags',
      fields: flags.map((f) => ({ label: f, value: '✓' })),
    });
  }

  if (r.labourRows.length > 0 || r.partRows.length > 0) {
    sections.push({
      title: 'Contract Relation',
      fields: [
        { label: 'Labour Rows', value: String(r.labourRows.length) },
        { label: 'Part Rows',   value: String(r.partRows.length)   },
      ],
    });
  }

  if (r.productApplicabilityRows.length > 0) {
    sections.push({
      title: 'Product Applicability',
      fields: [{ label: 'Products', value: String(r.productApplicabilityRows.length) }],
    });
  }

  sections.push({
    title: 'Audit',
    fields: [
      { label: 'Created By',    value: r.createdBy },
      { label: 'Created',       value: r.createdDate },
      { label: 'Last Modified', value: r.lastModifiedDate },
    ],
  });

  return sections;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function BoolIcon({ value }: { value: boolean }) {
  return value
    ? <CheckCircle2 size={14} color="#15803D" />
    : <XCircle size={14} color="#CBD5E1" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ServiceTypeListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords] = useState<ServiceTypeRecord[]>(() => serviceTypeService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [previewRecord, setPreviewRecord] = useState<ServiceTypeRecord | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const group  = findGroupForMasterKey(MASTER_KEY);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    const m = findMasterByKey(MASTER_KEY);
    const g  = findGroupForMasterKey(MASTER_KEY);
    if (m && g) {
      recordRecentAdminMaster({
        key: m.key, label: m.label, path: m.path,
        groupLabel: g.label, groupIconBg: g.iconBg, groupIconColor: g.iconColor,
      });
    }
  }, []);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = records;
    if (quickFilter === 'active')   list = list.filter((r) => r.status === 'Active');
    if (quickFilter === 'draft')    list = list.filter((r) => r.status === 'Draft');
    if (quickFilter === 'inactive') list = list.filter((r) => r.status === 'Inactive');
    if (quickFilter === 'saleable') list = list.filter((r) => r.saleable);
    if (quickFilter === 'contract') list = list.filter((r) => r.contractRequired);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.postingType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [records, quickFilter, searchQuery]);

  // ── Preview drawer actions ────────────────────────────────────────────────────
  function handleActivate(r: ServiceTypeRecord) {
    const updated = serviceTypeService.changeStatus(r.id, 'Active');
    if (updated) {
      setRecords(serviceTypeService.getAll());
      setPreviewRecord(updated);
      showToast(`${r.name} activated`, 'success');
    }
  }

  function handleDeactivate(r: ServiceTypeRecord) {
    const updated = serviceTypeService.changeStatus(r.id, 'Inactive');
    if (updated) {
      setRecords(serviceTypeService.getAll());
      setPreviewRecord(updated);
      showToast(`${r.name} deactivated`, 'success');
    }
  }

  // ── Summary items ────────────────────────────────────────────────────────────
  const summaryItems = [
    { label: 'Total',    value: String(records.length) },
    { label: 'Active',   value: String(records.filter((r) => r.status === 'Active').length) },
    { label: 'Draft',    value: String(records.filter((r) => r.status === 'Draft').length) },
    { label: 'Saleable', value: String(records.filter((r) => r.saleable).length) },
  ];

  const helpTopic = getHelpTopic('service-type-master');

  return (
    <AdminShell>
      <AdminListPageShell
        title="Service Type Master"
        description="Define service types with posting rules, contract configuration, billing ratios, and product applicability."
        breadcrumbs={['Admin', group?.label ?? 'Service', 'Service Type Master']}
        primaryAction={{ label: '+ New Service Type', tone: 'primary', onClick: () => setPickerOpen(true) }}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name or posting type..."
        onSearchChange={setSearchQuery}
        quickFilterItems={QUICK_FILTER_ITEMS}
        activeQuickFilter={quickFilter}
        onQuickFilterChange={(k) => setQuickFilter(k as QuickFilter)}
        summaryItems={summaryItems}
        helpTopicId="service-type-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        {/* Table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '12px', padding: '0 16px', height: '36px', alignItems: 'center', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            {COL_HEADERS.map(({ label, align }) => (
              <div key={label} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: align as React.CSSProperties['textAlign'] }}>
                {label}
              </div>
            ))}
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                No service types found.
              </div>
            )}
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => setPreviewRecord(r)}
                style={{ display: 'grid', gridTemplateColumns: GRID_COLS, gap: '12px', padding: '0 16px', height: '56px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                {/* Code */}
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{r.code}</div>
                {/* Name */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{r.name}</div>
                  {r.description && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{r.description}</div>
                  )}
                </div>
                {/* Posting Type */}
                <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{r.postingType || '—'}</div>
                {/* Saleable */}
                <div style={{ display: 'flex', justifyContent: 'center' }}><BoolIcon value={r.saleable} /></div>
                {/* Contract Req. */}
                <div style={{ display: 'flex', justifyContent: 'center' }}><BoolIcon value={r.contractRequired} /></div>
                {/* Active */}
                <div style={{ display: 'flex', justifyContent: 'center' }}><BoolIcon value={r.active} /></div>
                {/* Status */}
                <div><span style={{ ...BADGE_BASE, ...statusStyle(r.status) }}>{r.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </AdminListPageShell>

      {/* Preview Drawer */}
      {previewRecord && (
        <SmartPreviewDrawer
          open={!!previewRecord}
          onClose={() => setPreviewRecord(null)}
          title={previewRecord.name}
          subtitle={previewRecord.code}
          statusLabel={previewRecord.status}
          statusTone={statusTone(previewRecord.status)}
          summaryFields={[
            { label: 'Code',         value: previewRecord.code,                mono: true },
            { label: 'Posting Type', value: previewRecord.postingType || '—' },
            { label: 'Saleable',     value: previewRecord.saleable ? 'Yes' : 'No' },
            { label: 'Contract Req.',value: previewRecord.contractRequired ? 'Yes' : 'No' },
            { label: 'Tax Exempt',   value: previewRecord.taxExempted ? 'Yes' : 'No' },
            { label: 'Active',       value: previewRecord.active ? 'Yes' : 'No' },
          ]}
          sections={buildPreviewSections(previewRecord)}
          primaryAction={{ label: 'Edit', tone: 'primary', onClick: () => navigate(`/admin/master/service-type-master/${previewRecord.id}`) }}
          secondaryActions={[
            ...(previewRecord.status === 'Draft' || previewRecord.status === 'Inactive'
              ? [{ label: 'Activate', tone: 'default' as const, onClick: () => handleActivate(previewRecord) }]
              : []),
            ...(previewRecord.status === 'Active'
              ? [{ label: 'Deactivate', tone: 'default' as const, onClick: () => handleDeactivate(previewRecord) }]
              : []),
          ]}
        />
      )}

      {/* Profile Picker Dialog */}
      <ServiceTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />

      {/* Help Drawer */}
      {helpTopic && (
        <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} topic={helpTopic} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'white', background: toast.tone === 'success' ? '#15803D' : '#DC2626', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}>
          {toast.message}
        </div>
      )}
    </AdminShell>
  );
};

export default ServiceTypeListPage;
