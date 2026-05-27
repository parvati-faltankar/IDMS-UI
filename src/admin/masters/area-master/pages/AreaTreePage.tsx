import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Edit2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import type { Area, AreaLevel } from '../types/areaMaster.types';
import { areaService } from '../services/areaService';
import { areaLevelService } from '../services/areaLevelService';
import { USAGE_TAGS } from '../constants/areaMaster.constants';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  buildAreaTree,
  filterAreaTree,
  getAllTreeNodeIds,
  findOrphanAreas,
  getMaxHierarchyDepth,
  findHierarchyExceptions,
  type AreaTreeNode,
  type HierarchyException,
  type ExceptionType,
} from '../utils/hierarchyTreeUtils';

// ─── Style helpers ─────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  padding: '7px 10px', fontSize: '13px', border: '1px solid var(--color-border)',
  borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};
const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', fontSize: '12px', fontWeight: 600,
  borderRadius: '8px', cursor: 'pointer', border: 'none',
};
const btnPrimary: React.CSSProperties  = { ...btnBase, background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties  = { ...btnBase, fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const btnSmall: React.CSSProperties   = { ...btnBase, padding: '5px 10px', fontWeight: 500, fontSize: '11px' };
const btnSmallOutline: React.CSSProperties = { ...btnSmall, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const badgeBase: React.CSSProperties  = { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: '10px', fontWeight: 600, borderRadius: '5px', whiteSpace: 'nowrap' as const };

function statusStyle(s: string): React.CSSProperties {
  if (s === 'Active')   return { ...badgeBase, background: '#DCFCE7', color: '#15803D' };
  if (s === 'Inactive') return { ...badgeBase, background: '#FEF2F2', color: '#DC2626' };
  return { ...badgeBase, background: '#F1F5F9', color: '#64748B' };
}

function exceptionTone(t: ExceptionType): React.CSSProperties {
  if (t === 'Circular Hierarchy' || t === 'Missing Parent' || t === 'Missing Area Level') {
    return { ...badgeBase, background: '#FEF2F2', color: '#DC2626' };
  }
  if (t === 'Inactive Parent' || t === 'Inactive Area Level') {
    return { ...badgeBase, background: '#FEF3C7', color: '#92400E' };
  }
  return { ...badgeBase, background: '#FFF7ED', color: '#C2410C' };
}

// ─── TreeNode component ────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: AreaTreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  levelMap: Map<string, string>;
  onEdit: (id: string) => void;
  onCopyPath: (area: Area) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, expanded, onToggle, levelMap, onEdit, onCopyPath }) => {
  const { area, children, depth } = node;
  const isExpanded  = expanded.has(area.id);
  const hasChildren = children.length > 0;
  const INDENT      = 26;

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 16px', paddingLeft: `${16 + depth * INDENT}px`,
          borderBottom: '1px solid var(--color-border)',
          background: 'transparent', transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Toggle button */}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(area.id)}
          title={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : undefined}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '20px', height: '20px', border: 'none', background: 'none',
            cursor: hasChildren ? 'pointer' : 'default', padding: 0, flexShrink: 0,
            color: 'var(--color-text-muted)',
          }}
        >
          {hasChildren
            ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
            : <span style={{ display: 'inline-block', width: 14 }} />
          }
        </button>

        {/* Status dot */}
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
          background: area.status === 'Active' ? '#15803D'
            : area.status === 'Inactive' ? '#DC2626' : '#94A3B8',
        }} />

        {/* Name + metadata */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onEdit(area.id)}
            style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--color-text)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
            }}
          >
            {area.areaName}
          </button>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {area.areaCode}
          </span>
          <span style={statusStyle(area.status)}>{area.status}</span>
          {levelMap.has(area.areaLevelId) && (
            <span style={{ ...badgeBase, background: '#EFF6FF', color: '#1D4ED8' }}>
              {levelMap.get(area.areaLevelId)}
            </span>
          )}
          {area.usageTags.slice(0, 2).map((tag) => (
            <span key={tag} style={{ padding: '1px 6px', fontSize: '10px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', whiteSpace: 'nowrap' }}>
              {tag}
            </span>
          ))}
          {area.usageTags.length > 2 && (
            <span style={{ padding: '1px 6px', fontSize: '10px', borderRadius: '4px', background: '#E0E7FF', color: '#3730A3', whiteSpace: 'nowrap' }}>
              +{area.usageTags.length - 2}
            </span>
          )}
          {hasChildren && (
            <span style={{ padding: '1px 7px', fontSize: '10px', fontWeight: 500, borderRadius: '4px', background: '#F0FDF4', color: '#15803D', whiteSpace: 'nowrap' }}>
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </span>
          )}
          {area.postalCode && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {area.postalCode}
            </span>
          )}
        </div>

        {/* Row actions */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            title="Copy hierarchy path"
            onClick={() => onCopyPath(area)}
            style={{ display: 'inline-flex', padding: '5px', border: '1px solid var(--color-border)', borderRadius: '5px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            title="View / Edit area"
            onClick={() => onEdit(area.id)}
            style={{ display: 'inline-flex', padding: '5px', border: '1px solid var(--color-border)', borderRadius: '5px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <Edit2 size={12} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && children.map((child) => (
        <TreeNode
          key={child.area.id}
          node={child}
          expanded={expanded}
          onToggle={onToggle}
          levelMap={levelMap}
          onEdit={onEdit}
          onCopyPath={onCopyPath}
        />
      ))}
    </div>
  );
};

