import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Eye, EyeOff, HelpCircle, Plus, Rows3, Settings2, X } from 'lucide-react';
import AdminShell from '../../../AdminShell';
import { AdminListToolbarButton } from '../../../../experience/components/AdminListPageShell';
import { HelpDrawer } from '../../../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../../../experience/help/helpTopics';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import type { HierarchyNode, HierarchyTemplate, WarehouseDetails, WarehouseLocation } from '../types/warehouse.types';
import { WAREHOUSE_ROOT_LEVEL_CODE, buildHierarchyTree, explainChildLevelAllowance, getAllowedChildLocationTypes, getAllowedChildTemplateLevels } from '../utils/hierarchyUtils';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { HierarchyTree } from '../components/HierarchyTree';
import { HierarchyNodeInspector } from '../components/HierarchyNodeInspector';
import { LocationBulkCreateDrawer } from '../components/LocationBulkCreateDrawer';
import { LocationNodeCreateDrawer } from '../components/LocationNodeCreateDrawer';
import { HierarchyTemplateDesigner } from '../components/HierarchyTemplateDesigner';
import { QuickHierarchyWizard } from '../components/QuickHierarchyWizard';
import { deriveCapacityStatus, deriveHierarchyCompletionModel } from '../utils/warehouseDerivations';

const VIRTUAL_ROOT_NODE_ID = '__WAREHOUSE_ROOT__';

export interface HierarchySetupPanelModel {
  readonly setupStatus: 'Complete' | 'Incomplete' | 'Blocked' | 'Warning';
  readonly inventoryControlMode: string;
  readonly activeTemplateName: string;
  readonly activeTemplateVersion: string;
  readonly templateStatus: string;
  readonly nodeCount: number;
  readonly leafEndpointCount: number;
  readonly inventoryEndpointEligibleCount: number;
  readonly inventoryAllowedEndpointCount: number;
  readonly issuesCount: number;
  readonly warningsCount: number;
  readonly hierarchySetupComplete: boolean;
  readonly nextRecommendedAction: string;
  readonly checklist: Array<{
    readonly key: string;
    readonly label: string;
    readonly status: string;
    readonly severity: string;
    readonly affectedCount: number;
  }>;
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
  return collectHierarchyIssueNodeIdsWithCapacity(locations);
}

export function collectHierarchyIssueNodeIdsWithCapacity(
  locations: WarehouseLocation[],
  warehouse?: WarehouseDetails['warehouse'],
  activeTemplate?: HierarchyTemplate,
): Set<string> {
  return new Set(
    locations
      .filter((location) => {
        if (
          location.status !== 'Active' ||
          !location.profile.inventoryAllowed ||
          location.putawayBlocked ||
          location.pickingBlocked
        ) {
          return true;
        }
        if (!warehouse) return false;
        const capacityStatus = deriveCapacityStatus(location, locations, warehouse, activeTemplate);
        return capacityStatus === 'Exceeded' || capacityStatus === 'RequiresApproval' || capacityStatus === 'NotConfigured';
      })
      .map((location) => location.id),
  );
}

