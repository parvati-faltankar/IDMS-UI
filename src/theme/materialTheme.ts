import { alpha, createTheme, type Direction, type Shadows } from '@mui/material/styles';
import { themeRegistry, DEFAULT_THEME_KEY, type AppearanceMode, type BrandThemeDefinition, type ThemeKey } from './themeRegistry';

function createAppShadows(isDark: boolean): Shadows {
  const shadowColor = isDark ? 'rgb(2 6 23 / 42%)' : 'rgb(15 23 42 / 12%)';
  const shadows = Array.from({ length: 25 }, () => 'none') as Shadows;

  shadows[1] = '0 1px 2px rgb(15 23 42 / 8%)';
  shadows[2] = `0 8px 24px ${shadowColor}`;
  shadows[3] = `0 12px 32px ${shadowColor}`;
  shadows[4] = `0 20px 40px ${shadowColor}`;
  shadows[8] = `0 20px 40px ${shadowColor}`;

  return shadows;
}

export function createAppMuiTheme(
  themeKey: ThemeKey,
  appearanceMode: AppearanceMode,
  theme?: BrandThemeDefinition,
  direction: Direction = 'ltr'
) {
  const brand = (theme ?? themeRegistry[themeKey] ?? themeRegistry[DEFAULT_THEME_KEY]).brandScale;
  const isDark = appearanceMode === 'dark';
  /* Surfaces/text/borders aligned to the Excellon DS cool-slate ramp
     (light exact; dark derived — mirrors src/styles/excellon-ds/tokens.css). */
  const surface = isDark ? '#1b1d21' : '#ffffff';
  const surfaceSubtle = isDark ? '#141619' : '#f4f7fa';
  const surfaceHover = isDark ? '#23262c' : '#eff2f5';
  const textPrimary = isDark ? '#f4f7fa' : '#1b1d21';
  const textSecondary = isDark ? '#a8b5c2' : '#6a7682';
  const divider = isDark ? '#2c3138' : '#dee4eb';
  const bodyBackground = isDark ? '#141619' : '#f4f7fa';
  const overlay = isDark ? 'rgb(0 0 0 / 50%)' : 'rgb(27 29 33 / 24%)';
  const focusRing = alpha(brand[500], isDark ? 0.28 : 0.22);
  const hoverBorder = isDark ? '#3a4048' : '#c3ccd6';

  return createTheme({
    direction,
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: brand[500],
        light: brand[400],
        dark: brand[600],
        contrastText: '#ffffff',
      },
      secondary: {
        main: brand[700],
        light: brand[500],
        dark: brand[800],
        contrastText: '#ffffff',
      },
      error: {
        main: '#f5222d',
      },
      background: {
        default: bodyBackground,
        paper: surface,
      },
      text: {
        primary: textPrimary,
        secondary: textSecondary,
      },
      divider,
      action: {
        hover: surfaceHover,
        selected: alpha(brand[500], isDark ? 0.22 : 0.08),
        focus: focusRing,
      },
    },
    typography: {
      fontFamily: 'var(--font-family-base, "Noto Sans", sans-serif)',
      fontSize: 14,
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.2,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle1: {
        fontWeight: 600,
      },
      body2: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
    },
    spacing: 4,
    shape: {
      borderRadius: 8,
    },
    shadows: createAppShadows(isDark),
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': {
            boxSizing: 'border-box',
          },
          html: {
            backgroundColor: bodyBackground,
            direction,
          },
          body: {
            margin: 0,
            backgroundColor: bodyBackground,
            color: textPrimary,
            fontFamily: 'var(--font-family-base, "Noto Sans", sans-serif)',
            direction,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 38,
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            boxShadow: 'none',
            textTransform: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
            '&:focus-visible': {
              outline: 'none',
              boxShadow: `0 0 0 4px ${focusRing}`,
            },
          },
          sizeSmall: {
            minHeight: 30,
            padding: '6px 10px',
            fontSize: '0.75rem',
            lineHeight: 1.3334,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '&:focus-visible': {
              outline: 'none',
              boxShadow: `0 0 0 3px ${focusRing}`,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            border: `1px solid ${divider}`,
            boxShadow: createAppShadows(isDark)[8],
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderColor: divider,
            boxShadow: createAppShadows(isDark)[8],
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: overlay,
          },
        },
      },
      MuiNativeSelect: {
        styleOverrides: {
          select: {
            '&:focus': {
              backgroundColor: 'transparent',
            },
          },
          icon: {
            color: textSecondary,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 8,
            backgroundColor: surface,
            color: textPrimary,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: hoverBorder,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
            },
            '&.Mui-disabled': {
              backgroundColor: surfaceSubtle,
              color: textSecondary,
            },
          },
          notchedOutline: {
            borderColor: divider,
          },
          input: {
            padding: '8px 12px',
            fontSize: '0.875rem',
            lineHeight: '24px',
          },
        },
      },
    },
  });
}
