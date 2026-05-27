import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Clock, Info } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import type { Area, AreaLevel } from '../types/areaMaster.types';
import { areaService } from '../services/areaService';
import { areaLevelService } from '../services/areaLevelService';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  getAreaLevelCounts,
  getAreaCounts,
  getAreasMissingParent,
  getAreasMissingUsageTags,
  getAreasMissingGeoCoordinates,
  getAreasWithInvalidGeoData,
  getDuplicateAreaRisks,
  calculateAreaReadinessStatus,
  buildSetupChecklist,
  buildExceptionSummary,
  type ChecklistItem,
  type ExceptionItem,
} from '../utils/areaDashboardUtils';
import { findHierarchyExceptions } from '../utils/hierarchyTreeUtils';

// ─── Style helpers ─────────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', fontSize: '12px', fontWeight: 600,
  borderRadius: '8px', cursor: 'pointer', border: 'none',
};
const btnPrimary: React.CSSProperties  = { ...btnBase, background: 'var(--color-primary)', color: 'white' };
const btnOutline: React.CSSProperties  = { ...btnBase, fontWeight: 500, background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
const sectionCard: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' };
const sectionHead: React.CSSProperties = { padding: '12px 18px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const headTitle: React.CSSProperties   = { fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

function readinessColor(status: string): string {
  if (status === 'Ready')                return '#15803D';
  if (status === 'Ready with Warnings')  return '#D97706';
  if (status === 'Blocked')              return '#DC2626';
  if (status === 'In Progress')          return '#2563EB';
  return '#94A3B8'; // Not Started
}

function readinessBg(status: string): string {
  if (status === 'Ready')                return '#F0FDF4';
  if (status === 'Ready with Warnings')  return '#FFFBEB';
  if (status === 'Blocked')              return '#FEF2F2';
  if (status === 'In Progress')          return '#EFF6FF';
  return '#F8FAFC';
}

function severityColor(s: string): string {
  if (s === 'Critical') return '#DC2626';
  if (s === 'Warning')  return '#D97706';
  return '#2563EB';
}

function severityBg(s: string): string {
  if (s === 'Critical') return '#FEF2F2';
  if (s === 'Warning')  return '#FEF3C7';
  return '#EFF6FF';
}

// ─── KpiCard ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  bg: string;
  color: string;
  onClick?: () => void;
  warn?: boolean;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, bg, color, onClick, warn }) => (
  <div
    onClick={onClick}
    style={{
      padding: '16px 18px', background: bg,
      border: `1px solid ${warn ? '#FCA5A5' : 'var(--color-border)'}`,
      borderRadius: '10px', cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s', minWidth: 0,
    }}
    onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.3 }}>{label}</div>
  </div>
);

// ─── ChecklistRow ──────────────────────────────────────────────────────────────

const ChecklistRow: React.FC<{ item: ChecklistItem; onAction: (path: string) => void }> = ({ item, onAction }) => {
  const cfg = {
    Completed: { node: <CheckCircle2 size={15} />, color: '#15803D' },
    Pending:   { node: <Circle       size={15} />, color: '#94A3B8' },
    Warning:   { node: <AlertTriangle size={15} />, color: '#D97706' },
    Blocked:   { node: <AlertCircle  size={15} />, color: '#DC2626' },
  } as const;
  const { node, color } = cfg[item.status];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color, flexShrink: 0, marginTop: '1px' }}>{node}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{item.label}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{item.description}</div>
      </div>
      {item.actionPath && item.actionLabel && (
        <button
          type="button"
          onClick={() => onAction(item.actionPath!)}
          style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {item.actionLabel} →
        </button>
      )}
    </div>
  );
};

// ─── ExceptionRow ──────────────────────────────────────────────────────────────

const ExceptionRow: React.FC<{ item: ExceptionItem; onAction: (path: string) => void }> = ({ item, onAction }) => {
  const SeverityIcon = item.severity === 'Critical' ? AlertCircle
    : item.severity === 'Warning' ? AlertTriangle : Info;
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '80px 160px 56px 1fr 90px', gap: 0, padding: '10px 18px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <SeverityIcon size={12} style={{ color: severityColor(item.severity), flexShrink: 0 }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: severityColor(item.severity), background: severityBg(item.severity), padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
          {item.severity}
        </span>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', paddingRight: '12px' }}>{item.issueType}</span>
      <span style={{ fontSize: '16px', fontWeight: 700, color: severityColor(item.severity), paddingRight: '12px' }}>{item.count}</span>
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4, paddingRight: '12px' }}>{item.description}</span>
      <button
        type="button"
        onClick={() => onAction(item.actionPath)}
        style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const }}
      >
        {item.actionLabel} →
      </button>
    </div>
  );
};

