import React, { useMemo, useRef } from 'react';
import { CheckCircle2, Printer, Share2, X } from 'lucide-react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { cn } from '../../utils/classNames';

interface SuccessSummaryItem {
  label: string;
  value: string;
  isEmphasis?: boolean;
}

interface SuccessSummaryDialogProps {
  isOpen: boolean;
  title: string;
  documentLabel: string;
  documentNumber: string;
  sectionTitle: string;
  items: SuccessSummaryItem[];
  totalLabel: string;
  totalValue: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onClose: () => void;
}

const SuccessSummaryDialog: React.FC<SuccessSummaryDialogProps> = ({
  isOpen,
  title,
  documentLabel,
  documentNumber,
  sectionTitle,
  items,
  totalLabel,
  totalValue,
  primaryActionLabel,
  onPrimaryAction,
  onPrint,
  onShare,
  onClose,
}) => {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: primaryButtonRef,
    fallbackFocusRef: primaryButtonRef,
  });

  const titleId = useMemo(
    () => `${title.replace(/\s+/g, '-').toLowerCase()}-dialog-title`,
    [title]
  );

  return (
    <div className={cn('success-dialog', isOpen && 'success-dialog--open')} aria-hidden={!isOpen}>
      <button
        type="button"
        className="success-dialog__backdrop"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label={`Close ${title}`}
      />

      <div
        ref={containerRef}
        className="success-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <div className="success-dialog__header">
          <div className="success-dialog__icon-wrap" aria-hidden="true">
            <CheckCircle2 size={24} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="success-dialog__close"
            aria-label={`Close ${title}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="success-dialog__intro">
          <h2 id={titleId} className="success-dialog__title">
            {title}
          </h2>
          <p className="success-dialog__meta">
            {documentLabel}: <span className="success-dialog__meta-value">{documentNumber}</span>
          </p>
        </div>

        <div className="success-dialog__summary">
          <div className="success-dialog__summary-title">{sectionTitle}</div>

          <div className="success-dialog__summary-list">
            {items.map((item) => (
              <div key={item.label} className="success-dialog__summary-row">
                <span className="success-dialog__summary-label">{item.label}</span>
                <span
                  className={cn(
                    'success-dialog__summary-value',
                    item.isEmphasis && 'success-dialog__summary-value--emphasis'
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="success-dialog__summary-total">
            <span className="success-dialog__summary-total-label">{totalLabel}</span>
            <span className="success-dialog__summary-total-value">{totalValue}</span>
          </div>
        </div>

        <div className="success-dialog__actions">
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={onPrimaryAction}
            className="btn btn--primary success-dialog__primary"
          >
            {primaryActionLabel}
          </button>

          <div className="success-dialog__icon-actions">
            <button
              type="button"
              onClick={onPrint}
              className="success-dialog__icon-button"
              aria-label="Print summary"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={onShare}
              className="success-dialog__icon-button"
              aria-label="Share summary"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessSummaryDialog;
