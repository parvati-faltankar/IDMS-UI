export const UI_STUDIO_FLAG_KEY = 'VITE_UI_STUDIO_ENABLED';

export type UiStudioFlagValue = 'true' | 'false' | '1' | '0' | 'yes' | 'no' | undefined;

export function parseUiStudioFlag(value: UiStudioFlagValue): boolean {
  if (!value) {
    return true;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

export function isUiStudioEnabled(env: Record<string, string | undefined> = import.meta.env): boolean {
  return parseUiStudioFlag(env[UI_STUDIO_FLAG_KEY] as UiStudioFlagValue);
}
