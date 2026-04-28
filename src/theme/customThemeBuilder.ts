import { DEFAULT_THEME_KEY, THEME_STORAGE_KEY, type BrandThemeDefinition } from './themeRegistry';

export const CUSTOM_THEMES_STORAGE_KEY = 'theme-builder-themes:v1';
export const CUSTOM_THEMES_UPDATED_EVENT = 'theme-builder-themes-updated';

export type ThemeBuilderStatus = 'draft' | 'published' | 'deactivated';

export interface ThemeBuilderColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  headerBackground: string;
  sidebarBackground: string;
  buttonBackground: string;
  link: string;
}

export interface ThemeBuilderTypography {
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: string;
  fontWeight: string;
  lineHeight: string;
  buttonTextTransform: 'none' | 'uppercase';
}

export interface ThemeBuilderLayout {
  borderRadius: string;
  buttonRadius: string;
  cardRadius: string;
  inputRadius: string;
  spacingScale: string;
  shadowStyle: 'soft' | 'medium' | 'strong';
}

export interface ThemeBuilderTheme {
  id: string;
  key: string;
  name: string;
  shortLabel: string;
  description: string;
  status: ThemeBuilderStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  logoDataUrl?: string;
  logoName?: string;
  colors: ThemeBuilderColors;
  typography: ThemeBuilderTypography;
  layout: ThemeBuilderLayout;
}

export const defaultThemeBuilderColors: ThemeBuilderColors = {
  primary: '#1c1977',
  secondary: '#4f46e5',
  accent: '#0f766e',
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  border: '#d9dee5',
  error: '#d14343',
  warning: '#d97706',
  success: '#15803d',
  info: '#2563eb',
  headerBackground: '#1c1977',
  sidebarBackground: '#ffffff',
  buttonBackground: '#1c1977',
  link: '#1c1977',
};

export const defaultThemeBuilderTypography: ThemeBuilderTypography = {
  fontFamily: '"Noto Sans", sans-serif',
  headingFontFamily: '"Noto Sans", sans-serif',
  baseFontSize: '14',
  fontWeight: '500',
  lineHeight: '20',
  buttonTextTransform: 'none',
};

export const defaultThemeBuilderLayout: ThemeBuilderLayout = {
  borderRadius: '8',
  buttonRadius: '8',
  cardRadius: '8',
  inputRadius: '8',
  spacingScale: '4',
  shadowStyle: 'medium',
};

const hexPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const allowedFonts = [
  '"Noto Sans", sans-serif',
  'Arial, sans-serif',
  'Inter, "Noto Sans", sans-serif',
  'Georgia, serif',
  'Verdana, sans-serif',
];

export function isValidHexColor(value: string) {
  return hexPattern.test(value.trim());
}

export function getAllowedThemeFonts() {
  return allowedFonts;
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === 'string' && isValidHexColor(value) ? value : fallback;
}

function normalizeNumberString(value: unknown, fallback: string, min: number, max: number) {
  const numericValue = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN;
  return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max ? String(numericValue) : fallback;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `theme-${Date.now()}`;
}

