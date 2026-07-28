---
title: WordPress Parity Matrix
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# WordPress Parity Matrix

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-WP-001` | `ADOPTED` | `SRC-WP-ADMIN-SCREENS`, `SRC-WP-ADMIN-UI`, `SRC-REPO-DOC-ADMIN-SPEC` | Adopt WordPress-like admin shell conventions: persistent navigation, settings density, stable chrome, and standardized page layout regions. | Mobile navigation may collapse but preserves access. | Shell navigation remains keyboard reachable. | Admin shell designs cite current shell components. | None |
| `DS-WP-002` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON`, `SRC-WP-THEME-HANDBOOK` | Adopt settings/styles split for global theme work. | Responsive defaults may be part of settings while overrides are local. | Settings labels are textual. | Theme docs separate settings, styles, presets, and variations. | Current implementation limited. |
| `DS-WP-003` | `ADOPTED` | `SRC-WP-BLOCK-EDITOR`, `SRC-SHOT-001` | Adopt Content, Style, and Advanced inspector tabs for builder-style editing. | Active tab persists while switching viewport unless context requires reset. | Tabs support keyboard navigation. | Inspector spec includes all three tabs. | Current implementation not guaranteed. |
| `DS-WP-004` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-002` | Adopt margin and padding four-side controls with linked/unlinked behavior. | Values inherit per breakpoint until overridden. | Four side controls have side-specific labels. | Layout spec defines side order and link mode. | Current implementation not guaranteed. |
| `DS-WP-005` | `ADOPTED` | `SRC-SHOT-001` | Adopt width, align-self, order, size, and vertical alignment controls for layout. | Controls edit active breakpoint values when responsive icon is active. | Segmented controls expose selected option. | Layout control table includes all five controls. | Current implementation not guaranteed. |
| `DS-WP-006` | `ADOPTED` | `SRC-WP-COMPONENTS`, `SRC-SHOT-004` | Adopt typography controls for family, size, weight, transform, style, decoration, line-height, letter-spacing, and word-spacing. | Typography can inherit or override by breakpoint. | Numeric controls support keyboard input and accessible value. | Typography table includes all screenshot controls. | Current theme builder is limited. |
| `DS-WP-007` | `ADOPTED` | `SRC-WP-BLOCK-EDITOR`, `SRC-SHOT-003` | Adopt viewport toolbar behavior for device preview, canvas width/height, zoom, undo/redo, and close/settings controls. | Toolbar state controls active responsive preview. | Icon-only controls require accessible names. | Canvas toolbar spec maps every visible control group. | Current implementation not guaranteed. |
| `DS-WP-008` | `TARGET` | `SRC-WP-COMPONENTS`, `SRC-REPO-CODE-UI-STUDIO` | Target design-system catalog expands beyond current UI Studio registry breadth. | Component availability may vary by surface and breakpoint. | Components need accessibility contracts. | Gap register tracks registry breadth as target. | Current registry is small. |
| `DS-WP-009` | `TARGET` | `SRC-WP-GLOBAL-STYLES`, `SRC-REPO-DOC-THEME-BUILDER` | Target publish lifecycle aligns theme/style changes with validation, review, publish, rollback, and deactivation. | Published styles apply globally across breakpoints. | Publish actions use confirmations and status text. | Governance doc lists lifecycle gates. | Current governance limited. |
| `DS-WP-010` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON`, `SRC-WP-THEME-HANDBOOK` | Adopt WordPress-like per-block/per-component setting availability: settings can exist globally and be narrowed, enabled, hidden, or customized for a specific block/component family. | Block/component settings inherit from top-level defaults unless explicitly overridden by the block/component rule. | Availability controls need readable labels and cannot rely on icon-only state. | Claude can state whether a setting applies globally, to one component family, or to a selected element only. | Current implementation limited. |

## Control-Level Parity Coverage

| Control Area | Evidence | Status | Adopted Decision |
|---|---|---|---|
| Admin page regions | `SRC-WP-ADMIN-SCREENS`, `SRC-WP-ADMIN-UI` | `ADOPTED` | Toolbar/header, navigation, work area, standardized page regions |
| Inspector tabs | `SRC-WP-BLOCK-EDITOR`, `SRC-SHOT-001` | `ADOPTED` | Content, Style, Advanced |
| Margin | `SRC-SHOT-001`, `SRC-SHOT-002` | `ADOPTED` | Four-side responsive values |
| Padding | `SRC-SHOT-001`, `SRC-SHOT-002` | `ADOPTED` | Four-side responsive values |
| Linked/unlinked spacing | `SRC-SHOT-002` | `ADOPTED` | Link mode is explicit state |
| Units | `SRC-SHOT-001`, `SRC-SHOT-004` | `ADOPTED` | `px` current evidence, broader units target-only |
| Width | `SRC-SHOT-001` | `ADOPTED` | Dropdown control |
| Align self | `SRC-SHOT-001` | `ADOPTED` | Segmented control |
| Order | `SRC-SHOT-001` | `ADOPTED` | Direction/order controls |
| Size | `SRC-SHOT-001` | `ADOPTED` | Segmented size controls |
| Vertical align | `SRC-SHOT-001` | `ADOPTED` | Segmented control |
| Typography | `SRC-WP-COMPONENTS`, `SRC-SHOT-004` | `ADOPTED` | Popover with full field set |
| Viewport toolbar | `SRC-WP-BLOCK-EDITOR`, `SRC-SHOT-003` | `ADOPTED` | Device, canvas, zoom, undo/redo |
| Responsive inheritance | `SRC-SHOT-001`, `SRC-SHOT-002` | `TARGET` | Explicit inherited and overridden states |
| Per-block/per-component settings | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON` | `ADOPTED` | Top-level settings can be narrowed or customized by block/component family |