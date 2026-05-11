import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppButton from '../app/AppButton';
import AppDialog from '../app/AppDialog';
import { useLocalization } from '../../localization';

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
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}) => {
  const { t } = useLocalization();
  const titleId = `${(title ?? 'confirmation').replace(/\s+/g, '-').toLowerCase()}-title`;
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');

  return (
    <AppDialog
      open={isOpen}
      onClose={onClose}
      titleId={title ? titleId : undefined}
      width={420}
      actions={
        <Box className="confirmation-dialog__actions" sx={{ display: 'flex', gap: 1.25, width: '100%', justifyContent: 'flex-end' }}>
          <AppButton autoFocus onClick={onClose} tone="outline" className="confirmation-dialog__button">
            {resolvedCancelLabel}
          </AppButton>
          <AppButton onClick={onConfirm} tone="primary" className="confirmation-dialog__button">
            {resolvedConfirmLabel}
          </AppButton>
        </Box>
      }
      paperSx={{
        overflow: 'hidden',
      }}
    >
      <Box className="confirmation-dialog__body" sx={{ display: 'grid', gap: 1 }}>
        {title && (
          <Typography id={titleId} className="confirmation-dialog__title" variant="h6" sx={{ m: 0 }}>
            {title}
          </Typography>
        )}
        <Typography className="confirmation-dialog__description" variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </AppDialog>
  );
};

export default ConfirmationDialog;
