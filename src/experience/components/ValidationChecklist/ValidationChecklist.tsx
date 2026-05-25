import { Check, CheckCircle2, ChevronRight, X } from 'lucide-react';
import type { ValidationChecklistItem, ValidationChecklistProps } from './ValidationChecklist.types';

function ChecklistItemRow({
  item,
  onNavigate,
}: {
  item: ValidationChecklistItem;
  onNavigate?: (key: string) => void;
}) {
  const isOk = item.status === 'ok';
  const canClick = !!onNavigate && !!item.sectionKey;

  return (
    <div
      style={{
        border: `1px solid ${isOk
          ? 'color-mix(in srgb, #10b981 35%, var(--color-border))'
          : 'color-mix(in srgb, var(--color-danger) 35%, var(--color-border))'}`,
        borderRadius: '10px',
        overflow: 'hidden',
        cursor: canClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => canClick && onNavigate!(item.sectionKey!)}
      title={canClick ? `Go to ${item.sectionKey}` : undefined}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: isOk
            ? 'color-mix(in srgb, #10b981 10%, var(--color-surface))'
            : 'color-mix(in srgb, var(--color-danger) 8%, var(--color-surface))',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isOk
              ? 'color-mix(in srgb, #10b981 20%, var(--color-surface))'
              : 'color-mix(in srgb, var(--color-danger) 18%, var(--color-surface))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isOk ? (
            <Check size={14} style={{ color: 'color-mix(in srgb, #10b981 90%, var(--color-text))' }} />
          ) : (
            <X size={14} style={{ color: 'var(--color-danger)' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isOk
                ? 'color-mix(in srgb, #10b981 85%, var(--color-text))'
                : 'var(--color-danger)',
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: isOk
                ? 'color-mix(in srgb, #10b981 70%, var(--color-text-muted))'
                : 'color-mix(in srgb, var(--color-danger) 75%, var(--color-text-muted))',
              marginTop: '2px',
            }}
          >
            {item.detail}
          </div>
        </div>
        {canClick && (
          <ChevronRight
            size={14}
            style={{
              color: isOk
                ? 'color-mix(in srgb, #10b981 70%, var(--color-text-muted))'
                : 'color-mix(in srgb, var(--color-danger) 70%, var(--color-text-muted))',
              flexShrink: 0
            }}
          />
        )}
      </div>

      {(item.errors?.length ?? 0) > 0 && (
        <div
          style={{
            padding: '8px 16px 10px 56px',
            background: 'color-mix(in srgb, var(--color-danger) 6%, var(--color-surface))',
            borderTop: '1px solid color-mix(in srgb, var(--color-danger) 30%, var(--color-border))',
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {item.errors!.map((e, i) => (
              <li
                key={i}
                style={{
                  fontSize: '11px',
                  color: 'color-mix(in srgb, var(--color-danger) 80%, var(--color-text))',
                  marginBottom: '2px',
                  lineHeight: 1.4,
                }}
              >
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * ValidationChecklist — displays activation requirements as a list of
 * checkable items with ok/error/warn status indicators. Clicking an item
 * navigates the user to the relevant config section.
 */
export function ValidationChecklist({
  items,
  onNavigateToSection,
  canActivate = false,
  isReadOnly = false,
  onActivate,
}: ValidationChecklistProps) {
  const okCount = items.filter((i) => i.status === 'ok').length;
  const allOk = okCount === items.length;

  return (
    <div>
      {/* Checklist items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {items.map((item) => (
          <ChecklistItemRow
            key={item.key}
            item={item}
            onNavigate={onNavigateToSection}
          />
        ))}
      </div>

      {/* Activation summary bar */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: allOk
            ? 'color-mix(in srgb, #10b981 10%, var(--color-surface))'
            : 'var(--color-surface-subtle)',
          border: `1px solid ${allOk
            ? 'color-mix(in srgb, #10b981 35%, var(--color-border))'
            : 'var(--color-border)'}`,

          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: allOk
                ? 'color-mix(in srgb, #10b981 85%, var(--color-text))'
                : 'var(--color-text)',
            }}
          >
            {allOk
              ? '✅ All requirements met — ready to activate'
              : `${okCount} of ${items.length} requirements met`}
          </div>
          {!allOk && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginTop: '3px',
              }}
            >
              Click a failed item above to jump to the relevant section and fix it.
            </div>
          )}
        </div>
        {!isReadOnly && canActivate && (
          <button
            type="button"
            onClick={onActivate}
            disabled={!allOk}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: allOk ? 'var(--color-primary)' : 'var(--color-border)',
              color: allOk ? 'var(--color-primary-contrast)' : 'var(--color-text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: allOk ? 'pointer' : 'not-allowed',
              opacity: allOk ? 1 : 0.4,
            }}
          >
            <CheckCircle2 size={13} />
            Activate
          </button>
        )}
      </div>
    </div>
  );
}
