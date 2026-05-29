# 09 - UI Studio Feature-Flag Integration Specification

## Summary

This specification defines the first controlled integration of UI Studio into the existing application with minimal touch and hard-freeze compliance.

- Integration mode: Hidden route only
- Flag source: Build environment variable
- Route namespace: `/ui-studio/*`
- Navigation exposure: Not allowed in this phase

## 1. Feature Flag Contract

### Contract Key

- `VITE_UI_STUDIO_ENABLED`

### Accepted Values

- Truthy: `true`, `1`, `yes`
- Falsy: `false`, `0`, `no`, undefined

### Default Behavior

- Default is disabled when key is missing or invalid.

### Environment Activation Matrix

| Environment | Default | Allowed Override | Expected State |
|---|---|---|---|
| Local | Off | On via `.env.local` | Controlled developer access |
| Dev | Off | On by deployment config | Internal validation only |
| QA/UAT | Off | On after gate approval | Controlled testing |
| Production | Off | On only after sign-off | Not enabled in this phase |

## 2. Route Guard Contract

### Route

- `paths.uiStudioRoot = '/ui-studio/*'`

### Guard Behavior

- Flag ON: render hidden UI Studio entry page.
- Flag OFF: redirect to `paths.home`.
- No route links are added to existing navigation.

### Safety Requirement

- Route guard must fail safe to redirect.
- Existing route behavior must remain unchanged.

## 3. Integration Touchpoints (Minimal Diff)

1. Add UI Studio integration helpers in `src/ui-studio/integration/*`.
2. Add route path constant in route config.
3. Add a single guarded route registration in app routes.

No other runtime integration points are approved in this phase.

## 4. Smoke Test Contract

1. Flag OFF: `/ui-studio/*` is inaccessible and redirects to home.
2. Flag ON: `/ui-studio/*` renders baseline UI Studio page.
3. Existing primary application routes remain unchanged.
4. Changes remain within approved paths.

## 5. Visibility Promotion Gate (Future)

UI Studio can be promoted from hidden route to visible navigation only after:

1. R1 hardening suite pass
2. Integration smoke tests pass
3. Hard-freeze regression checks pass
4. Documented product/engineering sign-off

## Hard Freeze Compliance

- This integration spec prohibits any edits to existing navigation structures in this phase.
- Changes must stay additive and low-touch.
