import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { cn } from '../../utils/classNames';
import { Input } from './FormControls';

interface CompactFormDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  saveLabel?: string;
  discardLabel?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const CompactFormDialog: React.FC<CompactFormDialogProps> = ({
  isOpen,
  title,
  description,
  label,
  initialValue = '',
  placeholder,
  saveLabel = 'Save',
  discardLabel = 'Discard',
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = `${title.replace(/\s+/g, '-').toLowerCase()}-compact-dialog-title`;
  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
    fallbackFocusRef: inputRef,
  });

  const trimmedValue = value.trim();

  return (
    <div className={cn('compact-form-dialog', isOpen && 'compact-form-dialog--open')} aria-hidden={!isOpen}>
      <button
        type="button"
        className="compact-form-dialog__backdrop"
        aria-label={`Close ${title}`}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="compact-form-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <div className="compact-form-dialog__header">
          <div>
            <h2 id={titleId} className="compact-form-dialog__title">
              {title}
            </h2>
            {description && <p className="compact-form-dialog__description">{description}</p>}
          </div>
          <button type="button" className="compact-form-dialog__close" onClick={onClose} aria-label={`Close ${title}`}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form
          className="compact-form-dialog__body"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedValue) {
              onSave(trimmedValue);
            }
          }}
        >
          <label className="field-label" htmlFor={`${titleId}-input`}>
            {label}
          </label>
          <Input
            ref={inputRef}
            id={`${titleId}-input`}
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="compact-form-dialog__actions">
            <button type="button" className="btn btn--outline compact-form-dialog__button" onClick={onClose}>
              {discardLabel}
            </button>
            <button
              type="submit"
              className="btn btn--primary compact-form-dialog__button"
              disabled={!trimmedValue}
            >
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompactFormDialog;
