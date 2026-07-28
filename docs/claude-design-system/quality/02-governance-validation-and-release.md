---
title: Governance, Validation, and Release
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Governance, Validation, and Release

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-GOV-001` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS`, `SRC-TARGET-DOC-GOVERNANCE` | Requirement rows require ID, status, evidence, behavior, responsive rule, accessibility rule, acceptance criteria, and gap note. | Responsive behavior is explicit for every row. | Accessibility rule is explicit for every row. | Static review confirms every major file has a requirement table. | None |
| `DS-GOV-002` | `ADOPTED` | `SRC-REPO-DOC-PAGE-STRUCTURE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Review gates check status validity, source validity, WordPress parity, screenshot stability, component catalog coverage, and gap register coverage. | Responsive claims need evidence or target label. | Accessibility claims need pass/fail wording. | Release checklist has zero invalid statuses and zero temp screenshot paths. | None |
| `DS-GOV-003` | `TARGET` | `SRC-TARGET-PUBLISH-GOVERNANCE` | Target design-system release flow includes draft, review, approve, publish, archive, and version notes. | Release applies to docs; runtime behavior is separate unless code changes are approved. | Review notes are readable and not color-only. | Pack version increments when requirements materially change. | Process not automated. |
| `DS-GOV-004` | `ADOPTED` | `SRC-TARGET-CLAUDE-STRICTNESS` | Claude-readiness requires enough information to design without guessing core control behavior. | Responsive controls state inheritance, override, reset, and active viewport. | Keyboard and focus behavior are stated for interactive surfaces. | Dry-run matrix below passes for admin list, heading editor, and global theme settings. | None |
| `DS-GOV-005` | `ADOPTED` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-SHOT-001`, `SRC-SHOT-003`, `SRC-WP-GLOBAL-STYLES` | Release validation includes dry-run scenarios before the pack is approved as Claude source of truth. | Dry-runs cover non-responsive admin flow, responsive builder flow, and global style flow. | Each dry-run checks labels, focus, state text, and non-color-only communication. | Each scenario below has pass/fail criteria and no unresolved core behavior guessing. | None |

## Dry-Run Validation Matrix

| Scenario | Required Inputs | Expected Claude Output | Pass Criteria |
|---|---|---|---|
| Admin list page | `CURRENT` only; `AdminListPageShell`; table, search, quick filters, help path | Uses app chrome, one admin list shell, toolbar, summary, grid/table, empty state, and HelpDrawer path | Does not invent target builder controls; no duplicate header or page-local command palette. |
| Responsive heading inspector | `ADOPTED` plus `TARGET`; `SRC-SHOT-001`, `SRC-SHOT-002`, `SRC-SHOT-003`, `SRC-SHOT-004` | Content/Style/Advanced inspector, layout controls, typography popover, viewport toolbar, inherited/overridden states | Marks runtime implementation as not guaranteed unless matching code evidence is supplied. |
| Global theme settings | `CURRENT` plus `ADOPTED`; `SRC-REPO-CODE-THEME`, `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON` | Separates settings, styles, presets, global defaults, component defaults, local overrides, and publish limits | Does not claim backend governance or breakpoint persistence as current. |