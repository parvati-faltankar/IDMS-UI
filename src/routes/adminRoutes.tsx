import { Route } from 'react-router-dom';
import React from 'react';
import { paths } from './routeConfig';

const AdminDashboard = React.lazy(() => import('../admin/AdminDashboard'));
const MasterListPage = React.lazy(() => import('../admin/MasterListPage'));
const MasterFormPage = React.lazy(() => import('../admin/MasterFormPage'));
const OrgMasterFormPage = React.lazy(() => import('../admin/masters/OrgMasterFormPage'));
const NumberingSettingsPage = React.lazy(() => import('../admin/masters/NumberingSettingsPage'));
const PicklistMasterPage    = React.lazy(() => import('../admin/masters/PicklistMasterPage'));

export function renderAdminRoutes() {
  return (
    <>
      <Route path={paths.adminHome} element={<AdminDashboard />} />

      {/* Numbering & Code Setup — direct settings page, no list */}
      <Route path="/admin/master/numbering-code-setup" element={<NumberingSettingsPage />} />

      {/* Picklist Master — multi-section settings page */}
      <Route path="/admin/master/picklist-master" element={<PicklistMasterPage />} />

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
