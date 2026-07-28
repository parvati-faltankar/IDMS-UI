import { Route } from 'react-router-dom';
import React from 'react';
import { paths } from './routeConfig';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard'));
const MasterListPage = React.lazy(() => import('../admin/MasterListPage'));
const MasterFormPage = React.lazy(() => import('../admin/MasterFormPage'));
const OrgMasterFormPage = React.lazy(() => import('../admin/masters/OrgMasterFormPage'));
const NumberingSettingsPage    = React.lazy(() => import('../admin/masters/NumberingSettingsPage'));
const PicklistMasterPage       = React.lazy(() => import('../admin/masters/PicklistMasterPage'));
const PicklistFormPage         = React.lazy(() => import('../admin/masters/picklist-master/pages/PicklistFormPage'));
const CodeGenerationPolicyPage = React.lazy(() => import('../admin/masters/CodeGenerationPolicyPage'));
const KycSetupPage             = React.lazy(() => import('../admin/masters/KycSetupPage'));

// ─── Warehouse Master ─────────────────────────────────────────────────────────
const WarehouseListPage        = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseListPage'));
const WarehouseCreateWorkspace  = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseCreateWorkspace'));
const WarehouseSetupFlowPage    = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseSetupFlowPage'));
const WarehouseConfigurationPage = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseConfigurationPage'));
const WarehouseHierarchyPage    = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseHierarchyPage'));
const WarehouseLocationsPage    = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseLocationsPage'));
const WarehouseImportPage       = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseImportPage'));
const WarehouseAuditPage        = React.lazy(() => import('../admin/masters/warehouse-master/pages/WarehouseAuditPage'));

// ─── Area Master (Phase 1) ────────────────────────────────────────────────────
const AreaDashboardPage  = React.lazy(() => import('../admin/masters/area-master/pages/AreaDashboardPage'));
const AreaLevelListPage  = React.lazy(() => import('../admin/masters/area-master/pages/AreaLevelListPage'));
const AreaLevelFormPage  = React.lazy(() => import('../admin/masters/area-master/pages/AreaLevelFormPage'));
const AreaListPage       = React.lazy(() => import('../admin/masters/area-master/pages/AreaListPage'));
const AreaFormPage       = React.lazy(() => import('../admin/masters/area-master/pages/AreaFormPage'));
const AreaTreePage       = React.lazy(() => import('../admin/masters/area-master/pages/AreaTreePage'));
const AreaImportPage     = React.lazy(() => import('../admin/masters/area-master/pages/AreaImportPage'));

// ─── Supplier Master (Business Partner) ──────────────────────────────────────
const SupplierListPage = React.lazy(() => import('../admin/masters/supplier-master/pages/SupplierListPage'));
const SupplierFormPage = React.lazy(() => import('../admin/masters/supplier-master/pages/SupplierFormPage'));

// ─── Product Master ───────────────────────────────────────────────────────────
const ProductListPage = React.lazy(() => import('../admin/masters/product-master/pages/ProductListPage'));
const ProductFormPage = React.lazy(() => import('../admin/masters/product-master/pages/ProductFormPage'));

// ─── Customer Master ──────────────────────────────────────────────────────────
const CustomerListPage = React.lazy(() => import('../admin/masters/customer-master/pages/CustomerListPage'));
const CustomerFormPage = React.lazy(() => import('../admin/masters/customer-master/pages/CustomerFormPage'));

// ─── UOM Master ───────────────────────────────────────────────────────────────
const UomListPage = React.lazy(() => import('../admin/masters/uom-master/pages/UomListPage'));
const UomFormPage = React.lazy(() => import('../admin/masters/uom-master/pages/UomFormPage'));

// ─── Slot Master ──────────────────────────────────────────────────────────────
const SlotListPage = React.lazy(() => import('../admin/masters/slot-master/pages/SlotListPage'));
const SlotFormPage = React.lazy(() => import('../admin/masters/slot-master/pages/SlotFormPage'));
// ─── Service Type Master ───────────────────────────────────────────────────────
const ServiceTypeListPage = React.lazy(() => import('../admin/masters/service-type-master/pages/ServiceTypeListPage'));
const ServiceTypeFormPage = React.lazy(() => import('../admin/masters/service-type-master/pages/ServiceTypeFormPage'));
const ServiceCatalogueListPage = React.lazy(() => import('../admin/masters/service-labour-master/pages/ServiceCatalogueListPage'));
const ServiceLabourFormPage = React.lazy(() => import('../admin/masters/service-labour-master/pages/ServiceLabourFormPage'));

