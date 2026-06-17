import React from 'react';
import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../types/warehouse.types';
import {
  deriveCapacityStatus,
  deriveCapacityUtilization,
  deriveEffectiveCapacityPolicy,
  deriveEffectiveLocationStatus,
  deriveEffectiveResponsibility,
  deriveInventoryAllowed,
  deriveInventoryEndpointEligible,
  deriveIsLeafEndpoint,
} from '../utils/warehouseDerivations';
import { deriveEffectiveNodeCapabilities } from '../utils/hierarchyUtils';
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

export function deriveInventoryAllowedReason(
  location: WarehouseLocation,
  warehouse: Warehouse,
  allLocations: WarehouseLocation[],
  template?: HierarchyTemplate,
): string {
  if (warehouse.status !== 'Active' && warehouse.status !== 'Draft') {
    return `Warehouse status ${warehouse.status} prevents inventory posting.`;
  }
  if (location.status !== 'Active') {
    return `Node status ${location.status} prevents inventory posting.`;
  }
  if (location.putawayBlocked) {
    return 'Putaway is blocked for this node.';
  }
  const isLeaf = deriveIsLeafEndpoint(location.id, allLocations, template);
  if (!isLeaf) {
    return 'Only leaf endpoint nodes can be inventory allowed.';
  }
  const endpointEligible = deriveInventoryEndpointEligible(location, template);
  if (!endpointEligible) {
    return 'This level is not inventory-endpoint eligible by template capability.';
  }
  const parent = location.parentLocationId
    ? allLocations.find((item) => item.id === location.parentLocationId)
    : undefined;
  if (parent && parent.status !== 'Active') {
    return `Parent node ${parent.locationCode} is ${parent.status}.`;
  }
  return 'Inventory posting is allowed on this node.';
}

export interface InspectorActionState {
  readonly key:
    | 'add-child'
    | 'bulk-create'
    | 'activate-node'
    | 'block-node'
    | 'inactivate-node'
    | 'manage-capacity'
    | 'manage-item-eligibility'
    | 'manage-responsibility';
  readonly label: string;
  readonly enabled: boolean;
  readonly reason?: string;
}

