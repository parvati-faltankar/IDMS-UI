import type { CSSProperties } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

const MASTER_OVERLAY_MASK = 'rgba(15, 23, 42, 0.24)';
const MASTER_OVERLAY_SHADOW = '0 20px 50px rgba(15, 23, 42, 0.22)';

export function getMasterOverlayBackdropSx(): SxProps<Theme> {
  return {
    backgroundColor: MASTER_OVERLAY_MASK,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  };
}

export function getMasterDrawerPaperSx(width: number): SxProps<Theme> {
  return {
    width: `min(${width}px, 100vw)`,
    borderLeft: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    backgroundImage: 'none',
    boxShadow: MASTER_OVERLAY_SHADOW,
    overflowX: 'hidden',
  };
}

export function getMasterDialogPaperSx(width: number): SxProps<Theme> {
  return {
    width: `min(${width}px, calc(100vw - 32px))`,
    m: 2,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '16px',
    backgroundColor: 'background.paper',
    backgroundImage: 'none',
    boxShadow: MASTER_OVERLAY_SHADOW,
  };
}

export const MASTER_OVERLAY_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: MASTER_OVERLAY_MASK,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

export const MASTER_SIDE_OVERLAY_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1600,
  display: 'flex',
  justifyContent: 'flex-end',
  background: MASTER_OVERLAY_MASK,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

export const MASTER_POPUP_SURFACE_STYLE: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  boxShadow: MASTER_OVERLAY_SHADOW,
};

export const MASTER_SIDE_PANEL_STYLE: CSSProperties = {
  width: 'min(520px, 100vw)',
  height: '100%',
  background: 'var(--color-surface)',
  borderLeft: '1px solid var(--color-border)',
  boxShadow: MASTER_OVERLAY_SHADOW,
  display: 'flex',
  flexDirection: 'column',
};
