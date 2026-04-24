import React, { useEffect, useMemo, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
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
import { createAppMuiTheme } from './materialTheme';

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

  const muiTheme = useMemo(
    () => createAppMuiTheme(themeKey, appearanceMode),
    [appearanceMode, themeKey]
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
