import React, { useRef, useState } from 'react';
import { FormField, Select, Textarea } from './FormControls';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { cn } from '../../utils/classNames';

export interface CancelDocumentPayload {
  reason: string;
  remarks: string;
}

interface CancelDocumentDialogProps {
  isOpen: boolean;
  documentTypeLabel: string;
  documentNumber: string;
  onConfirm: (payload: CancelDocumentPayload) => void;
  onClose: () => void;
  reasonOptions?: string[];
}

const defaultCancelReasons = [
  'Incorrect details',
  'Duplicate document',
  'Requirement cancelled',
  'Supplier unavailable',
  'Budget hold',
  'Other',
];

const CancelDocumentDialog: React.FC<CancelDocumentDialogProps> = ({
  isOpen,
  documentTypeLabel,
  documentNumber,
  onConfirm,
  onClose,
  reasonOptions = defaultCancelReasons,
}) => {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const reasonRef = useRef<HTMLSelectElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const resetForm = () => {
    setReason('');
    setRemarks('');
    setHasSubmitted(false);
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleClose,
    initialFocusRef: reasonRef,
    fallbackFocusRef: cancelButtonRef,
  });

  const titleId = `${documentTypeLabel.replace(/\s+/g, '-').toLowerCase()}-cancel-title`;
  const reasonError = hasSubmitted && !reason ? 'Please select a cancellation reason.' : '';

  const handleConfirm = () => {
    setHasSubmitted(true);

    if (!reason) {
      return;
    }

    onConfirm({
      reason,
      remarks: remarks.trim(),
    });
  };

  return (
    <div
      className={cn('confirmation-dialog cancel-document-dialog', isOpen && 'confirmation-dialog--open')}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="confirmation-dialog__backdrop"
        onClick={handleClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label={`Close cancel ${documentTypeLabel}`}
      />

      <div
        ref={containerRef}
        className="confirmation-dialog__panel cancel-document-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <div className="confirmation-dialog__body cancel-document-dialog__body">
          <div className="cancel-document-dialog__intro">
            <h2 id={titleId} className="confirmation-dialog__title">
              Cancel {documentTypeLabel}
            </h2>
            <p className="confirmation-dialog__description">
              Add a reason before cancelling <span className="cancel-document-dialog__document-number">{documentNumber}</span>.
            </p>
          </div>

          <div className="cancel-document-dialog__form">
            <FormField label="Reason" required>
              <Select
                ref={reasonRef}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                error={reasonError}
                options={[
                  { value: '', label: 'Select cancellation reason' },
                  ...reasonOptions.map((option) => ({
                    value: option,
                    label: option,
                  })),
                ]}
              />
            </FormField>
            {reasonError && <p className="field-error">{reasonError}</p>}

            <FormField label="Remark">
              <Textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value.slice(0, 500))}
                rows={4}
                maxLength={500}
                placeholder="Add remark"
                className="cancel-document-dialog__remarks"
              />
            </FormField>
            <div className="cancel-document-dialog__meta">
              <span>{remarks.length}/500</span>
            </div>
          </div>
        </div>

        <div className="confirmation-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={handleClose}
            className="btn btn--outline confirmation-dialog__button"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn--primary confirmation-dialog__button"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelDocumentDialog;
