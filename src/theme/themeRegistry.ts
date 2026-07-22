export const THEME_STORAGE_KEY = 'app-theme';
export const DEFAULT_THEME_KEY = 'excellon';
export const APPEARANCE_STORAGE_KEY = 'app-theme-mode';
export const DEFAULT_APPEARANCE_MODE = 'light';
export const appearanceModes = ['light', 'dark'] as const;
export type AppearanceMode = (typeof appearanceModes)[number];

export interface BrandThemeDefinition {
  key: string;
  label: string;
  shortLabel: string;
  logoDataUrl?: string;
  brandScale: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  customTokens?: Record<string, string>;
}

const customThemeTokenNames = [
  '--font-family-base',
  '--font-weight-medium',
  '--font-weight-semibold',
  '--font-size-14',
  '--line-height-20',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--space-2',
  '--space-3',
  '--space-4',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-border-strong',
  '--color-surface',
  '--color-surface-subtle',
  '--color-surface-hover',
  '--color-surface-elevated',
  '--color-danger',
  '--color-topbar-bg',
  '--color-nav-hover',
  '--color-nav-active',
  '--color-brand-surface',
  '--color-brand-border',
  '--color-brand-text',
  '--shadow-dropdown',
];

const builtInThemeRegistry = {
  excellon: {
    key: 'excellon',
    label: 'Excellon',
    shortLabel: 'EX',
    brandScale: {
      50: '#fff7f0',
      100: '#ffe7d4',
      200: '#ffceab',
      300: '#ffb282',
      400: '#f78f57',
      500: '#eb6a2c',
      600: '#c44b1b',
      700: '#9e320e',
      800: '#781e05',
      900: '#521102',
    },
  },
} satisfies Record<string, BrandThemeDefinition>;

export const themeRegistry: Record<string, BrandThemeDefinition> = builtInThemeRegistry;

export type BuiltInThemeKey = keyof typeof builtInThemeRegistry;
export type ThemeKey = string;

export const themeKeys = Object.keys(themeRegistry) as BuiltInThemeKey[];

export function isBuiltInThemeKey(value: string | null | undefined): value is BuiltInThemeKey {
  return Boolean(value && value in themeRegistry);
}

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return Boolean(value);
}

export function resolveThemeKey(value: string | null | undefined): ThemeKey {
  return isThemeKey(value) ? value : DEFAULT_THEME_KEY;
}

export function isAppearanceMode(value: string | null | undefined): value is AppearanceMode {
  return Boolean(value && appearanceModes.includes(value as AppearanceMode));
}

export function resolveAppearanceMode(value: string | null | undefined): AppearanceMode {
  return isAppearanceMode(value) ? value : DEFAULT_APPEARANCE_MODE;
}

export function getStoredThemeKey(): ThemeKey {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_KEY;
  }

  try {
    const storedThemeKey = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedThemeKey || DEFAULT_THEME_KEY;
  } catch {
    return DEFAULT_THEME_KEY;
  }
}

export function getStoredAppearanceMode(): AppearanceMode {
  if (typeof window === 'undefined') {
    return DEFAULT_APPEARANCE_MODE;
  }

  try {
    return resolveAppearanceMode(window.localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE_MODE;
  }
}

export function persistThemeKey(themeKey: ThemeKey) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeKey);
  } catch {
    // Storage can be unavailable in private/browser-restricted contexts.
  }
}

export function persistAppearanceMode(appearanceMode: AppearanceMode) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearanceMode);
  } catch {
    // Storage can be unavailable in private/browser-restricted contexts.
  }
}

export function applyThemeKey(themeKey: ThemeKey, theme?: BrandThemeDefinition) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = themeKey;
  const selectedTheme = theme ?? (isBuiltInThemeKey(themeKey) ? themeRegistry[themeKey] : null);
  const rootStyle = document.documentElement.style;

  if (!selectedTheme) {
    return;
  }

  customThemeTokenNames.forEach((tokenName) => rootStyle.removeProperty(tokenName));

  Object.entries(selectedTheme.brandScale).forEach(([step, color]) => {
    rootStyle.setProperty(`--brand-${step}`, color);
  });
  rootStyle.setProperty('--color-primary', selectedTheme.brandScale[500]);
  rootStyle.setProperty('--color-primary-hover', selectedTheme.brandScale[600]);
  rootStyle.setProperty('--color-primary-active', selectedTheme.brandScale[700]);
  rootStyle.setProperty('--color-focus-ring', `color-mix(in srgb, ${selectedTheme.brandScale[500]} 22%, transparent)`);

  Object.entries(selectedTheme.customTokens ?? {}).forEach(([token, value]) => {
    rootStyle.setProperty(token, value);
  });
}

export function applyAppearanceMode(appearanceMode: AppearanceMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.appearance = appearanceMode;
  document.documentElement.style.colorScheme = appearanceMode;
}

export function initializeTheme(): ThemeKey {
  const themeKey = getStoredThemeKey();
  const appearanceMode = getStoredAppearanceMode();
  applyThemeKey(themeKey);
  applyAppearanceMode(appearanceMode);
  return themeKey;
}

export function getNextThemeKey(themeKey: ThemeKey): ThemeKey {
  const currentIndex = themeKeys.indexOf(themeKey as BuiltInThemeKey);
  return themeKeys[(currentIndex + 1) % themeKeys.length] ?? DEFAULT_THEME_KEY;
}
