import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Eye,
  Filter,
  History,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import AdminShell from './AdminShell';
import { findGroupForMasterKey, findMasterByKey } from './adminNavConfig';
import { recordRecentAdminMaster } from './adminStorage';
import { cn } from '../utils/classNames';
import { AdminListPageShell } from '../experience/components/AdminListPageShell';
import { HelpDrawer } from '../experience/components/HelpDrawer';
import { getHelpTopic } from '../experience/help/helpTopics';

// ─── Mock data generation ────────────────────────────────────────────────────

const SAMPLE_NAMES: Record<string, string[]> = {
  default: ['Alpha Corp', 'Beta Industries', 'Gamma Solutions', 'Delta Systems', 'Epsilon Works', 'Zeta Tech', 'Eta Services', 'Theta Group', 'Iota Holdings', 'Kappa Enterprises', 'Lambda Operations', 'Mu Ventures', 'Nu Partners', 'Xi Global', 'Omicron Ltd'],
  person: ['Rahul Sharma', 'Priya Singh', 'Amit Patel', 'Deepika Reddy', 'Suresh Kumar', 'Kavitha Nair', 'Vikram Mehta', 'Anitha Joseph', 'Rajesh Gupta', 'Pooja Verma', 'Sanjay Iyer', 'Meena Pillai', 'Arjun Bose', 'Sneha Rao', 'Nikhil Joshi'],
  location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam', 'Bhopal'],
  product: ['Pulsar NS200', 'Dominar 400', 'Platina 110', 'Avenger 220', 'CT 100', 'Discover 125', 'Bajaj Chetak', 'Pulsar RS200', 'Pulsar N250', 'KTM Duke 390', 'Royal Enfield Classic 350', 'Bullet 500', 'Meteor 350', 'Himalayan', 'Hunter 350'],
};

const STATUSES = ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Inactive', 'Inactive', 'Draft'];

function pickNames(masterKey: string): string[] {
  if (masterKey.includes('employee') || masterKey.includes('user') || masterKey.includes('designation')) {
    return SAMPLE_NAMES.person;
  }
  if (masterKey.includes('area') || masterKey.includes('territory') || masterKey.includes('branch') || masterKey.includes('warehouse')) {
    return SAMPLE_NAMES.location;
  }
  if (masterKey.includes('product') || masterKey.includes('chassis') || masterKey.includes('brand')) {
    return SAMPLE_NAMES.product;
  }
  return SAMPLE_NAMES.default;
}

