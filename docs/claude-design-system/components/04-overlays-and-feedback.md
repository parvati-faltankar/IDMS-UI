---
title: Overlays and Feedback
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Overlays and Feedback

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-OVERLAY-001` | `CURRENT` | `SRC-REPO-CODE-COMPONENTS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Dialogs and drawers provide constrained overlay surfaces for confirmation, forms, preview, and help. | Overlays fit the viewport and avoid clipping primary actions. | Dismissible overlays support Escape, close controls, and focus return. | Overlay specs identify title, trigger, close path, and focus behavior. | None |
| `DS-COMP-OVERLAY-002` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | HelpDrawer and FieldHelpPopover provide contextual guidance without long inline instructional text. | Help surfaces adapt to panel width. | Related topics and close controls are keyboard reachable. | Help content is sourced by topic or field. | None |
| `DS-COMP-OVERLAY-003` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | CommandPalette is a keyboard-first launcher with searchable commands. | Modal width adapts to viewport. | Arrow, Enter, and Escape behavior are documented. | Command palette is global, not page-local. | None |
| `DS-COMP-OVERLAY-004` | `TARGET` | `SRC-TARGET-FEEDBACK-STATES` | Target feedback covers loading, success, warning, error, offline, validation, and destructive confirmation. | Feedback placement does not cause uncontrolled layout shift. | Feedback is announced through text and appropriate live regions where needed. | Claude target designs list all relevant feedback states. | Current coverage varies. |
