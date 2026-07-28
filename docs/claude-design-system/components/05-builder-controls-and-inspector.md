---
title: Builder Controls and Inspector
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Builder Controls and Inspector

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-BUILDER-001` | `ADOPTED` | `SRC-SHOT-001` | Inspector uses Content, Style, and Advanced tabs for selected-element editing. | Active tab remains while changing viewport unless the selected element changes. | Tabs support keyboard navigation and selected state. | Inspector design includes tab purpose and selected state. | Current implementation not guaranteed. |
| `DS-COMP-BUILDER-002` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-002` | Spacing controls expose four sides, unit selector, link mode, and reset state. | Side values inherit from wider breakpoint until overridden. | Side inputs and link toggle are labeled. | A spacing control spec states side order, unit, link state, and reset behavior. | Current implementation not guaranteed. |
| `DS-COMP-BUILDER-003` | `ADOPTED` | `SRC-SHOT-001` | Layout controls cover width, align-self, order, size, and vertical alignment. | Responsive icon indicates per-device control support. | Segmented controls expose active option. | Layout inspector output contains all screenshot-observed controls. | Current implementation not guaranteed. |
| `DS-COMP-BUILDER-004` | `ADOPTED` | `SRC-SHOT-004` | Typography popover covers family, size, weight, transform, style, decoration, line-height, letter-spacing, and word-spacing. | Typography values may inherit or override per breakpoint in target behavior. | Sliders, selects, and inputs expose labels, values, and units. | Typography spec contains all screenshot fields. | Current theme builder is limited. |
| `DS-COMP-BUILDER-005` | `TARGET` | `SRC-SHOT-003`, `SRC-TARGET-BUILDER-GOVERNANCE` | Builder controls show default, inherited, overridden, resettable, disabled, and invalid states. | State indicators are scoped to active viewport. | State indicators are textual or programmatically exposed. | Claude target design can explain the state of any control. | Implementation not guaranteed. |
