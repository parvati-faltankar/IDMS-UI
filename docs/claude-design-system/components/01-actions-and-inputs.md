---
title: Actions and Inputs
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Actions and Inputs

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-ACTION-001` | `CURRENT` | `SRC-REPO-CODE-COMPONENTS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Buttons support primary, secondary, ghost, and danger action roles through app and page-header patterns. | Button text may wrap or use icon-only mode only when labels remain available. | Every button exposes an accessible name and disabled state. | Primary action is visually and semantically distinct. | None |
| `DS-COMP-ACTION-002` | `CURRENT` | `SRC-REPO-CODE-COMPONENTS`, `SRC-REPO-DOC-UIUX` | Shared form controls include input, select, textarea, form field, and date picker behavior. | Inputs fill their container and avoid clipping labels or values. | Labels, descriptions, errors, and required state are associated with fields. | A generated form can list field state, validation, and help behavior. | None |
| `DS-COMP-ACTION-003` | `TARGET` | `SRC-SHOT-001`, `SRC-SHOT-004` | Builder numeric controls support direct input, unit selectors, sliders where useful, and reset state. | Numeric values are scoped to active breakpoint when responsive control is enabled. | Numeric controls expose value, min/max where known, unit, and focus state. | Layout and typography controls can be specified without guessing. | Current builder parity not guaranteed. |
| `DS-COMP-ACTION-004` | `ADOPTED` | `SRC-REPO-DOC-UIUX` | Search, chips, filters, and picker controls use concise labels and visible active state. | Toolbar controls wrap or collapse without hiding active state. | Active filters are not color-only. | List pages show active search/filter state. | None |

## State Coverage

| Control | Required States |
|---|---|
| Button | default, hover, focus, active, disabled, loading, danger |
| Input | default, focus, filled, error, disabled, read-only |
| Select | closed, open, selected, error, disabled |
| DatePicker | closed, open, selected, invalid, disabled |
| Chip | default, active, removable, disabled |
| Numeric builder control | default, inherited, overridden, resettable, disabled |
