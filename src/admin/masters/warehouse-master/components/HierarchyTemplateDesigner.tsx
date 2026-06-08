import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, X } from 'lucide-react';
import {
  activateHierarchyTemplateMock,
  createHierarchyTemplateMock,
  updateHierarchyTemplateStatusMock,
} from '../services/warehouseMockAdapter';
import type { CreateHierarchyTemplateInput } from '../types/warehouse.dto';
import type {
  CapacityEnforcementMode,
  CapacityRollupMode,
  HierarchyLevelRole,
  LocationTransactionPurpose,
  ResponsibilityRole,
} from '../types/warehouse.enums';
import type { HierarchyLevel, HierarchyTemplate } from '../types/warehouse.types';
import {
  buildLevelGeneratedCodeExample,
  buildTemplateIdentifierExamples,
  buildTemplatePathPreviews,
  validateTemplateLevelTree,
} from '../utils/hierarchyUtils';
import { hasHierarchyTemplateFieldErrors, validateHierarchyTemplateForSave } from '../validation/hierarchyValidation';

const ROOT_PARENT = 'WAREHOUSE';
const CAPACITY_ENFORCEMENT_OPTIONS: CapacityEnforcementMode[] = ['None', 'Informational', 'Warning', 'HardBlock', 'ApprovalRequired'];
const CAPACITY_ROLLUP_OPTIONS: CapacityRollupMode[] = ['None', 'OwnCapacityOnly', 'RollupFromChildren', 'SharedParentPool'];
const RESPONSIBILITY_ROLES: ResponsibilityRole[] = ['WarehouseManager', 'ZoneSupervisor', 'AreaSupervisor', 'RackCustodian', 'BinCustodian', 'Custom'];
const LEVEL_ROLES: HierarchyLevelRole[] = ['Structural', 'InventoryEndpoint', 'Picking', 'Staging', 'Dock', 'QC', 'Returns', 'Damage', 'Scrap', 'Yard', 'Reporting', 'Custom'];
const TRANSACTION_PURPOSES: LocationTransactionPurpose[] = ['Storage', 'Putaway', 'Picking', 'Staging', 'Dock', 'QC', 'Returns', 'Damage', 'Scrap', 'Replenishment', 'Dispatch', 'Count', 'Inspection', 'Custom'];

type TemplateSource = 'System' | 'UserDefined' | 'Imported' | 'Cloned';
type TemplateScope = 'Warehouse' | 'Organization';

interface DesignerState {
  templateCode: string;
  templateName: string;
  templateSource: TemplateSource;
  templateScope: TemplateScope;
  versionNumber: string;
  changeDescription: string;
  flexiblePathEnabled: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  defaultPathSeparator: string;
  includeWarehouseCodeInIdentifier: boolean;
  defaultSequenceLength: string;
  manualNodeCodeAllowed: boolean;
  autoGenerateNodeCodeAllowed: boolean;
  codeLockedAfterActivation: boolean;
  levels: HierarchyLevel[];
}

interface TemplatePreset {
  id: string;
  label: string;
  description: string;
  templateSource: TemplateSource;
  flexiblePathEnabled: boolean;
  levels: HierarchyLevel[];
}

function makeLevel(input: Partial<HierarchyLevel> & Pick<HierarchyLevel, 'levelCode' | 'levelName' | 'sequence'>): HierarchyLevel {
  return {
    mandatory: true,
    leafEligible: false,
    allowSkipLevel: false,
    allowedParentLevels: [],
    allowedChildLevels: [],
    inventoryEndpointEligible: false,
    capacityApplicable: false,
    itemEligibilityApplicable: false,
    responsibilityApplicable: true,
    barcodeApplicable: false,
    qrApplicable: false,
    transactionPurposes: ['Storage'],
    capacityEnforcementMode: 'None',
    capacityRollupMode: 'None',
    defaultResponsibilityRole: 'AreaSupervisor',
    levelRole: 'Structural',
    autoGenerateCode: true,
    codePrefix: input.levelCode,
    startSequence: 1,
    sequenceLength: 3,
    separator: '-',
    suffix: '',
    ...input,
  };
}

