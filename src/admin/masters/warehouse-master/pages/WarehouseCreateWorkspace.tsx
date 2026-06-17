// ─── WarehouseCreateWorkspace ─────────────────────────────────────────────────
//
// 5-step guided workspace for creating a new warehouse.
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

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Save, AlertTriangle } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { findMasterByKey, findGroupForMasterKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { getFieldHelp } from '../../../../experience/help/fieldHelp';
import { FieldHelpPopover } from '../../../../experience/components/FieldHelpPopover/FieldHelpPopover';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import type {
  InventoryControlMode,
  HierarchyLevelRole,
  LocationType,
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
import { WarehouseTemplateTreeBuilder } from '../components/WarehouseTemplateTreeBuilder';
import { WarehouseTemplateLevelDrawer } from '../components/WarehouseTemplateLevelDrawer';
import type {
  WarehouseTemplateLevelDraft,
  WarehouseTemplateTreeNode,
} from '../components/warehouseTemplateSetup.types';
import { WAREHOUSE_ROOT_LEVEL_CODE } from '../utils/hierarchyUtils';

export { buildActivationChecks as buildActivationChecksFromState };

// ─── Constants ───────────────────────────────────────────────────────────────

const MASTER_KEY = 'warehouse-master';

const STEPS = [
  { index: 0, label: 'Identity' },
  { index: 1, label: 'Ownership & Scope' },
  { index: 2, label: 'Inventory Model' },
  { index: 3, label: 'Level Builder' },
  { index: 4, label: 'Code Generation' },
  { index: 5, label: 'Level Configuration' },
  { index: 6, label: 'Review & Activate' },
];

const STEP_DESCRIPTIONS = [
  'Name, code, type, and facility reference for this warehouse.',
  'Define who owns this warehouse and which branches can access it.',
  'Choose whether inventory is controlled at warehouse level or at location and BIN level.',
  'Design the full hierarchy stack quickly with minimal fields and live preview.',
  'Refine code generation row by row only for the levels you created in the level builder.',
  'Configure each designed level in detail inside the warehouse tree.',
  'Review setup health, resolve blockers, and save or activate with confidence.',
];

const STEP_HELP_TOPICS = [
  'warehouse-create',
  'warehouse-ownership',
  'warehouse-inventory-control',
  'warehouse-structure',
  'warehouse-structure',
  'warehouse-structure',
  'warehouse-activation',
] as const;

export const WAREHOUSE_TYPES: WarehouseType[] = [
  'Physical', 'Virtual', 'Transit', 'Consignment', 'Bonded', 'Cold-Chain', 'Hazardous',
];

export const MOCK_ORG_CODES = ['ORG-001', 'ORG-002', 'ORG-003'];
export const MOCK_BRANCH_CODES = ['BR-HYD', 'BR-PUNE', 'BR-CHN', 'BR-DEL', 'BR-MUM'];
export const MOCK_COMPANY_CODES = ['EXCL-001', 'EXCL-002'];
export const MOCK_BU_CODES = ['BU-SALES', 'BU-MFG', 'BU-DIST'];
export const MOCK_LEGAL_ENTITIES = ['LE-INDIA-001', 'LE-INDIA-002'];
export const MOCK_INV_OWNER_CODES = ['OWN-001', 'OWN-002', 'OWN-003'];
export const TIMEZONES = ['Asia/Kolkata', 'UTC'];

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
    key: 'quick',
    label: 'Create hierarchy quickly (wizard)',
    description: 'Use guided pattern-based quick creation after draft save. Recommended for fast BIN-level onboarding.',
  },
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

export function resolveQuickWizardLaunchMode(savedDraftWarehouseId: string | null): 'requires-save-draft' | 'ready' {
  return savedDraftWarehouseId ? 'ready' : 'requires-save-draft';
}

export type OperationalPreset =
  | 'simple'
  | 'standard-distribution'
  | 'service-spares'
  | 'returns-qc'
  | 'cold-storage'
  | 'hazard-controlled';

export interface BranchOwnershipRow {
  branchCode: string;
  businessUnit: string;
  legalEntityCode: string;
  inventoryOwnerCode: string;
}

interface LevelBuilderRow {
  id: string;
  levelName: string;
  levelCode: string;
  sequence: number;
  role: HierarchyLevelRole;
  locationType: LocationType;
  mandatory: boolean;
  leafEligible: boolean;
  inventoryEndpointEligible: boolean;
}

interface LevelCodeGenerationRow {
  id: string;
  levelRowId: string;
  levelName: string;
  levelCode: string;
  prefixStrategy: 'WarehouseCode' | 'LevelCode' | 'Custom';
  prefix: string;
  startSequence: string;
  sequenceLength: string;
  separator: string;
  suffix: string;
  manualOverrideAllowed: boolean;
  barcodeDefault: boolean;
  qrDefault: boolean;
}

interface ActualNodeComposerState {
  mode: 'single' | 'bulk';
  parentId: string;
  parentLabel: string;
  parentCode: string;
  parentLevelCode: string;
  childLevelName: string;
  childLevelCode: string;
  childLevelRowId: string;
  name: string;
  code: string;
  count: string;
  namePrefix: string;
  codePrefix: string;
  startSequence: string;
  sequenceLength: string;
  separator: string;
  suffix: string;
}

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
  owningBranchCodes: string[];
  branchOwnershipRows: BranchOwnershipRow[];
  sharedWithAllBranches: boolean;
  sharedBranchCodes: string[];

  // Step 2 — Inventory Model
  inventoryControlMode: InventoryControlMode | '';

  // Step 3 — Code Generation
  autoGenerateLevelCodes: boolean;
  defaultCodePrefixStrategy: 'WarehouseCode' | 'LevelCode' | 'Custom';
  defaultCodePrefix: string;
  defaultStartSequence: string;
  defaultSequenceLength: string;
  defaultSeparator: string;
  defaultSuffix: string;
  allowManualCodeOverride: boolean;
  barcodeApplicableByDefault: boolean;
  qrApplicableByDefault: boolean;

  // Legacy structure fields kept for compatibility
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

  ownershipScope: 'Organization',
  owningOrgCode: '',
  owningBranchCode: '',
  companyCode: '',
  businessUnit: '',
  legalEntityCode: '',
  inventoryOwnerCode: '',
  owningBranchCodes: [],
  branchOwnershipRows: [],
  sharedWithAllBranches: false,
  sharedBranchCodes: [],

  inventoryControlMode: '',

  autoGenerateLevelCodes: true,
  defaultCodePrefixStrategy: 'WarehouseCode',
  defaultCodePrefix: '',
  defaultStartSequence: '1',
  defaultSequenceLength: '3',
  defaultSeparator: '-',
  defaultSuffix: '',
  allowManualCodeOverride: true,
  barcodeApplicableByDefault: false,
  qrApplicableByDefault: false,

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

const LEVEL_ROLE_OPTIONS: HierarchyLevelRole[] = [
  'Structural',
  'InventoryEndpoint',
  'Picking',
  'Staging',
  'Dock',
  'QC',
  'Returns',
  'Damage',
  'Scrap',
  'Yard',
  'Reporting',
  'Custom',
];

const LEVEL_LOCATION_TYPE_OPTIONS: LocationType[] = [
  'Zone',
  'Aisle',
  'Rack',
  'Shelf',
  'BIN',
  'Dock',
  'Staging',
  'QC',
  'Scrap',
  'Virtual',
  'General',
];

function makeLevelBuilderRow(sequence: number): LevelBuilderRow {
  return {
    id: `level-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    levelName: '',
    levelCode: '',
    sequence,
    role: 'Structural',
    locationType: 'General',
    mandatory: sequence === 1,
    leafEligible: false,
    inventoryEndpointEligible: false,
  };
}

function makeTemplateNodeId() {
  return `template-node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function resolveCodeRowPrefix(
  row: Pick<LevelBuilderRow, 'levelCode'>,
  warehouseCode: string,
  strategy: LevelCodeGenerationRow['prefixStrategy'],
  customPrefix: string,
): string {
  if (strategy === 'WarehouseCode') return warehouseCode.trim().toUpperCase();
  if (strategy === 'LevelCode') return row.levelCode.trim().toUpperCase();
  return customPrefix.trim().toUpperCase();
}

function buildDefaultCodeGenerationRow(
  row: LevelBuilderRow,
  state: CreateFormState,
): LevelCodeGenerationRow {
  return {
    id: `code-row-${row.id}`,
    levelRowId: row.id,
    levelName: row.levelName,
    levelCode: row.levelCode.trim().toUpperCase(),
    prefixStrategy: state.defaultCodePrefixStrategy,
    prefix: resolveCodeRowPrefix(row, state.warehouseCode, state.defaultCodePrefixStrategy, state.defaultCodePrefix),
    startSequence: state.defaultStartSequence,
    sequenceLength: state.defaultSequenceLength,
    separator: state.defaultSeparator,
    suffix: state.defaultSuffix,
    manualOverrideAllowed: state.allowManualCodeOverride,
    barcodeDefault: state.barcodeApplicableByDefault,
    qrDefault: state.qrApplicableByDefault,
  };
}

function buildLevelDraftFromRow(
  row: LevelBuilderRow,
  codeRow: LevelCodeGenerationRow,
  parentLevelCode: string,
  allowedChildLevels: string[],
): WarehouseTemplateLevelDraft {
  return {
    name: row.levelName,
    code: row.levelCode,
    status: 'Active',
    levelName: row.levelName,
    levelCode: row.levelCode,
    description: '',
    role: row.role,
    locationType: row.locationType,
    mandatory: row.mandatory,
    allowSkipLevel: false,
    leafEligible: row.leafEligible,
    inventoryEndpointEligible: row.inventoryEndpointEligible,
    capacityApplicable: row.inventoryEndpointEligible,
    itemEligibilityApplicable: row.inventoryEndpointEligible,
    responsibilityApplicable: row.sequence <= 2,
    barcodeApplicable: codeRow.barcodeDefault,
    qrApplicable: codeRow.qrDefault,
    autoGenerateCode: true,
    codePrefix: codeRow.prefix,
    startSequence: Math.max(1, Number(codeRow.startSequence) || 1),
    sequenceLength: Math.max(1, Number(codeRow.sequenceLength) || 3),
    separator: codeRow.separator,
    suffix: codeRow.suffix,
    capacityEnforcementMode: row.inventoryEndpointEligible ? 'HardBlock' : 'None',
    capacityRollupMode: row.inventoryEndpointEligible ? 'OwnCapacityOnly' : 'None',
    defaultResponsibilityRole: undefined,
    transactionPurposes: row.inventoryEndpointEligible ? ['Storage', 'Putaway', 'Picking'] : ['Storage'],
    allowedParentLevels: [parentLevelCode],
    allowedChildLevels,
    eligibilityMode: row.inventoryEndpointEligible ? 'Restricted' : 'Open',
    eligibilityDefaultFallback: 'Allow',
    eligibilityRulesSummary: '',
    putawayEnabled: row.inventoryEndpointEligible,
    putawayStrategySequence: row.inventoryEndpointEligible ? ['FEFO'] : [],
    putawayOverrideAllowed: false,
    pickingEnabled: row.inventoryEndpointEligible,
    pickingStrategySequence: row.inventoryEndpointEligible ? ['FEFO'] : [],
    pickingOverrideAllowed: false,
    cycleCountEnabled: false,
    cycleCountScope: 'Full',
    cycleCountFrequency: 'Monthly',
    cycleCountVarianceTolerance: 0,
    cycleCountVarianceUnit: 'Units',
    cycleCountFreezeEnabled: false,
    maxStorageQuantity: 0,
    maxWeight: 0,
    maxVolume: 0,
    maxWidth: 0,
    maxHeight: 0,
    maxLengthDepth: 0,
    floorLoad: 0,
    rackStructuralLoad: 0,
    temperatureControlled: false,
    minTemperature: 0,
    maxTemperature: 0,
    humidity: 0,
    hazmatClass: '',
    fireClass: '',
    mixedItemAllowed: false,
    mixedLotAllowed: false,
    mixedOwnerAllowed: false,
    complianceLockRequired: false,
    itemMappings: [],
    currentVersion: 1,
    lastUpdatedOn: '',
    lastUpdatedBy: '',
    changeSummary: '',
    previousSnapshotSummary: '',
  };
}

function buildTemplateTreeFromRows(
  rows: LevelBuilderRow[],
  codeRows: LevelCodeGenerationRow[],
): WarehouseTemplateTreeNode[] {
  const orderedRows = [...rows]
    .filter((row) => row.levelName.trim() && row.levelCode.trim())
    .sort((left, right) => left.sequence - right.sequence);
  const codeRowMap = new Map(codeRows.map((row) => [row.levelRowId, row]));
  const nodes = orderedRows.map((row, index) => {
    const nextLevelCode = orderedRows[index + 1]?.levelCode?.trim().toUpperCase();
    const parentLevelCode = index === 0 ? WAREHOUSE_ROOT_LEVEL_CODE : orderedRows[index - 1].levelCode.trim().toUpperCase();
    const codeRow = codeRowMap.get(row.id) ?? {
      ...buildDefaultCodeGenerationRow(row, EMPTY_STATE),
      levelName: row.levelName,
      levelCode: row.levelCode.trim().toUpperCase(),
    };
    const draft = buildLevelDraftFromRow(
      {
        ...row,
        levelCode: row.levelCode.trim().toUpperCase(),
      },
      codeRow,
      parentLevelCode,
      nextLevelCode ? [nextLevelCode] : [],
    );

    return {
      id: `seed-${row.id}`,
      parentId: index === 0 ? 'root' : `seed-${orderedRows[index - 1].id}`,
      ...draft,
      children: [],
    };
  });

  const rootNodes: WarehouseTemplateTreeNode[] = [];
  const nodeMap = new Map<string, WarehouseTemplateTreeNode>();
  nodes.forEach((node) => nodeMap.set(node.id, { ...node, children: [] }));
  nodes.forEach((node, index) => {
    const current = nodeMap.get(node.id);
    if (!current) return;
    if (index === 0) {
      rootNodes.push(current);
      return;
    }
    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children.push(current);
    }
  });
  return rootNodes;
}

function getOrderedLevelBuilderRows(rows: LevelBuilderRow[]): LevelBuilderRow[] {
  return [...rows]
    .filter((row) => row.levelName.trim() && row.levelCode.trim())
    .sort((left, right) => left.sequence - right.sequence);
}

function findLevelBuilderRowByLevelCode(
  rows: LevelBuilderRow[],
  levelCode: string,
): LevelBuilderRow | undefined {
  return getOrderedLevelBuilderRows(rows).find(
    (row) => row.levelCode.trim().toUpperCase() === levelCode.trim().toUpperCase(),
  );
}

function findNextLevelBuilderRow(
  rows: LevelBuilderRow[],
  parentLevelCode: string,
): LevelBuilderRow | undefined {
  const orderedRows = getOrderedLevelBuilderRows(rows);
  if (parentLevelCode === WAREHOUSE_ROOT_LEVEL_CODE) {
    return orderedRows[0];
  }
  const parentIndex = orderedRows.findIndex(
    (row) => row.levelCode.trim().toUpperCase() === parentLevelCode.trim().toUpperCase(),
  );
  if (parentIndex < 0) return undefined;
  return orderedRows[parentIndex + 1];
}

function countChildNodesAtParent(
  nodes: WarehouseTemplateTreeNode[],
  parentId: string,
  childLevelCode: string,
): number {
  if (parentId === 'root') {
    return nodes.filter((node) => node.levelCode === childLevelCode).length;
  }
  const parentNode = findTemplateNode(nodes, parentId);
  return parentNode
    ? parentNode.children.filter((node) => node.levelCode === childLevelCode).length
    : 0;
}

function buildNodeCodePreview(
  prefix: string,
  separator: string,
  sequence: number,
  sequenceLength: number,
  suffix: string,
): string {
  const safeSequence = String(Math.max(1, sequence)).padStart(Math.max(1, sequenceLength), '0');
  if (!prefix.trim()) {
    return `${safeSequence}${suffix || ''}`;
  }
  return `${prefix}${separator || ''}${safeSequence}${suffix || ''}`;
}

function buildNodeComposerState(
  nodes: WarehouseTemplateTreeNode[],
  rows: LevelBuilderRow[],
  codeRows: LevelCodeGenerationRow[],
  parentId: string,
  parentLabel: string,
  parentCode: string,
  parentLevelCode: string,
  mode: 'single' | 'bulk',
  warehouseCode: string,
): ActualNodeComposerState | null {
  const childLevelRow = findNextLevelBuilderRow(rows, parentLevelCode);
  if (!childLevelRow) return null;
  const codeRow =
    codeRows.find((row) => row.levelRowId === childLevelRow.id) ??
    buildDefaultCodeGenerationRow(childLevelRow, {
      ...EMPTY_STATE,
      warehouseCode,
    });
  const siblingCount = countChildNodesAtParent(
    nodes,
    parentId,
    childLevelRow.levelCode.trim().toUpperCase(),
  );
  const sequenceBase = Math.max(1, Number(codeRow.startSequence) || 1) + siblingCount;
  const sequenceLength = Math.max(1, Number(codeRow.sequenceLength) || 3);
  const childLevelName = childLevelRow.levelName.trim();
  const childLevelCode = childLevelRow.levelCode.trim().toUpperCase();
  const namePrefix = childLevelName || 'Node';
  const codePrefix = codeRow.prefix || childLevelCode || warehouseCode.trim().toUpperCase();

  return {
    mode,
    parentId,
    parentLabel,
    parentCode,
    parentLevelCode,
    childLevelName,
    childLevelCode,
    childLevelRowId: childLevelRow.id,
    name: `${namePrefix} ${String(siblingCount + 1).padStart(2, '0')}`,
    code: buildNodeCodePreview(
      codePrefix,
      codeRow.separator,
      sequenceBase,
      sequenceLength,
      codeRow.suffix,
    ),
    count: '3',
    namePrefix,
    codePrefix,
    startSequence: String(sequenceBase),
    sequenceLength: String(sequenceLength),
    separator: codeRow.separator,
    suffix: codeRow.suffix,
  };
}

function buildBootstrapLevelsFromRows(
  rows: LevelBuilderRow[],
  codeRows: LevelCodeGenerationRow[],
  warehouseCode: string,
): CreateWarehouseInput['hierarchyTemplateBootstrap'] extends { levels: infer T } ? T : never {
  const orderedRows = getOrderedLevelBuilderRows(rows);
  const codeRowMap = new Map(codeRows.map((row) => [row.levelRowId, row]));
  return orderedRows.map((row, index) => {
    const codeRow =
      codeRowMap.get(row.id) ??
      buildDefaultCodeGenerationRow(row, {
        ...EMPTY_STATE,
        warehouseCode,
      });
    const nextLevelCode = orderedRows[index + 1]?.levelCode?.trim().toUpperCase();
    return {
      levelCode: row.levelCode.trim().toUpperCase(),
      levelName: row.levelName.trim(),
      sequence: index + 1,
      levelRole: row.role,
      locationType: row.locationType,
      mandatory: row.mandatory,
      allowSkipLevel: false,
      leafEligible: row.leafEligible,
      allowedParentLevels: [index === 0 ? WAREHOUSE_ROOT_LEVEL_CODE : orderedRows[index - 1].levelCode.trim().toUpperCase()],
      allowedChildLevels: nextLevelCode ? [nextLevelCode] : [],
      capacityApplicable: row.inventoryEndpointEligible,
      itemEligibilityApplicable: row.inventoryEndpointEligible,
      responsibilityApplicable: row.sequence <= 2,
      barcodeApplicable: codeRow.barcodeDefault,
      qrApplicable: codeRow.qrDefault,
      codeGenerationPattern: buildNodeCodePreview(
        codeRow.prefix,
        codeRow.separator,
        Math.max(1, Number(codeRow.startSequence) || 1),
        Math.max(1, Number(codeRow.sequenceLength) || 3),
        codeRow.suffix,
      ),
      parentLevelRestrictions: [index === 0 ? WAREHOUSE_ROOT_LEVEL_CODE : orderedRows[index - 1].levelCode.trim().toUpperCase()],
      childLevelRestrictions: nextLevelCode ? [nextLevelCode] : [],
    };
  }) as CreateWarehouseInput['hierarchyTemplateBootstrap'] extends { levels: infer T } ? T : never;
}

function collectTemplateLevelOptions(nodes: WarehouseTemplateTreeNode[]): string[] {
  const seen = new Set<string>([WAREHOUSE_ROOT_LEVEL_CODE]);
  const walk = (items: WarehouseTemplateTreeNode[]) => {
    items.forEach((item) => {
      if (item.levelCode) seen.add(item.levelCode);
      if (item.children.length > 0) walk(item.children);
    });
  };
  walk(nodes);
  return Array.from(seen);
}

function findTemplateNode(nodes: WarehouseTemplateTreeNode[], nodeId: string): WarehouseTemplateTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const childMatch = findTemplateNode(node.children, nodeId);
    if (childMatch) return childMatch;
  }
  return null;
}

