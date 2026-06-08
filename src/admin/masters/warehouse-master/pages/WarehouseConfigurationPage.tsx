// ─── WarehouseConfigurationPage ──────────────────────────────────────────────
//
// Route: /admin/master/warehouse-master/:warehouseId/configuration
//
// Two-pane layout:
//   Left  — WarehouseSectionNav (rich 7-state status nav)
//   Right — active section content
//
// All pure logic functions exported for testing.

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../../AdminShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';

import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { WarehouseDetails } from '../types/warehouse.types';
import type { Warehouse, HierarchyTemplate, WarehouseLocation } from '../types/warehouse.types';
import type { UpdateWarehouseInput } from '../types/warehouse.dto';
import type { WarehousePermissions } from '../types/warehouse.permissions';
import { mockAllPermissions } from '../types/warehouse.permissions';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';

import { WarehouseSectionNav } from '../components/WarehouseSectionNav';
import type { WarehouseSectionItem, WarehouseSectionStatus } from '../components/WarehouseSectionNav';
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge';
import { WarehouseSetupHealth } from '../components/WarehouseSetupHealth';

import { OwnershipSection } from '../components/sections/OwnershipSection';
import { BranchAccessSection } from '../components/sections/BranchAccessSection';
import { InventoryControlSection } from '../components/sections/InventoryControlSection';
import { HierarchyTemplateSection } from '../components/sections/HierarchyTemplateSection';
import { LocationDefaultsSection } from '../components/sections/LocationDefaultsSection';
import { PutawayPolicySection } from '../components/sections/PutawayPolicySection';
import { PickingPolicySection } from '../components/sections/PickingPolicySection';
import { CapacityPolicySection } from '../components/sections/CapacityPolicySection';
import { EligibilityPolicySection } from '../components/sections/EligibilityPolicySection';
import { StockGovernanceSection } from '../components/sections/StockGovernanceSection';
import { CycleCountSection } from '../components/sections/CycleCountSection';
import { GovernanceSection } from '../components/sections/GovernanceSection';
import type { SectionSavePayload } from '../components/sections/sectionTypes';

