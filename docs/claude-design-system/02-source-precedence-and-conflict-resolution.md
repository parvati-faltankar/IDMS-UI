---
title: Source Precedence and Conflict Resolution
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Source Precedence and Conflict Resolution

## Authority Order

| Rank | Source | Applies To |
|---|---|---|
| 1 | Current repo implementation | `CURRENT` behavior |
| 2 | Hardened design-system docs | Claude generation rules |
| 3 | Current repo documentation | Existing patterns and constraints |
| 4 | Official WordPress references | Adoptable WordPress-like concepts |
| 5 | Stable screenshot evidence | Inspector and responsive builder behavior |
| 6 | Target rows | Future capabilities and gaps |

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-SOURCE-001` | `ADOPTED` | `SRC-REPO-CODE-COMPONENTS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | If code and docs disagree on current behavior, current code is labeled `CURRENT` and the conflict is recorded as a gap. | Current responsive claims need code or screenshot evidence. | Conflict notes are visible text. | No row marks unevidenced behavior as `CURRENT`. | None |
| `DS-SOURCE-002` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-SHOT-003` | WordPress and screenshot behavior is adopted explicitly before Claude uses it. | Screenshot responsive toolbar behavior applies only to builder/editor target behavior. | Adopted icon controls require accessible labels. | Every WordPress parity row cites `SRC-WP-*` or `SRC-SHOT-*`. | None |
| `DS-SOURCE-003` | `TARGET` | `SRC-TARGET-DOC-GOVERNANCE` | Legacy documentation conflicts are listed in the gap register until resolved. | Legacy responsive guidance is advisory unless adopted here. | Conflicts avoid color-only severity. | Gap register includes legacy conflict rows. | Existing docs overlap. |
| `DS-SOURCE-004` | `DEPRECATED` | `SRC-REPO-DOC-PAGE-STRUCTURE` | Page-level duplicate headers, duplicate command palettes, and unscoped help controls are not allowed in new designs. | Deprecated layout patterns are not generated for mobile alternatives. | Deprecated controls are not used as accessibility shortcuts. | Claude-generated admin pages use approved shell hierarchy. | None |

## Conflict Outcomes

| Outcome | Meaning |
|---|---|
| aligned | Sources agree. |
| adopted target | Source is accepted for future design but not current implementation. |
| current override | Current code overrides a doc claim. |
| deprecated | Pattern is disallowed. |
| unresolved gap | Evidence is insufficient or contradictory. |
