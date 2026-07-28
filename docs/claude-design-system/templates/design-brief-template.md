---
title: Design Brief Template
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Design Brief Template

Use this template when asking Claude to generate a design from this pack.

```md
# Claude Design Request

Screen or system:
Audience:
Business goal:
Current repo surface to follow:
Allowed status levels: CURRENT / ADOPTED / TARGET
Required evidence IDs:
Allowed component families:
WordPress-like behavior required:
Target-only additions allowed:
Responsive states required:
Accessibility states required:
Loading, empty, error, success states required:
Output format:
Acceptance criteria:
Known exclusions:
```

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-BRIEF-001` | `ADOPTED` | `SRC-TARGET-CLAUDE-STRICTNESS` | Every design request identifies source IDs and allowed status levels. | Request states desktop/tablet/mobile needs or says not viewport-specific. | Request states keyboard, focus, contrast, and screen-reader needs. | Claude can determine current versus target behavior before generating. | None |
| `DS-BRIEF-002` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Request identifies allowed component families before asking Claude to compose a design. | Components inherit responsive rules from their docs. | Components inherit accessibility rules from their docs. | Claude output uses cataloged components before target-only inventions. | None |
| `DS-BRIEF-003` | `TARGET` | `SRC-SHOT-001`, `SRC-SHOT-003`, `SRC-SHOT-004` | Builder requests identify inspector controls, viewport states, and target-only allowances. | Active viewport and inheritance behavior are required fields. | Inspector controls need labels and focus behavior. | A heading editor request can be evaluated against screenshot evidence. | Implementation not guaranteed. |
