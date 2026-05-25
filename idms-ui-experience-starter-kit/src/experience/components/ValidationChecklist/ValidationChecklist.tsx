import type { ValidationChecklistProps, ValidationChecklistStatus } from "./ValidationChecklist.types";

const statusMeta: Record<ValidationChecklistStatus, { label: string; className: string; icon: string }> = {
  pass: { label: "Passed", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: "✓" },
  fail: { label: "Needs fix", className: "border-red-200 bg-red-50 text-red-700", icon: "!" },
  pending: { label: "Pending", className: "border-slate-200 bg-slate-50 text-slate-600", icon: "○" },
};

export function ValidationChecklist({ title = "Validation checklist", description, items }: ValidationChecklistProps) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
      {description && <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>}
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const meta = statusMeta[item.status];
          const Wrapper = item.onClick ? "button" : "div";
          return (
            <Wrapper
              key={item.id}
              type={item.onClick ? "button" : undefined}
              onClick={item.onClick}
              className="flex w-full items-start gap-3 rounded-xl border border-[var(--color-border)] p-3 text-left"
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${meta.className}`}>
                {meta.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--color-text)]">{item.label}</span>
                {item.description && <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{item.description}</span>}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}>{meta.label}</span>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