// ─── QuickActionCard ───────────────────────────────────────────────────────────

const QuickActionCard: React.FC<{ label: string; description: string; onClick: () => void; primary?: boolean }> = ({ label, description, onClick, primary }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: '4px',
      padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left' as const,
      border: primary ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
      background: primary ? 'var(--color-primary)' : 'transparent',
      transition: 'box-shadow 0.15s', width: '100%',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <span style={{ fontSize: '13px', fontWeight: 700, color: primary ? 'white' : 'var(--color-text)' }}>{label}</span>
    <span style={{ fontSize: '11px', color: primary ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)', lineHeight: 1.4 }}>{description}</span>
  </button>
);

// ─── AreaDashboardPage ─────────────────────────────────────────────────────────

const AreaDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [areas]   = useState<Area[]>(() => areaService.getAll());
  const allLevels = useMemo<AreaLevel[]>(() => areaLevelService.getAll(), []);

  // ── Computed metrics ──────────────────────────────────────────────────────────
  const levelCounts     = useMemo(() => getAreaLevelCounts(allLevels), [allLevels]);
  const areaCounts      = useMemo(() => getAreaCounts(areas), [areas]);
  const missingParent   = useMemo(() => getAreasMissingParent(areas, allLevels), [areas, allLevels]);
  const missingTags     = useMemo(() => getAreasMissingUsageTags(areas), [areas]);
  const missingGeo      = useMemo(() => getAreasMissingGeoCoordinates(areas), [areas]);
  const invalidGeo      = useMemo(() => getAreasWithInvalidGeoData(areas), [areas]);
  const dupeRisks       = useMemo(() => getDuplicateAreaRisks(areas), [areas]);
  const hierarchyExcAll = useMemo(() => findHierarchyExceptions(areas, allLevels), [areas, allLevels]);

  const readiness    = useMemo(() => calculateAreaReadinessStatus(areas, allLevels), [areas, allLevels]);
  const checklist    = useMemo(() => buildSetupChecklist(areas, allLevels), [areas, allLevels]);
  const exceptions   = useMemo(() => buildExceptionSummary(areas, allLevels), [areas, allLevels]);

  const criticalExceptions = exceptions.filter((e) => e.severity === 'Critical');
  const warningExceptions  = exceptions.filter((e) => e.severity === 'Warning');
  const infoExceptions     = exceptions.filter((e) => e.severity === 'Info');

  const [showAllExceptions, setShowAllExceptions] = useState(false);

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

  const rColor    = readinessColor(readiness.status);
  const rBg       = readinessBg(readiness.status);

  const PAGE: React.CSSProperties = { padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' };
  const GRID_4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' };
  const COL_LABEL: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px', marginTop: '4px' };

  return (
    <AdminShell>
      <div style={PAGE}>

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Area Setup Health Dashboard
              </h1>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: rBg, color: rColor, border: `1px solid ${rColor}30` }}>
                {readiness.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '560px', lineHeight: 1.5, margin: 0 }}>
              Monitor Area Level setup, Area Master setup, hierarchy health, geo/postal readiness, and pending setup actions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/admin/area-levels/new')} style={btnOutline}>+ Area Level</button>
            <button type="button" onClick={() => navigate('/admin/areas/new')}       style={btnOutline}>+ Add Area</button>
            <button type="button" onClick={() => navigate('/admin/areas')}            style={btnOutline}>Area List</button>
            <button type="button" onClick={() => navigate('/admin/area-tree')}        style={btnOutline}>Hierarchy Tree</button>
            <button type="button" onClick={() => navigate('/admin/area-import')}      style={btnPrimary}>Import</button>
          </div>
        </div>

        {/* ── Readiness Card ───────────────────────────────────────────────────── */}
        <div style={{ ...sectionCard, border: `1px solid ${rColor}40`, marginBottom: '24px' }}>
          <div style={{ padding: '20px 24px', background: rBg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: rColor, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Overall Readiness
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: rColor, marginBottom: '6px' }}>
                  {readiness.status}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {readiness.message}
                </div>
                {/* Progress bar */}
                <div style={{ height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readiness.progressPercentage}%`, background: rColor, borderRadius: '3px', transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{readiness.progressPercentage}% complete</div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#DC2626' }}>{readiness.criticalCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Critical Issues</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#D97706' }}>{readiness.warningCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Warnings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: rColor }}>{checklist.filter((c) => c.status === 'Completed').length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/ {checklist.length} Checks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
        <div style={sectionCard}>
          <div style={sectionHead}>
            <span style={headTitle}>Key Metrics</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {/* Area Level group */}
            <div style={COL_LABEL}>Area Level Configuration</div>
            <div style={{ ...GRID_4, marginBottom: '20px' }}>
              <KpiCard label="Total Area Levels"    value={levelCounts.total}    bg="#F0F9FF" color="#0369A1" onClick={() => navigate('/admin/area-levels')} />
              <KpiCard label="Active Area Levels"   value={levelCounts.active}   bg="#F0FDF4" color="#15803D" onClick={() => navigate('/admin/area-levels')} />
              <KpiCard label="Draft Area Levels"    value={levelCounts.draft}    bg="#F8FAFC" color="#475569" onClick={() => navigate('/admin/area-levels')} />
              <KpiCard label="Inactive Area Levels" value={levelCounts.inactive} bg="#FEF2F2" color="#DC2626" onClick={() => navigate('/admin/area-levels')} />
            </div>
            {/* Area Master group */}
            <div style={COL_LABEL}>Area Master</div>
            <div style={{ ...GRID_4, marginBottom: '20px' }}>
              <KpiCard label="Total Areas"   value={areaCounts.total}    bg="#F0F9FF" color="#0369A1" onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Active Areas"  value={areaCounts.active}   bg="#F0FDF4" color="#15803D" onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Draft Areas"   value={areaCounts.draft}    bg="#F8FAFC" color="#475569" onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Inactive Areas" value={areaCounts.inactive} bg="#FEF2F2" color="#DC2626" onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Root Areas"    value={areaCounts.rootAreas} bg="#FFF7ED" color="#C2410C" onClick={() => navigate('/admin/area-tree')} />
              <KpiCard label="Areas Missing Parent"      value={missingParent.length}  bg={missingParent.length  > 0 ? '#FEF2F2' : '#F8FAFC'} color={missingParent.length  > 0 ? '#DC2626' : '#64748B'} warn={missingParent.length  > 0} onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Areas Missing Usage Tags"  value={missingTags.length}    bg={missingTags.length    > 0 ? '#FEF3C7' : '#F8FAFC'} color={missingTags.length    > 0 ? '#B45309' : '#64748B'} warn={missingTags.length    > 0} onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Hierarchy Exceptions"      value={hierarchyExcAll.length} bg={hierarchyExcAll.length > 0 ? '#FEF2F2' : '#F8FAFC'} color={hierarchyExcAll.length > 0 ? '#DC2626' : '#64748B'} warn={hierarchyExcAll.length > 0} onClick={() => navigate('/admin/area-tree')} />
            </div>
            {/* Geo & health group */}
            <div style={COL_LABEL}>Geo & Data Health</div>
            <div style={{ ...GRID_4 }}>
              <KpiCard label="Missing Geo Coordinates" value={missingGeo.length}   bg={missingGeo.length   > 0 ? '#FEF3C7' : '#F8FAFC'} color={missingGeo.length   > 0 ? '#B45309' : '#64748B'} warn={missingGeo.length   > 0} onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Invalid Geo Data"        value={invalidGeo.length}   bg={invalidGeo.length   > 0 ? '#FEF2F2' : '#F8FAFC'} color={invalidGeo.length   > 0 ? '#DC2626' : '#64748B'} warn={invalidGeo.length   > 0} onClick={() => navigate('/admin/areas')} />
              <KpiCard label="Duplicate Area Risks"    value={dupeRisks.length}    bg={dupeRisks.length    > 0 ? '#FEF2F2' : '#F8FAFC'} color={dupeRisks.length    > 0 ? '#DC2626' : '#64748B'} warn={dupeRisks.length    > 0} onClick={() => navigate('/admin/areas')} />
            </div>
          </div>
        </div>

        {/* ── Two-column: Checklist + Quick Actions ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', marginBottom: '24px' }}>

          {/* Setup Checklist */}
          <div style={sectionCard}>
            <div style={sectionHead}>
              <span style={headTitle}>Setup Checklist</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {checklist.filter((c) => c.status === 'Completed').length} / {checklist.length} completed
              </span>
            </div>
            {areas.length === 0 && allLevels.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No setup yet</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Start by creating an Area Level Configuration.</p>
                <button type="button" onClick={() => navigate('/admin/area-levels/new')} style={btnPrimary}>Add Area Level</button>
              </div>
            ) : (
              checklist.map((item) => (
                <ChecklistRow key={item.id} item={item} onAction={(path) => navigate(path)} />
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ ...sectionCard, flex: 1 }}>
              <div style={sectionHead}>
                <span style={headTitle}>Quick Actions</span>
              </div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <QuickActionCard
                  label="Create Area Level"
                  description="Add a new Area Level Configuration"
                  onClick={() => navigate('/admin/area-levels/new')}
                  primary
                />
                <QuickActionCard
                  label="Review Area Levels"
                  description="View, edit and activate Area Levels"
                  onClick={() => navigate('/admin/area-levels')}
                />
                <QuickActionCard
                  label="Create Area"
                  description="Add a new Area to the master"
                  onClick={() => navigate('/admin/areas/new')}
                />
                <QuickActionCard
                  label="Review Areas"
                  description="View, edit and manage all Areas"
                  onClick={() => navigate('/admin/areas')}
                />
                <QuickActionCard
                  label="View Hierarchy Tree"
                  description="Explore the parent-child area tree"
                  onClick={() => navigate('/admin/area-tree')}
                />
                <QuickActionCard
                  label="Import Areas"
                  description="Bulk import areas from file"
                  onClick={() => navigate('/admin/area-import')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Exception Summary ────────────────────────────────────────────────── */}
        <div style={sectionCard}>
          <div style={sectionHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={headTitle}>Exception Summary</span>
              {criticalExceptions.length > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626' }}>
                  {criticalExceptions.length} Critical
                </span>
              )}
              {warningExceptions.length > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}>
                  {warningExceptions.length} Warnings
                </span>
              )}
            </div>
            {exceptions.length > 5 && (
              <button type="button" onClick={() => setShowAllExceptions((v) => !v)} style={{ ...btnOutline, padding: '5px 10px', fontSize: '11px' }}>
                {showAllExceptions ? 'Show Less' : `Show All (${exceptions.length})`}
              </button>
            )}
          </div>

          {exceptions.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#15803D', marginBottom: '4px' }}>No exceptions detected</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Area setup data looks healthy.</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 160px 56px 1fr 90px', gap: 0, padding: '8px 18px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                {['Severity', 'Issue Type', 'Count', 'Description', 'Action'].map((h, i) => (
                  <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>{h}</span>
                ))}
              </div>

              {/* Critical group */}
              {criticalExceptions.length > 0 && (
                <>
                  <div style={{ padding: '6px 18px 4px', background: '#FFF5F5', borderBottom: '1px solid #FEE2E2' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                      Critical — must resolve
                    </span>
                  </div>
                  {criticalExceptions.map((item, i) => (
                    <ExceptionRow key={`critical-${i}`} item={item} onAction={(p) => navigate(p)} />
                  ))}
                </>
              )}

              {/* Warning group */}
              {warningExceptions.length > 0 && (
                <>
                  <div style={{ padding: '6px 18px 4px', background: '#FFFBEB', borderBottom: '1px solid #FEF3C7' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                      Warnings — should review
                    </span>
                  </div>
                  {warningExceptions.map((item, i) => (
                    <ExceptionRow key={`warn-${i}`} item={item} onAction={(p) => navigate(p)} />
                  ))}
                </>
              )}

              {/* Info group */}
              {(showAllExceptions || exceptions.length <= 5) && infoExceptions.length > 0 && (
                <>
                  <div style={{ padding: '6px 18px 4px', background: '#EFF6FF', borderBottom: '1px solid #DBEAFE' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                      Informational
                    </span>
                  </div>
                  {infoExceptions.map((item, i) => (
                    <ExceptionRow key={`info-${i}`} item={item} onAction={(p) => navigate(p)} />
                  ))}
                </>
              )}

              {!showAllExceptions && exceptions.length > 5 && infoExceptions.length > 0 && (
                <div style={{ padding: '10px 18px', textAlign: 'center' }}>
                  <button type="button" onClick={() => setShowAllExceptions(true)} style={{ ...btnOutline, fontSize: '11px', padding: '5px 12px' }}>
                    Show {infoExceptions.length} Informational Items
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Timestamp footer ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '-8px', marginBottom: '16px' }}>
          <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Dashboard computed from current Area and Area Level data. Refresh the page for latest state.
        </div>

      </div>
    </AdminShell>
  );
};

export default AreaDashboardPage;
