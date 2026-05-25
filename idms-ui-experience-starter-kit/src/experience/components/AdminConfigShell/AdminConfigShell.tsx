import type { AdminConfigShellProps, AdminConfigSection } from "./AdminConfigShell.types";
import { PageHeader } from "../PageHeader/PageHeader";

const sectionStatusIcon: Record<NonNullable<AdminConfigSection["status"]>, string> = {
  complete: "✓",
  "in-progress": "●",
  "not-started": "○",
};

export function AdminConfigShell({
  title,
  description,
  breadcrumbs = ["Admin"],
  statusLabel = "Draft",
  helpTopicId,
  sections,
  activeSectionId,
  primaryAction,
  secondaryActions,
  onHelpClick,
  aside,
  children,
}: AdminConfigShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        statusLabel={statusLabel}
        statusTone={statusLabel === "Active" ? "active" : statusLabel === "Inactive" ? "danger" : "draft"}
        helpTopicId={helpTopicId}
        onHelpClick={onHelpClick}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <nav className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sections</p>
          <div className="space-y-1">
            {sections.map((section) => {
              const active = section.id === activeSectionId;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={section.onClick}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    active ? "bg-[var(--color-surface-subtle)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span>{section.status ? sectionStatusIcon[section.status] : "•"}</span>
                    {section.label}
                  </span>
                  {section.description && <span className="mt-1 block text-xs leading-5 opacity-80">{section.description}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="min-w-0">{children}</main>

        {aside && <aside className="hidden xl:block">{aside}</aside>}
      </div>
    </div>
  );
}
