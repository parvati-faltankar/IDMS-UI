import React, { useRef } from 'react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { cn } from '../../utils/classNames';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onClose,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: cancelButtonRef,
    fallbackFocusRef: cancelButtonRef,
  });

  const titleId = `${(title ?? 'confirmation').replace(/\s+/g, '-').toLowerCase()}-title`;

  return (
    <div className={cn('confirmation-dialog', isOpen && 'confirmation-dialog--open')} aria-hidden={!isOpen}>
      <button
        type="button"
        className="confirmation-dialog__backdrop"
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label={title ? `Close ${title}` : 'Close confirmation'}
      />
      <div
        ref={containerRef}
        className="confirmation-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onKeyDown={handleKeyDown}
      >
        <div className="confirmation-dialog__body">
          {title && (
            <h2 id={titleId} className="confirmation-dialog__title">
              {title}
            </h2>
          )}
          <p className="confirmation-dialog__description">{description}</p>
        </div>

        <div className="confirmation-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn--outline confirmation-dialog__button"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn btn--primary confirmation-dialog__button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
