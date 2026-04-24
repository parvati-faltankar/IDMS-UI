import { createContext } from 'react';
import { themeRegistry, type AppearanceMode, type ThemeKey } from './themeRegistry';

export interface ThemeContextValue {
  themeKey: ThemeKey;
  theme: (typeof themeRegistry)[ThemeKey];
  themes: typeof themeRegistry;
  appearanceMode: AppearanceMode;
  setTheme: (themeKey: ThemeKey) => void;
  toggleTheme: () => void;
  setAppearanceMode: (appearanceMode: AppearanceMode) => void;
  toggleAppearanceMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
