import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, Circle, ClipboardCheck,
  Edit2, Eye, GitMerge, Layers, List, Plus, Save, Trash2,
} from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';
import { SmartPreviewDrawer } from '../../experience/components/SmartPreviewDrawer';
import { SmartFormDrawer } from '../../experience/components/SmartFormDrawer';
import { SmartReviewDrawer } from '../../experience/components/SmartReviewDrawer';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';
import type { PreviewSection } from '../../experience/components/SmartPreviewDrawer';

const MASTER_KEY = 'picklist-master';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PicklistConfig {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description: string;
  configurationType: 'Independent' | 'Dependent' | 'Multi-Level Dependent';
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

interface PicklistLevel {
  id: string;
  configId: string;
  levelSequence: string;
  parentLevelId: string;
  picklistName: string;
  displayName: string;
  allowMultipleParentMapping: boolean;
  allowValueReuse: boolean;
}

interface PicklistValue {
  id: string;
  configId: string;
  levelId: string;
  code: string;
  name: string;
  displayName: string;
  description: string;
  displaySequence: string;
  isActive: boolean;
  isDefault: boolean;
}

interface DependencyMapping {
  id: string;
  configId: string;
  parentLevelId: string;
  parentValueId: string;
  childLevelId: string;
  childValueId: string;
  isActive: boolean;
}

type SectionKey = 'config' | 'levels' | 'values' | 'mapping' | 'review';
type SectionState = 'complete' | 'inprogress' | 'notstarted' | 'warning';

// ─── Section definitions (static — outside component) ─────────────────────────

const SECTION_ORDER: SectionKey[] = ['config', 'levels', 'values', 'mapping', 'review'];

const SECTION_DEFS: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
  { key: 'config',  label: 'Configuration', icon: <List size={13} /> },
  { key: 'levels',  label: 'Levels',         icon: <Layers size={13} /> },
  { key: 'values',  label: 'Values',         icon: <ClipboardCheck size={13} /> },
  { key: 'mapping', label: 'Mapping',        icon: <GitMerge size={13} /> },
  { key: 'review',  label: 'Review',         icon: <CheckCircle2 size={13} /> },
];

