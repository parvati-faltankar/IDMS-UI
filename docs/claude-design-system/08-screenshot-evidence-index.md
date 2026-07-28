---
title: Screenshot Evidence Index
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Screenshot Evidence Index

## Stable Evidence Assets

| Evidence ID | Stable Path | Description |
|---|---|---|
| `SRC-SHOT-001` | `evidence/screenshots/wp-editor-layout-panel.png` | Inspector layout panel for heading editing. |
| `SRC-SHOT-002` | `evidence/screenshots/wp-editor-responsive-spacing-popover.png` | Responsive/linked spacing popover state. |
| `SRC-SHOT-003` | `evidence/screenshots/wp-editor-canvas-toolbar.png` | Full editor shell with canvas and viewport toolbar. |
| `SRC-SHOT-004` | `evidence/screenshots/wp-editor-typography-popover.png` | Typography popover and controls. |

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-SHOT-001` | `ADOPTED` | `SRC-SHOT-001` | Layout panel evidence includes Content, Style, Advanced tabs and layout controls. | Responsive markers beside controls indicate responsive awareness. | Inspector tabs and controls need accessible names. | Layout docs cite `SRC-SHOT-001` for layout control behavior. | Current implementation not guaranteed. |
| `DS-SHOT-002` | `ADOPTED` | `SRC-SHOT-002` | Spacing popover evidence includes linked side state and compact responsive affordance. | Link state is scoped to active spacing control and breakpoint. | Link control exposes selected state. | Responsive docs cite `SRC-SHOT-002` for linked/unlinked spacing. | Current implementation not guaranteed. |
| `DS-SHOT-003` | `ADOPTED` | `SRC-SHOT-003` | Canvas toolbar evidence includes device toggles, canvas width/height, zoom, undo/redo, settings, and close actions. | Active viewport controls preview and property editing context. | Icon-only toolbar actions need labels and tooltips. | Builder pattern docs cite `SRC-SHOT-003` for canvas toolbar behavior. | Current implementation not guaranteed. |
| `DS-SHOT-004` | `ADOPTED` | `SRC-SHOT-004` | Typography popover evidence includes family, size, weight, transform, style, decoration, line-height, letter-spacing, and word-spacing. | Typography values can be breakpoint-aware in target behavior. | Numeric controls expose value and unit. | Typography control docs cite `SRC-SHOT-004`. | Current theme builder is limited. |

## Screenshot Interpretation Rules

- Screenshot observations are behavioral evidence, not pixel-perfect visual requirements.
- Screenshot behavior is adopted for target builder/editor requirements unless current repo evidence confirms it already exists.
- No temporary clipboard paths are valid evidence in this pack.