function addTemplateChild(nodes: WarehouseTemplateTreeNode[], parentId: string, child: WarehouseTemplateTreeNode): WarehouseTemplateTreeNode[] {
  if (parentId === 'root') return [...nodes, child];
  return nodes.map((node) => (
    node.id === parentId
      ? { ...node, children: [...node.children, child] }
      : { ...node, children: addTemplateChild(node.children, parentId, child) }
  ));
}

function updateTemplateNode(
  nodes: WarehouseTemplateTreeNode[],
  nodeId: string,
  draft: WarehouseTemplateLevelDraft,
): WarehouseTemplateTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, ...draft };
    }
    return { ...node, children: updateTemplateNode(node.children, nodeId, draft) };
  });
}

function flattenTemplateLevels(nodes: WarehouseTemplateTreeNode[]): WarehouseTemplateTreeNode[] {
  const rows: WarehouseTemplateTreeNode[] = [];
  const walk = (items: WarehouseTemplateTreeNode[]) => {
    items.forEach((item) => {
      rows.push(item);
      if (item.children.length > 0) walk(item.children);
    });
  };
  walk(nodes);
  return rows;
}

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
  const normalizedOwningBranchCodes = Array.from(new Set([
    ...((state.owningBranchCodes ?? []).map((branchCode) => branchCode.trim()).filter(Boolean)),
    ...(state.owningBranchCode.trim() ? [state.owningBranchCode.trim()] : []),
  ].map((branchCode) => branchCode.toUpperCase())));
  if (step === 0) {
    if (!state.warehouseName.trim()) errs.warehouseName = 'Enter the warehouse name used by operations and reporting.';
    if (!state.warehouseCode.trim()) errs.warehouseCode = 'Enter a warehouse code before moving to ownership and inventory setup.';
    if (!state.warehouseType) errs.warehouseType = 'Select the warehouse type so downstream rules and reporting can classify this site correctly.';
  }
  if (step === 1) {
    if (!state.ownershipScope) errs.ownershipScope = 'Choose whether this warehouse is governed at organisation scope or branch scope.';
    if (state.ownershipScope === 'Organization' && !state.owningOrgCode)
      errs.owningOrgCode = 'Select the owning organisation for this shared warehouse.';
    if (state.ownershipScope === 'Organization' && !state.inventoryOwnerCode)
      errs.inventoryOwnerCode = 'Select the inventory owner for this warehouse.';
    if (state.ownershipScope === 'Branch' && normalizedOwningBranchCodes.length === 0)
      errs.owningBranchCode = 'Select one owning branch before continuing.';
    if (state.ownershipScope === 'Branch' && normalizedOwningBranchCodes.length > 1)
      errs.owningBranchCodes = 'Branch-level warehouses can have only one owning branch.';
    if (state.ownershipScope === 'Branch') {
      const branchRows = state.branchOwnershipRows ?? [];
      const incompleteRow = branchRows.find(
        (row) =>
          !row.businessUnit.trim() ||
          !row.legalEntityCode.trim() ||
          !row.inventoryOwnerCode.trim(),
      );
      if (incompleteRow) {
        errs.branchOwnershipRows = `Complete Business Unit, Legal Entity, and Inventory Owner for ${incompleteRow.branchCode}.`;
      }
    }
  }
  if (step === 2) {
    if (!state.inventoryControlMode) errs.inventoryControlMode = 'Select an inventory control mode. This choice determines whether hierarchy and BIN-level rules are required later.';
  }
  return errs;
}

