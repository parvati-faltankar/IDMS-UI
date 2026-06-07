// ─── CycleCountSection ────────────────────────────────────────────────────────

import React, { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { CycleCountPolicy } from '../../types/warehouse.types';
import type { CycleCountFrequency } from '../../types/warehouse.enums';
import { inputBase, inputRO, labelBase, hintTxt, twoCol, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';

const FREQUENCIES: CycleCountFrequency[] = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Annually'];
const SCOPES = ['Full', 'Partial', 'ABC-Class', 'Random'];
const VARIANCE_UNITS = ['Quantity', 'Percentage'];

function defaultPolicy(): CycleCountPolicy {
  return {
    enabled: false,
    scope: 'Full',
    frequency: 'Monthly',
    freezeEnabled: false,
    varianceTolerance: 0,
    varianceUnit: 'Quantity',
  };
}

function toLocal(w: ConfigSectionProps['warehouse']): CycleCountPolicy {
  return w.cycleCountPolicy ?? defaultPolicy();
}

export function CycleCountSection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<CycleCountPolicy>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  function set<K extends keyof CycleCountPolicy>(k: K, v: CycleCountPolicy[K]) {
    setLocal((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ cycleCountPolicy: local });
    setDirty(false);
  }

  return (
    <div data-testid="section-cycle-count">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Cycle Count Policy</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Enabled
          </label>
        </div>
        <div style={{ ...sBody, opacity: local.enabled ? 1 : 0.5 }}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Count Scope</label>
              <select
                value={local.scope}
                onChange={(e) => set('scope', e.target.value)}
                style={readOnly || !local.enabled ? inputRO : inputBase}
                disabled={readOnly || !local.enabled}
              >
                {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Frequency</label>
              <select
                value={local.frequency}
                onChange={(e) => set('frequency', e.target.value as CycleCountFrequency)}
                style={readOnly || !local.enabled ? inputRO : inputBase}
                disabled={readOnly || !local.enabled}
              >
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Variance Tolerance</label>
              <input
                type="number"
                min={0}
                value={local.varianceTolerance}
                onChange={(e) => set('varianceTolerance', parseFloat(e.target.value) || 0)}
                style={readOnly || !local.enabled ? inputRO : inputBase}
                disabled={readOnly || !local.enabled}
              />
            </div>
            <div>
              <label style={labelBase}>Variance Unit</label>
              <select
                value={local.varianceUnit}
                onChange={(e) => set('varianceUnit', e.target.value)}
                style={readOnly || !local.enabled ? inputRO : inputBase}
                disabled={readOnly || !local.enabled}
              >
                {VARIANCE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <p style={hintTxt}>Discrepancies within this tolerance are auto-accepted.</p>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.freezeEnabled}
              onChange={(e) => set('freezeEnabled', e.target.checked)}
              disabled={readOnly || !local.enabled}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Freeze inventory movements during active count
          </label>
        </div>
      </div>
      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
