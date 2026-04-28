import { createContext } from 'react';
import { type AppearanceMode, type BrandThemeDefinition, type ThemeKey } from './themeRegistry';

export interface ThemeContextValue {
  themeKey: ThemeKey;
  theme: BrandThemeDefinition;
  themes: Record<string, BrandThemeDefinition>;
  themeKeys: ThemeKey[];
  appearanceMode: AppearanceMode;
  setTheme: (themeKey: ThemeKey) => void;
  toggleTheme: () => void;
  setAppearanceMode: (appearanceMode: AppearanceMode) => void;
  toggleAppearanceMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
