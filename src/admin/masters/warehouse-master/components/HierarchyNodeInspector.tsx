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
  allowedChildReason,
  onAddChild,
  onBulkCreate,
  onOpenLocations,
}: HierarchyNodeInspectorProps) {
  if (!location) {
    return (
      <div style={{ padding: '28px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Select a hierarchy node to inspect its status, derived values, restrictions, and child-node information.
      </div>
    );
  }

  const effectiveStatus = deriveEffectiveLocationStatus(location.status, warehouse.status);
  const leafEndpoint = deriveIsLeafEndpoint(location.id, locations, template);
  const inventoryAllowed = deriveInventoryAllowed(location, locations, template);
  const utilization = location.capacity?.maxUnits && location.capacity.currentUnits !== undefined
    ? `${Math.round((location.capacity.currentUnits / location.capacity.maxUnits) * 100)}%`
    : 'n/a';

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '22px 24px', background: 'var(--color-surface-subtle)' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {location.locationCode}
          </span>
          <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '999px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            {location.profile.locationType}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{location.profile.fullCode}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {location.locationName}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {metricLabel('Level', location.profile.level)}
        {metricLabel('Children', childCount)}
        {metricLabel('Capacity Utilization', utilization)}
        {metricLabel('Effective Status', effectiveStatus)}
      </div>

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
            <li>Putaway: {location.putawayBlocked ? 'Blocked' : 'Allowed'}</li>
            <li>Picking: {location.pickingBlocked ? 'Blocked' : 'Allowed'}</li>
            <li>Movement State: {location.movementState}</li>
            <li>Commitment State: {location.commitmentState}</li>
            <li>Inventory posting: {inventoryAllowed ? 'Allowed on this node' : 'Blocked on this node'}</li>
            {allowedChildReason && <li>Child creation rule: {allowedChildReason}</li>}
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Eligibility Summary</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            {location.eligibilityPolicy
              ? `Mode: ${location.eligibilityPolicy.mode} · Rules: ${location.eligibilityPolicy.rules.length}`
              : 'No location-level eligibility overrides. Warehouse-level policy applies.'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Stock statuses: {location.stockStatuses.length > 0 ? location.stockStatuses.join(', ') : 'none'}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Action Panel</div>
        <div style={{ ...cardBodyStyle, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onAddChild && (
            <button type="button" onClick={onAddChild} style={actionBtn}>
              Add child
            </button>
          )}
          {onBulkCreate && (
            <button type="button" onClick={onBulkCreate} style={actionBtn}>
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
