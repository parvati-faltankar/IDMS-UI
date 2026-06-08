import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import AdminShell from '../AdminShell';
import { findGroupForMasterKey, findMasterByKey } from '../adminNavConfig';
import { recordRecentAdminMaster } from '../adminStorage';
import { AdminPageShell } from '../../experience/components/AdminPageShell';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';

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

type SectionKey = 'config' | 'levels' | 'values' | 'mapping';

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'config',  label: 'Picklist Configuration', description: 'Define picklist types and settings'      },
  { key: 'levels',  label: 'Picklist Levels',         description: 'Configure hierarchy levels'              },
  { key: 'values',  label: 'Picklist Values',         description: 'Add and manage picklist values'          },
  { key: 'mapping', label: 'Dependency Mapping',      description: 'Map parent and child value dependencies' },
];

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
  const [configs, setConfigs]                         = useState<PicklistConfig[]>(INITIAL_CONFIGS);
  const [configDrawerOpen, setConfigDrawerOpen]       = useState(false);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [editingConfig, setEditingConfig]             = useState<PicklistConfig | null>(null);
  const [configForm, setConfigForm]                   = useState<Omit<PicklistConfig, 'id'>>(EMPTY_CONFIG);

  // ── Levels state ──────────────────────────────────────────────────
  const [levels, setLevels]                             = useState<PicklistLevel[]>(INITIAL_LEVELS);
  const [levelConfigFilter, setLevelConfigFilter]       = useState('');
  const [levelDrawerOpen, setLevelDrawerOpen]           = useState(false);
  const [levelDrawerVisible, setLevelDrawerVisible]     = useState(false);
  const [editingLevel, setEditingLevel]                 = useState<PicklistLevel | null>(null);
  const [levelForm, setLevelForm]                       = useState<Omit<PicklistLevel, 'id'>>(EMPTY_LEVEL);

  // ── Values state ──────────────────────────────────────────────────
  const [values, setValues]                             = useState<PicklistValue[]>(INITIAL_VALUES);
  const [valueConfigFilter, setValueConfigFilter]       = useState('');
  const [valueLevelFilter, setValueLevelFilter]         = useState('');
  const [valueDrawerOpen, setValueDrawerOpen]           = useState(false);
  const [valueDrawerVisible, setValueDrawerVisible]     = useState(false);
  const [editingValue, setEditingValue]                 = useState<PicklistValue | null>(null);
  const [valueForm, setValueForm]                       = useState<Omit<PicklistValue, 'id'>>(EMPTY_VALUE);

  // ── Mapping state ─────────────────────────────────────────────────
  const [mappings, setMappings]                             = useState<DependencyMapping[]>(INITIAL_MAPPINGS);
  const [mappingConfigFilter, setMappingConfigFilter]       = useState('');
  const [mappingParentLevelId, setMappingParentLevelId]     = useState('');
  const [mappingParentValueId, setMappingParentValueId]     = useState('');
  const [checkedChildValueIds, setCheckedChildValueIds]     = useState<Set<string>>(new Set());

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
    setConfigDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setConfigDrawerVisible(true)));
  };
  const openConfigForEdit = (entry: PicklistConfig) => {
    setEditingConfig(entry);
    const { id: _id, ...rest } = entry;
    setConfigForm({ ...rest });
    setConfigDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setConfigDrawerVisible(true)));
  };
  const closeConfigDrawer = () => {
    setConfigDrawerVisible(false);
    window.setTimeout(() => setConfigDrawerOpen(false), 250);
  };
  const saveConfig = () => {
    if (!configForm.name || !configForm.configurationType) return;
    if (editingConfig) {
      setConfigs((prev) => prev.map((e) => e.id === editingConfig.id ? { ...configForm, id: editingConfig.id } : e));
    } else {
      const newCode = `PCK-${String(configs.length + 1).padStart(3, '0')}`;
      setConfigs((prev) => [...prev, { ...configForm, code: newCode, id: Date.now().toString() }]);
    }
    closeConfigDrawer();
  };
  const deleteConfig = (id: string) => setConfigs((prev) => prev.filter((e) => e.id !== id));

  // ── Level handlers ────────────────────────────────────────────────
  const openLevelForCreate = () => {
    setEditingLevel(null);
    setLevelForm({ ...EMPTY_LEVEL, configId: levelConfigFilter });
    setLevelDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setLevelDrawerVisible(true)));
  };
  const openLevelForEdit = (entry: PicklistLevel) => {
    setEditingLevel(entry);
    const { id: _id, ...rest } = entry;
    setLevelForm({ ...rest });
    setLevelDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setLevelDrawerVisible(true)));
  };
  const closeLevelDrawer = () => {
    setLevelDrawerVisible(false);
    window.setTimeout(() => setLevelDrawerOpen(false), 250);
  };
  const saveLevel = () => {
    if (!levelForm.picklistName || !levelForm.levelSequence || !levelForm.configId) return;
    if (editingLevel) {
      setLevels((prev) => prev.map((e) => e.id === editingLevel.id ? { ...levelForm, id: editingLevel.id } : e));
    } else {
      setLevels((prev) => [...prev, { ...levelForm, id: `LVL-${Date.now()}` }]);
    }
    closeLevelDrawer();
  };
  const deleteLevel = (id: string) => setLevels((prev) => prev.filter((e) => e.id !== id));

  // ── Value handlers ────────────────────────────────────────────────
  const openValueForCreate = () => {
    setEditingValue(null);
    const selCfg = configs.find((c) => c.id === valueConfigFilter);
    const autoLevel = selCfg?.configurationType === 'Independent' ? 'DEFAULT' : valueLevelFilter;
    setValueForm({ ...EMPTY_VALUE, configId: valueConfigFilter, levelId: autoLevel });
    setValueDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setValueDrawerVisible(true)));
  };
  const openValueForEdit = (entry: PicklistValue) => {
    setEditingValue(entry);
    const { id: _id, ...rest } = entry;
    setValueForm({ ...rest });
    setValueDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setValueDrawerVisible(true)));
  };
  const closeValueDrawer = () => {
    setValueDrawerVisible(false);
    window.setTimeout(() => setValueDrawerOpen(false), 250);
  };
  const saveValue = () => {
    if (!valueForm.configId || !valueForm.code || !valueForm.name || !valueForm.displayName) return;
    if (editingValue) {
      setValues((prev) => prev.map((e) => e.id === editingValue.id ? { ...valueForm, id: editingValue.id } : e));
    } else {
      setValues((prev) => [...prev, { ...valueForm, id: `VAL-${Date.now()}` }]);
    }
    closeValueDrawer();
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

  // ── Filtered lists ────────────────────────────────────────────────
  const filteredLevels = [...levels]
    .filter((l) => !levelConfigFilter || l.configId === levelConfigFilter)
    .sort((a, b) => parseInt(a.levelSequence) - parseInt(b.levelSequence));

  const filteredValues = values
    .filter((v) => !valueConfigFilter || v.configId === valueConfigFilter)
    .filter((v) => !valueLevelFilter || v.levelId === valueLevelFilter);

  if (!master || !group) return null;

  const picklistHelpTopic = useMemo(() => getHelpTopic(helpTopicId), [helpTopicId]);

  return (
    <AdminShell>
      <AdminPageShell
        title={master.label}
        description={master.description}
        breadcrumbs={['Admin', group.label]}
        helpTopicId={helpTopicId}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        summaryItems={[
          { label: 'Configurations', value: configs.length },
          { label: 'Levels', value: levels.length },
          { label: 'Values', value: values.length },
          { label: 'Mappings', value: mappings.length },
        ]}
        toolbar={
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {SECTIONS.map((s, i) => {
              const isActive = activeSection === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setActiveSection(s.key)}
                  style={{
                    padding: '6px 16px', fontSize: '13px',
                    fontWeight: isActive ? 600 : 400, border: 'none',
                    borderRight: i < SECTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        }
      >

            {/* ──────── SECTION 1: Picklist Configuration ──────── */}
            {activeSection === 'config' && (
              <div>
                <div style={{ background: 'var(--color-surface)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Picklist Configuration</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Define picklist types and their configuration rules.</div>
                  </div>
                  <button type="button" onClick={openConfigForCreate} style={{ ...btnPrimary, flexShrink: 0 }}>
                    <Plus size={13} />New Configuration
                  </button>
                </div>

                {configs.length === 0 ? (
                  <div style={{ padding: '64px 28px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No configurations yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                      Create a picklist configuration to define its type and structure.
                    </div>
                    <button type="button" onClick={openConfigForCreate} style={btnPrimary}>
                      <Plus size={13} />Create First Configuration
                    </button>
                  </div>
                ) : (
                  <div style={{ background: 'var(--color-surface)', margin: '20px 24px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 210px 90px 80px', alignItems: 'center', padding: '10px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
                      {(['Code', 'Configuration Name', 'Type', 'Status', 'Actions'] as const).map((label, i) => (
                        <div key={label} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textAlign: i === 4 ? 'right' : 'left' }}>{label}</div>
                      ))}
                    </div>
                    {configs.map((entry, idx) => {
                      const tc = getConfigTypeColor(entry.configurationType);
                      return (
                        <div
                          key={entry.id}
                          style={{ display: 'grid', gridTemplateColumns: '110px 1fr 210px 90px 80px', alignItems: 'center', padding: '14px 20px', borderBottom: idx < configs.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s', cursor: 'default' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>{entry.code}</span>
                          </div>
                          <div style={{ minWidth: 0, paddingRight: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                            {entry.displayName !== entry.name && (
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.displayName}</div>
                            )}
                          </div>
                          <div>
                            <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: tc.bg, color: tc.text, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                              {entry.configurationType.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', background: entry.isActive ? 'color-mix(in srgb, #10b981 15%, var(--color-surface))' : 'var(--color-surface-subtle)', color: entry.isActive ? 'color-mix(in srgb, #10b981 85%, var(--color-text))' : 'var(--color-text-muted)' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: entry.isActive ? 'color-mix(in srgb, #10b981 90%, var(--color-text))' : 'var(--color-border)', flexShrink: 0 }} />
                              {entry.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => openConfigForEdit(entry)} title="Edit"><Edit2 size={14} /></ActionBtn>
                            <ActionBtn onClick={() => deleteConfig(entry.id)} title="Delete" danger><Trash2 size={14} /></ActionBtn>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{configs.length}</strong> of <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{configs.length}</strong> {configs.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── SECTION 2: Picklist Levels ──────── */}
            {activeSection === 'levels' && (
              <div>
                <div style={{ background: 'var(--color-surface)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Picklist Levels</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Configure hierarchy levels for dependent picklists.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={levelConfigFilter} onChange={(e) => setLevelConfigFilter(e.target.value)} style={filterSelectStyle}>
                      <option value="">All Configurations</option>
                      {dependentConfigs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={openLevelForCreate} style={{ ...btnPrimary, flexShrink: 0 }}>
                      <Plus size={13} />Add Level
                    </button>
                  </div>
                </div>

                {dependentConfigs.length === 0 && (
                  <div style={{ margin: '20px 24px', padding: '16px 20px', background: 'color-mix(in srgb, #f59e0b 8%, var(--color-surface))', border: '1px solid color-mix(in srgb, #f59e0b 30%, var(--color-border))', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>ℹ️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'color-mix(in srgb, #f59e0b 80%, var(--color-text))', marginBottom: '2px' }}>No dependent configurations</div>
                      <div style={{ fontSize: '12px', color: 'color-mix(in srgb, #f59e0b 65%, var(--color-text-muted))', lineHeight: 1.5 }}>Levels apply only to Dependent and Multi-Level Dependent picklists. Add a configuration of those types first.</div>
                    </div>
                  </div>
                )}

                {filteredLevels.length === 0 && dependentConfigs.length > 0 ? (
                  <div style={{ padding: '64px 28px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No levels configured yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                      Add levels to define the hierarchy structure of your dependent picklist.
                    </div>
                    <button type="button" onClick={openLevelForCreate} style={btnPrimary}><Plus size={13} />Add First Level</button>
                  </div>
                ) : filteredLevels.length > 0 ? (
                  <div style={{ background: 'var(--color-surface)', margin: '20px 24px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 70px 120px 110px 70px', alignItems: 'center', padding: '10px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
                      {(['Seq', 'Picklist Name', 'Display Name', 'Root', 'Multi-Parent', 'Value Reuse', 'Actions'] as const).map((label, i) => (
                        <div key={label} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textAlign: i === 6 ? 'right' : 'left' }}>{label}</div>
                      ))}
                    </div>
                    {filteredLevels.map((level, idx) => {
                      const isRoot = level.levelSequence === '1' || level.parentLevelId === '';
                      const parentLvl = levels.find((l) => l.id === level.parentLevelId);
                      const cfgObj = configs.find((c) => c.id === level.configId);
                      return (
                        <div
                          key={level.id}
                          style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 70px 120px 110px 70px', alignItems: 'center', padding: '14px 20px', borderBottom: idx < filteredLevels.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s', cursor: 'default' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-subtle)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '13px', fontWeight: 700 }}>{level.levelSequence}</span>
                          </div>
                          <div style={{ minWidth: 0, paddingRight: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{level.picklistName}</div>
                            {cfgObj && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{cfgObj.name}</div>}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{level.displayName || '—'}</div>
                          <div>
                            {isRoot
                              ? <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: '#F0FDF4', color: '#15803D' }}>ROOT</span>
                              : <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>↳ {parentLvl?.picklistName ?? '—'}</span>}
                          </div>
                          <div><FlagPill on={level.allowMultipleParentMapping} /></div>
                          <div><FlagPill on={level.allowValueReuse} /></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => openLevelForEdit(level)} title="Edit"><Edit2 size={14} /></ActionBtn>
                            <ActionBtn onClick={() => deleteLevel(level.id)} title="Delete" danger><Trash2 size={14} /></ActionBtn>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filteredLevels.length}</strong> of <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{filteredLevels.length}</strong> {filteredLevels.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ──────── SECTION 3: Picklist Values ──────── */}
            {activeSection === 'values' && (
              <div>
                <div style={{ background: 'var(--color-surface)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Picklist Values</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Add and manage dropdown values for each picklist level.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select value={valueConfigFilter} onChange={(e) => { setValueConfigFilter(e.target.value); setValueLevelFilter(''); }} style={filterSelectStyle}>
                      <option value="">All Configurations</option>
                      {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {valueConfigFilter && configs.find((c) => c.id === valueConfigFilter)?.configurationType !== 'Independent' && (
                      <select value={valueLevelFilter} onChange={(e) => setValueLevelFilter(e.target.value)} style={filterSelectStyle}>
                        <option value="">All Levels</option>
                        {levels
                          .filter((l) => l.configId === valueConfigFilter)
                          .sort((a, b) => parseInt(a.levelSequence) - parseInt(b.levelSequence))
                          .map((l) => <option key={l.id} value={l.id}>{l.picklistName}</option>)}
                      </select>
                    )}
                    <button type="button" onClick={openValueForCreate} style={{ ...btnPrimary, flexShrink: 0 }}>
                      <Plus size={13} />Add Value
                    </button>
                  </div>
                </div>

                {filteredValues.length === 0 ? (
                  <div style={{ padding: '64px 28px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>No values added yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                      Add values for your picklist to use in dropdown fields across the system.
                    </div>
                    <button type="button" onClick={openValueForCreate} style={btnPrimary}><Plus size={13} />Add First Value</button>
                  </div>
                ) : (
                  <div style={{ background: 'var(--color-surface)', margin: '20px 24px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 60px 80px 90px 70px', alignItems: 'center', padding: '10px 20px', background: 'var(--color-surface-subtle)', borderBottom: '1.5px solid var(--color-border)' }}>
                      {(['Code', 'Name', 'Display Name', 'Seq', 'Default', 'Status', 'Actions'] as const).map((label, i) => (
                        <div key={label} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', textAlign: i === 6 ? 'right' : 'left' }}>{label}</div>
                      ))}
                    </div>
                    {filteredValues.map((val, idx) => {
                      const lvlObj = val.levelId !== 'DEFAULT' ? levels.find((l) => l.id === val.levelId) : null;
                      const cfgObj = configs.find((c) => c.id === val.configId);
                      return (
                        <div
                          key={val.id}
                          style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 60px 80px 90px 70px', alignItems: 'center', padding: '14px 20px', borderBottom: idx < filteredValues.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.1s', cursor: 'default' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div>
                            <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{val.code}</span>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '1px' }}>{lvlObj?.picklistName ?? cfgObj?.name ?? ''}</div>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{val.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{val.displayName}</div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{val.displaySequence || '—'}</div>
                          <div>
                            {val.isDefault
                              ? <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', background: '#FEF9C3', color: '#A16207' }}>DEFAULT</span>
                              : <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>}
                          </div>
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', background: val.isActive ? '#DCFCE7' : '#F1F5F9', color: val.isActive ? '#15803D' : '#64748B' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: val.isActive ? '#16A34A' : '#94A3B8', flexShrink: 0 }} />
                              {val.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => openValueForEdit(val)} title="Edit"><Edit2 size={14} /></ActionBtn>
                            <ActionBtn onClick={() => deleteValue(val.id)} title="Delete" danger><Trash2 size={14} /></ActionBtn>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Showing <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>1–{filteredValues.length}</strong> of <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{filteredValues.length}</strong> {filteredValues.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── SECTION 4: Dependency Mapping ──────── */}
            {activeSection === 'mapping' && (
              <div>
                <div style={{ background: 'var(--color-surface)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Dependency Mapping</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Map parent values to their corresponding child values.</div>
                  </div>
                  <select
                    value={mappingConfigFilter}
                    onChange={(e) => { setMappingConfigFilter(e.target.value); setMappingParentLevelId(''); setMappingParentValueId(''); }}
                    style={filterSelectStyle}
                  >
                    <option value="">Select Configuration</option>
                    {dependentConfigs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

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

      </AdminPageShell>

      {/* ── Config Drawer ── */}
      {configDrawerOpen && (
        <ConfigDrawer
          visible={configDrawerVisible}
          isEdit={!!editingConfig}
          formData={configForm}
          onClose={closeConfigDrawer}
          onChangeField={(f, v) => setConfigForm((prev) => ({ ...prev, [f]: v } as Omit<PicklistConfig, 'id'>))}
          onSave={saveConfig}
        />
      )}

      {/* ── Level Drawer ── */}
      {levelDrawerOpen && (
        <LevelDrawer
          visible={levelDrawerVisible}
          isEdit={!!editingLevel}
          formData={levelForm}
          configs={dependentConfigs}
          levels={levels}
          onClose={closeLevelDrawer}
          onChangeField={(f, v) => setLevelForm((prev) => ({ ...prev, [f]: v } as Omit<PicklistLevel, 'id'>))}
          onSave={saveLevel}
        />
      )}

      {/* ── Value Drawer ── */}
      {valueDrawerOpen && (
        <ValueDrawer
          visible={valueDrawerVisible}
          isEdit={!!editingValue}
          formData={valueForm}
          configs={configs}
          levels={levels}
          onClose={closeValueDrawer}
          onChangeField={(f, v) => setValueForm((prev) => ({ ...prev, [f]: v } as Omit<PicklistValue, 'id'>))}
          onSave={saveValue}
        />
      )}

      {picklistHelpTopic && (
        <HelpDrawer open={helpOpen} topic={picklistHelpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
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

interface DrawerSelectProps { value: string; onChange: (v: string) => void; options: string[]; }
const DrawerSelect: React.FC<DrawerSelectProps> = ({ value, onChange, options }) => (
  <div style={{ position: 'relative' }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}>
      <option value="">— Select —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronSvg />
  </div>
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

// ─── ConfigDrawer ─────────────────────────────────────────────────────────────

interface ConfigDrawerProps {
  visible: boolean; isEdit: boolean; formData: Omit<PicklistConfig, 'id'>;
  onClose: () => void;
  onChangeField: (f: keyof Omit<PicklistConfig, 'id'>, v: string | boolean) => void;
  onSave: () => void;
}
const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ visible, isEdit, formData, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.name && !!formData.configurationType;
  const subHead: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '500px', background: 'var(--color-surface-subtle)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', height: '52px', padding: '0 4px' }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', flexShrink: 0, borderRadius: '8px' }}><ArrowLeft size={20} strokeWidth={2} /></button>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', paddingLeft: '4px' }}>{isEdit ? 'Edit Picklist Configuration' : 'New Picklist Configuration'}</span>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, borderRadius: '8px' }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Identity Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Identity</div>
            <DField label="Configuration Code">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, flexShrink: 0 }}>AUTO</span>
                <span style={{ fontSize: '13px', color: formData.code ? 'var(--color-text)' : 'var(--color-text-muted)', fontFamily: formData.code ? 'monospace' : undefined }}>{formData.code || 'System generated'}</span>
              </div>
            </DField>
            <DField label="Name" required mt>
              <DrawerInput value={formData.name} onChange={(v) => onChangeField('name', v)} placeholder="e.g. Country, Region District" />
            </DField>
            <DField label="Display Name" required mt>
              <DrawerInput value={formData.displayName} onChange={(v) => onChangeField('displayName', v)} placeholder="e.g. Country / Region" />
            </DField>
            <DField label="Description" mt>
              <textarea value={formData.description} onChange={(e) => onChangeField('description', e.target.value)} placeholder="Briefly describe this picklist configuration…" rows={2} style={{ ...drawerInputBase, resize: 'none', lineHeight: 1.5 }} />
            </DField>
          </div>

          {/* Configuration Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Configuration</div>
            <DField label="Configuration Type" required>
              <DrawerSelect
                value={formData.configurationType}
                onChange={(v) => onChangeField('configurationType', v as PicklistConfig['configurationType'])}
                options={['Independent', 'Dependent', 'Multi-Level Dependent']}
              />
            </DField>
            <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--color-surface-subtle)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                {formData.configurationType === 'Independent' && 'Independent — No hierarchy, simple flat list'}
                {formData.configurationType === 'Dependent' && 'Dependent — Two-level parent → child hierarchy'}
                {formData.configurationType === 'Multi-Level Dependent' && 'Multi-Level — Three or more levels of hierarchy'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {formData.configurationType === 'Independent' && 'Values are standalone with no parent-child dependency. Levels and Dependency Mapping are not applicable.'}
                {formData.configurationType === 'Dependent' && 'Child values depend on parent selection. Configure Levels and Dependency Mapping after saving.'}
                {formData.configurationType === 'Multi-Level Dependent' && 'Supports three or more hierarchy levels, e.g. Country → State → City. Configure all levels and mappings after saving.'}
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: isEdit ? '12px' : '0' }}>
            <div style={subHead}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Is Active</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Active configurations can be used in forms and dropdowns</div>
              </div>
              <Toggle checked={formData.isActive} onChange={(v) => onChangeField('isActive', v)} activeColor="#16a34a" />
            </div>
          </div>

          {/* System Info (edit only) */}
          {isEdit && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={subHead}>System Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <DField label="Created By"><div style={roStyle}>{formData.createdBy || '—'}</div></DField>
                <DField label="Created Date"><div style={roStyle}>{formData.createdDate || '—'}</div></DField>
                <DField label="Last Modified By"><div style={roStyle}>{formData.lastModifiedBy || '—'}</div></DField>
                <DField label="Last Modified Date"><div style={roStyle}>{formData.lastModifiedDate || '—'}</div></DField>
              </div>
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
          <button type="button" onClick={onSave} disabled={!canSave} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={13} />Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── LevelDrawer ─────────────────────────────────────────────────────────────

interface LevelDrawerProps {
  visible: boolean; isEdit: boolean; formData: Omit<PicklistLevel, 'id'>;
  configs: PicklistConfig[]; levels: PicklistLevel[];
  onClose: () => void;
  onChangeField: (f: keyof Omit<PicklistLevel, 'id'>, v: string | boolean) => void;
  onSave: () => void;
}
const LevelDrawer: React.FC<LevelDrawerProps> = ({ visible, isEdit, formData, configs, levels, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.configId && !!formData.picklistName && !!formData.levelSequence;
  const seq = parseInt(formData.levelSequence || '0', 10);
  const isRoot = seq <= 1;
  const existingLevels = levels.filter((l) => l.configId === formData.configId);
  const subHead: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '480px', background: 'var(--color-surface-subtle)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', height: '52px', padding: '0 4px' }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', flexShrink: 0, borderRadius: '8px' }}><ArrowLeft size={20} strokeWidth={2} /></button>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', paddingLeft: '4px' }}>{isEdit ? 'Edit Picklist Level' : 'New Picklist Level'}</span>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, borderRadius: '8px' }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Scope Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Scope</div>
            <DField label="Configuration" required>
              <div style={{ position: 'relative' }}>
                <select value={formData.configId} onChange={(e) => onChangeField('configId', e.target.value)} style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}>
                  <option value="">— Select configuration —</option>
                  {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronSvg />
              </div>
            </DField>
          </div>

          {/* Level Details Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Level Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DField label="Level Sequence" required>
                <DrawerInput value={formData.levelSequence} onChange={(v) => onChangeField('levelSequence', v)} placeholder="1" />
              </DField>
              <DField label="Is Root Level">
                <div style={roStyle}>
                  {isRoot
                    ? <span style={{ fontWeight: 700, color: '#15803D' }}>✓ Root Level</span>
                    : <span style={{ color: 'var(--color-text-muted)' }}>Not root</span>}
                </div>
              </DField>
            </div>

            {!isRoot && (
              <DField label="Parent Level" required mt>
                <div style={{ position: 'relative' }}>
                  <select value={formData.parentLevelId} onChange={(e) => onChangeField('parentLevelId', e.target.value)} style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}>
                    <option value="">— Select parent level —</option>
                    {existingLevels.filter((l) => parseInt(l.levelSequence) < seq).map((l) => (
                      <option key={l.id} value={l.id}>{l.picklistName} (Seq {l.levelSequence})</option>
                    ))}
                  </select>
                  <ChevronSvg />
                </div>
              </DField>
            )}

            <DField label="Picklist Name" required mt>
              <DrawerInput value={formData.picklistName} onChange={(v) => onChangeField('picklistName', v)} placeholder="e.g. Region, State, City" />
            </DField>
            <DField label="Display Name" mt>
              <DrawerInput value={formData.displayName} onChange={(v) => onChangeField('displayName', v)} placeholder="e.g. Geographic Region" />
            </DField>
          </div>

          {/* Settings Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
            <div style={subHead}>Settings</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Allow Multiple Parent Mapping</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>One child value can map to multiple parent values</div>
              </div>
              <Toggle checked={formData.allowMultipleParentMapping} onChange={(v) => onChangeField('allowMultipleParentMapping', v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Allow Value Reuse</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Allow duplicate value names within this level</div>
              </div>
              <Toggle checked={formData.allowValueReuse} onChange={(v) => onChangeField('allowValueReuse', v)} />
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
          <button type="button" onClick={onSave} disabled={!canSave} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={13} />Save Level
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ValueDrawer ──────────────────────────────────────────────────────────────

interface ValueDrawerProps {
  visible: boolean; isEdit: boolean; formData: Omit<PicklistValue, 'id'>;
  configs: PicklistConfig[]; levels: PicklistLevel[];
  onClose: () => void;
  onChangeField: (f: keyof Omit<PicklistValue, 'id'>, v: string | boolean) => void;
  onSave: () => void;
}
const ValueDrawer: React.FC<ValueDrawerProps> = ({ visible, isEdit, formData, configs, levels, onClose, onChangeField, onSave }) => {
  const canSave = !!formData.configId && !!formData.code && !!formData.name && !!formData.displayName;
  const selectedConfig = configs.find((c) => c.id === formData.configId);
  const isIndependent = selectedConfig?.configurationType === 'Independent';
  const configLevels = levels
    .filter((l) => l.configId === formData.configId)
    .sort((a, b) => parseInt(a.levelSequence) - parseInt(b.levelSequence));
  const subHead: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${visible ? 0.35 : 0})`, transition: 'background 0.25s ease' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '500px', background: 'var(--color-surface-subtle)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', transform: visible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', height: '52px', padding: '0 4px' }}>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', flexShrink: 0, borderRadius: '8px' }}><ArrowLeft size={20} strokeWidth={2} /></button>
          <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', paddingLeft: '4px' }}>{isEdit ? 'Edit Picklist Value' : 'New Picklist Value'}</span>
          <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0, borderRadius: '8px' }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Scope Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Scope</div>
            <DField label="Configuration" required>
              <div style={{ position: 'relative' }}>
                <select
                  value={formData.configId}
                  onChange={(e) => { onChangeField('configId', e.target.value); onChangeField('levelId', ''); }}
                  style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}
                >
                  <option value="">— Select configuration —</option>
                  {configs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronSvg />
              </div>
            </DField>
            {formData.configId && (
              <DField label="Picklist Level" required={!isIndependent} mt>
                {isIndependent ? (
                  <div style={roStyle}>
                    <span style={{ fontWeight: 600 }}>{selectedConfig?.name ?? 'Default'}</span>
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>(auto-assigned)</span>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select value={formData.levelId} onChange={(e) => onChangeField('levelId', e.target.value)} style={{ ...drawerInputBase, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', paddingRight: '38px' }}>
                      <option value="">— Select level —</option>
                      {configLevels.map((l) => <option key={l.id} value={l.id}>{l.picklistName} (Level {l.levelSequence})</option>)}
                    </select>
                    <ChevronSvg />
                  </div>
                )}
              </DField>
            )}
          </div>

          {/* Value Details Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={subHead}>Value Details</div>
            <DField label="Code" required>
              <DrawerInput value={formData.code} onChange={(v) => onChangeField('code', v)} placeholder="e.g. INDIA, NORTH, DEL" />
            </DField>
            <DField label="Name" required mt>
              <DrawerInput value={formData.name} onChange={(v) => onChangeField('name', v)} placeholder="e.g. India, North, Delhi" />
            </DField>
            <DField label="Display Name" required mt>
              <DrawerInput value={formData.displayName} onChange={(v) => onChangeField('displayName', v)} placeholder="e.g. India (IN)" />
            </DField>
            <DField label="Description" mt>
              <textarea value={formData.description} onChange={(e) => onChangeField('description', e.target.value)} placeholder="Optional description…" rows={2} style={{ ...drawerInputBase, resize: 'none', lineHeight: 1.5 }} />
            </DField>
            <DField label="Display Sequence" mt>
              <DrawerInput value={formData.displaySequence} onChange={(v) => onChangeField('displaySequence', v)} placeholder="e.g. 1, 2, 3" />
            </DField>
          </div>

          {/* Status Card */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
            <div style={subHead}>Status & Defaults</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Is Active</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Inactive values cannot be used in active mappings</div>
              </div>
              <Toggle checked={formData.isActive} onChange={(v) => onChangeField('isActive', v)} activeColor="#16a34a" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>Is Default</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Only one default value allowed per level</div>
              </div>
              <Toggle checked={formData.isDefault} onChange={(v) => onChangeField('isDefault', v)} activeColor="#D97706" />
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 16px' }}>
          <button type="button" onClick={onSave} disabled={!canSave} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            <Save size={13} />Save Value
          </button>
        </div>
      </div>
    </div>
  );
};
