import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { SmartDrawer } from '../../../../experience/components/SmartDrawer';
import type {
  CapacityEnforcementMode,
  CapacityRollupMode,
} from '../types/warehouse.enums';
import type {
  WarehouseTemplateItemMappingRow,
  WarehouseTemplateLevelDraft,
} from './warehouseTemplateSetup.types';

type DrawerMode = 'create' | 'edit';
type DrawerStepKey =
  | 'capacity'
  | 'item-mapping';

interface WarehouseTemplateLevelDrawerProps {
  open: boolean;
  mode: DrawerMode;
  parentLabel: string;
  parentCode: string;
  parentLevelCode: string;
  levelOptions?: string[];
  titleLabel: string;
  initialValue: WarehouseTemplateLevelDraft;
  onClose: () => void;
  onSubmit: (value: WarehouseTemplateLevelDraft) => void;
}

const CAPACITY_ENFORCEMENT_OPTIONS: CapacityEnforcementMode[] = ['None', 'Informational', 'Warning', 'HardBlock', 'ApprovalRequired'];
const CAPACITY_ROLLUP_OPTIONS: CapacityRollupMode[] = ['None', 'OwnCapacityOnly', 'RollupFromChildren', 'SharedParentPool'];

const STEPS: Array<{ key: DrawerStepKey; label: string; hint: string }> = [
  { key: 'capacity', label: 'Capacity Scope', hint: 'Storage, size, environmental, and compliance constraints.' },
  { key: 'item-mapping', label: 'Item Mapping', hint: 'Inline item mapping for eligible levels.' },
];

function buildDefaultItemMapping(): WarehouseTemplateItemMappingRow {
  return {
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemCode: '',
    itemName: '',
    uom: '',
    mappingDirection: 'Allow',
    effectiveFrom: '',
    effectiveTo: '',
    status: 'Draft',
    notes: '',
  };
}

function normalizeDraft(value: WarehouseTemplateLevelDraft): WarehouseTemplateLevelDraft {
  return {
    ...value,
    maxStorageQuantity: value.maxStorageQuantity ?? 0,
    maxWeight: value.maxWeight ?? 0,
    maxVolume: value.maxVolume ?? 0,
    maxWidth: value.maxWidth ?? 0,
    maxHeight: value.maxHeight ?? 0,
    maxLengthDepth: value.maxLengthDepth ?? 0,
    floorLoad: value.floorLoad ?? 0,
    rackStructuralLoad: value.rackStructuralLoad ?? 0,
    temperatureControlled: value.temperatureControlled ?? false,
    minTemperature: value.minTemperature ?? 0,
    maxTemperature: value.maxTemperature ?? 0,
    humidity: value.humidity ?? 0,
    hazmatClass: value.hazmatClass ?? '',
    fireClass: value.fireClass ?? '',
    mixedItemAllowed: value.mixedItemAllowed ?? false,
    mixedLotAllowed: value.mixedLotAllowed ?? false,
    mixedOwnerAllowed: value.mixedOwnerAllowed ?? false,
    complianceLockRequired: value.complianceLockRequired ?? false,
    itemMappings: value.itemMappings ?? [],
    currentVersion: value.currentVersion ?? 1,
    lastUpdatedOn: value.lastUpdatedOn ?? '',
    lastUpdatedBy: value.lastUpdatedBy ?? '',
    changeSummary: value.changeSummary ?? '',
    previousSnapshotSummary: value.previousSnapshotSummary ?? '',
  };
}

