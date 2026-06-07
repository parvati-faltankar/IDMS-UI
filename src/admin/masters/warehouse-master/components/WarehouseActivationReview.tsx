// ─── WarehouseActivationReview ────────────────────────────────────────────────
//
// A full-page activation review panel rendered as step 6 inside
// WarehouseCreateWorkspace.  Shows a summary of the warehouse being activated,
// a structured checklist of all activation preconditions, and the final
// Activate / Save Draft action row.
//
// Uses SmartReviewDrawer-compatible checklist data shape so the same checks
// can drive both this inline panel and the SmartReviewDrawer confirmation.

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { InventoryControlMode, WarehouseOwnershipScope, WarehouseType } from '../types/warehouse.enums';

// ─── Public shapes ───────────────────────────────────────────────────────────

export interface ActivationCheckItem {
  id: string;
  /** Category label to group items */
  category: string;
  /** Short human-readable check label */
  label: string;
  /** true = passed / false = failed / null = not evaluated */
  passed: boolean | null;
  /** Optional explanation */
  detail?: string;
  /** When failed, links to which step the user should fix */
  fixStep?: number;
}

export interface ActivationSummaryField {
  label: string;
  value: React.ReactNode;
}

export interface WarehouseActivationReviewProps {
  /** Form summary fields shown at the top */
  summaryFields: ActivationSummaryField[];
  /** All activation checks */
  checks: ActivationCheckItem[];
  /** Whether all blocking checks pass */
  canActivate: boolean;
  /** Is the activation in progress (spinner state) */
  activating: boolean;
  /** Called when user clicks "Activate Now" */
  onActivate: () => void;
  /** Called when user clicks "Save Draft" */
  onSaveDraft: () => void;
  /** Called when user clicks a step link from a failed check */
  onJumpToStep: (step: number) => void;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const CATEGORIES_ORDER = [
  'Identity',
  'Ownership',
  'Inventory Model',
  'Structure',
  'Operational Defaults',
  'Permissions',
];

function CheckRow({
  item,
  onJumpToStep,
}: {
  item: ActivationCheckItem;
  onJumpToStep: (step: number) => void;
}) {
  const failed = item.passed === false;
  const pending = item.passed === null;
  const passed = item.passed === true;

  return (
    <div
      data-testid={`check-row-${item.id}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Status icon */}
      <div style={{ flexShrink: 0, marginTop: '1px' }}>
        {passed && <CheckCircle2 size={16} style={{ color: '#16A34A' }} />}
        {failed && <XCircle size={16} style={{ color: '#DC2626' }} />}
        {pending && <AlertTriangle size={16} style={{ color: '#D97706' }} />}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: failed ? '#DC2626' : 'var(--color-text)',
            lineHeight: 1.35,
          }}
        >
          {item.label}
        </div>
        {item.detail && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginTop: '3px',
              lineHeight: 1.4,
            }}
          >
            {item.detail}
          </div>
        )}
      </div>

      {/* Fix link */}
      {failed && item.fixStep !== undefined && (
        <button
          type="button"
          onClick={() => onJumpToStep(item.fixStep!)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            background: 'transparent',
            border: '1px solid var(--color-primary)',
            borderRadius: '6px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Fix <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WarehouseActivationReview({
  summaryFields,
  checks,
  canActivate,
  activating,
  onActivate,
  onSaveDraft,
  onJumpToStep,
}: WarehouseActivationReviewProps) {
  // Group by category in defined order
  const grouped = CATEGORIES_ORDER.map((cat) => ({
    category: cat,
    items: checks.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  // Append any uncategorised groups
  const knownCats = new Set(CATEGORIES_ORDER);
  const extra = checks.filter((c) => !knownCats.has(c.category));
  if (extra.length > 0) {
    grouped.push({ category: 'Other', items: extra });
  }

  const failedCount = checks.filter((c) => c.passed === false).length;
  const pendingCount = checks.filter((c) => c.passed === null).length;
  const passedCount = checks.filter((c) => c.passed === true).length;

  return (
    <div data-testid="warehouse-activation-review" style={{ maxWidth: '720px' }}>

      {/* ── Summary fields ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        {summaryFields.map((f, i) => (
          <div
            key={i}
            style={{
              padding: '10px 16px',
              background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
              borderBottom: i < summaryFields.length - 2 ? '1px solid var(--color-border)' : 'none',
              borderRight: i % 2 === 0 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text-muted)',
                marginBottom: '3px',
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Status bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 16px',
          background: canActivate ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${canActivate ? '#BBF7D0' : '#FECACA'}`,
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        {canActivate ? (
          <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
        ) : (
          <XCircle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: canActivate ? '#14532D' : '#991B1B' }}>
            {canActivate
              ? 'All checks passed — ready to activate'
              : `${failedCount} check${failedCount !== 1 ? 's' : ''} must be resolved before activation`}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: canActivate ? '#166534' : '#B91C1C' }}>
            {passedCount} passed · {failedCount} failed · {pendingCount} pending
          </p>
        </div>
        {!canActivate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Info size={13} style={{ color: '#DC2626' }} />
            <span style={{ fontSize: '11px', color: '#B91C1C' }}>Use "Fix" links below</span>
          </div>
        )}
      </div>

      {/* ── Grouped checklist ── */}
      {grouped.map((grp) => (
        <div key={grp.category} style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
              paddingBottom: '5px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {grp.category}
          </div>
          {grp.items.map((item) => (
            <CheckRow key={item.id} item={item} onJumpToStep={onJumpToStep} />
          ))}
        </div>
      ))}

