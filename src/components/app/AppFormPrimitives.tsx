import { alpha, styled, type Theme } from '@mui/material/styles';

interface AppPrimitiveProps {
  hasError?: boolean;
}

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

function controlStyles() {
  return ({ theme, hasError = false }: { theme: Theme; hasError?: boolean }) => ({
    width: '100%',
    border: `1px solid ${hasError ? theme.palette.error.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontFamily: 'inherit',
    fontSize: theme.typography.pxToRem(14),
    lineHeight: '24px',
    transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
    '&::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
    '&:hover': {
      borderColor: hasError
        ? theme.palette.error.main
        : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.34 : 0.24),
    },
    '&:focus': {
      outline: 'none',
      borderColor: hasError ? theme.palette.error.main : theme.palette.primary.main,
      boxShadow: 'none',
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.secondary,
      cursor: 'not-allowed',
    },
  });
}

export const AppInputPrimitive = styled('input', {
  shouldForwardProp: (prop) => prop !== 'hasError',
})<AppPrimitiveProps>(({ theme, hasError = false }) => ({
  ...controlStyles()({ theme, hasError }),
  minHeight: 40,
  padding: '8px 12px',
}));

export const AppSelectPrimitive = styled('select', {
  shouldForwardProp: (prop) => prop !== 'hasError',
})<AppPrimitiveProps>(({ theme, hasError = false }) => ({
  ...controlStyles()({ theme, hasError }),
  minHeight: 40,
  padding: '8px 36px 8px 12px',
  appearance: 'none',
  backgroundImage: selectArrow,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '14px 14px',
}));

export const AppTextareaPrimitive = styled('textarea', {
  shouldForwardProp: (prop) => prop !== 'hasError',
})<AppPrimitiveProps>(({ theme, hasError = false }) => ({
  ...controlStyles()({ theme, hasError }),
  minHeight: 96,
  padding: 12,
  resize: 'vertical',
}));
