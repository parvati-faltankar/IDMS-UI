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

export interface CatalogueInsightCardsProps {
  items: CatalogueInsightItem[];
  activeKey: string | null;
  ariaLabel: string;
  onSelect: (key: string) => void;
  variant?: 'classic' | 'enterprise';
  density?: 'compact' | 'comfortable';
  maxVisibleItems?: number;
  badgeLabel?: string;
  activeBadgeLabel?: string;
}

const CatalogueInsightCards: React.FC<CatalogueInsightCardsProps> = ({
  items,
  activeKey,
  ariaLabel,
  onSelect,
  variant = 'classic',
  density = 'compact',
  maxVisibleItems = 4,
  badgeLabel = 'Live insight',
  activeBadgeLabel = 'Applied',
}) => (
  <div
    className={cn(
      'catalogue-analytics',
      `catalogue-analytics--${variant}`,
      `catalogue-analytics--density-${density}`
    )}
    role="group"
    aria-label={ariaLabel}
  >
    {items.slice(0, maxVisibleItems).map((item) => {
      const isActive = activeKey === item.key;
      const normalizedProgress = Math.max(0, Math.min(item.progress ?? 0, 100));
      const visualProgress = normalizedProgress > 0 ? Math.max(8, normalizedProgress) : 0;
      const eyebrowLabel = isActive ? activeBadgeLabel : badgeLabel;
      const shouldRenderEyebrow = eyebrowLabel.trim().length > 0;

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
            {shouldRenderEyebrow && <span className="catalogue-analytics__eyebrow">{eyebrowLabel}</span>}
          </div>
          <div className="catalogue-analytics__headline-row">
            <strong className="catalogue-analytics__value">{item.value}</strong>
            {item.progress !== undefined && (
              <span className="catalogue-analytics__progress-text">{Math.round(normalizedProgress)}%</span>
            )}
          </div>
          {item.progress !== undefined && (
            <div className="catalogue-analytics__progress-track" aria-hidden="true">
              <span className="catalogue-analytics__progress-bar" style={{ width: `${visualProgress}%` }} />
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