      {/* ── Consequence note ── */}
      {canActivate && (
        <div
          style={{
            padding: '10px 14px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#1E40AF',
            marginBottom: '20px',
          }}
        >
          <Info size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Once activated, Warehouse Code and Inventory Control Mode are permanently locked.
          Status transitions (Block, Inactivate) will require a reason code.
        </div>
      )}

      {/* ── Action row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={onActivate}
          disabled={!canActivate || activating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: canActivate && !activating ? 'pointer' : 'not-allowed',
            background: canActivate ? 'var(--color-primary)' : 'var(--color-border)',
            color: canActivate ? 'white' : 'var(--color-text-muted)',
            transition: 'background 0.15s',
          }}
        >
          {activating ? 'Activating…' : 'Activate Warehouse'}
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={activating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text)',
            cursor: activating ? 'not-allowed' : 'pointer',
          }}
        >
          Save Draft
        </button>

        {!canActivate && failedCount > 0 && (
          <p style={{ margin: 0, fontSize: '12px', color: '#DC2626' }}>
            Resolve {failedCount} issue{failedCount !== 1 ? 's' : ''} to enable activation.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Helper: build activation checks from form state ─────────────────────────
//
// Exported so tests can call it without rendering the component.

export interface ActivationCheckInput {
  warehouseName: string;
  warehouseCode: string;
  warehouseType: WarehouseType | '';
  ownershipScope: WarehouseOwnershipScope | '';
  owningOrgCode: string;
  owningBranchCode: string;
  timezone: string;
  inventoryControlMode: InventoryControlMode | '';
  hasActiveTemplate: boolean;
  hasActiveInventoryLocation: boolean;
  codeIsUnique: boolean;
  hasPermission: boolean;
}

export function buildActivationChecks(input: ActivationCheckInput): ActivationCheckItem[] {
  const isBinLevel = input.inventoryControlMode === 'Location-BIN-Level';

  return [
    // ── Identity ──
    {
      id: 'identity-name',
      category: 'Identity',
      label: 'Warehouse Name is provided',
      passed: input.warehouseName.trim().length > 0 ? true : false,
      detail: input.warehouseName.trim() ? undefined : 'Warehouse Name is required.',
      fixStep: 0,
    },
    {
      id: 'identity-code',
      category: 'Identity',
      label: 'Warehouse Code is set and unique',
      passed: input.warehouseCode.trim().length > 0 && input.codeIsUnique,
      detail: !input.warehouseCode.trim()
        ? 'Warehouse Code is required.'
        : !input.codeIsUnique
          ? 'This code is already in use by another warehouse.'
          : undefined,
      fixStep: 0,
    },
    {
      id: 'identity-type',
      category: 'Identity',
      label: 'Warehouse Type is selected',
      passed: input.warehouseType !== '',
      detail: input.warehouseType === '' ? 'Please select a Warehouse Type.' : undefined,
      fixStep: 0,
    },
    {
      id: 'identity-timezone',
      category: 'Identity',
      label: 'Operational Time Zone is specified',
      passed: input.timezone.trim().length > 0,
      detail: !input.timezone.trim() ? 'Time Zone is required for operational scheduling.' : undefined,
      fixStep: 0,
    },
    // ── Ownership ──
    {
      id: 'ownership-scope',
      category: 'Ownership',
      label: 'Ownership Scope is selected',
      passed: input.ownershipScope !== '',
      detail: input.ownershipScope === '' ? 'Select Organization or Branch scope.' : undefined,
      fixStep: 1,
    },
    {
      id: 'ownership-entity',
      category: 'Ownership',
      label: 'Owning entity is specified',
      passed:
        input.ownershipScope === 'Organization'
          ? input.owningOrgCode.trim().length > 0
          : input.ownershipScope === 'Branch'
            ? input.owningBranchCode.trim().length > 0
            : false,
      detail:
        input.ownershipScope === 'Organization' && !input.owningOrgCode.trim()
          ? 'Owning Organization is required for Organization scope.'
          : input.ownershipScope === 'Branch' && !input.owningBranchCode.trim()
            ? 'Owning Branch is required for Branch scope.'
            : input.ownershipScope === ''
              ? 'Select Ownership Scope first.'
              : undefined,
      fixStep: 1,
    },
    // ── Inventory Model ──
    {
      id: 'model-selected',
      category: 'Inventory Model',
      label: 'Inventory Control Mode is chosen',
      passed: input.inventoryControlMode !== '',
      detail: input.inventoryControlMode === '' ? 'Select Warehouse-Level or Location/BIN-Level.' : undefined,
      fixStep: 2,
    },
    // ── Structure ──
    {
      id: 'structure-template',
      category: 'Structure',
      label: isBinLevel
        ? 'Active hierarchy template exists'
        : 'No hierarchy template required (Warehouse-Level)',
      passed: isBinLevel ? input.hasActiveTemplate : true,
      detail: isBinLevel && !input.hasActiveTemplate
        ? 'Location/BIN-Level warehouses require an active hierarchy template before activation.'
        : undefined,
      fixStep: isBinLevel ? 3 : undefined,
    },
    {
      id: 'structure-location',
      category: 'Structure',
      label: isBinLevel
        ? 'At least one active, inventory-allowed location exists'
        : 'No locations required (Warehouse-Level)',
      passed: isBinLevel ? input.hasActiveInventoryLocation : true,
      detail: isBinLevel && !input.hasActiveInventoryLocation
        ? 'At least one active location with inventory allowed must exist.'
        : undefined,
      fixStep: isBinLevel ? 3 : undefined,
    },
    // ── Permissions ──
    {
      id: 'permission-activate',
      category: 'Permissions',
      label: 'User has permission to activate warehouses',
      passed: input.hasPermission,
      detail: !input.hasPermission ? 'warehouse.activate permission is required.' : undefined,
    },
  ];
}