/** Apply an operational preset and return the merged state delta.
 *  Does not mutate input. Exported for testing. */
export function applyPreset(
  preset: OperationalPreset,
  _state: CreateFormState,
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
const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' };
const gridThreeComposer: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' };
const gridFourComposer: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' };
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
const miniOutlineBtn: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 600,
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  cursor: 'pointer',
};
const miniDangerBtn: React.CSSProperties = {
  ...miniOutlineBtn,
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
  color: '#B91C1C',
};
const checkboxCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  background: 'var(--color-surface)',
};
const checkboxTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--color-text)',
};
const checkboxHintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  marginTop: '2px',
};
const checkboxPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '999px',
  fontSize: '12px',
  background: 'var(--color-surface)',
};
const previewRootStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};
const previewNodeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
};
const codeGridCell: React.CSSProperties = {
  padding: '8px 10px',
  borderRight: '1px solid var(--color-border)',
};
const codeGridReadonlyCell: React.CSSProperties = {
  ...codeGridCell,
  display: 'flex',
  alignItems: 'center',
  fontSize: '12px',
  color: 'var(--color-text)',
};
const codeGridInput: React.CSSProperties = {
  width: '100%',
  padding: '7px 8px',
  fontSize: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};
const codeGridToggleCell: React.CSSProperties = {
  ...codeGridCell,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  color: 'var(--color-text)',
};

function labelWithHelp(label: string, helpKey?: string, required = false) {
  const help = helpKey ? getFieldHelp(helpKey) : undefined;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {help && (
        <FieldHelpPopover
          title={help.title}
          description={help.description}
          example={help.example}
        />
      )}
    </span>
  );
}

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

