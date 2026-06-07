// ─── StockGovernanceSection ───────────────────────────────────────────────────
// Covers Reservation Policy + Allocation Policy + Stock Mixing

import React, { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { ReservationPolicy, AllocationPolicy } from '../../types/warehouse.types';
import type { ReservationLevel, AllocationLevel, LocationType } from '../../types/warehouse.enums';
import { inputBase, inputRO, labelBase, hintTxt, sCard, sHead, sBody, twoCol, SectionActionRow } from './sectionStyles';

const RES_LEVELS: ReservationLevel[] = ['Warehouse', 'Location', 'BIN'];
const ALLOC_LEVELS: AllocationLevel[] = ['Warehouse', 'Location', 'BIN'];
const LOCATION_TYPES: LocationType[] = ['Zone', 'Aisle', 'Rack', 'Shelf', 'BIN', 'Dock', 'Staging', 'QC', 'Scrap'];

function defaultRes(): ReservationPolicy {
  return { reservationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialReservation: true };
}

function defaultAlloc(): AllocationPolicy {
  return { allocationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialAllocation: true };
}

function toLocal(w: ConfigSectionProps['warehouse']) {
  return {
    res: w.reservationPolicy ?? defaultRes(),
    alloc: w.allocationPolicy ?? defaultAlloc(),
  };
}

export function StockGovernanceSection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  function setRes<K extends keyof ReservationPolicy>(k: K, v: ReservationPolicy[K]) {
    setLocal((s) => ({ ...s, res: { ...s.res, [k]: v } }));
    setDirty(true);
  }

  function setAlloc<K extends keyof AllocationPolicy>(k: K, v: AllocationPolicy[K]) {
    setLocal((s) => ({ ...s, alloc: { ...s.alloc, [k]: v } }));
    setDirty(true);
  }

  function toggleLocType(
    policy: 'res' | 'alloc',
    type: LocationType,
    current: LocationType[],
  ) {
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    if (policy === 'res') setRes('eligibleLocationTypes', next);
    else setAlloc('eligibleLocationTypes', next);
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ reservationPolicy: local.res, allocationPolicy: local.alloc });
    setDirty(false);
  }

  return (
    <div data-testid="section-stock-governance">
      {/* Reservation */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Reservation Policy</span>
        </div>
        <div style={sBody}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Reservation Level</label>
              <select
                value={local.res.reservationLevel}
                onChange={(e) => setRes('reservationLevel', e.target.value as ReservationLevel)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                {RES_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <p style={hintTxt}>Granularity at which stock is reserved for an order line.</p>
            </div>
            <div>
              <label style={labelBase}>Auto-Release after (hrs)</label>
              <input
                type="number"
                min={1}
                value={local.res.autoReleaseAfterHours ?? ''}
                onChange={(e) => setRes('autoReleaseAfterHours', parseInt(e.target.value, 10) || undefined)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
                placeholder="e.g. 48"
              />
              <p style={hintTxt}>Leave empty to disable auto-release.</p>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelBase}>Eligible Location Types</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {LOCATION_TYPES.map((lt: LocationType) => (
                <label key={lt} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={local.res.eligibleLocationTypes.includes(lt)}
                    onChange={() => toggleLocType('res', lt, local.res.eligibleLocationTypes as LocationType[])}
                    disabled={readOnly}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {lt}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.res.allowPartialReservation}
              onChange={(e) => setRes('allowPartialReservation', e.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Allow partial reservation
          </label>
        </div>
      </div>

      {/* Allocation */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Allocation Policy</span>
        </div>
        <div style={sBody}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Allocation Level</label>
              <select
                value={local.alloc.allocationLevel}
                onChange={(e) => setAlloc('allocationLevel', e.target.value as AllocationLevel)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                {ALLOC_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <p style={hintTxt}>Granularity at which stock is allocated from a reservation.</p>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelBase}>Eligible Location Types</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {LOCATION_TYPES.map((lt: LocationType) => (
                <label key={lt} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={local.alloc.eligibleLocationTypes.includes(lt)}
                    onChange={() => toggleLocType('alloc', lt, local.alloc.eligibleLocationTypes as LocationType[])}
                    disabled={readOnly}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {lt}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.alloc.allowPartialAllocation}
              onChange={(e) => setAlloc('allowPartialAllocation', e.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Allow partial allocation
          </label>
        </div>
      </div>

      <SectionActionRow dirty={dirty} saving={saving} readOnly={readOnly} onSave={save} onDiscard={discard} />
    </div>
  );
}
