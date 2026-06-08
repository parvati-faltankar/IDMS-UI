import React from 'react';
import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import { deriveEffectiveLocationStatus, deriveInventoryAllowed, deriveIsLeafEndpoint } from '../utils/warehouseDerivations';
import { DerivedValueDisplay } from './DerivedValueDisplay';
import { RuleExplanationPopover } from './RuleExplanationPopover';

interface HierarchyNodeInspectorProps {
  warehouse: Warehouse;
  location: WarehouseLocation | null;
  locations: WarehouseLocation[];
  template?: HierarchyTemplate;
  childCount: number;
  rootSelected?: boolean;
  allowedChildLevels?: string[];
  allowedChildReasons?: string[];
  childCreationAllowed?: boolean;
  allowedChildReason?: string;
  onAddChild?: () => void;
  onBulkCreate?: () => void;
  onOpenLocations?: () => void;
}

function metricLabel(label: string, value: React.ReactNode) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)' }}>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

export function HierarchyNodeInspector({
  warehouse,
  location,
  locations,
  template,
  childCount,
  rootSelected = false,
  allowedChildLevels,
  allowedChildReasons,
  childCreationAllowed = true,
  allowedChildReason,
  onAddChild,
  onBulkCreate,
  onOpenLocations,
}: HierarchyNodeInspectorProps) {
  if (!location && !rootSelected) {
    return (
      <div style={{ padding: '28px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Select a hierarchy node to inspect its status, derived values, restrictions, and child-node information.
      </div>
    );
  }

  if (!location && rootSelected) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '22px 24px', background: 'var(--color-surface-subtle)' }}>
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>{warehouse.warehouseCode}</span>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              Warehouse Root
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{warehouse.warehouseName}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
          {metricLabel('Children', childCount)}
          {metricLabel('Node Type', 'Root')}
          {metricLabel('Inventory Endpoint', 'No')}
        </div>

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>Allowed Child Levels</div>
          <div style={cardBodyStyle}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              {allowedChildLevels && allowedChildLevels.length > 0
                ? allowedChildLevels.join(', ')
                : 'No child levels are currently allowed under warehouse root.'}
            </div>
            {allowedChildReasons && allowedChildReasons.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
                {allowedChildReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            {!allowedChildLevels?.length && allowedChildReason && (
              <div style={{ fontSize: '12px', color: '#92400E', marginTop: '8px' }}>{allowedChildReason}</div>
            )}
          </div>
        </section>

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>Action Panel</div>
          <div style={{ ...cardBodyStyle, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onAddChild && (
              <button type="button" onClick={onAddChild} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
                Add child
              </button>
            )}
            {onBulkCreate && (
              <button type="button" onClick={onBulkCreate} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
                Bulk create
              </button>
            )}
            <button type="button" onClick={onOpenLocations} style={actionBtn}>
              Open locations list
            </button>
            {!childCreationAllowed && allowedChildReason && (
              <div style={{ width: '100%', fontSize: '12px', color: '#92400E' }}>{allowedChildReason}</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  const selectedLocation = location;
  if (!selectedLocation) return null;

  const effectiveStatus = deriveEffectiveLocationStatus(selectedLocation.status, warehouse.status);
  const leafEndpoint = deriveIsLeafEndpoint(selectedLocation.id, locations, template);
  const inventoryAllowed = deriveInventoryAllowed(selectedLocation, locations, template);
  const utilization = selectedLocation.capacity?.maxUnits && selectedLocation.capacity.currentUnits !== undefined
    ? `${Math.round((selectedLocation.capacity.currentUnits / selectedLocation.capacity.maxUnits) * 100)}%`
    : 'n/a';
  const parentNode = selectedLocation.parentLocationId
    ? locations.find((item) => item.id === selectedLocation.parentLocationId)
    : undefined;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '22px 24px', background: 'var(--color-surface-subtle)' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {location.locationCode}
          </span>
          <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            {selectedLocation.profile.locationType}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{selectedLocation.profile.fullCode}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {selectedLocation.locationName}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {metricLabel('Level', selectedLocation.profile.level)}
        {metricLabel('Level Code', selectedLocation.profile.templateLevelCode ?? 'n/a')}
        {metricLabel('Children', childCount)}
        {metricLabel('Capacity Utilization', utilization)}
        {metricLabel('Effective Status', effectiveStatus)}
      </div>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Identifier</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Full location identifier: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.profile.fullCode}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Parent identifier: <strong style={{ color: 'var(--color-text)' }}>{parentNode?.profile.fullCode ?? `${warehouse.warehouseCode} (root)`}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Code lock policy: <strong style={{ color: 'var(--color-text)' }}>{template?.codeLockedAfterActivation ? 'Locked after activation' : 'Editable by policy'}</strong>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <DerivedValueDisplay
          label="Inventory Allowed"
          value={inventoryAllowed ? 'Yes' : 'No'}
          derivedFrom="Derived from leaf eligibility, own status, putaway block, and parent status."
          lockReason="Inventory posting is blocked on non-leaf or blocked parent nodes."
        />
        <DerivedValueDisplay
          label="Leaf Endpoint"
          value={leafEndpoint ? 'Yes' : 'No'}
          derivedFrom="Derived from the hierarchy shape and active template level rules."
          lockReason="Leaf endpoint cannot be edited directly."
        />
      </div>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span>Restrictions</span>
          <RuleExplanationPopover
            title="Hierarchy restrictions"
            body="Child creation follows valid parent-child combinations, prevents cycles, and is blocked when parent status or dependency conditions are not suitable."
          />
        </div>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Putaway: {selectedLocation.putawayBlocked ? 'Blocked' : 'Allowed'}</li>
            <li>Picking: {selectedLocation.pickingBlocked ? 'Blocked' : 'Allowed'}</li>
            <li>Movement State: {selectedLocation.movementState}</li>
            <li>Commitment State: {selectedLocation.commitmentState}</li>
            <li>Inventory posting: {inventoryAllowed ? 'Allowed on this node' : 'Blocked on this node'}</li>
            {allowedChildReason && <li>Child creation rule: {allowedChildReason}</li>}
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Eligibility Summary</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            {selectedLocation.eligibilityPolicy
              ? `Mode: ${selectedLocation.eligibilityPolicy.mode} · Rules: ${selectedLocation.eligibilityPolicy.rules.length}`
              : 'No location-level eligibility overrides. Warehouse-level policy applies.'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Stock statuses: {selectedLocation.stockStatuses.length > 0 ? selectedLocation.stockStatuses.join(', ') : 'none'}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Allowed Child Levels</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {allowedChildLevels && allowedChildLevels.length > 0
              ? allowedChildLevels.join(', ')
              : 'No child levels are currently allowed under this node.'}
          </div>
          {allowedChildReasons && allowedChildReasons.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
              {allowedChildReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Action Panel</div>
        <div style={{ ...cardBodyStyle, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onAddChild && (
            <button type="button" onClick={onAddChild} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
              Add child
            </button>
          )}
          {onBulkCreate && (
            <button type="button" onClick={onBulkCreate} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
              Bulk create
            </button>
          )}
          <button type="button" onClick={onOpenLocations} style={actionBtn}>
            Open locations list
          </button>
          <button type="button" style={{ ...actionBtn, opacity: 0.65 }} title="Re-parenting is blocked when stock or history exists.">
            Re-parent
          </button>
          <button type="button" style={{ ...actionBtn, opacity: 0.65 }} title="Lifecycle actions will be added in governed flow.">
            Change status
          </button>
          {!childCreationAllowed && allowedChildReason && (
            <div style={{ width: '100%', fontSize: '12px', color: '#92400E' }}>{allowedChildReason}</div>
          )}
        </div>
      </section>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  background: 'var(--color-surface)',
  overflow: 'hidden',
  marginBottom: '16px',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--color-text)',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '14px',
};

const actionBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text)',
  cursor: 'pointer',
};
