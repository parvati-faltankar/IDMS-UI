import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { CommandPaletteProps } from './CommandPalette.types';
import type { CommandItem } from '../../navigation/navigationTypes';

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  commands,
  onClose,
  onExecute,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filtered = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = [cmd.label, cmd.description, ...(cmd.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [filtered]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[activeIndex] ?? filtered[0];
      if (cmd) {
        onExecute(cmd);
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 0,
          background: 'rgb(15 23 42 / 36%)',
          cursor: 'default',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: 'min(580px, calc(100vw - 32px))',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          background: 'var(--color-surface)',
          boxShadow: '0 20px 48px rgb(15 23 42 / 18%)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 14px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls="cmd-palette-list"
            aria-activedescendant={activeIndex >= 0 ? `cmd-item-${activeIndex}` : undefined}
            style={{
              flex: 1,
              height: '48px',
              border: 0,
              background: 'transparent',
              color: 'var(--color-text)',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-muted)',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Esc
          </span>
        </div>

        {/* Results */}
        <div
          id="cmd-palette-list"
          role="listbox"
          ref={listRef}
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            padding: '6px',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '13px',
              }}
            >
              No matching command found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={cmd.id}
                  id={`cmd-item-${idx}`}
                  data-cmd-index={idx}
                  role="option"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => {
                    onExecute(cmd);
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                    border: `1px solid ${isActive ? 'var(--color-border)' : 'transparent'}`,
                    borderRadius: '8px',
                    background: isActive ? 'var(--color-surface-subtle)' : 'transparent',
                    color: 'var(--color-text)',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease, border-color 0.1s ease',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        lineHeight: '20px',
                        fontWeight: 500,
                        color: 'var(--color-text)',
                      }}
                    >
                      {cmd.label}
                    </div>
                    {cmd.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          lineHeight: '16px',
                          color: 'var(--color-text-muted)',
                          marginTop: '1px',
                        }}
                      >
                        {cmd.description}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      background: 'var(--color-surface-subtle)',
                      color: 'var(--color-text-muted)',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {cmd.actionType === 'navigate' ? 'Go' : cmd.actionType === 'open-help' ? 'Help' : 'Create'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 14px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          <span><kbd style={{ fontFamily: 'inherit' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>↵</kbd> select</span>
          <span><kbd style={{ fontFamily: 'inherit' }}>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