export function createThemeDraft(name = ''): ThemeBuilderTheme {
  const now = new Date().toISOString();
  const baseName = name.trim() || 'Untitled theme';

  return {
    id: `theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: `custom-${slugify(baseName)}`,
    name: baseName,
    shortLabel: baseName.slice(0, 2).toUpperCase(),
    description: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: 'Alex Kumar',
    colors: { ...defaultThemeBuilderColors },
    typography: { ...defaultThemeBuilderTypography },
    layout: { ...defaultThemeBuilderLayout },
  };
}

export function sanitizeThemeBuilderTheme(theme: Partial<ThemeBuilderTheme>): ThemeBuilderTheme {
  const fallback = createThemeDraft(theme.name);
  const colors = (theme.colors ?? {}) as Partial<ThemeBuilderColors>;
  const typography = (theme.typography ?? {}) as Partial<ThemeBuilderTypography>;
  const layout = (theme.layout ?? {}) as Partial<ThemeBuilderLayout>;
  const name = typeof theme.name === 'string' && theme.name.trim() ? theme.name.trim() : fallback.name;

  return {
    ...fallback,
    id: typeof theme.id === 'string' && theme.id ? theme.id : fallback.id,
    key: typeof theme.key === 'string' && theme.key ? theme.key : `custom-${slugify(name)}`,
    name,
    shortLabel:
      typeof theme.shortLabel === 'string' && theme.shortLabel.trim()
        ? theme.shortLabel.trim().slice(0, 4).toUpperCase()
        : name.slice(0, 2).toUpperCase(),
    description: typeof theme.description === 'string' ? theme.description : '',
    status: theme.status === 'published' || theme.status === 'deactivated' ? theme.status : 'draft',
    createdAt: typeof theme.createdAt === 'string' ? theme.createdAt : fallback.createdAt,
    updatedAt: typeof theme.updatedAt === 'string' ? theme.updatedAt : fallback.updatedAt,
    createdBy: typeof theme.createdBy === 'string' && theme.createdBy ? theme.createdBy : 'Alex Kumar',
    logoDataUrl: typeof theme.logoDataUrl === 'string' ? theme.logoDataUrl : undefined,
    logoName: typeof theme.logoName === 'string' ? theme.logoName : undefined,
    colors: {
      primary: normalizeColor(colors.primary, defaultThemeBuilderColors.primary),
      secondary: normalizeColor(colors.secondary, defaultThemeBuilderColors.secondary),
      accent: normalizeColor(colors.accent, defaultThemeBuilderColors.accent),
      background: normalizeColor(colors.background, defaultThemeBuilderColors.background),
      surface: normalizeColor(colors.surface, defaultThemeBuilderColors.surface),
      textPrimary: normalizeColor(colors.textPrimary, defaultThemeBuilderColors.textPrimary),
      textSecondary: normalizeColor(colors.textSecondary, defaultThemeBuilderColors.textSecondary),
      border: normalizeColor(colors.border, defaultThemeBuilderColors.border),
      error: normalizeColor(colors.error, defaultThemeBuilderColors.error),
      warning: normalizeColor(colors.warning, defaultThemeBuilderColors.warning),
      success: normalizeColor(colors.success, defaultThemeBuilderColors.success),
      info: normalizeColor(colors.info, defaultThemeBuilderColors.info),
      headerBackground: normalizeColor(colors.headerBackground, defaultThemeBuilderColors.headerBackground),
      sidebarBackground: normalizeColor(colors.sidebarBackground, defaultThemeBuilderColors.sidebarBackground),
      buttonBackground: normalizeColor(colors.buttonBackground, defaultThemeBuilderColors.buttonBackground),
      link: normalizeColor(colors.link, defaultThemeBuilderColors.link),
    },
    typography: {
      fontFamily:
        typeof typography.fontFamily === 'string' && allowedFonts.includes(typography.fontFamily)
          ? typography.fontFamily
          : defaultThemeBuilderTypography.fontFamily,
      headingFontFamily:
        typeof typography.headingFontFamily === 'string' && allowedFonts.includes(typography.headingFontFamily)
          ? typography.headingFontFamily
          : defaultThemeBuilderTypography.headingFontFamily,
      baseFontSize: normalizeNumberString(typography.baseFontSize, defaultThemeBuilderTypography.baseFontSize, 12, 18),
      fontWeight: normalizeNumberString(typography.fontWeight, defaultThemeBuilderTypography.fontWeight, 400, 700),
      lineHeight: normalizeNumberString(typography.lineHeight, defaultThemeBuilderTypography.lineHeight, 16, 28),
      buttonTextTransform: typography.buttonTextTransform === 'uppercase' ? 'uppercase' : 'none',
    },
    layout: {
      borderRadius: normalizeNumberString(layout.borderRadius, defaultThemeBuilderLayout.borderRadius, 0, 24),
      buttonRadius: normalizeNumberString(layout.buttonRadius, defaultThemeBuilderLayout.buttonRadius, 0, 24),
      cardRadius: normalizeNumberString(layout.cardRadius, defaultThemeBuilderLayout.cardRadius, 0, 24),
      inputRadius: normalizeNumberString(layout.inputRadius, defaultThemeBuilderLayout.inputRadius, 0, 24),
      spacingScale: normalizeNumberString(layout.spacingScale, defaultThemeBuilderLayout.spacingScale, 2, 8),
      shadowStyle:
        layout.shadowStyle === 'soft' || layout.shadowStyle === 'strong' ? layout.shadowStyle : defaultThemeBuilderLayout.shadowStyle,
    },
  };
}

export function loadThemeBuilderThemes(): ThemeBuilderTheme[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    const parsedValue = rawValue ? (JSON.parse(rawValue) as Partial<ThemeBuilderTheme>[]) : [];
    return Array.isArray(parsedValue) ? parsedValue.map(sanitizeThemeBuilderTheme) : [];
  } catch {
    return [];
  }
}

export function saveThemeBuilderThemes(themes: ThemeBuilderTheme[]) {
  const sanitizedThemes = themes.map(sanitizeThemeBuilderTheme);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(sanitizedThemes));
    window.dispatchEvent(new CustomEvent(CUSTOM_THEMES_UPDATED_EVENT, { detail: sanitizedThemes }));
  }

  return sanitizedThemes;
}

export function upsertThemeBuilderTheme(theme: ThemeBuilderTheme) {
  const sanitizedTheme = sanitizeThemeBuilderTheme({ ...theme, updatedAt: new Date().toISOString() });
  const themes = loadThemeBuilderThemes();
  const index = themes.findIndex((item) => item.id === sanitizedTheme.id);
  const nextThemes = index >= 0 ? themes.map((item) => (item.id === sanitizedTheme.id ? sanitizedTheme : item)) : [...themes, sanitizedTheme];

  return saveThemeBuilderThemes(nextThemes);
}

export function getPublishedThemeBuilderThemes() {
  return loadThemeBuilderThemes().filter((theme) => theme.status === 'published');
}

export function isCustomThemeKey(themeKey: string | null | undefined) {
  return Boolean(themeKey?.startsWith('custom-'));
}

export function getCustomThemeByKey(themeKey: string | null | undefined) {
  if (!themeKey) {
    return null;
  }

  return getPublishedThemeBuilderThemes().find((theme) => theme.key === themeKey) ?? null;
}

export function toBrandThemeDefinition(theme: ThemeBuilderTheme): BrandThemeDefinition {
  return {
    key: theme.key,
    label: theme.name,
    shortLabel: theme.shortLabel,
    logoDataUrl: theme.logoDataUrl,
    brandScale: {
      50: theme.colors.background,
      100: theme.colors.surface,
      200: theme.colors.border,
      300: theme.colors.accent,
      400: theme.colors.secondary,
      500: theme.colors.primary,
      600: theme.colors.buttonBackground,
      700: theme.colors.link,
      800: theme.colors.headerBackground,
      900: theme.colors.textPrimary,
    },
    customTokens: {
      '--font-family-base': theme.typography.fontFamily,
      '--font-weight-medium': theme.typography.fontWeight,
      '--font-weight-semibold': String(Math.min(Number(theme.typography.fontWeight) + 100, 700)),
      '--font-size-14': `${theme.typography.baseFontSize}px`,
      '--line-height-20': `${theme.typography.lineHeight}px`,
      '--radius-sm': `${theme.layout.inputRadius}px`,
      '--radius-md': `${theme.layout.buttonRadius}px`,
      '--radius-lg': `${theme.layout.cardRadius}px`,
      '--space-2': `${Number(theme.layout.spacingScale) * 2}px`,
      '--space-3': `${Number(theme.layout.spacingScale) * 3}px`,
      '--space-4': `${Number(theme.layout.spacingScale) * 4}px`,
      '--color-text': theme.colors.textPrimary,
      '--color-text-muted': theme.colors.textSecondary,
      '--color-border': theme.colors.border,
      '--color-border-strong': theme.colors.border,
      '--color-surface': theme.colors.surface,
      '--color-surface-subtle': theme.colors.background,
      '--color-surface-hover': theme.colors.background,
      '--color-surface-elevated': theme.colors.surface,
      '--color-danger': theme.colors.error,
      '--color-topbar-bg': theme.colors.headerBackground,
      '--color-nav-hover': theme.colors.background,
      '--color-nav-active': theme.colors.background,
      '--color-brand-surface': theme.colors.background,
      '--color-brand-border': theme.colors.border,
      '--color-brand-text': theme.colors.link,
      '--shadow-dropdown':
        theme.layout.shadowStyle === 'strong'
          ? '0 24px 52px rgb(15 23 42 / 18%)'
          : theme.layout.shadowStyle === 'soft'
            ? '0 8px 18px rgb(15 23 42 / 8%)'
            : '0 20px 40px rgb(15 23 42 / 12%)',
    },
  };
}

export function clearInactiveStoredTheme() {
  if (typeof window === 'undefined') {
    return;
  }

  const storedThemeKey = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isCustomThemeKey(storedThemeKey) && !getCustomThemeByKey(storedThemeKey)) {
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_KEY);
  }
}
