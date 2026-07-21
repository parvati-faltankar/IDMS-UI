import { CircleHelp } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FieldHelpPopoverProps } from './FieldHelpPopover.types';

export function FieldHelpPopover({ title, description, example }: FieldHelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const tooltipId = useId();
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, width: 320 });

  const sections = description
    .split('\n\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(':');
      if (separatorIndex === -1) {
        return { label: '', body: entry };
      }

      return {
        label: entry.slice(0, separatorIndex).trim(),
        body: entry.slice(separatorIndex + 1).trim(),
      };
    });

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openPopover = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closePopoverSoon = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 140);
  };

  useEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const maxWidth = Math.min(360, window.innerWidth - 24);
      const nextLeft = Math.min(
        Math.max(12, rect.left - 18),
        Math.max(12, window.innerWidth - maxWidth - 12),
      );

      setPopoverPosition({
        top: Math.min(rect.bottom + 10, window.innerHeight - 24),
        left: nextLeft,
        width: maxWidth,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

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

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <span
      ref={popoverRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={openPopover}
      onMouseLeave={closePopoverSoon}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Help for ${title}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((value) => !value)}
        onFocus={openPopover}
        onBlur={closePopoverSoon}
        style={{
          marginLeft: '4px',
          display: 'inline-flex',
          width: '16px',
          height: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <CircleHelp size={13} />
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          onMouseEnter={openPopover}
          onMouseLeave={closePopoverSoon}
          style={{
            position: 'fixed',
            left: `${popoverPosition.left}px`,
            top: `${popoverPosition.top}px`,
            zIndex: 1400,
            width: `${popoverPosition.width}px`,
            maxHeight: 'min(360px, calc(100vh - 36px))',
            overflowY: 'auto',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: '14px 14px 12px',
            textAlign: 'left',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
          }}
        >
          <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
            {title}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {sections.map((section) => (
              <div key={`${section.label}-${section.body}`} style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--color-text-muted)' }}>
                {section.label ? (
                  <>
                    <span style={{ display: 'block', fontWeight: 700, color: 'var(--color-text)' }}>
                      {section.label}
                    </span>
                    <span style={{ display: 'block', marginTop: '2px' }}>
                      {section.body}
                    </span>
                  </>
                ) : (
                  <span>{section.body}</span>
                )}
              </div>
            ))}
          </div>
          {example && (
            <span
              style={{
                display: 'block',
                marginTop: '12px',
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
