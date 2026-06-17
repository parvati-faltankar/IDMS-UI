import type React from 'react';

type MasterFormSectionSummaryProps = {
  items: Array<React.ReactNode | null | undefined | false>;
};

export function MasterFormSectionSummary({
  items,
}: MasterFormSectionSummaryProps) {
  const visibleItems = items.filter(Boolean);

  if (visibleItems.length === 0) {
    return (
      <span
        style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        No details added yet.
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 12px',
        fontSize: '12px',
        lineHeight: 1.45,
        color: 'var(--color-text-muted)',
      }}
    >
      {visibleItems.map((item, index) => (
        <span key={index}>
          {item}
        </span>
      ))}
    </div>
  );
}
