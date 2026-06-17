import { useMemo, useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { CapacityPolicy, StorageConstraints } from '../../types/warehouse.types';
import { validateCapacityAndConstraints } from '../../utils/policyWorkbench';
import {
  hintTxt,
  inputBase,
  inputRO,
  labelBase,
  sBody,
  sCard,
  sHead,
  SectionActionRow,
  threeCol,
  twoCol,
} from './sectionStyles';

const HAZMAT_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const FIRE_CLASSES = ['A', 'B', 'C', 'D', 'K'];
const ENFORCEMENT_MODES = ['None', 'Informational', 'Warning', 'HardBlock', 'ApprovalRequired'] as const;
const ROLLUP_MODES = ['None', 'OwnCapacityOnly', 'RollupFromChildren', 'SharedParentPool'] as const;

function toLocal(warehouse: ConfigSectionProps['warehouse']) {
  return {
    cap: warehouse.capacityPolicy ?? {
      trackingEnabled: false,
      defaultEnforcementMode: 'Informational',
      defaultRollupMode: 'OwnCapacityOnly',
      defaultConsumptionSource: 'DirectStock',
      warningThresholdPercent: 80,
      overrideAllowed: false,
      overrideApprovalRequired: false,
      overrideReasonRequired: false,
      requireCapacityOnApplicableLevels: false,
      temperatureControlled: false,
      hazardousStorage: false,
    } as CapacityPolicy,
    storage: warehouse.storageConstraints ?? {
      allowMixedItemStorage: true,
      allowMixedLotStorage: true,
      allowMixedOwnerStorage: true,
      complianceLockRequired: false,
    } as StorageConstraints,
  };
}

export function CapacityPolicySection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const issues = useMemo(
    () => validateCapacityAndConstraints(local.cap, local.storage, 'warehouse', warehouse.inventoryControlMode),
    [local.cap, local.storage, warehouse.inventoryControlMode],
  );

  function setCap<K extends keyof CapacityPolicy>(key: K, value: CapacityPolicy[K]) {
    setLocal((current) => ({ ...current, cap: { ...current.cap, [key]: value } }));
    setDirty(true);
  }

  function setStorage<K extends keyof StorageConstraints>(key: K, value: StorageConstraints[K]) {
    setLocal((current) => ({ ...current, storage: { ...current.storage, [key]: value } }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ capacityPolicy: local.cap, storageConstraints: local.storage });
    setDirty(false);
  }

  const capacityModeLabel = warehouse.inventoryControlMode === 'Warehouse-Level'
    ? 'Warehouse-level capacity is soft and advisory.'
    : 'Warehouse-level capacity is advisory; any template level with Capacity Applicable = Yes can enforce node capacity.';

  return (
    <div data-testid="section-capacity">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Capacity Tracking</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.cap.trackingEnabled}
              onChange={(event) => setCap('trackingEnabled', event.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Enable tracking
          </label>
        </div>
        <div style={sBody}>
          <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
            {capacityModeLabel}
          </div>
          <div style={{ ...threeCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Default Enforcement Mode</label>
              <select value={local.cap.defaultEnforcementMode ?? 'Informational'} onChange={(event) => setCap('defaultEnforcementMode', event.target.value as CapacityPolicy['defaultEnforcementMode'])} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                {ENFORCEMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Default Rollup Mode</label>
              <select value={local.cap.defaultRollupMode ?? 'OwnCapacityOnly'} onChange={(event) => setCap('defaultRollupMode', event.target.value as CapacityPolicy['defaultRollupMode'])} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                {ROLLUP_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Warning Threshold (%)</label>
              <input type="number" value={local.cap.warningThresholdPercent ?? ''} onChange={(event) => setCap('warningThresholdPercent', Number(event.target.value) || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} />
            </div>
          </div>
          <div style={{ ...twoCol, marginBottom: '14px', opacity: local.cap.trackingEnabled ? 1 : 0.55 }}>
            <div>
              <label style={labelBase}>Floor Area (sq ft)</label>
              <input type="number" value={local.cap.squareFootage ?? ''} onChange={(event) => setCap('squareFootage', parseFloat(event.target.value) || undefined)} style={readOnly || !local.cap.trackingEnabled ? inputRO : inputBase} disabled={readOnly || !local.cap.trackingEnabled} />
            </div>
            <div>
              <label style={labelBase}>Height (m)</label>
              <input type="number" value={local.cap.heightMeters ?? ''} onChange={(event) => setCap('heightMeters', parseFloat(event.target.value) || undefined)} style={readOnly || !local.cap.trackingEnabled ? inputRO : inputBase} disabled={readOnly || !local.cap.trackingEnabled} />
            </div>
          </div>
          <div style={{ ...threeCol, marginBottom: '14px', opacity: local.cap.trackingEnabled ? 1 : 0.55 }}>
            <div>
              <label style={labelBase}>Floor Load (kg/sqm)</label>
              <input type="number" value={local.cap.floorLoadKgPerSqm ?? ''} onChange={(event) => setCap('floorLoadKgPerSqm', parseFloat(event.target.value) || undefined)} style={readOnly || !local.cap.trackingEnabled ? inputRO : inputBase} disabled={readOnly || !local.cap.trackingEnabled} />
            </div>
            <div>
              <label style={labelBase}>Rack Capacity (kg)</label>
              <input type="number" value={local.cap.rackLoadKg ?? ''} onChange={(event) => setCap('rackLoadKg', parseFloat(event.target.value) || undefined)} style={readOnly || !local.cap.trackingEnabled ? inputRO : inputBase} disabled={readOnly || !local.cap.trackingEnabled} />
            </div>
            <div>
              <label style={labelBase}>Dock Count</label>
              <input type="number" value={local.cap.dockCount ?? ''} onChange={(event) => setCap('dockCount', parseInt(event.target.value, 10) || undefined)} style={readOnly || !local.cap.trackingEnabled ? inputRO : inputBase} disabled={readOnly || !local.cap.trackingEnabled} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.temperatureControlled} onChange={(event) => setCap('temperatureControlled', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Temperature controlled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.hazardousStorage} onChange={(event) => setCap('hazardousStorage', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Hazardous storage
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.requireCapacityOnApplicableLevels ?? false} onChange={(event) => setCap('requireCapacityOnApplicableLevels', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Capacity setup required on applicable levels
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.overrideAllowed ?? false} onChange={(event) => setCap('overrideAllowed', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Override allowed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.overrideApprovalRequired ?? false} onChange={(event) => setCap('overrideApprovalRequired', event.target.checked)} disabled={readOnly || !(local.cap.overrideAllowed ?? false)} style={{ accentColor: 'var(--color-primary)' }} />
              Override requires approval
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={local.cap.overrideReasonRequired ?? false} onChange={(event) => setCap('overrideReasonRequired', event.target.checked)} disabled={readOnly || !(local.cap.overrideAllowed ?? false)} style={{ accentColor: 'var(--color-primary)' }} />
              Override reason required
            </label>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Level capability note: these defaults apply to all active template levels where Capacity Applicable is enabled; level-specific overrides can tighten enforcement.
          </div>
        </div>
      </div>

      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Storage Constraints</span>
        </div>
        <div style={sBody}>
          <p style={{ ...hintTxt, marginBottom: '14px' }}>
            Hazard, temperature, mixed-item, mixed-lot, mixed-owner, and compliance restrictions are validated here.
          </p>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Min Temperature (C)</label>
              <input type="number" value={local.storage.minTempCelsius ?? ''} onChange={(event) => setStorage('minTempCelsius', parseFloat(event.target.value) || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} />
            </div>
            <div>
              <label style={labelBase}>Max Temperature (C)</label>
              <input type="number" value={local.storage.maxTempCelsius ?? ''} onChange={(event) => setStorage('maxTempCelsius', parseFloat(event.target.value) || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} />
            </div>
          </div>
          <div style={{ ...threeCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Humidity (%)</label>
              <input type="number" value={local.storage.humidityPercent ?? ''} onChange={(event) => setStorage('humidityPercent', parseFloat(event.target.value) || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} />
            </div>
            <div>
              <label style={labelBase}>Fire Class</label>
              <select value={local.storage.fireClass ?? ''} onChange={(event) => setStorage('fireClass', event.target.value || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                <option value="">None</option>
                {FIRE_CLASSES.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Hazmat Class</label>
              <select value={local.storage.hazmatClass ?? ''} onChange={(event) => setStorage('hazmatClass', event.target.value || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                <option value="">None</option>
                {HAZMAT_CLASSES.map((entry) => <option key={entry} value={`Class ${entry}`}>{`Class ${entry}`}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...threeCol, marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              <input type="checkbox" checked={local.storage.allowMixedItemStorage ?? false} onChange={(event) => setStorage('allowMixedItemStorage', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Mixed item allowed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              <input type="checkbox" checked={local.storage.allowMixedLotStorage ?? false} onChange={(event) => setStorage('allowMixedLotStorage', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Mixed lot allowed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              <input type="checkbox" checked={local.storage.allowMixedOwnerStorage ?? false} onChange={(event) => setStorage('allowMixedOwnerStorage', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Mixed owner allowed
            </label>
          </div>
          <div style={{ ...twoCol }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              <input type="checkbox" checked={local.storage.complianceLockRequired ?? false} onChange={(event) => setStorage('complianceLockRequired', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
              Compliance restriction required
            </label>
            <div>
              <label style={labelBase}>Compliance Restriction Code</label>
              <input type="text" value={local.storage.complianceLockCode ?? ''} onChange={(event) => setStorage('complianceLockCode', event.target.value || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} placeholder="e.g. DG-CHEM-CAGE" />
            </div>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div style={{ ...sCard, borderColor: '#FCD34D' }}>
          <div style={{ ...sHead, background: '#FFFBEB' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Validation Summary</span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {issues.map((issue, index) => (
                <div key={`${issue.field ?? issue.message}-${index}`} style={{ fontSize: '12px', color: issue.severity === 'error' ? '#B91C1C' : '#92400E' }}>
                  {issue.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
