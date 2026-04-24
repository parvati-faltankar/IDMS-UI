import Button, { type ButtonProps } from '@mui/material/Button';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import { cn } from '../../utils/classNames';

type AppButtonTone = 'primary' | 'secondary' | 'outline' | 'ghost';
type AppButtonSize = 'md' | 'sm';

export interface AppButtonProps extends Omit<ButtonProps, 'variant' | 'color' | 'size'> {
  tone?: AppButtonTone;
  size?: AppButtonSize;
}

function inferTone(className?: string, tone?: AppButtonTone): AppButtonTone {
  if (tone) {
    return tone;
  }

  if (className?.includes('btn--secondary')) {
    return 'secondary';
  }

  if (className?.includes('btn--outline')) {
    return 'outline';
  }

  if (className?.includes('btn--ghost')) {
    return 'ghost';
  }

  return 'primary';
}

function inferSize(className?: string, size?: AppButtonSize): AppButtonSize {
  if (size) {
    return size;
  }

  return className?.includes('btn--sm') ? 'sm' : 'md';
}

function toneStyles(tone: AppButtonTone): SxProps<Theme> {
  return (theme) => {
    if (tone === 'secondary') {
      return {
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        '&:hover': {
          borderColor: theme.palette.primary.light,
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.06),
        },
      };
    }

    if (tone === 'outline') {
      return {
        border: `1px solid ${theme.palette.primary.main}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.primary.main,
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
        },
      };
    }

    if (tone === 'ghost') {
      return {
        border: '1px solid transparent',
        backgroundColor: 'transparent',
        color: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08),
        },
      };
    }

    return {
      border: '1px solid transparent',
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    };
  };
}

export default function AppButton({
  tone,
  size,
  className,
  sx,
  children,
  ...props
}: AppButtonProps) {
  const resolvedTone = inferTone(className, tone);
  const resolvedSize = inferSize(className, size);

  return (
    <Button
      {...props}
      size={resolvedSize === 'sm' ? 'small' : 'medium'}
      className={cn(
        'btn',
        resolvedTone === 'primary' && 'btn--primary',
        resolvedTone === 'secondary' && 'btn--secondary',
        resolvedTone === 'outline' && 'btn--outline',
        resolvedTone === 'ghost' && 'btn--ghost',
        resolvedSize === 'sm' && 'btn--sm',
        className
      )}
      sx={[toneStyles(resolvedTone), ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {children}
    </Button>
  );
}
