import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { paths } from './routeConfig';
import { renderUiStudioRoutes } from './uiStudioRoutes';

describe('ui-studio route registration', () => {
  it('registers wildcard redirect when feature is disabled', () => {
    const element = renderUiStudioRoutes(false);
    expect(isValidElement(element)).toBe(true);

    const fragmentChildren = (element as { props?: { children?: unknown[] | unknown } }).props?.children;
    const firstRoute = Array.isArray(fragmentChildren) ? fragmentChildren[0] : fragmentChildren;
    expect(firstRoute?.props?.path).toBe(paths.uiStudioWildcard);
  });

  it('registers hidden root and builder routes when feature is enabled', () => {
    const element = renderUiStudioRoutes(true);
    expect(isValidElement(element)).toBe(true);

    const fragmentChildren = (element as { props?: { children?: unknown[] } }).props?.children;
    const routes = Array.isArray(fragmentChildren) ? fragmentChildren : [];
    const pathsRegistered = routes.map((route) => route.props?.path);

    expect(pathsRegistered).toContain(paths.uiStudioRoot);
    expect(pathsRegistered).toContain(paths.uiStudioBuilder);
  });
});
