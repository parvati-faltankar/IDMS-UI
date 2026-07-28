---
title: Accessibility, Content, and Localization
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Accessibility, Content, and Localization

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-A11Y-001` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS`, `SRC-WP-COMPONENTS` | Target accessibility baseline is WCAG 2.2 AA for generated design requirements. | Text and controls remain usable at small viewport widths. | Keyboard access, visible focus, labels, contrast, and semantic state are required. | A generated component spec lists keyboard and focus behavior. | Current implementation may vary. |
| `DS-A11Y-002` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Overlays manage focus, close behavior, and focus return. | Drawers and dialogs stay within viewport. | Escape closes dismissible overlays; destructive flows confirm. | Overlay specs include trigger, title, focus trap, close path, and return target. | Current implementation may vary. |
| `DS-A11Y-003` | `TARGET` | `SRC-TARGET-LOCALIZATION` | Designs allow localization, RTL, and text expansion. | Labels and buttons wrap without clipping. | Directionality does not break reading order or focus order. | Generated screens state RTL and text expansion handling. | Implementation not guaranteed. |
| `DS-A11Y-004` | `TARGET` | `SRC-TARGET-REDUCED-MOTION` | Motion respects reduced-motion preferences and avoids essential information in animation alone. | Responsive transitions preserve layout stability. | Motion alternatives use text or persistent state. | Generated designs state reduced-motion behavior for animated surfaces. | Implementation not guaranteed. |

## Content Rules

| Content Type | Rule |
|---|---|
| Labels | Specific and stable. |
| Helper text | Concise and contextual. |
| Errors | Actionable and close to the affected control. |
| Empty states | Explain the gap and next action. |
| Confirmation text | Names the action, impact, and recovery if any. |