function generateMockRecords(masterKey: string, count = 12) {
  const names = pickNames(masterKey);
  const prefix = masterKey.split('-').map((w) => w[0].toUpperCase()).join('').slice(0, 4);
  return Array.from({ length: count }, (_, i) => {
    const statusIndex = (i * 3 + masterKey.length) % STATUSES.length;
    const name = names[i % names.length];
    const date = new Date(2024, (i * 2) % 12, ((i * 7) % 28) + 1);
    return {
      id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
      name,
      description: `${name} — configured for system use`,
      status: STATUSES[statusIndex],
      createdDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      updatedDate: new Date(date.getTime() + 86400000 * 10).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50];

const MasterListPage: React.FC = () => {
  const { masterKey = '' } = useParams<{ masterKey: string }>();
  const navigate = useNavigate();

  const master = findMasterByKey(masterKey);
  const group = findGroupForMasterKey(masterKey);

  // Record as recently visited
  React.useEffect(() => {
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
  }, [masterKey, master, group]);

  const allRecords = useMemo(() => generateMockRecords(masterKey), [masterKey]);

  const summaryItems = useMemo(() => {
    const active   = allRecords.filter((r) => r.status === 'Active').length;
    const inactive = allRecords.filter((r) => r.status === 'Inactive').length;
    const draft    = allRecords.filter((r) => r.status === 'Draft').length;
    return [
      { label: 'Total',    value: allRecords.length                                },
      { label: 'Active',   value: active,   tone: 'success' as const              },
      { label: 'Inactive', value: inactive, tone: 'danger'  as const              },
      ...(draft > 0 ? [{ label: 'Draft', value: draft, tone: 'warning' as const }] : []),
    ];
  }, [allRecords]);

  const quickFilterItems = useMemo(() => {
    const active   = allRecords.filter((r) => r.status === 'Active').length;
    const inactive = allRecords.filter((r) => r.status === 'Inactive').length;
    const draft    = allRecords.filter((r) => r.status === 'Draft').length;
    return [
      { key: '',         label: 'All',      count: allRecords.length },
      { key: 'Active',   label: 'Active',   count: active            },
      { key: 'Inactive', label: 'Inactive', count: inactive          },
      ...(draft > 0 ? [{ key: 'Draft', label: 'Draft', count: draft }] : []),
    ];
  }, [allRecords]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<'id' | 'name' | 'status' | 'createdDate'>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('generic-master-list');

  const filteredRecords = useMemo(() => {
    let records = [...allRecords];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      records = records.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    if (statusFilter) {
      records = records.filter((r) => r.status === statusFilter);
    }
    records.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return records;
  }, [allRecords, searchQuery, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRecords.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!master || !group) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Master not found</div>
            <button type="button" onClick={() => navigate('/admin')} className="text-sm underline" style={{ color: 'var(--color-primary)' }}>
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminListPageShell
        title={master.label}
        description={master.description}
        breadcrumbs={['Admin', group.label]}
        primaryAction={{ label: 'Add New', tone: 'primary', onClick: () => navigate(`/admin/master/${masterKey}/new`) }}
        helpTopicId="generic-master-list"
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        summaryItems={summaryItems}
        searchValue={searchQuery}
        searchPlaceholder={`Search ${master.label}…`}
        onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        quickFilterItems={quickFilterItems}
        activeQuickFilter={statusFilter}
        onQuickFilterChange={(key) => { setStatusFilter(key); setCurrentPage(1); }}
        toolbarActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
            <span style={{ margin: '0 2px', opacity: 0.4, userSelect: 'none' }}>|</span>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ appearance: 'none', WebkitAppearance: 'none', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', color: 'var(--color-text)', fontSize: '12px', cursor: 'pointer' }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      >
        {/* Bulk action bar */}
        {selectedRows.size > 0 && (
          <div
            className="flex items-center gap-3 py-2 border-b mb-3"
            style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
          >
            <span className="text-sm font-medium text-blue-700">{selectedRows.size} selected</span>
            <div className="flex items-center gap-2">
              <button type="button" className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors">
                <Filter size={12} /> Activate
              </button>
              <button type="button" className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors">
                <X size={12} /> Deactivate
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm(`Delete ${selectedRows.size} selected record${selectedRows.size !== 1 ? 's' : ''}? This cannot be undone.`)) setSelectedRows(new Set()); }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <button type="button" onClick={() => setSelectedRows(new Set())} className="ml-auto text-xs text-blue-600 hover:underline">
              Clear selection
            </button>
          </div>
        )}

        {/* ── Data Grid ────────────────────────────────────────────── */}
        {paginatedRecords.length === 0 ? (
          <div style={{ padding: '56px 28px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            {allRecords.length === 0 ? (
              <>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Plus size={20} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No {master.label} records yet</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Get started by adding your first {master.label.toLowerCase()} record.
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/master/${masterKey}/new`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Add First {master.label}
                </button>
              </>
            ) : (
              <>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No records match your filters</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Try adjusting your search or status filter.</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 88px minmax(200px, 1fr) 80px 100px 56px', alignItems: 'center', height: '36px', padding: '0 12px 0 8px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={paginatedRecords.length > 0 && selectedRows.size === paginatedRecords.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                  aria-label="Select all"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('id')}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</span>
                {sortField === 'id' && <ChevronDown size={11} style={{ color: 'var(--color-text-muted)', transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</span>
                {sortField === 'name' && <ChevronDown size={11} style={{ color: 'var(--color-text-muted)', transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                {sortField === 'status' && <ChevronDown size={11} style={{ color: 'var(--color-text-muted)', transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('createdDate')}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</span>
                {sortField === 'createdDate' && <ChevronDown size={11} style={{ color: 'var(--color-text-muted)', transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none' }} />}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</div>
            </div>

            {/* Data rows */}
            {paginatedRecords.map((record, idx) => {
              const isLast = idx === paginatedRecords.length - 1;
              return (
                <div
                  key={record.id}
                  style={{ display: 'grid', gridTemplateColumns: '36px 88px minmax(200px, 1fr) 80px 100px 56px', alignItems: 'center', height: '44px', padding: '0 12px 0 8px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', background: selectedRows.has(record.id) ? '#EFF6FF' : 'transparent', transition: 'background 0.1s', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/master/${masterKey}/${record.id}`)}
                  onMouseEnter={e => { if (!selectedRows.has(record.id)) e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedRows.has(record.id) ? '#EFF6FF' : 'transparent'; }}
                >
                  {/* Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={() => handleSelectRow(record.id)}
                      style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                      aria-label={`Select ${record.name}`}
                    />
                  </div>

                  {/* Code */}
                  <div style={{ paddingRight: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {record.id}
                    </span>
                  </div>

                  {/* Name */}
                  <div style={{ minWidth: 0, paddingRight: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.name}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ paddingRight: '8px' }}>
                    <StatusChip status={record.status} />
                  </div>

                  {/* Created */}
                  <div style={{ paddingRight: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{record.createdDate}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      title="View record"
                      aria-label="View record"
                      onClick={() => navigate(`/admin/master/${masterKey}/${record.id}`)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Eye size={13} />
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        title="More actions"
                        aria-label="More actions"
                        onClick={() => setOpenRowMenu(openRowMenu === record.id ? null : record.id)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      {openRowMenu === record.id && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpenRowMenu(null)} />
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100, minWidth: '160px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: '4px', overflow: 'hidden' }}>
                            <MasterMoreMenuItem icon={<Eye size={13} />} label="View details" onClick={() => { navigate(`/admin/master/${masterKey}/${record.id}`); setOpenRowMenu(null); }} />
                            <MasterMoreMenuItem icon={<Edit2 size={13} />} label="Edit" onClick={() => { navigate(`/admin/master/${masterKey}/${record.id}?mode=edit`); setOpenRowMenu(null); }} />
                            <MasterMoreMenuItem icon={<Copy size={13} />} label="Duplicate" onClick={() => setOpenRowMenu(null)} />
                            <MasterMoreMenuItem icon={<History size={13} />} label="Audit history" onClick={() => setOpenRowMenu(null)} />
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '3px 0' }} />
                            <MasterMoreMenuItem icon={<Filter size={13} />} label={record.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => setOpenRowMenu(null)} />
                            <div style={{ height: '1px', background: 'var(--color-border)', margin: '3px 0' }} />
                            <MasterMoreMenuItem
                              icon={<Trash2 size={13} />}
                              label="Delete"
                              danger
                              onClick={() => { if (window.confirm(`Delete "${record.name}"? This cannot be undone.`)) setOpenRowMenu(null); }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* ── Pagination ─────────────────────────────────────────── */}
          {filteredRecords.length > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}
              </span>
              <div className="flex items-center gap-1">
                <PaginationButton
                  icon={<ChevronLeft size={13} />}
                  label="Previous"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                />
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all', currentPage === page ? 'shadow-sm' : 'hover:bg-gray-100')}
                      style={currentPage === page ? { background: 'var(--color-primary)', color: 'white' } : { color: 'var(--color-text)' }}
                    >
                      {page}
                    </button>
                  );
                })}
                <PaginationButton
                  icon={<ChevronRight size={13} />}
                  label="Next"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                />
              </div>
            </div>
          )}
      </AdminListPageShell>
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic(helpTopicId)}
        onClose={() => setHelpOpen(false)}
        onTopicChange={(id) => setHelpTopicId(id)}
      />
    </AdminShell>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusChipProps { status: string; }
const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const styles: Record<string, { bg: string; color: string; dot: string }> = {
    Active: { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
    Inactive: { bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
    Draft: { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
  };
  const s = styles[status] ?? styles.Inactive;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

interface MasterMoreMenuItemProps { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void; }
const MasterMoreMenuItem: React.FC<MasterMoreMenuItemProps> = ({ icon, label, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', fontSize: '12px', fontWeight: 500, color: danger ? '#DC2626' : 'var(--color-text)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--color-surface-subtle)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {icon}{label}
  </button>
);

interface PaginationButtonProps { icon: React.ReactNode; label: string; disabled: boolean; onClick: () => void; }
const PaginationButton: React.FC<PaginationButtonProps> = ({ icon, label, disabled, onClick }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {icon}
  </button>
);

export default MasterListPage;
