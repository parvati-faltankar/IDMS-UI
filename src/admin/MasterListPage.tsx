import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit2,
  Eye,
  FileDown,
  Filter,
  History,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import AdminShell from './AdminShell';
import { findGroupForMasterKey, findMasterByKey } from './adminNavConfig';
import { recordRecentAdminMaster } from './adminStorage';
import { cn } from '../utils/classNames';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<'id' | 'name' | 'status' | 'createdDate'>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    let records = [...allRecords];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      records = records.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
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

  const GroupIcon = group.icon;

  return (
    <AdminShell>
      <div className="flex flex-col min-h-full" style={{ background: 'var(--color-surface-subtle)' }}>

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 px-6 py-3 border-b"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Title row */}
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: group.iconBg }}>
              <GroupIcon size={14} style={{ color: group.iconColor }} />
            </span>
            <div className="flex-1 min-w-0">
              <div role="heading" aria-level={1} className="font-semibold leading-tight" style={{ color: 'var(--color-text)', fontSize: '20px' }}>{master.label}</div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{master.description}</p>
            </div>

            {/* Primary actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                title="Download import template"
              >
                <FileDown size={13} />
                <span className="hidden sm:inline">Template</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <Upload size={13} />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                style={{ background: 'var(--color-primary)', color: 'white' }}
                onClick={() => navigate(`/admin/master/${masterKey}/new`)}
              >
                <Plus size={13} />
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div
          className="px-6 py-3 border-b flex flex-wrap items-center gap-2"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-1 min-w-[180px] max-w-xs"
            style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border)' }}
          >
            <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder={`Search ${master.label}…`}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--color-text)' }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="opacity-60 hover:opacity-100"><X size={12} /></button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm cursor-pointer"
              style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
          </div>

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all', showFilters && 'bg-orange-50')}
            style={{
              borderColor: showFilters ? 'var(--color-primary)' : 'var(--color-border)',
              color: showFilters ? 'var(--color-primary)' : 'var(--color-text)',
            }}
          >
            <SlidersHorizontal size={13} />
            Filters
          </button>

          <div className="flex-1" />

          {/* Page size */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="appearance-none px-2 py-1 rounded border text-sm cursor-pointer"
              style={{ background: 'var(--color-surface-subtle)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Bulk action bar */}
        {selectedRows.size > 0 && (
          <div
            className="px-6 py-2 flex items-center gap-3 border-b"
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
              <button type="button" className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
            <button type="button" onClick={() => setSelectedRows(new Set())} className="ml-auto text-xs text-blue-600 hover:underline">
              Clear selection
            </button>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-table-header)', borderBottom: '1px solid var(--color-border)' }}>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={paginatedRecords.length > 0 && selectedRows.size === paginatedRecords.length}
                      onChange={handleSelectAll}
                      className="rounded cursor-pointer"
                      aria-label="Select all"
                    />
                  </th>
                  <SortableHeader field="id" label="Code" currentSort={sortField} direction={sortDir} onSort={handleSort} />
                  <SortableHeader field="name" label="Name" currentSort={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Description
                  </th>
                  <SortableHeader field="status" label="Status" currentSort={sortField} direction={sortDir} onSort={handleSort} />
                  <SortableHeader field="createdDate" label="Created" currentSort={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Search size={32} className="mx-auto mb-3 opacity-30" />
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>No records found</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Try adjusting your search or filters
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className={cn('border-b transition-colors hover:bg-gray-50', selectedRows.has(record.id) && 'bg-blue-50 hover:bg-blue-50')}
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(record.id)}
                          onChange={() => handleSelectRow(record.id)}
                          className="rounded cursor-pointer"
                          aria-label={`Select ${record.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}>
                          {record.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>{record.name}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="text-xs truncate block" style={{ color: 'var(--color-text-muted)' }}>{record.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={record.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{record.createdDate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton icon={<Eye size={13} />} label="View" onClick={() => navigate(`/admin/master/${masterKey}/${record.id}`)} />
                          <ActionButton icon={<Edit2 size={13} />} label="Edit" onClick={() => navigate(`/admin/master/${masterKey}/${record.id}?mode=edit`)} />
                          <ActionButton icon={<Copy size={13} />} label="Duplicate" onClick={() => {}} />
                          <div className="relative">
                            <ActionButton
                              icon={<MoreHorizontal size={13} />}
                              label="More actions"
                              onClick={() => setOpenRowMenu(openRowMenu === record.id ? null : record.id)}
                            />
                            {openRowMenu === record.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border z-50 py-1 overflow-hidden"
                                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                              >
                                {[
                                  { label: 'View details', icon: <Eye size={13} /> },
                                  { label: 'Audit history', icon: <History size={13} /> },
                                  { label: record.status === 'Active' ? 'Deactivate' : 'Activate', icon: <Filter size={13} /> },
                                  { label: 'Delete', icon: <Trash2 size={13} />, danger: true },
                                ].map((action) => (
                                  <button
                                    key={action.label}
                                    type="button"
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                    style={{ color: action.danger ? 'var(--color-danger)' : 'var(--color-text)' }}
                                    onClick={() => setOpenRowMenu(null)}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        </div>
      </div>
    </AdminShell>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSort: string;
  direction: 'asc' | 'desc';
  onSort: (field: any) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ field, label, currentSort, direction, onSort }) => (
  <th
    className="px-4 py-3 text-left cursor-pointer select-none"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      {currentSort === field && (
        <ChevronDown size={12} className={cn('transition-transform', direction === 'asc' ? 'rotate-180' : '')} style={{ color: 'var(--color-text-muted)' }} />
      )}
    </div>
  </th>
);

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

interface ActionButtonProps { icon: React.ReactNode; label: string; onClick: () => void; }
const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {icon}
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
