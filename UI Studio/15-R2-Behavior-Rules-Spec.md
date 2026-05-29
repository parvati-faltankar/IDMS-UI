# 15 - R2 Behavior Rules Editor Slice Specification

## Summary

This specification defines the first behavior-rules authoring slice in the hidden UI Studio builder route.

Decisions:

- Effects allowed in this slice: `show`, `hide`, `enable`, `disable`
- Behavior authoring placed in right panel `Behavior` tab
- Evaluation model: deterministic order with last-wins conflict resolution
- Draft persistence: in-memory only

## 1. Rule Authoring Contracts

### BuilderRuleDraft

- `id`
- `targetType`: `component` | `action`
- `targetId`
- `effect`: `show` | `hide` | `enable` | `disable`
- `condition`
- `priority`

### Rule Operations

- Add rule
- Update rule
- Remove rule
- Reorder rules

These operations update `metadata.rules` immutably and set draft dirty state.

## 2. Behavior Tab UX

- Right panel now includes:
  - `Properties` tab
  - `Behavior` tab
- Behavior tab supports:
  - target type selection
  - target selection
  - effect selection
  - simple condition input (`context.mode equals value`)
  - add/remove/reorder controls

## 3. Evaluation Contract

- Only allowed effects are evaluated.
- Rules are evaluated in stored order.
- If multiple rules match the same target, last matching rule wins for that state domain.
- Component state:
  - `hidden`, `disabled`
- Action state:
  - `hidden`, `disabled`

## 4. Validation Guardrails

Validation blocks:

1. Unknown rule targets (component/action)
2. Unsupported effects outside allowed slice set
3. Malformed rule condition shape

## 5. Deferred Capabilities

- `required`, `readonly`, `warning` effects
- Advanced condition builder
- Rule groups and scoped conflict visualizations
- Backend persistence for rules

## 6. Hard-Freeze Compliance

- No visible navigation exposure.
- No changes in `src/pages`, `src/components/common`, `src/styles`.
- Existing hidden route + feature flag model retained.
