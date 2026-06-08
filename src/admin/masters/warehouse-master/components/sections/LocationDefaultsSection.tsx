import { useMemo, useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { DefaultLocations } from '../../types/warehouse.types';
import { PURPOSE_LABELS, getEligibleDefaultLocations } from '../../utils/policyWorkbench';
import {
  hintTxt,
  inputBase,
  inputRO,
  labelBase,
  sBody,
  sCard,
  sHead,
  SectionActionRow,
} from './sectionStyles';

type DefaultPurpose = keyof DefaultLocations;

const PURPOSES: { key: DefaultPurpose; label: string; hint: string }[] = [
  { key: 'putaway', label: 'Default Putaway Location', hint: 'Used only when no explicit putaway rule resolves a location.' },
  { key: 'picking', label: 'Default Picking Location', hint: 'Used only when no directed picking rule resolves a source.' },
  { key: 'return', label: 'Default Return Location', hint: 'Returned goods route here by default.' },
  { key: 'qc', label: 'Default QC Location', hint: 'Inspection and hold routing defaults here.' },
  { key: 'staging', label: 'Default Staging Location', hint: 'Dispatch staging defaults here.' },
  { key: 'scrap', label: 'Default Scrap Location', hint: 'Scrapped or damaged goods default here.' },
];

interface LocalState {
  defaults: Partial<DefaultLocations>;
}

function toLocal(warehouse: ConfigSectionProps['warehouse']): LocalState {
  return { defaults: { ...warehouse.defaultLocations } };
}

export function LocationDefaultsSection({ warehouse, locations, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalState>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const eligibleByPurpose = useMemo(
    () => PURPOSES.reduce<Record<DefaultPurpose, ReturnType<typeof getEligibleDefaultLocations>>>(
      (accumulator, purpose) => ({
        ...accumulator,
        [purpose.key]: getEligibleDefaultLocations(locations, purpose.key),
      }),
      {} as Record<DefaultPurpose, ReturnType<typeof getEligibleDefaultLocations>>,
    ),
    [locations],
  );

  function set(key: DefaultPurpose, value: string) {
    const location = locations.find((entry) => entry.id === value);
    setLocal((current) => ({
      defaults: {
        ...current.defaults,
        [key]: value && location
          ? {
              purpose: PURPOSE_LABELS[key],
              locationId: location.id,
              locationCode: location.profile.fullCode,
              locationName: location.locationName,
            }
          : undefined,
      },
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
            Defaults are purpose-aware. Putaway and picking defaults must be active inventory-allowed leaf locations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {PURPOSES.map(({ key, label, hint }) => (
              <div key={key}>
                <label style={labelBase}>{label}</label>
                <select
                  value={local.defaults[key]?.locationId ?? ''}
                  onChange={(event) => set(key, event.target.value)}
                  style={readOnly ? inputRO : inputBase}
                  disabled={readOnly}
                >
                  <option value="">None</option>
                  {eligibleByPurpose[key].map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.profile.fullCode} - {location.locationName}
                    </option>
                  ))}
                </select>
                <p style={hintTxt}>{hint}</p>
                <p style={{ ...hintTxt, marginTop: '2px' }}>
                  Eligible options: {eligibleByPurpose[key].length}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
