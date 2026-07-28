import React, { useEffect, useMemo, useState } from 'react';
import { Maximize2, Monitor, RotateCcw, Smartphone, Tablet } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/classNames';

type ViewportSimulatorMode = 'actual' | 'desktop' | 'tablet-portrait' | 'tablet-landscape' | 'mobile';

interface ViewportPreset {
  label: string;
  shortLabel: string;
  width: number;
  height: number;
  icon: React.ElementType;
  iconClassName?: string;
}

interface ViewportSimulatorProps {
  children: ReactNode;
}

const STORAGE_KEY = 'viewport-simulator-mode';
const FRAME_MARKER = 'viewport-simulator-frame';

const VIEWPORT_PRESETS: Record<Exclude<ViewportSimulatorMode, 'actual'>, ViewportPreset> = {
  desktop: {
    label: 'Desktop',
    shortLabel: 'Desktop',
    width: 1440,
    height: 900,
    icon: Monitor,
  },
  'tablet-portrait': {
    label: 'Tablet portrait',
    shortLabel: 'Tablet',
    width: 768,
    height: 1024,
    icon: Tablet,
  },
  'tablet-landscape': {
    label: 'Tablet landscape',
    shortLabel: 'Landscape',
    width: 1024,
    height: 768,
    icon: Tablet,
    iconClassName: 'viewport-simulator__icon--rotate',
  },
  mobile: {
    label: 'Mobile',
    shortLabel: 'Mobile',
    width: 390,
    height: 844,
    icon: Smartphone,
  },
};

const isViewportSimulatorMode = (value: string | null): value is ViewportSimulatorMode =>
  value === 'actual' || value === 'desktop' || value === 'tablet-portrait' || value === 'tablet-landscape' || value === 'mobile';

export const isViewportSimulatorFrame = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get(FRAME_MARKER) === '1';
};

const getStoredMode = (): ViewportSimulatorMode => {
  if (typeof window === 'undefined') {
    return 'actual';
  }

  const storedMode = window.localStorage.getItem(STORAGE_KEY);
  return isViewportSimulatorMode(storedMode) ? storedMode : 'actual';
};

const getFrameSource = () => {
  const hash = window.location.hash || '#/';
  return `${window.location.origin}${window.location.pathname}?${FRAME_MARKER}=1${hash}`;
};

const ViewportSimulator: React.FC<ViewportSimulatorProps> = ({ children }) => {
  const [mode, setMode] = useState<ViewportSimulatorMode>(() => getStoredMode());
  const [frameSource, setFrameSource] = useState(() => (typeof window === 'undefined' ? '' : getFrameSource()));

  const activePreset = mode === 'actual' ? null : VIEWPORT_PRESETS[mode];

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const handleHashChange = () => {
      setFrameSource(getFrameSource());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const frameStyle = useMemo(
    () => activePreset ? { width: `${activePreset.width}px`, height: `${activePreset.height}px` } : undefined,
    [activePreset]
  );

  if (mode === 'actual') {
    return (
      <div className="viewport-simulator viewport-simulator--actual">
        <SimulatorToolbar activeMode={mode} onSelectMode={setMode} />
        <div className="viewport-simulator__actual-app">{children}</div>
      </div>
    );
  }

  return (
    <div className="viewport-simulator">
      <SimulatorToolbar activeMode={mode} onSelectMode={setMode} />
      <div className="viewport-simulator__stage" aria-label="Viewport simulator canvas">
        <div
          className={cn('viewport-simulator__device-frame', activePreset && `viewport-simulator__device-frame--${mode}`)}
          style={frameStyle}
        >
          <iframe
            key={frameSource}
            title={`${activePreset?.label ?? 'Application'} viewport preview`}
            className="viewport-simulator__iframe"
            src={frameSource}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>
      </div>
    </div>
  );
};

interface SimulatorToolbarProps {
  activeMode: ViewportSimulatorMode;
  onSelectMode: (mode: ViewportSimulatorMode) => void;
}

const SimulatorToolbar: React.FC<SimulatorToolbarProps> = ({ activeMode, onSelectMode }) => {
  const modes: Array<{ mode: ViewportSimulatorMode; label: string; shortLabel: string; icon: React.ElementType; iconClassName?: string }> = [
    { mode: 'actual', label: 'Actual viewport', shortLabel: 'Actual', icon: Maximize2 },
    ...Object.entries(VIEWPORT_PRESETS).map(([mode, preset]) => ({
      mode: mode as ViewportSimulatorMode,
      label: preset.label,
      shortLabel: preset.shortLabel,
      icon: preset.icon,
      iconClassName: preset.iconClassName,
    })),
  ];

  return (
    <div className="viewport-simulator__toolbar" role="toolbar" aria-label="Temporary viewport simulator">
      <div className="viewport-simulator__title">
        <RotateCcw size={14} aria-hidden="true" />
        <span>Viewport simulator</span>
      </div>
      <div className="viewport-simulator__controls" role="group" aria-label="Select viewport size">
        {modes.map(({ mode: viewportMode, label, shortLabel, icon: Icon, iconClassName }) => {
          const isActive = activeMode === viewportMode;

          return (
            <button
              key={viewportMode}
              type="button"
              className={cn('viewport-simulator__button', isActive && 'viewport-simulator__button--active')}
              onClick={() => onSelectMode(viewportMode)}
              aria-pressed={isActive}
              aria-label={label}
              title={label}
            >
              <Icon size={15} className={iconClassName} aria-hidden="true" />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ViewportSimulator;

