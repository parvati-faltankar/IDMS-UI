import React, { useMemo, useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import type { AllocationPolicy, ReservationPolicy } from '../../types/warehouse.types';
import type { AllocationLevel, LocationType, ReservationLevel } from '../../types/warehouse.enums';
import {
  INVALID_STOCK_AVAILABILITY_STATES,
  validateReservationAllocationPolicies,
  validateStockStateSeparation,
} from '../../utils/policyWorkbench';
import {
  hintTxt,
  inputBase,
  inputRO,
  labelBase,
  sBody,
  sCard,
  sHead,
  SectionActionRow,
  twoCol,
} from './sectionStyles';

const RES_LEVELS: ReservationLevel[] = ['Warehouse', 'Location', 'BIN'];
const ALLOC_LEVELS: AllocationLevel[] = ['Warehouse', 'Location', 'BIN'];
const LOCATION_TYPES: LocationType[] = ['Zone', 'Aisle', 'Rack', 'Shelf', 'BIN', 'Dock', 'Staging', 'QC', 'Scrap'];

function defaultReservation(): ReservationPolicy {
  return { reservationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialReservation: true };
}

function defaultAllocation(): AllocationPolicy {
  return { allocationLevel: 'Warehouse', eligibleLocationTypes: [], allowPartialAllocation: true };
}

function toLocal(warehouse: ConfigSectionProps['warehouse']) {
  return {
    reservation: warehouse.reservationPolicy ?? defaultReservation(),
    allocation: warehouse.allocationPolicy ?? defaultAllocation(),
  };
}

export function StockGovernanceSection({ warehouse, locations, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);

  const stateIssues = useMemo(
    () => locations.flatMap((location) =>
      validateStockStateSeparation(location.stockStatuses, location.movementState, location.commitmentState),
    ),
    [locations],
  );

  const policyIssues = useMemo(
    () => validateReservationAllocationPolicies(local.reservation, local.allocation, warehouse.inventoryControlMode),
    [local.allocation, local.reservation, warehouse.inventoryControlMode],
  );

  function setReservation<K extends keyof ReservationPolicy>(key: K, value: ReservationPolicy[K]) {
    setLocal((current) => ({ ...current, reservation: { ...current.reservation, [key]: value } }));
    setDirty(true);
  }

  function setAllocation<K extends keyof AllocationPolicy>(key: K, value: AllocationPolicy[K]) {
    setLocal((current) => ({ ...current, allocation: { ...current.allocation, [key]: value } }));
    setDirty(true);
  }

  function toggleLocationType(policy: 'reservation' | 'allocation', type: LocationType) {
    const current = policy === 'reservation' ? local.reservation.eligibleLocationTypes : local.allocation.eligibleLocationTypes;
    const next = current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type];
    if (policy === 'reservation') {
      setReservation('eligibleLocationTypes', next);
      return;
    }
    setAllocation('eligibleLocationTypes', next);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({ reservationPolicy: local.reservation, allocationPolicy: local.allocation });
    setDirty(false);
  }

  return (
    <div data-testid="section-stock-governance">
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>State Separation</span>
        </div>
        <div style={sBody}>
          <div style={{ marginBottom: '12px', padding: '12px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
            Stock Availability Status, Movement State, and Commitment State are separate concepts.
            Reservation protects quantity. Allocation locks source scope.
          </div>
          <p style={hintTxt}>
            Invalid stock availability values: {INVALID_STOCK_AVAILABILITY_STATES.join(', ')}.
          </p>
          {stateIssues.length > 0 && (
            <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
              {stateIssues.map((issue, index) => (
                <div key={`${issue.message}-${index}`} style={{ fontSize: '12px', color: issue.severity === 'error' ? '#B91C1C' : '#92400E' }}>
                  {issue.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Reservation Policy</span>
        </div>
        <div style={sBody}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Reservation Level</label>
              <select value={local.reservation.reservationLevel} onChange={(event) => setReservation('reservationLevel', event.target.value as ReservationLevel)} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                {RES_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <p style={hintTxt}>Reservation protects available quantity before source allocation is decided.</p>
            </div>
            <div>
              <label style={labelBase}>Auto Release After (hrs)</label>
              <input type="number" value={local.reservation.autoReleaseAfterHours ?? ''} onChange={(event) => setReservation('autoReleaseAfterHours', parseInt(event.target.value, 10) || undefined)} style={readOnly ? inputRO : inputBase} disabled={readOnly} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelBase}>Eligible Location Types</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {LOCATION_TYPES.map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                  <input type="checkbox" checked={local.reservation.eligibleLocationTypes.includes(type)} onChange={() => toggleLocationType('reservation', type)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
                  {type}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
            <input type="checkbox" checked={local.reservation.allowPartialReservation} onChange={(event) => setReservation('allowPartialReservation', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
            Allow partial reservation
          </label>
        </div>
      </div>

      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Allocation Policy</span>
        </div>
        <div style={sBody}>
          <div style={{ ...twoCol, marginBottom: '14px' }}>
            <div>
              <label style={labelBase}>Allocation Level</label>
              <select value={local.allocation.allocationLevel} onChange={(event) => setAllocation('allocationLevel', event.target.value as AllocationLevel)} style={readOnly ? inputRO : inputBase} disabled={readOnly}>
                {ALLOC_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <p style={hintTxt}>Allocation must lock the same or a narrower source scope than reservation.</p>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelBase}>Eligible Location Types</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {LOCATION_TYPES.map((type) => (
                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                  <input type="checkbox" checked={local.allocation.eligibleLocationTypes.includes(type)} onChange={() => toggleLocationType('allocation', type)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
                  {type}
                </label>
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
            <input type="checkbox" checked={local.allocation.allowPartialAllocation} onChange={(event) => setAllocation('allowPartialAllocation', event.target.checked)} disabled={readOnly} style={{ accentColor: 'var(--color-primary)' }} />
            Allow partial allocation
          </label>
        </div>
      </div>

      {policyIssues.length > 0 && (
        <div style={{ ...sCard, borderColor: '#FCD34D' }}>
          <div style={{ ...sHead, background: '#FFFBEB' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Policy Validation</span>
          </div>
          <div style={sBody}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {policyIssues.map((issue, index) => (
                <div key={`${issue.message}-${index}`} style={{ fontSize: '12px', color: issue.severity === 'error' ? '#B91C1C' : '#92400E' }}>
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
