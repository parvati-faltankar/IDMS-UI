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
