// ─── CapacityPolicySection ────────────────────────────────────────────────────

import React, { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { CapacityPolicy, StorageConstraints } from '../../types/warehouse.types';
import { inputBase, inputRO, labelBase, hintTxt, twoCol, threeCol, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';

const HAZMAT_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const FIRE_CLASSES = ['A', 'B', 'C', 'D', 'K'];

function toLocal(w: ConfigSectionProps['warehouse']) {
  return {
    cap: w.capacityPolicy ?? {
      trackingEnabled: false,
      temperatureControlled: false,
      hazardousStorage: false,
    } as CapacityPolicy,
    storage: w.storageConstraints ?? {} as StorageConstraints,
  };
}

export function CapacityPolicySection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  function setCap<K extends keyof CapacityPolicy>(k: K, v: CapacityPolicy[K]) {
    setLocal((s) => ({ ...s, cap: { ...s.cap, [k]: v } }));
    setDirty(true);
  }

  function setStorage<K extends keyof StorageConstraints>(k: K, v: StorageConstraints[K]) {
    setLocal((s) => ({ ...s, storage: { ...s.storage, [k]: v } }));
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

  const { cap, storage } = local;

  return (
    <div data-testid="section-capacity">
      {/* Capacity */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Capacity Tracking</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cap.trackingEnabled}
              onChange={(e) => setCap('trackingEnabled', e.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Enable tracking
          </label>
        </div>
        <div style={{ padding: '18px 20px', background: 'var(--color-surface)', opacity: cap.trackingEnabled ? 1 : 0.5 }}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Floor Area (sq ft)</label>
              <input
                type="number"
                value={cap.squareFootage ?? ''}
                onChange={(e) => setCap('squareFootage', parseFloat(e.target.value) || undefined)}
                style={readOnly || !cap.trackingEnabled ? inputRO : inputBase}
                disabled={readOnly || !cap.trackingEnabled}
                placeholder="e.g. 12000"
              />
            </div>
            <div>
              <label style={labelBase}>Height (m)</label>
              <input
                type="number"
                value={cap.heightMeters ?? ''}
                onChange={(e) => setCap('heightMeters', parseFloat(e.target.value) || undefined)}
                style={readOnly || !cap.trackingEnabled ? inputRO : inputBase}
                disabled={readOnly || !cap.trackingEnabled}
                placeholder="e.g. 9"
              />
            </div>
          </div>
          <div style={{ ...threeCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Floor Load (kg/m²)</label>
              <input
                type="number"
                value={cap.floorLoadKgPerSqm ?? ''}
                onChange={(e) => setCap('floorLoadKgPerSqm', parseFloat(e.target.value) || undefined)}
                style={readOnly || !cap.trackingEnabled ? inputRO : inputBase}
                disabled={readOnly || !cap.trackingEnabled}
              />
            </div>
            <div>
              <label style={labelBase}>Rack Capacity (kg)</label>
              <input
                type="number"
                value={cap.rackLoadKg ?? ''}
                onChange={(e) => setCap('rackLoadKg', parseFloat(e.target.value) || undefined)}
                style={readOnly || !cap.trackingEnabled ? inputRO : inputBase}
                disabled={readOnly || !cap.trackingEnabled}
              />
            </div>
            <div>
              <label style={labelBase}>Dock Count</label>
              <input
                type="number"
                min={0}
                value={cap.dockCount ?? ''}
                onChange={(e) => setCap('dockCount', parseInt(e.target.value, 10) || undefined)}
                style={readOnly || !cap.trackingEnabled ? inputRO : inputBase}
                disabled={readOnly || !cap.trackingEnabled}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cap.temperatureControlled}
                onChange={(e) => setCap('temperatureControlled', e.target.checked)}
                disabled={readOnly}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Temperature Controlled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cap.hazardousStorage}
                onChange={(e) => setCap('hazardousStorage', e.target.checked)}
                disabled={readOnly}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Hazardous Material Storage
            </label>
          </div>
        </div>
      </div>

      {/* Storage Constraints */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Storage Constraints</span>
        </div>
        <div style={sBody}>
          <p style={{ ...hintTxt, marginBottom: '14px' }}>Optional physical constraints applied to all items stored in this warehouse.</p>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Min Temperature (°C)</label>
              <input
                type="number"
                value={storage.minTempCelsius ?? ''}
                onChange={(e) => setStorage('minTempCelsius', parseFloat(e.target.value) || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              />
            </div>
            <div>
              <label style={labelBase}>Max Temperature (°C)</label>
              <input
                type="number"
                value={storage.maxTempCelsius ?? ''}
                onChange={(e) => setStorage('maxTempCelsius', parseFloat(e.target.value) || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              />
            </div>
          </div>
          <div style={{ ...threeCol }}>
            <div>
              <label style={labelBase}>Humidity (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={storage.humidityPercent ?? ''}
                onChange={(e) => setStorage('humidityPercent', parseFloat(e.target.value) || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              />
            </div>
            <div>
              <label style={labelBase}>Fire Class</label>
              <select
                value={storage.fireClass ?? ''}
                onChange={(e) => setStorage('fireClass', e.target.value || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">None</option>
                {FIRE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Hazmat Class</label>
              <select
                value={storage.hazmatClass ?? ''}
                onChange={(e) => setStorage('hazmatClass', e.target.value || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">None</option>
                {HAZMAT_CLASSES.map((c) => <option key={c} value={`Class ${c}`}>{`Class ${c}`}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
