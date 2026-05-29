import { useState } from 'react';
import { Monitor, Tablet, Smartphone, X } from 'lucide-react';
import UiStudioRenderer from '../renderer/UiStudioRenderer';
import { previewContexts } from '../preview/contexts';
import type { ViewMetadata } from '../types';

type Device = 'desktop' | 'tablet' | 'mobile';
type ContextLabel = 'Sales' | 'Finance' | 'Warehouse';

type PreviewOverlayProps = {
  metadata: ViewMetadata;
  onClose: () => void;
};

const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

const CONTEXT_LABELS: ContextLabel[] = ['Sales', 'Finance', 'Warehouse'];

const DEVICE_ICONS: Record<Device, React.ReactNode> = {
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
  mobile: <Smartphone size={14} />,
};

export default function PreviewOverlay({ metadata, onClose }: PreviewOverlayProps) {
  const [device, setDevice] = useState<Device>('desktop');
  const [contextIndex, setContextIndex] = useState(0);

  const context = previewContexts[contextIndex] ?? previewContexts[0];

  return (
    <div className="preview-overlay" data-testid="preview-overlay">
      {/* Mini top bar */}
      <div className="preview-overlay__bar">
        <button
          type="button"
          className="preview-overlay__close"
          onClick={onClose}
          aria-label="Exit preview"
        >
          <X size={14} />
          Exit Preview
        </button>

        <div className="preview-overlay__device-tabs">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`preview-overlay__device-btn${device === d ? ' preview-overlay__device-btn--active' : ''}`}
              onClick={() => setDevice(d)}
              aria-label={d}
              title={`${d.charAt(0).toUpperCase() + d.slice(1)} view`}
            >
              {DEVICE_ICONS[d]}
            </button>
          ))}
        </div>

        <div className="preview-overlay__context-tabs">
          {CONTEXT_LABELS.map((label, idx) => (
            <button
              key={label}
              type="button"
              className={`preview-overlay__context-btn${contextIndex === idx ? ' preview-overlay__context-btn--active' : ''}`}
              onClick={() => setContextIndex(idx)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Device frame */}
      <div className="preview-overlay__body">
        <div
          className="preview-overlay__viewport"
          style={{ width: DEVICE_WIDTHS[device] }}
        >
          <UiStudioRenderer view={metadata} context={context} />
        </div>
      </div>
    </div>
  );
}
