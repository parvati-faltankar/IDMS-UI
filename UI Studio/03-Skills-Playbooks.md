# 03 - Skills Playbooks (Repo-Specific)

Each playbook is execution-ready and aligned to this repository context.

## Skill 1: Metadata Modeling

### When to Use
- Starting any UI Studio surface definition, action contract, or variant plan.

### Step-by-Step
1. Read product boundary and out-of-core constraints.
2. Define surface and view identity (`viewCode`, `surface`, `entity`).
3. Define layout tree and component nodes.
4. Define data bindings and rule conditions.
5. Attach action contracts and expected outcomes.
6. Add validation semantics and version tags.

### Checklist
- Typed interfaces complete.
- Required fields explicit.
- Version/migration note included.
- Blocking/warning validation markers defined.

### Common Failure Patterns
- Overloading metadata with business-rule truth.
- Unbounded custom props without schema.
- Missing runtime context requirements.

### Done Criteria
- Contract compiles and validates with sample metadata.
- Compatible with renderer and preview pipeline.

### Hard Freeze Compliance
- Do not retrofit existing screen files while drafting metadata models.

---

## Skill 2: Component Registry Governance

### When to Use
- Adding/modifying components available to builder and renderer.

### Step-by-Step
1. Register component type and category.
2. Define supported surfaces and binding types.
3. Define prop and event schema.
4. Mark accessibility posture and supported devices.
5. Define deprecation replacement if needed.
6. Add compatibility checks.

### Checklist
- Schema present and versioned.
- Unsupported surface usage blocked.
- Deprecation path defined.

### Common Failure Patterns
- Component added without prop schema.
- Runtime component exists but absent from registry.

### Done Criteria
- Component visible in builder palette and render-safe in runtime.

### Hard Freeze Compliance
- Avoid replacing existing shared components unless explicitly approved.

---

## Skill 3: Renderer Resolution Pipeline

### When to Use
- Implementing runtime metadata execution and overlay logic.

### Step-by-Step
1. Load base metadata.
2. Apply overlays in required order.
3. Apply permission pruning.
4. Evaluate behavior rules.
5. Resolve bindings.
6. Render components via registry.
7. Capture diagnostics events on error.

### Checklist
- Deterministic merge order enforced.
- Pruning before behavior evaluation.
- Safe fallback UI states implemented.

### Common Failure Patterns
- Running rule evaluation before permission pruning.
- Swallowing runtime errors without diagnostics.

### Done Criteria
- Identical context yields identical UI output.
- Failing component does not crash full surface.

### Hard Freeze Compliance
- Introduce renderer in isolated modules; avoid touching existing runtime screens.

---

## Skill 4: Preview and Validation Lifecycle

### When to Use
- Building authoring confidence and publish gating.

### Step-by-Step
1. Build preview context simulator.
2. Implement structural validator.
3. Implement binding validator.
4. Add severity model (error/warning/info).
5. Block publish on errors.
6. Store preview scenarios for reuse.

### Checklist
- Context permutations supported.
- Validation messages are path-specific.
- Publish gate wired to validator output.

### Common Failure Patterns
- Allowing publish with unresolved blocking issues.
- Preview using unrealistic permission contexts.

### Done Criteria
- Preview catches role/workflow/tenant differences pre-publish.

### Hard Freeze Compliance
- Validation tooling is additive; no invasive edits in existing flows.

---

## Skill 5: Transaction Workspace Modeling

### When to Use
- Defining header-line workflows (SO/PO/Invoice-like experiences).

### Step-by-Step
1. Define header entity and line entities.
2. Configure line-grid behaviors.
3. Configure totals panel placeholders and bindings.
4. Configure workflow strip and status interactions.
5. Configure attachments/notes/related panes.
6. Configure footer action contracts.

### Checklist
- Supports multi-line entity composition.
- Grid cell events mapped.
- Workflow display separated from workflow truth.

### Common Failure Patterns
- Treating transaction surface as simple CRUD form.
- Embedding accounting/tax truth in UI metadata.

### Done Criteria
- Transaction workspace can be previewed and validated end-to-end.

### Hard Freeze Compliance
- Do not modify existing transaction screens until explicitly instructed.

---

## Skill 6: Variants and Inheritance

### When to Use
- Role/tenant/node/branch/channel/personalization overlays.

### Step-by-Step
1. Define base view.
2. Define overlay conditions and priorities.
3. Store delta-only changes.
4. Run conflict detection lint.
5. Validate deterministic final resolved metadata.

### Checklist
- No full clone unless approved exception.
- Priority conflicts visible.
- Personalization cannot bypass permissions.

### Common Failure Patterns
- Overlay order ambiguity.
- Role variants redefining business-rule truth.

### Done Criteria
- Same context always resolves same final metadata.

### Hard Freeze Compliance
- Variant work remains metadata-layer only during initial rollout.

---

## Skill 7: Diagnostics and Release Promotion

### When to Use
- Hardening runtime quality and cross-environment deployment.

### Step-by-Step
1. Emit structured diagnostics events.
2. Redact sensitive data at source.
3. Package metadata release bundle.
4. Validate dependencies on target environment.
5. Enforce approval and gate checks.
6. Promote and monitor.

### Checklist
- Diagnostics include traceable IDs.
- Release blocked on dependency or approval failure.
- Rollback path tested.

### Common Failure Patterns
- Logging sensitive field values.
- Promoting unvalidated packages.

### Done Criteria
- Promotion pipeline reliable with auditable rollback.

### Hard Freeze Compliance
- Operationalization work must not alter existing business screen logic without approval.
