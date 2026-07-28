---
title: Claude Design Contract
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Claude Design Contract

This contract defines how Claude reads and applies the design-system requirement pack.

## Allowed Statuses

| Status | Meaning | Claude Use |
|---|---|---|
| `CURRENT` | Confirmed in current repo implementation. | Safe for current-state designs. |
| `ADOPTED` | Approved behavior from repo docs, WordPress references, or screenshots. | Safe when documented design-system behavior is allowed. |
| `TARGET` | Desired behavior not guaranteed by current code. | Use only when future capability is permitted. |
| `DEPRECATED` | Explicitly disallowed for new design work. | Do not use. |

No other requirement status is valid.

Document frontmatter status is package maturity metadata. It may use `approved-baseline` and must not be interpreted as a requirement-row status.

## Authority Model

| Authority | What It Decides |
|---|---|
| Current code | What is `CURRENT`. |
| Hardened docs | What Claude should generate. |
| Official WordPress references | What may be adopted as WordPress-like behavior. |
| Screenshot evidence | What inspector and responsive editor behavior is adopted. |
| Gap register | What is known missing or target-only. |

## Requirement Row Schema

| Field | Required | Rule |
|---|---|---|
| Requirement ID | Yes | Use the ID families in this contract. |
| Status | Yes | Use only `CURRENT`, `ADOPTED`, `TARGET`, or `DEPRECATED`. |
| Evidence | Yes | Include at least one evidence ID. |
| Behavior | Yes | State what Claude or the UI does. |
| Responsive Rule | Yes | State viewport behavior or `Not viewport-specific`. |
| Accessibility Rule | Yes | State keyboard, focus, label, or screen-reader expectation. |
| Acceptance Criteria | Yes | State a pass/fail result. |
| Gap Note | Yes | State `None` or name the gap. |

## ID Families

| ID Prefix | Area |
|---|---|
| `DS-CONTRACT-*` | Contract and authority |
| `DS-SCOPE-*` | Scope and glossary |
| `DS-SOURCE-*` | Source precedence |
| `DS-PRINCIPLE-*` | Experience principles |
| `DS-TOKEN-*` | Foundations and tokens |
| `DS-THEME-*` | Global styles and theme settings |
| `DS-LAYOUT-*` | Layout and responsive behavior |
| `DS-WP-*` | WordPress parity |
| `DS-SHOT-*` | Screenshot evidence |
| `DS-COMP-*` | Components |
| `DS-PATTERN-*` | Patterns |
| `DS-A11Y-*` | Accessibility, content, localization |
| `DS-GOV-*` | Governance |
| `DS-BRIEF-*` | Design brief template |
| `DS-GAP-*` | Gaps |

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-CONTRACT-001` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Claude rejects any requirement status outside the four allowed statuses. | Not viewport-specific. | Status labels remain textual, not color-only. | Static search finds zero invalid statuses. | None |
| `DS-CONTRACT-002` | `ADOPTED` | `SRC-REPO-DOC-UIUX`, `SRC-WP-GLOBAL-STYLES` | Claude distinguishes current implementation, adopted behavior, and target capability. | Target responsive behavior never implies current runtime support. | Differences are stated in readable text. | A generated brief can mark each item as current, adopted, target, or deprecated. | None |
| `DS-CONTRACT-003` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-003` | Screenshot-backed builder behavior is used only when referenced by evidence ID. | Screenshot responsive controls follow `06-layout-and-responsive-system.md`. | Icon-only screenshot controls need accessible names in generated specs. | Every screenshot-backed row cites `SRC-SHOT-*`. | None |
| `DS-CONTRACT-004` | `TARGET` | `SRC-TARGET-CLAUDE-STRICTNESS` | Claude avoids creating missing components or settings unless the row is marked `TARGET`. | Target breakpoint behavior is used only in target design requests. | Target controls include keyboard and focus requirements. | No design output silently treats target rows as current. | Implementation may not exist. |

## Non-Invention Rules

- Do not invent control behavior when no requirement row defines it.
- Do not merge WordPress concepts with current repo behavior without an adopted row.
- Do not use screenshot observations as generic visual inspiration without a `SRC-SHOT-*` citation.
- Do not treat target capability as current implementation.
