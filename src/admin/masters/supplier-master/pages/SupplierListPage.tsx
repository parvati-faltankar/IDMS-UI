import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  Filter,
  MapPin,
  Phone,
  Trash2,
  User,
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
import type { BusinessPartner, BPStatus, BPType } from '../types/supplierMaster.types';
import { supplierService } from '../services/supplierService';
import { BP_TYPES, BP_TYPE_META } from '../constants/supplierMaster.constants';
import BPTypePickerDialog from '../components/BPTypePickerDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: BPStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#F1F5F9', color: '#64748B' };
}

function getTypeStyle(type: BPType): React.CSSProperties {
  const meta = BP_TYPE_META[type];
  return meta ? { background: meta.bgColor, color: meta.color } : { background: '#EFF6FF', color: '#1D4ED8' };
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

const GRID_COLUMNS =
  '80px minmax(180px, 1fr) 120px 130px 110px 80px 90px 100px';

const COL_HEADERS = [
  { label: 'Code',        align: 'left'   },
  { label: 'Legal Name',  align: 'left'   },
  { label: 'Type',        align: 'left'   },
  { label: 'Category',    align: 'left'   },
  { label: 'Country',     align: 'left'   },
  { label: 'Contacts',    align: 'center' },
  { label: 'Status',      align: 'left'   },
  { label: 'Actions',     align: 'right'  },
];

const MASTER_KEY = 'supplier-master';

// ─── Preview section builder ──────────────────────────────────────────────────

function buildPreviewSections(bp: BusinessPartner): PreviewSection[] {
  const primaryContact = bp.contacts.find((c) => c.contactType === 'Primary');
  const defaultAddress = bp.addresses.find((a) => a.isDefault);
  const defaultBank    = bp.bankDetails.find((b) => b.isDefaultAccount);

  const sections: PreviewSection[] = [
    {
      title: 'General Details',
      fields: [
        { label: 'BP Code',     value: bp.bpCode,     mono: true },
        { label: 'Legal Name',  value: bp.bpLegalName },
        { label: 'Type',        value: bp.bpType || '—' },
        { label: 'Category',    value: bp.bpCategory || '—' },
        { label: 'Country',     value: bp.countryOfRegistration || '—' },
        { label: 'Business Type', value: bp.businessType || '—' },
        { label: 'Industry',    value: bp.industryType || '—' },
        { label: 'Employees',   value: bp.noOfEmployees || '—' },
        { label: 'Founded',     value: bp.foundingDate || '—' },
        { label: 'Website',     value: bp.websiteUrl || '—' },
        ...(bp.effectiveFromDate ? [{ label: 'Effective From', value: bp.effectiveFromDate }] : []),
        ...(bp.description ? [{ label: 'Description', value: bp.description, span: 2 as const }] : []),
      ],
    },
  ];

  if (primaryContact) {
    sections.push({
      title: 'Primary Contact',
      fields: [
        { label: 'Name',        value: primaryContact.contactName },
        { label: 'Designation', value: primaryContact.designation || '—' },
        { label: 'Department',  value: primaryContact.department  || '—' },
        { label: 'Phone',       value: primaryContact.countryCode ? `${primaryContact.countryCode} ${primaryContact.phone}` : primaryContact.phone || '—' },
        { label: 'Email',       value: primaryContact.email || '—', span: 2 },
      ],
    });
  }

  if (defaultAddress) {
    sections.push({
      title: 'Default Address',
      fields: [
        { label: 'Type',        value: defaultAddress.addressType },
        { label: 'Address',     value: [defaultAddress.addressLine1, defaultAddress.addressLine2].filter(Boolean).join(', '), span: 2 },
        { label: 'City',        value: defaultAddress.city || '—' },
        { label: 'State',       value: defaultAddress.state || '—' },
        { label: 'PIN',         value: defaultAddress.pin || '—' },
        { label: 'Country',     value: defaultAddress.country || '—' },
      ],
    });
  }

  sections.push({
    title: 'Tax & Compliance',
    fields: [
      { label: 'Tax Registered', value: bp.taxRegistered ? 'Yes' : 'No' },
      ...(bp.taxJurisdiction ? [{ label: 'Tax Jurisdiction', value: bp.taxJurisdiction }] : []),
      { label: 'Compliance Docs', value: String(bp.complianceDocuments.length) },
    ],
  });

  if (defaultBank) {
    sections.push({
      title: 'Default Bank Account',
      fields: [
        { label: 'Bank',           value: defaultBank.bankName },
        { label: 'Branch',         value: defaultBank.branchName || '—' },
        { label: 'Account Holder', value: defaultBank.accountHolderName },
        { label: 'Account No.',    value: `••••${defaultBank.accountNumber.slice(-4)}`, mono: true },
        { label: 'Account Type',   value: defaultBank.accountType },
        { label: 'Currency',       value: defaultBank.defaultCurrency },
      ],
    });
  }

  if (bp.itemMappings.length > 0) {
    sections.push({
      title: 'Item Mapping',
      fields: [
        { label: 'Mapped Items', value: String(bp.itemMappings.length) },
        {
          label: 'Items',
          value: bp.itemMappings.slice(0, 3).map((m) => m.itemName).join(', ') +
            (bp.itemMappings.length > 3 ? ` +${bp.itemMappings.length - 3} more` : ''),
          span: 2,
        },
      ],
    });
  }

  return sections;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SupplierListPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<BusinessPartner[]>(() => supplierService.getAll());

  // ── Filters ───────────────────────────────────────────────────────────
  const [searchQuery,        setSearchQuery]        = useState('');
  const [filterStatus,       setFilterStatus]       = useState('');
  const [filterType,         setFilterType]         = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ── Activate flow ─────────────────────────────────────────────────────
  const [activateTarget, setActivateTarget] = useState<BusinessPartner | null>(null);
  const [activateOpen,   setActivateOpen]   = useState(false);

  // ── Inactivate flow ───────────────────────────────────────────────────
  const [inactivateTarget, setInactivateTarget] = useState<BusinessPartner | null>(null);
  const [inactivateReason, setInactivateReason] = useState('');
  const [inactivateOpen,   setInactivateOpen]   = useState(false);

  // ── Delete flow ───────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<BusinessPartner | null>(null);
  const [deleteOpen,   setDeleteOpen]   = useState(false);

  // ── Preview ───────────────────────────────────────────────────────────
  const [previewBP,   setPreviewBP]   = useState<BusinessPartner | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Help ─────────────────────────────────────────────────────────────
  const [helpOpen, setHelpOpen] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);


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
    return records.filter((bp) => {
      if (filterStatus && bp.status !== filterStatus) return false;
      if (filterType   && bp.bpType   !== filterType)  return false;
      if (q) {
        const haystack =
          `${bp.bpCode} ${bp.bpLegalName} ${bp.marketingName} ${bp.displayName} ${bp.bpType} ${bp.bpCategory}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterType]);

  // ── Quick filter counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:      records.length,
    Active:   records.filter((bp) => bp.status === 'Active').length,
    Draft:    records.filter((bp) => bp.status === 'Draft').length,
    Inactive: records.filter((bp) => bp.status === 'Inactive').length,
  }), [records]);
  // ── Actions ───────────────────────────────────────────────────────────

  function handleQuickFilter(key: string) {
    setFilterStatus(key === 'all' ? '' : key);
  }

  function handleActivateClick(bp: BusinessPartner) {
    setActivateTarget(bp);
    setActivateOpen(true);
  }

  function confirmActivate() {
    if (!activateTarget) return;
    supplierService.activate(activateTarget.id);
    setRecords(supplierService.getAll());
    setActivateOpen(false);
    showToast(`"${activateTarget.bpLegalName}" activated.`, 'success');
    setActivateTarget(null);
  }

  function handleInactivateClick(bp: BusinessPartner) {
    setInactivateTarget(bp);
    setInactivateReason('');
    setInactivateOpen(true);
  }

  function confirmInactivate() {
    if (!inactivateTarget || !inactivateReason.trim()) return;
    supplierService.inactivate(inactivateTarget.id, inactivateReason.trim());
    setRecords(supplierService.getAll());
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.bpLegalName}" inactivated.`, 'success');
    setInactivateTarget(null);
    setInactivateReason('');
  }

  function handleDeleteClick(bp: BusinessPartner) {
    setDeleteTarget(bp);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    supplierService.delete(deleteTarget.id);
    setRecords(supplierService.getAll());
    setDeleteOpen(false);
    showToast(`"${deleteTarget.bpLegalName}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  // ── Styles ────────────────────────────────────────────────────────────

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    outline: 'none', boxSizing: 'border-box',
  };

  // ── Render ────────────────────────────────────────────────────────────

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
        BP Type
      </label>
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        style={{ ...inputBase, marginBottom: '16px' }}
      >
        <option value="">All types</option>
        {BP_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => { setFilterType(''); setShowAdvancedFilters(false); }}
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
          border: `1px solid ${filterType ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          background: filterType ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
          color: filterType ? 'var(--color-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
      >
        <Filter size={11} />
        Filters
        {filterType && (
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
        {records.length === 0 ? <Building2 size={20} style={{ color: 'var(--color-text-muted)' }} /> : <Filter size={20} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {records.length === 0 ? 'No business partners yet' : 'No partners match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
        {records.length === 0
          ? 'Add suppliers, transporters, financiers, and other business partners to get started.'
          : 'Try adjusting your search or filters.'}
      </div>
      {records.length === 0 && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '32px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
        >
          + New Business Partner
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((bp, idx) => {
        const isLast    = idx === filtered.length - 1;
        const canDelete = bp.status === 'Draft';
        const primaryContact = bp.contacts.find((c) => c.contactType === 'Primary');
        return (
          <div
            key={bp.id}
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
            onClick={() => { setPreviewBP(bp); setPreviewOpen(true); }}
          >
            {/* Code */}
            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {bp.bpCode}
            </div>

            {/* Legal Name */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bp.bpLegalName}
              </div>
              {bp.displayName && bp.displayName !== bp.bpLegalName && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bp.displayName}
                </div>
              )}
            </div>

            {/* Type */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE_BASE, ...getTypeStyle(bp.bpType), borderRadius: '9999px' }}>
                {bp.bpType}
              </span>
            </div>

            {/* Category */}
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {bp.bpCategory || '—'}
            </div>

            {/* Country */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
              <MapPin size={10} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bp.countryOfRegistration || '—'}
              </span>
            </div>

            {/* Contacts count */}
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', paddingRight: '8px' }}>
              {bp.contacts.length > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <User size={10} style={{ color: 'var(--color-text-muted)' }} />
                  {bp.contacts.length}
                  {primaryContact && (
                    <Phone size={9} style={{ color: '#16A34A' }} />
                  )}
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>—</span>
              )}
            </div>

            {/* Status */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE_BASE, ...getStatusStyle(bp.status), borderRadius: '9999px' }}>
                {bp.status}
              </span>
            </div>

            {/* Actions */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Edit"
                onClick={() => navigate(`/admin/supplier-master/${bp.id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              {bp.status === 'Draft' && (
                <button
                  type="button"
                  title="Activate"
                  onClick={() => handleActivateClick(bp)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', color: '#15803D' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              )}
              {bp.status === 'Active' && (
                <button
                  type="button"
                  title="Inactivate"
                  onClick={() => handleInactivateClick(bp)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  title="Delete"
                  onClick={() => handleDeleteClick(bp)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: '#DC2626' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  return (
    <AdminShell>
      <AdminListPageShell
        title="Business Partner Master"
        description="Manage suppliers, transporters, financiers, insurance providers, and customers."
        breadcrumbs={['Admin', 'Business Partners', 'Supplier Master']}
        primaryAction={{ label: '+ New Business Partner', onClick: () => setPickerOpen(true) }}
        helpTopicId="supplier-master"
        onHelpClick={() => setHelpOpen(true)}
        searchValue={searchQuery}
        searchPlaceholder="Search by code, name, or type…"
        onSearchChange={setSearchQuery}
        quickFilterItems={quickFilterItems}
        activeQuickFilter={activeFilter}
        onQuickFilterChange={handleQuickFilter}
        toolbarActions={toolbarActions}
      >
        {/* ── Table view ────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {tableHeader}
          {tableBody}
        </div>
      </AdminListPageShell>

      {/* ── Activate confirm ────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate Business Partner"
        subtitle={activateTarget?.bpLegalName}
        description="This will make the partner available in transactions."
        checklist={[
          { id: 'legal-name', label: 'Legal name is filled in',       passed: !!activateTarget?.bpLegalName },
          { id: 'bp-type',    label: 'Business partner type selected', passed: !!activateTarget?.bpType },
          { id: 'contact',    label: 'At least one contact added',     passed: (activateTarget?.contacts.length ?? 0) > 0 },
          { id: 'address',    label: 'At least one address added',     passed: (activateTarget?.addresses.length ?? 0) > 0 },
        ]}
        confirmLabel="Activate"
        onConfirm={confirmActivate}
        onCancel={() => setActivateOpen(false)}
      />

      {/* ── Inactivate drawer ───────────────────────────────────────────── */}
      <SmartFormDrawer
        open={inactivateOpen}
        onClose={() => setInactivateOpen(false)}
        title="Inactivate Business Partner"
        subtitle={inactivateTarget?.bpLegalName}
        onSave={confirmInactivate}
        onCancel={() => setInactivateOpen(false)}
        saveLabel="Inactivate"
        saveDisabled={!inactivateReason.trim()}
        validationErrors={!inactivateReason.trim() ? ['Reason for inactivation is required.'] : []}
      >
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#9A3412' }}>
              This partner will no longer be available in new transactions.
            </span>
          </div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
            Reason for inactivation <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <textarea
            value={inactivateReason}
            onChange={(e) => setInactivateReason(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Enter reason…"
          />
        </div>
      </SmartFormDrawer>

      {/* ── Delete confirm ──────────────────────────────────────────────── */}
      <SmartReviewDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Business Partner"
        subtitle={deleteTarget?.bpLegalName}
        description="This action cannot be undone. Only Draft records can be deleted."
        checklist={[{ id: 'draft', label: 'Record is in Draft status', passed: deleteTarget?.status === 'Draft' }]}
        warningText="Deletion is permanent. Consider inactivating instead."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* ── Preview drawer ──────────────────────────────────────────────── */}
      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewBP?.bpLegalName ?? ''}
        subtitle={previewBP?.bpCode}
        statusLabel={previewBP?.status}
        statusTone={
          previewBP?.status === 'Active' ? 'active'
          : previewBP?.status === 'Inactive' ? 'inactive'
          : 'draft'
        }
        summaryFields={previewBP ? [
          { label: 'Type',     value: previewBP.bpType     || '—' },
          { label: 'Category', value: previewBP.bpCategory || '—' },
          { label: 'Country',  value: previewBP.countryOfRegistration || '—' },
        ] : []}
        sections={previewBP ? buildPreviewSections(previewBP) : []}
        primaryAction={{ label: 'Edit', onClick: () => { setPreviewOpen(false); navigate(`/admin/supplier-master/${previewBP?.id}`); } }}
        secondaryActions={[
          ...(previewBP?.status === 'Draft' ? [{ label: 'Activate', onClick: () => { setPreviewOpen(false); handleActivateClick(previewBP!); } }] : []),
          ...(previewBP?.status === 'Active' ? [{ label: 'Inactivate', onClick: () => { setPreviewOpen(false); handleInactivateClick(previewBP!); } }] : []),
        ]}
        dangerAction={
          previewBP?.status === 'Draft'
            ? { label: 'Delete', onClick: () => { setPreviewOpen(false); handleDeleteClick(previewBP!); } }
            : undefined
        }
      />

      {/* ── Help drawer ─────────────────────────────────────────────────── */}
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic('supplier-master')}
        onClose={() => setHelpOpen(false)}
        titleFallback="Business Partner Master Help"
      />

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
            fontWeight: 500, color: 'white', pointerEvents: 'none',
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ── Type Picker Dialog ───────────────────────────────────────────── */}
      <BPTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </AdminShell>
  );
};

export default SupplierListPage;
