# 06 - Traceability Matrix (Feature to Execution)

This matrix links feature codes to release, artifacts, ownership, and validation so execution remains auditable and decision-complete.

## Matrix Legend

- Features: P0/P1/P2/P3 from alignment document.
- Releases: R1-R5 from implementation plan.
- Artifacts: ART-01 to ART-12 from artifacts catalog.
- Tests: TS-* groups from test and gate plan.

## Traceability Table

| Trace ID | Feature Group | Release | Primary Artifacts | Owning Agent | Validation/Test Mapping |
|---|---|---|---|---|---|
| TRC-P0-A | P0-01 to P0-06 (view/typed surfaces/field/layout) | R1-R2 | ART-02, ART-03, ART-05, ART-08 | Metadata Architect + Builder UX | TS-SCHEMA, TS-BUILDER, TS-BIND |
| TRC-P0-B | P0-07 to P0-11 (list/form/grid/lookup/data source) | R2 | ART-02, ART-03, ART-05, ART-08 | Builder UX + Renderer Engineer | TS-RENDER, TS-BIND, TS-TXN |
| TRC-P0-C | P0-12 to P0-16 (rules/events/actions/workflow UX) | R2 | ART-04, ART-05, ART-07, ART-08 | Renderer Engineer + Builder UX | TS-RULE, TS-ACTION, TS-WORKFLOW |
| TRC-P0-D | P0-17 to P0-24 (lifecycle/preview/validation/roles/registry/action contract/autosave) | R1-R2 | ART-03, ART-04, ART-06, ART-07, ART-08 | Governance/Security + Metadata + Builder | TS-PUBLISH, TS-PREVIEW, TS-GOV |
| TRC-P1-A | P1-01 to P1-11 (process views/totals/filters/saved views) | R3-R4 | ART-02, ART-05, ART-08, ART-10 | Product + Builder UX | TS-TXN, TS-BUILDER, TS-RULE |
| TRC-P1-B | P1-12 to P1-20 (variants/permissions/schema sync/impact) | R3 | ART-04, ART-08, ART-09, ART-10 | Renderer Engineer + Metadata | TS-VARIANT, TS-PERM, TS-SCHEMA |
| TRC-P1-C | P1-21 to P1-27 (linting/diff/audit/maker-checker/locks/diagnostics) | R3 | ART-06, ART-08, ART-10, ART-11 | Governance + QA + DevOps | TS-GOV, TS-DIAG, TS-LOCK |
| TRC-P1-D | P1-28 to P1-34 (cross-view nav/inheritance/privacy/preview library) | R3-R4 | ART-05, ART-06, ART-09, ART-10 | Builder UX + Governance | TS-NAV, TS-VARIANT, TS-PRIV |
| TRC-P2-A | P2-01 to P2-10 (templates/presets/dashboard/wizard/a11y/perf) | R4 | ART-03, ART-05, ART-10 | Builder UX + QA | TS-BUILDER, TS-A11Y, TS-PERF |
| TRC-P2-B | P2-11 to P2-20 (localization/AI/doc gen/export/clone) | R4 | ART-05, ART-07, ART-10, ART-12 | Product + Metadata + QA | TS-LOC, TS-EXPORT, TS-COMPAT |
| TRC-P2-C | P2-21 to P2-25 (state config/search/inline edit/undo/compat) | R4 | ART-05, ART-08, ART-10, ART-12 | Builder UX + Metadata | TS-STATE, TS-MASS, TS-UPGRADE |
| TRC-P3-A | P3-01 to P3-07 (SDK/portal/mobile/canary/collab/visual tests) | R5 | ART-03, ART-04, ART-06, ART-11, ART-12 | Architecture + DevOps + QA | TS-SDK, TS-CANARY, TS-COLLAB |

## Out-of-Core Traceability Controls

- OC-01 through OC-14 are tracked as dependencies, not UI Studio ownership.
- Any work request mapped to OC codes must be redirected to owning platform module.

## Auditability Rules

- Every implementation batch must include at least one trace ID.
- Every trace ID must map to release gate criteria in `07-Test-and-Gate-Plan.md`.
- Every completed trace ID requires artifact references and test evidence.

## Hard Freeze Compliance

- Traceability execution does not authorize touching prohibited zones.
- If an implementation item requires prohibited-zone changes, exception protocol in `05-Non-Impact-Guardrails.md` must be applied first.
