import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, FolderTree, HelpCircle, MapPinned, Settings, ShieldCheck } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import type { HierarchyTemplate, WarehouseDetails } from '../types/warehouse.types';
import { WarehouseSetupHealth } from '../components/WarehouseSetupHealth';
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge';
import { WarehouseModeBadge } from '../components/WarehouseModeBadge';
import { WAREHOUSE_ROOT_LEVEL_CODE } from '../utils/hierarchyUtils';
import { WarehouseTemplateTreeBuilder } from '../components/WarehouseTemplateTreeBuilder';
import { WarehouseTemplateLevelDrawer } from '../components/WarehouseTemplateLevelDrawer';
import type { WarehouseTemplateLevelDraft, WarehouseTemplateSetupMode, WarehouseTemplateTreeNode } from '../components/warehouseTemplateSetup.types';

type SetupStepKey = 'structure' | 'template' | 'hierarchy' | 'policies' | 'review';
type StructureChoice = 'quick' | 'recommended' | 'copy' | 'custom' | 'later' | '';

const STEPS: Array<{ key: SetupStepKey; label: string }> = [
  { key: 'structure', label: 'Choose Structure' },
  { key: 'template', label: 'Template / Quick Setup' },
  { key: 'hierarchy', label: 'Hierarchy / Locations' },
  { key: 'policies', label: 'Policies' },
  { key: 'review', label: 'Review / Readiness' },
];

const STRUCTURE_OPTIONS: Array<{ key: Exclude<StructureChoice, ''>; label: string; description: string }> = [
  { key: 'quick', label: 'Create hierarchy quickly', description: 'Launch the quick wizard for guided hierarchy bootstrapping.' },
  { key: 'recommended', label: 'Start from recommended template', description: 'Use the recommended structure template as the fastest standard path.' },
  { key: 'copy', label: 'Copy from existing warehouse', description: 'Reuse hierarchy structure from an existing warehouse.' },
  { key: 'custom', label: 'Build custom hierarchy', description: 'Design your own structure and levels from scratch.' },
  { key: 'later', label: 'Configure later', description: 'Leave structure for later and continue maintaining the warehouse as draft or partially configured.' },
];

const TEMPLATE_SETUP_MODES: Array<{ key: WarehouseTemplateSetupMode; label: string }> = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'copy', label: 'Copy Existing' },
  { key: 'custom', label: 'Custom' },
];

