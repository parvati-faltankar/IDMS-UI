// ─── WarehouseCreateWorkspace ─────────────────────────────────────────────────
//
// 6-step guided workspace for creating a new warehouse.
//
// Pattern: Compact Form Workspace — fixed header + step indicator,
// scrollable body, fixed footer. Does NOT wrap AdminPageShell.
//
// Steps:
//   0 — Identity
//   1 — Ownership & Scope
//   2 — Inventory Model
//   3 — Structure
//   4 — Operational Defaults
//   5 — Review & Activate
//
// Named exports (for testing):
//   generateWarehouseCode(name)
//   buildActivationChecksFromState(state)   — re-exported from WarehouseActivationReview
//   validateStep(step, state)               — per-step field validation
//   applyPreset(preset, state)              — preview-only preset merge

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Warehouse, AlertTriangle } from 'lucide-react';
import { findMasterByKey, findGroupForMasterKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { deriveBinManaged, deriveInventoryControlRules } from '../utils/warehouseDerivations';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import type {
  InventoryControlMode,
  WarehouseOwnershipScope,
  WarehouseType,
  PutawayStrategy,
  PickingStrategy,
  ReservationLevel,
  AllocationLevel,
  CycleCountFrequency,
} from '../types/warehouse.enums';
import type { CreateWarehouseInput } from '../types/warehouse.dto';
import { DerivedValueDisplay } from '../components/DerivedValueDisplay';
import { ConfigurationImpactBanner } from '../components/ConfigurationImpactBanner';
import {
  WarehouseActivationReview,
  buildActivationChecks,
} from '../components/WarehouseActivationReview';
import type { ActivationCheckInput } from '../components/WarehouseActivationReview';

export { buildActivationChecks as buildActivationChecksFromState };

// ─── Constants ───────────────────────────────────────────────────────────────

const MASTER_KEY = 'warehouse-master';

const STEPS = [
  { index: 0, label: 'Identity' },
  { index: 1, label: 'Ownership & Scope' },
  { index: 2, label: 'Inventory Model' },
  { index: 3, label: 'Structure' },
  { index: 4, label: 'Operational Defaults' },
  { index: 5, label: 'Review & Activate' },
];

export const WAREHOUSE_TYPES: WarehouseType[] = [
  'Physical', 'Virtual', 'Transit', 'Consignment', 'Bonded', 'Cold-Chain', 'Hazardous',
];

export const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Australia/Sydney',
  'UTC',
];

export const MOCK_ORG_CODES = ['ORG-001', 'ORG-002', 'ORG-003'];
export const MOCK_BRANCH_CODES = ['BR-HYD', 'BR-PUNE', 'BR-CHN', 'BR-DEL', 'BR-MUM'];
export const MOCK_COMPANY_CODES = ['EXCL-001', 'EXCL-002'];
export const MOCK_BU_CODES = ['BU-SALES', 'BU-MFG', 'BU-DIST'];
export const MOCK_LEGAL_ENTITIES = ['LE-INDIA-001', 'LE-INDIA-002'];
export const MOCK_INV_OWNER_CODES = ['OWN-001', 'OWN-002', 'OWN-003'];

const PUTAWAY_STRATEGIES: PutawayStrategy[] = [
  'FIFO', 'LIFO', 'FEFO', 'Nearest-Empty', 'Fixed-BIN', 'Random', 'Zone-Directed', 'Capacity-Optimised',
];
const PICKING_STRATEGIES: PickingStrategy[] = [
  'FIFO', 'FEFO', 'LIFO', 'LEFO', 'Zone-Wave', 'Batch', 'Single-Order', 'Cluster',
];
const RESERVATION_LEVELS: ReservationLevel[] = ['Warehouse', 'Location', 'BIN'];
const ALLOCATION_LEVELS: AllocationLevel[] = ['Warehouse', 'Location', 'BIN'];
const CYCLE_FREQUENCIES: CycleCountFrequency[] = [
  'Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Annually',
];

const HIERARCHY_OPTIONS = [
  {
    key: 'recommended',
    label: 'Start from recommended template',
    description: 'Zone → Aisle → Rack → Shelf → BIN (5 levels). Suitable for most distribution centres.',
  },
  {
    key: 'copy',
    label: 'Copy from existing warehouse',
    description: 'Inherit the hierarchy structure of a warehouse already in the system.',
  },
  {
    key: 'custom',
    label: 'Build custom hierarchy',
    description: 'Define your own levels from scratch in the hierarchy editor after saving.',
  },
  {
    key: 'later',
    label: 'Configure later — stay as Draft',
    description: 'Skip hierarchy now. Warehouse will remain in Draft until a template is activated.',
  },
] as const;

type HierarchyChoice = (typeof HIERARCHY_OPTIONS)[number]['key'];

export type OperationalPreset =
  | 'simple'
  | 'standard-distribution'
  | 'service-spares'
  | 'returns-qc'
  | 'cold-storage'
  | 'hazard-controlled';

// ─── Form state ───────────────────────────────────────────────────────────────

export interface CreateFormState {
  // Step 0 — Identity
  warehouseName: string;
  warehouseCode: string;
  codeManuallyEdited: boolean;
  description: string;
  warehouseType: WarehouseType | '';
  facilityReference: string;
  timezone: string;

  // Step 1 — Ownership & Scope
  ownershipScope: WarehouseOwnershipScope | '';
  owningOrgCode: string;
  owningBranchCode: string;
  companyCode: string;
  businessUnit: string;
  legalEntityCode: string;
  inventoryOwnerCode: string;
  sharedWithAllBranches: boolean;
  sharedBranchCodes: string[];

  // Step 2 — Inventory Model
  inventoryControlMode: InventoryControlMode | '';

  // Step 3 — Structure
  hierarchyChoice: HierarchyChoice | '';
  copyFromWarehouseId: string;

  // Step 4 — Operational Defaults
  autoPutawayEnabled: boolean;
  putawayStrategy: PutawayStrategy;
  putawayStrategySequence: PutawayStrategy[];
  autoPickingEnabled: boolean;
  pickingStrategy: PickingStrategy;
  pickingStrategySequence: PickingStrategy[];
  reservationLevel: ReservationLevel;
  allocationLevel: AllocationLevel;
  cycleCountEnabled: boolean;
  cycleCountFrequency: CycleCountFrequency;
  cycleCountVarianceTolerance: string;
  capacityTrackingEnabled: boolean;
  ownerMixingAllowed: boolean;
  mixedItemAllowed: boolean;
  mixedLotAllowed: boolean;
  hazardControlled: boolean;
  temperatureControlled: boolean;
  wmsEnabled: boolean;
}

