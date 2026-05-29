import { Navigate, Route } from 'react-router-dom';
import UiStudioEntryPage from '../ui-studio/integration/UiStudioEntryPage';
import UiStudioBuilderPage from '../ui-studio/builder/UiStudioBuilderPage';
import { resolveUiStudioRouteAccess } from '../ui-studio/integration/routeGuard';
import { paths } from './routeConfig';

export function renderUiStudioRoutes(enabled: boolean) {
  const access = resolveUiStudioRouteAccess(enabled);

  if (access.type === 'redirect') {
    return (
      <>
        <Route path={paths.uiStudioWildcard} element={<Navigate to={access.to} replace />} />
      </>
    );
  }

  return (
    <>
      <Route path={paths.uiStudioRoot} element={<UiStudioEntryPage />} />
      <Route path={paths.uiStudioBuilder} element={<UiStudioBuilderPage />} />
    </>
  );
}
