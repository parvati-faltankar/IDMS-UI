---
title: Layout and Responsive System
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Layout and Responsive System

## Breakpoint Defaults

| Breakpoint | Width Range | Source | Status |
|---|---|---|---|
| Desktop | 1025px and above | `SRC-SHOT-003`, `SRC-TARGET-RESPONSIVE` | `TARGET` |
| Tablet | 768px to 1024px | `SRC-SHOT-003`, `SRC-TARGET-RESPONSIVE` | `TARGET` |
| Mobile | 0px to 767px | `SRC-SHOT-003`, `SRC-TARGET-RESPONSIVE` | `TARGET` |

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-LAYOUT-001` | `ADOPTED` | `SRC-SHOT-001` | Inspector layout group exposes margin, padding, width, align-self, order, size, and vertical alignment. | Each responsive-aware field shows whether it inherits or overrides. | Controls need labels and focus states. | A heading layout editor can list every screenshot-observed layout control. | Current implementation not guaranteed. |
| `DS-LAYOUT-002` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-002` | Margin and padding use four-side inputs for top, right, bottom, and left. | Values inherit from desktop until changed at tablet or mobile. | Each side input has an accessible side label. | Linked and unlinked spacing can be explained without assumptions. | Current implementation not guaranteed. |
| `DS-LAYOUT-003` | `ADOPTED` | `SRC-SHOT-002` | Linked spacing mode updates linked sides together; unlinked mode permits independent side values. | Link state is scoped to the active control and breakpoint. | Link toggle exposes pressed state to assistive technology. | A design spec states linked or unlinked mode for spacing controls. | Current implementation not guaranteed. |
| `DS-LAYOUT-004` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-004` | Unit selectors support `px` where shown and target support for `%`, `em`, `rem`, and `auto` where semantically valid. | Unit changes affect only the active control and breakpoint unless global editing is selected. | Unit menu is keyboard selectable. | Unit behavior is documented per control before generation. | Expanded unit set is target-only. |
| `DS-LAYOUT-005` | `ADOPTED` | `SRC-SHOT-003` | Viewport toolbar exposes device preview, zoom, undo/redo, and canvas width/height fields. | Active viewport controls which responsive values are displayed and edited. | Icon-only toolbar actions require accessible names and tooltips. | Claude can design a responsive toolbar with active device state. | Current implementation not guaranteed. |
| `DS-LAYOUT-006` | `TARGET` | `SRC-SHOT-003`, `SRC-TARGET-RESPONSIVE` | Reset returns a control to inherited value when inherited exists, otherwise to global default. | Reset is scoped to active breakpoint unless the action says global reset. | Reset action requires text or accessible confirmation for destructive global resets. | A responsive control row states default, inherited, overridden, and reset behavior. | Implementation not guaranteed. |
| `DS-LAYOUT-007` | `TARGET` | `SRC-SHOT-004`, `SRC-TARGET-TYPOGRAPHY` | Typography controls support family, size, weight, transform, style, decoration, line-height, letter-spacing, and word-spacing. | Typography values can be overridden per breakpoint. | Sliders and inputs expose numeric value and unit. | A typography popover design contains all screenshot fields. | Current theme builder is limited. |

## Control State Model

| State | Meaning |
|---|---|
| default | Uses global or component baseline. |
| inherited | Uses value from wider breakpoint or parent style. |
| overridden | Has local value at active element or breakpoint. |
| linked | Multiple sides update together. |
| unlinked | Sides update independently. |
| disabled | Control unavailable due to selected element or context. |
| resettable | Control has a local override that can be cleared. |
