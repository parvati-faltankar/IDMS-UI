# 04 - Artifacts Catalog (Template-Level Guidance)

This catalog defines all required implementation artifacts and quality gates.

## Artifact Inventory

| Artifact ID | Artifact | Owner | Purpose | Approval Gate |
|---|---|---|---|---|
| ART-01 | Product Boundary Spec | Product/Domain Agent | Lock scope, out-of-core boundaries, anti-goals | Product + Architecture |
| ART-02 | Metadata Schema Package Spec | Metadata Architect Agent | Canonical type system and version model | Architecture |
| ART-03 | Component Registry Manifest Spec | Metadata + Builder Agents | Govern component contract and compatibility | Architecture + UX |
| ART-04 | Runtime Renderer Contract Spec | Renderer Engineer Agent | Deterministic runtime execution behavior | Architecture + Security |
| ART-05 | Builder UX Specification | Builder UX Engineer Agent | Authoring shell behavior and panel contract | Product + UX |
| ART-06 | Governance and Lifecycle Policy | Governance/Security Agent | RBAC, maker-checker, locks, publish/rollback rules | Security + Platform |
| ART-07 | API Contract Pack | Metadata + Platform Team | Define view/preview/publish/release/diagnostics endpoints | Architecture + Backend |
| ART-08 | Validation Rule Catalog | Metadata + QA Agents | Blocking/warning validation rules | QA + Architecture |
| ART-09 | Variant Resolution Specification | Renderer + Metadata Agents | Overlay precedence and conflict handling | Architecture |
| ART-10 | Test Scenario Catalog | QA Automation Agent | End-to-end test scenarios mapped to feature codes | QA Lead |
| ART-11 | Operational Runbooks | Release/DevOps Agent | Promote, rollback, lock recovery, diagnostics triage | Platform Ops |
| ART-12 | Metadata Migration Plan | Metadata Architect Agent | Backward compatibility and upgrade policy | Architecture + Release |

## Required Sections by Artifact

### ART-01 Product Boundary Spec
- Scope statement
- Out-of-core capabilities
- Non-negotiable boundaries
- Change-control policy

### ART-02 Metadata Schema Package Spec
- Interface map
- Versioning policy
- Validation rules
- Compatibility behavior

### ART-03 Component Registry Manifest Spec
- Component definitions
- Supported surfaces/bindings
- Schema contracts
- Deprecation policy

### ART-04 Runtime Renderer Contract Spec
- Resolution order
- Permission prune stage
- Rule evaluation stage
- Fallback/error model
- Diagnostics emission

### ART-05 Builder UX Specification
- Shell layout
- Panel behavior
- Editing lifecycle
- Validation and publish controls

### ART-06 Governance and Lifecycle Policy
- Role definitions
- Approval flow
- Lock and conflict protocol
- Emergency operations
- Audit requirements

### ART-07 API Contract Pack
- Endpoint list
- Request/response contracts
- Error and diagnostics model
- Auth expectations

### ART-08 Validation Rule Catalog
- Rule IDs and severity
- Blocking criteria
- Warning criteria
- Rule examples

### ART-09 Variant Resolution Specification
- Overlay hierarchy
- Priority rules
- Conflict detection rules
- Personalization limits

### ART-10 Test Scenario Catalog
- Scenario IDs
- Preconditions
- Steps
- Assertions
- Linked feature codes

### ART-11 Operational Runbooks
- Promote flow
- Rollback flow
- Lock override flow
- Incident triage flow

### ART-12 Metadata Migration Plan
- Migration strategy per version
- Compatibility windows
- Rollback of schema versions

## Quality Criteria

- Clear ownership and approver per artifact.
- Explicit link to traceability matrix IDs.
- No placeholder sections.
- Validation of cross-artifact terminology consistency.

## Dependencies

- ART-01 required before all others.
- ART-02 and ART-03 required before ART-04/05.
- ART-04/05 required before ART-08/10.
- ART-06 required before production publish and ART-11 operations.

## Hard Freeze Compliance

- Artifact creation is documentation and metadata governance work only.
- Artifact templates must not instruct direct edits to existing developed screens unless explicit approval note is provided.
