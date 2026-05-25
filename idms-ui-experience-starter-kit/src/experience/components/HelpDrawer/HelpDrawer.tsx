import type { HelpDrawerProps } from "./HelpDrawer.types";

export function HelpDrawer({ open, topic, onClose, titleFallback = "Help & Guidance" }: HelpDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close help" onClick={onClose} />
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Help</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              {topic?.title ?? titleFallback}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
          >
            Close
          </button>
        </div>

        {topic ? (
          <div className="space-y-6">
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">{topic.summary}</p>

            {topic.steps && topic.steps.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Recommended steps</h3>
                <ol className="space-y-3">
                  {topic.steps.map((step, index) => (
                    <li key={`${step.title}-${index}`} className="flex gap-3 rounded-xl border border-[var(--color-border)] p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-xs font-semibold text-[var(--color-text)]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{step.title}</p>
                        {step.description && (
                          <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">{step.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {topic.tips && topic.tips.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Useful tips</h3>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--color-text-muted)]">
                  {topic.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </section>
            )}

            {topic.commonMistakes && topic.commonMistakes.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">Common mistakes</h3>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-amber-800">
                  {topic.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            No help topic is configured for this page yet. Add a topic in src/experience/help/helpTopics.ts.
          </p>
        )}
      </aside>
    </div>
  );
}
