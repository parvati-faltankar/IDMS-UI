---
title: Page and Workflow Patterns
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Page and Workflow Patterns

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-PATTERN-PAGE-001` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-PAGE-STRUCTURE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Admin list pages use compact list shell patterns with search, filters, summary, table, empty state, and help. | List pages preserve data visibility on standard laptop and mobile layouts. | Search, filters, table headers, and row actions are keyboard reachable. | Claude admin list designs use `AdminListPageShell` when appropriate. | Some generic masters still use older shell patterns. |
| `DS-PATTERN-PAGE-002` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Admin form/config pages use `AdminPageShell` or `AdminConfigShell` with page identity, status, help, validation, and actions. | Section navigation may collapse for smaller viewports. | Help topic and validation navigation are accessible. | Claude form/config designs select exactly one page shell. | None |
| `DS-PATTERN-PAGE-003` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Catalogue workflows combine metrics, toolbar actions, grid, preview, filters, and saved views. | Table, card, and split views adapt by viewport. | View mode and filter controls have textual state. | Catalogue design uses current shared behavior before target additions. | None |
| `DS-PATTERN-PAGE-004` | `TARGET` | `SRC-TARGET-WORKFLOW-STATES` | Target workflow pages include loading, error, empty, no-permission, validation, review, approval, and destructive-action states. | State placement avoids blocking primary navigation. | State messages are actionable and announced where needed. | Target workflow design lists every required state. | Current coverage varies. |
