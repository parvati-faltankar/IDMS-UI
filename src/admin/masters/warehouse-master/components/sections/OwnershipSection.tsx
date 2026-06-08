// ─── OwnershipSection ─────────────────────────────────────────────────────────

import { useState } from 'react';
import type { ConfigSectionProps } from './sectionTypes';
import {
  inputBase, inputRO, labelBase, hintTxt, twoCol, fw,
  sCard, sHead, sBody, SectionActionRow,
} from './sectionStyles';
import type { WarehouseOwnershipScope, WarehouseType } from '../../types/warehouse.enums';

const ORG_CODES = ['ORG-001', 'ORG-002', 'ORG-003'];
const BRANCH_CODES = ['BR-HYD', 'BR-PUNE', 'BR-CHN', 'BR-DEL', 'BR-MUM'];
const COMPANY_CODES = ['EXCL-001', 'EXCL-002'];
const BU_CODES = ['BU-SALES', 'BU-MFG', 'BU-DIST'];
const LEGAL_ENTITIES = ['LE-INDIA-001', 'LE-INDIA-002'];
const INV_OWNER_CODES = ['OWN-001', 'OWN-002', 'OWN-003'];
const WH_TYPES: WarehouseType[] = [
  'Physical', 'Virtual', 'Transit', 'Consignment', 'Bonded', 'Cold-Chain', 'Hazardous',
];
const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC',
];

interface LocalState {
  warehouseName: string;
  description: string;
  warehouseType: WarehouseType | '';
  facilityReference: string;
  timezone: string;
  ownershipScope: WarehouseOwnershipScope | '';
  owningOrgCode: string;
  owningBranchCode: string;
  companyCode: string;
  businessUnit: string;
  legalEntityCode: string;
  inventoryOwnerCode: string;
}

function toLocal(w: ConfigSectionProps['warehouse']): LocalState {
  return {
    warehouseName: w.warehouseName,
    description: w.description ?? '',
    warehouseType: w.warehouseType,
    facilityReference: '',
    timezone: w.operatingCalendar?.timezone ?? '',
    ownershipScope: w.ownershipScope,
    owningOrgCode: w.owningOrgCode ?? '',
    owningBranchCode: w.owningBranchCode ?? '',
    companyCode: w.assignmentProfile?.companyCode ?? '',
    businessUnit: w.assignmentProfile?.businessUnit ?? '',
    legalEntityCode: w.assignmentProfile?.legalEntityCode ?? '',
    inventoryOwnerCode: w.assignmentProfile?.inventoryOwner?.ownerCode ?? '',
  };
}