const EMPTY_STATE: CreateFormState = {
  warehouseName: '',
  warehouseCode: '',
  codeManuallyEdited: false,
  description: '',
  warehouseType: '',
  facilityReference: '',
  timezone: '',

  ownershipScope: '',
  owningOrgCode: '',
  owningBranchCode: '',
  companyCode: '',
  businessUnit: '',
  legalEntityCode: '',
  inventoryOwnerCode: '',
  sharedWithAllBranches: false,
  sharedBranchCodes: [],

  inventoryControlMode: '',

  hierarchyChoice: '',
  copyFromWarehouseId: '',

  autoPutawayEnabled: false,
  putawayStrategy: 'FIFO',
  putawayStrategySequence: [],
  autoPickingEnabled: false,
  pickingStrategy: 'FIFO',
  pickingStrategySequence: [],
  reservationLevel: 'Warehouse',
  allocationLevel: 'Warehouse',
  cycleCountEnabled: false,
  cycleCountFrequency: 'Quarterly',
  cycleCountVarianceTolerance: '2',
  capacityTrackingEnabled: false,
  ownerMixingAllowed: true,
  mixedItemAllowed: true,
  mixedLotAllowed: true,
  hazardControlled: false,
  temperatureControlled: false,
  wmsEnabled: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a code suggestion from a warehouse name.
 *  Exported for testing. */
export function generateWarehouseCode(name: string): string {
  if (!name.trim()) return '';
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length === 1) {
    return words[0].replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }
  const initials = words
    .map((w) => w.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean)
    .map((w) => w[0])
    .join('');
  return initials.slice(0, 6);
}

/** Per-step field validation. Returns a map of fieldKey → error message. */
export function validateStep(
  step: number,
  state: CreateFormState,
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 0) {
    if (!state.warehouseName.trim()) errs.warehouseName = 'Warehouse Name is required.';
    if (!state.warehouseCode.trim()) errs.warehouseCode = 'Warehouse Code is required.';
    if (!state.warehouseType) errs.warehouseType = 'Warehouse Type is required.';
    if (!state.timezone) errs.timezone = 'Operational Time Zone is required.';
  }
  if (step === 1) {
    if (!state.ownershipScope) errs.ownershipScope = 'Ownership Scope is required.';
    if (state.ownershipScope === 'Organization' && !state.owningOrgCode)
      errs.owningOrgCode = 'Owning Organization is required.';
    if (state.ownershipScope === 'Branch' && !state.owningBranchCode)
      errs.owningBranchCode = 'Owning Branch is required.';
  }
  if (step === 2) {
    if (!state.inventoryControlMode) errs.inventoryControlMode = 'Inventory Control Mode is required.';
  }
  return errs;
}

/** Apply an operational preset and return the merged state delta.
 *  Does not mutate input. Exported for testing. */
export function applyPreset(
  preset: OperationalPreset,
  state: CreateFormState,
): Partial<CreateFormState> {
  const deltas: Record<OperationalPreset, Partial<CreateFormState>> = {
    simple: {
      autoPutawayEnabled: false,
      autoPickingEnabled: false,
      reservationLevel: 'Warehouse',
      allocationLevel: 'Warehouse',
      cycleCountEnabled: false,
      capacityTrackingEnabled: false,
      ownerMixingAllowed: true,
      mixedItemAllowed: true,
      mixedLotAllowed: true,
      hazardControlled: false,
      temperatureControlled: false,
      wmsEnabled: false,
    },
    'standard-distribution': {
      autoPutawayEnabled: true,
      putawayStrategy: 'FEFO',
      autoPickingEnabled: true,
      pickingStrategy: 'FEFO',
      reservationLevel: 'Location',
      allocationLevel: 'Location',
      cycleCountEnabled: true,
      cycleCountFrequency: 'Quarterly',
      capacityTrackingEnabled: true,
      ownerMixingAllowed: false,
      mixedItemAllowed: true,
      mixedLotAllowed: false,
      hazardControlled: false,
      temperatureControlled: false,
      wmsEnabled: true,
    },
    'service-spares': {
      autoPutawayEnabled: false,
      autoPickingEnabled: true,
      pickingStrategy: 'FIFO',
      reservationLevel: 'BIN',
      allocationLevel: 'BIN',
      cycleCountEnabled: true,
      cycleCountFrequency: 'Monthly',
      capacityTrackingEnabled: false,
      ownerMixingAllowed: false,
      mixedItemAllowed: false,
      mixedLotAllowed: false,
      hazardControlled: false,
      temperatureControlled: false,
      wmsEnabled: false,
    },
    'returns-qc': {
      autoPutawayEnabled: true,
      putawayStrategy: 'FIFO',
      autoPickingEnabled: false,
      reservationLevel: 'Location',
      allocationLevel: 'Location',
      cycleCountEnabled: true,
      cycleCountFrequency: 'Weekly',
      capacityTrackingEnabled: false,
      ownerMixingAllowed: false,
      mixedItemAllowed: true,
      mixedLotAllowed: false,
      hazardControlled: false,
      temperatureControlled: false,
      wmsEnabled: false,
    },
    'cold-storage': {
      autoPutawayEnabled: true,
      putawayStrategy: 'FEFO',
      autoPickingEnabled: true,
      pickingStrategy: 'FEFO',
      reservationLevel: 'BIN',
      allocationLevel: 'BIN',
      cycleCountEnabled: true,
      cycleCountFrequency: 'Daily',
      capacityTrackingEnabled: true,
      ownerMixingAllowed: false,
      mixedItemAllowed: false,
      mixedLotAllowed: false,
      hazardControlled: false,
      temperatureControlled: true,
      wmsEnabled: true,
    },
    'hazard-controlled': {
      autoPutawayEnabled: true,
      putawayStrategy: 'Zone-Directed',
      autoPickingEnabled: true,
      pickingStrategy: 'Zone-Wave',
      reservationLevel: 'BIN',
      allocationLevel: 'BIN',
      cycleCountEnabled: true,
      cycleCountFrequency: 'Monthly',
      capacityTrackingEnabled: true,
      ownerMixingAllowed: false,
      mixedItemAllowed: false,
      mixedLotAllowed: false,
      hazardControlled: true,
      temperatureControlled: false,
      wmsEnabled: true,
    },
  };
  return deltas[preset];
}

