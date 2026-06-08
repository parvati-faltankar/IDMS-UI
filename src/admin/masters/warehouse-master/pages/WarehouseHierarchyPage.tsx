import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Eye, EyeOff, HelpCircle, Import, Plus, Rows3, Settings2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { activateHierarchyTemplateMock } from '../services/warehouseMockAdapter';
import type { HierarchyNode, HierarchyTemplate, WarehouseDetails, WarehouseLocation } from '../types/warehouse.types';
import { WAREHOUSE_ROOT_LEVEL_CODE, buildHierarchyTree, explainChildLevelAllowance, getAllowedChildLocationTypes, getAllowedChildTemplateLevels } from '../utils/hierarchyUtils';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { HierarchyTree } from '../components/HierarchyTree';
import { HierarchyNodeInspector } from '../components/HierarchyNodeInspector';
import { LocationBulkCreateDrawer } from '../components/LocationBulkCreateDrawer';
import { LocationNodeCreateDrawer } from '../components/LocationNodeCreateDrawer';
import { HierarchyTemplateDesigner } from '../components/HierarchyTemplateDesigner';
import { QuickHierarchyWizard } from '../components/QuickHierarchyWizard';

const VIRTUAL_ROOT_NODE_ID = '__WAREHOUSE_ROOT__';

export interface HierarchySetupPanelModel {
  readonly inventoryControlMode: string;
  readonly activeTemplateName: string;
  readonly activeTemplateVersion: string;
  readonly templateStatus: string;
  readonly nodeCount: number;
  readonly leafEndpointCount: number;
  readonly inventoryAllowedEndpointCount: number;
  readonly hierarchySetupComplete: boolean;
  readonly nextRecommendedAction: string;
}

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

export function buildHierarchySetupPanelModel(
  details: WarehouseDetails,
  activeTemplate: HierarchyTemplate | undefined,
): HierarchySetupPanelModel {
  const nodeCount = details.locations.length;
  const leafEndpointCount = details.locations.filter((location) => location.profile.isLeafEndpoint).length;
  const inventoryAllowedEndpointCount = details.locations.filter((location) => location.profile.isLeafEndpoint && location.profile.inventoryAllowed).length;

  let nextRecommendedAction = 'Hierarchy has at least one valid inventory endpoint.';
  if (!activeTemplate) {
    nextRecommendedAction = 'No active template exists. Start by selecting or creating a hierarchy template.';
  } else if (nodeCount === 0) {
    nextRecommendedAction = 'Active template exists, but no locations have been created. Select the warehouse root and click Add Child or Bulk Create.';
  } else {
    const nextParent = details.locations.find((location) => !location.profile.isLeafEndpoint);
    const nextLevels = getAllowedChildTemplateLevels(nextParent ?? null, activeTemplate);
    if (nextParent && nextLevels.length > 0) {
      nextRecommendedAction = `${nextParent.profile.templateLevelCode ?? nextParent.locationCode} exists. Select ${nextParent.locationCode} and create the next allowed child level: ${nextLevels[0].levelName}.`;
    } else if (leafEndpointCount === 0) {
      nextRecommendedAction = 'Continue creating child levels until a leaf endpoint is reached.';
    } else if (inventoryAllowedEndpointCount === 0) {
      nextRecommendedAction = 'Leaf endpoint exists but not inventory-allowed yet. Activate the leaf location to make it eligible.';
    }
  }

  return {
    inventoryControlMode: details.warehouse.inventoryControlMode,
    activeTemplateName: activeTemplate?.templateName ?? 'None',
    activeTemplateVersion: activeTemplate ? `v${activeTemplate.currentVersion.versionNumber}` : '—',
    templateStatus: activeTemplate?.status ?? 'No Active Template',
    nodeCount,
    leafEndpointCount,
    inventoryAllowedEndpointCount,
    hierarchySetupComplete: Boolean(activeTemplate && inventoryAllowedEndpointCount > 0),
    nextRecommendedAction,
  };
}

export function buildHierarchyTreeWithWarehouseRoot(
  warehouseCode: string,
  warehouseName: string,
  treeNodes: HierarchyNode[],
): HierarchyNode[] {
  return [{
    id: VIRTUAL_ROOT_NODE_ID,
    locationId: undefined,
    locationCode: warehouseCode,
    locationName: warehouseName,
    levelCode: WAREHOUSE_ROOT_LEVEL_CODE,
    levelName: 'Warehouse',
    parentId: undefined,
    children: treeNodes,
    isLeaf: false,
    inventoryAllowed: false,
    status: 'Active',
    fullCode: warehouseCode,
  }];
}

const WarehouseHierarchyPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showTemplateStructure, setShowTemplateStructure] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 1100);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [quickWizardOpen, setQuickWizardOpen] = useState(false);

  async function load() {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const next = await warehouseMockAdapter.getWarehouse(warehouseId);
      setDetails(next);
      setSelectedId((current) => current ?? VIRTUAL_ROOT_NODE_ID);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('quickWizard') === '1') {
      setQuickWizardOpen(true);
    }
  }, [location.search]);

  const activeTemplate = useMemo(
    () => details?.hierarchyTemplates.find((template) => template.status === 'Active'),
    [details],
  );
  const issueNodeIds = useMemo(
    () => collectHierarchyIssueNodeIds(details?.locations ?? []),
    [details?.locations],
  );
  const treeNodes = useMemo(() => buildHierarchyTree(details?.locations ?? [], activeTemplate), [details?.locations, activeTemplate]);
  const treeNodesWithRoot = useMemo(
    () => details ? buildHierarchyTreeWithWarehouseRoot(details.warehouse.warehouseCode, details.warehouse.warehouseName, treeNodes) : [],
    [details, treeNodes],
  );
  const setupPanel = useMemo(() => details ? buildHierarchySetupPanelModel(details, activeTemplate) : null, [details, activeTemplate]);
  const selectedLocation = details?.locations.find((location) => location.id === selectedId) ?? null;
  const selectedIsRoot = selectedId === VIRTUAL_ROOT_NODE_ID;
  const selectedContext = selectedIsRoot ? null : selectedLocation;

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
  const selectedNodeAllowedChildReasons = nextAllowedLevels.map((level) => explainChildLevelAllowance(selectedContext, level.levelCode, activeTemplate).reason);

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
              <button type="button" onClick={() => setQuickWizardOpen(true)} style={toolbarBtn}>
                <Plus size={14} /> Create hierarchy quickly
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
          {setupPanel && (
            <div style={{ marginTop: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', background: 'var(--color-surface-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <Metric label="Inventory Control Mode" value={setupPanel.inventoryControlMode} />
                <Metric label="Active Template" value={`${setupPanel.activeTemplateName} ${setupPanel.activeTemplateVersion}`} />
                <Metric label="Template Status" value={setupPanel.templateStatus} />
                <Metric label="Hierarchy Setup" value={setupPanel.hierarchySetupComplete ? 'Complete' : 'In Progress'} />
                <Metric label="Nodes" value={setupPanel.nodeCount} />
                <Metric label="Leaf Endpoints" value={setupPanel.leafEndpointCount} />
                <Metric label="Inventory Allowed Endpoints" value={setupPanel.inventoryAllowedEndpointCount} />
                <Metric label="Selected Parent" value={selectedIsRoot ? details.warehouse.warehouseCode : selectedLocation?.locationCode ?? 'None'} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                Next recommended action: <strong style={{ color: 'var(--color-text)' }}>{setupPanel.nextRecommendedAction}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setQuickWizardOpen(true)} style={toolbarBtn}>Create Hierarchy Quickly</button>
                <button type="button" onClick={() => setDesignerOpen(true)} style={toolbarBtn}>Design Template</button>
                <button type="button" onClick={() => { setDesignerOpen(true); setToast('Use Apply Preset inside Template Designer.'); }} style={toolbarBtn}>Apply Preset</button>
                <button
                  type="button"
                  onClick={async () => {
                    const candidate = details.hierarchyTemplates.find((template) => template.status !== 'Active');
                    if (!candidate) {
                      setToast('No draft or inactive template available to activate.');
                      return;
                    }
                    await activateHierarchyTemplateMock(details.warehouse.id, candidate.id);
                    await load();
                    setToast(`Activated template ${candidate.templateCode}.`);
                  }}
                  style={toolbarBtn}
                >
                  Activate Template
                </button>
                <button type="button" onClick={() => setShowTemplateStructure((value) => !value)} style={toolbarBtn}>View Template Structure</button>
              </div>
              {!activeTemplate && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', fontSize: '12px' }}>
                  No active template exists. Start by selecting or creating a hierarchy template.
                </div>
              )}
              {activeTemplate && details.locations.length === 0 && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
                  Your template is ready. Create actual locations now.
                </div>
              )}
              {showTemplateStructure && activeTemplate && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>Template Structure</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {activeTemplate.levels
                      .slice()
                      .sort((left, right) => left.sequence - right.sequence)
                      .map((level) => `${level.levelName} (${level.levelCode})`)
                      .join(' -> ')}
                  </div>
                </div>
              )}
            </div>
          )}
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
            <div style={{ flex: 1, minHeight: 0 }}>
              <HierarchyTree
                nodes={treeNodesWithRoot}
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
                  const location = id === VIRTUAL_ROOT_NODE_ID ? null : details.locations.find((item) => item.id === id) ?? null;
                  setSelectedId(id);
                  setCreateParent(location);
                  setCreateOpen(true);
                }}
                onBulkCreate={(id) => {
                  const location = id === VIRTUAL_ROOT_NODE_ID ? null : details.locations.find((item) => item.id === id) ?? null;
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
              childCount={selectedIsRoot
                ? details.locations.filter((location) => !location.parentLocationId).length
                : details.locations.filter((location) => location.parentLocationId === selectedLocation?.id).length}
              rootSelected={selectedIsRoot}
              allowedChildLevels={nextAllowedLevels.map((level) => `${level.levelName} (${level.levelCode})`)}
              allowedChildReasons={selectedNodeAllowedChildReasons}
              childCreationAllowed={addChildState.allowed}
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
                  childCount={selectedIsRoot
                    ? details.locations.filter((location) => !location.parentLocationId).length
                    : details.locations.filter((location) => location.parentLocationId === selectedLocation?.id).length}
                  rootSelected={selectedIsRoot}
                  allowedChildLevels={nextAllowedLevels.map((level) => `${level.levelName} (${level.levelCode})`)}
                  allowedChildReasons={selectedNodeAllowedChildReasons}
                  childCreationAllowed={addChildState.allowed}
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
            hasTemplateDependencies={details.locations.length > 0}
            onClose={() => setDesignerOpen(false)}
            onSaved={async () => {
              await load();
            }}
          />
        )}

        {quickWizardOpen && (
          <QuickHierarchyWizard
            open={quickWizardOpen}
            warehouseId={details.warehouse.id}
            onClose={() => setQuickWizardOpen(false)}
            onCommitted={async (result) => {
              await load();
              if (result.firstCreatedLocationId) {
                setSelectedId(result.firstCreatedLocationId);
              }
              setToast(`Quick hierarchy created ${result.createdCount} location nodes.`);
              setQuickWizardOpen(false);
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

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '8px 10px', background: 'var(--color-surface)' }}>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

export default WarehouseHierarchyPage;
