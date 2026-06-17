import type React from 'react';

type HeaderIconButtonProps = {
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  title: string;
  active?: boolean;
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  minWidth: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  flexShrink: 0,
};

export function HeaderIconButton({
  icon,
  onClick,
  href,
  title,
  active = false,
}: HeaderIconButtonProps) {
  const style: React.CSSProperties = {
    ...baseStyle,
    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
    background: active
      ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))'
      : 'var(--color-surface)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  };

  if (href) {
    return (
      <a href={href} style={style} title={title} aria-label={title}>
        {icon}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style} title={title} aria-label={title}>
      {icon}
    </button>
  );
}
