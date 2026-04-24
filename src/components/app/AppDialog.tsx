import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { type SxProps, type Theme } from '@mui/material/styles';
import { X } from 'lucide-react';
import { cn } from '../../utils/classNames';

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  titleId?: string;
  showCloseButton?: boolean;
  width?: number;
  paperClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  paperSx?: SxProps<Theme>;
}

export default function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  titleId,
  showCloseButton = false,
  width = 420,
  paperClassName,
  contentClassName,
  actionsClassName,
  paperSx,
}: AppDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      aria-labelledby={titleId}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgb(15 23 42 / 30%)',
          },
        },
        paper: {
          className: paperClassName,
          sx: [
            {
              width: `min(${width}px, calc(100vw - 32px))`,
              m: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '16px',
              boxShadow: (theme: Theme) => theme.shadows[8],
            },
            ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
          ],
        },
      }}
    >
      {(title || description || showCloseButton) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            px: 2.25,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <div>
            {title && (
              <Typography id={titleId} variant="h6" sx={{ m: 0 }}>
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: title ? 0.5 : 0 }}>
                {description}
              </Typography>
            )}
          </div>
          {showCloseButton && (
            <IconButton
              onClick={onClose}
              aria-label={typeof title === 'string' ? `Close ${title}` : 'Close dialog'}
              sx={{
                width: 30,
                height: 30,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                color: 'text.secondary',
              }}
            >
              <X size={16} />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {children && (
        <DialogContent className={contentClassName} sx={{ px: 2.25, py: 2, '&:first-of-type': { pt: 2 } }}>
          {children}
        </DialogContent>
      )}

      {actions && (
        <DialogActions className={cn(actionsClassName)} sx={{ px: 2.25, pb: 2.25, pt: children ? 0 : 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
