import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import { cn } from '../../utils/classNames';

interface ThemeSwitcherProps {
  variant?: 'header' | 'menu';
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'header', className }) => {
  const { appearanceMode, toggleAppearanceMode } = useTheme();
  const isMenuVariant = variant === 'menu';

  return (
    <div
      className={cn('app-topbar__theme-group', isMenuVariant && 'app-topbar__theme-group--menu', className)}
      aria-label='Theme controls'
    >
      {isMenuVariant && (
        <div className='app-topbar__theme-menu-copy'>
          <div className='app-topbar__theme-menu-title'>Appearance</div>
          <div className='app-topbar__theme-menu-subtitle'>Switch between light and dark mode.</div>
        </div>
      )}

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
