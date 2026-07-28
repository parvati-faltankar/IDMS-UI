---
title: Data and Display
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Data and Display

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-DATA-001` | `CURRENT` | `SRC-REPO-DOC-UIUX`, `SRC-REPO-CODE-COMPONENTS` | `CommonDataGrid` supports sortable, selectable, configurable, exportable data tables. | Wide data uses horizontal management rather than clipping. | Header cells, row actions, and selection controls are labeled. | Generated catalogue tables use current grid behavior. | None |
| `DS-COMP-DATA-002` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Status badges and summary strips communicate lifecycle and aggregate state. | Badges wrap or truncate safely on small screens. | Status text accompanies color. | Status remains understandable without color. | None |
| `DS-COMP-DATA-003` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Empty states explain what is missing, why it matters, and the next action. | Compact empty states fit panels and tabs. | Empty-state actions have descriptive labels. | Empty states are not used as loading or error states. | None |
| `DS-COMP-DATA-004` | `TARGET` | `SRC-TARGET-DATA-DISPLAY` | Target displays include loading, offline, no-permission, and partial-data states. | States adapt without layout shift. | State announcements are screen-reader friendly. | Claude target designs include all relevant data states. | Current coverage varies by component. |
