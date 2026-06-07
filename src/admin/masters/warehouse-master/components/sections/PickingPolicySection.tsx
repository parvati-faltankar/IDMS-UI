// ─── PickingPolicySection ─────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import type { ConfigSectionProps } from './sectionTypes';
import type { PickingPolicy } from '../../types/warehouse.types';
import type { PickingStrategy } from '../../types/warehouse.enums';
import { inputBase, inputRO, labelBase, hintTxt, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';

const STRATEGIES: PickingStrategy[] = [
  'FIFO', 'FEFO', 'LIFO', 'LEFO',
  'Zone-Wave', 'Batch', 'Single-Order', 'Cluster',
];

function defaultPolicy(): PickingPolicy {
  return { enabled: true, strategy: 'FIFO', strategySequence: 1, overrideAllowed: true };
}

function toLocal(w: ConfigSectionProps['warehouse']): PickingPolicy {
  return w.autoPicking ?? defaultPolicy();
}

export function PickingPolicySection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<PickingPolicy>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const isBinLevel = warehouse.inventoryControlMode === 'Location-BIN-Level';

  if (!isBinLevel) {
    return (
      <div data-testid="section-picking">
        <div style={{ padding: '14px 18px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', gap: '8px' }}>
          <Lock size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          Auto Picking is not applicable for Warehouse-Level inventory mode.
        </div>
      </div>
    );
  }

  function set<K extends keyof PickingPolicy>(k: K, v: PickingPolicy[K]) {
    setLocal((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ autoPicking: local });
    setDirty(false);
  }

  return (
    <div data-testid="section-picking">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Auto Picking Policy</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px' }}>
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
        <div style={{ ...sBody, opacity: local.enabled ? 1 : 0.45 }}>
          <div style={{ maxWidth: '320px', marginBottom: '14px' }}>
            <label style={labelBase}>Strategy</label>
            <select
              value={local.strategy}
              onChange={(e) => set('strategy', e.target.value as PickingStrategy)}
              style={readOnly || !local.enabled ? inputRO : inputBase}
              disabled={readOnly || !local.enabled}
            >
              {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ maxWidth: '200px', marginBottom: '14px' }}>
            <label style={labelBase}>Strategy Sequence Priority</label>
            <input
              type="number"
              min={1}
              max={99}
              value={local.strategySequence}
              onChange={(e) => set('strategySequence', parseInt(e.target.value, 10) || 1)}
              style={readOnly || !local.enabled ? inputRO : inputBase}
              disabled={readOnly || !local.enabled}
            />
            <p style={hintTxt}>Lower number = higher priority when multiple strategies are active.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={local.overrideAllowed}
              onChange={(e) => set('overrideAllowed', e.target.checked)}
              disabled={readOnly || !local.enabled}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Allow override by picking user
          </label>
        </div>
      </div>
      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
