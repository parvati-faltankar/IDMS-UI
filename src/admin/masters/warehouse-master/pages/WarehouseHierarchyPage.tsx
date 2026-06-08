import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Eye, EyeOff, HelpCircle, Import, Plus, Rows3, Settings2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { HierarchyTemplate, WarehouseDetails, WarehouseLocation } from '../types/warehouse.types';
import { buildHierarchyTree, explainChildLevelAllowance, getAllowedChildLocationTypes, getAllowedChildTemplateLevels } from '../utils/hierarchyUtils';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { HierarchyTree } from '../components/HierarchyTree';
import { HierarchyNodeInspector } from '../components/HierarchyNodeInspector';
import { LocationBulkCreateDrawer } from '../components/LocationBulkCreateDrawer';
import { LocationNodeCreateDrawer } from '../components/LocationNodeCreateDrawer';
import { HierarchyTemplateDesigner } from '../components/HierarchyTemplateDesigner';

export function canAddChildUnderNode(
  location: WarehouseLocation | null,
  warehouseMode: 'Warehouse-Level' | 'Location-BIN-Level',
  template: HierarchyTemplate | undefined,
  locations: WarehouseLocation[],
): { allowed: boolean; reason?: string } {
  if (warehouseMode === 'Warehouse-Level') {
    return { allowed: false, reason: 'Warehouse-Level mode does not require hierarchy.' };
  }
  if (!template) {
    return { allowed: false, reason: 'Activate a hierarchy template version before creating hierarchy nodes.' };
  }
  if (!location) return { allowed: true };
  if (location.status === 'Blocked' || location.status === 'Inactive') {
    return { allowed: false, reason: `Cannot add child under a ${location.status} parent.` };
  }
  if (location.movementState !== 'Idle' || location.commitmentState !== 'Uncommitted' || location.stockStatuses.length > 0) {
    return { allowed: false, reason: 'Re-parenting and child creation are blocked when stock, history, or open work exists.' };
  }
  const allowedTypes = getAllowedChildLocationTypes(location, template);
  if (allowedTypes.length === 0) {
    return { allowed: false, reason: 'No valid child levels remain under this node.' };
  }
  const cycleRisk = locations.some((candidate) => candidate.parentLocationId === location.id && candidate.id === location.id);
  if (cycleRisk) {
    return { allowed: false, reason: 'Cycle prevention blocked this operation.' };
  }
  return { allowed: true };
}

export function collectHierarchyIssueNodeIds(locations: WarehouseLocation[]): Set<string> {
  return new Set(
    locations
      .filter((location) =>
        location.status !== 'Active' ||
        !location.profile.inventoryAllowed ||
        location.putawayBlocked ||
        location.pickingBlocked,
      )
      .map((location) => location.id),
  );
}

const WarehouseHierarchyPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [bulkParent, setBulkParent] = useState<WarehouseLocation | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [createParent, setCreateParent] = useState<WarehouseLocation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1100);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  async function load() {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const next = await warehouseMockAdapter.getWarehouse(warehouseId);
      setDetails(next);
      setSelectedId((current) => current ?? next.locations[0]?.id ?? null);
      setExpandedIds(new Set(next.locations.map((location) => location.parentLocationId).filter(Boolean) as string[]));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hierarchy workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [warehouseId]);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTemplate = useMemo(
    () => details?.hierarchyTemplates.find((template) => template.status === 'Active'),
    [details],
  );
  const issueNodeIds = useMemo(
    () => collectHierarchyIssueNodeIds(details?.locations ?? []),
    [details?.locations],
  );
  const treeNodes = useMemo(() => buildHierarchyTree(details?.locations ?? [], activeTemplate), [details?.locations, activeTemplate]);
  const selectedLocation = details?.locations.find((location) => location.id === selectedId) ?? null;
  const selectedContext = selectedLocation ?? null;

  if (loading) {
    return (
      <AdminShell>
        <div style={{ padding: '28px', color: 'var(--color-text-muted)' }}>Loading hierarchy workspace…</div>
      </AdminShell>
    );
  }

  if (error || !details) {
    return (
      <AdminShell>
        <div style={{ padding: '28px', color: '#B91C1C' }}>{error ?? 'Hierarchy workspace unavailable.'}</div>
      </AdminShell>
    );
  }

  const addChildState = canAddChildUnderNode(
    selectedContext,
    details.warehouse.inventoryControlMode,
    activeTemplate,
    details.locations,
  );
  const nextAllowedLevels = getAllowedChildTemplateLevels(selectedContext, activeTemplate);

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100%', background: 'var(--color-surface-subtle)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <button type="button" onClick={() => navigate(WAREHOUSE_ROUTES.configuration(details.warehouse.id))} style={backBtn}>
                <ChevronLeft size={14} /> Back to Configuration
              </button>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginTop: '6px' }}>
                {details.warehouse.warehouseName} · Hierarchy Workspace
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Build, inspect, and govern location and BIN structure for this warehouse.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setHelpOpen(true)} style={toolbarBtn}>
                <HelpCircle size={14} /> Help
              </button>
              <button type="button" onClick={() => { setCreateParent(selectedContext); setCreateOpen(true); }} style={toolbarBtn} disabled={!addChildState.allowed}>
                <Plus size={14} /> Add child
              </button>
              <button type="button" onClick={() => { setBulkParent(selectedContext); setBulkOpen(true); }} style={toolbarBtn} disabled={!addChildState.allowed}>
                <Rows3 size={14} /> Bulk create
              </button>
              <button type="button" onClick={() => setDesignerOpen(true)} style={toolbarBtn}>
                <Settings2 size={14} /> Template designer
              </button>
              <button type="button" style={{ ...toolbarBtn, opacity: 0.55 }}>
                <Import size={14} /> Import
              </button>
              <button type="button" onClick={() => setExpandedIds(new Set(details.locations.map((location) => location.id)))} style={toolbarBtn}>
                Expand all
              </button>
              <button type="button" onClick={() => setExpandedIds(new Set())} style={toolbarBtn}>
                Collapse all
              </button>
              <button type="button" onClick={() => setShowIssuesOnly((value) => !value)} style={toolbarBtn}>
                {showIssuesOnly ? <EyeOff size={14} /> : <Eye size={14} />} Show issues
              </button>
            </div>
          </div>
          {!addChildState.allowed && selectedLocation && (
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E' }}>
              <AlertTriangle size={14} />
              <span style={{ fontSize: '12px' }}>{addChildState.reason}</span>
            </div>
          )}
          {addChildState.allowed && nextAllowedLevels.length > 0 && (
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
              Next child level{nextAllowedLevels.length > 1 ? 's' : ''}: {nextAllowedLevels.map((level) => level.levelCode).join(', ')}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? 'minmax(0, 1fr)' : '460px minmax(0, 1fr)', minHeight: 0, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '12px 12px 0', background: 'var(--color-surface)' }}>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${selectedId === null ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selectedId === null ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : 'var(--color-surface-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>Warehouse Root</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {details.warehouse.warehouseCode} · Add the first node directly under the warehouse when the active template allows it.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Allowed: {getAllowedChildTemplateLevels(null, activeTemplate).map((level) => level.levelCode).join(', ') || 'none'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <HierarchyTree
                nodes={treeNodes}
                selectedId={selectedId}
                expandedIds={expandedIds}
                searchValue={search}
                issueNodeIds={issueNodeIds}
                visibleNodeIds={showIssuesOnly ? issueNodeIds : undefined}
                onSearchChange={setSearch}
                onSelect={setSelectedId}
                onToggle={(id) => setExpandedIds((current) => {
                  const next = new Set(current);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })}
                onExpandAll={() => setExpandedIds(new Set(details.locations.map((location) => location.id)))}
                onCollapseAll={() => setExpandedIds(new Set())}
                onAddChild={(id) => {
                  const location = details.locations.find((item) => item.id === id) ?? null;
                  setSelectedId(id);
                  setCreateParent(location);
                  setCreateOpen(true);
                }}
                onBulkCreate={(id) => {
                  const location = details.locations.find((item) => item.id === id) ?? null;
                  setSelectedId(id);
                  setBulkParent(location);
                  setBulkOpen(true);
                }}
              />
            </div>
          </div>
          {!isNarrow && (
            <HierarchyNodeInspector
              warehouse={details.warehouse}
              location={selectedLocation}
              locations={details.locations}
              template={activeTemplate}
              childCount={details.locations.filter((location) => location.parentLocationId === selectedLocation?.id).length}
              allowedChildReason={nextAllowedLevels.length > 0 && selectedContext
                ? explainChildLevelAllowance(selectedContext, nextAllowedLevels[0].levelCode, activeTemplate).reason
                : selectedId === null && nextAllowedLevels.length > 0
                  ? explainChildLevelAllowance(null, nextAllowedLevels[0].levelCode, activeTemplate).reason
                  : addChildState.reason}
              onAddChild={() => {
                setCreateParent(selectedContext);
                setCreateOpen(true);
              }}
              onBulkCreate={() => {
                setBulkParent(selectedContext);
                setBulkOpen(true);
              }}
              onOpenLocations={() => navigate(WAREHOUSE_ROUTES.locations(details.warehouse.id))}
            />
          )}
        </div>

        {isNarrow && selectedLocation && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <button type="button" onClick={() => setInspectorOpen(true)} style={toolbarBtn}>
              Inspect selected node
            </button>
          </div>
        )}

        {isNarrow && inspectorOpen && selectedLocation && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1600, background: 'rgba(15, 23, 42, 0.28)', display: 'flex', justifyContent: 'flex-end' }}>
            <div role="dialog" aria-modal="true" aria-label="Hierarchy node details" style={{ width: 'min(520px, 100vw)', height: '100%', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Selected node details</div>
                <button type="button" onClick={() => setInspectorOpen(false)} style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <HierarchyNodeInspector
                  warehouse={details.warehouse}
                  location={selectedLocation}
                  locations={details.locations}
                  template={activeTemplate}
                  childCount={details.locations.filter((location) => location.parentLocationId === selectedLocation?.id).length}
                  allowedChildReason={nextAllowedLevels.length > 0
                    ? explainChildLevelAllowance(selectedContext, nextAllowedLevels[0].levelCode, activeTemplate).reason
                    : addChildState.reason}
                  onAddChild={() => {
                    setCreateParent(selectedContext);
                    setCreateOpen(true);
                  }}
                  onBulkCreate={() => {
                    setBulkParent(selectedContext);
                    setBulkOpen(true);
                  }}
                  onOpenLocations={() => navigate(WAREHOUSE_ROUTES.locations(details.warehouse.id))}
                />
              </div>
            </div>
          </div>
        )}

        {createOpen && (
          <LocationNodeCreateDrawer
            open={createOpen}
            warehouse={details.warehouse}
            parentLocation={createParent}
            template={activeTemplate}
            locations={details.locations}
            onClose={() => setCreateOpen(false)}
            onCreated={async (locationId) => {
              await load();
              setSelectedId(locationId);
              setToast('Hierarchy node created.');
              setCreateOpen(false);
            }}
          />
        )}

        {bulkOpen && (
          <LocationBulkCreateDrawer
            open={bulkOpen}
            warehouse={details.warehouse}
            parentLocation={bulkParent}
            template={activeTemplate}
            onClose={() => setBulkOpen(false)}
            onCommitted={async () => {
              setToast('Bulk location creation committed.');
              await load();
              setBulkOpen(false);
            }}
          />
        )}

        {designerOpen && (
          <HierarchyTemplateDesigner
            open={designerOpen}
            warehouseId={details.warehouse.id}
            templates={details.hierarchyTemplates}
            activeTemplate={activeTemplate}
            onClose={() => setDesignerOpen(false)}
            onSaved={async () => {
              await load();
            }}
          />
        )}

        {toast && (
          <div style={{ position: 'fixed', right: '20px', bottom: '20px', padding: '10px 14px', borderRadius: '10px', background: '#166534', color: 'white', fontSize: '12px' }}>
            {toast}
          </div>
        )}
        <HelpDrawer open={helpOpen} topic={getHelpTopic('warehouse-hierarchy')} onClose={() => setHelpOpen(false)} />
      </div>
    </AdminShell>
  );
};

const toolbarBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const backBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  border: 'none',
  background: 'none',
  color: 'var(--color-text-muted)',
  fontSize: '12px',
  cursor: 'pointer',
  padding: 0,
};

export default WarehouseHierarchyPage;
