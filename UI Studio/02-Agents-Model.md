# 02 - Agents Model (Role-Based Matrix)

This model defines implementation ownership and handoffs for UI Studio delivery.

## Agent Matrix

| Agent | Primary Mission | Decisions Owned | Core Outputs |
|---|---|---|---|
| Product/Domain Agent | Preserve product boundary and enterprise use cases | Scope fit, feature acceptance, out-of-core enforcement | Scope notes, acceptance narratives, process mappings |
| Metadata Architect Agent | Own metadata contracts and compatibility strategy | Type models, schema evolution, version policy | Type definitions, migration policy, compatibility matrix |
| Renderer Engineer Agent | Implement deterministic runtime renderer | Resolution order, fallback patterns, diagnostics hooks | Renderer modules, runtime tests, perf baselines |
| Builder UX Engineer Agent | Deliver governed authoring UX | Builder panel behavior, canvas constraints, authoring flow | Builder shell, property editors, authoring validations |
| Governance/Security Agent | Enforce publish and permission governance | Maker-checker, RBAC model, audit requirements | Governance specs, access controls, audit rules |
| QA Automation Agent | Ensure platform reliability and safety | Test matrix coverage, gate pass/fail criteria | Automated suites, scenario packs, release readiness report |
| Release/DevOps Agent | Ensure safe promotion and environment integrity | Release package controls, dependency validation | Promotion pipeline configs, runbooks, rollback playbooks |

## Agent Specifications

### 1) Product/Domain Agent

- Mission
  - Keep UI Studio aligned to transaction-heavy enterprise workflows.
- Inputs
  - Source alignment document, stakeholder requirements, process variations.
- Outputs
  - Approved feature intent, out-of-core boundary checks, release priority decisions.
- Handoffs
  - To Metadata Architect and Builder UX with signed scope contracts.
- Quality Gates
  - No feature violates ownership boundary.
- Anti-Goals
  - Avoid turning UI Studio into schema designer or generic page builder.

### 2) Metadata Architect Agent

- Mission
  - Establish typed contracts and long-term metadata evolution strategy.
- Inputs
  - Product boundary, component needs, runtime requirements.
- Outputs
  - Canonical interfaces, schema validators, migration guidance, compatibility policy.
- Handoffs
  - To Renderer, Builder, QA.
- Quality Gates
  - Every contract field has lifecycle and validation semantics.
- Anti-Goals
  - No ad hoc untyped JSON paths for core behavior.

### 3) Renderer Engineer Agent

- Mission
  - Convert approved metadata into secure and resilient runtime UI.
- Inputs
  - Metadata contracts, registry definitions, permission model.
- Outputs
  - Renderer pipeline, variant resolver, pruning layer, diagnostics emitter.
- Handoffs
  - To QA and Release for runtime certification.
- Quality Gates
  - Deterministic outputs, graceful fallback, no data leakage.
- Anti-Goals
  - No authoring logic embedded in runtime paths.

### 4) Builder UX Engineer Agent

- Mission
  - Build productive, governed authoring experience.
- Inputs
  - Registry, contracts, validation services, product UX patterns.
- Outputs
  - Builder shell, panel workflows, safe editing flows, preview triggers.
- Handoffs
  - To QA for usability and robustness checks.
- Quality Gates
  - No bypass of validation/publish controls.
- Anti-Goals
  - No freeform canvas that breaks governance.

### 5) Governance/Security Agent

- Mission
  - Ensure authoring and publish controls are enterprise-safe.
- Inputs
  - Access models, compliance needs, audit standards.
- Outputs
  - RBAC map, maker-checker flow, lock policy, emergency controls.
- Handoffs
  - To Release/DevOps and QA.
- Quality Gates
  - Audit completeness and least-privilege enforcement.
- Anti-Goals
  - No frontend-only security assumptions.

### 6) QA Automation Agent

- Mission
  - Prevent regressions and enforce release gates.
- Inputs
  - Contracts, renderer behavior, governance rules, scenario catalog.
- Outputs
  - Automated suites, gate checklists, failure triage reports.
- Handoffs
  - To Release/DevOps for promotion decisions.
- Quality Gates
  - Coverage across schema, renderer, variant, workflow, and diagnostics paths.
- Anti-Goals
  - No release with unresolved blocking test failures.

### 7) Release/DevOps Agent

- Mission
  - Move metadata safely across environments.
- Inputs
  - Package outputs, dependency manifests, audit approvals.
- Outputs
  - Promotion pipelines, validation reports, rollback execution evidence.
- Handoffs
  - To product and governance owners.
- Quality Gates
  - Promotion blocked on dependency or approval mismatch.
- Anti-Goals
  - No direct production activation without validated package route.

## Collaboration Protocol

1. Product boundary approval before technical breakdown.
2. Metadata contracts baseline before builder acceleration.
3. Governance model before production publish flow.
4. QA gate pass mandatory before release promotion.

## Hard Freeze Compliance

- Agent activities must avoid modifications to existing developed screens/routes/styles unless explicitly approved.
- Agents must prioritize additive isolated modules and artifact-driven planning until an exception is granted.
