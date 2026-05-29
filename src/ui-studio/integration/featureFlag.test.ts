import { describe, expect, it } from 'vitest';
import { isUiStudioEnabled, parseUiStudioFlag, UI_STUDIO_FLAG_KEY } from './featureFlag';

describe('ui-studio feature flag', () => {
  it('defaults to enabled when undefined', () => {
    expect(parseUiStudioFlag(undefined)).toBe(true);
  });

  it('enables only supported truthy values', () => {
    expect(parseUiStudioFlag('true')).toBe(true);
    expect(parseUiStudioFlag('1')).toBe(true);
    expect(parseUiStudioFlag('yes')).toBe(true);
    expect(parseUiStudioFlag('false')).toBe(false);
    expect(parseUiStudioFlag('0')).toBe(false);
    expect(parseUiStudioFlag('no')).toBe(false);
  });

  it('reads enabled state from build env contract key', () => {
    expect(isUiStudioEnabled({ [UI_STUDIO_FLAG_KEY]: 'true' })).toBe(true);
    expect(isUiStudioEnabled({ [UI_STUDIO_FLAG_KEY]: 'false' })).toBe(false);
  });
});