import { ArrowLeft, Lock, AlertTriangle, Zap, Ban, RotateCcw, Settings, HelpCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfigSectionKey =
  | 'overview'
  | 'ownership'
  | 'branchAccess'
  | 'inventoryControl'
  | 'hierarchyTemplate'
  | 'locationDefaults'
  | 'putaway'
  | 'picking'
  | 'capacity'
  | 'eligibility'
  | 'stockGovernance'
  | 'cycleCount'
  | 'governance';

export interface PageAction {
  key: string;
  label: string;
  variant: 'primary' | 'danger' | 'warning' | 'outline';
  disabled: boolean;
  disabledReason?: string;
}

// ─── Pure exported functions (used by tests) ─────────────────────────────────

/** Returns true when the inventory control mode is locked (active/blocked warehouse). */
export function isInventoryModeChangeLocked(warehouse: Pick<Warehouse, 'status'>): boolean {
  return warehouse.status === 'Active' || warehouse.status === 'Blocked';
}

/** Compute the status of every section for a given warehouse + context. */
export function computeSectionStatuses(
  warehouse: Warehouse,
  templates: HierarchyTemplate[],
  locations: WarehouseLocation[],
): Record<ConfigSectionKey, WarehouseSectionStatus> {
  const isBinLevel = warehouse.inventoryControlMode === 'Location-BIN-Level';
  const isLocked = isInventoryModeChangeLocked(warehouse);

  // overview: always complete (display only)
  const overview: WarehouseSectionStatus = 'complete';

  // ownership: requires scope + owning entity
  const hasOwningEntity = warehouse.ownershipScope === 'Organization'
    ? !!warehouse.owningOrgCode
    : !!warehouse.owningBranchCode;
  const ownership: WarehouseSectionStatus =
    warehouse.ownershipScope && hasOwningEntity ? 'complete' : 'error';

  // branchAccess: warning if org-level and no shared + no active assignments
  const ap = warehouse.assignmentProfile;
  const hasActiveAssignment = (ap?.assignments ?? []).some((a) => a.assignmentStatus === 'Active');
  let branchAccess: WarehouseSectionStatus;
  if (warehouse.ownershipScope === 'Branch') {
    branchAccess = 'complete'; // not applicable for branch-owned
  } else if (ap?.sharedWithAllBranches || hasActiveAssignment) {
    branchAccess = 'complete';
  } else {
    branchAccess = 'warning';
  }

  // inventoryControl: locked when active/blocked, complete when mode set
  let inventoryControl: WarehouseSectionStatus;
  if (!warehouse.inventoryControlMode) {
    inventoryControl = 'error';
  } else if (isLocked) {
    inventoryControl = 'locked';
  } else {
    inventoryControl = 'complete';
  }

  // hierarchyTemplate: BIN-level only
  let hierarchyTemplate: WarehouseSectionStatus;
  if (!isBinLevel) {
    hierarchyTemplate = 'empty';
  } else {
    const hasActiveTemplate = templates.some((t) => t.status === 'Active');
    hierarchyTemplate = hasActiveTemplate ? 'complete' : 'error';
  }

  // locationDefaults: partial if any default set; empty otherwise
  const dl = warehouse.defaultLocations;
  const hasAnyDefault = dl &&
    (dl.putaway || dl.picking || dl.return || dl.qc || dl.staging || dl.scrap);
  const locationDefaults: WarehouseSectionStatus = hasAnyDefault ? 'partial' : 'empty';

  // putaway: BIN-Level only; locked for Warehouse-Level
  let putaway: WarehouseSectionStatus;
  if (!isBinLevel) {
    putaway = 'locked';
  } else if (warehouse.autoPutaway) {
    putaway = 'complete';
  } else {
    putaway = 'empty';
  }

  // picking: same as putaway
  let picking: WarehouseSectionStatus;
  if (!isBinLevel) {
    picking = 'locked';
  } else if (warehouse.autoPicking) {
    picking = 'complete';
  } else {
    picking = 'empty';
  }

  // capacity: partial if any field set; empty otherwise
  const cp = warehouse.capacityPolicy;
  const hasCapacity = cp && (cp.trackingEnabled || cp.squareFootage || cp.dockCount || cp.temperatureControlled || cp.hazardousStorage);
  const capacity: WarehouseSectionStatus = hasCapacity ? 'partial' : 'empty';

  // eligibility: complete if mode is explicitly set; else partial (Open is default)
  const eligibility: WarehouseSectionStatus = warehouse.eligibilityPolicy ? 'complete' : 'partial';

  // stockGovernance: complete if both policies set
  const stockGovernance: WarehouseSectionStatus =
    (warehouse.reservationPolicy && warehouse.allocationPolicy) ? 'complete' : 'partial';

  // cycleCount: complete if policy set and enabled; empty otherwise
  const cycleCount: WarehouseSectionStatus = warehouse.cycleCountPolicy?.enabled ? 'complete' : 'empty';

  // governance: always complete (display only)
  const governance: WarehouseSectionStatus = 'complete';

  return {
    overview,
    ownership,
    branchAccess,
    inventoryControl,
    hierarchyTemplate,
    locationDefaults,
    putaway,
    picking,
    capacity,
    eligibility,
    stockGovernance,
    cycleCount,
    governance,
  };
}

/** Build the list of available lifecycle actions for the page header. */
export function getAvailablePageActions(
  warehouse: Warehouse,
  permissions: WarehousePermissions,
): PageAction[] {
  const actions: PageAction[] = [];
  const status = warehouse.status;

  if (status === 'Draft') {
    actions.push({
      key: 'activate',
      label: 'Activate',
      variant: 'primary',
      disabled: !permissions['warehouse.activate'],
      disabledReason: !permissions['warehouse.activate'] ? 'Insufficient permission' : undefined,
    });
  }
  if (status === 'Active') {
    actions.push({
      key: 'block',
      label: 'Block',
      variant: 'warning',
      disabled: !permissions['warehouse.block'],
      disabledReason: !permissions['warehouse.block'] ? 'Insufficient permission' : undefined,
    });
    actions.push({
      key: 'inactivate',
      label: 'Inactivate',
      variant: 'danger',
      disabled: !permissions['warehouse.inactivate'],
      disabledReason: !permissions['warehouse.inactivate'] ? 'Insufficient permission' : undefined,
    });
  }
  if (status === 'Blocked') {
    actions.push({
      key: 'unblock',
      label: 'Unblock',
      variant: 'primary',
      disabled: !permissions['warehouse.unblock'],
      disabledReason: !permissions['warehouse.unblock'] ? 'Insufficient permission' : undefined,
    });
    actions.push({
      key: 'inactivate',
      label: 'Inactivate',
      variant: 'danger',
      disabled: !permissions['warehouse.inactivate'],
      disabledReason: !permissions['warehouse.inactivate'] ? 'Insufficient permission' : undefined,
    });
  }
  if (status === 'Inactive') {
    actions.push({
      key: 'activate',
      label: 'Re-activate',
      variant: 'primary',
      disabled: !permissions['warehouse.activate'],
      disabledReason: !permissions['warehouse.activate'] ? 'Insufficient permission' : undefined,
    });
  }
  return actions;
}

/** Validate a section before persisting. Returns errors if required fields are missing. */
export function validateSectionSave(
  sectionKey: ConfigSectionKey,
  formState: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (sectionKey === 'ownership') {
    if (!formState['ownershipScope']) errors.push('Ownership Scope is required.');
    if (!formState['owningOrgCode'] && !formState['owningBranchCode']) {
      errors.push('Owning entity is required.');
    }
  }
  if (sectionKey === 'inventoryControl') {
    if (!formState['inventoryControlMode']) errors.push('Inventory Control Mode is required.');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Section nav items builder ────────────────────────────────────────────────

const SECTION_META: { key: ConfigSectionKey; label: string; description: string }[] = [
  { key: 'overview',           label: 'Overview',             description: 'Setup health & issues' },
  { key: 'ownership',          label: 'Ownership & Facility', description: 'Scope, type, timezone' },
  { key: 'branchAccess',       label: 'Branch Access',        description: 'Assignment & sharing' },
  { key: 'inventoryControl',   label: 'Inventory Control',    description: 'Mode & WMS' },
  { key: 'hierarchyTemplate',  label: 'Hierarchy Template',   description: 'BIN-Level only' },
  { key: 'locationDefaults',   label: 'Location Defaults',    description: 'Purpose routing' },
  { key: 'putaway',            label: 'Auto Putaway',         description: 'BIN-Level only' },
  { key: 'picking',            label: 'Auto Picking',         description: 'BIN-Level only' },
  { key: 'capacity',           label: 'Capacity & Constraints', description: 'Space & hazmat' },
  { key: 'eligibility',        label: 'Item Eligibility',     description: 'Allow / block rules' },
  { key: 'stockGovernance',    label: 'Stock Governance',     description: 'Reservation & allocation' },
  { key: 'cycleCount',         label: 'Cycle Count',          description: 'Count policy' },
  { key: 'governance',         label: 'Governance & Audit',   description: 'Lifecycle & trail' },
];

function buildNavItems(
  statuses: Record<ConfigSectionKey, WarehouseSectionStatus>,
  issueCountBySection: Partial<Record<ConfigSectionKey, number>>,
): WarehouseSectionItem[] {
  return SECTION_META.map(({ key, label, description }) => ({
    key,
    label,
    description,
    status: statuses[key],
    issueCount: issueCountBySection[key] ?? 0,
  }));
}

function mapHealthSectionToConfigSection(section: string): ConfigSectionKey {
  switch (section) {
    case 'branchAssignment':
      return 'branchAccess';
    case 'defaultLocations':
      return 'locationDefaults';
    case 'autoPutaway':
      return 'putaway';
    case 'autoPicking':
      return 'picking';
    case 'capacityStorage':
      return 'capacity';
    case 'itemEligibility':
      return 'eligibility';
    case 'stockStatusGovernance':
    case 'reservationAllocation':
      return 'stockGovernance';
    default:
      return section as ConfigSectionKey;
  }
}

function getConfigHelpTopic(section: ConfigSectionKey): string {
  switch (section) {
    case 'ownership':
      return 'warehouse-ownership';
    case 'branchAccess':
      return 'warehouse-branch-access';
    case 'inventoryControl':
      return 'warehouse-inventory-control';
    case 'hierarchyTemplate':
      return 'warehouse-hierarchy';
    case 'locationDefaults':
      return 'warehouse-defaults';
    case 'putaway':
      return 'warehouse-putaway';
    case 'picking':
      return 'warehouse-picking';
    case 'capacity':
      return 'warehouse-capacity';
    case 'eligibility':
      return 'warehouse-item-eligibility';
    case 'stockGovernance':
      return 'warehouse-stock-governance';
    case 'cycleCount':
      return 'warehouse-cycle-count';
    case 'governance':
      return 'warehouse-audit';
    default:
      return 'warehouse-master-overview';
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function WarehouseConfigurationPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ConfigSectionKey>('overview');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1100);

  const permissions: WarehousePermissions = mockAllPermissions();

  // Determine read only
  const canEdit = permissions['warehouse.edit'];

  // Load warehouse details
  useEffect(() => {
    if (!warehouseId) return;
    setLoading(true);
    warehouseMockAdapter.getWarehouse(warehouseId)
      .then((d) => {
        setDetails(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to load warehouse.');
        setLoading(false);
      });
  }, [warehouseId]);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reload = useCallback(async () => {
    if (!warehouseId) return;
    const d = await warehouseMockAdapter.getWarehouse(warehouseId);
    setDetails(d);
  }, [warehouseId]);

  const handleSave = useCallback(
    async (payload: SectionSavePayload) => {
      if (!details || !warehouseId) return;
      setSaving(true);
      setSaveError(null);
      try {
        const input: UpdateWarehouseInput = { ...payload, version: details.warehouse.version };
        const updated = await warehouseMockAdapter.updateWarehouse(warehouseId, details.warehouse.version, input);
        setDetails(updated);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Save failed.';
        setSaveError(msg);
      } finally {
        setSaving(false);
      }
    },
    [details, warehouseId],
  );

  // ── Loading / error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (error || !details) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#DC2626', marginBottom: '12px' }}>{error ?? 'Warehouse not found.'}</p>
        <Link to={WAREHOUSE_ROUTES.list} style={{ color: 'var(--color-primary)', fontSize: '13px' }}>
          ← Back to Warehouse List
        </Link>
      </div>
    );
  }

  const { warehouse, hierarchyTemplates, recentAuditEvents } = details;
  const locations = (details as unknown as { locations?: WarehouseLocation[] }).locations ?? [];

  const sectionStatuses = computeSectionStatuses(warehouse, hierarchyTemplates, locations);
  const pageActions = getAvailablePageActions(warehouse, permissions);

  // Build issue count per section from setupHealth
  const issueCountBySection: Partial<Record<ConfigSectionKey, number>> = {};
  // Use setup health blockingIssues to drive nav badges
  details.setupHealth.sections.forEach((sh) => {
    const errCount = sh.issues.filter((i) => i.severity === 'error').length;
    if (errCount > 0) {
      const mapped = mapHealthSectionToConfigSection(sh.section);
      issueCountBySection[mapped] = (issueCountBySection[mapped] ?? 0) + errCount;
    }
  });

  const navItems = buildNavItems(sectionStatuses, issueCountBySection);

  // ── Section props ─────────────────────────────────────────────────────────
  const sectionProps = {
    warehouse,
    templates: hierarchyTemplates,
    locations,
    readOnly: !canEdit,
    saving,
    onSave: handleSave,
  };

  // ── Section renderer ──────────────────────────────────────────────────────
  function renderSection() {
    switch (activeSection) {
      case 'overview': return <OverviewSection warehouse={warehouse} details={details!} onJumpToSection={setActiveSection} />;
      case 'ownership': return <OwnershipSection {...sectionProps} />;
      case 'branchAccess': return <BranchAccessSection {...sectionProps} />;
      case 'inventoryControl': return <InventoryControlSection {...sectionProps} />;
      case 'hierarchyTemplate': return <HierarchyTemplateSection {...sectionProps} />;
      case 'locationDefaults': return <LocationDefaultsSection {...sectionProps} />;
      case 'putaway': return <PutawayPolicySection {...sectionProps} />;
      case 'picking': return <PickingPolicySection {...sectionProps} />;
      case 'capacity': return <CapacityPolicySection {...sectionProps} />;
      case 'eligibility': return <EligibilityPolicySection {...sectionProps} />;
      case 'stockGovernance': return <StockGovernanceSection {...sectionProps} />;
      case 'cycleCount': return <CycleCountSection {...sectionProps} />;
      case 'governance': return <GovernanceSection {...sectionProps} auditEvents={recentAuditEvents} />;
      default: return null;
    }
  }

  // ── Page layout ───────────────────────────────────────────────────────────
  return (
    <AdminShell>
    <div
      data-testid="warehouse-configuration-page"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100%', overflow: 'hidden', background: 'var(--color-background)' }}
    >
      {/* ── Page header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '0 24px', height: '56px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
      }}>
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(WAREHOUSE_ROUTES.detail(warehouse.id))}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ width: '1px', height: '22px', background: 'var(--color-border)' }} />

        {/* Settings icon */}
        <Settings size={16} style={{ color: 'var(--color-text-muted)' }} />

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {warehouse.warehouseName}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}>
              {warehouse.warehouseCode}
            </span>
            <WarehouseStatusBadge status={warehouse.status} size="sm" />
            <WarehouseSetupHealth
              tone={details.setupHealth.overallTone}
              blockingCount={details.setupHealth.blockingIssues.length}
              compact
            />
          </div>
        </div>

        {/* Lifecycle actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', fontSize: '12px', fontWeight: 600,
              borderRadius: '7px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            <HelpCircle size={12} />
            Help
          </button>
          {pageActions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={action.disabled}
              title={action.disabledReason}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                borderRadius: '7px', border: 'none', cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.45 : 1,
                background: action.variant === 'primary' ? 'var(--color-primary)'
                  : action.variant === 'danger' ? '#DC2626'
                  : action.variant === 'warning' ? '#D97706'
                  : 'var(--color-surface)',
                color: action.variant === 'outline' ? 'var(--color-text)' : 'white',
                ...(action.variant === 'outline' ? { border: '1px solid var(--color-border)' } : {}),
              }}
            >
              {action.key === 'activate' && <Zap size={12} />}
              {action.key === 'block' && <Ban size={12} />}
              {action.key === 'unblock' && <RotateCcw size={12} />}
              {action.key === 'inactivate' && <Lock size={12} />}
              {action.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Body (nav + content) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!isNarrow && (
          <WarehouseSectionNav
            sections={navItems}
            activeKey={activeSection}
            onSelect={(k) => setActiveSection(k as ConfigSectionKey)}
          />
        )}

        {/* Section content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 28px',
          background: 'var(--color-background)',
        }}>
          {isNarrow && (
            <div style={{ maxWidth: '340px', marginBottom: '18px' }}>
              <label htmlFor="warehouse-section-selector" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                Section
              </label>
              <select
                id="warehouse-section-selector"
                value={activeSection}
                onChange={(event) => setActiveSection(event.target.value as ConfigSectionKey)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '12px' }}
              >
                {SECTION_META.map((section) => (
                  <option key={section.key} value={section.key}>{section.label}</option>
                ))}
              </select>
            </div>
          )}
          {/* Section title */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
              {SECTION_META.find((s) => s.key === activeSection)?.label ?? activeSection}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {SECTION_META.find((s) => s.key === activeSection)?.description}
            </p>
          </div>

          {saveError && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '12px', color: '#991B1B', marginBottom: '14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <AlertTriangle size={13} />
              {saveError}
            </div>
          )}

          {renderSection()}
        </main>
      </div>
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic(getConfigHelpTopic(activeSection))}
        onClose={() => setHelpOpen(false)}
      />
    </div>
    </AdminShell>
  );
}