function makeNodeId() {
  return `setup-node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeDraftDefaults(mode: WarehouseTemplateSetupMode, depth: number, parentLevelCode: string): WarehouseTemplateLevelDraft {
  if (mode === 'recommended') {
    const sequenceDefaults = [
      { levelName: 'Zone', levelCode: 'ZONE', locationType: 'Zone', role: 'Structural', leafEligible: false },
      { levelName: 'Aisle', levelCode: 'AISLE', locationType: 'Aisle', role: 'Structural', leafEligible: false },
      { levelName: 'Rack', levelCode: 'RACK', locationType: 'Rack', role: 'Structural', leafEligible: false },
      { levelName: 'Shelf', levelCode: 'SHELF', locationType: 'Shelf', role: 'Structural', leafEligible: false },
      { levelName: 'BIN', levelCode: 'BIN', locationType: 'BIN', role: 'InventoryEndpoint', leafEligible: true },
    ] as const;
    const picked = sequenceDefaults[Math.min(Math.max(depth - 1, 0), sequenceDefaults.length - 1)];
    return {
      name: '',
      code: '',
      status: 'Active',
      levelName: picked.levelName,
      levelCode: picked.levelCode,
      description: '',
      role: picked.role,
      locationType: picked.locationType,
      mandatory: true,
      allowSkipLevel: false,
      leafEligible: picked.leafEligible,
      inventoryEndpointEligible: picked.locationType === 'BIN',
      capacityApplicable: picked.locationType === 'BIN',
      itemEligibilityApplicable: picked.locationType === 'BIN',
      responsibilityApplicable: depth <= 2,
      barcodeApplicable: picked.locationType === 'BIN' || picked.locationType === 'Rack',
      qrApplicable: picked.locationType === 'BIN',
      autoGenerateCode: true,
      codePrefix: picked.levelCode,
      startSequence: 1,
      sequenceLength: 3,
      separator: '-',
      suffix: '',
      capacityEnforcementMode: picked.locationType === 'BIN' ? 'HardBlock' : 'None',
      capacityRollupMode: picked.locationType === 'BIN' ? 'OwnCapacityOnly' : 'None',
      defaultResponsibilityRole:
        picked.locationType === 'BIN'
          ? 'BinCustodian'
          : depth === 1
            ? 'ZoneSupervisor'
            : depth <= 3
              ? 'AreaSupervisor'
              : undefined,
      transactionPurposes: picked.locationType === 'BIN' ? ['Storage', 'Putaway', 'Picking'] : ['Storage'],
      allowedParentLevels: [parentLevelCode],
      allowedChildLevels:
        picked.locationType === 'Zone'
          ? ['AISLE', 'BIN']
          : picked.locationType === 'Aisle'
            ? ['RACK']
            : picked.locationType === 'Rack'
            ? ['SHELF', 'BIN']
              : picked.locationType === 'Shelf'
                ? ['BIN']
                : [],
      eligibilityMode: picked.locationType === 'BIN' ? 'Restricted' : 'Open',
      eligibilityDefaultFallback: 'Allow',
      eligibilityRulesSummary: '',
      putawayEnabled: picked.locationType === 'BIN',
      putawayStrategySequence: picked.locationType === 'BIN' ? ['FEFO', 'Nearest-Empty', 'Capacity-Optimised'] : [],
      putawayOverrideAllowed: picked.locationType === 'BIN',
      pickingEnabled: picked.locationType === 'BIN',
      pickingStrategySequence: picked.locationType === 'BIN' ? ['FEFO', 'FIFO', 'Zone-Wave'] : [],
      pickingOverrideAllowed: picked.locationType === 'BIN',
      cycleCountEnabled: picked.locationType === 'BIN',
      cycleCountScope: 'Zone',
      cycleCountFrequency: 'Monthly',
      cycleCountVarianceTolerance: 0,
      cycleCountVarianceUnit: 'Units',
      cycleCountFreezeEnabled: false,
    };
  }

  return {
    name: '',
    code: '',
    status: 'Active',
    levelName: '',
    levelCode: '',
    description: '',
    role: 'Structural',
    locationType: 'General',
    mandatory: false,
    allowSkipLevel: false,
    leafEligible: false,
    inventoryEndpointEligible: false,
    capacityApplicable: false,
    itemEligibilityApplicable: false,
    responsibilityApplicable: false,
    barcodeApplicable: false,
    qrApplicable: false,
    autoGenerateCode: true,
    codePrefix: '',
    startSequence: 1,
    sequenceLength: 3,
    separator: '-',
    suffix: '',
    capacityEnforcementMode: 'None',
    capacityRollupMode: 'None',
    defaultResponsibilityRole: undefined,
    transactionPurposes: ['Storage'],
    allowedParentLevels: [parentLevelCode],
    allowedChildLevels: [],
    eligibilityMode: 'Open',
    eligibilityDefaultFallback: 'Allow',
    eligibilityRulesSummary: '',
    putawayEnabled: false,
    putawayStrategySequence: [],
    putawayOverrideAllowed: false,
    pickingEnabled: false,
    pickingStrategySequence: [],
    pickingOverrideAllowed: false,
    cycleCountEnabled: false,
    cycleCountScope: 'Full',
    cycleCountFrequency: 'Monthly',
    cycleCountVarianceTolerance: 0,
    cycleCountVarianceUnit: 'Units',
    cycleCountFreezeEnabled: false,
  };
}

function draftFromNode(node: WarehouseTemplateTreeNode): WarehouseTemplateLevelDraft {
  return {
    name: node.name,
    code: node.code,
    status: node.status,
    levelName: node.levelName,
    levelCode: node.levelCode,
    description: node.description,
    role: node.role,
    locationType: node.locationType,
    mandatory: node.mandatory,
    allowSkipLevel: node.allowSkipLevel,
    leafEligible: node.leafEligible,
    inventoryEndpointEligible: node.inventoryEndpointEligible,
    capacityApplicable: node.capacityApplicable,
    itemEligibilityApplicable: node.itemEligibilityApplicable,
    responsibilityApplicable: node.responsibilityApplicable,
    barcodeApplicable: node.barcodeApplicable,
    qrApplicable: node.qrApplicable,
    autoGenerateCode: node.autoGenerateCode,
    codePrefix: node.codePrefix,
    startSequence: node.startSequence,
    sequenceLength: node.sequenceLength,
    separator: node.separator,
    suffix: node.suffix,
    capacityEnforcementMode: node.capacityEnforcementMode,
    capacityRollupMode: node.capacityRollupMode,
    defaultResponsibilityRole: node.defaultResponsibilityRole,
    transactionPurposes: node.transactionPurposes,
    allowedParentLevels: node.allowedParentLevels,
    allowedChildLevels: node.allowedChildLevels,
    eligibilityMode: node.eligibilityMode,
    eligibilityDefaultFallback: node.eligibilityDefaultFallback,
    eligibilityRulesSummary: node.eligibilityRulesSummary,
    putawayEnabled: node.putawayEnabled,
    putawayStrategySequence: node.putawayStrategySequence,
    putawayOverrideAllowed: node.putawayOverrideAllowed,
    pickingEnabled: node.pickingEnabled,
    pickingStrategySequence: node.pickingStrategySequence,
    pickingOverrideAllowed: node.pickingOverrideAllowed,
    cycleCountEnabled: node.cycleCountEnabled,
    cycleCountScope: node.cycleCountScope,
    cycleCountFrequency: node.cycleCountFrequency,
    cycleCountVarianceTolerance: node.cycleCountVarianceTolerance,
    cycleCountVarianceUnit: node.cycleCountVarianceUnit,
    cycleCountFreezeEnabled: node.cycleCountFreezeEnabled,
  };
}

function buildTemplateTree(template?: HierarchyTemplate): WarehouseTemplateTreeNode[] {
  if (!template) return [];

  const map = new Map<string, WarehouseTemplateTreeNode>();
  const sortedLevels = [...template.levels].sort((left, right) => left.sequence - right.sequence || left.levelCode.localeCompare(right.levelCode));

  sortedLevels.forEach((level) => {
    map.set(level.levelCode, {
      id: level.levelId ?? `template-level-${level.levelCode}`,
      parentId: 'root',
      name: level.levelName,
      code: level.levelCode,
      status: template.status === 'Active' ? 'Active' : 'Draft',
      levelName: level.levelName,
      levelCode: level.levelCode,
      description: level.description ?? '',
      role: level.defaultLocationRole ?? level.levelRole ?? 'Structural',
      locationType: level.defaultLocationType ?? 'General',
      mandatory: level.mandatory,
      allowSkipLevel: level.allowSkipLevel,
      leafEligible: level.leafEligible,
      inventoryEndpointEligible: level.inventoryEndpointEligible ?? false,
      capacityApplicable: level.capacityApplicable ?? false,
      itemEligibilityApplicable: level.itemEligibilityApplicable ?? false,
      responsibilityApplicable: level.responsibilityApplicable ?? false,
      barcodeApplicable: level.barcodeApplicable ?? false,
      qrApplicable: level.qrApplicable ?? false,
      autoGenerateCode: level.autoGenerateCode ?? true,
      codePrefix: level.codePrefix ?? level.levelCode,
      startSequence: level.startSequence ?? 1,
      sequenceLength: level.sequenceLength ?? 3,
      separator: level.separator ?? '-',
      suffix: level.suffix ?? '',
      capacityEnforcementMode: level.capacityEnforcementMode ?? 'None',
      capacityRollupMode: level.capacityRollupMode ?? 'None',
      defaultResponsibilityRole: level.defaultResponsibilityRole,
      transactionPurposes: level.transactionPurposes ?? ['Storage'],
      allowedParentLevels: level.allowedParentLevels ?? [],
      allowedChildLevels: level.allowedChildLevels ?? [],
      eligibilityMode: level.itemEligibilityApplicable ? 'Restricted' : 'Open',
      eligibilityDefaultFallback: 'Allow',
      eligibilityRulesSummary: '',
      putawayEnabled: (level.transactionPurposes ?? []).includes('Putaway'),
      putawayStrategySequence: (level.transactionPurposes ?? []).includes('Putaway') ? ['FEFO', 'Nearest-Empty', 'Capacity-Optimised'] : [],
      putawayOverrideAllowed: (level.transactionPurposes ?? []).includes('Putaway'),
      pickingEnabled: (level.transactionPurposes ?? []).includes('Picking'),
      pickingStrategySequence: (level.transactionPurposes ?? []).includes('Picking') ? ['FEFO', 'FIFO', 'Zone-Wave'] : [],
      pickingOverrideAllowed: (level.transactionPurposes ?? []).includes('Picking'),
      cycleCountEnabled: false,
      cycleCountScope: 'Zone',
      cycleCountFrequency: 'Monthly',
      cycleCountVarianceTolerance: 0,
      cycleCountVarianceUnit: 'Units',
      cycleCountFreezeEnabled: false,
      children: [],
    });
  });

  const roots: WarehouseTemplateTreeNode[] = [];

  sortedLevels.forEach((level) => {
    const current = map.get(level.levelCode);
    if (!current) return;
    const parentLevelCode = (level.allowedParentLevels ?? []).find((candidate) => candidate && candidate !== WAREHOUSE_ROOT_LEVEL_CODE);
    if (!parentLevelCode) {
      roots.push(current);
      return;
    }
    const parent = map.get(parentLevelCode);
    if (!parent) {
      roots.push(current);
      return;
    }
    (parent.children as WarehouseTemplateTreeNode[]).push({ ...current, parentId: parent.id });
  });

  return roots;
}

function findTreeNode(nodes: WarehouseTemplateTreeNode[], nodeId: string): WarehouseTemplateTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const childMatch = findTreeNode(node.children, nodeId);
    if (childMatch) return childMatch;
  }
  return null;
}

function addChildNode(nodes: WarehouseTemplateTreeNode[], parentId: string, child: WarehouseTemplateTreeNode): WarehouseTemplateTreeNode[] {
  if (parentId === 'root') {
    return [...nodes, child];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    return { ...node, children: addChildNode(node.children, parentId, child) };
  });
}

function updateTreeNode(nodes: WarehouseTemplateTreeNode[], nodeId: string, nextDraft: WarehouseTemplateLevelDraft): WarehouseTemplateTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        name: nextDraft.name,
        code: nextDraft.code,
        status: nextDraft.status,
        levelName: nextDraft.levelName,
        levelCode: nextDraft.levelCode,
        description: nextDraft.description,
        role: nextDraft.role,
        locationType: nextDraft.locationType,
        mandatory: nextDraft.mandatory,
        allowSkipLevel: nextDraft.allowSkipLevel,
        leafEligible: nextDraft.leafEligible,
        inventoryEndpointEligible: nextDraft.inventoryEndpointEligible,
        capacityApplicable: nextDraft.capacityApplicable,
        itemEligibilityApplicable: nextDraft.itemEligibilityApplicable,
        responsibilityApplicable: nextDraft.responsibilityApplicable,
        barcodeApplicable: nextDraft.barcodeApplicable,
        qrApplicable: nextDraft.qrApplicable,
        autoGenerateCode: nextDraft.autoGenerateCode,
        codePrefix: nextDraft.codePrefix,
        startSequence: nextDraft.startSequence,
        sequenceLength: nextDraft.sequenceLength,
        separator: nextDraft.separator,
        suffix: nextDraft.suffix,
        capacityEnforcementMode: nextDraft.capacityEnforcementMode,
        capacityRollupMode: nextDraft.capacityRollupMode,
        defaultResponsibilityRole: nextDraft.defaultResponsibilityRole,
        transactionPurposes: nextDraft.transactionPurposes,
        allowedParentLevels: nextDraft.allowedParentLevels,
        allowedChildLevels: nextDraft.allowedChildLevels,
        eligibilityMode: nextDraft.eligibilityMode,
        eligibilityDefaultFallback: nextDraft.eligibilityDefaultFallback,
        eligibilityRulesSummary: nextDraft.eligibilityRulesSummary,
        putawayEnabled: nextDraft.putawayEnabled,
        putawayStrategySequence: nextDraft.putawayStrategySequence,
        putawayOverrideAllowed: nextDraft.putawayOverrideAllowed,
        pickingEnabled: nextDraft.pickingEnabled,
        pickingStrategySequence: nextDraft.pickingStrategySequence,
        pickingOverrideAllowed: nextDraft.pickingOverrideAllowed,
        cycleCountEnabled: nextDraft.cycleCountEnabled,
        cycleCountScope: nextDraft.cycleCountScope,
        cycleCountFrequency: nextDraft.cycleCountFrequency,
        cycleCountVarianceTolerance: nextDraft.cycleCountVarianceTolerance,
        cycleCountVarianceUnit: nextDraft.cycleCountVarianceUnit,
        cycleCountFreezeEnabled: nextDraft.cycleCountFreezeEnabled,
      };
    }
    return { ...node, children: updateTreeNode(node.children, nodeId, nextDraft) };
  });
}

function getNodeDepth(nodes: WarehouseTemplateTreeNode[], nodeId: string, depth = 1): number {
  for (const node of nodes) {
    if (node.id === nodeId) return depth;
    const childDepth = getNodeDepth(node.children, nodeId, depth + 1);
    if (childDepth > 0) return childDepth;
  }
  return 0;
}

function collectLevelOptions(nodes: WarehouseTemplateTreeNode[]): string[] {
  const all = new Set<string>([WAREHOUSE_ROOT_LEVEL_CODE]);
  const visit = (items: WarehouseTemplateTreeNode[]) => {
    items.forEach((node) => {
      if (node.levelCode) all.add(node.levelCode);
      if (node.children.length > 0) visit(node.children);
    });
  };
  visit(nodes);
  return Array.from(all);
}

function deriveInitialStep(details: WarehouseDetails): number {
  const hasActiveTemplate = details.hierarchyTemplates.some((template) => template.status === 'Active');
  const hasLocations = details.locations.length > 0;
  if (!hasActiveTemplate) return 0;
  if (!hasLocations) return 2;
  if (details.setupHealth.overallTone !== 'complete') return 3;
  return 4;
}

const WarehouseSetupFlowPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [structureChoice, setStructureChoice] = useState<StructureChoice>('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [templateSetupMode, setTemplateSetupMode] = useState<WarehouseTemplateSetupMode>('recommended');
  const [templateTreeNodes, setTemplateTreeNodes] = useState<WarehouseTemplateTreeNode[]>([]);
  const [expandedTemplateNodeIds, setExpandedTemplateNodeIds] = useState<Set<string>>(new Set(['root']));
  const [drawerState, setDrawerState] = useState<{
    mode: 'create' | 'edit';
    parentId: string;
    parentLabel: string;
    parentCode: string;
    parentLevelCode: string;
    titleLabel: string;
    initialValue: WarehouseTemplateLevelDraft;
    editNodeId?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      if (!warehouseId) return;
      setLoading(true);
      try {
        const next = await warehouseMockAdapter.getWarehouse(warehouseId);
        setDetails(next);
        setStep(deriveInitialStep(next));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load warehouse setup.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [warehouseId]);

  const activeTemplate = useMemo(
    () => details?.hierarchyTemplates.find((template) => template.status === 'Active'),
    [details],
  );

  useEffect(() => {
    const nextNodes = buildTemplateTree(activeTemplate);
    setTemplateTreeNodes(nextNodes);
    setExpandedTemplateNodeIds(new Set(['root', ...nextNodes.map((node) => node.id)]));
  }, [activeTemplate?.id, warehouseId]);

  const setupStats = useMemo(() => {
    if (!details) return null;
    return {
      templateCount: details.hierarchyTemplates.length,
      locationCount: details.locations.length,
      blockingIssues: details.setupHealth.blockingIssues?.length ?? 0,
      setupTone: details.setupHealth.overallTone,
    };
  }, [details]);

  const levelOptions = useMemo(() => collectLevelOptions(templateTreeNodes), [templateTreeNodes]);

  function goToStep(nextStep: number) {
    setStep(Math.max(0, Math.min(nextStep, STEPS.length - 1)));
  }

  function openCreateLevel(parentId: string) {
    if (!details) return;
    const parentNode = parentId === 'root' ? null : findTreeNode(templateTreeNodes, parentId);
    const nextDepth = parentId === 'root' ? 1 : getNodeDepth(templateTreeNodes, parentId) + 1;
    const parentLevelCode = parentNode?.levelCode ?? WAREHOUSE_ROOT_LEVEL_CODE;
    const defaults = makeDraftDefaults(templateSetupMode, nextDepth, parentLevelCode);
    setDrawerState({
      mode: 'create',
      parentId,
      parentLabel: parentNode?.name ?? details.warehouse.warehouseName,
      parentCode: parentNode?.code ?? details.warehouse.warehouseCode,
      parentLevelCode,
      titleLabel: defaults.levelName || 'Level',
      initialValue: defaults,
    });
  }

  function openEditLevel(nodeId: string) {
    const targetNode = findTreeNode(templateTreeNodes, nodeId);
    if (!targetNode) return;
    const parentNode = targetNode.parentId === 'root' ? null : findTreeNode(templateTreeNodes, targetNode.parentId);
    setDrawerState({
      mode: 'edit',
      parentId: targetNode.parentId,
      parentLabel: parentNode?.name ?? details?.warehouse.warehouseName ?? 'Warehouse',
      parentCode: parentNode?.code ?? details?.warehouse.warehouseCode ?? '',
      parentLevelCode: parentNode?.levelCode ?? WAREHOUSE_ROOT_LEVEL_CODE,
      titleLabel: targetNode.levelName || targetNode.name,
      initialValue: draftFromNode(targetNode),
      editNodeId: targetNode.id,
    });
  }

  function submitLevelDrawer(nextDraft: WarehouseTemplateLevelDraft) {
    if (!drawerState) return;
    if (drawerState.mode === 'create') {
      const nextNode: WarehouseTemplateTreeNode = {
        id: makeNodeId(),
        parentId: drawerState.parentId,
        name: nextDraft.name,
        code: nextDraft.code,
        status: nextDraft.status,
        levelName: nextDraft.levelName,
        levelCode: nextDraft.levelCode,
        description: nextDraft.description,
        role: nextDraft.role,
        locationType: nextDraft.locationType,
        mandatory: nextDraft.mandatory,
        allowSkipLevel: nextDraft.allowSkipLevel,
        leafEligible: nextDraft.leafEligible,
        inventoryEndpointEligible: nextDraft.inventoryEndpointEligible,
        capacityApplicable: nextDraft.capacityApplicable,
        itemEligibilityApplicable: nextDraft.itemEligibilityApplicable,
        responsibilityApplicable: nextDraft.responsibilityApplicable,
        barcodeApplicable: nextDraft.barcodeApplicable,
        qrApplicable: nextDraft.qrApplicable,
        autoGenerateCode: nextDraft.autoGenerateCode,
        codePrefix: nextDraft.codePrefix,
        startSequence: nextDraft.startSequence,
        sequenceLength: nextDraft.sequenceLength,
        separator: nextDraft.separator,
        suffix: nextDraft.suffix,
        capacityEnforcementMode: nextDraft.capacityEnforcementMode,
        capacityRollupMode: nextDraft.capacityRollupMode,
        defaultResponsibilityRole: nextDraft.defaultResponsibilityRole,
        transactionPurposes: nextDraft.transactionPurposes,
        allowedParentLevels: nextDraft.allowedParentLevels,
        allowedChildLevels: nextDraft.allowedChildLevels,
        eligibilityMode: nextDraft.eligibilityMode,
        eligibilityDefaultFallback: nextDraft.eligibilityDefaultFallback,
        eligibilityRulesSummary: nextDraft.eligibilityRulesSummary,
        putawayEnabled: nextDraft.putawayEnabled,
        putawayStrategySequence: nextDraft.putawayStrategySequence,
        putawayOverrideAllowed: nextDraft.putawayOverrideAllowed,
        pickingEnabled: nextDraft.pickingEnabled,
        pickingStrategySequence: nextDraft.pickingStrategySequence,
        pickingOverrideAllowed: nextDraft.pickingOverrideAllowed,
        cycleCountEnabled: nextDraft.cycleCountEnabled,
        cycleCountScope: nextDraft.cycleCountScope,
        cycleCountFrequency: nextDraft.cycleCountFrequency,
        cycleCountVarianceTolerance: nextDraft.cycleCountVarianceTolerance,
        cycleCountVarianceUnit: nextDraft.cycleCountVarianceUnit,
        cycleCountFreezeEnabled: nextDraft.cycleCountFreezeEnabled,
        children: [],
      };
      setTemplateTreeNodes((current) => addChildNode(current, drawerState.parentId, nextNode));
      setExpandedTemplateNodeIds((current) => new Set([...current, 'root', drawerState.parentId]));
    } else if (drawerState.editNodeId) {
      setTemplateTreeNodes((current) => updateTreeNode(current, drawerState.editNodeId!, nextDraft));
    }
    setDrawerState(null);
  }

  function renderStepContent() {
    if (!details) return null;

    switch (STEPS[step].key) {
      case 'structure':
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={panelCard}>
              <div style={panelHead}>
                <span style={panelTitle}>Choose Structure</span>
                <span style={panelHint}>Start with the structure path that best matches how this warehouse will be operated.</span>
              </div>
              <div style={panelBody}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  {STRUCTURE_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '14px 16px',
                        border: `2px solid ${structureChoice === option.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: '12px',
                        background: structureChoice === option.key ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="warehouse-setup-structure-choice"
                        checked={structureChoice === option.key}
                        onChange={() => setStructureChoice(option.key)}
                        style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{option.label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'template':
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={panelCard}>
              <div style={panelHead}>
                <span style={panelTitle}>Template / Quick Setup</span>
                <span style={panelHint}>Build the structure directly here using a simple nested tree, then continue with hierarchy and location setup.</span>
              </div>
              <div style={panelBody}>
                <div style={modeStrip}>
                  {TEMPLATE_SETUP_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setTemplateSetupMode(mode.key)}
                      style={{
                        ...modeBtn,
                        background: templateSetupMode === mode.key ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : 'var(--color-surface)',
                        borderColor: templateSetupMode === mode.key ? 'var(--color-primary)' : 'var(--color-border)',
                        color: templateSetupMode === mode.key ? 'var(--color-primary)' : 'var(--color-text)',
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <div style={infoStrip}>
                  Active template: <strong>{activeTemplate ? `${activeTemplate.templateName} v${activeTemplate.currentVersion.versionNumber}` : 'None'}</strong>
                </div>
                {templateSetupMode === 'recommended' && (
                  <div style={builderInfoStrip}>
                    Recommended mode pre-fills common warehouse levels like Zone, Aisle, Rack, Shelf, and BIN as you add deeper levels.
                  </div>
                )}
                {templateSetupMode === 'copy' && (
                  <div style={{ ...builderInfoStrip, background: '#FFF7ED', borderColor: '#FED7AA', color: '#9A3412' }}>
                    Copy Existing mode is prepared here, but source selection is not connected in this pass. You can still continue building the structure manually below.
                  </div>
                )}
                {templateSetupMode === 'custom' && (
                  <div style={builderInfoStrip}>
                    Custom mode starts blank so you can define each level exactly the way you want.
                  </div>
                )}
                <WarehouseTemplateTreeBuilder
                  warehouseName={details.warehouse.warehouseName}
                  warehouseCode={details.warehouse.warehouseCode}
                  nodes={templateTreeNodes}
                  expandedIds={expandedTemplateNodeIds}
                  onToggle={(nodeId) => setExpandedTemplateNodeIds((current) => {
                    const next = new Set(current);
                    if (next.has(nodeId)) next.delete(nodeId);
                    else next.add(nodeId);
                    return next;
                  })}
                  onAdd={openCreateLevel}
                  onEdit={openEditLevel}
                />
              </div>
            </div>
          </div>
        );
      case 'hierarchy':
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={panelCard}>
              <div style={panelHead}>
                <span style={panelTitle}>Hierarchy / Locations</span>
                <span style={panelHint}>Continue creating actual nodes and location records in the existing operational workspaces.</span>
              </div>
              <div style={panelBody}>
                <div style={actionGrid}>
                  <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.hierarchy(details.warehouse.id))} style={actionCard}>
                    <FolderTree size={16} />
                    <span>Manage Hierarchy</span>
                  </button>
                  <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.locations(details.warehouse.id))} style={actionCard}>
                    <MapPinned size={16} />
                    <span>Manage Locations</span>
                  </button>
                </div>
                <div style={infoStrip}>
                  Current nodes / locations: <strong>{details.locations.length}</strong>
                </div>
              </div>
            </div>
          </div>
        );
      case 'policies':
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={panelCard}>
              <div style={panelHead}>
                <span style={panelTitle}>Policies</span>
                <span style={panelHint}>Maintain branch access, inventory control, defaults, putaway, picking, and governance from the configuration workspace.</span>
              </div>
              <div style={panelBody}>
                <div style={actionGrid}>
                  <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.configuration(details.warehouse.id))} style={actionCard}>
                    <Settings size={16} />
                    <span>Open Configuration Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'review':
      default:
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={panelCard}>
              <div style={panelHead}>
                <span style={panelTitle}>Review / Readiness</span>
                <span style={panelHint}>Check setup health, then continue refining hierarchy or policies where needed.</span>
              </div>
              <div style={panelBody}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={statCard}><span style={statLabel}>Setup Health</span><WarehouseSetupHealth tone={details.setupHealth.overallTone} /></div>
                  <div style={statCard}><span style={statLabel}>Templates</span><strong>{setupStats?.templateCount ?? 0}</strong></div>
                  <div style={statCard}><span style={statLabel}>Locations</span><strong>{setupStats?.locationCount ?? 0}</strong></div>
                  <div style={statCard}><span style={statLabel}>Blocking Issues</span><strong>{setupStats?.blockingIssues ?? 0}</strong></div>
                </div>
                <div style={actionGrid}>
                  <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.configuration(details.warehouse.id))} style={actionCard}>
                    <ShieldCheck size={16} />
                    <span>Review Readiness</span>
                  </button>
                  <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.audit(details.warehouse.id))} style={actionCard}>
                    <CheckCircle2 size={16} />
                    <span>View Audit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }

  const nextDisabled = STEPS[step].key === 'structure' && !structureChoice;

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.list)} style={ghostBtn}>
            <ArrowLeft size={14} /> Back to List
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
                {details?.warehouse.warehouseName ?? 'Warehouse Setup'}
              </h1>
              {details && <WarehouseStatusBadge status={details.warehouse.status} size="sm" />}
              {details && <WarehouseModeBadge mode={details.warehouse.inventoryControlMode} size="sm" />}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Continue structure, hierarchy, locations, and policy setup after the warehouse record has been created.
            </p>
          </div>
          <button type="button" onClick={() => setHelpOpen(true)} style={outlineBtn}>
            <HelpCircle size={14} /> How this works
          </button>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <aside
            aria-label="Warehouse setup steps"
            style={{
              width: '188px',
              flexShrink: 0,
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              overflowY: 'auto',
              paddingTop: '8px',
            }}
          >
            {STEPS.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToStep(index)}
                aria-current={step === index ? 'step' : undefined}
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 10px 10px 16px',
                  background: step === index ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {step === index && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '8px',
                      bottom: '8px',
                      width: '3px',
                      borderRadius: '0 3px 3px 0',
                      background: 'var(--color-primary)',
                    }}
                  />
                )}
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '999px',
                    background: step === index ? 'var(--color-primary)' : 'var(--color-border-strong)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: step === index ? 700 : 500,
                      color: step === index ? 'var(--color-primary)' : 'var(--color-text)',
                    }}
                  >
                    {item.label}
                  </span>
                </span>
                <ChevronRight
                  size={12}
                  style={{
                    marginLeft: 'auto',
                    color: step === index ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    flexShrink: 0,
                    opacity: 0.7,
                  }}
                />
              </button>
            ))}
          </aside>

          <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
            {loading ? (
              <div style={infoStrip}>Loading warehouse setup...</div>
            ) : error ? (
              <div style={{ ...infoStrip, borderColor: '#FCA5A5', background: '#FEF2F2', color: '#991B1B' }}>{error}</div>
            ) : details ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <WarehouseSetupHealth tone={details.setupHealth.overallTone} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Warehouse Code: <strong style={{ color: 'var(--color-text)' }}>{details.warehouse.warehouseCode}</strong>
                  </span>
                </div>
                {renderStepContent()}
              </>
            ) : null}
          </main>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <button type="button" onClick={() => goToStep(step - 1)} disabled={step === 0} style={outlineBtnDisabled(step === 0)}>
            <ArrowLeft size={14} /> Back
          </button>
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            disabled={step === STEPS.length - 1 || nextDisabled}
            style={primaryBtnDisabled(step === STEPS.length - 1 || nextDisabled)}
          >
            Continue <ArrowRight size={14} />
          </button>
        </footer>
      </div>

      {drawerState && (
        <WarehouseTemplateLevelDrawer
          open={Boolean(drawerState)}
          mode={drawerState.mode}
          parentLabel={drawerState.parentLabel}
          parentCode={drawerState.parentCode}
          parentLevelCode={drawerState.parentLevelCode}
          levelOptions={levelOptions}
          titleLabel={drawerState.titleLabel}
          initialValue={drawerState.initialValue}
          onClose={() => setDrawerState(null)}
          onSubmit={submitLevelDrawer}
        />
      )}

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} topic={getHelpTopic('warehouse-master-overview')} />
    </AdminShell>
  );
};

