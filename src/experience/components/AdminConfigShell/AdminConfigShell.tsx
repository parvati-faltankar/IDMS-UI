import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { AdminConfigShellProps, AdminConfigSectionItem } from './AdminConfigShell.types';

function SectionNavButton({
  section,
  isActive,
  onClick,
}: {
  section: AdminConfigSectionItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;
  const isComplete = section.completionStatus === 'complete' || section.showCheckmark;
  const hasBadge = !isComplete && (section.badgeCount ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        border: 'none',
        background: isActive ? 'var(--color-surface-hover)' : 'transparent',
        cursor: 'pointer',
        borderInlineStart: `3px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {Icon && (
        <Icon
          size={15}
          style={{
            flexShrink: 0,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
            lineHeight: 1.3,
          }}
        >
          {section.label}
        </div>
        {section.description && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {section.description}
          </div>
        )}
      </div>
      {isComplete ? (
        <CheckCircle2 size={16} style={{ flexShrink: 0, color: 'color-mix(in srgb, #10b981 90%, var(--color-text))' }} />
      ) : hasBadge ? (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '9999px',
            background: 'color-mix(in srgb, var(--color-danger) 12%, var(--color-surface))',
            color: 'var(--color-danger)',
            flexShrink: 0,
          }}
        >
          {section.badgeCount}
        </span>
      ) : (
        <ChevronRight
          size={16}
          style={{
            flexShrink: 0,
            color: isActive ? 'var(--color-primary)' : 'var(--color-border)',
            strokeWidth: isActive ? 2.5 : 1.5,
          }}
        />
      )}
    </button>
  );
}

/**
 * AdminConfigShell — standard two-pane layout for admin configuration pages.
 * Provides a section navigation sidebar on the left and a scrollable content
 * area on the right. Designed to be composed inside a flex-column container.
 */
export function AdminConfigShell({
  sections,
  activeSection,
  onSectionChange,
  progress,
  children,
}: AdminConfigShellProps) {
  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* ── Left: section navigator ── */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          borderInlineEnd: '1px solid var(--color-border)',
          overflowY: 'auto',
        }}
      >
        {/* Section nav list */}
        <div style={{ flex: 1, paddingTop: '8px' }}>
          {sections.map((section) => (
            <SectionNavButton
              key={section.key}
              section={section}
              isActive={activeSection === section.key}
              onClick={() => onSectionChange(section.key)}
            />
          ))}
        </div>

        {/* Progress bar */}
        {progress && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '7px',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Progress
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                }}
              >
                {progress.completed}/{progress.total}
              </span>
            </div>
            <div
              style={{
                height: '3px',
                background: 'var(--color-border)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--color-primary)',
                  borderRadius: '9999px',
                  width: `${progressPct}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}
      </aside>

      {/* ── Right: content area ── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 36px)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