void StepIndicator;

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
  const [, setPreviousMode] = useState<InventoryControlMode | ''>('');
  const [showModeWarning, setShowModeWarning] = useState(false);
  const [modeChangeHint, setModeChangeHint] = useState<string | null>(null);
  const [presetPreview, setPresetPreview] = useState<{
    preset: OperationalPreset;
    delta: Partial<CreateFormState>;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1024);
  const [savedDraftWarehouseId, setSavedDraftWarehouseId] = useState<string | null>(null);
  const [levelBuilderRows, setLevelBuilderRows] = useState<LevelBuilderRow[]>([
    {
      ...makeLevelBuilderRow(1),
      levelName: 'Zone',
      levelCode: 'ZONE',
      role: 'Structural',
      locationType: 'Zone',
      mandatory: true,
    },
    {
      ...makeLevelBuilderRow(2),
      levelName: 'BIN',
      levelCode: 'BIN',
      role: 'InventoryEndpoint',
      locationType: 'BIN',
      mandatory: true,
      leafEligible: true,
      inventoryEndpointEligible: true,
    },
  ]);
  const [dragLevelRowId, setDragLevelRowId] = useState<string | null>(null);
  const [levelCodeGenerationRows, setLevelCodeGenerationRows] = useState<LevelCodeGenerationRow[]>([]);
  const [templateTreeNodes, setTemplateTreeNodes] = useState<WarehouseTemplateTreeNode[]>([]);
  const [expandedTemplateNodeIds, setExpandedTemplateNodeIds] = useState<Set<string>>(new Set(['root']));
  const [nodeComposerState, setNodeComposerState] = useState<ActualNodeComposerState | null>(null);
  const [levelDrawerState, setLevelDrawerState] = useState<{
    mode: 'edit';
    parentId: string;
    parentLabel: string;
    parentCode: string;
    parentLevelCode: string;
    titleLabel: string;
    initialValue: WarehouseTemplateLevelDraft;
    editNodeId?: string;
  } | null>(null);
  const codeCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const branchRowCache = useRef<Record<string, BranchOwnershipRow>>({});

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

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    setLevelCodeGenerationRows((current) => {
      const existingMap = new Map(current.map((row) => [row.levelRowId, row]));
      return levelBuilderRows
        .filter((levelRow) => levelRow.levelName.trim() && levelRow.levelCode.trim())
        .map((levelRow) => {
        const existing = existingMap.get(levelRow.id);
        if (!existing) {
          return buildDefaultCodeGenerationRow(levelRow, state);
        }

        return {
          ...existing,
          levelName: levelRow.levelName,
          levelCode: levelRow.levelCode.trim().toUpperCase(),
          prefix:
            existing.prefixStrategy === 'WarehouseCode'
              ? state.warehouseCode.trim().toUpperCase()
              : existing.prefixStrategy === 'LevelCode'
                ? levelRow.levelCode.trim().toUpperCase()
                : existing.prefix,
        };
      });
    });
  }, [
    levelBuilderRows,
    state.warehouseCode,
    state.defaultCodePrefixStrategy,
    state.defaultCodePrefix,
    state.defaultStartSequence,
    state.defaultSequenceLength,
    state.defaultSeparator,
    state.defaultSuffix,
    state.allowManualCodeOverride,
    state.barcodeApplicableByDefault,
    state.qrApplicableByDefault,
  ]);

  function updateLevelBuilderRow(id: string, field: keyof Omit<LevelBuilderRow, 'id'>, value: string | number | boolean) {
    setLevelBuilderRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } as LevelBuilderRow : row)),
    );
    setIsDirty(true);
  }

  function addLevelBuilderRow() {
    setLevelBuilderRows((current) => [...current, makeLevelBuilderRow(current.length + 1)]);
    setIsDirty(true);
  }

  function removeLevelBuilderRow(id: string) {
    setLevelBuilderRows((current) =>
      current
        .filter((row) => row.id !== id)
        .map((row, index) => ({ ...row, sequence: index + 1 })),
    );
    setIsDirty(true);
  }

  function moveLevelBuilderRow(id: string, direction: 'up' | 'down') {
    setLevelBuilderRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      if (index < 0) return current;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((row, rowIndex) => ({ ...row, sequence: rowIndex + 1 }));
    });
    setIsDirty(true);
  }

  function reorderLevelBuilderRows(sourceId: string, targetId: string) {
    setLevelBuilderRows((current) => {
      const sourceIndex = current.findIndex((row) => row.id === sourceId);
      const targetIndex = current.findIndex((row) => row.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((row, rowIndex) => ({ ...row, sequence: rowIndex + 1 }));
    });
    setDragLevelRowId(null);
    setIsDirty(true);
  }

  function updateCodeGenerationRow(
    levelRowId: string,
    field: keyof Omit<LevelCodeGenerationRow, 'id' | 'levelRowId' | 'levelName' | 'levelCode'>,
    value: string | boolean,
  ) {
    setLevelCodeGenerationRows((current) =>
      current.map((row) => {
        if (row.levelRowId !== levelRowId) return row;
        const nextRow = { ...row, [field]: value } as LevelCodeGenerationRow;
        if (field === 'prefixStrategy') {
          nextRow.prefix = resolveCodeRowPrefix(
            {
              levelCode: row.levelCode,
            } as Pick<LevelBuilderRow, 'levelCode'>,
            state.warehouseCode,
            value as LevelCodeGenerationRow['prefixStrategy'],
            row.prefix,
          );
        }
        if (field === 'prefix' && nextRow.prefixStrategy !== 'Custom') {
          nextRow.prefix = resolveCodeRowPrefix(
            {
              levelCode: row.levelCode,
            } as Pick<LevelBuilderRow, 'levelCode'>,
            state.warehouseCode,
            nextRow.prefixStrategy,
            String(value),
          );
        }
        return nextRow;
      }),
    );
    setIsDirty(true);
  }

  const templateLevelOptions = collectTemplateLevelOptions(templateTreeNodes);

  function openCreateConfiguredLevel(parentId: string) {
    const parentNode = parentId === 'root' ? null : findTemplateNode(templateTreeNodes, parentId);
    const composer = buildNodeComposerState(
      templateTreeNodes,
      levelBuilderRows,
      levelCodeGenerationRows,
      parentId,
      parentNode?.name ?? state.warehouseName ?? 'Warehouse',
      parentNode?.code ?? state.warehouseCode,
      parentNode?.levelCode ?? WAREHOUSE_ROOT_LEVEL_CODE,
      'single',
      state.warehouseCode,
    );
    if (!composer) {
      showToast('No child level is defined for this parent. Update the level pattern in Level Builder first.', 'error');
      return;
    }
    setNodeComposerState(composer);
  }

  function openBulkCreateConfiguredLevel(parentId: string) {
    const parentNode = parentId === 'root' ? null : findTemplateNode(templateTreeNodes, parentId);
    const composer = buildNodeComposerState(
      templateTreeNodes,
      levelBuilderRows,
      levelCodeGenerationRows,
      parentId,
      parentNode?.name ?? state.warehouseName ?? 'Warehouse',
      parentNode?.code ?? state.warehouseCode,
      parentNode?.levelCode ?? WAREHOUSE_ROOT_LEVEL_CODE,
      'bulk',
      state.warehouseCode,
    );
    if (!composer) {
      showToast('No child level is defined for this parent. Update the level pattern in Level Builder first.', 'error');
      return;
    }
    setNodeComposerState(composer);
  }

  function openEditConfiguredLevel(nodeId: string) {
    const targetNode = findTemplateNode(templateTreeNodes, nodeId);
    if (!targetNode) return;
    const parentNode = targetNode.parentId === 'root' ? null : findTemplateNode(templateTreeNodes, targetNode.parentId);
    setLevelDrawerState({
      mode: 'edit',
      parentId: targetNode.parentId,
      parentLabel: parentNode?.name ?? state.warehouseName ?? 'Warehouse',
      parentCode: parentNode?.code ?? state.warehouseCode,
      parentLevelCode: parentNode?.levelCode ?? WAREHOUSE_ROOT_LEVEL_CODE,
      titleLabel: targetNode.levelName || targetNode.name,
      initialValue: { ...targetNode },
      editNodeId: targetNode.id,
    });
  }

  function submitConfiguredLevel(nextDraft: WarehouseTemplateLevelDraft) {
    if (!levelDrawerState) return;
    if (levelDrawerState.editNodeId) {
      setTemplateTreeNodes((current) => updateTemplateNode(current, levelDrawerState.editNodeId!, nextDraft));
    }
    setLevelDrawerState(null);
    setIsDirty(true);
  }

  function updateNodeComposerField<K extends keyof ActualNodeComposerState>(
    key: K,
    value: ActualNodeComposerState[K],
  ) {
    setNodeComposerState((current) => (current ? { ...current, [key]: value } : current));
  }

  function submitActualNodeComposer() {
    if (!nodeComposerState) return;
    const childLevelRow = levelBuilderRows.find((row) => row.id === nodeComposerState.childLevelRowId);
    if (!childLevelRow) {
      showToast('The selected child level is no longer available. Please review the level pattern first.', 'error');
      return;
    }
    const codeRow =
      levelCodeGenerationRows.find((row) => row.levelRowId === childLevelRow.id) ??
      buildDefaultCodeGenerationRow(childLevelRow, state);
    const orderedRows = getOrderedLevelBuilderRows(levelBuilderRows);
    const rowIndex = orderedRows.findIndex((row) => row.id === childLevelRow.id);
    const nextLevelCode = orderedRows[rowIndex + 1]?.levelCode?.trim().toUpperCase();
    const baseDraft = buildLevelDraftFromRow(
      {
        ...childLevelRow,
        levelCode: childLevelRow.levelCode.trim().toUpperCase(),
      },
      codeRow,
      nodeComposerState.parentLevelCode,
      nextLevelCode ? [nextLevelCode] : [],
    );

    if (nodeComposerState.mode === 'single') {
      if (!nodeComposerState.name.trim() || !nodeComposerState.code.trim()) {
        showToast(`Enter ${nodeComposerState.childLevelName} name and code before saving.`, 'error');
        return;
      }
      const nextNode: WarehouseTemplateTreeNode = {
        id: makeTemplateNodeId(),
        parentId: nodeComposerState.parentId,
        ...baseDraft,
        name: nodeComposerState.name.trim(),
        code: nodeComposerState.code.trim().toUpperCase(),
        status: 'Active',
        children: [],
      };
      setTemplateTreeNodes((current) => addTemplateChild(current, nodeComposerState.parentId, nextNode));
      setExpandedTemplateNodeIds((current) => new Set([...current, 'root', nodeComposerState.parentId]));
      setNodeComposerState(null);
      setIsDirty(true);
      return;
    }

    const total = Math.max(1, Number(nodeComposerState.count) || 0);
    if (!nodeComposerState.namePrefix.trim() || !nodeComposerState.codePrefix.trim() || total <= 0) {
      showToast(`Complete the ${nodeComposerState.childLevelName} bulk-create inputs before saving.`, 'error');
      return;
    }
    const startingSequence = Math.max(1, Number(nodeComposerState.startSequence) || 1);
    const sequenceLength = Math.max(1, Number(nodeComposerState.sequenceLength) || 3);
    const createdNodes: WarehouseTemplateTreeNode[] = Array.from({ length: total }, (_, index) => {
      const sequence = startingSequence + index;
      return {
        id: makeTemplateNodeId(),
        parentId: nodeComposerState.parentId,
        ...baseDraft,
        name: `${nodeComposerState.namePrefix.trim()} ${String(sequence).padStart(2, '0')}`,
        code: buildNodeCodePreview(
          nodeComposerState.codePrefix.trim(),
          nodeComposerState.separator,
          sequence,
          sequenceLength,
          nodeComposerState.suffix,
        ),
        status: 'Active',
        children: [],
      };
    });
    setTemplateTreeNodes((current) =>
      createdNodes.reduce(
        (nodes, nextNode) => addTemplateChild(nodes, nodeComposerState.parentId, nextNode),
        current,
      ),
    );
    setExpandedTemplateNodeIds((current) => new Set([...current, 'root', nodeComposerState.parentId]));
    setNodeComposerState(null);
    setIsDirty(true);
  }

  function buildBranchOwnershipRow(
    branchCode: string,
    currentState: CreateFormState,
  ): BranchOwnershipRow {
    const cachedRow = branchRowCache.current[branchCode];
    if (cachedRow) return cachedRow;

    const previousRow =
      currentState.branchOwnershipRows[currentState.branchOwnershipRows.length - 1];

    return {
      branchCode,
      businessUnit: previousRow?.businessUnit || '',
      legalEntityCode: previousRow?.legalEntityCode || '',
      inventoryOwnerCode: previousRow?.inventoryOwnerCode || '',
    };
  }

  function toggleOwningBranch(branchCode: string) {
    setState((currentState) => {
      const selected = currentState.owningBranchCodes.includes(branchCode);
      const nextCodes = selected
        ? currentState.owningBranchCodes.filter((code) => code !== branchCode)
        : [...currentState.owningBranchCodes, branchCode];

      const nextRows = selected
        ? currentState.branchOwnershipRows.filter((row) => {
            if (row.branchCode === branchCode) {
              branchRowCache.current[branchCode] = row;
              return false;
            }
            return true;
          })
        : [
            ...currentState.branchOwnershipRows,
            buildBranchOwnershipRow(branchCode, currentState),
          ];

      return {
        ...currentState,
        owningBranchCodes: nextCodes,
        branchOwnershipRows: nextRows,
      };
    });

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      owningBranchCodes: undefined as unknown as string,
      branchOwnershipRows: undefined as unknown as string,
    }));
    setIsDirty(true);
  }

  function setBranchOwnershipRowField(
    branchCode: string,
    field: keyof Omit<BranchOwnershipRow, 'branchCode'>,
    value: string,
  ) {
    setState((currentState) => {
      const nextRows = currentState.branchOwnershipRows.map((row) =>
        row.branchCode === branchCode ? { ...row, [field]: value } : row,
      );
      const updatedRow = nextRows.find((row) => row.branchCode === branchCode);
      if (updatedRow) {
        branchRowCache.current[branchCode] = updatedRow;
      }
      return { ...currentState, branchOwnershipRows: nextRows };
    });

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      branchOwnershipRows: undefined as unknown as string,
    }));
    setIsDirty(true);
  }

  function selectInventoryMode(mode: InventoryControlMode) {
    setState((currentState) => {
      if (currentState.inventoryControlMode === mode) return currentState;

      if (mode === 'Warehouse-Level') {
        setModeChangeHint('Switched to Warehouse-Level. Structure-specific setup and BIN-only automation defaults were reset.');
        return {
          ...currentState,
          inventoryControlMode: mode,
          hierarchyChoice: '',
          copyFromWarehouseId: '',
          autoPutawayEnabled: false,
          putawayStrategySequence: [],
          autoPickingEnabled: false,
          pickingStrategySequence: [],
          reservationLevel: 'Warehouse',
          allocationLevel: 'Warehouse',
        };
      }

      setModeChangeHint('Switched to Location/BIN-Level. Hierarchy setup and warehouse automation options are now available.');
      return {
        ...currentState,
        inventoryControlMode: mode,
      };
    });

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      inventoryControlMode: undefined as unknown as string,
    }));
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
  const configuredTemplateLevels = flattenTemplateLevels(templateTreeNodes);

  // ── Step validation and advance ────────────────────────────────────────────
  function advanceStep() {
    const errs = validateStep(step, state);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Complete the required fields in this step before continuing. Each highlighted field explains what is missing.', 'error');
      return;
    }
    if (step === 3) {
      const hasValidLevelRows = levelBuilderRows.some(
        (row) => row.levelName.trim() && row.levelCode.trim(),
      );
      if (!hasValidLevelRows) {
        showToast('Add at least one hierarchy level with Level Name and Level Code before continuing.', 'error');
        return;
      }
    }
    if (step === 4) {
      const invalidCodeRow = levelCodeGenerationRows.find((row) =>
        !row.startSequence.trim() ||
        !row.sequenceLength.trim() ||
        (row.prefixStrategy === 'Custom' && !row.prefix.trim()),
      );
      if (invalidCodeRow) {
        showToast(`Complete code generation fields for ${invalidCodeRow.levelName || invalidCodeRow.levelCode || 'the affected level'} before continuing.`, 'error');
        return;
      }
    }
    if (step === 5 && templateTreeNodes.length === 0) {
      showToast('Design at least one configured level before moving to Review & Activate.', 'error');
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

  function getStepIssueCount(targetStep: number): number {
    return Object.keys(validateStep(targetStep, state)).length;
  }

  // ── Build input ─────────────────────────────────────────────────────────────
  function buildInput(): CreateWarehouseInput {
    const mode = state.inventoryControlMode as InventoryControlMode;
    const primaryBranchRow = state.branchOwnershipRows[0];
    const bootstrapLevels = buildBootstrapLevelsFromRows(
      levelBuilderRows,
      levelCodeGenerationRows,
      state.warehouseCode,
    );
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
      owningBranchCode:
        state.ownershipScope === 'Branch' ? state.owningBranchCodes[0] : undefined,
      owningBranchCodes:
        state.ownershipScope === 'Branch' ? state.owningBranchCodes : undefined,
      branchOwnershipRows:
        state.ownershipScope === 'Branch' ? state.branchOwnershipRows : undefined,
      businessUnit:
        state.ownershipScope === 'Organization'
          ? state.businessUnit || undefined
          : primaryBranchRow?.businessUnit || undefined,
      legalEntityCode:
        state.ownershipScope === 'Organization'
          ? state.legalEntityCode || undefined
          : primaryBranchRow?.legalEntityCode || undefined,
      inventoryOwnerCode:
        state.ownershipScope === 'Organization'
          ? state.inventoryOwnerCode || undefined
          : primaryBranchRow?.inventoryOwnerCode || undefined,
      sharedWithAllBranches:
        state.ownershipScope === 'Organization' ? state.sharedWithAllBranches : false,
      sharedBranchCodes:
        state.ownershipScope === 'Organization' && !state.sharedWithAllBranches
          ? state.sharedBranchCodes
          : [],
      warehouseType: (state.warehouseType || 'Physical') as WarehouseType,
      wmsEnabled: state.wmsEnabled,
      inventoryControlMode: mode,
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
      hierarchyTemplateBootstrap:
        bootstrapLevels.length > 0
          ? {
              templateCode: `${state.warehouseCode.trim().toUpperCase() || 'WH'}-TPL`,
              templateName: `${state.warehouseName.trim() || 'Warehouse'} Template`,
              flexiblePathEnabled: true,
              levels: bootstrapLevels,
            }
          : undefined,
    };
  }

  // ── Save Draft ─────────────────────────────────────────────────────────────
  async function saveDraftInternal(redirectToList: boolean): Promise<string | null> {
    const errs = validateStep(0, state);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast('Warehouse Name and Code are required to save a draft.', 'error');
      return null;
    }
    if (!state.inventoryControlMode) {
      showToast('Select an Inventory Control Mode before saving.', 'error');
      return null;
    }
    setSaving(true);
    try {
      const details = await warehouseMockAdapter.createWarehouse(buildInput());
      setSavedDraftWarehouseId(details.warehouse.id);
      setIsDirty(false);
      showToast('Warehouse saved as Draft.', 'success');
      if (redirectToList) {
        setTimeout(() => navigate(WAREHOUSE_ROUTES.list), 800);
      }
      return details.warehouse.id;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unexpected error saving warehouse.';
      showToast(msg, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    await saveDraftInternal(true);
  }

  // ── Activate ───────────────────────────────────────────────────────────────
  async function handleActivate() {
    if (!canActivateNow) return;
    setActivating(true);
    try {
      const details = await warehouseMockAdapter.createWarehouse(buildInput());
      const activationResult = await warehouseMockAdapter.activateWarehouse(
        details.warehouse.id,
        { action: 'Activate', correlationId: `COR-${Date.now()}` },
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
    timezone: state.timezone,
    warehouseType: state.warehouseType,
    ownershipScope: state.ownershipScope,
    owningOrgCode: state.owningOrgCode,
    owningBranchCode: state.owningBranchCode,
    businessUnit: state.businessUnit,
    legalEntityCode: state.legalEntityCode,
    inventoryOwnerCode: state.inventoryOwnerCode,
    owningBranchCodes: state.owningBranchCodes,
    branchOwnershipRowsComplete:
      state.branchOwnershipRows.length > 0 &&
      state.branchOwnershipRows.every(
        (row) =>
          row.businessUnit.trim().length > 0 &&
          row.legalEntityCode.trim().length > 0 &&
          row.inventoryOwnerCode.trim().length > 0,
      ),
    inventoryControlMode: state.inventoryControlMode,
    // For new warehouse creation, there are no templates or locations yet.
    // Warehouse-Level skips these checks; BIN-Level warns user (cannot be truly validated
    // until after save + hierarchy setup, so we use create-time level design as a proxy.
    hasActiveTemplate:
      !isBinLevel || templateTreeNodes.length > 0,
    hasActiveInventoryLocation: !isBinLevel ? true : configuredTemplateLevels.some((node) => node.inventoryEndpointEligible),
    codeIsUnique,
    hasPermission: true, // Phase 3: mock permissions always granted
    timezonePolicy: {
      // Current product model does not yet expose timing-governance policy flags in this create flow.
      // Keep timezone non-blocking by default until an explicit policy requires it.
      timezoneRequiredForActivation: false,
    },
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
                <label style={labelBase}>{labelWithHelp('Warehouse Name', undefined, true)}</label>
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
                <label style={labelBase}>{labelWithHelp('Warehouse Code', undefined, true)}</label>
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
                  <p style={errTxt}>This warehouse code already exists. Enter a unique code before saving or activating.</p>
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
                    Cold-Chain type will keep temperature-control defaults enabled in the warehouse setup.
                  </p>
                )}
                {state.warehouseType === 'Hazardous' && (
                  <p style={{ ...hintTxt, color: '#D97706' }}>
                    Hazardous type will keep hazard-control defaults enabled in the warehouse setup.
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
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{labelWithHelp('Ownership Scope')}</span>
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
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{labelWithHelp('Inventory Control Mode', 'warehouseInventoryControlMode')}</span>
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
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{labelWithHelp('Hierarchy Setup', 'warehouseHierarchyChoice')}</span>
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

            {state.hierarchyChoice === 'quick' && (
              <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
                {resolveQuickWizardLaunchMode(savedDraftWarehouseId) === 'requires-save-draft' && (
                <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '12px', color: '#1D4ED8' }}>
                  Quick wizard requires a saved draft warehouse first. This keeps hierarchy creation tied to a concrete warehouse ID.
                </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    const draftId = savedDraftWarehouseId ?? await saveDraftInternal(false);
                    if (draftId) {
                      navigate(`${WAREHOUSE_ROUTES.hierarchy(draftId)}?quickWizard=1`);
                    }
                  }}
                  style={{ ...btnPrimary, width: 'fit-content' }}
                >
                  Save Draft and Launch Quick Wizard
                </button>
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
                <label style={labelBase}>{labelWithHelp('Reservation Level', 'warehouseReservationLevel')}</label>
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
                <label style={labelBase}>{labelWithHelp('Allocation Level', 'warehouseAllocationLevel')}</label>
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
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{labelWithHelp('Storage Policies', 'warehouseStorageMixing')}</span>
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
  function renderStep0Modern() {
    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Warehouse Identity</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Core identity fields that anchor downstream setup
            </span>
          </div>
          <div style={sBody}>
            <div style={{ ...twoCol, ...fw }}>
              <div>
                <label style={labelBase}>{labelWithHelp('Warehouse Name', undefined, true)}</label>
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
                <label style={labelBase}>{labelWithHelp('Warehouse Code', undefined, true)}</label>
                <input
                  type="text"
                  value={state.warehouseCode}
                  onChange={(e) => {
                    setField('warehouseCode', e.target.value.toUpperCase());
                    setField('codeManuallyEdited', true);
                  }}
                  style={fieldErrors.warehouseCode || !codeIsUnique ? inputErr : inputBase}
                  placeholder="e.g. WH-PUNE"
                  maxLength={20}
                />
                {fieldErrors.warehouseCode && <p style={errTxt}>{fieldErrors.warehouseCode}</p>}
                {!fieldErrors.warehouseCode && !codeIsUnique && (
                  <p style={errTxt}>This warehouse code already exists. Enter a unique code before saving or activating.</p>
                )}
                {!fieldErrors.warehouseCode && codeIsUnique && state.warehouseCode && (
                  <p style={{ ...hintTxt, color: '#16A34A' }}>
                    {codeCheckPending ? 'Checking...' : 'Code is available'}
                  </p>
                )}
                {!state.codeManuallyEdited && state.warehouseName && (
                  <p style={hintTxt}>Auto-suggested from the warehouse name. Switch to manual only if operations needs a custom code.</p>
                )}
                <p style={hintTxt}>Code becomes read-only after activation.</p>
              </div>
            </div>

            <div style={fw}>
              <label style={labelBase}>Description</label>
              <textarea
                value={state.description}
                onChange={(e) => setField('description', e.target.value)}
                style={{ ...inputBase, resize: 'vertical', minHeight: '64px' }}
                placeholder="Optional: purpose, special handling notes..."
              />
            </div>

            <div style={twoCol}>
              <div>
                <label style={labelBase}>
                  Warehouse Type <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={state.warehouseType}
                  onChange={(e) => setField('warehouseType', e.target.value as WarehouseType)}
                  style={fieldErrors.warehouseType ? inputErr : inputBase}
                >
                  <option value="">Select type...</option>
                  {WAREHOUSE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {fieldErrors.warehouseType && <p style={errTxt}>{fieldErrors.warehouseType}</p>}
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
                <p style={hintTxt}>Link the warehouse to a facility record when one already exists.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep1Modern() {
    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Organisation Ownership</span>
          </div>
          <div style={sBody}>
              <div style={{ ...twoCol, ...fw }}>
                <div>
                  <label style={labelBase}>Owning Organization <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={state.owningOrgCode} onChange={(e) => setField('owningOrgCode', e.target.value)} style={fieldErrors.owningOrgCode ? inputErr : inputBase}>
                    <option value="">Select organization...</option>
                    {MOCK_ORG_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  {fieldErrors.owningOrgCode && <p style={errTxt}>{fieldErrors.owningOrgCode}</p>}
                </div>
                <div>
                  <label style={labelBase}>Inventory Owner <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={state.inventoryOwnerCode} onChange={(e) => setField('inventoryOwnerCode', e.target.value)} style={fieldErrors.inventoryOwnerCode ? inputErr : inputBase}>
                    <option value="">Select inventory owner...</option>
                    {MOCK_INV_OWNER_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  {fieldErrors.inventoryOwnerCode && <p style={errTxt}>{fieldErrors.inventoryOwnerCode}</p>}
                </div>
              </div>
            </div>
          </div>

        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Branch Access</span>
          </div>
          <div style={sBody}>
              <div style={{ padding: '12px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px', marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={state.sharedWithAllBranches} onChange={(e) => setField('sharedWithAllBranches', e.target.checked)} style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Share with all branches</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Turn this on for universal access. Leave it off to choose only the branches that should transact in this warehouse.
                    </p>
                  </div>
                </label>
              </div>
              {!state.sharedWithAllBranches && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  {MOCK_BRANCH_CODES.map((branchCode) => {
                    const selected = state.sharedBranchCodes.includes(branchCode);
                    return (
                      <button
                        key={branchCode}
                        type="button"
                        onClick={() => setField('sharedBranchCodes', selected ? state.sharedBranchCodes.filter((code) => code !== branchCode) : [...state.sharedBranchCodes, branchCode])}
                        style={{
                          minHeight: '40px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: selected ? 'color-mix(in srgb, var(--color-primary) 7%, white)' : 'var(--color-surface)',
                          color: selected ? 'var(--color-primary)' : 'var(--color-text)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {branchCode}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        {false && (
          <div style={sCard}>
            <div style={sHead}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Branch Ownership Grid</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Selected branches appear here immediately so each row can carry its own ownership context
              </span>
            </div>
            <div style={sBody}>
              <div style={{ ...fw }}>
                <label style={labelBase}>Owning Branches <span style={{ color: '#DC2626' }}>*</span></label>
                <div style={{ ...inputBase, minHeight: '44px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', padding: '8px 10px' }}>
                  {state.owningBranchCodes.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Choose one or more branches below. Selected branches will be shown here as chips.</span>
                  ) : (
                    state.owningBranchCodes.map((branchCode) => (
                      <span key={branchCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'color-mix(in srgb, var(--color-primary) 9%, white)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>
                        {branchCode}
                        <button type="button" onClick={() => toggleOwningBranch(branchCode)} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }} aria-label={`Remove ${branchCode}`}>×</button>
                      </span>
                    ))
                  )}
                </div>
                {fieldErrors.owningBranchCodes && <p style={errTxt}>{fieldErrors.owningBranchCodes}</p>}
                <p style={hintTxt}>Smart defaulting: each new branch row starts from the last completed row.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                {MOCK_BRANCH_CODES.map((branchCode) => {
                  const selected = state.owningBranchCodes.includes(branchCode);
                  return (
                    <button
                      key={branchCode}
                      type="button"
                      onClick={() => toggleOwningBranch(branchCode)}
                      style={{
                        minHeight: '40px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: selected ? 'color-mix(in srgb, var(--color-primary) 7%, white)' : 'var(--color-surface)',
                        color: selected ? 'var(--color-primary)' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {selected ? 'Selected: ' : 'Add: '}{branchCode}
                    </button>
                  );
                })}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: '760px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) repeat(3, minmax(180px, 1fr))', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Branch', 'Business Unit', 'Legal Entity', 'Inventory Owner'].map((header) => (
                      <div key={header} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>{header}</div>
                    ))}
                  </div>
                  {state.branchOwnershipRows.length === 0 ? (
                    <div style={{ padding: '18px 16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>Select at least one owning branch to open the branch ownership grid.</div>
                  ) : (
                    state.branchOwnershipRows.map((row, index) => (
                      <div key={row.branchCode} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) repeat(3, minmax(180px, 1fr))', borderBottom: index === state.branchOwnershipRows.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                        <div style={{ padding: '12px', fontSize: '12px', fontWeight: 700 }}>{row.branchCode}</div>
                        <div style={{ padding: '8px 10px' }}>
                          <select value={row.businessUnit} onChange={(e) => setBranchOwnershipRowField(row.branchCode, 'businessUnit', e.target.value)} style={inputBase}>
                            <option value="">Select BU...</option>
                            {MOCK_BU_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                          </select>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <select value={row.legalEntityCode} onChange={(e) => setBranchOwnershipRowField(row.branchCode, 'legalEntityCode', e.target.value)} style={inputBase}>
                            <option value="">Select legal entity...</option>
                            {MOCK_LEGAL_ENTITIES.map((code) => <option key={code} value={code}>{code}</option>)}
                          </select>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <select value={row.inventoryOwnerCode} onChange={(e) => setBranchOwnershipRowField(row.branchCode, 'inventoryOwnerCode', e.target.value)} style={inputBase}>
                            <option value="">Select owner...</option>
                            {MOCK_INV_OWNER_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {fieldErrors.branchOwnershipRows && <p style={errTxt}>{fieldErrors.branchOwnershipRows}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep2Modern() {
    const modes: { value: InventoryControlMode; label: string; description: string; recommended?: boolean }[] = [
      { value: 'Warehouse-Level', label: 'Warehouse-Level Inventory', description: 'Track stock at warehouse level only. No hierarchy or BIN is required for basic receipts and issues.' },
      { value: 'Location-BIN-Level', label: 'Location / BIN-Level Inventory', description: 'Track stock at location or BIN level. Hierarchy, directed flows, and location automation become available.', recommended: true },
    ];

    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Inventory Control Mode</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Choose the stock-granularity model now. BIN Managed stays derived.</span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {modes.map((mode) => (
                <label key={mode.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 18px', border: `2px solid ${state.inventoryControlMode === mode.value ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '12px', background: state.inventoryControlMode === mode.value ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)', cursor: 'pointer' }}>
                  <input type="radio" name="inventoryModeModern" checked={state.inventoryControlMode === mode.value} onChange={() => selectInventoryMode(mode.value)} style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{mode.label}</p>
                      {mode.recommended && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: '#DCFCE7', color: '#15803D' }}>Recommended</span>}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.inventoryControlMode && <p style={errTxt}>{fieldErrors.inventoryControlMode}</p>}
            {modeChangeHint && <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: '12px' }}>{modeChangeHint}</div>}
          </div>
        </div>
        {binManaged !== null && (
          <div style={{ marginBottom: '16px' }}>
            <DerivedValueDisplay
              label="BIN Managed"
              value={binManaged ? 'Yes' : 'No'}
              derivedFrom={`Derived from Inventory Control Mode = "${state.inventoryControlMode}"`}
              lockReason="Cannot be edited directly. Change the Inventory Control Mode to update this value."
              testId="derived-bin-managed"
            />
          </div>
        )}
      </div>
    );
  }

  function renderStep3Modern() {
    if (isWhLevel) {
      return renderStep3();
    }

    return (
      <div>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Structure</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Choose the quickest safe starting point for hierarchy setup.</span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {HIERARCHY_OPTIONS.map((option) => (
                <label key={option.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', border: `2px solid ${state.hierarchyChoice === option.key ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '12px', background: state.hierarchyChoice === option.key ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)', cursor: 'pointer' }}>
                  <input type="radio" name="hierarchyChoiceModern" checked={state.hierarchyChoice === option.key} onChange={() => setField('hierarchyChoice', option.key)} style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{option.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {state.hierarchyChoice === 'copy' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelBase}>Copy from Warehouse</label>
                <select value={state.copyFromWarehouseId} onChange={(e) => setField('copyFromWarehouseId', e.target.value)} style={inputBase}>
                  <option value="">Select a warehouse to copy from...</option>
                  <option value="WH-0002">WH-PUNE-01 - Pune Manufacturing Store</option>
                  <option value="WH-0003">WH-HYD-02 - Hyderabad Secondary</option>
                </select>
                <p style={hintTxt}>Only the hierarchy model is copied. Live locations and stock are not copied.</p>
              </div>
            )}

            {state.hierarchyChoice === 'quick' && (
              <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
                {resolveQuickWizardLaunchMode(savedDraftWarehouseId) === 'requires-save-draft' && (
                <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '12px', color: '#1D4ED8' }}>
                  Quick wizard requires a draft warehouse ID. Save draft first, then launch directly into hierarchy quick creation.
                </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    const draftId = savedDraftWarehouseId ?? await saveDraftInternal(false);
                    if (draftId) {
                      navigate(`${WAREHOUSE_ROUTES.hierarchy(draftId)}?quickWizard=1`);
                    }
                  }}
                  style={{
                    ...btnPrimary,
                    width: 'fit-content',
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'wait' : 'pointer',
                  }}
                  disabled={saving}
                >
                  Save Draft and Launch Quick Wizard
                </button>
              </div>
            )}

            {state.hierarchyChoice === 'later' && (
              <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
                Draft-only path: activation stays blocked until a valid hierarchy template and inventory-allowed location exist.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep3CodeGeneration() {
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Code Generation</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Configure code generation only for the levels you created in Level Builder.
            </span>
          </div>
          <div style={sBody}>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
              Each row is created from the levels in <strong>Level Builder</strong>. Changes stay attached to the same designed level even if you reorder the level stack.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '1380px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 120px 130px 120px 110px 120px 90px 90px 130px 110px 100px 180px', background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Level Name', 'Level Code', 'Prefix Strategy', 'Prefix', 'Start Sequence', 'Sequence Length', 'Separator', 'Suffix', 'Manual Override', 'Barcode', 'QR', 'Generated Example'].map((header) => (
                    <div key={header} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)' }}>
                      {header}
                    </div>
                  ))}
                </div>
                {levelCodeGenerationRows.map((row) => {
                  const generatedExample = `${row.prefix}${row.separator}${String(Math.max(1, Number(row.startSequence) || 1)).padStart(Math.max(1, Number(row.sequenceLength) || 3), '0')}${row.suffix}`;
                  return (
                    <div
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 120px 130px 120px 110px 120px 90px 90px 130px 110px 100px 180px',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <div style={codeGridReadonlyCell}>{row.levelName || 'Unnamed level'}</div>
                      <div style={codeGridReadonlyCell}>{row.levelCode || 'LEVEL'}</div>
                      <div style={codeGridCell}>
                        <select
                          value={row.prefixStrategy}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'prefixStrategy', event.target.value as LevelCodeGenerationRow['prefixStrategy'])}
                          style={codeGridInput}
                        >
                          <option value="WarehouseCode">Warehouse Code</option>
                          <option value="LevelCode">Level Code</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      <div style={codeGridCell}>
                        <input
                          type="text"
                          value={row.prefix}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'prefix', event.target.value.toUpperCase())}
                          style={{ ...codeGridInput, background: row.prefixStrategy === 'Custom' ? 'var(--color-surface)' : 'var(--color-surface-subtle)' }}
                          readOnly={row.prefixStrategy !== 'Custom'}
                        />
                      </div>
                      <div style={codeGridCell}>
                        <input
                          type="number"
                          min="1"
                          value={row.startSequence}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'startSequence', event.target.value)}
                          style={codeGridInput}
                        />
                      </div>
                      <div style={codeGridCell}>
                        <input
                          type="number"
                          min="1"
                          value={row.sequenceLength}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'sequenceLength', event.target.value)}
                          style={codeGridInput}
                        />
                      </div>
                      <div style={codeGridCell}>
                        <input
                          type="text"
                          value={row.separator}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'separator', event.target.value)}
                          style={codeGridInput}
                        />
                      </div>
                      <div style={codeGridCell}>
                        <input
                          type="text"
                          value={row.suffix}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'suffix', event.target.value.toUpperCase())}
                          style={codeGridInput}
                        />
                      </div>
                      <label style={codeGridToggleCell}>
                        <input
                          type="checkbox"
                          checked={row.manualOverrideAllowed}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'manualOverrideAllowed', event.target.checked)}
                        />
                        Allow
                      </label>
                      <label style={codeGridToggleCell}>
                        <input
                          type="checkbox"
                          checked={row.barcodeDefault}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'barcodeDefault', event.target.checked)}
                        />
                        Yes
                      </label>
                      <label style={codeGridToggleCell}>
                        <input
                          type="checkbox"
                          checked={row.qrDefault}
                          onChange={(event) => updateCodeGenerationRow(row.levelRowId, 'qrDefault', event.target.checked)}
                        />
                        Yes
                      </label>
                      <div style={codeGridReadonlyCell}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {generatedExample}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep4LevelBuilder() {
    return (
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Level Builder</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Design the full level stack once, then fine-tune each level in the next step.
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Add levels with only the minimum fields needed to create the hierarchy skeleton. The grid below stays as the single source for level creation.
              </div>
              <button type="button" onClick={addLevelBuilderRow} style={btnPrimary}>
                Add Level
              </button>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--color-surface)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '88px minmax(170px, 1.3fr) minmax(130px, 1fr) 96px minmax(150px, 1fr) minmax(150px, 1fr) 110px 110px 150px 190px',
                  background: 'var(--color-surface-subtle)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {['Order', 'Level Name', 'Level Code', 'Sequence', 'Level Role', 'Location Type', 'Mandatory', 'Leaf', 'Inventory Endpoint', 'Actions'].map((label, index, array) => (
                  <div
                    key={label}
                    style={{
                      ...codeGridReadonlyCell,
                      fontWeight: 700,
                      background: 'transparent',
                      borderRight: index === array.length - 1 ? 'none' : codeGridCell.borderRight,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {levelBuilderRows.map((row, index) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={() => setDragLevelRowId(row.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dragLevelRowId && reorderLevelBuilderRows(dragLevelRowId, row.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '88px minmax(170px, 1.3fr) minmax(130px, 1fr) 96px minmax(150px, 1fr) minmax(150px, 1fr) 110px 110px 150px 190px',
                    borderBottom: index === levelBuilderRows.length - 1 ? 'none' : '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                  }}
                >
                  <div style={{ ...codeGridReadonlyCell, gap: '8px' }}>
                    <span style={{ cursor: 'grab', color: 'var(--color-text-muted)', fontSize: '14px' }} title="Drag to reorder">::</span>
                    <span>Level {index + 1}</span>
                  </div>
                  <div style={codeGridCell}>
                    <input
                      type="text"
                      value={row.levelName}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'levelName', event.target.value)}
                      style={codeGridInput}
                      placeholder="e.g. Zone"
                    />
                  </div>
                  <div style={codeGridCell}>
                    <input
                      type="text"
                      value={row.levelCode}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'levelCode', event.target.value.toUpperCase())}
                      style={codeGridInput}
                      placeholder="e.g. ZONE"
                    />
                  </div>
                  <div style={codeGridCell}>
                    <input
                      type="number"
                      value={row.sequence}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'sequence', Number(event.target.value || index + 1))}
                      style={codeGridInput}
                      min={1}
                    />
                  </div>
                  <div style={codeGridCell}>
                    <select
                      value={row.role}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'role', event.target.value as HierarchyLevelRole)}
                      style={codeGridInput}
                    >
                      {LEVEL_ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div style={codeGridCell}>
                    <select
                      value={row.locationType}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'locationType', event.target.value as LocationType)}
                      style={codeGridInput}
                    >
                      {LEVEL_LOCATION_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <label style={{ ...codeGridToggleCell, justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.mandatory}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'mandatory', event.target.checked)}
                    />
                  </label>
                  <label style={{ ...codeGridToggleCell, justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.leafEligible}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'leafEligible', event.target.checked)}
                    />
                  </label>
                  <label style={{ ...codeGridToggleCell, justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.inventoryEndpointEligible}
                      onChange={(event) => updateLevelBuilderRow(row.id, 'inventoryEndpointEligible', event.target.checked)}
                    />
                  </label>
                  <div style={{ ...codeGridCell, borderRight: 'none', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => moveLevelBuilderRow(row.id, 'up')} style={miniOutlineBtn} disabled={index === 0}>Up</button>
                    <button type="button" onClick={() => moveLevelBuilderRow(row.id, 'down')} style={miniOutlineBtn} disabled={index === levelBuilderRows.length - 1}>Down</button>
                    <button type="button" onClick={() => removeLevelBuilderRow(row.id)} style={miniDangerBtn} disabled={levelBuilderRows.length === 1}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={sCard}>
          <div style={sHead}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Live Structure Preview</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              This preview will seed the next step for detailed level configuration.
            </span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={previewRootStyle}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: 'var(--color-primary)' }} />
                <strong>{state.warehouseName || 'New Warehouse'}</strong>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)' }}>{state.warehouseCode || 'WH-CODE'}</span>
              </div>
              {levelBuilderRows.map((row, index) => (
                <div key={row.id} style={{ ...previewNodeStyle, marginLeft: `${index * 22}px` }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: row.inventoryEndpointEligible ? '#16A34A' : '#CBD5E1' }} />
                  <span style={{ fontWeight: 600 }}>{row.levelName || `Level ${index + 1}`}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)' }}>{row.levelCode || 'LEVEL'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep5LevelConfiguration() {
    return (
      <WarehouseTemplateTreeBuilder
        warehouseName={state.warehouseName || 'New Warehouse'}
        warehouseCode={state.warehouseCode || 'WH-CODE'}
        nodes={templateTreeNodes}
        expandedIds={expandedTemplateNodeIds}
        onToggle={(id) =>
          setExpandedTemplateNodeIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          })
        }
        rootCanAdd={getOrderedLevelBuilderRows(levelBuilderRows).length > 0}
        rootCanBulk={getOrderedLevelBuilderRows(levelBuilderRows).length > 0}
        onAdd={openCreateConfiguredLevel}
        onBulk={openBulkCreateConfiguredLevel}
        onEdit={openEditConfiguredLevel}
      />
    );
  }

  void renderStep0;
  void renderStep1;
  void renderStep2;
  void renderStep3;
  void renderStep3Modern;
  void renderStep4;
  void openCreateConfiguredLevel;
  void STEP_DESCRIPTIONS;

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
            : state.owningBranchCodes.length > 0
              ? `${state.owningBranchCodes.length} branch${state.owningBranchCodes.length > 1 ? 'es' : ''}: ${state.owningBranchCodes.join(', ')}`
              : '—',
      },
      { label: 'Warehouse Type', value: state.warehouseType || '—' },
      { label: 'Inventory Mode', value: state.inventoryControlMode || '—' },
      { label: 'BIN Managed', value: binManaged === null ? '—' : binManaged ? 'Yes' : 'No' },
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
    <AdminShell>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '100%',
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
          gap: '16px',
          padding: '10px 24px',
          minHeight: '64px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px', userSelect: 'none' }}>
            Admin / Warehouse & Inventory / Warehouse Master
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25 }}>
              New Warehouse
            </span>
            {isDirty && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  border: '1px solid #FDE68A',
                  background: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                Unsaved changes
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
            Configure warehouse identity, ownership, inventory control, structure, and activation readiness.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              padding: '0 4px',
              whiteSpace: 'nowrap',
            }}
          >
            Step {step + 1} / {STEPS.length}
          </div>
          <button
            type="button"
            onClick={() => navigateSafe(WAREHOUSE_ROUTES.list)}
            style={btnOutline}
          >
            <ArrowLeft size={14} /> Back to List
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} style={btnOutline}>
            <HelpCircle size={14} /> How this works
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {!isNarrow && (
          <nav
            aria-label="Warehouse creation steps"
            style={{
              width: '188px',
              flexShrink: 0,
              background: 'var(--color-surface)',
              borderRight: '1px solid var(--color-border)',
              overflowY: 'auto',
              paddingTop: '8px',
            }}
          >
            {STEPS.map((stepItem) => {
              const isActive = stepItem.index === step;
              const isDone = completedSteps.has(stepItem.index);
              const issueCount = getStepIssueCount(stepItem.index);
              const dotColor = isActive ? 'var(--color-primary)' : isDone ? '#16A34A' : issueCount > 0 ? '#D97706' : '#CBD5E1';

              return (
                <button
                  key={stepItem.index}
                  type="button"
                  onClick={() => jumpToStep(stepItem.index)}
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 10px 10px 16px',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    background: isActive ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {isActive && (
                    <span style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: 'var(--color-primary)' }} />
                  )}
                  <span style={{ width: '10px', height: '10px', borderRadius: '999px', flexShrink: 0, background: dotColor }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {stepItem.label}
                    </span>
                  </span>
                  <ChevronRight size={12} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0, opacity: 0.7 }} />
                </button>
              );
            })}
          </nav>
        )}

      {/* ── Scrollable body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px 24px',
          background: 'var(--color-bg)',
        }}
      >
        {isNarrow && (
          <div style={{ marginBottom: '18px', maxWidth: '340px' }}>
            <label htmlFor="warehouse-create-step-selector" style={labelBase}>Step</label>
            <select
              id="warehouse-create-step-selector"
              value={String(step)}
              onChange={(event) => jumpToStep(Number(event.target.value))}
              style={inputBase}
            >
              {STEPS.map((stepItem) => {
                const issueCount = getStepIssueCount(stepItem.index);
                return (
                  <option key={stepItem.index} value={stepItem.index}>
                    {stepItem.index + 1}. {stepItem.label}{issueCount > 0 ? ` (${issueCount})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

          {false && (<>
            {step === 0 && 'Name, code, type, and facility reference for this warehouse.'}
            {step === 1 && 'Define who owns this warehouse and which branches can access it.'}
            {step === 2 && 'Choose how inventory will be tracked — warehouse-level or at individual locations/BINs.'}
            {step === 3 &&
              (isWhLevel
                ? 'Warehouse-Level warehouses do not need a location hierarchy.'
                : 'Set up the location hierarchy structure for this warehouse.')}
            {step === 4 && 'Refine level code generation only for the designed levels.'}
            {step === 5 && 'Configure the designed levels in detail before final review.'}
            {step === 6 && 'Review all settings and activate the warehouse or save as draft.'}
          </>)}

        {/* Step content */}
        {step === 0 && renderStep0Modern()}
        {step === 1 && renderStep1Modern()}
        {step === 2 && renderStep2Modern()}
        {step === 3 && renderStep4LevelBuilder()}
        {step === 4 && renderStep3CodeGeneration()}
        {step === 5 && renderStep5LevelConfiguration()}
        {step === 6 && renderStep5()}
      </div>
      </div>

      {/* ── Fixed footer ── */}
      {renderFooter()}

      {levelDrawerState && (
        <WarehouseTemplateLevelDrawer
          open={Boolean(levelDrawerState)}
          mode={levelDrawerState.mode}
          parentLabel={levelDrawerState.parentLabel}
          parentCode={levelDrawerState.parentCode}
          parentLevelCode={levelDrawerState.parentLevelCode}
          levelOptions={templateLevelOptions}
          titleLabel={levelDrawerState.titleLabel}
          initialValue={levelDrawerState.initialValue}
          onClose={() => setLevelDrawerState(null)}
          onSubmit={submitConfiguredLevel}
        />
      )}

      {/* ── Toast ── */}
      {nodeComposerState && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1850,
            background: 'rgba(15, 23, 42, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: 'min(760px, 100%)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.16)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                {nodeComposerState.mode === 'single'
                  ? `Add ${nodeComposerState.childLevelName}`
                  : `Bulk Create ${nodeComposerState.childLevelName}`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Parent: {nodeComposerState.parentLabel} / {nodeComposerState.parentCode}
              </div>
            </div>

            <div style={{ padding: '18px', display: 'grid', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  background: 'var(--color-surface-subtle)',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Next allowed level: <strong style={{ color: 'var(--color-text)' }}>{nodeComposerState.childLevelName}</strong>
              </div>

              {nodeComposerState.mode === 'single' ? (
                <div style={twoCol}>
                  <div>
                    <label style={labelBase}>Node Name</label>
                    <input
                      type="text"
                      value={nodeComposerState.name}
                      onChange={(event) => updateNodeComposerField('name', event.target.value)}
                      style={inputBase}
                      placeholder={`${nodeComposerState.childLevelName} 01`}
                    />
                  </div>
                  <div>
                    <label style={labelBase}>Node Code</label>
                    <input
                      type="text"
                      value={nodeComposerState.code}
                      onChange={(event) => updateNodeComposerField('code', event.target.value.toUpperCase())}
                      style={inputBase}
                      placeholder={nodeComposerState.childLevelCode}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div style={gridThreeComposer}>
                    <div>
                      <label style={labelBase}>How Many</label>
                      <input
                        type="number"
                        min="1"
                        value={nodeComposerState.count}
                        onChange={(event) => updateNodeComposerField('count', event.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Name Prefix</label>
                      <input
                        type="text"
                        value={nodeComposerState.namePrefix}
                        onChange={(event) => updateNodeComposerField('namePrefix', event.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Code Prefix</label>
                      <input
                        type="text"
                        value={nodeComposerState.codePrefix}
                        onChange={(event) => updateNodeComposerField('codePrefix', event.target.value.toUpperCase())}
                        style={inputBase}
                      />
                    </div>
                  </div>
                  <div style={gridFourComposer}>
                    <div>
                      <label style={labelBase}>Start Sequence</label>
                      <input
                        type="number"
                        min="1"
                        value={nodeComposerState.startSequence}
                        onChange={(event) => updateNodeComposerField('startSequence', event.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Sequence Length</label>
                      <input
                        type="number"
                        min="1"
                        value={nodeComposerState.sequenceLength}
                        onChange={(event) => updateNodeComposerField('sequenceLength', event.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Separator</label>
                      <input
                        type="text"
                        value={nodeComposerState.separator}
                        onChange={(event) => updateNodeComposerField('separator', event.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div>
                      <label style={labelBase}>Suffix</label>
                      <input
                        type="text"
                        value={nodeComposerState.suffix}
                        onChange={(event) => updateNodeComposerField('suffix', event.target.value.toUpperCase())}
                        style={inputBase}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button type="button" onClick={() => setNodeComposerState(null)} style={btnOutline}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="button" onClick={submitActualNodeComposer} style={btnPrimary}>
                {nodeComposerState.mode === 'single'
                  ? `Create ${nodeComposerState.childLevelName}`
                  : `Create ${nodeComposerState.childLevelName}s`}
              </button>
            </div>
          </div>
        </div>
      )}

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
      <HelpDrawer
        open={helpOpen}
        topic={getHelpTopic(STEP_HELP_TOPICS[step])}
        onClose={() => setHelpOpen(false)}
      />
      </div>
    </AdminShell>
  );
};

// ─── Helper used in step 4 preset preview ────────────────────────────────────

function current_value_for(key: keyof CreateFormState, state: CreateFormState): unknown {
  return state[key];
}

export default WarehouseCreateWorkspace;
