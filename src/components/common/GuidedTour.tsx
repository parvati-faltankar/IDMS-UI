import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/classNames';

export interface GuidedTourStep {
  id: string;
  target: string;
  title: string;
  body: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  steps: GuidedTourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getTargetRect(selector: string): TargetRect | null {
  const element = document.querySelector(selector);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  steps,
  currentStepIndex,
  onNext,
  onBack,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (!isOpen || !currentStep) {
      return undefined;
    }

    const target = document.querySelector(currentStep.target);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    const updateTargetRect = () => {
      setTargetRect(getTargetRect(currentStep.target));
    };

    const frameId = window.requestAnimationFrame(updateTargetRect);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [currentStep, isOpen]);

  const popoverStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const width = 340;
    const gap = 14;
    const belowTop = targetRect.top + targetRect.height + gap;
    const aboveTop = targetRect.top - 190 - gap;
    const left = Math.min(Math.max(targetRect.left, 16), window.innerWidth - width - 16);
    const top = belowTop + 190 < window.innerHeight ? belowTop : Math.max(16, aboveTop);

    return { left, top, width };
  }, [targetRect]);

  if (!isOpen || !currentStep) {
    return null;
  }

  return (
    <div className="guided-tour" role="dialog" aria-modal="true" aria-label="Purchase Requisition guided tour">
      <button type="button" className="guided-tour__backdrop" onClick={onSkip} aria-label="Skip tour" />
      {targetRect && (
        <div
          className="guided-tour__spotlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      <section className="guided-tour__card" style={popoverStyle}>
        <div className="guided-tour__header">
          <span className="guided-tour__eyebrow">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <button type="button" className="guided-tour__close" onClick={onSkip} aria-label="Skip tour">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <h3 className="guided-tour__title">{currentStep.title}</h3>
        <p className="guided-tour__body">{currentStep.body}</p>
        <div className="guided-tour__progress" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={cn('guided-tour__dot', index <= currentStepIndex && 'guided-tour__dot--active')}
            />
          ))}
        </div>
        <div className="guided-tour__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onSkip}>
            Skip
          </button>
          <div className="guided-tour__nav-actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={onBack} disabled={currentStepIndex === 0}>
              Back
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={onNext}>
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidedTour;
