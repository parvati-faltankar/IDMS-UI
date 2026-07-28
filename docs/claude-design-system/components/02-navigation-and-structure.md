---
title: Navigation and Structure
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Navigation and Structure

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-NAV-001` | `CURRENT` | `SRC-REPO-DOC-ADMIN-SPEC`, `SRC-REPO-CODE-COMPONENTS` | `AppShell`, `AppTopHeader`, and `AppSidebar` provide the global app frame. | Sidebar may collapse or overlay depending on viewport. | Header and sidebar controls expose names and expanded state. | Generated current-state app screens use the existing global frame. | None |
| `DS-COMP-NAV-002` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-PAGE-STRUCTURE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Admin pages use one approved page shell: `AdminListPageShell`, `AdminPageShell`, or `AdminConfigShell`. | List shells prioritize table visibility; config shells prioritize completion. | Page title and help action are reachable by keyboard. | No generated admin page duplicates PageHeader or global shell. | None |
| `DS-COMP-NAV-003` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-003` | Builder/editor structure separates left inspector, top toolbar, and canvas. | Toolbar controls active viewport; inspector remains tied to selected element. | Inspector tabs and toolbar buttons are keyboard navigable. | Builder designs show inspector, toolbar, and canvas regions clearly. | Current implementation not guaranteed. |
| `DS-COMP-NAV-004` | `DEPRECATED` | `SRC-REPO-DOC-PAGE-STRUCTURE` | Duplicate inner global headers and page-level command palettes are disallowed. | Deprecated shell variants are not used as mobile shortcuts. | Deprecated controls do not replace accessible navigation. | Static review finds no new design using duplicate shell chrome. | None |
