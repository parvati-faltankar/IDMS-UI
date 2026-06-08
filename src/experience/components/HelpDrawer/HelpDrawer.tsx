import React, { useEffect, useId, useMemo, useRef } from 'react';
import { getHelpTopic } from '../../help/helpTopics';
import type { HelpDrawerProps } from './HelpDrawer.types';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  justifyContent: 'flex-end',
  background: 'rgba(15, 23, 42, 0.22)',
};

const panelStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
  width: 'min(420px, 100vw)',
  overflowY: 'auto',
  borderLeft: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  padding: '24px',
  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.24)',
};

const closeButtonStyle: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--color-text-muted)',
  background: 'var(--color-surface)',
  cursor: 'pointer',
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}

export function HelpDrawer({
  open,
  topic,
  onClose,
  titleFallback = 'Help & Guidance',
  onTopicChange,
}: HelpDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const sections = useMemo(() => {
    if (!topic) return null;
    return {
      steps: topic.steps ?? [],
      tips: topic.tips ?? [],
      commonMistakes: topic.commonMistakes ?? [],
      relatedTopics: topic.relatedTopics ?? [],
    };
  }, [topic]);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
        aria-label="Close help"
        onClick={onClose}
      />
      <aside ref={panelRef} style={panelStyle}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
              Help
            </p>
            <h2 id={titleId} style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
              {topic?.title ?? titleFallback}
            </h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>

        {topic && sections ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>{topic.summary}</p>

            {sections.steps.length > 0 && (
              <section>
                <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Recommended steps
                </h3>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '12px' }}>
                  {sections.steps.map((step, index) => (
                    <li key={`${step.title}-${index}`} style={{ display: 'flex', gap: '12px', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '14px' }}>
                      <span style={{ display: 'inline-flex', width: '24px', height: '24px', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: 'var(--color-surface-subtle)', color: 'var(--color-text)', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {index + 1}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{step.title}</p>
                        {step.description && (
                          <p style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                            {step.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {sections.tips.length > 0 && (
              <section>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Useful tips
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px', fontSize: '13px', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
                  {sections.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}

            {sections.commonMistakes.length > 0 && (
              <section
                style={{
                  borderRadius: '14px',
                  border: '1px solid color-mix(in srgb, #f59e0b 30%, var(--color-border))',
                  background: 'color-mix(in srgb, #f59e0b 8%, var(--color-surface))',
                  padding: '16px',
                }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'color-mix(in srgb, #f59e0b 80%, var(--color-text))' }}>
                  Common mistakes
                </h3>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px', fontSize: '13px', lineHeight: 1.7, color: 'color-mix(in srgb, #f59e0b 70%, var(--color-text-muted))' }}>
                  {sections.commonMistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </section>
            )}

            {sections.relatedTopics.length > 0 && (
              <section>
                <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Related topics
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sections.relatedTopics.map((id) => {
                    const related = getHelpTopic(id);
                    const label = related?.title ?? id;

                    return onTopicChange ? (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onTopicChange(id)}
                        style={{
                          borderRadius: '999px',
                          border: '1px solid var(--color-border)',
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: 'var(--color-primary)',
                          background: 'var(--color-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    ) : (
                      <span
                        key={id}
                        style={{
                          borderRadius: '999px',
                          border: '1px solid var(--color-border)',
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
            No help content is configured for this page. Add a topic in `src/experience/help/helpTopics.ts`.
          </p>
        )}
      </aside>
    </div>
  );
}
