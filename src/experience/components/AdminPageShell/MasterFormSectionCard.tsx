import type React from 'react';

type MasterFormSectionCardProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function MasterFormSectionCard({
  title,
  description,
  actions,
  children,
}: MasterFormSectionCardProps) {
  return (
    <section
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--color-surface)',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-subtle)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: 1.35,
              color: 'var(--color-text)',
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-text-muted)',
              }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: '20px 24px', background: 'var(--color-surface)' }}>
        {children}
      </div>
    </section>
  );
}
