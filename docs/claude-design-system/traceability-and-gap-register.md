---
title: Traceability and Gap Register
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Traceability and Gap Register

Default unresolved-gap owner: Design System Governance Working Group. Product and engineering may replace this default with named owners during delivery planning.

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-GAP-001` | `TARGET` | `SRC-REPO-CODE-UI-STUDIO`, `SRC-REPO-DOC-UI-STUDIO` | UI Studio registry breadth is not enough for a full design-system catalog. | Target registry needs surface and breakpoint compatibility metadata. | Target registry components need labels, focus, validation, and disabled states. | Catalog marks UI Studio as target-expanded instead of current-complete. | Severity high; owner Design System Governance Working Group. |
| `DS-GAP-002` | `TARGET` | `SRC-SHOT-001`, `SRC-SHOT-002`, `SRC-SHOT-003` | Responsive inspector semantics need explicit runtime implementation before they can be current. | Desktop/tablet/mobile inheritance, override, reset, and link state need implementation. | Responsive controls need accessible labels and state exposure. | Responsive behavior remains target where code evidence is absent. | Severity high; owner Design System Governance Working Group. |
| `DS-GAP-003` | `TARGET` | `SRC-SHOT-004`, `SRC-REPO-CODE-THEME` | Typography inspector completeness exceeds current Theme Builder typography fields. | Target typography supports breakpoint overrides. | Sliders/selects/inputs expose label, value, and unit. | Theme docs distinguish current global typography from target inspector typography. | Severity high; owner Design System Governance Working Group. |
| `DS-GAP-004` | `ADOPTED` | `SRC-WP-DESIGN`, `SRC-WP-ADMIN-SCREENS`, `SRC-WP-GLOBAL-STYLES` | WordPress scope clarity is resolved by the hybrid model in scope and parity docs. | WordPress responsive assumptions are not used unless adopted. | Adopted controls retain accessibility rules. | No doc uses vague literal WordPress parity as a requirement. | Severity medium; owner docs. |
| `DS-GAP-005` | `ADOPTED` | `SRC-SHOT-001`, `SRC-SHOT-002`, `SRC-SHOT-003`, `SRC-SHOT-004` | Screenshot evidence is stable under the docs evidence folder. | Screenshot-derived responsive controls cite stable IDs. | Icon-only screenshot controls require accessible names in generated specs. | No temp screenshot path remains in docs. | Severity medium; owner docs. |
| `DS-GAP-006` | `TARGET` | `SRC-REPO-DOC-PAGE-STRUCTURE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Legacy doc conflicts require ongoing review through source precedence rules. | Legacy responsive claims need source review before adoption. | Conflict notes remain textual. | New or conflicting docs get mapped before Claude uses them. | Severity medium; owner Design System Governance Working Group. |
| `DS-GAP-007` | `TARGET` | `SRC-TARGET-PUBLISH-GOVERNANCE`, `SRC-REPO-DOC-THEME-BUILDER`, `SRC-REPO-DOC-MENU-BUILDER` | Theme/menu publish governance lacks full approval, rollback, audit, and environment promotion behavior. | Publish state is global unless target metadata adds responsive payloads. | Review and publish actions require confirmation and readable status. | Governance docs mark full lifecycle as target. | Severity medium; owner Design System Governance Working Group. |

## Gap Fields

| Field | Meaning |
|---|---|
| Severity | High, medium, or low impact on Claude design quality. |
| Owner | Default owner is Design System Governance Working Group until product/engineering assigns a named owner. |
| Evidence | Source IDs that prove or motivate the gap. |
| Affected docs | Files where the gap is referenced. |
| Acceptance | Condition that closes or downgrades the gap. |

## Ownership Policy

| Situation | Owner Rule |
|---|---|
| Documentation contradiction | Design System Governance Working Group owns triage. |
| Missing runtime implementation | Engineering owner is assigned during delivery planning; default owner remains Design System Governance Working Group until then. |
| Product behavior ambiguity | Product owner is assigned during delivery planning; default owner remains Design System Governance Working Group until then. |
| Screenshot interpretation issue | Design System Governance Working Group owns the adopted interpretation and updates this register. |