function makeDefaultLevel(sequence: number): HierarchyLevel {
  const levels = [
    makeLevel({ levelCode: 'ZONE', levelName: 'Zone', sequence: 1, allowedParentLevels: [ROOT_PARENT], allowedChildLevels: ['AISLE', 'BIN'], defaultResponsibilityRole: 'ZoneSupervisor' }),
    makeLevel({ levelCode: 'AISLE', levelName: 'Aisle', sequence: 2, allowedParentLevels: ['ZONE'], allowedChildLevels: ['RACK'] }),
    makeLevel({ levelCode: 'RACK', levelName: 'Rack', sequence: 3, allowedParentLevels: ['AISLE'], allowedChildLevels: ['BIN'], capacityApplicable: true, barcodeApplicable: true, defaultResponsibilityRole: 'RackCustodian', capacityEnforcementMode: 'Warning', capacityRollupMode: 'RollupFromChildren' }),
    makeLevel({ levelCode: 'BIN', levelName: 'BIN', sequence: 4, leafEligible: true, allowedParentLevels: [ROOT_PARENT, 'ZONE', 'RACK'], inventoryEndpointEligible: true, capacityApplicable: true, itemEligibilityApplicable: true, barcodeApplicable: true, qrApplicable: true, defaultResponsibilityRole: 'BinCustodian', levelRole: 'InventoryEndpoint', transactionPurposes: ['Storage', 'Putaway', 'Picking'], capacityEnforcementMode: 'HardBlock', capacityRollupMode: 'OwnCapacityOnly' }),
  ];
  return { ...levels[Math.min(sequence - 1, levels.length - 1)], sequence };
}

const PRESETS: TemplatePreset[] = [
  {
    id: 'simple-root-bin',
    label: 'Simple Root BIN',
    description: 'Single-level endpoint structure for compact warehouses.',
    templateSource: 'System',
    flexiblePathEnabled: true,
    levels: [makeLevel({ levelCode: 'BIN', levelName: 'BIN', sequence: 1, leafEligible: true, allowedParentLevels: [ROOT_PARENT], inventoryEndpointEligible: true, capacityApplicable: true, itemEligibilityApplicable: true, barcodeApplicable: true, qrApplicable: true, defaultResponsibilityRole: 'BinCustodian', levelRole: 'InventoryEndpoint' })],
  },
  {
    id: 'std-zone-rack-bin',
    label: 'Standard Distribution',
    description: 'Zone -> Aisle -> Rack -> BIN with optional root BIN path.',
    templateSource: 'System',
    flexiblePathEnabled: true,
    levels: [makeDefaultLevel(1), makeDefaultLevel(2), makeDefaultLevel(3), makeDefaultLevel(4)],
  },
  {
    id: 'floor-room-shelf',
    label: 'Floor Room Shelf',
    description: 'Floor -> Room -> Shelf -> BIN hierarchy.',
    templateSource: 'System',
    flexiblePathEnabled: false,
    levels: [
      makeLevel({ levelCode: 'FLR', levelName: 'Floor', sequence: 1, allowedParentLevels: [ROOT_PARENT], allowedChildLevels: ['ROOM'], codePrefix: 'F' }),
      makeLevel({ levelCode: 'ROOM', levelName: 'Room', sequence: 2, allowedParentLevels: ['FLR'], allowedChildLevels: ['SHLF'], codePrefix: 'R' }),
      makeLevel({ levelCode: 'SHLF', levelName: 'Shelf', sequence: 3, allowedParentLevels: ['ROOM'], allowedChildLevels: ['BIN'], codePrefix: 'S', capacityApplicable: true }),
      makeLevel({ levelCode: 'BIN', levelName: 'BIN', sequence: 4, allowedParentLevels: ['SHLF'], leafEligible: true, inventoryEndpointEligible: true, itemEligibilityApplicable: true, capacityApplicable: true, levelRole: 'InventoryEndpoint', codePrefix: 'B' }),
    ],
  },
  {
    id: 'yard-lane-bay',
    label: 'Yard Lane Bay',
    description: 'Yard -> Lane -> Bay -> BIN hierarchy.',
    templateSource: 'System',
    flexiblePathEnabled: false,
    levels: [
      makeLevel({ levelCode: 'YARD', levelName: 'Yard', sequence: 1, allowedParentLevels: [ROOT_PARENT], allowedChildLevels: ['LANE'], levelRole: 'Yard', codePrefix: 'Y' }),
      makeLevel({ levelCode: 'LANE', levelName: 'Lane', sequence: 2, allowedParentLevels: ['YARD'], allowedChildLevels: ['BAY'], levelRole: 'Yard', codePrefix: 'L' }),
      makeLevel({ levelCode: 'BAY', levelName: 'Bay', sequence: 3, allowedParentLevels: ['LANE'], allowedChildLevels: ['BIN'], levelRole: 'Staging', codePrefix: 'BA', capacityApplicable: true }),
      makeLevel({ levelCode: 'BIN', levelName: 'BIN', sequence: 4, allowedParentLevels: ['BAY'], leafEligible: true, inventoryEndpointEligible: true, itemEligibilityApplicable: true, capacityApplicable: true, levelRole: 'InventoryEndpoint', codePrefix: 'B' }),
    ],
  },
  {
    id: 'cold-room-chamber-position',
    label: 'Cold Room Chamber Position',
    description: 'Cold room -> Chamber -> Position hierarchy.',
    templateSource: 'System',
    flexiblePathEnabled: false,
    levels: [
      makeLevel({ levelCode: 'COLD', levelName: 'Cold Room', sequence: 1, allowedParentLevels: [ROOT_PARENT], allowedChildLevels: ['CHMBR'], codePrefix: 'C' }),
      makeLevel({ levelCode: 'CHMBR', levelName: 'Chamber', sequence: 2, allowedParentLevels: ['COLD'], allowedChildLevels: ['POS'], codePrefix: 'CH' }),
      makeLevel({ levelCode: 'POS', levelName: 'Position', sequence: 3, allowedParentLevels: ['CHMBR'], leafEligible: true, inventoryEndpointEligible: true, itemEligibilityApplicable: true, capacityApplicable: true, levelRole: 'InventoryEndpoint', codePrefix: 'P' }),
    ],
  },
];

