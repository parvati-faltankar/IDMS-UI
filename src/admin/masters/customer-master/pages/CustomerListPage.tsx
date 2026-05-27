import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Filter, Landmark, Truck, User, Users } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { Customer, CustomerStatus, CustomerType } from '../types/customerMaster.types';
import { customerService } from '../services/customerService';
import { CUSTOMER_TYPES, CUSTOMER_STATUSES, CUSTOMER_TYPE_META } from '../constants/customerMaster.constants';
import CustomerTypePickerDialog from '../components/CustomerTypePickerDialog';

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_MASTER_KEY = 'customer-master';

// ─── Style helpers ────────────────────────────────────────────────────────────

function getStatusStyle(status: CustomerStatus): React.CSSProperties {
  if (status === 'Active')   return { background: '#DCFCE7', color: '#15803D' };
  if (status === 'Inactive') return { background: '#F1F5F9', color: '#64748B' };
  if (status === 'Blocked')  return { background: '#FEF2F2', color: '#DC2626' };
  return { background: '#EFF6FF', color: '#1D4ED8' }; // Draft
}

function getTypeStyle(type: CustomerType): React.CSSProperties {
  const meta = CUSTOMER_TYPE_META[type];
  return meta ? { background: meta.bgColor, color: meta.color } : { background: '#F8FAFC', color: '#64748B' };
}

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap',
};

const TYPE_ICONS: Record<CustomerType, React.ReactNode> = {
  'Retail Individual': <User size={12} />,
  'Corporate':         <Building2 size={12} />,
  'Fleet':             <Truck size={12} />,
  'Government':        <Landmark size={12} />,
  'Internal':          <Users size={12} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerListPage() {
  const navigate = useNavigate();

  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState<CustomerType | ''>('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | ''>('');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [pickerOpen, setPickerOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  useEffect(() => {
    setCustomers(customerService.getAll());
    const master = findMasterByKey(FORM_MASTER_KEY);
    const group  = findGroupForMasterKey(FORM_MASTER_KEY);
    if (master && group) {
      recordRecentAdminMaster({ key: master.key, label: master.label, path: master.path, groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor });
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (filterType   && c.customerType !== filterType)     return false;
      if (filterStatus && c.customerStatus !== filterStatus) return false;
      if (q && !c.displayName.toLowerCase().includes(q) && !c.customerCode.toLowerCase().includes(q) && !c.primaryMobileNumber.includes(q) && !c.emailId.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [customers, search, filterType, filterStatus]);

  function handleDelete(c: Customer) {
    customerService.delete(c.id);
    setCustomers(customerService.getAll());
    setDeleteTarget(null);
    showToast(`"${c.displayName}" deleted.`);
  }

  const hasFilter = !!(filterType || filterStatus);

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#15803D', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      <CustomerTypePickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '14px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Admin / Business Partners</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Customer Master</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Manage customer profiles, contacts, KYC, and consent preferences.</div>
          </div>
          <button type="button" onClick={() => setPickerOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '36px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
            + New Customer
          </button>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, mobile, email…"
            style={{ flex: 1, maxWidth: '380px', padding: '7px 12px', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
          />

          {/* Filter toggle */}
          <button type="button" onClick={() => setFilterOpen((p) => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '34px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: `1px solid ${hasFilter ? 'var(--color-primary)' : 'var(--color-border)'}`, background: hasFilter ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent', color: hasFilter ? 'var(--color-primary)' : 'var(--color-text)', cursor: 'pointer' }}>
            <Filter size={13} />
            Filters {hasFilter && `(${[filterType, filterStatus].filter(Boolean).length})`}
          </button>

          {hasFilter && (
            <button type="button" onClick={() => { setFilterType(''); setFilterStatus(''); }}
              style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              Clear filters
            </button>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Filter Bar (expandable) ───────────────────────────────────────── */}
        {filterOpen && (
          <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Customer Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as CustomerType | '')}
                style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '7px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}>
                <option value="">All Types</option>
                {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CustomerStatus | '')}
                style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '7px', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}>
                <option value="">All Statuses</option>
                {CUSTOMER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── List ─────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-surface-subtle)' }}>
          {/* Table header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 24px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 2 }}>
            {['Customer Code', 'Display Name', 'Type', 'Status', 'Mobile', 'Email', 'Segment', 'Created', ''].map((h, idx) => (
              <div key={h + idx} style={{ flex: h === '' ? '0 0 100px' : h === 'Type' || h === 'Status' ? '0 0 130px' : h === 'Mobile' ? '0 0 130px' : 1, fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 6px', userSelect: 'none' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                {search || hasFilter ? 'No customers match your search' : 'No customers yet'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                {search || hasFilter ? 'Try adjusting your filters.' : 'Click "+ New Customer" to add your first customer.'}
              </p>
              {!search && !hasFilter && (
                <button type="button" onClick={() => setPickerOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 18px', height: '36px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }}>
                  + New Customer
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => navigate(`/admin/master/customer-master/${c.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 3%, var(--color-surface))')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
              >
                {/* Customer Code */}
                <div style={{ flex: 1, padding: '0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {c.customerCode || <span style={{ color: 'var(--color-text-muted)', fontFamily: 'inherit', fontWeight: 400 }}>{c.draftReferenceId || '—'}</span>}
                </div>
                {/* Display Name */}
                <div style={{ flex: 1, padding: '0 6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.displayName || '—'}
                </div>
                {/* Type */}
                <div style={{ flex: '0 0 130px', padding: '0 6px' }}>
                  <span style={{ ...BADGE_BASE, ...getTypeStyle(c.customerType), gap: '4px' }}>
                    {TYPE_ICONS[c.customerType]}
                    {c.customerType}
                  </span>
                </div>
                {/* Status */}
                <div style={{ flex: '0 0 130px', padding: '0 6px' }}>
                  <span style={{ ...BADGE_BASE, ...getStatusStyle(c.customerStatus) }}>{c.customerStatus}</span>
                </div>
                {/* Mobile */}
                <div style={{ flex: '0 0 130px', padding: '0 6px', fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {c.primaryMobileNumber || '—'}
                </div>
                {/* Email */}
                <div style={{ flex: 1, padding: '0 6px', fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.emailId || '—'}
                </div>
                {/* Segment */}
                <div style={{ flex: 1, padding: '0 6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {c.primaryCustomerSegment || '—'}
                </div>
                {/* Created */}
                <div style={{ flex: 1, padding: '0 6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                </div>
                {/* Actions */}
                <div style={{ flex: '0 0 100px', padding: '0 6px', display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => navigate(`/admin/master/customer-master/${c.id}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>
                    Edit
                  </button>
                  {c.customerStatus === 'Draft' && (
                    <button type="button" onClick={() => setDeleteTarget(c)}
                      style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>Delete Draft Customer</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Delete <strong>"{deleteTarget.displayName || deleteTarget.draftReferenceId}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteTarget(null)}
                style={{ padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(deleteTarget)}
                style={{ padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
