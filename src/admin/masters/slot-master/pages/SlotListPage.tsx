// ─── Slot Master — List Page ──────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Filter, Clock } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import type { SlotRecord, SlotStatus } from '../types/slotMaster.types';
import { SLOT_STATUS_META, MASTER_KEY, MOCK_BRANCH, TRANSACTION_ENTITIES } from '../constants/slotMaster.constants';
import { slotService } from '../services/slotService';

// ─── Grid ─────────────────────────────────────────────────────────────────────

const GRID = '90px minmax(140px,1fr) 120px 90px 170px 70px 80px 80px 90px';

const COL_HEADERS = [
  { label: 'Code' },
  { label: 'Name' },
  { label: 'Entity' },
  { label: 'Branch' },
  { label: 'Date Range' },
  { label: 'Daily' },
  { label: 'Total' },
  { label: 'Employees' },
  { label: 'Status' },
];

// ─── Badge style ──────────────────────────────────────────────────────────────

const BADGE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
  fontSize: '11px', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap',
};

function statusStyle(s: SlotStatus): React.CSSProperties {
  const m = SLOT_STATUS_META[s];
  return { ...BADGE, background: m.bg, color: m.color };
}

// ─── Preview section builder ──────────────────────────────────────────────────

function buildPreview(slot: SlotRecord): PreviewSection[] {
  return [
    {
      title: 'General',
      fields: [
        { label: 'Slot Code',    value: slot.slotCode,     mono: true },
        { label: 'Name',         value: slot.name },
        { label: 'Display Name', value: slot.displayName || '—' },
        { label: 'Entity',       value: slot.entity        || '—' },
        { label: 'Branch',       value: MOCK_BRANCH.name },
        { label: 'Status',       value: slot.status },
      ],
    },
    {
      title: 'Schedule',
      fields: [
        { label: 'Start Date',  value: slot.startDate  || '—' },
        { label: 'End Date',    value: slot.endDate    || '—' },
        { label: 'Start Time',  value: slot.slotStartTime || '—', mono: true },
        { label: 'End Time',    value: slot.slotEndTime   || '—', mono: true },
        { label: 'Duration',    value: slot.slotDurationMin ? `${slot.slotDurationMin} min` : '—' },
        { label: 'Time Gap',    value: slot.timeGapMin ? `${slot.timeGapMin} min` : '0 min' },
        { label: 'Active Days', value: slot.activeDays.join(', ') || '—' },
        { label: 'Daily Slots', value: String(slot.dailySlotCount) },
        { label: 'Total Slots', value: String(slot.totalSlotCount) },
        { label: 'Total Days',  value: String(slot.totalDays) },
      ],
    },
    ...(slot.taggedEmployees.length > 0 ? [{
      title: `Tagged Employees (${slot.taggedEmployees.length})`,
      fields: slot.taggedEmployees.map((e) => ({
        label: e.employeeName, value: e.role,
      })),
    }] : []),
    ...(slot.description ? [{
      title: 'Description',
      fields: [{ label: 'Description', value: slot.description, span: 2 as const }],
    }] : []),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

const SlotListPage: React.FC = () => {
  const navigate = useNavigate();

  const [records, setRecords]   = useState<SlotRecord[]>(() => slotService.getAll());
  const [searchQuery, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const [previewSlot, setPreviewSlot]   = useState<SlotRecord | null>(null);
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [helpOpen, setHelpOpen]         = useState(false);

  const [activateTarget, setActivateTarget]   = useState<SlotRecord | null>(null);
  const [activateOpen, setActivateOpen]       = useState(false);
  const [inactivateTarget, setInactivateTarget] = useState<SlotRecord | null>(null);
  const [inactivateOpen, setInactivateOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget]       = useState<SlotRecord | null>(null);
  const [deleteOpen, setDeleteOpen]           = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterEntity && r.entity !== filterEntity) return false;
      if (q) {
        const hay = `${r.slotCode} ${r.name} ${r.displayName} ${r.entity} ${r.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, filterStatus, filterEntity]);

  const counts = useMemo(() => ({
    all:      records.length,
    Active:   records.filter((r) => r.status === 'Active').length,
    Draft:    records.filter((r) => r.status === 'Draft').length,
    Inactive: records.filter((r) => r.status === 'Inactive').length,
  }), [records]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function confirmActivate() {
    if (!activateTarget) return;
    slotService.activate(activateTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === activateTarget.id) setPreviewSlot(slotService.getById(activateTarget.id) ?? null);
    setActivateOpen(false);
    showToast(`"${activateTarget.name}" activated.`, 'success');
    setActivateTarget(null);
  }

  function confirmInactivate() {
    if (!inactivateTarget) return;
    slotService.inactivate(inactivateTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === inactivateTarget.id) setPreviewSlot(slotService.getById(inactivateTarget.id) ?? null);
    setInactivateOpen(false);
    showToast(`"${inactivateTarget.name}" marked inactive.`, 'success');
    setInactivateTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    slotService.delete(deleteTarget.id);
    setRecords(slotService.getAll());
    if (previewSlot?.id === deleteTarget.id) setPreviewOpen(false);
    setDeleteOpen(false);
    showToast(`"${deleteTarget.name}" deleted.`, 'success');
    setDeleteTarget(null);
  }

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: '13px',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
  };

  // ── Quick filter bar ───────────────────────────────────────────────────────
  const quickFilterItems = [
    { key: 'all',      label: 'All',      count: counts.all },
    { key: 'Active',   label: 'Active',   count: counts.Active },
    { key: 'Draft',    label: 'Draft',    count: counts.Draft },
    { key: 'Inactive', label: 'Inactive', count: counts.Inactive },
  ];

  // ── Advanced filter panel ──────────────────────────────────────────────────
  const advancedFilterPanel = showFilters ? (
    <div style={{
      position: 'absolute', top: '100%', right: 0, zIndex: 200,
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      padding: '16px 20px', minWidth: '240px', marginTop: '6px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Advanced Filters</p>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Entity</label>
      <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} style={{ ...inputBase, marginBottom: '12px' }}>
        <option value="">All entities</option>
        {TRANSACTION_ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      <button type="button" onClick={() => { setFilterEntity(''); setShowFilters(false); }} style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear filters</button>
    </div>
  ) : null;

  const toolbarActions = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 10px', height: '30px',
          fontSize: '12px', fontWeight: 500, borderRadius: '8px', cursor: 'pointer',
          border: `1px solid ${filterEntity ? 'var(--color-primary)' : 'var(--color-border)'}`,
          background: filterEntity ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'transparent',
          color: filterEntity ? 'var(--color-primary)' : 'var(--color-text-muted)',
        }}
      >
        <Filter size={11} />
        Filters
        {filterEntity && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-primary)' }} />}
        <ChevronDown size={10} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {advancedFilterPanel}
    </div>
  );

  // ── Table ──────────────────────────────────────────────────────────────────
  const tableHeader = (
    <div style={{
      display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', height: '36px',
      padding: '0 16px', borderBottom: '1.5px solid var(--color-border)',
      background: 'var(--color-surface-subtle)', position: 'sticky', top: 0, zIndex: 10,
    }}>
      {COL_HEADERS.map(({ label }, i) => (
        <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingRight: '8px' }}>
          {label}
        </div>
      ))}
    </div>
  );

  const tableBody = filtered.length === 0 ? (
    <div style={{ padding: '64px 28px', textAlign: 'center', background: 'var(--color-surface)' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Clock size={20} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
        {records.length === 0 ? 'No slot configurations yet' : 'No slots match the current filters'}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
        {records.length === 0
          ? 'Create slot configurations to manage appointment scheduling across entities and branches.'
          : 'Try adjusting your search or filters.'}
      </div>
      {records.length === 0 && (
        <button type="button" onClick={() => navigate('/admin/master/slot-master/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '32px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
          + New Slot
        </button>
      )}
    </div>
  ) : (
    <>
      {filtered.map((slot, idx) => {
        const isLast = idx === filtered.length - 1;
        const canDel = slot.status === 'Draft';
        return (
          <div
            key={slot.id}
            style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', height: '48px', padding: '0 16px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.10s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-subtle)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            onClick={() => { setPreviewSlot(slot); setPreviewOpen(true); }}
          >
            {/* Code */}
            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {slot.slotCode}
            </div>
            {/* Name */}
            <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.name}</div>
              {slot.displayName && slot.displayName !== slot.name && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.displayName}</div>
              )}
            </div>
            {/* Entity */}
            <div style={{ paddingRight: '8px' }}>
              <span style={{ ...BADGE, background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px' }}>{slot.entity || '—'}</span>
            </div>
            {/* Branch */}
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {MOCK_BRANCH.name}
            </div>
            {/* Date Range */}
            <div style={{ paddingRight: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text)', fontWeight: 500 }}>
                {slot.startDate || '—'} → {slot.endDate || '—'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {slot.slotStartTime || '—'} – {slot.slotEndTime || '—'}
              </div>
            </div>
            {/* Daily */}
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', paddingRight: '8px' }}>{slot.dailySlotCount}</div>
            {/* Total */}
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', paddingRight: '8px' }}>{slot.totalSlotCount}</div>
            {/* Employees */}
            <div style={{ paddingRight: '8px' }}>
              {slot.taggedEmployees.length > 0 ? (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0369A1', background: '#F0F9FF', padding: '2px 6px', borderRadius: '4px' }}>
                  {slot.taggedEmployees.length} tagged
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
              )}
            </div>
            {/* Status + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={statusStyle(slot.status)}>{slot.status}</span>
              <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                {slot.status === 'Draft' && (
                  <button type="button" title="Activate" onClick={() => { setActivateTarget(slot); setActivateOpen(true); }} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', border: 'none', background: '#DCFCE7', color: '#15803D', cursor: 'pointer' }}>Activate</button>
                )}
                {slot.status === 'Active' && (
                  <button type="button" title="Inactivate" onClick={() => { setInactivateTarget(slot); setInactivateOpen(true); }} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Deactivate</button>
                )}
                <button type="button" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/master/slot-master/${slot.id}`); }} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Edit</button>
                {canDel && (
                  <button type="button" title="Delete" onClick={() => { setDeleteTarget(slot); setDeleteOpen(true); }} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>Del</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  function statusTone(s: SlotStatus): 'active' | 'draft' | 'inactive' {
    if (s === 'Active')   return 'active';
    if (s === 'Inactive') return 'inactive';
    return 'draft';
  }

  return (
    <AdminShell>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.tone === 'success' ? '#111827' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast.message}
        </div>
      )}

      <AdminListPageShell
        title="Slot Master"
        description="Manage appointment and scheduling slots across entities and branches."
        breadcrumbs={['Admin', 'Location & Territory', 'Slot Master']}
        primaryAction={{ label: '+ New Slot', onClick: () => navigate('/admin/master/slot-master/new') }}
        searchValue={searchQuery}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code, name, entity…"
        quickFilterItems={quickFilterItems}
        activeQuickFilter={filterStatus || 'all'}
        onQuickFilterChange={(k) => setFilterStatus(k === 'all' ? '' : k)}
        toolbarActions={toolbarActions}
        helpTopicId="slot-master"
        onHelpClick={() => setHelpOpen(true)}
      >
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--color-border)', borderRadius: '12px',
          background: 'var(--color-surface)',
        }}>
          {tableHeader}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tableBody}
          </div>
        </div>
      </AdminListPageShell>

      {/* Preview Drawer */}
      <SmartPreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewSlot?.name ?? ''}
        subtitle={previewSlot?.slotCode}
        statusLabel={previewSlot?.status}
        statusTone={previewSlot ? statusTone(previewSlot.status) : undefined}
        sections={previewSlot ? buildPreview(previewSlot) : []}
        primaryAction={{ label: 'Edit Slot', onClick: () => { setPreviewOpen(false); navigate(`/admin/master/slot-master/${previewSlot?.id}`); } }}
      />

      {/* Help Drawer */}
      <HelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        topic={getHelpTopic('slot-master') ?? getHelpTopic('generic-master')}
      />

      {/* Activate modal */}
      {activateOpen && activateTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Activate Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{activateTarget.name}</strong>" will be marked Active. Generated slots will become visible to users.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActivateOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmActivate} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#15803D', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Activate</button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivate modal */}
      {inactivateOpen && inactivateTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Deactivate Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{inactivateTarget.name}</strong>" will be marked Inactive. Generated slots will be hidden from users.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setInactivateOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmInactivate} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteOpen && deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '24px 28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#DC2626' }}>Delete Slot?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              "<strong>{deleteTarget.name}</strong>" will be permanently deleted. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteOpen(false)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button type="button" onClick={confirmDelete} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default SlotListPage;
