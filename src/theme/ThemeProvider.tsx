import React, { useEffect, useMemo, useState } from 'react';
import {
  applyAppearanceMode,
  applyThemeKey,
  getStoredAppearanceMode,
  getNextThemeKey,
  initializeTheme,
  persistAppearanceMode,
  persistThemeKey,
  themeRegistry,
  type AppearanceMode,
  type ThemeKey,
} from './themeRegistry';
import { ThemeContext, type ThemeContextValue } from './themeContext';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => initializeTheme());
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => getStoredAppearanceMode());

  useEffect(() => {
    applyThemeKey(themeKey);
    persistThemeKey(themeKey);
  }, [themeKey]);

  useEffect(() => {
    applyAppearanceMode(appearanceMode);
    persistAppearanceMode(appearanceMode);
  }, [appearanceMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeKey,
      theme: themeRegistry[themeKey],
      themes: themeRegistry,
      appearanceMode,
      setTheme: setThemeKey,
      toggleTheme: () => setThemeKey((current) => getNextThemeKey(current)),
      setAppearanceMode,
      toggleAppearanceMode: () =>
        setAppearanceMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [appearanceMode, themeKey]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
