import { paths } from '../../routes/routeConfig';

export type UiStudioRouteAccess =
  | { type: 'enabled' }
  | {
      type: 'redirect';
      to: string;
    };

export function resolveUiStudioRouteAccess(enabled: boolean): UiStudioRouteAccess {
  if (enabled) {
    return { type: 'enabled' };
  }

  return { type: 'redirect', to: paths.home };
}

