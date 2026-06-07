// ─── LocationDefaultsSection ──────────────────────────────────────────────────

import React, { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { DefaultLocations } from '../../types/warehouse.types';
import { inputBase, inputRO, labelBase, hintTxt, twoCol, sCard, sHead, sBody, SectionActionRow } from './sectionStyles';

type DefaultPurpose = keyof DefaultLocations;

const PURPOSES: { key: DefaultPurpose; label: string; hint: string }[] = [
  { key: 'putaway', label: 'Default Putaway Location', hint: 'Items are placed here when no specific rule matches.' },
  { key: 'picking', label: 'Default Picking Location', hint: 'Picking source when no directed pick is available.' },
  { key: 'return', label: 'Default Return Location', hint: 'Returned goods held here pending inspection.' },
  { key: 'qc', label: 'Default QC Location', hint: 'Quality control staging area.' },
  { key: 'staging', label: 'Default Staging Location', hint: 'Dispatch staging area before shipment.' },
  { key: 'scrap', label: 'Default Scrap Location', hint: 'Damaged / write-off items are moved here.' },
];

interface LocalState {
  defaults: Partial<DefaultLocations>;
}

function toLocal(w: ConfigSectionProps['warehouse']): LocalState {
  return { defaults: { ...w.defaultLocations } };
}

export function LocationDefaultsSection({ warehouse, locations, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalState>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const locationIds = locations
    .filter((l) => l.status === 'Active')
    .map((l) => l.id);

  function set(key: DefaultPurpose, value: string) {
    setLocal((s) => ({
      defaults: { ...s.defaults, [key]: value ? { locationId: value, locationCode: value } : undefined },
    }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ defaultLocations: local.defaults as DefaultLocations });
    setDirty(false);
  }

  return (
    <div data-testid="section-location-defaults">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Purpose-Specific Default Locations</span>
        </div>
        <div style={sBody}>
          <p style={{ ...hintTxt, marginBottom: '16px' }}>
            These defaults are used when no explicit routing rule, putaway strategy, or directed-pick path
            resolves to a specific location. Each purpose is independent.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {PURPOSES.map(({ key, label, hint }) => (
              <div key={key}>
                <label style={labelBase}>{label}</label>
                <select
                  value={local.defaults[key]?.locationId ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  style={readOnly ? inputRO : inputBase}
                  disabled={readOnly}
                >
                  <option value="">None</option>
                  {locationIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
                <p style={hintTxt}>{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
