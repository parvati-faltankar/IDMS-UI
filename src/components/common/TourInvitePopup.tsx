import React from 'react';
import { Sparkles } from 'lucide-react';

interface TourInvitePopupProps {
  title: string;
  description: string;
  onTakeTour: () => void;
  onSkip: () => void;
}

const TourInvitePopup: React.FC<TourInvitePopupProps> = ({
  title,
  description,
  onTakeTour,
  onSkip,
}) => (
  <aside className="tour-invite" aria-label={`${title} tour invitation`}>
    <div className="tour-invite__icon" aria-hidden="true">
      <Sparkles size={18} />
    </div>
    <div className="tour-invite__content">
      <h3 className="tour-invite__title">{title}</h3>
      <p className="tour-invite__description">{description}</p>
      <div className="tour-invite__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={onTakeTour}>
          Take a Tour
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  </aside>
);

export default TourInvitePopup;
