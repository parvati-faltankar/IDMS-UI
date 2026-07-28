---
title: Builder and Editor Experience
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Builder and Editor Experience

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-PATTERN-BUILDER-001` | `ADOPTED` | `SRC-SHOT-003` | Builder editor separates top toolbar, left inspector, and live canvas. | Active viewport controls canvas dimensions and property context. | Toolbar and inspector controls are keyboard navigable. | A builder design shows toolbar, inspector, canvas, and selected element state. | Current implementation not guaranteed. |
| `DS-PATTERN-BUILDER-002` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-004` | Selected element drives inspector content and exposes content, style, advanced, layout, and typography groups. | Responsive markers show which groups support per-device values. | Group headings and controls are labeled. | Heading editor design maps selection to inspector controls. | Current implementation not guaranteed. |
| `DS-PATTERN-BUILDER-003` | `TARGET` | `SRC-REPO-DOC-UI-STUDIO`, `SRC-TARGET-BUILDER-GOVERNANCE` | Target builder supports draft, preview, validate, publish, rollback, diagnostics, and human review. | Preview scenarios include device context. | Validation messages and publish blockers are accessible. | Builder target designs separate authoring from runtime output. | Current UI Studio is kickoff-level. |
| `DS-PATTERN-BUILDER-004` | `TARGET` | `SRC-TARGET-NON-DESTRUCTIVE-EDITING` | Builder changes expose changed state, reset path, undo path, and publish safety. | Undo/reset is scoped to active viewport when values are responsive. | Undo and reset have accessible labels. | User can identify what changed and how to recover. | Implementation not guaranteed. |
