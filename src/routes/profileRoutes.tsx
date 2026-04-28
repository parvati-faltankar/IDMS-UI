import { Navigate, Route } from 'react-router-dom';
import { paths } from './routeConfig';
import { BusinessSettings, ExcellonBrandGuidelinesPreview, FormLayoutEditor, FormLayoutSettings, ThemeBuilder } from './routeScreens';
import type { SharedRouteContext } from './routeTypes';

export function renderProfileRoutes({ locationSearch, navigateTo, routeQuery }: SharedRouteContext) {
  return (
    <>
      <Route path={paths.brandGuidelines} element={<ExcellonBrandGuidelinesPreview />} />

      <Route
        path={paths.businessSettings}
        element={<BusinessSettings onBack={() => navigateTo(paths.purchaseRequisitionList)} />}
      />

      <Route path={paths.themeBuilder} element={<ThemeBuilder onBack={() => navigateTo(paths.purchaseRequisitionList)} />} />

      <Route
        path={paths.formLayoutSettings}
        element={
          <FormLayoutSettings
            onEditFormLayout={(formId) => {
              if (formId === 'purchase-requisition-create') {
                navigateTo(paths.purchaseRequisitionCreate, { config: 'form-layout' });
                return;
              }

              navigateTo(paths.formLayoutEditor, { formId });
            }}
            onNavigateToPurchaseRequisitionList={() => navigateTo(paths.purchaseRequisitionList)}
          />
        }
      />

      <Route
        path={paths.formLayoutEditor}
        element={
          <FormLayoutEditor
            key={routeQuery.get('formId') ?? 'form-layout-editor'}
            formId={routeQuery.get('formId')}
            onBack={() => navigateTo(paths.formLayoutSettings)}
          />
        }
      />

      <Route
        path="/profile/form-layout-editor"
        element={<Navigate to={`${paths.formLayoutEditor}${locationSearch}`} replace />}
      />
    </>
  );
}
