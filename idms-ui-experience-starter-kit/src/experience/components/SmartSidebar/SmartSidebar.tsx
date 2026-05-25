import { useState } from "react";
import type { NavigationGroup, NavigationItem } from "../../navigation/navigationTypes";
import type { SmartSidebarProps } from "./SmartSidebar.types";

function SidebarItem({ item, activePath, onNavigate }: { item: NavigationItem; activePath?: string; onNavigate?: (item: NavigationItem) => void }) {
  const active = activePath === item.path;
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(item)}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
        active ? "bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
      }`}
    >
      {item.label}
    </button>
  );
}

function SidebarGroup({ group, activePath, onNavigate }: { group: NavigationGroup; activePath?: string; onNavigate?: (item: NavigationItem) => void }) {
  const [open, setOpen] = useState(group.id === "admin-setup");

  return (
    <section className="border-b border-[var(--color-border)] py-2 last:border-b-0">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]">
        <span>{group.label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? "−" : "+"}</span>
      </button>
      {group.description && <p className="px-3 pb-2 text-xs leading-5 text-[var(--color-text-muted)]">{group.description}</p>}
      {open && (
        <div className="space-y-1 pb-2">
          {group.items.map((item) => <SidebarItem key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} />)}
        </div>
      )}
    </section>
  );
}

export function SmartSidebar({ groups, activePath, favorites = [], recentItems = [], onNavigate }: SmartSidebarProps) {
  return (
    <aside className="h-full w-72 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-4 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">Navigation</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--color-text)]">Workspace</h2>
      </div>

      {favorites.length > 0 && (
        <section className="mb-3 rounded-xl bg-[var(--color-surface-subtle)] p-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Favorites</p>
          {favorites.map((item) => <SidebarItem key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} />)}
        </section>
      )}

      {recentItems.length > 0 && (
        <section className="mb-3 rounded-xl bg-[var(--color-surface-subtle)] p-2">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Recently visited</p>
          {recentItems.map((item) => <SidebarItem key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} />)}
        </section>
      )}

      <div className="rounded-xl border border-[var(--color-border)]">
        {groups.map((group) => <SidebarGroup key={group.id} group={group} activePath={activePath} onNavigate={onNavigate} />)}
      </div>
    </aside>
  );
}
