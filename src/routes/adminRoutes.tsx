import { Route } from 'react-router-dom';
import React from 'react';
import { paths } from './routeConfig';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard'));
const MasterListPage = React.lazy(() => import('../admin/MasterListPage'));
const MasterFormPage = React.lazy(() => import('../admin/MasterFormPage'));
const OrgMasterFormPage = React.lazy(() => import('../admin/masters/OrgMasterFormPage'));
const NumberingSettingsPage    = React.lazy(() => import('../admin/masters/NumberingSettingsPage'));
const PicklistMasterPage       = React.lazy(() => import('../admin/masters/PicklistMasterPage'));
const CodeGenerationPolicyPage = React.lazy(() => import('../admin/masters/CodeGenerationPolicyPage'));
const KycSetupPage             = React.lazy(() => import('../admin/masters/KycSetupPage'));

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

// ─── Customer Master ──────────────────────────────────────────────────────────
const CustomerListPage = React.lazy(() => import('../admin/masters/customer-master/pages/CustomerListPage'));
const CustomerFormPage = React.lazy(() => import('../admin/masters/customer-master/pages/CustomerFormPage'));

export function renderAdminRoutes() {
  return (
    <>
      <Route path={paths.adminHome} element={<AdminDashboard />} />

      {/* Numbering & Code Setup — direct settings page, no list */}
      <Route path="/admin/master/numbering-code-setup" element={<NumberingSettingsPage />} />

      {/* Picklist Master — multi-section settings page */}
      <Route path="/admin/master/picklist-master" element={<PicklistMasterPage />} />

      {/* Code Generation Policy — full CRUD master page */}
      <Route path="/admin/master/code-generation-policy" element={<CodeGenerationPolicyPage />} />

      {/* KYC Setup — full CRUD with country-grouped proof grid */}
      <Route path="/admin/master/kyc-setup" element={<KycSetupPage />} />

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
      <Route path="/admin/supplier-master/:id"    element={<SupplierFormPage />} />
      {/* ── Customer Master ─────────────────────────────────────────────── */}
      <Route path="/admin/master/customer-master"        element={<CustomerListPage />} />
      <Route path="/admin/master/customer-master/new"    element={<CustomerFormPage />} />
      <Route path="/admin/master/customer-master/:id"    element={<CustomerFormPage />} />
      <Route path="/admin/master/:masterKey" element={<MasterListPage />} />

      {/* Organisation Master — dedicated section-based form */}
      <Route path="/admin/master/organisation-master/new" element={<OrgMasterFormPage />} />
      <Route path="/admin/master/organisation-master/:recordId" element={<OrgMasterFormPage />} />

      {/* Generic form for all other masters */}
      <Route path="/admin/master/:masterKey/new" element={<MasterFormPage />} />
      <Route path="/admin/master/:masterKey/:recordId" element={<MasterFormPage />} />
    </>
  );
}
