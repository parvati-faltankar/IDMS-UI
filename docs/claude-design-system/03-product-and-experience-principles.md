---
title: Product and Experience Principles
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Product and Experience Principles

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-PRINCIPLE-001` | `ADOPTED` | `SRC-REPO-DOC-ADMIN-SPEC`, `SRC-REPO-DOC-UIUX` | Enterprise screens prioritize scanability, repeat action, clear hierarchy, and low-friction completion. | Compact layouts preserve primary workflows above the fold where current shell guidance supports it. | Dense screens preserve focus visibility and readable labels. | A generated admin screen has clear title, primary action, data/work area, and help path. | None |
| `DS-PRINCIPLE-002` | `ADOPTED` | `SRC-WP-DESIGN`, `SRC-WP-GLOBAL-STYLES` | WordPress-like means familiar structure, centralized settings, and bounded overrides. | Responsive overrides do not mutate global style unintentionally. | Settings and overrides are discoverable by keyboard. | Claude output separates global settings from selected-element settings. | None |
| `DS-PRINCIPLE-003` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-004` | Inspector properties are grouped by user intent: content, style, advanced, layout, typography, and responsive controls. | Active viewport and override state are visible for responsive controls. | Group labels and controls use accessible names. | A heading editor design identifies content, style, advanced, layout, and typography areas. | None |
| `DS-PRINCIPLE-004` | `TARGET` | `SRC-TARGET-NON-DESTRUCTIVE-EDITING` | Builder and theme editing support reversible actions, reset behavior, and clear publish states. | Reset behavior is breakpoint-specific where properties are breakpoint-aware. | Reversible actions expose keyboard paths and confirmation for destructive changes. | Claude designs include undo/reset/publish safety where target builder behavior is allowed. | Implementation may not fully exist. |

## Design Principles

- Current truth is never blurred with target aspiration.
- Global settings and local overrides remain visually and behaviorally distinct.
- Property controls expose state, source, and effect.
- Enterprise density is acceptable only when comprehension and accessibility remain intact.
- Claude prefers existing repo components before proposing target-only components.
