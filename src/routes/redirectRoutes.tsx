import { Navigate, Route } from 'react-router-dom';
import { legacyRedirects, paths } from './routeConfig';

export function renderRedirectRoutes(locationSearch: string) {
  return (
    <>
      {legacyRedirects.map(({ path, preserveSearch, to }) => (
        <Route
          key={path}
          path={path}
          element={<Navigate to={preserveSearch ? `${to}${locationSearch}` : to} replace />}
        />
      ))}

      <Route path="/" element={<Navigate to={paths.home} replace />} />
      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </>
  );
}