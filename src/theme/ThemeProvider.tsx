import React, { useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import {
  applyAppearanceMode,
  applyThemeKey,
  DEFAULT_THEME_KEY,
  getStoredAppearanceMode,
  getNextThemeKey,
  initializeTheme,
  persistAppearanceMode,
  persistThemeKey,
  themeRegistry,
  type AppearanceMode,
  type BrandThemeDefinition,
  type ThemeKey,
} from './themeRegistry';
import { ThemeContext, type ThemeContextValue } from './themeContext';
import { createAppMuiTheme } from './materialTheme';
import {
  CUSTOM_THEMES_UPDATED_EVENT,
  clearInactiveStoredTheme,
  getPublishedThemeBuilderThemes,
  toBrandThemeDefinition,
} from './customThemeBuilder';

function getAvailableThemes(): Record<string, BrandThemeDefinition> {
  return {
    ...themeRegistry,
    ...Object.fromEntries(getPublishedThemeBuilderThemes().map((theme) => [theme.key, toBrandThemeDefinition(theme)])),
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => initializeTheme());
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>(() => getStoredAppearanceMode());
  const [themes, setThemes] = useState<Record<string, BrandThemeDefinition>>(() => getAvailableThemes());
  const themeKeys = useMemo(() => Object.keys(themes), [themes]);
  const resolvedThemeKey = themes[themeKey] ? themeKey : DEFAULT_THEME_KEY;
  const resolvedTheme = themes[resolvedThemeKey] ?? themeRegistry[DEFAULT_THEME_KEY];

  useEffect(() => {
    const handleThemesUpdated = () => {
      clearInactiveStoredTheme();
      const nextThemes = getAvailableThemes();
      setThemes(nextThemes);
      setThemeKey((current) => (nextThemes[current] ? current : DEFAULT_THEME_KEY));
    };

    window.addEventListener(CUSTOM_THEMES_UPDATED_EVENT, handleThemesUpdated);
    window.addEventListener('storage', handleThemesUpdated);

    return () => {
      window.removeEventListener(CUSTOM_THEMES_UPDATED_EVENT, handleThemesUpdated);
      window.removeEventListener('storage', handleThemesUpdated);
    };
  }, []);

  useEffect(() => {
    applyThemeKey(resolvedThemeKey, resolvedTheme);
    persistThemeKey(resolvedThemeKey);
  }, [resolvedTheme, resolvedThemeKey]);

  useEffect(() => {
    applyAppearanceMode(appearanceMode);
    persistAppearanceMode(appearanceMode);
  }, [appearanceMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeKey: resolvedThemeKey,
      theme: resolvedTheme,
      themes,
      themeKeys,
      appearanceMode,
      setTheme: setThemeKey,
      toggleTheme: () =>
        setThemeKey((current) => {
          const currentIndex = themeKeys.indexOf(current);
          return themeKeys[(currentIndex + 1) % themeKeys.length] ?? getNextThemeKey(current);
        }),
      setAppearanceMode,
      toggleAppearanceMode: () =>
        setAppearanceMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [appearanceMode, resolvedTheme, resolvedThemeKey, themeKeys, themes]
  );

  const muiTheme = useMemo(
    () => createAppMuiTheme(resolvedThemeKey, appearanceMode, resolvedTheme),
    [appearanceMode, resolvedTheme, resolvedThemeKey]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
};
