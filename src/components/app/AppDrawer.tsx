import Drawer from '@mui/material/Drawer';
import type { SxProps, Theme } from '@mui/material/styles';

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
          sx: {
            backgroundColor: backdropColor,
          },
        },
        paper: {
          sx: [
            {
              width: `min(${width}px, 100vw)`,
              borderLeft: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              boxShadow: (theme: Theme) => theme.shadows[8],
              backgroundImage: 'none',
              overflowX: 'hidden',
            },
            ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : []),
          ],
        },
      }}
    >
      {children}
    </Drawer>
  );
}
