import React from 'react';
import { ChevronDown, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { themeKeys, type ThemeKey } from '../../theme/themeRegistry';

const ThemeSwitcher: React.FC = () => {
  const { theme, themeKey, themes, setTheme, appearanceMode, toggleAppearanceMode } = useTheme();

  return (
    <div className="app-topbar__theme-group" aria-label="Theme controls">
      <label
        className="app-topbar__theme-switcher"
        aria-label="Choose brand theme"
        title="Choose brand theme"
      >
        <Palette size={16} aria-hidden="true" />
        <span className="app-topbar__theme-short">{theme.shortLabel}</span>
        <select
          className="app-topbar__theme-select"
          value={themeKey}
          onChange={(event) => setTheme(event.target.value as ThemeKey)}
          aria-label="Brand theme"
        >
          {themeKeys.map((key) => (
            <option key={key} value={key}>
              {themes[key].label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="app-topbar__theme-chevron" aria-hidden="true" />
      </label>

      <button
        type="button"
        className="app-topbar__appearance-toggle"
        onClick={toggleAppearanceMode}
        aria-label={`Switch to ${appearanceMode === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={appearanceMode === 'dark'}
        title={`Switch to ${appearanceMode === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="app-topbar__appearance-toggle-track" aria-hidden="true">
          <span className="app-topbar__appearance-toggle-thumb">
            {appearanceMode === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          </span>
        </span>
        <span className="app-topbar__appearance-toggle-label">
          {appearanceMode === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>
    </div>
  );
};

export default ThemeSwitcher;