// Satisfy linter — SECTION_ORDER is used at runtime, not just in types
void SECTION_ORDER;

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CONFIGS: PicklistConfig[] = [
  { id: 'CFG-001', code: 'PCK-001', name: 'Country', displayName: 'Country', description: 'List of countries for address fields', configurationType: 'Independent', isActive: true, createdBy: 'Admin', createdDate: '2026-01-10 09:00', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-10 09:00' },
  { id: 'CFG-002', code: 'PCK-002', name: 'Region District', displayName: 'Region / District', description: 'Two-level geographic hierarchy', configurationType: 'Dependent', isActive: true, createdBy: 'Admin', createdDate: '2026-01-12 10:00', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-12 10:00' },
  { id: 'CFG-003', code: 'PCK-003', name: 'Country State City', displayName: 'Country / State / City', description: 'Three-level geographic hierarchy for shipping addresses', configurationType: 'Multi-Level Dependent', isActive: true, createdBy: 'Admin', createdDate: '2026-01-15 11:00', lastModifiedBy: 'Admin', lastModifiedDate: '2026-01-15 11:00' },
];

const INITIAL_LEVELS: PicklistLevel[] = [
  { id: 'LVL-001', configId: 'CFG-002', levelSequence: '1', parentLevelId: '', picklistName: 'Region', displayName: 'Region', allowMultipleParentMapping: false, allowValueReuse: false },
  { id: 'LVL-002', configId: 'CFG-002', levelSequence: '2', parentLevelId: 'LVL-001', picklistName: 'District', displayName: 'District', allowMultipleParentMapping: false, allowValueReuse: false },
  { id: 'LVL-003', configId: 'CFG-003', levelSequence: '1', parentLevelId: '', picklistName: 'Country', displayName: 'Country', allowMultipleParentMapping: false, allowValueReuse: false },
  { id: 'LVL-004', configId: 'CFG-003', levelSequence: '2', parentLevelId: 'LVL-003', picklistName: 'State', displayName: 'State', allowMultipleParentMapping: false, allowValueReuse: false },
  { id: 'LVL-005', configId: 'CFG-003', levelSequence: '3', parentLevelId: 'LVL-004', picklistName: 'City', displayName: 'City', allowMultipleParentMapping: false, allowValueReuse: false },
];

const INITIAL_VALUES: PicklistValue[] = [
  { id: 'VAL-001', configId: 'CFG-001', levelId: 'DEFAULT', code: 'INDIA', name: 'India', displayName: 'India', description: '', displaySequence: '1', isActive: true, isDefault: true },
  { id: 'VAL-002', configId: 'CFG-001', levelId: 'DEFAULT', code: 'USA', name: 'United States', displayName: 'United States', description: '', displaySequence: '2', isActive: true, isDefault: false },
  { id: 'VAL-003', configId: 'CFG-001', levelId: 'DEFAULT', code: 'UK', name: 'United Kingdom', displayName: 'United Kingdom', description: '', displaySequence: '3', isActive: true, isDefault: false },
  { id: 'VAL-004', configId: 'CFG-002', levelId: 'LVL-001', code: 'NORTH', name: 'North', displayName: 'North India', description: '', displaySequence: '1', isActive: true, isDefault: false },
  { id: 'VAL-005', configId: 'CFG-002', levelId: 'LVL-001', code: 'SOUTH', name: 'South', displayName: 'South India', description: '', displaySequence: '2', isActive: true, isDefault: false },
  { id: 'VAL-006', configId: 'CFG-002', levelId: 'LVL-001', code: 'EAST', name: 'East', displayName: 'East India', description: '', displaySequence: '3', isActive: true, isDefault: false },
  { id: 'VAL-007', configId: 'CFG-002', levelId: 'LVL-002', code: 'DEL', name: 'Delhi', displayName: 'Delhi', description: '', displaySequence: '1', isActive: true, isDefault: false },
  { id: 'VAL-008', configId: 'CFG-002', levelId: 'LVL-002', code: 'MUM', name: 'Mumbai', displayName: 'Mumbai', description: '', displaySequence: '2', isActive: true, isDefault: false },
  { id: 'VAL-009', configId: 'CFG-002', levelId: 'LVL-002', code: 'CHE', name: 'Chennai', displayName: 'Chennai', description: '', displaySequence: '3', isActive: true, isDefault: false },
  { id: 'VAL-010', configId: 'CFG-002', levelId: 'LVL-002', code: 'BLR', name: 'Bangalore', displayName: 'Bengaluru', description: '', displaySequence: '4', isActive: true, isDefault: false },
];

const INITIAL_MAPPINGS: DependencyMapping[] = [
  { id: 'MAP-001', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-004', childLevelId: 'LVL-002', childValueId: 'VAL-007', isActive: true },
  { id: 'MAP-002', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-004', childLevelId: 'LVL-002', childValueId: 'VAL-008', isActive: true },
  { id: 'MAP-003', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-005', childLevelId: 'LVL-002', childValueId: 'VAL-009', isActive: true },
  { id: 'MAP-004', configId: 'CFG-002', parentLevelId: 'LVL-001', parentValueId: 'VAL-005', childLevelId: 'LVL-002', childValueId: 'VAL-010', isActive: true },
];

// ─── Empty forms ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Omit<PicklistConfig, 'id'> = {
  code: '', name: '', displayName: '', description: '',
  configurationType: 'Independent', isActive: true,
  createdBy: 'Admin', createdDate: '', lastModifiedBy: '', lastModifiedDate: '',
};

const EMPTY_LEVEL: Omit<PicklistLevel, 'id'> = {
  configId: '', levelSequence: '', parentLevelId: '',
  picklistName: '', displayName: '',
  allowMultipleParentMapping: false, allowValueReuse: false,
};

const EMPTY_VALUE: Omit<PicklistValue, 'id'> = {
  configId: '', levelId: '', code: '', name: '', displayName: '', description: '',
  displaySequence: '', isActive: true, isDefault: false,
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getConfigTypeColor(type: string): { bg: string; text: string } {
  switch (type) {
    case 'Independent':           return {
      bg: 'color-mix(in srgb, #10b981 12%, var(--color-surface))',
      text: 'color-mix(in srgb, #10b981 85%, var(--color-text))'
    };
    case 'Dependent':             return {
      bg: 'color-mix(in srgb, #3b82f6 10%, var(--color-surface))',
      text: 'color-mix(in srgb, #3b82f6 85%, var(--color-text))'
    };
    case 'Multi-Level Dependent': return {
      bg: 'color-mix(in srgb, #8b5cf6 10%, var(--color-surface))',
      text: 'color-mix(in srgb, #8b5cf6 85%, var(--color-text))'
    };
    default: return {
      bg: 'var(--color-surface-subtle)',
      text: 'var(--color-text-muted)'
    };
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

const PicklistMasterPage: React.FC = () => {
  const master = findMasterByKey(MASTER_KEY);
  const group  = findGroupForMasterKey(MASTER_KEY);

  const [activeSection, setActiveSection] = useState<SectionKey>('config');
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('picklist-master');

  // ── Config state ──────────────────────────────────────────────────
  const [configs, setConfigs]                     = useState<PicklistConfig[]>(INITIAL_CONFIGS);
  const [configFormOpen, setConfigFormOpen]       = useState(false);
  const [editingConfig, setEditingConfig]         = useState<PicklistConfig | null>(null);
  const [configForm, setConfigForm]               = useState<Omit<PicklistConfig, 'id'>>(EMPTY_CONFIG);
  const [configPreviewOpen, setConfigPreviewOpen] = useState(false);
  const [previewConfig, setPreviewConfig]         = useState<PicklistConfig | null>(null);

  // ── Levels state ──────────────────────────────────────────────────
  const [levels, setLevels]                         = useState<PicklistLevel[]>(INITIAL_LEVELS);
  const [levelConfigFilter, setLevelConfigFilter]   = useState('');
  const [levelFormOpen, setLevelFormOpen]           = useState(false);
  const [editingLevel, setEditingLevel]             = useState<PicklistLevel | null>(null);
  const [levelForm, setLevelForm]                   = useState<Omit<PicklistLevel, 'id'>>(EMPTY_LEVEL);
  const [levelPreviewOpen, setLevelPreviewOpen]     = useState(false);
  const [previewLevel, setPreviewLevel]             = useState<PicklistLevel | null>(null);

  // ── Values state ──────────────────────────────────────────────────
  const [values, setValues]                         = useState<PicklistValue[]>(INITIAL_VALUES);
  const [valueConfigFilter, setValueConfigFilter]   = useState('');
  const [valueLevelFilter, setValueLevelFilter]     = useState('');
  const [valueFormOpen, setValueFormOpen]           = useState(false);
  const [editingValue, setEditingValue]             = useState<PicklistValue | null>(null);
  const [valueForm, setValueForm]                   = useState<Omit<PicklistValue, 'id'>>(EMPTY_VALUE);
  const [valuePreviewOpen, setValuePreviewOpen]     = useState(false);
  const [previewValue, setPreviewValue]             = useState<PicklistValue | null>(null);

  // ── Mapping state ─────────────────────────────────────────────────
  const [mappings, setMappings]                             = useState<DependencyMapping[]>(INITIAL_MAPPINGS);
  const [mappingConfigFilter, setMappingConfigFilter]       = useState('');
  const [mappingParentLevelId, setMappingParentLevelId]     = useState('');
  const [mappingParentValueId, setMappingParentValueId]     = useState('');
  const [checkedChildValueIds, setCheckedChildValueIds]     = useState<Set<string>>(new Set());

  // ── Review state ──────────────────────────────────────────────────
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  useEffect(() => {
    if (master && group) {
      recordRecentAdminMaster({
        key: master.key, label: master.label, path: master.path,
        groupLabel: group.label, groupIconBg: group.iconBg, groupIconColor: group.iconColor,
      });
    }
  }, [master, group]);

  // ── Config handlers ───────────────────────────────────────────────
  const openConfigForCreate = () => {
    setEditingConfig(null);
    setConfigForm({ ...EMPTY_CONFIG });
    setConfigFormOpen(true);
  };
  const openConfigForEdit = (entry: PicklistConfig) => {
    setEditingConfig(entry);
    const { id: _id, ...rest } = entry;
    setConfigForm({ ...rest });
    setConfigFormOpen(true);
  };
  const saveConfig = () => {
    if (!configForm.name || !configForm.configurationType) return;
    if (editingConfig) {
      setConfigs((prev) => prev.map((e) => e.id === editingConfig.id ? { ...configForm, id: editingConfig.id } : e));
    } else {
      const newCode = `PCK-${String(configs.length + 1).padStart(3, '0')}`;
      setConfigs((prev) => [...prev, { ...configForm, code: newCode, id: Date.now().toString() }]);
    }
    setConfigFormOpen(false);
  };
  const deleteConfig = (id: string) => setConfigs((prev) => prev.filter((e) => e.id !== id));

  // ── Level handlers ────────────────────────────────────────────────
  const openLevelForCreate = () => {
    setEditingLevel(null);
    setLevelForm({ ...EMPTY_LEVEL, configId: levelConfigFilter });
    setLevelFormOpen(true);
  };
  const openLevelForEdit = (entry: PicklistLevel) => {
    setEditingLevel(entry);
    const { id: _id, ...rest } = entry;
    setLevelForm({ ...rest });
    setLevelFormOpen(true);
  };
  const saveLevel = () => {
    if (!levelForm.picklistName || !levelForm.levelSequence || !levelForm.configId) return;
    if (editingLevel) {
      setLevels((prev) => prev.map((e) => e.id === editingLevel.id ? { ...levelForm, id: editingLevel.id } : e));
    } else {
      setLevels((prev) => [...prev, { ...levelForm, id: `LVL-${Date.now()}` }]);
    }
    setLevelFormOpen(false);
  };
  const deleteLevel = (id: string) => setLevels((prev) => prev.filter((e) => e.id !== id));

  // ── Value handlers ────────────────────────────────────────────────
  const openValueForCreate = () => {
    setEditingValue(null);
    const selCfg = configs.find((c) => c.id === valueConfigFilter);
    const autoLevel = selCfg?.configurationType === 'Independent' ? 'DEFAULT' : valueLevelFilter;
    setValueForm({ ...EMPTY_VALUE, configId: valueConfigFilter, levelId: autoLevel });
    setValueFormOpen(true);
  };
  const openValueForEdit = (entry: PicklistValue) => {
    setEditingValue(entry);
    const { id: _id, ...rest } = entry;
    setValueForm({ ...rest });
    setValueFormOpen(true);
  };
  const saveValue = () => {
    if (!valueForm.configId || !valueForm.code || !valueForm.name || !valueForm.displayName) return;
    if (editingValue) {
      setValues((prev) => prev.map((e) => e.id === editingValue.id ? { ...valueForm, id: editingValue.id } : e));
    } else {
      setValues((prev) => [...prev, { ...valueForm, id: `VAL-${Date.now()}` }]);
    }
    setValueFormOpen(false);
  };
  const deleteValue = (id: string) => setValues((prev) => prev.filter((e) => e.id !== id));

  // ── Mapping helpers ───────────────────────────────────────────────
  const dependentConfigs = configs.filter((c) => c.configurationType !== 'Independent');
  const selectedMappingConfig = configs.find((c) => c.id === mappingConfigFilter);
  const configLevels = [...levels]
    .filter((l) => l.configId === mappingConfigFilter)
    .sort((a, b) => parseInt(a.levelSequence) - parseInt(b.levelSequence));
  const maxLevelSeq = configLevels.length > 0 ? Math.max(...configLevels.map((l) => parseInt(l.levelSequence))) : 0;
  const parentLevelChoices = configLevels.filter((l) => parseInt(l.levelSequence) < maxLevelSeq);
  const parentLevel = configLevels.find((l) => l.id === mappingParentLevelId);
  const childLevel = parentLevel
    ? configLevels.find((l) => parseInt(l.levelSequence) === parseInt(parentLevel.levelSequence) + 1) ?? null
    : null;
  const parentValues = values.filter(
    (v) => v.configId === mappingConfigFilter && v.levelId === mappingParentLevelId && v.isActive,
  );
  const childValues = childLevel
    ? values.filter((v) => v.configId === mappingConfigFilter && v.levelId === childLevel.id)
    : [];

  useEffect(() => {
    if (mappingParentLevelId && mappingParentValueId) {
      const mapped = new Set(
        mappings
          .filter((m) => m.parentLevelId === mappingParentLevelId && m.parentValueId === mappingParentValueId && m.isActive)
          .map((m) => m.childValueId),
      );
      setCheckedChildValueIds(mapped);
    } else {
      setCheckedChildValueIds(new Set());
    }
  }, [mappingParentLevelId, mappingParentValueId, mappings]);

  const toggleChildValue = (cid: string) => {
    setCheckedChildValueIds((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) { next.delete(cid); } else { next.add(cid); }
      return next;
    });
  };
  const toggleSelectAll = () => {
    const activeIds = childValues.filter((v) => v.isActive).map((v) => v.id);
    const allChecked = activeIds.length > 0 && activeIds.every((id) => checkedChildValueIds.has(id));
    setCheckedChildValueIds(allChecked ? new Set() : new Set(activeIds));
  };
  const saveMapping = () => {
    if (!mappingParentLevelId || !mappingParentValueId || !childLevel || checkedChildValueIds.size === 0) return;
    const filtered = mappings.filter(
      (m) => !(m.parentLevelId === mappingParentLevelId && m.parentValueId === mappingParentValueId),
    );
    const newMaps: DependencyMapping[] = Array.from(checkedChildValueIds).map((cid, i) => ({
      id: `MAP-${Date.now()}-${i}`,
      configId: mappingConfigFilter,
      parentLevelId: mappingParentLevelId,
      parentValueId: mappingParentValueId,
      childLevelId: childLevel.id,
      childValueId: cid,
      isActive: true,
    }));
    setMappings([...filtered, ...newMaps]);
  };

  // ── Computed / derived state ─────────────────────────────────────
  const filteredLevels = useMemo(() =>
    [...levels]
      .filter((l) => !levelConfigFilter || l.configId === levelConfigFilter)
      .sort((a, b) => parseInt(a.levelSequence) - parseInt(b.levelSequence)),
    [levels, levelConfigFilter],
  );

  const filteredValues = useMemo(() =>
    values
      .filter((v) => !valueConfigFilter || v.configId === valueConfigFilter)
      .filter((v) => !valueLevelFilter  || v.levelId   === valueLevelFilter),
    [values, valueConfigFilter, valueLevelFilter],
  );

  const sectionStates = useMemo((): Record<SectionKey, SectionState> => {
    const configDone   = configs.length > 0;
    const levelsDone   = levels.length > 0;
    const valuesDone   = values.length > 0;
    const mappingsDone = mappings.length > 0;
    return {
      config:  configDone   ? 'complete' : activeSection === 'config'  ? 'inprogress' : 'notstarted',
      levels:  levelsDone   ? 'complete' : activeSection === 'levels'  ? 'inprogress' : 'notstarted',
      values:  valuesDone   ? 'complete' : activeSection === 'values'  ? 'inprogress' : 'notstarted',
      mapping: mappingsDone ? 'complete' : activeSection === 'mapping' ? 'inprogress' : 'notstarted',
      review:  (configDone && levelsDone && valuesDone)
        ? 'complete'
        : activeSection === 'review' ? 'inprogress' : 'notstarted',
    };
  }, [configs, levels, values, mappings, activeSection]);

  const reviewChecklist = useMemo(() => [
    { id: 'c1', label: 'At least one picklist config defined',  passed: configs.length > 0,             detail: `${configs.length} config(s)` },
    { id: 'c2', label: 'All configs have a configuration type', passed: configs.every((c) => !!c.configurationType), detail: configs.filter((c) => !c.configurationType).length === 0 ? 'All valid' : 'Some missing' },
    { id: 'c3', label: 'At least one level defined',            passed: levels.length > 0,              detail: `${levels.length} level(s)` },
    { id: 'c4', label: 'At least one active value defined',     passed: values.some((v) => v.isActive), detail: `${values.filter((v) => v.isActive).length} active` },
    { id: 'c5', label: 'No level without values',               passed: levels.every((l) => values.some((v) => v.levelId === l.id)), detail: 'All levels covered' },
    { id: 'c6', label: 'Dependency mappings configured',        passed: mappings.length > 0,            detail: `${mappings.length} mapping(s)` },
  ], [configs, levels, values, mappings]);

  const summaryItems = useMemo(() => [
    { label: 'Configs',  value: configs.length  },
    { label: 'Levels',   value: levels.length   },
    { label: 'Values',   value: values.length   },
    { label: 'Mappings', value: mappings.length },
  ], [configs, levels, values, mappings]);

  const primaryAction = activeSection === 'config'  ? { label: 'Add Config',         onClick: openConfigForCreate        } :
                        activeSection === 'levels'  ? { label: 'Add Level',          onClick: openLevelForCreate         } :
                        activeSection === 'values'  ? { label: 'Add Value',          onClick: openValueForCreate         } :
                        activeSection === 'review'  ? { label: 'Review & Activate',  onClick: () => setReviewDrawerOpen(true) } :
                        undefined;

  const configPreviewSections = useMemo((): PreviewSection[] => {
    if (!previewConfig) return [];
    const cfg = previewConfig;
    return [{ title: 'Configuration Details', fields: [
      { label: 'Code',         value: cfg.code },
      { label: 'Name',         value: cfg.name },
      { label: 'Display Name', value: cfg.displayName },
      { label: 'Type',         value: cfg.configurationType },
      { label: 'Description',  value: cfg.description || '—' },
      { label: 'Is Active',    value: cfg.isActive ? 'Active' : 'Inactive' },
    ]}];
  }, [previewConfig]);

  const levelPreviewSections = useMemo((): PreviewSection[] => {
    if (!previewLevel) return [];
    const lv = previewLevel;
    const parentConfig = configs.find((c) => c.id === lv.configId);
    return [{ title: 'Level Details', fields: [
      { label: 'Picklist Name',        value: lv.picklistName },
      { label: 'Display Name',         value: lv.displayName  },
      { label: 'Level Sequence',       value: lv.levelSequence },
      { label: 'Config',               value: parentConfig?.name || lv.configId },
      { label: 'Multi-Parent Mapping', value: lv.allowMultipleParentMapping ? 'Yes' : 'No' },
      { label: 'Value Reuse',          value: lv.allowValueReuse ? 'Yes' : 'No' },
    ]}];
  }, [previewLevel, configs]);

  const valuePreviewSections = useMemo((): PreviewSection[] => {
    if (!previewValue) return [];
    const vl = previewValue;
    const parentConfig = configs.find((c) => c.id === vl.configId);
    const parentLevel  = levels.find((l) => l.id === vl.levelId);
    return [{ title: 'Value Details', fields: [
      { label: 'Code',             value: vl.code },
      { label: 'Name',             value: vl.name },
      { label: 'Display Name',     value: vl.displayName },
      { label: 'Config',           value: parentConfig?.name || vl.configId },
      { label: 'Level',            value: parentLevel?.picklistName || vl.levelId },
      { label: 'Display Sequence', value: vl.displaySequence },
      { label: 'Is Active',        value: vl.isActive  ? 'Active'  : 'Inactive' },
      { label: 'Is Default',       value: vl.isDefault ? 'Yes'     : 'No'       },
    ]}];
  }, [previewValue, configs, levels]);

  if (!master || !group) return null;

  const picklistHelpTopic = getHelpTopic(helpTopicId);

  // ── Section nav ────────────────────────────────────────────────────
  const navBar = (
    <div style={{ display: 'flex', gap: '2px', background: 'var(--color-surface-subtle)', borderRadius: '10px', padding: '3px' }}>
      {SECTION_DEFS.map(({ key, label, icon }) => {
        const state = sectionStates[key];
        const isActive = activeSection === key;
        const StateIcon = state === 'complete' ? CheckCircle2 : state === 'warning' ? AlertCircle : state === 'inprogress' ? ChevronDown : Circle;
        const iconColor = state === 'complete' ? '#16a34a' : state === 'warning' ? '#D97706' : state === 'inprogress' ? 'var(--color-primary)' : 'var(--color-text-muted)';
        return (
          <button key={key} type="button" onClick={() => setActiveSection(key)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: isActive ? 600 : 400, background: isActive ? 'var(--color-surface)' : 'transparent', color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            <span style={{ color: iconColor }}><StateIcon size={11} /></span>
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );

  const toolbarFilters: React.ReactNode = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {navBar}
      {activeSection === 'levels' && (
        <select value={levelConfigFilter} onChange={(e) => setLevelConfigFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">All Configs</option>
          {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      {activeSection === 'values' && (<>
        <select value={valueConfigFilter} onChange={(e) => { setValueConfigFilter(e.target.value); setValueLevelFilter(''); }} style={filterSelectStyle}>
          <option value="">All Configs</option>
          {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={valueLevelFilter} onChange={(e) => setValueLevelFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">All Levels</option>
          {levels.filter((l) => !valueConfigFilter || l.configId === valueConfigFilter).map((l) => <option key={l.id} value={l.id}>{l.picklistName}</option>)}
        </select>
      </>)}
      {activeSection === 'mapping' && (
        <select value={mappingConfigFilter} onChange={(e) => { setMappingConfigFilter(e.target.value); setMappingParentLevelId(''); setMappingParentValueId(''); }} style={filterSelectStyle}>
          <option value="">All Configs</option>
          {dependentConfigs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );

  return (
    <AdminShell>
      <AdminListPageShell
        title={master.label}
        description={master.description}
        breadcrumbs={['Admin', group.label]}
        helpTopicId={helpTopicId}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        primaryAction={primaryAction}
        summaryItems={summaryItems}
        toolbarActions={toolbarFilters}
      >


        {/* ── Config section ─────────────────────────────────────────── */}
        {activeSection === 'config' && (
          <div>
            {configs.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <List size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>No configurations yet</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Create a picklist configuration to define its type and structure.</div>
                <button type="button" onClick={openConfigForCreate} style={btnPrimary}><Plus size={13} />Add Config</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)' }}>
                    {['Code', 'Name', 'Display Name', 'Type', 'Status', ''].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => {
                    const tc = getConfigTypeColor(cfg.configurationType);
                    return (
                      <tr key={cfg.id} onClick={() => { setPreviewConfig(cfg); setConfigPreviewOpen(true); }}
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 700 }}>{cfg.code}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}>{cfg.name}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{cfg.displayName}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: tc.bg, color: tc.text }}>{cfg.configurationType}</span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: cfg.isActive ? '#15803D' : 'var(--color-text-muted)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.isActive ? '#16A34A' : '#94A3B8' }} />
                            {cfg.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => { setPreviewConfig(cfg); setConfigPreviewOpen(true); }} title="Preview"><Eye size={13} /></ActionBtn>
                            <ActionBtn onClick={() => openConfigForEdit(cfg)} title="Edit"><Edit2 size={13} /></ActionBtn>
                            <ActionBtn onClick={() => deleteConfig(cfg.id)} title="Delete" danger><Trash2 size={13} /></ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              {configs.length} configuration(s)
            </div>
          </div>
        )}

        {/* ── Levels section ─────────────────────────────────────────── */}
        {activeSection === 'levels' && (
          <div>
            {filteredLevels.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Layers size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>No levels found</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Add a level to define the hierarchy for your picklists.</div>
                <button type="button" onClick={openLevelForCreate} style={btnPrimary}><Plus size={13} />Add Level</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)' }}>
                    {['Seq', 'Picklist Name', 'Display Name', 'Config', 'Multi-Parent', 'Value Reuse', ''].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLevels.map((lv) => {
                    const cfg = configs.find((c) => c.id === lv.configId);
                    return (
                      <tr key={lv.id} onClick={() => { setPreviewLevel(lv); setLevelPreviewOpen(true); }}
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px', fontWeight: 700 }}>{lv.levelSequence}</span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}>{lv.picklistName}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{lv.displayName}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{cfg?.name || lv.configId}</td>
                        <td style={{ padding: '9px 12px' }}><FlagPill on={lv.allowMultipleParentMapping} /></td>
                        <td style={{ padding: '9px 12px' }}><FlagPill on={lv.allowValueReuse} /></td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => { setPreviewLevel(lv); setLevelPreviewOpen(true); }} title="Preview"><Eye size={13} /></ActionBtn>
                            <ActionBtn onClick={() => openLevelForEdit(lv)} title="Edit"><Edit2 size={13} /></ActionBtn>
                            <ActionBtn onClick={() => deleteLevel(lv.id)} title="Delete" danger><Trash2 size={13} /></ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              {filteredLevels.length} level(s)
            </div>
          </div>
        )}

        {/* ── Values section ─────────────────────────────────────────── */}
        {activeSection === 'values' && (
          <div>
            {filteredValues.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <ClipboardCheck size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>No values found</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Add values to populate your picklist levels.</div>
                <button type="button" onClick={openValueForCreate} style={btnPrimary}><Plus size={13} />Add Value</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-subtle)' }}>
                    {['Code', 'Name', 'Display Name', 'Config', 'Level', 'Seq', 'Default', 'Status', ''].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredValues.map((vl) => {
                    const cfg = configs.find((c) => c.id === vl.configId);
                    const lvl = levels.find((l) => l.id === vl.levelId);
                    return (
                      <tr key={vl.id} onClick={() => { setPreviewValue(vl); setValuePreviewOpen(true); }}
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--color-border)', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 700 }}>{vl.code}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 600 }}>{vl.name}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{vl.displayName}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{cfg?.name || vl.configId}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{lvl?.picklistName || vl.levelId}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', textAlign: 'center' }}>{vl.displaySequence || '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: vl.isDefault ? '#D97706' : 'var(--color-text-muted)' }}>{vl.isDefault ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: vl.isActive ? '#15803D' : 'var(--color-text-muted)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: vl.isActive ? '#16A34A' : '#94A3B8' }} />
                            {vl.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => { setPreviewValue(vl); setValuePreviewOpen(true); }} title="Preview"><Eye size={13} /></ActionBtn>
                            <ActionBtn onClick={() => openValueForEdit(vl)} title="Edit"><Edit2 size={13} /></ActionBtn>
                            <ActionBtn onClick={() => deleteValue(vl.id)} title="Delete" danger><Trash2 size={13} /></ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              {filteredValues.length} value(s)
            </div>
          </div>
        )}


        {/* ── Mapping section ─────────────────────────────────────────── */}
        {activeSection === 'mapping' && (
          <div>

                {!mappingConfigFilter && (
                  <div style={{ margin: '20px 24px', padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>Select a configuration to begin mapping</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Choose a Dependent or Multi-Level Dependent configuration from the dropdown above.</div>
                  </div>
                )}

                {mappingConfigFilter && selectedMappingConfig?.configurationType === 'Independent' && (
                  <div style={{ margin: '20px 24px', padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>ℹ️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>Not applicable for Independent type</div>
                      <div style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>Dependency mapping is only available for Dependent and Multi-Level Dependent configurations.</div>
                    </div>
                  </div>
                )}

                {mappingConfigFilter && selectedMappingConfig?.configurationType !== 'Independent' && (
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Mapping Header Card */}
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>Mapping Header</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <DField label="Parent Level" required>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={mappingParentLevelId}
                              onChange={(e) => { setMappingParentLevelId(e.target.value); setMappingParentValueId(''); }}
                              style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}
                            >
                              <option value="">— Select —</option>
                              {parentLevelChoices.map((l) => <option key={l.id} value={l.id}>{l.picklistName}</option>)}
                            </select>
                            <ChevronSvg />
                          </div>
                        </DField>
                        <DField label="Parent Value" required>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={mappingParentValueId}
                              onChange={(e) => setMappingParentValueId(e.target.value)}
                              disabled={!mappingParentLevelId}
                              style={{ ...drawerInputBase, cursor: mappingParentLevelId ? 'pointer' : 'not-allowed', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px', opacity: !mappingParentLevelId ? 0.5 : 1 }}
                            >
                              <option value="">— Select —</option>
                              {parentValues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <ChevronSvg />
                          </div>
                        </DField>
                        <DField label="Child Level">
                          <div style={roStyle}>
                            {childLevel
                              ? <span style={{ fontWeight: 600 }}>{childLevel.picklistName}</span>
                              : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Auto-derived</span>}
                          </div>
                        </DField>
                      </div>
                    </div>

                    {/* Child Values Grid */}
                    {mappingParentLevelId && mappingParentValueId && childLevel && (
                      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {childLevel.picklistName} Values
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {checkedChildValueIds.size} of {childValues.filter((v) => v.isActive).length} selected
                          </div>
                        </div>

                        {childValues.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                            No values found for {childLevel.picklistName}.
                          </div>
                        ) : (
                          <>
                            {/* Select All */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--color-surface-subtle)', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
                              onClick={toggleSelectAll}
                            >
                              <input
                                type="checkbox"
                                readOnly
                                checked={
                                  childValues.filter((v) => v.isActive).length > 0 &&
                                  childValues.filter((v) => v.isActive).every((v) => checkedChildValueIds.has(v.id))
                                }
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)', pointerEvents: 'none' }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>Select All Active</span>
                            </div>

                            {/* Child value rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {childValues.map((cv) => {
                                const isChecked = checkedChildValueIds.has(cv.id);
                                const isDisabled = !cv.isActive;
                                return (
                                  <div
                                    key={cv.id}
                                    onClick={() => !isDisabled && toggleChildValue(cv.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid', borderColor: isChecked ? '#BFDBFE' : 'var(--color-border)', background: isChecked ? '#EFF6FF' : 'var(--color-surface)', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, transition: 'all 0.15s' }}
                                  >
                                    <input
                                      type="checkbox"
                                      readOnly
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', flexShrink: 0, pointerEvents: 'none' }}
                                    />
                                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: '#6366F1', background: '#EEF2FF', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>{cv.code}</span>
                                    <span style={{ flex: 1, fontSize: '13px', fontWeight: isChecked ? 600 : 400, color: 'var(--color-text)' }}>{cv.name}</span>
                                    {isDisabled && <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>Inactive</span>}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Save Mapping */}
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {checkedChildValueIds.size > 0 ? `${checkedChildValueIds.size} child value(s) will be mapped` : 'Select at least one child value'}
                              </span>
                              <button
                                type="button"
                                onClick={saveMapping}
                                disabled={checkedChildValueIds.size === 0}
                                style={{ ...btnPrimary, opacity: checkedChildValueIds.size > 0 ? 1 : 0.5, cursor: checkedChildValueIds.size > 0 ? 'pointer' : 'not-allowed' }}
                              >
                                <Save size={13} />Save Mapping
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Existing Mappings Summary */}
                    {mappings.filter((m) => m.configId === mappingConfigFilter && m.isActive).length > 0 && (
                      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Existing Mappings</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '8px 12px', background: 'var(--color-surface-subtle)', borderRadius: '6px', marginBottom: '4px' }}>
                          {['Parent Level', 'Parent Value', 'Child Value'].map((h) => (
                            <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)' }}>{h}</div>
                          ))}
                        </div>
                        {mappings.filter((m) => m.configId === mappingConfigFilter && m.isActive).map((m, i) => {
                          const pLvl = levels.find((l) => l.id === m.parentLevelId);
                          const pVal = values.find((v) => v.id === m.parentValueId);
                          const cVal = values.find((v) => v.id === m.childValueId);
                          return (
                            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 12px', borderRadius: '6px', background: i % 2 !== 0 ? 'var(--color-surface-subtle)' : 'transparent' }}>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{pLvl?.picklistName ?? '—'}</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{pVal?.name ?? '—'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{cVal?.name ?? '—'}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}
          </div>
        )}

        {/* ── Review section ─────────────────────────────────────────── */}
        {activeSection === 'review' && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {summaryItems.map((s) => (
                <div key={s.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Readiness Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reviewChecklist.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.passed ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertCircle size={14} color="#D97706" />}
                    <span style={{ fontSize: '13px' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" style={btnPrimary} onClick={() => setReviewDrawerOpen(true)}>
                <ClipboardCheck size={13} />Review &amp; Activate
              </button>
            </div>
          </div>
        )}

        {/* ── SmartPreviewDrawer — Config ──────────────────────────────── */}
        <SmartPreviewDrawer
          open={configPreviewOpen}
          onClose={() => setConfigPreviewOpen(false)}
          title={previewConfig?.name ?? ''}
          subtitle={previewConfig?.code}
          statusLabel={previewConfig?.isActive ? 'Active' : 'Inactive'}
          statusTone={previewConfig?.isActive ? 'active' : 'inactive'}
          sections={configPreviewSections}
          primaryAction={{ label: 'Edit', onClick: () => { setConfigPreviewOpen(false); if (previewConfig) openConfigForEdit(previewConfig); } }}
          dangerAction={{ label: 'Delete', onClick: () => { if (previewConfig) { deleteConfig(previewConfig.id); setConfigPreviewOpen(false); } } }}
        />

        {/* ── SmartPreviewDrawer — Level ───────────────────────────────── */}
        <SmartPreviewDrawer
          open={levelPreviewOpen}
          onClose={() => setLevelPreviewOpen(false)}
          title={previewLevel?.picklistName ?? ''}
          subtitle={`Sequence: ${previewLevel?.levelSequence ?? ''}`}
          sections={levelPreviewSections}
          primaryAction={{ label: 'Edit', onClick: () => { setLevelPreviewOpen(false); if (previewLevel) openLevelForEdit(previewLevel); } }}
          dangerAction={{ label: 'Delete', onClick: () => { if (previewLevel) { deleteLevel(previewLevel.id); setLevelPreviewOpen(false); } } }}
        />

        {/* ── SmartPreviewDrawer — Value ───────────────────────────────── */}
        <SmartPreviewDrawer
          open={valuePreviewOpen}
          onClose={() => setValuePreviewOpen(false)}
          title={previewValue?.name ?? ''}
          subtitle={previewValue?.code}
          statusLabel={previewValue?.isActive ? 'Active' : 'Inactive'}
          statusTone={previewValue?.isActive ? 'active' : 'inactive'}
          sections={valuePreviewSections}
          primaryAction={{ label: 'Edit', onClick: () => { setValuePreviewOpen(false); if (previewValue) openValueForEdit(previewValue); } }}
          dangerAction={{ label: 'Delete', onClick: () => { if (previewValue) { deleteValue(previewValue.id); setValuePreviewOpen(false); } } }}
        />

        {/* ── SmartFormDrawer — Config ─────────────────────────────────── */}
        <SmartFormDrawer
          open={configFormOpen}
          onClose={() => setConfigFormOpen(false)}
          title={editingConfig ? 'Edit Configuration' : 'Add Configuration'}
          subtitle="Define a picklist type and its settings"
          onSave={saveConfig}
          saveDisabled={!configForm.name || !configForm.configurationType}
        >
          <DField label="Name" required>
            <DrawerInput value={configForm.name} onChange={(v) => setConfigForm((f) => ({ ...f, name: v }))} placeholder="e.g. Region Type" />
          </DField>
          <DField label="Display Name" required mt>
            <DrawerInput value={configForm.displayName} onChange={(v) => setConfigForm((f) => ({ ...f, displayName: v }))} placeholder="e.g. Region / Type" />
          </DField>
          <DField label="Configuration Type" required mt>
            <select value={configForm.configurationType} onChange={(e) => setConfigForm((f) => ({ ...f, configurationType: e.target.value as PicklistConfig['configurationType'] }))} style={{ ...drawerInputBase, cursor: 'pointer' }}>
              <option value="">— Select —</option>
              {(['Independent', 'Dependent', 'Multi-Level Dependent'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </DField>
          <DField label="Description" mt>
            <DrawerInput value={configForm.description} onChange={(v) => setConfigForm((f) => ({ ...f, description: v }))} placeholder="Optional description" />
          </DField>
          <DField label="Active" mt>
            <Toggle checked={configForm.isActive} onChange={(v) => setConfigForm((f) => ({ ...f, isActive: v }))} />
          </DField>
        </SmartFormDrawer>

        {/* ── SmartFormDrawer — Level ──────────────────────────────────── */}
        <SmartFormDrawer
          open={levelFormOpen}
          onClose={() => setLevelFormOpen(false)}
          title={editingLevel ? 'Edit Level' : 'Add Level'}
          subtitle="Define a hierarchy level for a picklist"
          onSave={saveLevel}
          saveDisabled={!levelForm.picklistName || !levelForm.levelSequence || !levelForm.configId}
        >
          <DField label="Picklist Name" required>
            <DrawerInput value={levelForm.picklistName} onChange={(v) => setLevelForm((f) => ({ ...f, picklistName: v }))} placeholder="e.g. Country" />
          </DField>
          <DField label="Display Name" mt>
            <DrawerInput value={levelForm.displayName} onChange={(v) => setLevelForm((f) => ({ ...f, displayName: v }))} placeholder="e.g. Country" />
          </DField>
          <DField label="Config" required mt>
            <select value={levelForm.configId} onChange={(e) => setLevelForm((f) => ({ ...f, configId: e.target.value }))} style={{ ...drawerInputBase, cursor: 'pointer' }}>
              <option value="">— Select —</option>
              {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </DField>
          <DField label="Level Sequence" required mt>
            <DrawerInput value={levelForm.levelSequence} onChange={(v) => setLevelForm((f) => ({ ...f, levelSequence: v }))} placeholder="1" />
          </DField>
          <DField label="Allow Multi-Parent Mapping" mt>
            <Toggle checked={levelForm.allowMultipleParentMapping} onChange={(v) => setLevelForm((f) => ({ ...f, allowMultipleParentMapping: v }))} />
          </DField>
          <DField label="Allow Value Reuse" mt>
            <Toggle checked={levelForm.allowValueReuse} onChange={(v) => setLevelForm((f) => ({ ...f, allowValueReuse: v }))} />
          </DField>
        </SmartFormDrawer>

        {/* ── SmartFormDrawer — Value ──────────────────────────────────── */}
        <SmartFormDrawer
          open={valueFormOpen}
          onClose={() => setValueFormOpen(false)}
          title={editingValue ? 'Edit Value' : 'Add Value'}
          subtitle="Add a selectable value to a picklist level"
          onSave={saveValue}
          saveDisabled={!valueForm.configId || !valueForm.code || !valueForm.name || !valueForm.displayName}
        >
          <DField label="Code" required>
            <DrawerInput value={valueForm.code} onChange={(v) => setValueForm((f) => ({ ...f, code: v }))} placeholder="e.g. IN" />
          </DField>
          <DField label="Name" required mt>
            <DrawerInput value={valueForm.name} onChange={(v) => setValueForm((f) => ({ ...f, name: v }))} placeholder="e.g. India" />
          </DField>
          <DField label="Display Name" required mt>
            <DrawerInput value={valueForm.displayName} onChange={(v) => setValueForm((f) => ({ ...f, displayName: v }))} placeholder="e.g. India" />
          </DField>
          <DField label="Config" required mt>
            <select value={valueForm.configId} onChange={(e) => setValueForm((f) => ({ ...f, configId: e.target.value }))} style={{ ...drawerInputBase, cursor: 'pointer' }}>
              <option value="">— Select —</option>
              {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </DField>
          <DField label="Display Sequence" mt>
            <DrawerInput value={valueForm.displaySequence} onChange={(v) => setValueForm((f) => ({ ...f, displaySequence: v }))} placeholder="1" />
          </DField>
          <DField label="Active" mt>
            <Toggle checked={valueForm.isActive} onChange={(v) => setValueForm((f) => ({ ...f, isActive: v }))} />
          </DField>
          <DField label="Default" mt>
            <Toggle checked={valueForm.isDefault} onChange={(v) => setValueForm((f) => ({ ...f, isDefault: v }))} />
          </DField>
        </SmartFormDrawer>

        {/* ── SmartReviewDrawer ─────────────────────────────────────────── */}
        <SmartReviewDrawer
          open={reviewDrawerOpen}
          onClose={() => setReviewDrawerOpen(false)}
          title="Activate Picklist"
          subtitle="Review configuration before activating"
          description="Once activated, the picklist will be available across all modules that reference it."
          summaryFields={[
            { label: 'Configs',  value: String(configs.length)  },
            { label: 'Levels',   value: String(levels.length)   },
            { label: 'Values',   value: String(values.length)   },
            { label: 'Mappings', value: String(mappings.length) },
          ]}
          checklist={reviewChecklist}
          warningText="Activating this picklist will make it visible in all dependent modules."
          confirmLabel="Activate Picklist"
          confirmDisabled={reviewChecklist.some((c) => !c.passed)}
          onConfirm={() => { setReviewDrawerOpen(false); }}
        />

        {/* ── Help Drawer ───────────────────────────────────────────────── */}
        {picklistHelpTopic && (
          <HelpDrawer open={helpOpen} topic={picklistHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
        )}
      </AdminListPageShell>
    </AdminShell>
  );
};

export default PicklistMasterPage;

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '6px 14px', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  whiteSpace: 'nowrap', transition: 'opacity 0.15s',
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 600,
};

// ─── Filter select style ──────────────────────────────────────────────────────

const filterSelectStyle: React.CSSProperties = {
  height: '34px', padding: '0 10px', fontSize: '13px', fontWeight: 500,
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  cursor: 'pointer', outline: 'none',
};

// ─── Drawer input primitives ──────────────────────────────────────────────────

const drawerInputBase: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: '14px',
  border: '1px solid var(--color-border)', borderRadius: '10px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

interface DrawerInputProps { value: string; onChange: (v: string) => void; placeholder?: string; }
const DrawerInput: React.FC<DrawerInputProps> = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={drawerInputBase} />
);

// Reusable SVG chevron for selects
const ChevronSvg: React.FC = () => (
  <span style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

interface DFieldProps { label: string; required?: boolean; mt?: boolean; children: React.ReactNode; }
const DField: React.FC<DFieldProps> = ({ label, required, mt, children }) => (
  <div style={{ marginTop: mt ? '16px' : undefined }}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
  </div>
);

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; activeColor?: string; }
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, activeColor = '#2563EB' }) => (
  <button type="button" onClick={() => onChange(!checked)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: checked ? activeColor : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
    <span style={{ position: 'absolute', top: '2px', left: checked ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
  </button>
);

const roStyle: React.CSSProperties = {
  padding: '9px 14px', fontSize: '13px', color: 'var(--color-text)',
  background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)',
  borderRadius: '10px', minHeight: '42px', display: 'flex', alignItems: 'center',
};

interface FlagPillProps { on: boolean; }
const FlagPill: React.FC<FlagPillProps> = ({ on }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color: on ? '#15803D' : 'var(--color-text-muted)' }}>
    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: on ? '#16A34A' : '#94A3B8', flexShrink: 0 }} />
    {on ? 'Yes' : 'No'}
  </span>
);

interface ActionBtnProps { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode; }
const ActionBtn: React.FC<ActionBtnProps> = ({ onClick, title, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', border: 'none', borderRadius: '8px', background: 'transparent', color: danger ? '#DC2626' : 'var(--color-text-muted)', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
    onMouseEnter={(e) => { e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--color-surface-subtle)'; if (!danger) e.currentTarget.style.color = 'var(--color-text)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--color-text-muted)'; }}
  >
    {children}
  </button>
);

