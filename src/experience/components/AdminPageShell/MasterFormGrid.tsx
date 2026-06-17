import type React from 'react';

type MasterFormGridProps = {
  columns?: 1 | 2 | 3;
  variant?: 'default' | 'identity' | 'details' | 'financial' | 'full-width';
  gap?: string;
  children: React.ReactNode;
};

export function MasterFormGrid({
  columns = 2,
  variant = 'default',
  gap = '16px',
  children,
}: MasterFormGridProps) {
  let templateColumns = columns === 3 ? 'repeat(3, minmax(0, 1fr))' : columns === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  if (variant === 'identity') {
    templateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  } else if (variant === 'details') {
    templateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
  } else if (variant === 'financial') {
    templateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
  } else if (variant === 'full-width') {
    templateColumns = '1fr';
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: templateColumns,
        gap,
      }}
    >
      {children}
    </div>
  );
}
