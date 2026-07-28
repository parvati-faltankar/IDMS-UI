---
title: Scope and Glossary
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Scope and Glossary

This pack documents a hybrid model: WordPress admin conventions, Gutenberg/theme.json semantics, screenshot-backed page-builder inspector behavior, and current IDMS-UI implementation evidence.

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-SCOPE-001` | `ADOPTED` | `SRC-WP-DESIGN`, `SRC-REPO-DOC-ADMIN-SPEC` | WordPress-like admin means persistent navigation, stable shell, clear settings surfaces, and compact operational density. | Admin shell requirements apply across desktop, tablet, and mobile navigation states. | Navigation remains keyboard reachable and labeled. | Claude can describe the adopted WordPress model without claiming literal clone parity. | None |
| `DS-SCOPE-002` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON` | Global settings and global styles are separate concepts. | Global responsive presets may set defaults; local breakpoint overrides remain separate. | Settings are described with visible labels. | Generated theme work separates settings from rendered style output. | None |
| `DS-SCOPE-003` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-002`, `SRC-SHOT-003`, `SRC-SHOT-004` | Inspector behavior follows the screenshot model for content, style, advanced, layout, spacing, canvas toolbar, and typography. | Device-specific values inherit until overridden. | Inspector controls need accessible names and focus states. | Claude references screenshot evidence for inspector behavior. | None |
| `DS-SCOPE-004` | `CURRENT` | `SRC-REPO-CODE-COMPONENTS`, `SRC-REPO-DOC-UIUX` | Current IDMS-UI surfaces include shell, admin shells, common components, profile builders, and UI Studio kickoff module. | Current responsive behavior is current only where repo evidence confirms it. | Current components inherit existing accessibility behavior unless target rows expand it. | The component catalog maps each major current surface. | Some components still need deeper implementation audit. |

## Glossary

| Term | Meaning |
|---|---|
| Theme | Global brand and visual configuration applied across the app. |
| Token | Reusable value for color, typography, spacing, radius, elevation, motion, or iconography. |
| Primitive token | Raw value such as a hex color, pixel value, or font size. |
| Semantic token | Meaning-bearing value such as `surface-default`, `focus-ring`, or `status-danger`. |
| Setting | Configurable option that governs available design behavior. |
| Style | Visual output produced by applying tokens and settings. |
| Preset | Named reusable setting value. |
| Style variation | Named alternative expression of the same design system. |
| Global style | System-level visual rule that applies broadly unless overridden. |
| Local override | Element, component, screen, or breakpoint-specific style change. |
| Inspector | Side panel used to edit selected element properties. |
| Canvas | Live design surface being edited or previewed. |
| Viewport | Current responsive preview mode and dimensions. |
| Breakpoint | Named responsive range with inherited and overridden values. |
| Surface | UI area such as page shell, drawer, dialog, panel, overlay, or canvas. |
| Shell | Persistent structural frame around a page or workspace. |
| Builder control | Inspector control used to edit an element or global setting. |
| Current capability | Behavior supported by current repo code. |
| Target capability | Desired future behavior documented for Claude and tracked as a gap. |