export function OwnershipSection({ warehouse, readOnly, saving, onSave }: ConfigSectionProps) {
  const [local, setLocal] = useState<LocalState>(() => toLocal(warehouse));
  const [dirty, setDirty] = useState(false);
  const isActive = warehouse.status === 'Active' || warehouse.status === 'Blocked';

  function set<K extends keyof LocalState>(k: K, v: LocalState[K]) {
    setLocal((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }

  function discard() {
    setLocal(toLocal(warehouse));
    setDirty(false);
  }

  async function save() {
    await onSave({
      warehouseName: local.warehouseName.trim(),
      description: local.description.trim() || undefined,
      warehouseType: (local.warehouseType || 'Physical') as WarehouseType,
      ownershipScope: (local.ownershipScope || 'Organization') as WarehouseOwnershipScope,
      owningOrgCode: local.ownershipScope === 'Organization' ? local.owningOrgCode : undefined,
      owningBranchCode: local.ownershipScope === 'Branch' ? local.owningBranchCode : undefined,
      operatingCalendar: local.timezone ? { timezone: local.timezone } : undefined,
    });
    setDirty(false);
  }

  return (
    <div data-testid="section-ownership">
      {/* Identity */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Identity &amp; Facility</span>
        </div>
        <div style={sBody}>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Warehouse Code</label>
              <input
                type="text"
                value={warehouse.warehouseCode}
                readOnly
                style={inputRO}
              />
              <p style={hintTxt}>Locked after creation.</p>
            </div>
            <div>
              <label style={labelBase}>Warehouse Name *</label>
              <input
                type="text"
                value={local.warehouseName}
                onChange={(e) => set('warehouseName', e.target.value)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              />
            </div>
          </div>
          <div style={fw}>
            <label style={labelBase}>Description</label>
            <textarea
              value={local.description}
              onChange={(e) => set('description', e.target.value)}
              style={{ ...inputBase, resize: 'vertical', minHeight: '56px', opacity: readOnly ? 0.6 : 1 }}
              disabled={readOnly}
            />
          </div>
          <div style={{ ...twoCol, ...fw }}>
            <div>
              <label style={labelBase}>Warehouse Type *</label>
              <select
                value={local.warehouseType}
                onChange={(e) => set('warehouseType', e.target.value as WarehouseType)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly || isActive}
              >
                {WH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {isActive && <p style={hintTxt}>Locked — warehouse is active.</p>}
            </div>
            <div>
              <label style={labelBase}>Operational Time Zone *</label>
              <select
                value={local.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">Select…</option>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ownership scope */}
      <div style={sCard}>
        <div style={sHead}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Ownership Scope</span>
          {isActive && (
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
              locked after activation
            </span>
          )}
        </div>
        <div style={sBody}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            {(['Organization', 'Branch'] as WarehouseOwnershipScope[]).map((scope) => (
              <label
                key={scope}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '12px 16px', flex: 1, borderRadius: '8px', cursor: isActive || readOnly ? 'not-allowed' : 'pointer',
                  border: `2px solid ${local.ownershipScope === scope ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: local.ownershipScope === scope ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                  opacity: isActive ? 0.7 : 1,
                }}
              >
                <input
                  type="radio"
                  name="ownershipScope"
                  checked={local.ownershipScope === scope}
                  onChange={() => !isActive && !readOnly && set('ownershipScope', scope)}
                  disabled={isActive || readOnly}
                  style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>{scope} Level</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {scope === 'Organization' ? 'Owned by the organisation' : 'Owned by a specific branch'}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <div style={twoCol}>
            {local.ownershipScope === 'Organization' && (
              <div>
                <label style={labelBase}>Owning Organization *</label>
                <select
                  value={local.owningOrgCode}
                  onChange={(e) => set('owningOrgCode', e.target.value)}
                  style={readOnly || isActive ? inputRO : inputBase}
                  disabled={readOnly || isActive}
                >
                  <option value="">Select…</option>
                  {ORG_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {local.ownershipScope === 'Branch' && (
              <div>
                <label style={labelBase}>Owning Branch *</label>
                <select
                  value={local.owningBranchCode}
                  onChange={(e) => set('owningBranchCode', e.target.value)}
                  style={readOnly || isActive ? inputRO : inputBase}
                  disabled={readOnly || isActive}
                >
                  <option value="">Select…</option>
                  {BRANCH_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={labelBase}>Company</label>
              <select
                value={local.companyCode}
                onChange={(e) => set('companyCode', e.target.value)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">Select…</option>
                {COMPANY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...twoCol, marginTop: '14px' }}>
            <div>
              <label style={labelBase}>Business Unit</label>
              <select
                value={local.businessUnit}
                onChange={(e) => set('businessUnit', e.target.value)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">Select…</option>
                {BU_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>Legal Entity</label>
              <select
                value={local.legalEntityCode}
                onChange={(e) => set('legalEntityCode', e.target.value)}
                style={readOnly ? inputRO : inputBase}
                disabled={readOnly}
              >
                <option value="">Select…</option>
                {LEGAL_ENTITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ maxWidth: '340px', marginTop: '14px' }}>
            <label style={labelBase}>Inventory Owner</label>
            <select
              value={local.inventoryOwnerCode}
              onChange={(e) => set('inventoryOwnerCode', e.target.value)}
              style={readOnly ? inputRO : inputBase}
              disabled={readOnly}
            >
              <option value="">Select…</option>
              {INV_OWNER_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p style={hintTxt}>The entity that legally owns the stock — distinct from branch access.</p>
          </div>
        </div>
      </div>

      <SectionActionRow
        dirty={dirty}
        saving={saving}
        readOnly={readOnly}
        onSave={save}
        onDiscard={discard}
      />
    </div>
  );
}
