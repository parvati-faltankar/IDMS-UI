import React, { useEffect, useMemo, useState } from 'react';
import { ListOrdered, Plus, Rows3, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../../AdminShell';
import { MasterCreateFormShell } from '../../../../experience/components';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { findGroupForMasterKey, findMasterByKey } from '../../../adminNavConfig';
import { recordRecentAdminMaster } from '../../../adminStorage';
import {
  loadPicklistMasterState,
  savePicklistMasterState,
  PICKLIST_ENTITY_OPTIONS,
  PICKLIST_ENTITY_TYPE_OPTIONS,
  type PicklistConfigRecord,
  type PicklistConfigType,
  type PicklistLevelRecord,
  type PicklistMasterState,
  type PicklistValueRecord,
} from '../picklistMasterStore';

const MASTER_KEY = 'picklist-master';

type StepKey = 'overview' | 'values';
type UiStatus = 'Active' | 'Inactive';

interface PicklistFormState {
  code: string;
  name: string;
  displayName: string;
  entity: string;
  entityType: string;
  description: string;
  configurationType: PicklistConfigType;
  status: UiStatus;
  dependentParentConfigId: string;
  dependentParentValueId: string;
}

interface ValueGridRow {
  id: string;
  levelId: string;
  name: string;
  code: string;
  displayName: string;
  displaySequence: string;
  isDefault: boolean;
  status: UiStatus;
  description: string;
}

const STEPS: Array<{ key: StepKey; label: string; hint: string }> = [
  { key: 'overview', label: 'Overview', hint: 'Define the picklist identity, scope, and control behavior.' },
  { key: 'values', label: 'Values', hint: 'Manage picklist values in a fast inline-entry grid.' },
];

const EMPTY_FORM: PicklistFormState = {
  code: '',
  name: '',
  displayName: '',
  entity: PICKLIST_ENTITY_OPTIONS[0],
  entityType: PICKLIST_ENTITY_TYPE_OPTIONS[0],
  description: '',
  configurationType: 'Independent',
  status: 'Active',
  dependentParentConfigId: '',
  dependentParentValueId: '',
};

function makeTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function makeRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyValueRow(levelId: string): ValueGridRow {
  return {
    id: makeRowId('GRID'),
    levelId,
    name: '',
    code: '',
    displayName: '',
    displaySequence: '',
    isDefault: false,
    status: 'Active',
    description: '',
  };
}

function configToForm(config: PicklistConfigRecord): PicklistFormState {
  return {
    code: config.code,
    name: config.name,
    displayName: config.displayName,
    entity: config.entity || PICKLIST_ENTITY_OPTIONS[0],
    entityType: config.entityType || PICKLIST_ENTITY_TYPE_OPTIONS[0],
    description: config.description,
    configurationType: config.configurationType,
    status: config.isActive ? 'Active' : 'Inactive',
    dependentParentConfigId: config.dependentParentConfigId || '',
    dependentParentValueId: config.dependentParentValueId || '',
  };
}

function valueToGridRow(value: PicklistValueRecord): ValueGridRow {
  return {
    id: value.id,
    levelId: value.levelId,
    name: value.name,
    code: value.code,
    displayName: value.displayName,
    displaySequence: value.displaySequence,
    isDefault: value.isDefault,
    status: value.isActive ? 'Active' : 'Inactive',
    description: value.description,
  };
}

function levelSort(a: PicklistLevelRecord, b: PicklistLevelRecord): number {
  return Number(a.levelSequence) - Number(b.levelSequence);
}

const PicklistFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { configId } = useParams<{ configId: string }>();
  const isNew = !configId;
  const master = findMasterByKey(MASTER_KEY);
  const group = findGroupForMasterKey(MASTER_KEY);

  const [helpOpen, setHelpOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [helpTopicId, setHelpTopicId] = useState('picklist-master');
  const [form, setForm] = useState<PicklistFormState>(EMPTY_FORM);
  const [rows, setRows] = useState<ValueGridRow[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState('DEFAULT');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [storeState, setStoreState] = useState<PicklistMasterState>(() => loadPicklistMasterState());

  useEffect(() => {
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
  }, [group, master]);

  const existingConfig = useMemo(
    () => storeState.configs.find((entry) => entry.id === configId) ?? null,
    [configId, storeState.configs],
  );

  const configLevels = useMemo(
    () => storeState.levels.filter((level) => level.configId === configId).sort(levelSort),
    [configId, storeState.levels],
  );

  const levelOptions = useMemo(() => {
    if (form.configurationType !== 'Multi-Level') return [{ id: 'DEFAULT', label: 'Default Values' }];
    if (configLevels.length === 0) {
      return [{ id: 'DEFAULT', label: form.displayName || form.name || 'Base Level' }];
    }
    return configLevels.map((level) => ({
      id: level.id,
      label: `${level.picklistName} (Level ${level.levelSequence})`,
    }));
  }, [configLevels, form.configurationType, form.displayName, form.name]);

  const parentPicklistOptions = useMemo(
    () => storeState.configs.filter((entry) => entry.id !== configId && entry.isActive),
    [configId, storeState.configs],
  );

  const parentValueOptions = useMemo(() => {
    if (!form.dependentParentConfigId) return [];
    return storeState.values.filter((entry) => entry.configId === form.dependentParentConfigId && entry.isActive);
  }, [form.dependentParentConfigId, storeState.values]);

  const visibleRows = useMemo(() => {
    if (form.configurationType !== 'Multi-Level') return rows;
    return rows.filter((row) => row.levelId === selectedLevelId);
  }, [form.configurationType, rows, selectedLevelId]);

  useEffect(() => {
    if (!existingConfig && !isNew) return;
    if (existingConfig) {
      setForm(configToForm(existingConfig));
      setRows(
        storeState.values
          .filter((entry) => entry.configId === existingConfig.id)
          .sort((a, b) => Number(a.displaySequence || 0) - Number(b.displaySequence || 0))
          .map(valueToGridRow),
      );
    } else {
      setForm(EMPTY_FORM);
      setRows([makeEmptyValueRow('DEFAULT')]);
    }
  }, [existingConfig, isNew, storeState.values]);

  useEffect(() => {
    if (form.configurationType !== 'Multi-Level') {
      setSelectedLevelId('DEFAULT');
      setRows((prev) => prev.map((row) => ({ ...row, levelId: 'DEFAULT' })));
      return;
    }
    if (!levelOptions.some((option) => option.id === selectedLevelId)) {
      setSelectedLevelId(levelOptions[0]?.id ?? 'DEFAULT');
    }
  }, [form.configurationType, levelOptions, selectedLevelId]);

  useEffect(() => {
    if (!parentValueOptions.some((entry) => entry.id === form.dependentParentValueId)) {
      setForm((prev) => ({ ...prev, dependentParentValueId: '' }));
    }
  }, [form.dependentParentValueId, parentValueOptions]);

  if (!master || !group) return null;

  const helpTopic = getHelpTopic(helpTopicId);
  const pageTitle = existingConfig ? `Edit ${existingConfig.name}` : 'New Picklist';

  const validateOverview = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.code.trim()) nextErrors.code = 'Code is required.';
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.displayName.trim()) nextErrors.displayName = 'Display name is required.';
    if (!form.entity) nextErrors.entity = 'Entity is required.';
    if (!form.entityType) nextErrors.entityType = 'Entity type is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateValues = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (form.configurationType === 'Dependent') {
      if (!form.dependentParentConfigId) nextErrors.dependentParentConfigId = 'Parent picklist is required.';
      if (!form.dependentParentValueId) nextErrors.dependentParentValueId = 'Parent value is required.';
    }
    visibleRows.forEach((row, index) => {
      const key = `row-${row.id}`;
      if (!row.name.trim() && !row.code.trim() && !row.displayName.trim() && !row.description.trim()) return;
      if (!row.name.trim()) nextErrors[`${key}-name`] = `Row ${index + 1}: value name is required.`;
      if (!row.code.trim()) nextErrors[`${key}-code`] = `Row ${index + 1}: value code is required.`;
      if (!row.displayName.trim()) nextErrors[`${key}-displayName`] = `Row ${index + 1}: display name is required.`;
    });
    setErrors((prev) => {
      const retained = Object.fromEntries(
        Object.entries(prev).filter(([key]) =>
          !key.startsWith('row-') && key !== 'dependentParentConfigId' && key !== 'dependentParentValueId',
        ),
      );
      return { ...retained, ...nextErrors };
    });
    return Object.keys(nextErrors).length === 0;
  };

  const stepHasData = (stepIndex: number): boolean => {
    if (stepIndex === 0) {
      return Boolean(form.code || form.name || form.displayName || form.description);
    }
    return rows.some((row) => row.name || row.code || row.displayName || row.description);
  };
  const stepperSteps = STEPS.map((step, index) => ({
    id: String(index),
    label: step.label,
    tooltipLabel: step.hint,
    icon: index === 0 ? <ListOrdered size={14} /> : <Rows3 size={14} />,
    state: activeStep === index ? 'current' : stepHasData(index) ? 'complete' : 'default',
  }));

  const updateForm = <K extends keyof PicklistFormState>(key: K, value: PicklistFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateRow = <K extends keyof ValueGridRow>(rowId: string, key: K, value: ValueGridRow[K]) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, makeEmptyValueRow(form.configurationType === 'Multi-Level' ? selectedLevelId : 'DEFAULT')]);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const continueStep = () => {
    if (activeStep === 0) {
      if (!validateOverview()) return;
    }
    setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1));
  };

  const saveConfig = () => {
    const isOverviewValid = validateOverview();
    const areValuesValid = validateValues();
    if (!isOverviewValid || !areValuesValid) return;

    const now = makeTimestamp();
    const nextConfigId = existingConfig?.id ?? makeRowId('CFG');
    const existingLevelsForConfig = storeState.levels.filter((level) => level.configId === nextConfigId).sort(levelSort);
    let nextLevels = storeState.levels.filter((level) => level.configId !== nextConfigId);
    let rootLevelId = existingLevelsForConfig[0]?.id ?? 'DEFAULT';

    if (form.configurationType === 'Independent') {
      rootLevelId = 'DEFAULT';
    } else if (existingLevelsForConfig.length === 0) {
      rootLevelId = makeRowId('LVL');
      nextLevels = [
        ...nextLevels,
        {
          id: rootLevelId,
          configId: nextConfigId,
          levelSequence: '1',
          parentLevelId: '',
          picklistName: form.name,
          displayName: form.displayName,
          allowMultipleParentMapping: false,
          allowValueReuse: false,
        },
      ];
    } else {
      nextLevels = [...nextLevels, ...existingLevelsForConfig];
    }

    const normalizedRows = rows
      .filter((row) => row.name.trim() || row.code.trim() || row.displayName.trim() || row.description.trim())
      .map<PicklistValueRecord>((row) => ({
        id: row.id.startsWith('VAL-') ? row.id : makeRowId('VAL'),
        configId: nextConfigId,
        levelId: form.configurationType === 'Independent'
          ? 'DEFAULT'
          : row.levelId === 'DEFAULT'
            ? rootLevelId
            : row.levelId,
        code: row.code.trim(),
        name: row.name.trim(),
        displayName: row.displayName.trim(),
        description: row.description.trim(),
        displaySequence: row.displaySequence.trim(),
        isActive: row.status === 'Active',
        isDefault: row.isDefault,
      }));

    const nextConfig: PicklistConfigRecord = {
      id: nextConfigId,
      code: form.code.trim(),
      name: form.name.trim(),
      displayName: form.displayName.trim(),
      entity: form.entity,
      entityType: form.entityType,
      description: form.description.trim(),
      configurationType: form.configurationType,
      isActive: form.status === 'Active',
      dependentParentConfigId: form.configurationType === 'Dependent' ? form.dependentParentConfigId : '',
      dependentParentValueId: form.configurationType === 'Dependent' ? form.dependentParentValueId : '',
      createdBy: existingConfig?.createdBy ?? 'Admin',
      createdDate: existingConfig?.createdDate ?? now,
      lastModifiedBy: 'Admin',
      lastModifiedDate: now,
    };

    const nextConfigs = existingConfig
      ? storeState.configs.map((entry) => (entry.id === existingConfig.id ? nextConfig : entry))
      : [...storeState.configs, nextConfig];

    const nextState: PicklistMasterState = {
      configs: nextConfigs,
      levels: nextLevels,
      values: [...storeState.values.filter((entry) => entry.configId !== nextConfigId), ...normalizedRows],
      mappings: storeState.mappings,
    };

    savePicklistMasterState(nextState);
    setStoreState(nextState);
    navigate('/admin/master/picklist-master');
  };

  const renderOverviewStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Picklist Overview</div>
            <div style={sectionHintStyle}>Define the identity and behavior of this picklist before values are entered.</div>
          </div>
        </div>
        <div style={sectionBodyStyle}>
          <div style={threeColumnStyle}>
            <Field label="Code" required error={errors.code}>
              <input value={form.code} onChange={(event) => updateForm('code', event.target.value)} style={textInputStyle(errors.code)} placeholder="e.g. PCK-201" />
            </Field>
            <Field label="Name" required error={errors.name}>
              <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} style={textInputStyle(errors.name)} placeholder="e.g. Branch Type" />
            </Field>
            <Field label="Display Name" required error={errors.displayName}>
              <input value={form.displayName} onChange={(event) => updateForm('displayName', event.target.value)} style={textInputStyle(errors.displayName)} placeholder="Displayed label for end users" />
            </Field>
            <Field label="Entity" required error={errors.entity}>
              <select value={form.entity} onChange={(event) => updateForm('entity', event.target.value)} style={selectInputStyle(errors.entity)}>
                {PICKLIST_ENTITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Entity Type" required error={errors.entityType}>
              <select value={form.entityType} onChange={(event) => updateForm('entityType', event.target.value)} style={selectInputStyle(errors.entityType)}>
                {PICKLIST_ENTITY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => updateForm('status', event.target.value as UiStatus)} style={selectInputStyle()}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <div style={{ ...threeColumnStyle, marginTop: '16px' }}>
            <div style={{ gridColumn: '1 / span 2' }}>
              <Field label="Control Type">
                <div style={chipGroupStyle}>
                  {(['Independent', 'Dependent', 'Multi-Level'] as PicklistConfigType[]).map((type) => {
                    const active = form.configurationType === type;
                    return (
                      <button key={type} type="button" onClick={() => updateForm('configurationType', type)} style={chipButtonStyle(active)}>
                        {type}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Field label="Description">
              <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={4} style={{ ...textInputStyle(), resize: 'vertical', lineHeight: 1.5 }} placeholder="Briefly explain where this picklist is used and what it controls." />
            </Field>
          </div>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Behavior Preview</div>
            <div style={sectionHintStyle}>The next step adapts automatically based on the control type you choose here.</div>
          </div>
        </div>
        <div style={{ ...sectionBodyStyle, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
          <PreviewCard title="Independent" active={form.configurationType === 'Independent'} body="Enter values directly in the grid with no parent dependency." />
          <PreviewCard title="Dependent" active={form.configurationType === 'Dependent'} body="Choose a parent picklist and one parent value before adding child values." />
          <PreviewCard title="Multi-Level" active={form.configurationType === 'Multi-Level'} body="Manage one level at a time in the values grid using the selected level filter." />
        </div>
      </section>
    </div>
  );

  const renderValuesStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {form.configurationType === 'Dependent' && (
        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionTitleStyle}>Dependency Source</div>
              <div style={sectionHintStyle}>Pick the parent picklist and one parent value before entering the dependent values.</div>
            </div>
          </div>
          <div style={sectionBodyStyle}>
            <div style={twoColumnStyle}>
              <Field label="Parent Picklist" required error={errors.dependentParentConfigId}>
                <select value={form.dependentParentConfigId} onChange={(event) => updateForm('dependentParentConfigId', event.target.value)} style={selectInputStyle(errors.dependentParentConfigId)}>
                  <option value="">Select parent picklist</option>
                  {parentPicklistOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                </select>
              </Field>
              <Field label="Parent Value" required error={errors.dependentParentValueId}>
                <select value={form.dependentParentValueId} onChange={(event) => updateForm('dependentParentValueId', event.target.value)} style={selectInputStyle(errors.dependentParentValueId)}>
                  <option value="">Select parent value</option>
                  {parentValueOptions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </section>
      )}

      {form.configurationType === 'Multi-Level' && (
        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionTitleStyle}>Level Selection</div>
              <div style={sectionHintStyle}>Focus on one level at a time to keep multi-level value entry easier to manage.</div>
            </div>
          </div>
          <div style={sectionBodyStyle}>
            <div style={{ maxWidth: '360px' }}>
              <Field label="Current Level">
                <select value={selectedLevelId} onChange={(event) => setSelectedLevelId(event.target.value)} style={selectInputStyle()}>
                  {levelOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </section>
      )}

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Values</div>
            <div style={sectionHintStyle}>Use the grid for quick entry. Add multiple rows and fill them inline with minimal clicks.</div>
          </div>
          <button type="button" onClick={addRow} style={primaryButtonStyle}>
            <Plus size={14} /> Add Row
          </button>
        </div>
        <div style={sectionBodyStyle}>
          <div style={gridWrapperStyle}>
            <div style={valueGridHeaderStyle}>
              {['Value Name', 'Value Code', 'Display Name', 'Display Sequence', 'Default', 'Status', 'Description', 'Actions'].map((label) => (
                <div key={label} style={gridHeaderCellStyle}>{label}</div>
              ))}
            </div>
            {visibleRows.length === 0 ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No rows added for this scope yet. Use <strong>Add Row</strong> to start entering values.
              </div>
            ) : (
              visibleRows.map((row) => (
                <div key={row.id} style={valueGridRowStyle}>
                  <div>
                    <input value={row.name} onChange={(event) => updateRow(row.id, 'name', event.target.value)} style={gridInputStyle(errors[`row-${row.id}-name`])} placeholder="Value name" />
                  </div>
                  <div>
                    <input value={row.code} onChange={(event) => updateRow(row.id, 'code', event.target.value)} style={gridInputStyle(errors[`row-${row.id}-code`])} placeholder="Code" />
                  </div>
                  <div>
                    <input value={row.displayName} onChange={(event) => updateRow(row.id, 'displayName', event.target.value)} style={gridInputStyle(errors[`row-${row.id}-displayName`])} placeholder="Display label" />
                  </div>
                  <div>
                    <input value={row.displaySequence} onChange={(event) => updateRow(row.id, 'displaySequence', event.target.value)} style={gridInputStyle()} placeholder="1" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input type="checkbox" checked={row.isDefault} onChange={(event) => updateRow(row.id, 'isDefault', event.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <select value={row.status} onChange={(event) => updateRow(row.id, 'status', event.target.value as UiStatus)} style={gridSelectStyle()}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <input value={row.description} onChange={(event) => updateRow(row.id, 'description', event.target.value)} style={gridInputStyle()} placeholder="Optional description" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button type="button" onClick={() => removeRow(row.id)} style={iconButtonStyle} title="Remove row">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <AdminShell>
      <MasterCreateFormShell
        navigationPersistenceKey="picklist-master-form-stepper"
        title={pageTitle}
        backAction={{ label: 'Back', onClick: () => navigate('/admin/master/picklist-master') }}
        statusLabel={form.status}
        statusTone={form.status === 'Active' ? 'active' : 'neutral'}
        secondaryActions={[
          {
            label: activeStep === 0 ? 'Back to List' : 'Previous',
            onClick: () => activeStep === 0 ? navigate('/admin/master/picklist-master') : setActiveStep((prev) => Math.max(0, prev - 1)),
          },
        ]}
        primaryAction={activeStep < STEPS.length - 1
          ? { label: 'Continue', onClick: continueStep }
          : { label: isNew ? 'Create Picklist' : 'Save Changes', onClick: saveConfig }}
        helpTopicId="picklist-master"
        onHelpClick={() => setHelpOpen(true)}
        steps={stepperSteps}
        activeStepId={String(activeStep)}
        onStepChange={(stepId) => setActiveStep(Number(stepId))}
      >
        <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '16px 24px', background: 'var(--color-surface-subtle)', minHeight: '100%' }}>
          {activeStep === 0 ? renderOverviewStep() : renderValuesStep()}
        </div>
      </MasterCreateFormShell>

      {helpTopic && (
        <HelpDrawer open={helpOpen} topic={helpTopic} onClose={() => setHelpOpen(false)} onTopicChange={(id) => setHelpTopicId(id)} />
      )}
    </AdminShell>
  );
};

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, error, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
      {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
    </label>
    {children}
    {error ? <div style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626' }}>{error}</div> : null}
  </div>
);

const PreviewCard: React.FC<{ title: string; body: string; active: boolean }> = ({ title, body, active }) => (
  <div style={{ border: '1px solid', borderColor: active ? 'color-mix(in srgb, var(--color-primary) 40%, var(--color-border))' : 'var(--color-border)', borderRadius: '12px', padding: '14px 16px', background: active ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))' : 'var(--color-surface)' }}>
    <div style={{ fontSize: '13px', fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)', marginBottom: '6px' }}>{title}</div>
    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{body}</div>
  </div>
);

const sectionCardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  overflow: 'hidden',
  background: 'var(--color-surface)',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '16px 18px',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

const sectionBodyStyle: React.CSSProperties = {
  padding: '18px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--color-text)',
};

const sectionHintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-muted)',
  marginTop: '3px',
};

const twoColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const threeColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
};

const sharedInputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
  outline: 'none',
};

function textInputStyle(hasError?: string): React.CSSProperties {
  return {
    ...sharedInputBase,
    borderColor: hasError ? '#FCA5A5' : 'var(--color-border)',
  };
}

function selectInputStyle(hasError?: string): React.CSSProperties {
  return textInputStyle(hasError);
}

const chipGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

function chipButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 14px',
    borderRadius: '9999px',
    border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
    background: active ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : 'var(--color-surface)',
    color: active ? 'var(--color-primary)' : 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 700 : 600,
  };
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '9px 16px',
  borderRadius: '10px',
  border: '1px solid var(--color-primary)',
  background: 'var(--color-primary)',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '9px 16px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const gridWrapperStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  overflow: 'hidden',
};

const valueGridHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1.2fr 120px 90px 120px 1.5fr 80px',
  gap: '12px',
  alignItems: 'center',
  padding: '12px 16px',
  background: 'var(--color-surface-subtle)',
  borderBottom: '1px solid var(--color-border)',
};

const gridHeaderCellStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const valueGridRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1.2fr 120px 90px 120px 1.5fr 80px',
  gap: '12px',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
};

function gridInputStyle(hasError?: string): React.CSSProperties {
  return {
    ...sharedInputBase,
    minHeight: '38px',
    padding: '8px 10px',
    borderRadius: '8px',
    borderColor: hasError ? '#FCA5A5' : 'var(--color-border)',
  };
}

function gridSelectStyle(hasError?: string): React.CSSProperties {
  return gridInputStyle(hasError);
}

const iconButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
  color: '#DC2626',
  cursor: 'pointer',
};

function statusBadgeStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 700,
    background: active ? 'color-mix(in srgb, #10b981 14%, var(--color-surface))' : 'var(--color-surface-subtle)',
    color: active ? 'color-mix(in srgb, #10b981 85%, var(--color-text))' : 'var(--color-text-muted)',
  };
}

export default PicklistFormPage;