// ─── Engine Configuration ─────────────────────────────────────────────────────
const RuleEngineConfigList    = React.lazy(() => import('../admin/masters/engine-config/rule-sets/pages/RuleEngineConfigList'));
const RuleSetEditor           = React.lazy(() => import('../admin/masters/engine-config/rule-sets/pages/RuleSetEditor'));
const WorkflowConfigList      = React.lazy(() => import('../admin/masters/engine-config/workflows/pages/WorkflowConfigList'));
const WorkflowStepEditor      = React.lazy(() => import('../admin/masters/engine-config/workflows/pages/WorkflowStepEditor'));
const ServiceRegistryList     = React.lazy(() => import('../admin/masters/engine-config/service-registry/pages/ServiceRegistryList'));
const ServiceDefinitionEditor = React.lazy(() => import('../admin/masters/engine-config/service-registry/pages/ServiceDefinitionEditor'));
const ApprovalMatrixList      = React.lazy(() => import('../admin/masters/engine-config/approval-matrix/pages/ApprovalMatrixList'));
const ApprovalMatrixEditor    = React.lazy(() => import('../admin/masters/engine-config/approval-matrix/pages/ApprovalMatrixEditor'));

export function renderAdminRoutes() {
  return (
    <>
      <Route path={paths.adminHome} element={<AdminDashboard />} />
      <Route path={paths.adminMaster} element={<AdminDashboard />} />

      {/* Numbering & Code Setup — direct settings page, no list */}
      <Route path="/admin/master/numbering-code-setup" element={<NumberingSettingsPage />} />

      {/* Picklist Master — multi-section settings page */}
      <Route path="/admin/master/picklist-master/new" element={<PicklistFormPage />} />
      <Route path="/admin/master/picklist-master/:configId" element={<PicklistFormPage />} />
      <Route path="/admin/master/picklist-master" element={<PicklistMasterPage />} />

      {/* Code Generation Policy — full CRUD master page */}
      <Route path="/admin/master/code-generation-policy" element={<CodeGenerationPolicyPage />} />

      {/* KYC Setup — full CRUD with country-grouped proof grid */}
      <Route path="/admin/master/kyc-setup" element={<KycSetupPage />} />
      {/* ── Warehouse Master ──────────────────────────────────────────── */}
      <Route path="/admin/master/warehouse-master/new" element={<WarehouseCreateWorkspace />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/setup" element={<WarehouseSetupFlowPage />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/configuration" element={<WarehouseConfigurationPage />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/hierarchy" element={<WarehouseHierarchyPage />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/locations" element={<WarehouseLocationsPage />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/import" element={<WarehouseImportPage />} />
      <Route path="/admin/master/warehouse-master/:warehouseId/audit" element={<WarehouseAuditPage />} />
      <Route path="/admin/master/warehouse-master" element={<WarehouseListPage />} />
      {/* ── Area Master ─────────────────────────────────────────────────────── */}
      <Route path="/admin/area-dashboard"    element={<AreaDashboardPage />} />
      <Route path="/admin/area-levels"       element={<AreaLevelListPage />} />
      <Route path="/admin/area-levels/new"   element={<AreaLevelFormPage />} />
      <Route path="/admin/area-levels/:id"   element={<AreaLevelFormPage />} />
      <Route path="/admin/areas"             element={<AreaListPage />} />
      <Route path="/admin/areas/new"         element={<AreaFormPage />} />
      <Route path="/admin/areas/:id"         element={<AreaFormPage />} />
      <Route path="/admin/area-tree"         element={<AreaTreePage />} />
      <Route path="/admin/area-import"       element={<AreaImportPage />} />
      {/* ── Supplier Master ─────────────────────────────────────────────── */}
      <Route path="/admin/supplier-master"        element={<SupplierListPage />} />
      <Route path="/admin/supplier-master/new"    element={<SupplierFormPage />} />
      <Route path="/admin/supplier-master/:id"    element={<SupplierFormPage />} />      {/* ── Product Master ──────────────────────────────────────────── */}
      <Route path="/admin/product-master"        element={<ProductListPage />} />
      <Route path="/admin/product-master/new"    element={<ProductFormPage />} />
      <Route path="/admin/product-master/:id"    element={<ProductFormPage />} />      {/* ── Customer Master ─────────────────────────────────────────────── */}
      <Route path="/admin/master/customer-master"        element={<CustomerListPage />} />
      <Route path="/admin/master/customer-master/new"    element={<CustomerFormPage />} />
      <Route path="/admin/master/customer-master/:id"    element={<CustomerFormPage />} />      {/* ── UOM Master ──────────────────────────────────────────────── */}
      <Route path="/admin/master/unit-of-measurement"           element={<UomListPage />} />
      <Route path="/admin/master/unit-of-measurement/new"       element={<UomFormPage />} />
      <Route path="/admin/master/unit-of-measurement/:recordId" element={<UomFormPage />} />
      {/* ── Slot Master ─────────────────────────────────────────────── */}
      <Route path="/admin/master/slot-master"           element={<SlotListPage />} />
      <Route path="/admin/master/slot-master/new"       element={<SlotFormPage />} />
      <Route path="/admin/master/slot-master/:recordId" element={<SlotFormPage />} />
      {/* ── Service Type Master ─────────────────────────────────────── */}
      <Route path="/admin/master/service-type-master"           element={<ServiceTypeListPage />} />
      <Route path="/admin/master/service-type-master/new"       element={<ServiceTypeFormPage />} />
      <Route path="/admin/master/service-type-master/:recordId" element={<ServiceTypeFormPage />} />
      <Route path="/admin/master/service-domain"                element={<ServiceCatalogueListPage variant="domain" />} />
      <Route path="/admin/master/service-domain/new"            element={<ServiceLabourFormPage entryVariant="domain" />} />
      <Route path="/admin/master/service-domain/:recordId"      element={<ServiceLabourFormPage entryVariant="domain" />} />
      <Route path="/admin/master/service-family"                element={<ServiceCatalogueListPage variant="family" />} />
      <Route path="/admin/master/service-family/new"            element={<ServiceLabourFormPage entryVariant="family" />} />
      <Route path="/admin/master/service-family/:recordId"      element={<ServiceLabourFormPage entryVariant="family" />} />
      <Route path="/admin/master/labour-master"                 element={<ServiceCatalogueListPage variant="labour" />} />
      <Route path="/admin/master/labour-master/new"             element={<ServiceLabourFormPage entryVariant="labour" />} />
      <Route path="/admin/master/labour-master/:recordId"       element={<ServiceLabourFormPage entryVariant="labour" />} />
      <Route path="/admin/master/service-labour"                element={<ServiceCatalogueListPage variant="labour" />} />
      <Route path="/admin/master/service-labour/new"            element={<ServiceLabourFormPage entryVariant="labour" />} />
      <Route path="/admin/master/service-labour/:recordId"      element={<ServiceLabourFormPage entryVariant="labour" />} />
      <Route path="/admin/master/:masterKey" element={<MasterListPage />} />

      {/* Organisation Master — dedicated section-based form */}
      <Route path="/admin/master/organisation-master/new" element={<OrgMasterFormPage />} />
      <Route path="/admin/master/organisation-master/:recordId" element={<OrgMasterFormPage />} />

      {/* Generic form for all other masters */}
      <Route path="/admin/master/:masterKey/new" element={<MasterFormPage />} />
      <Route path="/admin/master/:masterKey/:recordId" element={<MasterFormPage />} />

      {/* ── Engine Configuration ─────────────────────────────────────── */}
      <Route path="/admin/engine-config/rule-sets"                    element={<RuleEngineConfigList />} />
      <Route path="/admin/engine-config/rule-sets/new"                element={<RuleSetEditor />} />
      <Route path="/admin/engine-config/rule-sets/:ruleSetCode"       element={<RuleSetEditor />} />
      <Route path="/admin/engine-config/workflows"                    element={<WorkflowConfigList />} />
      <Route path="/admin/engine-config/workflows/new"                element={<WorkflowStepEditor />} />
      <Route path="/admin/engine-config/workflows/:workflowCode"      element={<WorkflowStepEditor />} />
      <Route path="/admin/engine-config/services"                     element={<ServiceRegistryList />} />
      <Route path="/admin/engine-config/services/new"                 element={<ServiceDefinitionEditor />} />
      <Route path="/admin/engine-config/services/:serviceCode"        element={<ServiceDefinitionEditor />} />
      <Route path="/admin/engine-config/approval-matrix"             element={<ApprovalMatrixList />} />
      <Route path="/admin/engine-config/approval-matrix/new"         element={<ApprovalMatrixEditor />} />
      <Route path="/admin/engine-config/approval-matrix/:entryId"    element={<ApprovalMatrixEditor />} />
    </>
  );
}
