import React from 'react';
import { ChevronDown, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import type { ThemeKey } from '../../theme/themeRegistry';
import { cn } from '../../utils/classNames';

interface ThemeSwitcherProps {
  variant?: 'header' | 'menu';
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'header', className }) => {
  const { theme, themeKey, themeKeys, themes, setTheme, appearanceMode, toggleAppearanceMode } = useTheme();
  const isMenuVariant = variant === 'menu';

  return (
    <div
      className={cn('app-topbar__theme-group', isMenuVariant && 'app-topbar__theme-group--menu', className)}
      aria-label='Theme controls'
    >
      {isMenuVariant && (
        <div className='app-topbar__theme-menu-copy'>
          <div className='app-topbar__theme-menu-title'>Brand and appearance</div>
          <div className='app-topbar__theme-menu-subtitle'>Switch the active brand theme and light or dark mode.</div>
        </div>
      )}

      <label
        className={cn('app-topbar__theme-switcher', isMenuVariant && 'app-topbar__theme-switcher--menu')}
        aria-label='Choose brand theme'
        title='Choose brand theme'
      >
        <Palette size={16} aria-hidden='true' />
        <span className='app-topbar__theme-short'>{theme.shortLabel}</span>
        <select
          className='app-topbar__theme-select'
          value={themeKey}
          onChange={(event) => setTheme(event.target.value as ThemeKey)}
          aria-label='Brand theme'
        >
          {themeKeys.map((key) => (
            <option key={key} value={key}>
              {themes[key].label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className='app-topbar__theme-chevron' aria-hidden='true' />
      </label>

      <button
        type='button'
        className={cn('app-topbar__appearance-toggle', isMenuVariant && 'app-topbar__appearance-toggle--menu')}
        onClick={toggleAppearanceMode}
        aria-label={`Switch to ${appearanceMode === 'dark' ? 'light' : 'dark'} mode`}
        aria-pressed={appearanceMode === 'dark'}
        title={`Switch to ${appearanceMode === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className='app-topbar__appearance-toggle-track' aria-hidden='true'>
          <span className='app-topbar__appearance-toggle-thumb'>
            {appearanceMode === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
          </span>
        </span>
        <span className='app-topbar__appearance-toggle-label'>
          {appearanceMode === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>
    </div>
  );
};

export default ThemeSwitcher;