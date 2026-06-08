import { useEffect, useId, useRef, useState } from 'react';
import type { FieldHelpPopoverProps } from './FieldHelpPopover.types';

export function FieldHelpPopover({ title, description, example }: FieldHelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  return (
    <span ref={popoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        aria-label={`Help: ${title}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((value) => !value)}
        style={{
          marginLeft: '6px',
          display: 'inline-flex',
          width: '20px',
          height: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ?
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            left: 0,
            top: '28px',
            zIndex: 30,
            width: '288px',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: '12px',
            textAlign: 'left',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
          }}
        >
          <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
            {title}
          </span>
          <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
            {description}
          </span>
          {example && (
            <span
              style={{
                display: 'block',
                marginTop: '10px',
                borderRadius: '10px',
                background: 'var(--color-surface-subtle)',
                padding: '10px',
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'var(--color-text-muted)',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Example: </span>
              {example}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
