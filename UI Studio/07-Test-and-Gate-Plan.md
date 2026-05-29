# 07 - Test and Gate Plan (Metadata to Runtime)

## 1. Strategy

Testing is organized as layered quality gates that correspond to release progression. No release advances without passing all mandatory gate suites.

## 2. Test Groups

| Test Group ID | Group | Coverage Focus |
|---|---|---|
| TS-SCHEMA | Metadata Schema Tests | Contract validity, required fields, version semantics |
| TS-REGISTRY | Component Registry Tests | Surface compatibility, prop/event schema, deprecation behavior |
| TS-RENDER | Renderer Tests | Deterministic render output, fallback states, pipeline ordering |
| TS-BIND | Binding Tests | Field, relationship, query, computed, static binding correctness |
| TS-RULE | Rule Evaluation Tests | Condition evaluation, null safety, effect application |
| TS-ACTION | Action Contract Tests | Input mapping, confirmation flow, success/failure behavior |
| TS-PREVIEW | Preview Context Tests | Role/workflow/tenant/device simulation correctness |
| TS-PUBLISH | Publish Gate Tests | Block-on-error validation, warning flow, immutable publish behavior |
| TS-TXN | Transaction Workspace Tests | Header-line-totals-workflow-attachments behavior |
| TS-VARIANT | Variant Resolution Tests | Overlay precedence, conflict visibility, deterministic output |
| TS-PERM | Permission Pruning Tests | Pruning before behavior, unauthorized data suppression |
| TS-GOV | Governance Workflow Tests | Maker-checker, RBAC, audit trail, lock protocols |
| TS-LOCK | Concurrency Tests | Draft locks, stale versions, conflict handling, force unlock controls |
| TS-DIAG | Diagnostics Tests | Event emission, traceability, sensitive data redaction |
| TS-NAV | Cross-View Navigation Tests | Context passing, return continuity, route integrity |
| TS-A11Y | Accessibility Tests | Labels, keyboard order, focus handling, screen reader semantics |
| TS-LOC | Localization Readiness Tests | Key coverage, dynamic text safety, fallback behavior |
| TS-PERF | Performance Budget Tests | Metadata payload, render latency thresholds |
| TS-EXPORT | Export/Import Tests | Package integrity, compatibility checks |
| TS-UPGRADE | Upgrade Compatibility Tests | Metadata version migration safety |
| TS-CANARY | Canary Rollout Tests | Partial rollout behavior and rollback safety |
| TS-COLLAB | Collaboration Tests | Multi-editor consistency and state safety |
| TS-MASS | Inline Edit/Mass Update Tests | Operational list edit correctness |
| TS-STATE | Empty/Loading/Error State Tests | Default state resilience |
| TS-SDK | Custom SDK Extension Tests | Guardrail enforcement for custom components |

## 3. Minimum Scenario Suite

1. Build CRUD metadata from entity model and render list/create surfaces.
2. Configure list columns, filters, row actions, and preview output.
3. Configure transaction workspace with line grid and totals.
4. Configure lookup with cascading filter behavior.
5. Configure save/submit action contracts and workflow status strip.
6. Validate broken binding blocks publish.
7. Publish v1, publish v2, rollback to v1.
8. Simulate role and tenant variant overlays.
9. Validate permission pruning of sensitive fields.
10. Simulate runtime action failure and diagnostics event generation.
11. Promote package across environments with dependency checks.
12. Detect schema change and show sync warning.
13. Compare semantic diff between versions.
14. Validate lock conflict handling between two editors.
15. Validate no-impact guardrail with unchanged existing screen behavior.

## 4. Release Gates

### Gate G1 (R1)
- Must pass: TS-SCHEMA, TS-REGISTRY, TS-RENDER, TS-BIND, TS-PREVIEW, TS-PUBLISH.
- Fail condition: Any blocking metadata validation leak or renderer nondeterminism.

### Gate G2 (R2)
- Must pass: G1 + TS-RULE, TS-ACTION, TS-TXN, TS-STATE.
- Fail condition: Transaction workspace or action contract instability.

### Gate G3 (R3)
- Must pass: G2 + TS-VARIANT, TS-PERM, TS-GOV, TS-LOCK, TS-DIAG, TS-NAV.
- Fail condition: Governance bypass, audit gaps, lock failure, or unsafe diagnostics.

### Gate G4 (R4)
- Must pass: G3 + TS-A11Y, TS-LOC, TS-PERF, TS-EXPORT, TS-UPGRADE, TS-MASS.
- Fail condition: Quality checks degraded or compatibility failures.

### Gate G5 (R5)
- Must pass: G4 + TS-SDK, TS-CANARY, TS-COLLAB.
- Fail condition: Extension or rollout features bypass governance.

## 5. Non-Regression Strategy for Existing Screens

1. Baseline inventory of existing route and screen behavior before UI Studio code integration.
2. Enforce additive module boundaries and feature-flagged activation.
3. Run focused smoke checks on current screens whenever shared dependencies are touched by exception approval.
4. Include explicit no-impact declaration in every batch report.

## 6. Test Evidence Standards

- Each executed scenario must reference trace ID from `06-Traceability-Matrix.md`.
- Failures must include root-cause category and owner agent.
- Gate completion requires signed evidence from QA Automation and Release/DevOps agents.

## 7. Hard Freeze Compliance

- Tests for UI Studio must not require altering existing developed screens unless exception approval exists.
- If exception is approved, regression suite for impacted existing screens is mandatory before merge.
