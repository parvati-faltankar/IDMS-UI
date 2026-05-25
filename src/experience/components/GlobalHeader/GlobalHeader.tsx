import React from 'react';
import type { GlobalHeaderProps } from './GlobalHeader.types';

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  appName = 'Admin',
  onOpenCommandPalette,
  onOpenHelp,
  rightSlot,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        height: '52px',
        padding: '0 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      {/* Left: app identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.02em',
            flexShrink: 0,
          }}
        >
          ID
        </div>
        <div>
          <div
            style={{
              color: 'var(--color-text)',
              fontSize: '14px',
              lineHeight: '20px',
              fontWeight: 600,
            }}
          >
            {appName}
          </div>
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '11px',
              lineHeight: '16px',
              display: 'none',
            }}
          >
            Enterprise workspace
          </div>
        </div>
      </div>

      {/* Center: command palette trigger */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flex: '0 1 480px',
          minWidth: 0,
          height: '34px',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-muted)',
          padding: '0 10px',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
          e.currentTarget.style.background = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.background = 'var(--color-surface-subtle)';
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>Search or type a command...</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            padding: '0 5px',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Ctrl K
        </span>
      </button>

      {/* Right: help + rightSlot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Open help"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.5-1.2 1.8L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="currentColor" />
            </svg>
          </button>
        )}
        {rightSlot}
      </div>
    </div>
  );
};

export default GlobalHeader;