function makeInitialState(template?: HierarchyTemplate): DesignerState {
  if (template) {
    return {
      templateCode: template.templateCode,
      templateName: template.templateName,
      templateSource: template.templateSource ?? 'UserDefined',
      templateScope: template.templateScope ?? 'Warehouse',
      versionNumber: String(template.currentVersion.versionNumber + 1),
      changeDescription: '',
      flexiblePathEnabled: template.flexiblePathEnabled,
      effectiveFrom: template.effectiveFrom,
      effectiveTo: template.effectiveTo ?? '',
      defaultPathSeparator: template.defaultPathSeparator ?? '-',
      includeWarehouseCodeInIdentifier: template.includeWarehouseCodeInIdentifier ?? true,
      defaultSequenceLength: String(template.defaultSequenceLength ?? 3),
      manualNodeCodeAllowed: template.manualNodeCodeAllowed ?? true,
      autoGenerateNodeCodeAllowed: template.autoGenerateNodeCodeAllowed ?? true,
      codeLockedAfterActivation: template.codeLockedAfterActivation ?? true,
      levels: template.levels.map((level) => ({
        ...level,
        allowedParentLevels: level.allowedParentLevels ?? [],
        allowedChildLevels: level.allowedChildLevels ?? [],
        transactionPurposes: level.transactionPurposes ?? [],
        levelRole: level.levelRole ?? level.defaultLocationRole ?? 'Structural',
        autoGenerateCode: level.autoGenerateCode ?? true,
        codePrefix: level.codePrefix ?? level.levelCode,
        startSequence: level.startSequence ?? 1,
        sequenceLength: level.sequenceLength ?? 3,
        separator: level.separator ?? '-',
      })),
    };
  }

  return {
    templateCode: 'TPL-NEW',
    templateName: 'Warehouse Hierarchy',
    templateSource: 'UserDefined',
    templateScope: 'Warehouse',
    versionNumber: '1',
    changeDescription: '',
    flexiblePathEnabled: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    defaultPathSeparator: '-',
    includeWarehouseCodeInIdentifier: true,
    defaultSequenceLength: '3',
    manualNodeCodeAllowed: true,
    autoGenerateNodeCodeAllowed: true,
    codeLockedAfterActivation: true,
    levels: [makeDefaultLevel(1), makeDefaultLevel(2), makeDefaultLevel(3), makeDefaultLevel(4)],
  };
}

