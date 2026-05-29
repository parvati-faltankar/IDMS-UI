# 17 - R2 Action Contract Editor Slice Specification

## Purpose

Define the first action-authoring slice in UI Studio Builder with strict, deterministic contracts and no impact on existing application screens or flows.

## Scope

- Hidden builder route only: `/ui-studio/builder`.
- In-memory draft editing only.
- Action categories in scope:
  - `ui.navigate`
  - `ui.open-panel`
  - `workflow.transition`
- Out of scope for this slice:
  - External API action contracts
  - Persistence to backend or storage
  - Visible navigation exposure changes

## Contract Additions

- `BuilderActionDraft` for authoring state.
- `BuilderActionOperation` payloads:
  - `addAction`
  - `updateAction`
  - `removeAction`
  - `reorderAction`
- `ActionDefinition` extended with:
  - `type`
  - `targetComponentId`
  - `payload`

## Validation Rules

- Blocking checks:
  - Action id required and unique.
  - Action type must be in the allowed slice enum.
  - Target component reference must exist if provided.
  - Payload field must be non-empty when provided for selected type:
    - `ui.navigate` -> `payload.route`
    - `ui.open-panel` -> `payload.panelId`
    - `workflow.transition` -> `payload.transitionId`
- Rule-to-action safety:
  - Behavior rules targeting actions must reference known action ids.
- All issues map to standardized `ValidationIssue` with deterministic `code`, `path`, and `blocking`.

## Builder UX Slice

- Right panel adds `Actions` tab.
- Supports deterministic action add/update/remove/reorder.
- Rule editor behavior remains unchanged and aligned to existing action target model.

## Hard Freeze Compliance

- Implementation remains isolated to `src/ui-studio/*` and `UI Studio/*` docs for this slice.
- No changes to existing `src/pages`, existing shared styles, or legacy screen flows.
- Hidden route and existing feature flag guard remain unchanged.
