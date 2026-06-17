// ─── Warehouse Preview Drawer ─────────────────────────────────────────────────
//
// Shows full warehouse details in SmartPreviewDrawer.
// Loads WarehouseDetails async on open. No editable fields inside.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartPreviewDrawer } from '../../../../experience/components/SmartPreviewDrawer';
import type { PreviewSection } from '../../../../experience/components/SmartPreviewDrawer/SmartPreviewDrawer.types';
import type { WarehouseDetails, WarehouseSummary } from '../types/warehouse.types';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { WarehouseScopeBadge } from './WarehouseScopeBadge';
import { WarehouseModeBadge } from './WarehouseModeBadge';
import { WarehouseSetupHealth } from './WarehouseSetupHealth';
import { deriveAvailableActions } from '../utils/warehouseDerivations';
import { mockAllPermissions } from '../types/warehouse.permissions';
import { formatDate } from '../../../../utils/dateFormat';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WarehousePreviewDrawerProps {
  warehouseId: string | null;
  open: boolean;
  onClose: () => void;
  onBlockRequested: (summary: Pick<WarehouseSummary, 'id' | 'warehouseName' | 'warehouseCode'>) => void;
  onInactivateRequested: (summary: Pick<WarehouseSummary, 'id' | 'warehouseName' | 'warehouseCode'>) => void;
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildSections(details: WarehouseDetails): PreviewSection[] {
  const { warehouse: wh, hierarchyTemplates, setupHealth } = details;

  const activeTemplate = hierarchyTemplates.find((t) => t.status === 'Active');

  const blockingIssues = setupHealth.blockingIssues ?? [];

  return [
    // ── 1. Ownership & Facility ────────────────────────────────────────────
    {
      title: 'Ownership & Facility',
      fields: [
        {
          label: 'Ownership Scope',
          value: <WarehouseScopeBadge scope={wh.ownershipScope} />,
        },
        {
          label: wh.ownershipScope === 'Organization' ? 'Owning Organisation' : 'Owning Branch',
          value: wh.ownershipScope === 'Organization'
            ? (wh.owningOrgCode ?? '—')
            : (wh.owningBranchCode ?? '—'),
          mono: true,
        },
        {
          label: 'Warehouse Type',
          value: wh.warehouseType,
        },
        {
          label: 'WMS Enabled',
          value: wh.wmsEnabled ? 'Yes' : 'No',
        },
        {
          label: 'Creation Source',
          value: wh.creationSource,
        },
        {
          label: 'Inventory Owner',
          value: wh.assignmentProfile.inventoryOwner
            ? `${wh.assignmentProfile.inventoryOwner.ownerName} (${wh.assignmentProfile.inventoryOwner.ownerType})`
            : '—',
        },
      ],
    },

    // ── 2. Branch Access ──────────────────────────────────────────────────
    {
      title: 'Branch Access',
      fields: [
        {
          label: 'Shared with All Branches',
          value: wh.assignmentProfile.sharedWithAllBranches ? 'Yes' : 'No',
        },
        {
          label: 'Active Branch Assignments',
          value: wh.assignmentProfile.assignments.filter((a) => a.assignmentStatus === 'Active').length === 0
            ? 'None'
            : wh.assignmentProfile.assignments
                .filter((a) => a.assignmentStatus === 'Active')
                .map((a) => `${a.branchName} (${a.branchCode}${a.isDefaultForBranch ? ' · default' : ''})`)
                .join(', '),
          span: 2,
        },
        {
          label: 'Effective From',
          value: wh.assignmentProfile.assignments.length > 0
            ? formatDate(wh.assignmentProfile.assignments[0].effectiveFrom)
            : '—',
        },
      ],
    },

    // ── 3. Inventory Configuration ────────────────────────────────────────
    {
      title: 'Inventory Configuration',
      fields: [
        {
          label: 'Control Mode',
          value: <WarehouseModeBadge mode={wh.inventoryControlMode} />,
        },
        {
          label: 'BIN Managed',
          value: wh.inventoryControlRules.binManaged ? 'Yes — Location / BIN Level' : 'No — Warehouse Level',
        },
        {
          label: 'BIN-to-BIN Transfer',
          value: wh.inventoryControlRules.allowBinToBinTransfer ? 'Allowed' : 'Blocked',
        },
        {
          label: 'Warehouse-Level Posting',
          value: wh.inventoryControlRules.allowWarehouseLevelPosting ? 'Allowed' : 'Not allowed',
        },
        {
          label: 'Auto Putaway',
          value: wh.autoPutaway?.enabled
            ? `Enabled — ${wh.autoPutaway.strategy}`
            : 'Disabled',
        },
        {
          label: 'Auto Picking',
          value: wh.autoPicking?.enabled
            ? `Enabled — ${wh.autoPicking.strategy}`
            : 'Disabled',
        },
      ],
    },

    // ── 4. Hierarchy & Location Summary ───────────────────────────────────
    {
      title: 'Hierarchy & Location Summary',
      fields: [
        {
          label: 'Active Hierarchy Template',
          value: activeTemplate
            ? `${activeTemplate.templateCode} — ${activeTemplate.templateName}`
            : <span style={{ color: '#D97706', fontSize: '12px' }}>None active</span>,
          span: 2,
        },
        {
          label: 'Total Locations',
          value: String(setupHealth.sections?.find((s) => s.section === 'locations')?.completedFields ?? '—'),
        },
        {
          label: 'Inventory-Allowed BINs',
          value: String(setupHealth.sections?.find((s) => s.section === 'locations')?.totalFields ?? '—'),
        },
        {
          label: 'Eligibility Policy',
          value: wh.eligibilityPolicy?.mode ?? 'Open',
        },
        {
          label: 'Cycle Count',
          value: wh.cycleCountPolicy?.enabled
            ? `${wh.cycleCountPolicy.scope} / ${wh.cycleCountPolicy.frequency}`
            : 'Disabled',
        },
      ],
    },

    // ── 5. Operational Policies ────────────────────────────────────────────
    {
      title: 'Operational Policies',
      fields: [
        {
          label: 'Capacity Tracking',
          value: wh.capacityPolicy?.trackingEnabled
            ? `Yes — ${wh.capacityPolicy.squareFootage ?? '—'} sq ft`
            : 'Not tracked',
        },
        {
          label: 'Temperature Controlled',
          value: wh.capacityPolicy?.temperatureControlled ? 'Yes' : 'No',
        },
        {
          label: 'Hazardous Storage',
          value: wh.capacityPolicy?.hazardousStorage ? 'Yes' : 'No',
        },
        {
          label: 'Operating Hours',
          value: wh.operatingCalendar
            ? `${wh.operatingCalendar.openTime} – ${wh.operatingCalendar.closeTime} (${wh.operatingCalendar.timezone})`
            : '—',
        },
      ],
    },

    // ── 6. Governance & Audit ──────────────────────────────────────────────
    {
      title: 'Governance & Audit',
      fields: [
        {
          label: 'Setup Health',
          value: (
            <WarehouseSetupHealth
              tone={setupHealth.overallTone}
              blockingCount={blockingIssues.length}
              showLabel
            />
          ),
        },
        {
          label: 'Activation Ready',
          value: setupHealth.readyForActivation ? 'Yes' : (
            <span style={{ color: '#D97706', fontWeight: 600 }}>No</span>
          ),
        },
        ...(wh.blockReason
          ? [{
              label: 'Block Reason',
              value: `${wh.blockReasonCode ? `[${wh.blockReasonCode}] ` : ''}${wh.blockReason}`,
              span: 2 as const,
            }]
          : []),
        ...(wh.inactiveReason
          ? [{ label: 'Inactive Reason', value: wh.inactiveReason, span: 2 as const }]
          : []),
        {
          label: 'Activated At',
          value: wh.activatedAt ? formatDate(wh.activatedAt) : '—',
        },
        {
          label: 'Last Updated',
          value: formatDate(wh.updatedAt),
        },
        {
          label: 'Version',
          value: String(wh.version),
          mono: true,
        },
      ],
      note: blockingIssues.length > 0 ? undefined : undefined,
    },
  ];
}

// ─── Blocking issues section ──────────────────────────────────────────────────

function buildIssuesSection(details: WarehouseDetails): PreviewSection | null {
  const issues = details.setupHealth.blockingIssues ?? [];
  if (issues.length === 0) return null;
  return {
    title: `Setup Issues (${issues.length})`,
    fields: issues.slice(0, 6).map((issue) => ({
      label: issue.section ?? issue.category,
      value: (
        <span
          style={{
            color: issue.severity === 'error' ? '#DC2626' : '#D97706',
            fontSize: '12px',
          }}
        >
          {issue.message}
        </span>
      ),
      span: 2 as const,
    })),
  };
}

// ─── Status tone map ──────────────────────────────────────────────────────────

function getStatusTone(
  status: string,
): 'active' | 'draft' | 'inactive' | 'warning' {
  if (status === 'Active')   return 'active';
  if (status === 'Draft')    return 'draft';
  if (status === 'Blocked')  return 'warning';
  return 'inactive';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WarehousePreviewDrawer: React.FC<WarehousePreviewDrawerProps> = ({
  warehouseId,
  open,
  onClose,
  onBlockRequested,
  onInactivateRequested,
}) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load details when drawer opens
  useEffect(() => {
    if (!open || !warehouseId) {
      setDetails(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    warehouseMockAdapter.getWarehouse(warehouseId).then((d) => {
      if (!cancelled) {
        setDetails(d);
        setLoading(false);
      }
    }).catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load warehouse details.');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, warehouseId]);

  // Derive actions
  const actions = details
    ? deriveAvailableActions(
        details.warehouse,
        details.setupHealth,
        mockAllPermissions(),
        false, // hasOpenStock — Phase 2 mock assumption
        false, // hasActiveLocations — derived from locations in real impl
      )
    : [];

  const canBlock = actions.find((a) => a.action === 'Block')?.available === true;
  const canInactivate = actions.find((a) => a.action === 'Inactivate')?.available === true;
  const canActivate = actions.find((a) => a.action === 'Activate')?.available === true;
  const isBINLevel = details?.warehouse.inventoryControlMode === 'Location-BIN-Level';

  const sections = details
    ? [
        ...buildSections(details),
        ...(buildIssuesSection(details) ? [buildIssuesSection(details)!] : []),
      ]
    : [];

  // Derive danger action (Block takes priority over Inactivate for Active warehouses)
  const dangerAction = canBlock
    ? {
        label: 'Block',
        onClick: () => {
          if (!details) return;
          onClose();
          onBlockRequested({
            id: details.warehouse.id,
            warehouseName: details.warehouse.warehouseName,
            warehouseCode: details.warehouse.warehouseCode,
          });
        },
        tone: 'danger' as const,
      }
    : canInactivate
      ? {
          label: 'Inactivate',
          onClick: () => {
            if (!details) return;
            onClose();
            onInactivateRequested({
              id: details.warehouse.id,
              warehouseName: details.warehouse.warehouseName,
              warehouseCode: details.warehouse.warehouseCode,
            });
          },
          tone: 'danger' as const,
        }
      : undefined;

  return (
    <SmartPreviewDrawer
      open={open}
      onClose={onClose}
      title={details?.warehouse.warehouseName ?? (loading ? 'Loading…' : 'Warehouse')}
      subtitle={details ? `Code: ${details.warehouse.warehouseCode}` : undefined}
      statusLabel={details?.warehouse.status}
      statusTone={details ? getStatusTone(details.warehouse.status) : undefined}
      loading={loading}
      emptyLabel={error ?? 'No warehouse data available.'}
      summaryFields={
        details
          ? [
              { label: 'Code',         value: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{details.warehouse.warehouseCode}</span> },
              { label: 'Status',       value: <WarehouseStatusBadge status={details.warehouse.status} /> },
              { label: 'Mode',         value: <WarehouseModeBadge mode={details.warehouse.inventoryControlMode} size="sm" /> },
              { label: 'Setup Health', value: <WarehouseSetupHealth tone={details.setupHealth.overallTone} blockingCount={(details.setupHealth.blockingIssues ?? []).length} /> },
            ]
          : []
      }
      sections={sections}
      primaryAction={{
        label: 'Open Setup',
        onClick: () => {
          if (!details) return;
          navigate(WAREHOUSE_ROUTES.setup(details.warehouse.id));
          onClose();
        },
      }}
      secondaryActions={[
        ...(isBINLevel && details
          ? [{
              label: 'Manage Hierarchy',
              onClick: () => {
                navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id));
                onClose();
              },
            }]
          : []),
        ...(canActivate && details
          ? [{
              label: 'Activate',
              onClick: () => {
                // Activation flow handled in WarehouseListPage
                onClose();
              },
            }]
          : []),
        ...(details
          ? [{
              label: 'View Audit',
              onClick: () => {
                navigate(WAREHOUSE_ROUTES.audit(details.warehouse.id));
                onClose();
              },
            }]
          : []),
      ]}
      dangerAction={dangerAction}
    />
  );
};
