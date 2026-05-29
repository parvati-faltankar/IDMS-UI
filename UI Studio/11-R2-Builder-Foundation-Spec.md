# 11 - R2 Builder Foundation Specification

## Summary

This specification defines the first builder slice under hidden, flagged access with strict hard-freeze controls.

Primary decisions:

- Builder route remains hidden under existing feature flag.
- First slice is shell + read-only canvas.
- First edit scope is field add/remove/reorder only.
- Advanced editing (layout/rules/actions) is deferred.

## 1. Route and Access Contract

- Existing flag key: `VITE_UI_STUDIO_ENABLED`
- Hidden builder route: `/ui-studio/builder`
- Guard behavior:
  - Enabled: builder route accessible
  - Disabled: redirect to home
- No sidebar/menu/header link added in this phase

## 2. Builder Contracts

### BuilderDraftState

- `metadata`: active draft metadata snapshot
- `dirty`: change indicator
- `selectedComponentId`: selected field in canvas
- `selectedNodeId`: selected layout node

### Field Operations

- Add field: append component + reference in section
- Remove field: remove component + all layout references
- Reorder field: deterministic reorder in target section

### Validation Summary

- Read-only validation panel in bottom region
- Shows total issues and blocking count from existing validator

## 3. UI Composition for This Slice

- Top: builder topbar (save/validate/preview placeholders)
- Left: components + fields panel (field operation controls enabled)
- Center: read-only selectable canvas
- Right: selected field properties summary
- Bottom: validation summary panel

## 4. Deferred Capabilities

- Layout node editing
- Behavior rule editing
- Action contract editor
- Visible navigation exposure

## 5. Hard-Freeze Compliance

- New builder code remains under `src/ui-studio/builder/*`.
- Route changes are limited to approved UI Studio integration points only.
- No changes to `src/pages`, `src/components/common`, `src/styles`.