export function buildHierarchySetupPanelModel(
  details: WarehouseDetails,
  activeTemplate: HierarchyTemplate | undefined,
): HierarchySetupPanelModel {
  const completion = deriveHierarchyCompletionModel(
    details.warehouse,
    details.locations,
    details.hierarchyTemplates,
  );

  return {
    setupStatus: completion.status,
    inventoryControlMode: details.warehouse.inventoryControlMode,
    activeTemplateName: activeTemplate?.templateName ?? 'None',
    activeTemplateVersion: activeTemplate ? `v${activeTemplate.currentVersion.versionNumber}` : '—',
    templateStatus: activeTemplate?.status ?? 'No Active Template',
    nodeCount: completion.actualNodeCount,
    leafEndpointCount: completion.leafEndpointCount,
    inventoryEndpointEligibleCount: completion.inventoryEndpointEligibleCount,
    inventoryAllowedEndpointCount: completion.inventoryAllowedCount,
    issuesCount: completion.blockers.length,
    warningsCount: completion.warnings.length,
    hierarchySetupComplete: completion.status === 'Complete',
    nextRecommendedAction: completion.nextRecommendedAction,
    checklist: completion.checklist.map((item) => ({
      key: item.key,
      label: item.label,
      status: item.status,
      severity: item.severity,
      affectedCount: item.affectedCount,
    })),
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

export function shouldShowQuickWizardEmptyStateCta(locationCount: number): boolean {
  return locationCount === 0;
}

export function resolveQuickWizardPermission(disableByEnvFlag: boolean): {
  canManageHierarchy: boolean;
  reason?: string;
} {
  if (disableByEnvFlag) {
    return {
      canManageHierarchy: false,
      reason: 'Hierarchy management is disabled by permission simulation flag.',
    };
  }
  return { canManageHierarchy: true };
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
  const hasHierarchyNodes = (details?.locations.length ?? 0) > 0;
  const showGuidedSetup = Boolean(details) && !activeTemplate && !hasHierarchyNodes;
  const issueNodeIds = useMemo(
    () => details
      ? collectHierarchyIssueNodeIdsWithCapacity(details.locations, details.warehouse, activeTemplate)
      : collectHierarchyIssueNodeIds([]),
    [details, activeTemplate],
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
  const permission = resolveQuickWizardPermission(
    typeof window !== 'undefined' && window.localStorage.getItem('IDMS_DISABLE_HIERARCHY_MANAGE') === '1',
  );
  const compactSetupItems: Array<{
    label: string;
    value: React.ReactNode;
    tone?: 'default' | 'warning' | 'success' | 'muted';
  }> = [
    {
      label: 'Template',
      value: activeTemplate ? `${activeTemplate.templateCode} ${setupPanel?.activeTemplateVersion ?? ''}`.trim() : 'Missing',
      tone: activeTemplate ? 'default' : 'warning',
    },
    {
      label: 'Hierarchy',
      value: hasHierarchyNodes ? 'In Progress' : 'Not Started',
      tone: hasHierarchyNodes ? 'default' : 'muted',
    },
    {
      label: 'Issues',
      value: `${setupPanel?.issuesCount ?? 0} blocker${(setupPanel?.issuesCount ?? 0) === 1 ? '' : 's'}`,
      tone: (setupPanel?.issuesCount ?? 0) > 0 ? 'warning' : 'success',
    },
  ];

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100%', background: 'var(--color-surface-subtle)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <AdminListToolbarButton
                label="Back to Configuration"
                icon={<ChevronLeft size={14} />}
                onClick={() => navigate(WAREHOUSE_ROUTES.configuration(details.warehouse.id))}
              />
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginTop: '6px' }}>
                {details.warehouse.warehouseName} · Hierarchy Workspace
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Build, inspect, and govern location and BIN structure for this warehouse.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <AdminListToolbarButton
                label="Help"
                icon={<HelpCircle size={14} />}
                onClick={() => setHelpOpen(true)}
              />
              <AdminListToolbarButton
                label="Add child"
                icon={<Plus size={14} />}
                onClick={() => { setCreateParent(selectedContext); setCreateOpen(true); }}
                disabled={!addChildState.allowed}
              />
              <AdminListToolbarButton
                label="Bulk create"
                icon={<Rows3 size={14} />}
                onClick={() => { setBulkParent(selectedContext); setBulkOpen(true); }}
                disabled={!addChildState.allowed}
              />
              <AdminListToolbarButton
                label="Structure rules"
                icon={<Settings2 size={14} />}
                onClick={() => setDesignerOpen(true)}
              />
              <AdminListToolbarButton
                label="Show issues"
                icon={showIssuesOnly ? <EyeOff size={14} /> : <Eye size={14} />}
                onClick={() => setShowIssuesOnly((value) => !value)}
                active={showIssuesOnly}
              />
            </div>
          </div>
          {showGuidedSetup ? (
            <div style={{ marginTop: '14px', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '18px', background: 'var(--color-surface)' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                Start by choosing how you want to build this hierarchy
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                First activate a structure template, then create the first level under the warehouse root.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                <button type="button" onClick={() => setQuickWizardOpen(true)} style={setupCardBtn} disabled={!permission.canManageHierarchy}>
                  <div style={setupCardTitle}>Use Recommended Structure</div>
                  <div style={setupCardText}>Launch guided setup to create a template and start the first branch quickly.</div>
                </button>
                <button type="button" onClick={() => setDesignerOpen(true)} style={setupCardBtn}>
                  <div style={setupCardTitle}>Create Structure Template</div>
                  <div style={setupCardText}>Define your own hierarchy levels and activate the template before creating nodes.</div>
                </button>
                <button type="button" onClick={() => setDesignerOpen(true)} style={setupCardBtn}>
                  <div style={setupCardTitle}>Copy Existing Structure</div>
                  <div style={setupCardText}>Use an existing structure as the starting point, then activate it for this warehouse.</div>
                </button>
              </div>
              {!permission.canManageHierarchy && (
                <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', fontSize: '12px' }}>
                  {permission.reason}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {compactSetupItems.map((item) => (
                  <CompactSetupPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
              <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Next step: <strong style={{ color: 'var(--color-text)' }}>{setupPanel?.nextRecommendedAction ?? 'Select a node and continue building the hierarchy.'}</strong>
              </div>
              {activeTemplate && !hasHierarchyNodes && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
                  Your structure is ready. Create the first level under the warehouse root to begin building the tree.
                </div>
              )}
              {!permission.canManageHierarchy && (
                <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: '#FEF3C7', color: '#92400E', fontSize: '12px' }}>
                  {permission.reason}
                </div>
              )}
            </>
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
                treeMode="Operational View"
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
            <AdminListToolbarButton
              label="Inspect selected node"
              onClick={() => setInspectorOpen(true)}
            />
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
            permission={permission}
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

function CompactSetupPill({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'warning' | 'success' | 'muted';
}) {
  const toneStyle =
    tone === 'warning'
      ? { background: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D' }
      : tone === 'success'
        ? { background: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }
        : tone === 'muted'
          ? { background: '#F8FAFC', color: '#475569', borderColor: 'var(--color-border)' }
          : { background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' };

  return (
    <div style={{ border: `1px solid ${toneStyle.borderColor}`, borderRadius: '999px', padding: '8px 12px', background: toneStyle.background, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: toneStyle.color }}>{value}</span>
    </div>
  );
}

const setupCardBtn: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface-subtle)',
  cursor: 'pointer',
};

const setupCardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--color-text)',
  marginBottom: '6px',
};

const setupCardText: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
};

export default WarehouseHierarchyPage;
