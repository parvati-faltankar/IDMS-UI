import Drawer from '@mui/material/Drawer';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  getMasterDrawerPaperSx,
  getMasterOverlayBackdropSx,
} from '../../experience/components/overlay/overlayTokens';

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
  paperSx?: SxProps<Theme>;
  backdropColor?: string;
}

export default function AppDrawer({
  open,
  onClose,
  width = 960,
  children,
  paperSx,
  backdropColor = 'rgb(24, 24, 24)',
}: AppDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        backdrop: {
          sx: [
            getMasterOverlayBackdropSx(),
            backdropColor ? { backgroundColor: backdropColor } : {},
          ],
        },
        paper: {
          sx: [
            getMasterDrawerPaperSx(width),
            ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
          ],
        },
      }}
    >
      {children}
    </Drawer>
  );
}
