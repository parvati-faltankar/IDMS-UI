import { useState } from 'react';
import { Info } from 'lucide-react';

export interface RuleExplanationPopoverProps {
  title: string;
  body: string;
}

export function RuleExplanationPopover({
  title,
  body,
}: RuleExplanationPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        aria-label={title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Info size={11} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            right: 0,
            width: '260px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)',
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {body}
          </div>
        </div>
      )}
    </span>
  );
}