const panelCard: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  background: 'var(--color-surface)',
  overflow: 'hidden',
};

const panelHead: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderBottom: '1px solid var(--color-border)',
};

const panelTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' };
const panelHint: React.CSSProperties = { fontSize: '11px', color: 'var(--color-text-muted)' };
const panelBody: React.CSSProperties = { padding: '16px' };

const actionGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
};

const actionCard: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '44px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const modeStrip: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '14px',
};

const modeBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 700,
};

const infoStrip: React.CSSProperties = {
  marginTop: '14px',
  padding: '10px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  background: 'var(--color-surface-subtle)',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
};

const builderInfoStrip: React.CSSProperties = {
  marginBottom: '14px',
  padding: '10px 12px',
  border: '1px solid #BFDBFE',
  borderRadius: '10px',
  background: '#EFF6FF',
  fontSize: '12px',
  color: '#1D4ED8',
};

const statCard: React.CSSProperties = {
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  background: 'var(--color-surface-subtle)',
  display: 'grid',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--color-text)',
};

const statLabel: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const outlineBtn: React.CSSProperties = {
  ...ghostBtn,
  background: 'var(--color-surface)',
};

function outlineBtnDisabled(disabled: boolean): React.CSSProperties {
  return {
    ...outlineBtn,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function primaryBtnDisabled(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--color-primary)',
    color: 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    opacity: disabled ? 0.5 : 1,
  };
}

export default WarehouseSetupFlowPage;