interface HierarchyTemplateDesignerProps {
  open: boolean;
  warehouseId: string;
  templates: HierarchyTemplate[];
  activeTemplate?: HierarchyTemplate;
  hasTemplateDependencies?: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function HierarchyTemplateDesigner({ open, warehouseId, templates, activeTemplate, hasTemplateDependencies = false, onClose, onSaved }: HierarchyTemplateDesignerProps) {
  const [state, setState] = useState<DesignerState>(makeInitialState(activeTemplate));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [pendingPreset, setPendingPreset] = useState<TemplatePreset | null>(null);
  const [replaceConfirm, setReplaceConfirm] = useState(false);
  const [lifecycleReason, setLifecycleReason] = useState('');

  useEffect(() => {
    if (open) {
      setState(makeInitialState(activeTemplate));
      setMessage(null);
      setPendingPreset(null);
      setReplaceConfirm(false);
      setLifecycleReason('');
    }
  }, [activeTemplate, open]);

  const orderedLevels = useMemo(
    () => state.levels.map((level, index) => ({ level, index })).sort((a, b) => a.level.sequence - b.level.sequence),
    [state.levels],
  );

  const payload = useMemo<CreateHierarchyTemplateInput>(() => ({
    warehouseId,
    templateCode: state.templateCode,
    templateName: state.templateName,
    templateSource: state.templateSource,
    templateScope: state.templateScope,
    versionNumber: Number(state.versionNumber) || 1,
    changeDescription: state.changeDescription || undefined,
    flexiblePathEnabled: state.flexiblePathEnabled,
    effectiveFrom: state.effectiveFrom,
    effectiveTo: state.effectiveTo || undefined,
    defaultPathSeparator: state.defaultPathSeparator || '-',
    includeWarehouseCodeInIdentifier: state.includeWarehouseCodeInIdentifier,
    defaultSequenceLength: Number(state.defaultSequenceLength) || 3,
    manualNodeCodeAllowed: state.manualNodeCodeAllowed,
    autoGenerateNodeCodeAllowed: state.autoGenerateNodeCodeAllowed,
    codeLockedAfterActivation: state.codeLockedAfterActivation,
    levels: orderedLevels.map((entry) => ({
      ...entry.level,
      defaultLocationRole: entry.level.levelRole ?? entry.level.defaultLocationRole,
    })),
  }), [orderedLevels, state, warehouseId]);

  const fieldErrors = useMemo(() => validateHierarchyTemplateForSave(payload, templates), [payload, templates]);
  const levelIssues = useMemo(() => validateTemplateLevelTree(payload.levels), [payload.levels]);
  const hasBlockingIssues = hasHierarchyTemplateFieldErrors(fieldErrors) || levelIssues.some((issue) => issue.severity === 'error');
  const pathPreviews = useMemo(() => buildTemplatePathPreviews(payload.levels, state.flexiblePathEnabled), [payload.levels, state.flexiblePathEnabled]);
  const fullIdentifierExamples = useMemo(() => buildTemplateIdentifierExamples({
    levels: payload.levels,
    flexiblePathEnabled: payload.flexiblePathEnabled,
    defaultPathSeparator: payload.defaultPathSeparator,
    includeWarehouseCodeInIdentifier: payload.includeWarehouseCodeInIdentifier,
    defaultSequenceLength: payload.defaultSequenceLength,
  }, 'WH01'), [payload]);

  const hasActiveDependencyLock = Boolean(
    activeTemplate?.status === 'Active' &&
    (hasTemplateDependencies || activeTemplate.dependencyMarker?.hasNodes || activeTemplate.dependencyMarker?.hasStock || activeTemplate.dependencyMarker?.hasTransactions) &&
    (activeTemplate.codeLockedAfterActivation ?? true),
  );

  if (!open) return null;

  async function saveTemplate() {
    if (hasBlockingIssues) {
      setMessage('Resolve validation checklist errors before saving this template draft.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createHierarchyTemplateMock(payload);
      setMessage('Draft hierarchy template saved.');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save hierarchy template.');
    } finally {
      setSaving(false);
    }
  }

  async function activateTemplate(templateId: string) {
    setActivatingId(templateId);
    setMessage(null);
    try {
      await activateHierarchyTemplateMock(warehouseId, templateId);
      setMessage('Hierarchy template activated. Only one active version remains.');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to activate hierarchy template.');
    } finally {
      setActivatingId(null);
    }
  }

  async function setTemplateStatus(templateId: string, targetStatus: 'Blocked' | 'Inactive') {
    setActivatingId(templateId);
    setMessage(null);
    try {
      await updateHierarchyTemplateStatusMock(warehouseId, templateId, targetStatus, lifecycleReason);
      setMessage(`Template set to ${targetStatus}.`);
      setLifecycleReason('');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to set template to ${targetStatus}.`);
    } finally {
      setActivatingId(null);
    }
  }

  function applyPreset(preset: TemplatePreset) {
    if (state.levels.length > 0 && !replaceConfirm) {
      setMessage('Confirm replacement before applying a preset over current level definitions.');
      return;
    }
    setState((current) => ({
      ...current,
      templateSource: preset.templateSource,
      flexiblePathEnabled: preset.flexiblePathEnabled,
      levels: preset.levels.map((level, index) => ({ ...level, sequence: index + 1 })),
      changeDescription: `Applied preset: ${preset.label}`,
    }));
    setPendingPreset(null);
    setReplaceConfirm(false);
    setMessage(`Preset applied: ${preset.label}.`);
  }

  function updateLevel(index: number, patch: Partial<HierarchyLevel>) {
    setState((current) => ({
      ...current,
      levels: current.levels.map((level, currentIndex) => (currentIndex === index ? { ...level, ...patch } : level)),
    }));
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Hierarchy Template Designer</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Define metadata, level coding policy, full identifier previews, and lifecycle actions.
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          {hasActiveDependencyLock && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #F59E0B', background: '#FFFBEB', color: '#92400E', fontSize: '12px' }}>
              Active template has dependent nodes/stock history. Structural fields are locked.
            </div>
          )}

          <div style={gridThree}>
            <Field label="Template Code" value={state.templateCode} onChange={(value) => setState((current) => ({ ...current, templateCode: value.toUpperCase() }))} />
            <Field label="Template Name" value={state.templateName} onChange={(value) => setState((current) => ({ ...current, templateName: value }))} />
            <Field label="Version" value={state.versionNumber} onChange={(value) => setState((current) => ({ ...current, versionNumber: value }))} />
            <SelectField label="Template Source" value={state.templateSource} options={['UserDefined', 'System', 'Imported', 'Cloned']} onChange={(value) => setState((current) => ({ ...current, templateSource: value as TemplateSource }))} />
            <SelectField label="Template Scope" value={state.templateScope} options={['Warehouse', 'Organization']} onChange={(value) => setState((current) => ({ ...current, templateScope: value as TemplateScope }))} />
            <Field label="Status" value="Draft" readOnly />
            <Field label="Effective From" value={state.effectiveFrom} onChange={(value) => setState((current) => ({ ...current, effectiveFrom: value }))} type="date" />
            <Field label="Effective To" value={state.effectiveTo} onChange={(value) => setState((current) => ({ ...current, effectiveTo: value }))} type="date" />
            <Field label="Change Description" value={state.changeDescription} onChange={(value) => setState((current) => ({ ...current, changeDescription: value }))} />
            <Field label="Path Separator" value={state.defaultPathSeparator} onChange={(value) => setState((current) => ({ ...current, defaultPathSeparator: value }))} />
            <Field label="Default Sequence Length" value={state.defaultSequenceLength} onChange={(value) => setState((current) => ({ ...current, defaultSequenceLength: value }))} type="number" />
            <ToggleField label="Flexible Paths" checked={state.flexiblePathEnabled} onChange={(checked) => setState((current) => ({ ...current, flexiblePathEnabled: checked }))} />
            <ToggleField label="Include Warehouse in Identifier" checked={state.includeWarehouseCodeInIdentifier} onChange={(checked) => setState((current) => ({ ...current, includeWarehouseCodeInIdentifier: checked }))} />
            <ToggleField label="Manual Node Code Allowed" checked={state.manualNodeCodeAllowed} onChange={(checked) => setState((current) => ({ ...current, manualNodeCodeAllowed: checked }))} />
            <ToggleField label="Auto Generate Node Code Allowed" checked={state.autoGenerateNodeCodeAllowed} onChange={(checked) => setState((current) => ({ ...current, autoGenerateNodeCodeAllowed: checked }))} />
            <ToggleField label="Lock Structure After Activation" checked={state.codeLockedAfterActivation} onChange={(checked) => setState((current) => ({ ...current, codeLockedAfterActivation: checked }))} />
          </div>

          <div style={presetContainerStyle}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Quick Presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {PRESETS.map((preset) => (
                <button key={preset.id} type="button" style={presetCardStyle} onClick={() => setPendingPreset(preset)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{preset.label}</span>
                    <Sparkles size={13} color="#0284C7" />
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{preset.description}</div>
                </button>
              ))}
            </div>
            {pendingPreset && (
              <div style={presetPreviewStyle}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8' }}>Preset Preview: {pendingPreset.label}</div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#1D4ED8' }}>{pendingPreset.description}</div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#1D4ED8' }}>Levels: {pendingPreset.levels.map((level) => level.levelCode).join(' -> ')}</div>
                <label style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1D4ED8' }}>
                  <input type="checkbox" checked={replaceConfirm} onChange={(event) => setReplaceConfirm(event.target.checked)} />
                  Confirm replacing current level definition
                </label>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button type="button" style={secondaryBtn} onClick={() => setPendingPreset(null)}>Cancel</button>
                  <button type="button" style={primaryBtn} onClick={() => applyPreset(pendingPreset)}>Apply Preset</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Level Rows</div>
            <button type="button" onClick={() => setState((current) => ({ ...current, levels: [...current.levels, makeDefaultLevel(current.levels.length + 1)] }))} style={secondaryBtn} disabled={hasActiveDependencyLock}>
              <Plus size={14} /> Add Level
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '2800px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={rowHeaderStyle}>
                {['Code', 'Name', 'Seq', 'Role', 'Mandatory', 'Skip', 'Leaf', 'Endpoint', 'Auto', 'Prefix', 'Start', 'Len', 'Sep', 'Suffix', 'Example', 'Capacity', 'Eligibility', 'Responsibility', 'Barcode', 'QR', 'Cap. Mode', 'Cap. Rollup', 'Resp. Role', 'Txn Purposes', 'Parent Levels', 'Child Levels'].map((title) => (
                  <div key={title} style={headerCellStyle}>{title}</div>
                ))}
              </div>
              {orderedLevels.map(({ level, index }) => (
                <div key={`${level.levelCode}-${index}`} style={rowStyle}>
                  <CellInput value={level.levelCode} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { levelCode: value.toUpperCase(), codePrefix: value.toUpperCase() })} />
                  <CellInput value={level.levelName} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { levelName: value })} />
                  <CellInput value={String(level.sequence)} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { sequence: Number(value) || level.sequence })} type="number" />
                  <CellSelect value={level.levelRole ?? level.defaultLocationRole ?? 'Structural'} disabled={hasActiveDependencyLock} options={LEVEL_ROLES} onChange={(value) => updateLevel(index, { levelRole: value as HierarchyLevelRole, defaultLocationRole: value as HierarchyLevelRole })} />
                  <CellToggle checked={level.mandatory} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { mandatory: checked })} />
                  <CellToggle checked={level.allowSkipLevel} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { allowSkipLevel: checked })} />
                  <CellToggle checked={level.leafEligible} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { leafEligible: checked })} />
                  <CellToggle checked={level.inventoryEndpointEligible ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { inventoryEndpointEligible: checked })} />
                  <CellToggle checked={level.autoGenerateCode ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { autoGenerateCode: checked })} />
                  <CellInput value={level.codePrefix ?? ''} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { codePrefix: value.toUpperCase() })} />
                  <CellInput value={String(level.startSequence ?? 1)} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { startSequence: Number(value) || 1 })} type="number" />
                  <CellInput value={String(level.sequenceLength ?? (Number(state.defaultSequenceLength) || 3))} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { sequenceLength: Number(value) || 1 })} type="number" />
                  <CellInput value={level.separator ?? '-'} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { separator: value })} />
                  <CellInput value={level.suffix ?? ''} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { suffix: value.toUpperCase() })} />
                  <CellInput value={buildLevelGeneratedCodeExample(level, { defaultSequenceLength: Number(state.defaultSequenceLength) || 3 })} disabled onChange={() => undefined} />
                  <CellToggle checked={level.capacityApplicable ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { capacityApplicable: checked })} />
                  <CellToggle checked={level.itemEligibilityApplicable ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { itemEligibilityApplicable: checked })} />
                  <CellToggle checked={level.responsibilityApplicable ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { responsibilityApplicable: checked })} />
                  <CellToggle checked={level.barcodeApplicable ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { barcodeApplicable: checked })} />
                  <CellToggle checked={level.qrApplicable ?? false} disabled={hasActiveDependencyLock} onChange={(checked) => updateLevel(index, { qrApplicable: checked })} />
                  <CellSelect value={level.capacityEnforcementMode ?? 'None'} disabled={hasActiveDependencyLock} options={CAPACITY_ENFORCEMENT_OPTIONS} onChange={(value) => updateLevel(index, { capacityEnforcementMode: value as CapacityEnforcementMode })} />
                  <CellSelect value={level.capacityRollupMode ?? 'None'} disabled={hasActiveDependencyLock} options={CAPACITY_ROLLUP_OPTIONS} onChange={(value) => updateLevel(index, { capacityRollupMode: value as CapacityRollupMode })} />
                  <CellSelect value={level.defaultResponsibilityRole ?? ''} disabled={hasActiveDependencyLock} options={['', ...RESPONSIBILITY_ROLES]} onChange={(value) => updateLevel(index, { defaultResponsibilityRole: (value || undefined) as ResponsibilityRole | undefined })} />
                  <CellInput value={(level.transactionPurposes ?? []).join(', ')} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { transactionPurposes: splitList(value) as LocationTransactionPurpose[] })} placeholder={TRANSACTION_PURPOSES.join(', ')} />
                  <CellInput value={(level.allowedParentLevels ?? []).join(', ')} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { allowedParentLevels: splitList(value) })} placeholder="WAREHOUSE, ZONE" />
                  <CellInput value={(level.allowedChildLevels ?? []).join(', ')} disabled={hasActiveDependencyLock} onChange={(value) => updateLevel(index, { allowedChildLevels: splitList(value) })} placeholder="AISLE, BIN" />
                </div>
              ))}
            </div>
          </div>

          <div style={splitSectionStyle}>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Path Preview</div>
              {pathPreviews.length === 0
                ? <div style={mutedTextStyle}>No valid root-to-leaf path preview available yet.</div>
                : pathPreviews.map((path) => <div key={path} style={{ fontSize: '12px', fontFamily: 'monospace', marginBottom: '6px' }}>{path}</div>)}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Identifier Example Preview</div>
              {fullIdentifierExamples.length === 0
                ? <div style={mutedTextStyle}>No identifier examples available yet.</div>
                : fullIdentifierExamples.map((path) => <div key={path} style={{ fontSize: '12px', fontFamily: 'monospace', marginBottom: '6px' }}>{path}</div>)}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Validation Checklist</div>
              {fieldErrors.templateCode && <Issue message={fieldErrors.templateCode} />}
              {fieldErrors.templateName && <Issue message={fieldErrors.templateName} />}
              {fieldErrors.versionNumber && <Issue message={fieldErrors.versionNumber} />}
              {fieldErrors.effectiveFrom && <Issue message={fieldErrors.effectiveFrom} />}
              {fieldErrors.effectiveTo && <Issue message={fieldErrors.effectiveTo} />}
              {levelIssues.map((issue, index) => <Issue key={`${issue.message}-${index}`} message={issue.message} warning={issue.severity !== 'error'} />)}
              {!hasBlockingIssues && levelIssues.length === 0 && (
                <div style={{ fontSize: '12px', color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> No validation issues detected.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>Existing Template Versions</div>
            <div style={{ marginBottom: '8px' }}>
              <Field label="Lifecycle Reason (required for Blocked)" value={lifecycleReason} onChange={setLifecycleReason} />
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {templates.map((template) => {
                const inactiveBlocked = template.status === 'Active' && (hasTemplateDependencies || template.dependencyMarker?.hasNodes);
                return (
                  <div key={template.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 100px 120px 90px 100px 320px', gap: '10px', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--color-border)', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'monospace' }}>{template.templateCode}</span>
                    <span>{template.templateName}</span>
                    <span>{template.templateSource ?? 'UserDefined'}</span>
                    <span>{template.templateScope ?? 'Warehouse'}</span>
                    <span>v{template.currentVersion.versionNumber}</span>
                    <span>{template.status}</span>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => activateTemplate(template.id)} disabled={template.status === 'Active' || activatingId === template.id} style={{ ...secondaryBtn, opacity: template.status === 'Active' || activatingId === template.id ? 0.5 : 1 }}>
                        {template.status === 'Active' ? <><CheckCircle2 size={14} /> Active</> : 'Activate'}
                      </button>
                      <button type="button" onClick={() => setTemplateStatus(template.id, 'Blocked')} disabled={template.status === 'Blocked' || activatingId === template.id} style={{ ...secondaryBtn, opacity: template.status === 'Blocked' || activatingId === template.id ? 0.5 : 1 }}>
                        Block
                      </button>
                      <button type="button" onClick={() => setTemplateStatus(template.id, 'Inactive')} disabled={inactiveBlocked || template.status === 'Inactive' || activatingId === template.id} style={{ ...secondaryBtn, opacity: inactiveBlocked || template.status === 'Inactive' || activatingId === template.id ? 0.5 : 1 }} title={inactiveBlocked ? 'Cannot inactivate active template while dependent nodes exist.' : undefined}>
                        Inactivate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {message && <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid var(--color-border)', fontSize: '12px' }}>{message}</div>}
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={secondaryBtn}>Close</button>
          <button type="button" onClick={saveTemplate} disabled={saving || hasBlockingIssues} style={{ ...primaryBtn, opacity: saving || hasBlockingIssues ? 0.6 : 1 }}>
            Save Draft Template
          </button>
        </div>
      </div>
    </div>
  );
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function Issue({ message, warning = false }: { message: string; warning?: boolean }) {
  return (
    <div style={{ fontSize: '12px', marginBottom: '8px', color: warning ? '#92400E' : '#B91C1C', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
      <AlertTriangle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

function Field({ label, value, onChange, readOnly = false, type = 'text' }: { label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} readOnly={readOnly} style={{ ...inputStyle, background: readOnly ? 'var(--color-surface-subtle)' : 'var(--color-surface)' }} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '30px 0 0' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>{label}</span>
    </label>
  );
}

function CellInput({ value, onChange, placeholder, type = 'text', disabled = false }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, opacity: disabled ? 0.7 : 1 }} disabled={disabled} />;
}

function CellSelect({ value, options, onChange, disabled = false }: { value: string; options: string[]; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, opacity: disabled ? 0.7 : 1 }} disabled={disabled}>
      {options.map((option) => <option key={option} value={option}>{option || 'None'}</option>)}
    </select>
  );
}

function CellToggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'center' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
    </label>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1800,
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'flex',
  justifyContent: 'flex-end',
};

const panelStyle: React.CSSProperties = {
  width: 'min(1460px, 100vw)',
  height: '100%',
  background: 'var(--color-surface)',
  borderLeft: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  borderBottom: '1px solid var(--color-border)',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderTop: '1px solid var(--color-border)',
};

const closeBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
};

const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  fontSize: '12px',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const primaryBtn: React.CSSProperties = {
  ...secondaryBtn,
  background: 'var(--color-primary)',
  border: '1px solid var(--color-primary)',
  color: '#fff',
};

const rowHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(26, minmax(110px, 1fr))',
  gap: '10px',
  padding: '10px 12px',
  background: 'var(--color-surface-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(26, minmax(110px, 1fr))',
  gap: '10px',
  padding: '10px 12px',
  borderTop: '1px solid var(--color-border)',
};

const headerCellStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
};

const presetContainerStyle: React.CSSProperties = {
  marginTop: '16px',
  padding: '12px',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  background: 'var(--color-surface-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const presetCardStyle: React.CSSProperties = {
  border: '1px solid #BAE6FD',
  background: '#F0F9FF',
  borderRadius: '10px',
  padding: '10px',
  cursor: 'pointer',
};

const presetPreviewStyle: React.CSSProperties = {
  border: '1px solid #93C5FD',
  background: '#EFF6FF',
  borderRadius: '10px',
  padding: '10px',
};

const splitSectionStyle: React.CSSProperties = {
  marginTop: '18px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '12px',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '12px',
  background: 'var(--color-surface)',
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-muted)',
};