export function WarehouseTemplateLevelDrawer({
  open,
  mode,
  parentLabel,
  parentCode,
  parentLevelCode,
  titleLabel,
  initialValue,
  onClose,
  onSubmit,
}: WarehouseTemplateLevelDrawerProps) {
  const [form, setForm] = useState<WarehouseTemplateLevelDraft>(normalizeDraft(initialValue));
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(normalizeDraft(initialValue));
      setStep(0);
      setMessage(null);
    }
  }, [initialValue, open]);

  if (!open) return null;

  function update<K extends keyof WarehouseTemplateLevelDraft>(key: K, value: WarehouseTemplateLevelDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMappingRow(id: string, field: keyof WarehouseTemplateItemMappingRow, value: string) {
    setForm((current) => ({
      ...current,
      itemMappings: (current.itemMappings ?? []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
  }

  function addItemMappingRow() {
    setForm((current) => ({ ...current, itemMappings: [...(current.itemMappings ?? []), buildDefaultItemMapping()] }));
  }

  function removeItemMappingRow(id: string) {
    setForm((current) => ({ ...current, itemMappings: (current.itemMappings ?? []).filter((row) => row.id !== id) }));
  }

  function goNext() {
    const validationMessage = validateStep(STEPS[step].key, form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setMessage(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function submit() {
    const validationMessage = validateStep('capacity', form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    onSubmit(form);
  }

  const generatedNodePreview = `${form.codePrefix || form.levelCode || 'LVL'}${form.separator || '-'}${String(form.startSequence).padStart(form.sequenceLength, '0')}${form.suffix || ''}`;

  return (
    <SmartDrawer
      open={open}
      onClose={onClose}
      title={mode === 'create' ? `Add ${titleLabel}` : `Edit ${titleLabel}`}
      subtitle={`Parent: ${parentLabel} / ${parentCode}`}
      footerActions={[
        {
          label: 'Back',
          onClick: () => setStep((current) => Math.max(0, current - 1)),
          tone: 'outline',
          disabled: step === 0,
        },
        step < STEPS.length - 1
          ? {
              label: 'Next',
              onClick: goNext,
              tone: 'primary' as const,
            }
          : {
              label: mode === 'create' ? 'Add Level' : 'Save Changes',
              onClick: submit,
              tone: 'primary' as const,
            },
      ]}
    >
        <div style={stepRailStyle}>
          {STEPS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStep(index)}
              title={item.hint}
              aria-label={`${item.label}. ${item.hint}`}
              style={{
                ...stepBtn,
                background: step === index ? 'color-mix(in srgb, var(--color-primary) 8%, white)' : 'transparent',
                borderColor: step === index ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            >
              <span
                style={{
                  ...stepDot,
                  background: step === index ? 'var(--color-primary)' : 'var(--color-border-strong)',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: step === index ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: '18px' }}>
          {message && <div style={messageStyle}>{message}</div>}

          {STEPS[step].key === 'capacity' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={cardStyle}>
                <div style={cardTitle}>Capacity Scope</div>
                <div style={toggleGrid}>
                  <Checkbox label="Capacity Applicable" checked={form.capacityApplicable} onChange={(checked) => update('capacityApplicable', checked)} />
                  <Checkbox label="Temperature Controlled" checked={Boolean(form.temperatureControlled)} onChange={(checked) => update('temperatureControlled', checked)} />
                  <Checkbox label="Mixed Item Allowed" checked={Boolean(form.mixedItemAllowed)} onChange={(checked) => update('mixedItemAllowed', checked)} />
                  <Checkbox label="Mixed Lot Allowed" checked={Boolean(form.mixedLotAllowed)} onChange={(checked) => update('mixedLotAllowed', checked)} />
                  <Checkbox label="Mixed Owner Allowed" checked={Boolean(form.mixedOwnerAllowed)} onChange={(checked) => update('mixedOwnerAllowed', checked)} />
                  <Checkbox label="Compliance Lock Required" checked={Boolean(form.complianceLockRequired)} onChange={(checked) => update('complianceLockRequired', checked)} />
                </div>
              </div>

              {form.capacityApplicable && (
                <div style={cardStyle}>
                  <div style={cardTitle}>Capacity and Constraints</div>
                  <div style={gridThree}>
                    <SelectField
                      label="Capacity Enforcement Mode"
                      value={form.capacityEnforcementMode}
                      options={CAPACITY_ENFORCEMENT_OPTIONS}
                      onChange={(value) => update('capacityEnforcementMode', value as CapacityEnforcementMode)}
                    />
                    <SelectField
                      label="Capacity Rollup Mode"
                      value={form.capacityRollupMode}
                      options={CAPACITY_ROLLUP_OPTIONS}
                      onChange={(value) => update('capacityRollupMode', value as CapacityRollupMode)}
                    />
                    <ReadOnlyField label="Generated Example" value={generatedNodePreview} />
                  </div>
                  <div style={{ ...gridThree, marginTop: '12px' }}>
                    <NumberField label="Max Storage Quantity" value={form.maxStorageQuantity ?? 0} onChange={(value) => update('maxStorageQuantity', value)} />
                    <NumberField label="Max Weight" value={form.maxWeight ?? 0} onChange={(value) => update('maxWeight', value)} />
                    <NumberField label="Max Volume" value={form.maxVolume ?? 0} onChange={(value) => update('maxVolume', value)} />
                    <NumberField label="Max Width" value={form.maxWidth ?? 0} onChange={(value) => update('maxWidth', value)} />
                    <NumberField label="Max Height" value={form.maxHeight ?? 0} onChange={(value) => update('maxHeight', value)} />
                    <NumberField label="Max Length / Depth" value={form.maxLengthDepth ?? 0} onChange={(value) => update('maxLengthDepth', value)} />
                    <NumberField label="Floor Load" value={form.floorLoad ?? 0} onChange={(value) => update('floorLoad', value)} />
                    <NumberField label="Rack / Structural Load" value={form.rackStructuralLoad ?? 0} onChange={(value) => update('rackStructuralLoad', value)} />
                    <NumberField label="Humidity" value={form.humidity ?? 0} onChange={(value) => update('humidity', value)} />
                    <NumberField label="Min Temperature" value={form.minTemperature ?? 0} onChange={(value) => update('minTemperature', value)} />
                    <NumberField label="Max Temperature" value={form.maxTemperature ?? 0} onChange={(value) => update('maxTemperature', value)} />
                    <Field label="Hazmat Class" value={form.hazmatClass ?? ''} onChange={(value) => update('hazmatClass', value)} />
                  </div>
                  <div style={{ ...gridTwo, marginTop: '12px' }}>
                    <Field label="Fire Class" value={form.fireClass ?? ''} onChange={(value) => update('fireClass', value)} />
                    <TextAreaField
                      label="Capacity Notes"
                      value={form.changeSummary ?? ''}
                      onChange={(value) => update('changeSummary', value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {STEPS[step].key === 'item-mapping' && (
            <div style={{ display: 'grid', gap: '14px' }}>
              {!form.itemEligibilityApplicable ? (
                <div style={infoStrip}>
                  Item Mapping appears only when Item Eligibility is enabled for this level.
                </div>
              ) : (
                <div style={cardStyle}>
                  <div style={{ ...cardTitleRow, marginBottom: '12px' }}>
                    <div style={cardTitle}>Item Mapping</div>
                    <button type="button" onClick={addItemMappingRow} style={smallPrimaryBtn}>
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  {(form.itemMappings ?? []).length === 0 ? (
                    <div style={emptyStateStyle}>No items mapped yet.</div>
                  ) : (
                    <>
                      <div style={mappingHeaderStyle}>
                        <span>Code</span>
                        <span>Item Name</span>
                        <span>UOM</span>
                        <span />
                      </div>
                      {(form.itemMappings ?? []).map((row) => (
                        <div key={row.id} style={mappingRowStyle}>
                          <input value={row.itemCode} onChange={(event) => updateMappingRow(row.id, 'itemCode', event.target.value.toUpperCase())} style={inputStyle} placeholder="Code" />
                          <input value={row.itemName} onChange={(event) => updateMappingRow(row.id, 'itemName', event.target.value)} style={inputStyle} placeholder="Item Name" />
                          <input value={row.uom} onChange={(event) => updateMappingRow(row.id, 'uom', event.target.value.toUpperCase())} style={inputStyle} placeholder="UOM" />
                          <button type="button" onClick={() => removeItemMappingRow(row.id)} style={deleteBtn}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
    </SmartDrawer>
  );
}

function validateStep(step: DrawerStepKey, form: WarehouseTemplateLevelDraft): string | null {
  if (step === 'capacity' && form.capacityApplicable) {
    if ((form.maxStorageQuantity ?? 0) < 0) return 'Max Storage Quantity cannot be negative.';
    if ((form.maxWeight ?? 0) < 0) return 'Max Weight cannot be negative.';
  }

  return null;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required ? ' *' : ''}
      </label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} style={inputStyle} />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} readOnly style={{ ...inputStyle, background: 'var(--color-surface-subtle)' }} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || 'None'}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={checkboxStyle}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

const stepRailStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  padding: '10px 16px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
};

const stepBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 10px',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  textAlign: 'left',
};

const stepDot: React.CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '999px',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '16px',
  background: 'var(--color-surface)',
};

const cardTitleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
};

const cardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--color-text)',
  marginBottom: '12px',
};

const gridTwo: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '12px',
};

const gridThree: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
};

const toggleGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '10px',
};

const checkboxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  color: 'var(--color-text)',
};

const smallPrimaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--color-primary)',
  color: 'white',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 600,
};

const infoStrip: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '12px',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  background: 'var(--color-surface-subtle)',
};

const messageStyle: React.CSSProperties = {
  marginBottom: '12px',
  padding: '10px 12px',
  borderRadius: '10px',
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  color: '#B91C1C',
  fontSize: '12px',
};

const mappingHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1.5fr 0.8fr 90px',
  gap: '10px',
  padding: '8px 0',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  borderBottom: '1px solid var(--color-border)',
};

const mappingRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1.5fr 0.8fr 90px',
  gap: '10px',
  padding: '10px 0',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border)',
};

const deleteBtn: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: '8px',
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
  color: '#B91C1C',
  cursor: 'pointer',
  fontSize: '12px',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '28px 18px',
  borderRadius: '10px',
  background: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)',
  fontSize: '12px',
  textAlign: 'center',
};
