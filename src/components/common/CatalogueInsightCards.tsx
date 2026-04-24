import React from 'react';
import { cn } from '../../utils/classNames';

export type CatalogueInsightTone = 'primary' | 'success' | 'warning' | 'neutral' | 'accent';

export interface CatalogueInsightItem {
  key: string;
  label: string;
  value: string;
  support: string;
  hint?: string;
  progress?: number;
  tone?: CatalogueInsightTone;
}

interface CatalogueInsightCardsProps {
  items: CatalogueInsightItem[];
  activeKey: string | null;
  ariaLabel: string;
  onSelect: (key: string) => void;
}

const CatalogueInsightCards: React.FC<CatalogueInsightCardsProps> = ({
  items,
  activeKey,
  ariaLabel,
  onSelect,
}) => (
  <div className="catalogue-analytics" aria-label={ariaLabel}>
    {items.slice(0, 4).map((item) => {
      const isActive = activeKey === item.key;
      const progress = Math.max(8, Math.min(item.progress ?? 0, 100));

      return (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          aria-pressed={isActive}
          className={cn(
            'catalogue-analytics__chip',
            `catalogue-analytics__chip--${item.tone ?? 'neutral'}`,
            isActive && 'catalogue-analytics__chip--active'
          )}
        >
          <div className="catalogue-analytics__header">
            <span className="catalogue-analytics__label">{item.label}</span>
            <span className="catalogue-analytics__eyebrow">{isActive ? 'Applied' : 'Live insight'}</span>
          </div>
          <div className="catalogue-analytics__headline-row">
            <strong className="catalogue-analytics__value">{item.value}</strong>
            {item.progress !== undefined && (
              <span className="catalogue-analytics__progress-text">{Math.round(item.progress)}%</span>
            )}
          </div>
          {item.progress !== undefined && (
            <div className="catalogue-analytics__progress-track" aria-hidden="true">
              <span className="catalogue-analytics__progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
          <span className="catalogue-analytics__support">{item.support}</span>
          {item.hint && <span className="catalogue-analytics__hint">{item.hint}</span>}
        </button>
      );
    })}
  </div>
);

export default CatalogueInsightCards;
