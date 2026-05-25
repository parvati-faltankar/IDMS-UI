import type { AdminSetupAssistantProps, AdminSetupItem, AdminSetupStatus } from "./AdminSetupAssistant.types";

const statusLabel: Record<AdminSetupStatus, string> = {
  complete: "Complete",
  "in-progress": "In progress",
  "not-started": "Not started",
  "needs-attention": "Needs attention",
};

const statusClassName: Record<AdminSetupStatus, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "in-progress": "border-blue-200 bg-blue-50 text-blue-700",
  "not-started": "border-slate-200 bg-slate-50 text-slate-600",
  "needs-attention": "border-amber-200 bg-amber-50 text-amber-700",
};

function getProgress(items: AdminSetupItem[]) {
  if (items.length === 0) return 0;
  const complete = items.filter((item) => item.status === "complete").length;
  return Math.round((complete / items.length) * 100);
}

function getRecommendedItem(items: AdminSetupItem[]) {
  return (
    items.find((item) => item.status === "needs-attention") ??
    items.find((item) => item.status === "in-progress") ??
    items.find((item) => item.status === "not-started")
  );
}

export function AdminSetupAssistant({
  title = "Admin setup assistant",
  description = "Complete the essential setup areas before users begin transaction work.",
  items,
  onOpenItem,
}: AdminSetupAssistantProps) {
  const progress = getProgress(items);
  const recommended = getRecommendedItem(items);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <div className="min-w-40 rounded-xl bg-[var(--color-surface-subtle)] p-3 text-center">
          <div className="text-2xl font-semibold text-[var(--color-text)]">{progress}%</div>
          <div className="text-xs text-[var(--color-text-muted)]">setup complete</div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
        <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {recommended && (
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Recommended next</p>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{recommended.label}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{recommended.description}</p>
            </div>
            {onOpenItem && (
              <button
                type="button"
                onClick={() => onOpenItem(recommended)}
                className="rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onOpenItem?.(item)}
            className="rounded-xl border border-[var(--color-border)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClassName[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-[var(--color-text-muted)]">{item.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
