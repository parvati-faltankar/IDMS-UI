import { describe, expect, it } from 'vitest';
import { paths } from '../../routes/routeConfig';
import { resolveUiStudioRouteAccess } from './routeGuard';

describe('ui-studio route guard', () => {
  it('redirects safely to home when feature flag is disabled', () => {
    const access = resolveUiStudioRouteAccess(false);

    expect(access.type).toBe('redirect');
    if (access.type === 'redirect') {
      expect(access.to).toBe(paths.home);
    }
  });

  it('enables hidden route when feature flag is enabled', () => {
    const access = resolveUiStudioRouteAccess(true);

    expect(access.type).toBe('enabled');
  });
});

