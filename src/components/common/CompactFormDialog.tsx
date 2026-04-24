import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { Input } from './FormControls';
import AppButton from '../app/AppButton';
import AppDialog from '../app/AppDialog';

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const trimmedValue = value.trim();

  return (
    <AppDialog
      open={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      titleId={titleId}
      showCloseButton
      paperClassName="compact-form-dialog__panel"
      contentClassName="compact-form-dialog__body"
      width={420}
      actions={
        <Box className="compact-form-dialog__actions" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25, width: '100%' }}>
          <AppButton type="button" tone="outline" className="compact-form-dialog__button" onClick={onClose}>
            {discardLabel}
          </AppButton>
          <AppButton
            type="submit"
            form={`${titleId}-form`}
            tone="primary"
            className="compact-form-dialog__button"
            disabled={!trimmedValue}
          >
            {saveLabel}
          </AppButton>
        </Box>
      }
    >
      <form
        id={`${titleId}-form`}
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
      </form>
    </AppDialog>
  );
};

export default CompactFormDialog;