export function buildInspectorActionStates(
  location: WarehouseLocation | null,
  childCreationAllowed: boolean,
  capabilities: ReturnType<typeof deriveEffectiveNodeCapabilities> | null,
): InspectorActionState[] {
  return [
    {
      key: 'add-child',
      label: 'Add Child',
      enabled: childCreationAllowed,
      reason: childCreationAllowed ? undefined : 'No valid child level can be created under the selected node.',
    },
    {
      key: 'bulk-create',
      label: 'Bulk Create',
      enabled: childCreationAllowed,
      reason: childCreationAllowed ? undefined : 'Bulk create is disabled when no valid child level is available.',
    },
    {
      key: 'activate-node',
      label: 'Activate Node',
      enabled: Boolean(location && location.status === 'Draft'),
      reason: location && location.status !== 'Draft' ? 'Only Draft nodes can be activated.' : undefined,
    },
    {
      key: 'block-node',
      label: 'Block Node',
      enabled: Boolean(location && location.status === 'Active'),
      reason: location && location.status !== 'Active' ? 'Only Active nodes can be blocked.' : undefined,
    },
    {
      key: 'inactivate-node',
      label: 'Inactivate Node',
      enabled: Boolean(location && (location.status === 'Active' || location.status === 'Blocked')),
      reason: location && !(location.status === 'Active' || location.status === 'Blocked') ? 'Only Active or Blocked nodes can be inactivated.' : undefined,
    },
    {
      key: 'manage-capacity',
      label: 'Manage Capacity',
      enabled: false,
      reason: capabilities?.capacityApplicable
        ? 'Capacity setup will be available after capacity policy configuration is enabled.'
        : 'Capacity is not applicable for this hierarchy level.',
    },
    {
      key: 'manage-item-eligibility',
      label: 'Manage Item Eligibility',
      enabled: false,
      reason: capabilities?.itemEligibilityApplicable
        ? 'Item eligibility setup will be available after eligibility policy configuration is enabled.'
        : 'Item eligibility is not applicable for this hierarchy level.',
    },
    {
      key: 'manage-responsibility',
      label: 'Manage Responsibility',
      enabled: false,
      reason: capabilities?.responsibilityApplicable
        ? 'Responsibility setup will be available after responsibility policy configuration is enabled.'
        : 'Responsibility is not applicable for this hierarchy level.',
    },
  ];
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
  const primaryChildLabel = allowedChildLevels?.[0]?.split(' (')[0] ?? 'Child';

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
          <div style={cardHeaderStyle}>What You Can Create Next</div>
          <div style={cardBodyStyle}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
              {allowedChildLevels && allowedChildLevels.length > 0
                ? `Start by creating ${allowedChildLevels.length === 1 ? `a ${primaryChildLabel}` : `one of these levels: ${allowedChildLevels.join(', ')}`}.`
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
          <div style={cardHeaderStyle}>Next Action</div>
          <div style={{ ...cardBodyStyle, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onAddChild && (
              <button type="button" onClick={onAddChild} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
                Add {primaryChildLabel}
              </button>
            )}
            {onBulkCreate && (
              <button type="button" onClick={onBulkCreate} disabled={!childCreationAllowed} style={{ ...actionBtn, opacity: childCreationAllowed ? 1 : 0.55 }}>
                Bulk create {allowedChildLevels && allowedChildLevels.length === 1 ? primaryChildLabel : 'children'}
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
  const inventoryEndpointEligible = deriveInventoryEndpointEligible(selectedLocation, template);
  const capabilities = deriveEffectiveNodeCapabilities(template, selectedLocation);
  const effectiveResponsibility = deriveEffectiveResponsibility(selectedLocation, locations);
  const effectiveCapacityPolicy = deriveEffectiveCapacityPolicy(warehouse, selectedLocation, template);
  const capacityStatus = deriveCapacityStatus(selectedLocation, locations, warehouse, template);
  const capacityUtilization = deriveCapacityUtilization(selectedLocation, locations, warehouse, template);
  const inventoryAllowedReason = deriveInventoryAllowedReason(selectedLocation, warehouse, locations, template);
  const actionStates = buildInspectorActionStates(selectedLocation, childCreationAllowed, capabilities);
  const utilization = selectedLocation.capacity?.maxUnits && selectedLocation.capacity.currentUnits !== undefined
    ? `${Math.round((selectedLocation.capacity.currentUnits / selectedLocation.capacity.maxUnits) * 100)}%`
    : 'n/a';
  const parentNode = selectedLocation.parentLocationId
    ? locations.find((item) => item.id === selectedLocation.parentLocationId)
    : undefined;
  const nextChildSummary = allowedChildLevels && allowedChildLevels.length > 0
    ? allowedChildLevels.length === 1
      ? `You can create ${allowedChildLevels[0]} under this node.`
      : `You can create one of these next levels: ${allowedChildLevels.join(', ')}.`
    : 'No child level can be created under this node right now.';

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

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>What You Can Create Next</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
            {nextChildSummary}
          </div>
          {allowedChildReasons && allowedChildReasons.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
              {allowedChildReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          {!childCreationAllowed && allowedChildReason && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#92400E' }}>
              {allowedChildReason}
            </div>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Next Action</div>
        <div style={{ ...cardBodyStyle, display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onAddChild && (
              <button type="button" onClick={onAddChild} disabled={!actionStates.find((item) => item.key === 'add-child')?.enabled} style={{ ...actionBtn, opacity: actionStates.find((item) => item.key === 'add-child')?.enabled ? 1 : 0.55 }}>
                Add {primaryChildLabel}
              </button>
            )}
            {onBulkCreate && (
              <button type="button" onClick={onBulkCreate} disabled={!actionStates.find((item) => item.key === 'bulk-create')?.enabled} style={{ ...actionBtn, opacity: actionStates.find((item) => item.key === 'bulk-create')?.enabled ? 1 : 0.55 }}>
                Bulk create {allowedChildLevels && allowedChildLevels.length === 1 ? primaryChildLabel : 'children'}
              </button>
            )}
            <button type="button" onClick={onOpenLocations} style={actionBtn}>
              Open locations list
            </button>
          </div>
          {!childCreationAllowed && allowedChildReason && (
            <div style={{ fontSize: '12px', color: '#92400E' }}>Why blocked: {allowedChildReason}</div>
          )}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {metricLabel('Level', selectedLocation.profile.level)}
        {metricLabel('Level Code', selectedLocation.profile.templateLevelCode ?? 'n/a')}
        {metricLabel('Children', childCount)}
        {metricLabel('Capacity Utilization', utilization)}
        {metricLabel('Effective Status', effectiveStatus)}
      </div>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Identity</div>
        <div style={cardBodyStyle}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Node code: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.locationCode}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Node name: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.locationName}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Level code / name: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.profile.templateLevelCode ?? 'n/a'} / {selectedLocation.profile.level}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Level role: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.profile.locationRole ?? 'Structural'}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Full location identifier: <strong style={{ color: 'var(--color-text)' }}>{selectedLocation.profile.fullCode}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Path breadcrumb: <strong style={{ color: 'var(--color-text)' }}>{parentNode?.profile.fullCode ?? warehouse.warehouseCode} to {selectedLocation.locationCode}</strong>
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
          derivedFrom={inventoryAllowedReason}
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
        <div style={cardHeaderStyle}>Status and Lifecycle</div>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Status: {selectedLocation.status}</li>
            <li>Effective Status: {effectiveStatus}</li>
            <li>Parent status impact: {parentNode ? `${parentNode.locationCode} is ${parentNode.status}` : 'Warehouse root context'}</li>
            <li>Blocking reasons: {inventoryAllowed ? 'None' : inventoryAllowedReason}</li>
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Derived Values</div>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Is Leaf Endpoint: {leafEndpoint ? 'Yes' : 'No'}</li>
            <li>Inventory Endpoint Eligible: {inventoryEndpointEligible ? 'Yes' : 'No'}</li>
            <li>Inventory Allowed: {inventoryAllowed ? 'Yes' : 'No'}</li>
            <li>Inventory Allowed reason: {inventoryAllowedReason}</li>
            <li>Identifier lock status: {template?.codeLockedAfterActivation ? 'Locked after activation' : 'Editable by policy'}</li>
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Capabilities</div>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Capacity Applicable: {capabilities.capacityApplicable ? 'Yes' : 'No'}</li>
            <li>Item Eligibility Applicable: {capabilities.itemEligibilityApplicable ? 'Yes' : 'No'}</li>
            <li>Responsibility Applicable: {capabilities.responsibilityApplicable ? 'Yes' : 'No'}</li>
            <li>Barcode Applicable: {capabilities.barcodeApplicable ? 'Yes' : 'No'}</li>
            <li>QR Applicable: {capabilities.qrApplicable ? 'Yes' : 'No'}</li>
            <li>Transaction Purposes: {capabilities.transactionPurposes.length > 0 ? capabilities.transactionPurposes.join(', ') : 'Not Applicable'}</li>
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Setup Readiness</div>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            <li>Capacity setup status: {capabilities.capacityApplicable ? (selectedLocation.capacity ? 'Configured' : 'Missing') : 'Not Applicable'}</li>
            <li>Item eligibility setup status: {capabilities.itemEligibilityApplicable ? (selectedLocation.eligibilityPolicy || (selectedLocation.eligibilityMappings?.length ?? 0) > 0 ? 'Configured' : 'Missing') : 'Not Applicable'}</li>
            <li>Responsibility setup status: {capabilities.responsibilityApplicable ? effectiveResponsibility.status : 'Not Applicable'}</li>
            <li>Default location role/status: {selectedLocation.profile.locationRole ?? 'Structural'} / {selectedLocation.status}</li>
            <li>Node issue state: {inventoryAllowed ? 'No blocking issue' : 'Review inventory and lifecycle constraints'}</li>
          </ul>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Capacity</div>
        <div style={cardBodyStyle}>
          {!capabilities.capacityApplicable ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Capacity is not applicable for this level according to the active template.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
              <li>Capacity Tracking Enabled: {selectedLocation.capacity?.trackingEnabled ?? warehouse.capacityPolicy?.trackingEnabled ? 'Yes' : 'No'}</li>
              <li>Enforcement Mode: {selectedLocation.capacity?.enforcementMode ?? effectiveCapacityPolicy.enforcementMode}</li>
              <li>Rollup Mode: {selectedLocation.capacity?.rollupMode ?? effectiveCapacityPolicy.rollupMode}</li>
              <li>Max Units / Weight / Volume: {selectedLocation.capacity?.maxUnits ?? 'n/a'} / {selectedLocation.capacity?.maxWeightKg ?? 'n/a'} / {selectedLocation.capacity?.maxVolumeM3 ?? 'n/a'}</li>
              <li>Current Usage: {selectedLocation.capacity?.currentUnits ?? 0} units, {selectedLocation.capacity?.currentWeightKg ?? 0} kg, {selectedLocation.capacity?.currentVolumeM3 ?? 0} m3</li>
              <li>Reserved Usage: {selectedLocation.capacity?.reservedUnits ?? 0} units, {selectedLocation.capacity?.reservedWeightKg ?? 0} kg, {selectedLocation.capacity?.reservedVolumeM3 ?? 0} m3</li>
              <li>Available Capacity: {selectedLocation.capacity?.availableUnits ?? 'n/a'} units, {selectedLocation.capacity?.availableWeightKg ?? 'n/a'} kg, {selectedLocation.capacity?.availableVolumeM3 ?? 'n/a'} m3</li>
              <li>Utilization %: {capacityUtilization ?? selectedLocation.capacity?.utilizationPercent ?? 'n/a'}%</li>
              <li>Capacity Status: {capacityStatus}</li>
            </ul>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeaderStyle}>Constraints</div>
        <div style={cardBodyStyle}>
          {!capabilities.capacityApplicable ? (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Constraints are not applicable for this level according to the active template.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
              <li>Hazard Allowed: {selectedLocation.storageConstraints?.hazardAllowed ?? warehouse.storageConstraints?.hazardAllowed ? 'Yes' : 'No'}</li>
              <li>Temperature Zone: {selectedLocation.storageConstraints?.temperatureZone ?? warehouse.storageConstraints?.temperatureZone ?? 'Not Applicable'}</li>
              <li>Mixed Item Allowed: {selectedLocation.storageConstraints?.allowMixedItemStorage ?? warehouse.storageConstraints?.allowMixedItemStorage ? 'Yes' : 'No'}</li>
              <li>Mixed Lot Allowed: {selectedLocation.storageConstraints?.allowMixedLotStorage ?? warehouse.storageConstraints?.allowMixedLotStorage ? 'Yes' : 'No'}</li>
              <li>Mixed Owner Allowed: {selectedLocation.storageConstraints?.allowMixedOwnerStorage ?? warehouse.storageConstraints?.allowMixedOwnerStorage ? 'Yes' : 'No'}</li>
              <li>Temperature Min/Max: {selectedLocation.storageConstraints?.minTempCelsius ?? warehouse.storageConstraints?.minTempCelsius ?? 'n/a'} / {selectedLocation.storageConstraints?.maxTempCelsius ?? warehouse.storageConstraints?.maxTempCelsius ?? 'n/a'}</li>
              <li>Compliance Restriction: {selectedLocation.storageConstraints?.complianceLockCode ?? warehouse.storageConstraints?.complianceLockCode ?? 'None'}</li>
            </ul>
          )}
        </div>
      </section>

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

      <details style={{ ...cardStyle, overflow: 'visible' }}>
        <summary style={{ ...cardHeaderStyle, cursor: 'pointer', listStyle: 'none' }}>Advanced Node Details</summary>
        <div style={cardBodyStyle}>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6 }}>
            {actionStates.filter((item) => !item.enabled && item.reason).map((item) => (
              <li key={item.key}>{item.label}: {item.reason}</li>
            ))}
          </ul>
        </div>
      </details>
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