// ─── Exceptions table ──────────────────────────────────────────────────────────

interface ExceptionsTableProps {
  exceptions: HierarchyException[];
  levelMap: Map<string, string>;
  areaNameMap: Map<string, string>;
  onEdit: (id: string) => void;
}

const ExceptionsTable: React.FC<ExceptionsTableProps> = ({ exceptions, levelMap, areaNameMap, onEdit }) => {
  const COLS = '90px minmax(140px,1.5fr) 120px 140px 160px 1fr';
  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: COLS, gap: 0,
        padding: '8px 16px', background: 'var(--color-surface-subtle)',
        borderBottom: '1px solid var(--color-border)', minWidth: '760px',
        position: 'sticky', top: 0,
      }}>
        {['Code', 'Area Name', 'Level', 'Parent Area', 'Issue', 'Suggested Action'].map((h, i) => (
          <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', paddingRight: '12px' }}>
            {h}
          </span>
        ))}
      </div>
      {exceptions.map((ex, i) => (
        <div
          key={i}
          style={{
            display: 'grid', gridTemplateColumns: COLS, gap: 0,
            padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
            alignItems: 'center', minWidth: '760px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFBEB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-muted)', paddingRight: '12px' }}>{ex.area.areaCode}</span>
          <button
            type="button"
            onClick={() => onEdit(ex.area.id)}
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', paddingRight: '12px' }}
          >
            {ex.area.areaName}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '12px' }}>
            {levelMap.get(ex.area.areaLevelId) ?? '—'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', paddingRight: '12px' }}>
            {ex.area.parentAreaId ? (areaNameMap.get(ex.area.parentAreaId) ?? <em>Not found</em>) : '—'}
          </span>
          <div style={{ paddingRight: '12px' }}>
            <span style={exceptionTone(ex.exceptionType)}>{ex.exceptionType}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.5 }}>{ex.suggestedAction}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Summary card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number | string;
  bg: string;
  color: string;
  warn?: boolean;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, bg, color, warn }) => (
  <div style={{
    flex: '1 1 0', minWidth: '90px',
    padding: '14px 16px',
    background: bg,
    border: `1px solid ${warn ? '#FCA5A5' : 'var(--color-border)'}`,
    borderRadius: '10px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '22px', fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', marginTop: '4px' }}>{label}</div>
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────────

const AreaTreePage: React.FC = () => {
  const navigate = useNavigate();

  // Data — loaded once
  const [areas]     = useState<Area[]>(() => areaService.getAll());
  const allLevels   = useMemo<AreaLevel[]>(() => areaLevelService.getAll(), []);

  // Filters
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filterLevelId,  setFilterLevelId]  = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterUsageTag, setFilterUsageTag] = useState('');
  const [showInactive,   setShowInactive]   = useState(true);

  // Expand state — roots expanded initially
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const roots = new Set<string>();
    for (const a of areaService.getAll()) {
      if (!a.parentAreaId) roots.add(a.id);
    }
    return roots;
  });

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Record recent master on mount
  useEffect(() => {
    const master = findMasterByKey('area-master');
    const group  = findGroupForMasterKey('area-master');
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

  // Lookup maps
  const levelMap = useMemo(() => {
    const m = new Map<string, string>();
    allLevels.forEach((l) => m.set(l.id, l.areaLevelName));
    return m;
  }, [allLevels]);

  const areaNameMap = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a) => m.set(a.id, a.areaName));
    return m;
  }, [areas]);

  // Summary stats — computed from original unfiltered data
  const stats = useMemo(() => ({
    total:    areas.length,
    active:   areas.filter((a) => a.status === 'Active').length,
    draft:    areas.filter((a) => a.status === 'Draft').length,
    inactive: areas.filter((a) => a.status === 'Inactive').length,
    roots:    areas.filter((a) => !a.parentAreaId).length,
    orphans:  findOrphanAreas(areas).length,
    maxDepth: getMaxHierarchyDepth(areas),
  }), [areas]);

  // Exceptions — from original unfiltered data
  const exceptions = useMemo(() => findHierarchyExceptions(areas, allLevels), [areas, allLevels]);

  // Pre-filter: showInactive hides inactive areas from the tree
  const preFiltered = useMemo(
    () => showInactive ? areas : areas.filter((a) => a.status !== 'Inactive'),
    [areas, showInactive],
  );

  // Build tree from pre-filtered set, then apply search/level/status/usageTag
  const tree = useMemo(() => buildAreaTree(preFiltered), [preFiltered]);

  const filteredTree = useMemo(
    () => filterAreaTree(tree, { search: searchQuery, levelId: filterLevelId, status: filterStatus, usageTag: filterUsageTag }),
    [tree, searchQuery, filterLevelId, filterStatus, filterUsageTag],
  );

  // All node IDs in filtered tree (for Expand All)
  const allFilteredIds = useMemo(() => getAllTreeNodeIds(filteredTree), [filteredTree]);

  const hasFilters = !!(searchQuery || filterLevelId || filterStatus || filterUsageTag || !showInactive);

  // Handlers
  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExpandAll() { setExpanded(new Set(allFilteredIds)); }
  function handleCollapseAll() { setExpanded(new Set()); }

  function handleCopyPath(area: Area) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(area.hierarchyPath).catch(() => undefined);
    }
    showToast(`Copied: ${area.hierarchyPath}`);
  }

  function clearFilters() {
    setSearchQuery('');
    setFilterLevelId('');
    setFilterStatus('');
    setFilterUsageTag('');
    setShowInactive(true);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = { padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' };
  const sectionCard: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' };
  const sectionHead: React.CSSProperties = { padding: '12px 18px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  return (
    <AdminShell>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: '#15803D', color: 'white', padding: '10px 18px',
          borderRadius: '10px', fontSize: '12px', fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div style={pageStyle}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Area Hierarchy</h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              View the parent-child tree of all configured areas. Navigate to any area to edit its details.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/admin/areas')} style={btnOutline}>
              Open Area List
            </button>
            <button type="button" onClick={() => navigate('/admin/areas/new')} style={btnPrimary}>
              + Add Area
            </button>
          </div>
        </div>

        {/* ── Summary cards ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <SummaryCard label="Total Areas"  value={stats.total}    bg="#F0F9FF" color="#0369A1" />
          <SummaryCard label="Active"       value={stats.active}   bg="#F0FDF4" color="#15803D" />
          <SummaryCard label="Draft"        value={stats.draft}    bg="#F8FAFC" color="#475569" />
          <SummaryCard label="Inactive"     value={stats.inactive} bg="#FEF2F2" color="#DC2626" />
          <SummaryCard label="Root Areas"   value={stats.roots}    bg="#FFF7ED" color="#C2410C" />
          <SummaryCard label="Orphan Areas" value={stats.orphans}  bg={stats.orphans > 0 ? '#FEF2F2' : '#F8FAFC'} color={stats.orphans > 0 ? '#DC2626' : '#64748B'} warn={stats.orphans > 0} />
          <SummaryCard label="Max Depth"    value={stats.maxDepth} bg="#F5F3FF" color="#6D28D9" />
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div style={{ ...sectionCard }}>
          <div style={sectionHead}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Filters</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="button" onClick={handleExpandAll}   style={btnSmallOutline}>Expand All</button>
              <button type="button" onClick={handleCollapseAll} style={btnSmallOutline}>Collapse All</button>
              {hasFilters && (
                <button type="button" onClick={clearFilters} style={{ ...btnSmall, background: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                  <X size={11} /> Clear Filters
                </button>
              )}
            </div>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Search */}
            <div style={{ flex: '2 1 220px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, code, path, alias…"
                style={{ ...inputBase, width: '100%' }}
              />
            </div>
            {/* Area Level */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Area Level</label>
              <select value={filterLevelId} onChange={(e) => setFilterLevelId(e.target.value)} style={{ ...inputBase, width: '100%' }}>
                <option value="">All levels</option>
                {allLevels.map((l) => <option key={l.id} value={l.id}>{l.areaLevelName}</option>)}
              </select>
            </div>
            {/* Status */}
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputBase, width: '100%' }}>
                <option value="">All statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {/* Usage Tag */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Usage Tag</label>
              <select value={filterUsageTag} onChange={(e) => setFilterUsageTag(e.target.value)} style={{ ...inputBase, width: '100%' }}>
                <option value="">All tags</option>
                {USAGE_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Show Inactive toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: showInactive ? 'var(--color-primary)' : '#CBD5E1', position: 'relative', flexShrink: 0,
                }}
              >
                <span style={{
                  display: 'block', width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px',
                  left: showInactive ? '19px' : '3px',
                  transition: 'left 0.15s',
                }} />
              </button>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Show Inactive</span>
            </div>
          </div>
          {hasFilters && (
            <div style={{ padding: '6px 18px 10px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Showing {getAllTreeNodeIds(filteredTree).length} of {areas.length} areas.
                {searchQuery && ' Parent chain preserved for search matches.'}
              </span>
            </div>
          )}
        </div>

        {/* ── Tree section ─────────────────────────────────────────────────── */}
        <div style={sectionCard}>
          <div style={sectionHead}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
              Area Tree {filteredTree.length > 0 && `— ${filteredTree.length} root node${filteredTree.length !== 1 ? 's' : ''}`}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Click area name to view / edit · Click ▶ to expand
            </span>
          </div>

          {areas.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌳</div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No Areas configured</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Create your first area to start building the hierarchy.</p>
              <button type="button" onClick={() => navigate('/admin/areas/new')} style={btnPrimary}>+ Add Area</button>
            </div>
          ) : filteredTree.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>No areas match the current filters.</p>
              <button type="button" onClick={clearFilters} style={btnOutline}>Clear Filters</button>
            </div>
          ) : (
            <div>
              {filteredTree.map((node) => (
                <TreeNode
                  key={node.area.id}
                  node={node}
                  expanded={expanded}
                  onToggle={handleToggle}
                  levelMap={levelMap}
                  onEdit={(id) => navigate(`/admin/areas/${id}`)}
                  onCopyPath={handleCopyPath}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Hierarchy Exceptions ─────────────────────────────────────────── */}
        {exceptions.length > 0 && (
          <div style={{ ...sectionCard, border: '1px solid #FCA5A5' }}>
            <div style={{ ...sectionHead, background: '#FEF2F2', borderBottom: '1px solid #FCA5A5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
                  Hierarchy Exceptions ({exceptions.length})
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#DC2626', opacity: 0.8 }}>
                Review and resolve using the Area edit form
              </span>
            </div>
            <ExceptionsTable
              exceptions={exceptions}
              levelMap={levelMap}
              areaNameMap={areaNameMap}
              onEdit={(id) => navigate(`/admin/areas/${id}`)}
            />
          </div>
        )}

      </div>
    </AdminShell>
  );
};

export default AreaTreePage;