// ─── Overview section (inline, display-only) ──────────────────────────────────

function OverviewSection({
  warehouse,
  details,
  onJumpToSection,
}: {
  warehouse: Warehouse;
  details: WarehouseDetails;
  onJumpToSection: (section: ConfigSectionKey) => void;
}) {
  const health = details.setupHealth;

  return (
    <div data-testid="section-overview">
      {/* Setup health summary */}
      <div style={{
        padding: '16px 20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '10px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <WarehouseSetupHealth tone={health.overallTone} blockingCount={health.blockingIssues.length} showLabel />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {health.readyForActivation ? 'Ready for activation' : 'Not yet ready for activation'}
          </span>
        </div>
        {/* Section health list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
          {health.sections.map((sh) => {
            const mappedSection = mapHealthSectionToConfigSection(sh.section);
            return (
            <button key={sh.section} type="button" onClick={() => onJumpToSection(mappedSection)} style={{
              padding: '8px 12px', borderRadius: '7px', background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)', fontSize: '11px', textAlign: 'left', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{sh.section}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '9999px',
                  background: sh.tone === 'complete' ? '#DCFCE7'
                    : sh.tone === 'partial' ? '#FEF9C3'
                    : sh.tone === 'error' ? '#FEF2F2'
                    : '#F1F5F9',
                  color: sh.tone === 'complete' ? '#15803D'
                    : sh.tone === 'partial' ? '#A16207'
                    : sh.tone === 'error' ? '#991B1B'
                    : '#475569',
                }}>
                  {sh.tone}
                </span>
              </div>
              <div style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>
                {sh.completedFields}/{sh.totalFields} fields
                {sh.issues.length > 0 && (
                  <span style={{ marginLeft: '6px', color: '#DC2626' }}>{sh.issues.length} issue{sh.issues.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </button>
          );
          })}
        </div>
      </div>

      {/* Blocking issues */}
      {health.blockingIssues.length > 0 && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '8px 16px', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>
              {health.blockingIssues.length} blocking issue{health.blockingIssues.length > 1 ? 's' : ''} — activation blocked
            </span>
          </div>
          {health.blockingIssues.map((issue, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJumpToSection(mapHealthSectionToConfigSection(issue.section ?? 'inventoryControl'))}
              style={{ width: '100%', padding: '8px 16px', border: 'none', borderBottom: '1px solid var(--color-border)', fontSize: '12px', textAlign: 'left', background: 'var(--color-surface)', cursor: 'pointer' }}
            >
              <span style={{ color: '#DC2626', fontWeight: 600 }}>{issue.category}: </span>
              {issue.message}
              <span style={{ marginLeft: '8px', color: 'var(--color-primary)', fontWeight: 600 }}>Open section</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