// ─── CSS helpers ─────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
};
const inputErr: React.CSSProperties = { ...inputBase, border: '1px solid #FCA5A5' };
const inputRO: React.CSSProperties = {
  ...inputBase,
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};
const labelBase: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text)',
  display: 'block',
  marginBottom: '6px',
};
const errTxt: React.CSSProperties = { fontSize: '11px', color: '#DC2626', marginTop: '4px' };
const hintTxt: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' };
const sCard: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  overflow: 'hidden',
  marginBottom: '20px',
};
const sHead: React.CSSProperties = {
  padding: '12px 20px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const sBody: React.CSSProperties = { padding: '20px 24px', background: 'var(--color-surface)' };
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const fw: React.CSSProperties = { marginBottom: '14px' };
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '9px 20px', fontSize: '13px', fontWeight: 600,
  borderRadius: '8px', border: 'none', cursor: 'pointer',
  background: 'var(--color-primary)', color: 'white',
};
const btnOutline: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', fontSize: '13px', fontWeight: 500,
  borderRadius: '8px', border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '9px 16px', fontSize: '13px', fontWeight: 500,
  borderRadius: '8px', border: 'none',
  background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer',
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  active,
  completed,
  onClick,
}: {
  steps: typeof STEPS;
  active: number;
  completed: Set<number>;
  onClick: (i: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        overflowX: 'auto',
        padding: '0 4px',
      }}
    >
      {steps.map((step, idx) => {
        const isActive = step.index === active;
        const isDone = completed.has(step.index);
        const isPast = step.index < active;
        const canClick = isDone || isPast || step.index <= active;

        return (
          <React.Fragment key={step.index}>
            <button
              type="button"
              onClick={() => canClick && onClick(step.index)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))'
                  : 'transparent',
                cursor: canClick ? 'pointer' : 'default',
                flexShrink: 0,
              }}
            >
              {/* Number / check bubble */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: isDone
                    ? '#16A34A'
                    : isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                  color: isDone || isActive ? 'white' : 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircle2 size={13} style={{ color: 'white' }} /> : step.index + 1}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? 'var(--color-primary)'
                    : isDone
                      ? '#16A34A'
                      : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <span
                style={{
                  width: '20px',
                  height: '1px',
                  background: isDone ? '#16A34A' : 'var(--color-border)',
                  flexShrink: 0,
                  margin: '0 2px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── WarehouseCreateWorkspace ─────────────────────────────────────────────────

const WarehouseCreateWorkspace: React.FC = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [state, setState] = useState<CreateFormState>({ ...EMPTY_STATE });
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [codeIsUnique, setCodeIsUnique] = useState(true);
  const [codeCheckPending, setCodeCheckPending] = useState(false);
  const [previousMode, setPreviousMode] = useState<InventoryControlMode | ''>('');
  const [showModeWarning, setShowModeWarning] = useState(false);
  const [presetPreview, setPresetPreview] = useState<{
    preset: OperationalPreset;
    delta: Partial<CreateFormState>;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const codeCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Dirty-state navigation blocker ─────────────────────────────────────────
  // useBlocker requires a data router (createBrowserRouter / createHashRouter).
  // The app uses <HashRouter> so we use beforeunload + a local confirm modal instead.
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function navigateSafe(path: string) {
    if (isDirty) {
      setPendingNavPath(path);
      setShowLeaveModal(true);
    } else {
      navigate(path);
    }
  }

  // ── Record recent master on mount ──────────────────────────────────────────
  useEffect(() => {
    const master = findMasterByKey(MASTER_KEY);
    const group = findGroupForMasterKey(MASTER_KEY);
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
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showToast(message: string, tone: 'success' | 'error') {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  }

  function setField<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined as unknown as string }));
    setIsDirty(true);
  }

  // ── Code generation from name ──────────────────────────────────────────────
  useEffect(() => {
    if (!state.codeManuallyEdited) {
      const generated = generateWarehouseCode(state.warehouseName);
      setState((s) => ({ ...s, warehouseCode: generated }));
    }
  }, [state.warehouseName, state.codeManuallyEdited]);

  // ── Async code uniqueness check ────────────────────────────────────────────
  useEffect(() => {
    if (!state.warehouseCode.trim()) {
      setCodeIsUnique(true);
      return;
    }
    if (codeCheckTimer.current) clearTimeout(codeCheckTimer.current);
    setCodeCheckPending(true);
    codeCheckTimer.current = setTimeout(async () => {
      try {
        const result = await warehouseMockAdapter.listWarehouses({ search: state.warehouseCode, pageSize: 5 });
        const duplicate = result.items.some(
          (w) => w.warehouseCode.toUpperCase() === state.warehouseCode.toUpperCase(),
        );
        setCodeIsUnique(!duplicate);
      } catch {
        setCodeIsUnique(true);
      } finally {
        setCodeCheckPending(false);
      }
    }, 400);
    return () => {
      if (codeCheckTimer.current) clearTimeout(codeCheckTimer.current);
    };
  }, [state.warehouseCode]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const binManaged =
    state.inventoryControlMode === 'Location-BIN-Level'
      ? true
      : state.inventoryControlMode === 'Warehouse-Level'
        ? false
        : null;

  const isBinLevel = state.inventoryControlMode === 'Location-BIN-Level';
  const isWhLevel = state.inventoryControlMode === 'Warehouse-Level';

  // ── Step validation and advance ────────────────────────────────────────────
  function advanceStep() {
    const errs = validateStep(step, state);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Please fix the highlighted fields before continuing.', 'error');
      return;
    }
    setCompletedSteps((prev) => new Set(prev).add(step));
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function jumpToStep(target: number) {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Build input ─────────────────────────────────────────────────────────────
  function buildInput(): CreateWarehouseInput {
    const mode = state.inventoryControlMode as InventoryControlMode;
    const autoPutaway = mode === 'Location-BIN-Level'
      ? {
          enabled: state.autoPutawayEnabled,
          strategy: state.putawayStrategy,
          strategySequence: state.putawayStrategySequence,
          overrideAllowed: false,
        }
      : { enabled: false, strategy: 'FIFO' as PutawayStrategy, strategySequence: [], overrideAllowed: false };
    const autoPicking = mode === 'Location-BIN-Level'
      ? {
          enabled: state.autoPickingEnabled,
          strategy: state.pickingStrategy,
          strategySequence: state.pickingStrategySequence,
          overrideAllowed: false,
        }
      : { enabled: false, strategy: 'FIFO' as PickingStrategy, strategySequence: [], overrideAllowed: false };

    return {
      warehouseCode: state.warehouseCode.trim().toUpperCase(),
      warehouseName: state.warehouseName.trim(),
      description: state.description.trim() || undefined,
      ownershipScope: (state.ownershipScope || 'Organization') as WarehouseOwnershipScope,
      owningOrgCode: state.ownershipScope === 'Organization' ? state.owningOrgCode : undefined,
      owningBranchCode: state.ownershipScope === 'Branch' ? state.owningBranchCode : undefined,
      warehouseType: (state.warehouseType || 'Physical') as WarehouseType,
      wmsEnabled: state.wmsEnabled,
      inventoryControlMode: mode,
      operatingCalendar: state.timezone ? { timezone: state.timezone } : undefined,
      autoPutaway,
      autoPicking,
      capacityPolicy: {
        trackingEnabled: state.capacityTrackingEnabled,
        temperatureControlled: state.temperatureControlled,
        hazardousStorage: state.hazardControlled,
      },
      reservationPolicy: {
        reservationLevel: state.reservationLevel,
        eligibleLocationTypes: [],
        allowPartialReservation: true,
      },
      allocationPolicy: {
        allocationLevel: state.allocationLevel,
        eligibleLocationTypes: [],
        allowPartialAllocation: true,
      },
      cycleCountPolicy: {
        enabled: state.cycleCountEnabled,
        scope: 'Full',
        frequency: state.cycleCountFrequency,
        freezeEnabled: false,
        varianceTolerance: parseFloat(state.cycleCountVarianceTolerance) || 2,
        varianceUnit: 'Percent',
      },
    };
  }

  // ── Save Draft ─────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    const errs = validateStep(0, state);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Warehouse Name and Code are required to save a draft.', 'error');
      return;
    }
    if (!state.inventoryControlMode) {
      showToast('Select an Inventory Control Mode before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      await warehouseMockAdapter.createWarehouse(buildInput());
      setIsDirty(false);
      showToast('Warehouse saved as Draft.', 'success');
      setTimeout(() => navigate(WAREHOUSE_ROUTES.list), 800);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unexpected error saving warehouse.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Activate ───────────────────────────────────────────────────────────────
  async function handleActivate() {
    if (!canActivateNow) return;
    setActivating(true);
    try {
      const details = await warehouseMockAdapter.createWarehouse(buildInput());
      const activationResult = await warehouseMockAdapter.activateWarehouse(
        details.warehouse.id,
        { correlationId: `COR-${Date.now()}` },
      );
      if (!activationResult.success) {
        showToast(
          activationResult.issues
            .filter((i) => i.severity === 'error')
            .map((i) => i.message)
            .join('; ') || 'Activation failed.',
          'error',
        );
        return;
      }
      setIsDirty(false);
      showToast(`Warehouse "${state.warehouseName}" activated successfully.`, 'success');
      setTimeout(() => navigate(WAREHOUSE_ROUTES.list), 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during activation.';
      showToast(msg, 'error');
    } finally {
      setActivating(false);
    }
  }

  // ── Activation check input ─────────────────────────────────────────────────
  const activationCheckInput: ActivationCheckInput = {
    warehouseName: state.warehouseName,
    warehouseCode: state.warehouseCode,
    warehouseType: state.warehouseType,
    ownershipScope: state.ownershipScope,
    owningOrgCode: state.owningOrgCode,
    owningBranchCode: state.owningBranchCode,
    timezone: state.timezone,
    inventoryControlMode: state.inventoryControlMode,
    // For new warehouse creation, there are no templates or locations yet.
    // Warehouse-Level skips these checks; BIN-Level warns user (cannot be truly validated
    // until after save + hierarchy setup, so we use hierarchyChoice as a proxy).
    hasActiveTemplate:
      !isBinLevel ||
      (state.hierarchyChoice === 'recommended' || state.hierarchyChoice === 'copy'),
    hasActiveInventoryLocation: !isBinLevel || state.hierarchyChoice === 'later' ? false : !isBinLevel,
    codeIsUnique,
    hasPermission: true, // Phase 3: mock permissions always granted
  };

  const activationChecks = buildActivationChecks(activationCheckInput);
  const canActivateNow = activationChecks.every((c) => c.passed !== false);

  // ── Preset apply ───────────────────────────────────────────────────────────
  function previewPreset(preset: OperationalPreset) {
    const delta = applyPreset(preset, state);
    setPresetPreview({ preset, delta });
  }

  function confirmPreset() {
    if (!presetPreview) return;
    setState((s) => ({ ...s, ...presetPreview.delta }));
    setPresetPreview(null);
    setIsDirty(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  // ── Step 0: Identity ───────────────────────────────────────────────────────
  function renderStep0() {
    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Warehouse Identity</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Core identity fields — some values lock after activation
            </span>
          </div>
          <div style={sBody}>
            {/* Name + Code */}
            <div style={{ ...twoCol, ...fw }}>
              <div>
                <label style={labelBase}>
                  Warehouse Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={state.warehouseName}
                  onChange={(e) => setField('warehouseName', e.target.value)}
                  style={fieldErrors.warehouseName ? inputErr : inputBase}
                  placeholder="e.g. Pune Main Distribution Centre"
                />
                {fieldErrors.warehouseName && <p style={errTxt}>{fieldErrors.warehouseName}</p>}
              </div>
              <div>
                <label style={labelBase}>
                  Warehouse Code <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={state.warehouseCode}
                  onChange={(e) => {
                    setField('warehouseCode', e.target.value.toUpperCase());
                    setField('codeManuallyEdited', true);
                  }}
                  style={
                    fieldErrors.warehouseCode
                      ? inputErr
                      : !codeIsUnique
                        ? inputErr
                        : inputBase
                  }
                  placeholder="e.g. WH-PUNE"
                  maxLength={20}
                />
                {fieldErrors.warehouseCode && <p style={errTxt}>{fieldErrors.warehouseCode}</p>}
                {!fieldErrors.warehouseCode && !codeIsUnique && (
                  <p style={errTxt}>This code is already in use.</p>
                )}
                {!fieldErrors.warehouseCode && codeIsUnique && state.warehouseCode && (
                  <p style={{ ...hintTxt, color: '#16A34A' }}>
                    {codeCheckPending ? 'Checking…' : '✓ Code is available'}
                  </p>
                )}
                {!state.codeManuallyEdited && state.warehouseName && (
                  <p style={hintTxt}>
                    Auto-suggested from name.{' '}
                    <button
                      type="button"
                      onClick={() => setField('codeManuallyEdited', true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-primary)',
                        fontSize: '11px',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Edit manually
                    </button>
                  </p>
                )}
                <p style={hintTxt}>
                  ⚠ Code cannot be changed after the warehouse is activated.
                </p>
              </div>
            </div>

            {/* Description */}
            <div style={fw}>
              <label style={labelBase}>Description</label>
              <textarea
                value={state.description}
                onChange={(e) => setField('description', e.target.value)}
                style={{ ...inputBase, resize: 'vertical', minHeight: '64px' }}
                placeholder="Optional: purpose, special handling notes…"
              />
            </div>

            {/* Type + Facility */}
            <div style={{ ...twoCol, ...fw }}>
              <div>
                <label style={labelBase}>
                  Warehouse Type <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={state.warehouseType}
                  onChange={(e) => setField('warehouseType', e.target.value as WarehouseType)}
                  style={fieldErrors.warehouseType ? inputErr : inputBase}
                >
                  <option value="">Select type…</option>
                  {WAREHOUSE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {fieldErrors.warehouseType && <p style={errTxt}>{fieldErrors.warehouseType}</p>}
                {state.warehouseType === 'Cold-Chain' && (
                  <p style={{ ...hintTxt, color: '#0891B2' }}>
                    Cold-Chain type will enable temperature-control fields in Operational Defaults.
                  </p>
                )}
                {state.warehouseType === 'Hazardous' && (
                  <p style={{ ...hintTxt, color: '#D97706' }}>
                    Hazardous type will enable hazard-control fields in Operational Defaults.
                  </p>
                )}
              </div>
              <div>
                <label style={labelBase}>Physical Facility Reference</label>
                <input
                  type="text"
                  value={state.facilityReference}
                  onChange={(e) => setField('facilityReference', e.target.value)}
                  style={inputBase}
                  placeholder="e.g. FAC-PUNE-01 (optional)"
                />
                <p style={hintTxt}>
                  Link to a facility record. Leave blank if not applicable.
                </p>
              </div>
            </div>

            {/* Timezone */}
            <div style={{ maxWidth: '400px' }}>
              <label style={labelBase}>
                Operational Time Zone <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={state.timezone}
                onChange={(e) => setField('timezone', e.target.value)}
                style={fieldErrors.timezone ? inputErr : inputBase}
              >
                <option value="">Select time zone…</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              {fieldErrors.timezone && <p style={errTxt}>{fieldErrors.timezone}</p>}
              <p style={hintTxt}>
                Used for operating calendar, receiving windows, and dispatch cut-offs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Ownership & Scope ──────────────────────────────────────────────
  function renderStep1() {
    const showOrgFields = state.ownershipScope === 'Organization';
    const showBranchFields = state.ownershipScope === 'Branch';
    const showSharedControls = showOrgFields; // Only org-level can share with branches

    return (
      <div>
        {/* Scope selector */}
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Ownership Scope</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Choose scope first — it controls which fields are required
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              {(['Organization', 'Branch'] as WarehouseOwnershipScope[]).map((scope) => (
                <label
                  key={scope}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px 18px',
                    border: `2px solid ${state.ownershipScope === scope ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background:
                      state.ownershipScope === scope
                        ? 'color-mix(in srgb, var(--color-primary) 5%, white)'
                        : 'var(--color-surface)',
                    flex: 1,
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="radio"
                    name="ownershipScope"
                    checked={state.ownershipScope === scope}
                    onChange={() => setField('ownershipScope', scope)}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                      {scope} Level
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {scope === 'Organization'
                        ? 'Warehouse is owned by the organisation and can be shared across branches.'
                        : 'Warehouse is owned by a specific branch. Branch-to-branch sharing is not applicable.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.ownershipScope && <p style={errTxt}>{fieldErrors.ownershipScope}</p>}

            {state.ownershipScope && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#1E40AF',
                  marginTop: '12px',
                }}
              >
                ℹ Branch access controls who can <em>use</em> this warehouse for transactions.
                It does not transfer stock ownership. Inventory Owner is a separate field below.
              </div>
            )}
          </div>
        </div>

        {/* Owning entity */}
        {state.ownershipScope && (
          <div style={sCard}>
            <div style={sHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Owning Entity</span>
            </div>
            <div style={sBody}>
              <div style={{ ...twoCol, ...fw }}>
                {showOrgFields && (
                  <div>
                    <label style={labelBase}>
                      Owning Organization <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={state.owningOrgCode}
                      onChange={(e) => setField('owningOrgCode', e.target.value)}
                      style={fieldErrors.owningOrgCode ? inputErr : inputBase}
                    >
                      <option value="">Select organization…</option>
                      {MOCK_ORG_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {fieldErrors.owningOrgCode && (
                      <p style={errTxt}>{fieldErrors.owningOrgCode}</p>
                    )}
                  </div>
                )}
                {showBranchFields && (
                  <div>
                    <label style={labelBase}>
                      Owning Branch <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={state.owningBranchCode}
                      onChange={(e) => setField('owningBranchCode', e.target.value)}
                      style={fieldErrors.owningBranchCode ? inputErr : inputBase}
                    >
                      <option value="">Select branch…</option>
                      {MOCK_BRANCH_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {fieldErrors.owningBranchCode && (
                      <p style={errTxt}>{fieldErrors.owningBranchCode}</p>
                    )}
                  </div>
                )}
                <div>
                  <label style={labelBase}>Company</label>
                  <select
                    value={state.companyCode}
                    onChange={(e) => setField('companyCode', e.target.value)}
                    style={inputBase}
                  >
                    <option value="">Select company…</option>
                    {MOCK_COMPANY_CODES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={twoCol}>
                <div>
                  <label style={labelBase}>Business Unit</label>
                  <select
                    value={state.businessUnit}
                    onChange={(e) => setField('businessUnit', e.target.value)}
                    style={inputBase}
                  >
                    <option value="">Select BU…</option>
                    {MOCK_BU_CODES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Legal Entity</label>
                  <select
                    value={state.legalEntityCode}
                    onChange={(e) => setField('legalEntityCode', e.target.value)}
                    style={inputBase}
                  >
                    <option value="">Select legal entity…</option>
                    {MOCK_LEGAL_ENTITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory owner + sharing */}
        {state.ownershipScope && (
          <div style={sCard}>
            <div style={sHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Inventory Owner & Access</span>
            </div>
            <div style={sBody}>
              <div style={{ ...fw, maxWidth: '360px' }}>
                <label style={labelBase}>Inventory Owner</label>
                <select
                  value={state.inventoryOwnerCode}
                  onChange={(e) => setField('inventoryOwnerCode', e.target.value)}
                  style={inputBase}
                >
                  <option value="">Select owner…</option>
                  {MOCK_INV_OWNER_CODES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p style={hintTxt}>
                  The entity that legally owns the stock. Different from the branch that
                  uses the warehouse.
                </p>
              </div>

              {showSharedControls && (
                <div style={fw}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 16px',
                      border: `1.5px solid ${state.sharedWithAllBranches ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      maxWidth: '440px',
                      background: state.sharedWithAllBranches
                        ? 'color-mix(in srgb, var(--color-primary) 5%, white)'
                        : 'var(--color-surface)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.sharedWithAllBranches}
                      onChange={(e) => setField('sharedWithAllBranches', e.target.checked)}
                      style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>
                        Share with all branches
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        All branches can use this warehouse for stock transactions.
                        Individual branch assignments can be managed after creation.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Inventory Model ────────────────────────────────────────────────
  function renderStep2() {
    const modes: { value: InventoryControlMode; label: string; description: string; recommended?: boolean }[] = [
      {
        value: 'Warehouse-Level',
        label: 'Warehouse-Level Inventory',
        description:
          'Stock is tracked at the warehouse level only. No location or BIN is required for receipts and issues. Suitable for simple warehouses with single-zone operations.',
      },
      {
        value: 'Location-BIN-Level',
        label: 'Location / BIN-Level Inventory',
        description:
          'Stock is tracked at individual location or BIN. Requires a hierarchy template and active locations. Enables Auto Putaway, Auto Picking, and BIN-to-BIN transfers.',
        recommended: true,
      },
    ];

    function handleModeSelect(mode: InventoryControlMode) {
      if (state.inventoryControlMode && state.inventoryControlMode !== mode) {
        // Show impact warning before changing an already-selected mode
        setPreviousMode(state.inventoryControlMode);
        setShowModeWarning(true);
        // Stage the new mode in a temp variable via ref — we apply on confirm
        setState((s) => ({ ...s, _pendingMode: mode } as typeof s));
      } else {
        setField('inventoryControlMode', mode);
      }
    }

    return (
      <div>
        {showModeWarning && (
          <ConfigurationImpactBanner
            tone="warning"
            title="Changing Inventory Control Mode"
            description="You are about to change the inventory model. This affects multiple downstream behaviours."
            impacts={[
              {
                text: 'Hierarchy templates and locations configured for the previous mode will be invalidated.',
                reversible: false,
              },
              {
                text: 'Auto Putaway and Auto Picking availability depends on the mode selected.',
              },
              {
                text: 'BIN Managed flag is derived from this setting and cannot be overridden.',
                reversible: false,
              },
            ]}
            onDismiss={() => setShowModeWarning(false)}
          />
        )}

        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Inventory Control Mode</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              This choice permanently affects BIN management and location requirements
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {modes.map((m) => (
                <label
                  key={m.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px 20px',
                    border: `2px solid ${state.inventoryControlMode === m.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background:
                      state.inventoryControlMode === m.value
                        ? 'color-mix(in srgb, var(--color-primary) 5%, white)'
                        : 'var(--color-surface)',
                    transition: 'all 0.12s',
                    position: 'relative',
                  }}
                >
                  <input
                    type="radio"
                    name="inventoryControlMode"
                    checked={state.inventoryControlMode === m.value}
                    onChange={() => handleModeSelect(m.value)}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{m.label}</p>
                      {m.recommended && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            background: '#DCFCE7',
                            color: '#15803D',
                          }}
                        >
                          Recommended for enterprise
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.inventoryControlMode && (
              <p style={errTxt}>{fieldErrors.inventoryControlMode}</p>
            )}
          </div>
        </div>

        {/* Derived BIN Managed */}
        {binManaged !== null && (
          <div style={{ marginBottom: '16px' }}>
            <DerivedValueDisplay
              label="BIN Managed"
              value={binManaged ? 'Yes' : 'No'}
              derivedFrom={`Derived from Inventory Control Mode = "${state.inventoryControlMode}"`}
              lockReason="Cannot be set directly. Change the Inventory Control Mode to modify this value."
              testId="derived-bin-managed"
            />
          </div>
        )}

        {/* Contextual notes */}
        {isWhLevel && (
          <div
            style={{
              padding: '10px 14px',
              background: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
            }}
          >
            <strong>Warehouse-Level mode:</strong> Auto Putaway and Auto Picking are not available.
            No hierarchy template is required. Stock moves are recorded at warehouse level only.
          </div>
        )}
        {isBinLevel && (
          <div
            style={{
              padding: '10px 14px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#14532D',
            }}
          >
            <strong>Location/BIN-Level mode:</strong> You will configure a hierarchy template in
            Step 4. Auto Putaway and Auto Picking can be enabled in Step 5.
          </div>
        )}
      </div>
    );
  }

  // ── Step 3: Structure ──────────────────────────────────────────────────────
  function renderStep3() {
    if (isWhLevel) {
      return (
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Structure</span>
          </div>
          <div style={sBody}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '32px 24px',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={36} style={{ color: '#16A34A' }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                No hierarchy required
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: '460px', lineHeight: 1.6 }}>
                Warehouse-Level inventory does not require a location hierarchy or BIN structure.
                Stock is tracked at the warehouse as a whole. You can continue to the next step.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Hierarchy Setup</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Choose how to define the location structure for this warehouse
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {HIERARCHY_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px 18px',
                    border: `2px solid ${state.hierarchyChoice === opt.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background:
                      state.hierarchyChoice === opt.key
                        ? 'color-mix(in srgb, var(--color-primary) 5%, white)'
                        : 'var(--color-surface)',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="radio"
                    name="hierarchyChoice"
                    checked={state.hierarchyChoice === opt.key}
                    onChange={() => setField('hierarchyChoice', opt.key)}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{opt.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Visual preview of recommended template */}
            {state.hierarchyChoice === 'recommended' && (
              <div
                style={{
                  padding: '16px 20px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#14532D' }}>
                  Recommended Structure Preview
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px', color: '#166534' }}>
                  {['Zone', 'Aisle', 'Rack', 'Shelf', 'BIN'].map((level, i, arr) => (
                    <React.Fragment key={level}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          background: 'white',
                          border: '1px solid #BBF7D0',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        {level}
                      </span>
                      {i < arr.length - 1 && (
                        <span style={{ color: '#86EFAC', fontWeight: 700 }}>›</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#166534' }}>
                  5 levels. BIN is the leaf endpoint where inventory is tracked. A template
                  record will be created automatically and can be edited in the Hierarchy editor.
                </p>
              </div>
            )}

            {state.hierarchyChoice === 'copy' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelBase}>Copy from Warehouse</label>
                <select
                  value={state.copyFromWarehouseId}
                  onChange={(e) => setField('copyFromWarehouseId', e.target.value)}
                  style={inputBase}
                >
                  <option value="">Select a warehouse to copy from…</option>
                  <option value="WH-0002">WH-PUNE-01 — Pune Manufacturing Store</option>
                  <option value="WH-0003">WH-HYD-02 — Hyderabad Secondary</option>
                </select>
                <p style={hintTxt}>
                  The hierarchy levels will be copied. Locations and BINs are not copied.
                </p>
              </div>
            )}

            {state.hierarchyChoice === 'later' && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                <AlertTriangle size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                The warehouse will remain in <strong>Draft</strong> until an active hierarchy
                template is set up. Activation requires at least one active, inventory-allowed
                location.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Operational Defaults ──────────────────────────────────────────
  function renderStep4() {
    const PRESETS: { key: OperationalPreset; label: string; description: string }[] = [
      { key: 'simple', label: 'Simple Warehouse', description: 'No automation. Manual putaway and picking.' },
      { key: 'standard-distribution', label: 'Standard Distribution', description: 'FEFO, auto-putaway, auto-picking, location reservation.' },
      { key: 'service-spares', label: 'Service & Spares', description: 'BIN-level reservation, monthly cycle count, no mixing.' },
      { key: 'returns-qc', label: 'Returns & QC', description: 'Auto putaway, weekly count, no lot mixing.' },
      { key: 'cold-storage', label: 'Cold Storage', description: 'FEFO, BIN-level, temperature controlled, daily count.' },
      { key: 'hazard-controlled', label: 'Hazard Controlled', description: 'Zone-directed, BIN-level, monthly count, no mixing.' },
    ];

    return (
      <div>
        {/* Preset row */}
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Quick Presets</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Applying a preset previews changes — your manual values are shown before confirming
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => previewPreset(p.key)}
                  title={p.description}
                  style={{
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Preset preview modal */}
            {presetPreview && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: '10px',
                }}
              >
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#7C2D12' }}>
                  Preview: changes from preset
                </p>
                <div style={{ fontSize: '12px', color: '#9A3412', marginBottom: '10px' }}>
                  {Object.entries(presetPreview.delta).map(([key, val]) => (
                    <div key={key} style={{ padding: '3px 0', borderBottom: '1px solid #FED7AA' }}>
                      <span style={{ fontWeight: 600 }}>{key}</span>:{' '}
                      <span style={{ color: '#7C2D12' }}>
                        {String(current_value_for(key as keyof CreateFormState, state))}
                      </span>{' '}
                      →{' '}
                      <span style={{ fontWeight: 700 }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={confirmPreset} style={{ ...btnPrimary, fontSize: '12px', padding: '6px 14px' }}>
                    Apply preset
                  </button>
                  <button type="button" onClick={() => setPresetPreview(null)} style={{ ...btnGhost, fontSize: '12px', padding: '6px 14px' }}>
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Putaway / Picking */}
        {isBinLevel && (
          <div style={sCard}>
            <div style={sHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Putaway & Picking Automation</span>
            </div>
            <div style={sBody}>
              <div style={{ ...twoCol, ...fw }}>
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      border: `1.5px solid ${state.autoPutawayEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: state.autoPutawayEnabled ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                      marginBottom: '10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.autoPutawayEnabled}
                      onChange={(e) => setField('autoPutawayEnabled', e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Enable Auto Putaway</span>
                  </label>
                  {state.autoPutawayEnabled && (
                    <div>
                      <label style={labelBase}>Putaway Strategy</label>
                      <select
                        value={state.putawayStrategy}
                        onChange={(e) => setField('putawayStrategy', e.target.value as PutawayStrategy)}
                        style={inputBase}
                      >
                        {PUTAWAY_STRATEGIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      border: `1.5px solid ${state.autoPickingEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: state.autoPickingEnabled ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                      marginBottom: '10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.autoPickingEnabled}
                      onChange={(e) => setField('autoPickingEnabled', e.target.checked)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Enable Auto Picking</span>
                  </label>
                  {state.autoPickingEnabled && (
                    <div>
                      <label style={labelBase}>Picking Strategy</label>
                      <select
                        value={state.pickingStrategy}
                        onChange={(e) => setField('pickingStrategy', e.target.value as PickingStrategy)}
                        style={inputBase}
                      >
                        {PICKING_STRATEGIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isBinLevel && state.inventoryControlMode && (
          <div
            style={{
              padding: '10px 14px',
              background: '#F8FAFC',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              marginBottom: '16px',
            }}
          >
            Auto Putaway and Auto Picking are only available for Location/BIN-Level warehouses.
          </div>
        )}

        {/* Reservation / allocation */}
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Reservation & Allocation</span>
          </div>
          <div style={sBody}>
            <div style={twoCol}>
              <div>
                <label style={labelBase}>Reservation Level</label>
                <select
                  value={state.reservationLevel}
                  onChange={(e) => setField('reservationLevel', e.target.value as ReservationLevel)}
                  style={inputBase}
                >
                  {RESERVATION_LEVELS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {(state.reservationLevel === 'Location' || state.reservationLevel === 'BIN') && !isBinLevel && (
                  <p style={{ ...hintTxt, color: '#D97706' }}>
                    ⚠ Location/BIN reservation requires Location-BIN-Level inventory mode.
                  </p>
                )}
              </div>
              <div>
                <label style={labelBase}>Allocation Level</label>
                <select
                  value={state.allocationLevel}
                  onChange={(e) => setField('allocationLevel', e.target.value as AllocationLevel)}
                  style={inputBase}
                >
                  {ALLOCATION_LEVELS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mixing & storage policies */}
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Storage Policies</span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              {(
                [
                  ['ownerMixingAllowed', 'Owner Mixing Allowed', 'Multiple inventory owners can share a location'],
                  ['mixedItemAllowed', 'Mixed Item Allowed', 'Multiple item types can occupy the same BIN'],
                  ['mixedLotAllowed', 'Mixed Lot Allowed', 'Multiple lots of the same item can share a BIN'],
                  ['hazardControlled', 'Hazard Controlled', 'Separate hazmat storage rules apply'],
                  ['temperatureControlled', 'Temperature Controlled', 'Cold-chain tracking and alerts active'],
                  ['wmsEnabled', 'WMS Enabled', 'Warehouse Management System integration is active'],
                  ['capacityTrackingEnabled', 'Capacity Tracking', 'Track utilisation against defined capacity limits'],
                ] as [keyof CreateFormState, string, string][]
              ).map(([field, label, desc]) => (
                <label
                  key={field}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 14px',
                    border: `1.5px solid ${state[field] ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: state[field] ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                    minWidth: '200px',
                    flex: '0 1 calc(50% - 5px)',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={state[field] as boolean}
                    onChange={(e) => setField(field, e.target.checked as CreateFormState[typeof field])}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Cycle count */}
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Cycle Count Policy</span>
          </div>
          <div style={sBody}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                border: `1.5px solid ${state.cycleCountEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                maxWidth: '360px',
                marginBottom: '12px',
                background: state.cycleCountEnabled ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
              }}
            >
              <input
                type="checkbox"
                checked={state.cycleCountEnabled}
                onChange={(e) => setField('cycleCountEnabled', e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Enable Cycle Count</span>
            </label>

            {state.cycleCountEnabled && (
              <div style={twoCol}>
                <div>
                  <label style={labelBase}>Count Frequency</label>
                  <select
                    value={state.cycleCountFrequency}
                    onChange={(e) => setField('cycleCountFrequency', e.target.value as CycleCountFrequency)}
                    style={inputBase}
                  >
                    {CYCLE_FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Variance Tolerance (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={state.cycleCountVarianceTolerance}
                    onChange={(e) => setField('cycleCountVarianceTolerance', e.target.value)}
                    style={inputBase}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Review & Activate ─────────────────────────────────────────────
  function renderStep5() {
    const summaryFields = [
      { label: 'Warehouse Name', value: state.warehouseName || '—' },
      { label: 'Warehouse Code', value: state.warehouseCode || '—' },
      { label: 'Ownership Scope', value: state.ownershipScope || '—' },
      {
        label: 'Owning Entity',
        value:
          state.ownershipScope === 'Organization'
            ? state.owningOrgCode || '—'
            : state.owningBranchCode || '—',
      },
      { label: 'Warehouse Type', value: state.warehouseType || '—' },
      { label: 'Inventory Mode', value: state.inventoryControlMode || '—' },
      { label: 'BIN Managed', value: binManaged === null ? '—' : binManaged ? 'Yes' : 'No' },
      { label: 'Time Zone', value: state.timezone || '—' },
    ];

    return (
      <WarehouseActivationReview
        summaryFields={summaryFields}
        checks={activationChecks}
        canActivate={canActivateNow}
        activating={activating}
        onActivate={handleActivate}
        onSaveDraft={handleSaveDraft}
        onJumpToStep={jumpToStep}
      />
    );
  }

  // ── Footer buttons ─────────────────────────────────────────────────────────
  function renderFooter() {
    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 28px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              if (isDirty) {
                if (confirm('Discard unsaved changes and go back to the list?')) {
                  setIsDirty(false);
                  navigate(WAREHOUSE_ROUTES.list);
                }
              } else {
                navigate(WAREHOUSE_ROUTES.list);
              }
            }}
            style={btnGhost}
          >
            <ArrowLeft size={14} /> Cancel
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isFirst && (
            <button type="button" onClick={goBack} style={btnOutline}>
              <ArrowLeft size={14} /> Back
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{ ...btnOutline, opacity: saving ? 0.5 : 1 }}
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>

          {!isLast && (
            <button type="button" onClick={advanceStep} style={btnPrimary}>
              {step === STEPS.length - 2 ? 'Review' : 'Continue'} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* ── Leave-without-saving modal ── */}
      {showLeaveModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '14px', padding: '28px 32px', maxWidth: '400px', width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
              Leave without saving?
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              You have unsaved changes. If you leave now, your warehouse configuration will be lost.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  setIsDirty(false);
                  if (pendingNavPath) navigate(pendingNavPath);
                  setPendingNavPath(null);
                }}
                style={{ ...btnOutline, flex: 1 }}
              >
                Leave anyway
              </button>
              <button
                type="button"
                onClick={() => { setShowLeaveModal(false); setPendingNavPath(null); }}
                style={{ ...btnPrimary, flex: 1 }}
              >
                Stay and save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Fixed header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '56px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          gap: '16px',
        }}
      >
        {/* Left: back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => navigateSafe(WAREHOUSE_ROUTES.list)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
            title="Back to Warehouse List"
          >
            <ArrowLeft size={15} />
          </button>
          <Warehouse size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
            New Warehouse
          </span>
          {isDirty && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '4px',
                background: '#FEF3C7',
                color: '#92400E',
              }}
            >
              unsaved
            </span>
          )}
        </div>

        {/* Centre: step indicator */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <StepIndicator
            steps={STEPS}
            active={step}
            completed={completedSteps}
            onClick={jumpToStep}
          />
        </div>

        {/* Right: step counter */}
        <div style={{ flexShrink: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Step {step + 1} / {STEPS.length}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 36px)',
        }}
      >
        {/* Step heading */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {STEPS[step].label}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {step === 0 && 'Name, code, type, and timezone for this warehouse.'}
            {step === 1 && 'Define who owns this warehouse and which branches can access it.'}
            {step === 2 && 'Choose how inventory will be tracked — warehouse-level or at individual locations/BINs.'}
            {step === 3 &&
              (isWhLevel
                ? 'Warehouse-Level warehouses do not need a location hierarchy.'
                : 'Set up the location hierarchy structure for this warehouse.')}
            {step === 4 && 'Configure putaway, picking, reservation, and storage policies.'}
            {step === 5 && 'Review all settings and activate the warehouse or save as draft.'}
          </p>
        </div>

        {/* Step content */}
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* ── Fixed footer ── */}
      {renderFooter()}

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'white',
            background: toast.tone === 'success' ? '#15803D' : '#DC2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ─── Helper used in step 4 preset preview ────────────────────────────────────

function current_value_for(key: keyof CreateFormState, state: CreateFormState): unknown {
  return state[key];
}

export default WarehouseCreateWorkspace;
