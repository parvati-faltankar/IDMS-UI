import React from 'react';
import Typography from '@mui/material/Typography';
import AppButton from '../app/AppButton';
import AppDialog from '../app/AppDialog';
import { useLocalization } from '../../localization';
import { cn } from '../../utils/classNames';

export type ConfirmationDialogTone = 'neutral' | 'warning' | 'danger';
export type ConfirmationDialogCompactPresentation = 'centered' | 'bottom-sheet';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  tone?: ConfirmationDialogTone;
  isProcessing?: boolean;
  closeOnBackdrop?: boolean;
  cancelAutoFocus?: boolean;
  width?: number;
  compactPresentation?: ConfirmationDialogCompactPresentation;
}

function getDialogId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'confirmation';
}

const compactSheetMediaQuery = '@media (max-width: 640px), (min-width: 641px) and (max-width: 1024px) and (orientation: portrait)';

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  tone = 'neutral',
  isProcessing = false,
  closeOnBackdrop = true,
  cancelAutoFocus = true,
  width = 420,
  compactPresentation = 'centered',
}) => {
  const { t } = useLocalization();
  const dialogId = getDialogId(title ?? 'confirmation');
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
  const useBottomSheet = compactPresentation === 'bottom-sheet';

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isProcessing) {
      onConfirm();
    }
  };

  return (
    <AppDialog
      open={isOpen}
      onClose={handleClose}
      titleId={title ? titleId : undefined}
      descriptionId={descriptionId}
      width={width}
      paperClassName={cn(
        'app-confirmation-dialog__paper',
        useBottomSheet && 'app-confirmation-dialog__paper--bottom-sheet',
        `app-confirmation-dialog__paper--${tone}`
      )}
      contentClassName="app-confirmation-dialog__content"
      actionsClassName={cn(
        'app-confirmation-dialog__actions',
        useBottomSheet && 'app-confirmation-dialog__actions--bottom-sheet'
      )}
      disableBackdropClose={!closeOnBackdrop || isProcessing}
      disableEscapeClose={isProcessing}
      actions={
        <>
          <AppButton
            autoFocus={cancelAutoFocus}
            onClick={handleClose}
            tone="outline"
            disabled={isProcessing}
            className="app-confirmation-dialog__button app-confirmation-dialog__button--cancel"
          >
            {resolvedCancelLabel}
          </AppButton>
          <AppButton
            autoFocus={!cancelAutoFocus}
            onClick={handleConfirm}
            tone="primary"
            disabled={isProcessing}
            className={cn(
              'app-confirmation-dialog__button app-confirmation-dialog__button--confirm',
              tone === 'danger' && 'app-confirmation-dialog__button--danger'
            )}
          >
            {resolvedConfirmLabel}
          </AppButton>
        </>
      }
      paperSx={{
        overflow: 'hidden',
        ...(useBottomSheet
          ? {
              [compactSheetMediaQuery]: {
                alignSelf: 'flex-end',
                width: '100vw',
                maxWidth: '100vw',
                maxHeight: 'min(72vh, 560px)',
                m: 0,
                borderRadius: '20px 20px 0 0',
              },
            }
          : {}),
      }}
    >
      <div className="app-confirmation-dialog__body">
        {title && (
          <Typography id={titleId} className="app-confirmation-dialog__title" variant="h6" sx={{ m: 0 }}>
            {title}
          </Typography>
        )}
        <Typography id={descriptionId} className="app-confirmation-dialog__description" variant="body2" color="text.secondary">
          {description}
        </Typography>
      </div>
    </AppDialog>
  );
};

export default ConfirmationDialog;
