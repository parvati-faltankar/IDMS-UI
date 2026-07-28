---
title: Foundations and Tokens
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Foundations and Tokens

Current evidence comes from `SRC-REPO-CODE-THEME`, `SRC-REPO-DOC-THEME-BUILDER`, and `SRC-REPO-DOC-UIUX`.

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-TOKEN-001` | `CURRENT` | `SRC-REPO-CODE-THEME` | Brand themes expose a 50-900 brand scale and optional custom CSS tokens. | Brand tokens apply globally, not per breakpoint. | Color token usage follows contrast checks from quality rules. | Current theme rows reference brand scale and custom token support. | None |
| `DS-TOKEN-002` | `CURRENT` | `SRC-REPO-CODE-THEME`, `SRC-REPO-DOC-THEME-BUILDER` | Theme Builder supports primary, secondary, accent, background, surface, text, border, status, header, sidebar, button, and link colors. | Current color settings are global unless a target row expands them. | Status colors cannot be the only status cue. | Color requirements list current fields and target semantic mapping. | None |
| `DS-TOKEN-003` | `CURRENT` | `SRC-REPO-CODE-THEME` | Current typography settings include body font, heading font, base font size, font weight, line height, and button text transform. | Current typography settings are global theme values. | Font size and line height preserve readable labels. | Current typography rows do not imply letter or word spacing runtime support. | Rich inspector typography is target-only. |
| `DS-TOKEN-004` | `CURRENT` | `SRC-REPO-CODE-THEME` | Current layout settings include border radius, button radius, card radius, input radius, spacing scale, and shadow style. | Current layout settings are global theme values. | Focus rings remain visible regardless of radius or shadow. | Layout token rows map current fields to target semantic token families. | Responsive layout editing is target-only. |
| `DS-TOKEN-005` | `TARGET` | `SRC-SHOT-001`, `SRC-SHOT-004`, `SRC-TARGET-SEMANTIC-TOKENS` | Target semantic tokens include focus ring, canvas border, inspector chrome, page chrome, overlay scrim, density spacing, destructive action, warning action, and neutral surface layers. | Responsive spacing tokens vary by breakpoint only through explicit overrides. | Focus ring and error tokens meet WCAG 2.2 AA contrast. | Each target token family has a purpose and permitted use. | Implementation not guaranteed. |
| `DS-TOKEN-006` | `TARGET` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON` | Target token architecture separates primitive values, semantic aliases, component tokens, and local overrides. | Breakpoint overrides apply after global and component tokens. | Token names are textual and descriptive. | Claude can explain token precedence without extra assumptions. | Implementation not guaranteed. |

## Token Families

| Family | Current Source | Current Capability | Target Capability |
|---|---|---|---|
| Color | `SRC-REPO-CODE-THEME` | Brand scale and theme builder color fields | Primitive, semantic, component, state, focus, canvas, inspector, overlay |
| Typography | `SRC-REPO-CODE-THEME`, `SRC-SHOT-004` | Global family, size, weight, line-height, button transform | Per-element typography controls with responsive overrides |
| Spacing | `SRC-REPO-CODE-THEME`, `SRC-SHOT-001` | Global spacing scale | Four-side spacing, linked/unlinked sides, breakpoint overrides |
| Radius | `SRC-REPO-CODE-THEME` | Global, button, card, input | Component-specific radius tokens |
| Elevation | `SRC-REPO-CODE-THEME` | Soft, medium, strong shadow style | Overlay, popover, drawer, dropdown, canvas selection elevation |
| Motion | `SRC-TARGET-MOTION` | Not fully modeled | Duration, easing, reduced motion, state transitions |
| Iconography | `SRC-REPO-DOC-ADMIN-SPEC` | Lucide icons in current UI | Size, stroke, label, tooltip, disabled state rules |
