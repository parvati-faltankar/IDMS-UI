# 05 - Non-Impact Guardrails (Hard Freeze Enforcement)

## 1. Policy Objective

Protect existing developed screens, routes, components, styles, and runtime flows while UI Studio is being introduced.

## 2. Enforcement Mode

- Mode: **Hard Freeze**
- Rule: Existing developed screen structure remains untouched unless explicit user approval is captured.

## 3. Additive-Only Strategy

Allowed default change pattern:
1. Create new `UI Studio` documentation and isolated modules.
2. Add new metadata contracts and renderer modules in isolated namespaces.
3. Introduce feature flags or opt-in activation paths if runtime integration is needed later.

Forbidden default pattern:
1. Editing existing transaction screens directly.
2. Altering current route mappings for active business flows.
3. Refactoring shared UI components used by current production-like pages.
4. Modifying shared global styling tokens tied to current screens.

## 4. Prohibited Change Zones (Without Explicit Approval)

- `src/pages/**` (existing business modules)
- `src/routes/**` (active route behavior)
- `src/components/common/**` (shared runtime primitives)
- `src/styles/**` (current system-wide styles)
- Existing data contracts tied to already developed flows

## 5. Allowed Change Zones (By Default)

- `UI Studio/**` documentation package
- Future isolated namespaces such as:
  - `src/ui-studio/**`
  - `src/ui-studio-renderer/**`
  - `src/ui-studio-builder/**`
  - `src/ui-studio-metadata/**`

## 6. Exception Change-Control Protocol

If a cross-cutting change is required:
1. Raise a change request with reason and impact estimate.
2. List exact files and expected behavior effects.
3. Provide rollback strategy.
4. Obtain explicit approval before coding.
5. Execute with focused diff and regression checks.

## 7. Verification Checklist (Per Implementation Batch)

### Before Work
- Confirm task is additive.
- Confirm no prohibited paths in planned edits.
- Confirm traceability IDs and artifact links.

### After Work
- Verify only approved files changed.
- Verify no route or screen behavior changed unintentionally.
- Run non-invasive sanity checks only (unless explicitly approved otherwise).
- Record hard freeze compliance note in delivery summary.

## 8. Compliance Evidence Template

- Batch ID:
- Scope:
- Changed paths:
- Prohibited paths touched: Yes/No
- Approval reference (if Yes):
- Regression checks executed:
- Reviewer sign-off:

## 9. Hard Freeze Compliance

- This file is the controlling guardrail artifact.
- Any deviation without explicit approval is non-compliant.
