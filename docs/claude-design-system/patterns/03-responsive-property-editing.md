---
title: Responsive Property Editing
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Responsive Property Editing

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-PATTERN-RESP-001` | `TARGET` | `SRC-SHOT-003`, `SRC-TARGET-RESPONSIVE` | Editor supports desktop, tablet, and mobile preview contexts. | Desktop is the broadest default; tablet and mobile inherit until overridden. | Device controls expose selected state and accessible name. | A responsive design states active viewport and inheritance source. | Implementation not guaranteed. |
| `DS-PATTERN-RESP-002` | `TARGET` | `SRC-SHOT-001`, `SRC-SHOT-002` | Properties can be default, inherited, overridden, linked, unlinked, disabled, invalid, or resettable. | State is scoped to active control and active breakpoint. | State is not color-only. | Each responsive property row states its current state. | Implementation not guaranteed. |
| `DS-PATTERN-RESP-003` | `TARGET` | `SRC-SHOT-002` | Linked spacing edits update linked sides together; unlinked edits update one side at a time. | Link mode is independent per spacing control and breakpoint. | Link toggle exposes pressed state. | Spacing control spec states link mode and side values. | Implementation not guaranteed. |
| `DS-PATTERN-RESP-004` | `TARGET` | `SRC-SHOT-003` | Canvas width, height, and zoom are preview state, not persisted layout values unless explicitly saved by a target builder rule. | Preview size changes do not mutate layout tokens by default. | Zoom and dimensions have keyboard-editable controls. | Claude design distinguishes preview state from persisted design values. | Implementation not guaranteed. |
