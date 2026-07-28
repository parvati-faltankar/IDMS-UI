---
title: Global Styles and Theme Settings
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Global Styles and Theme Settings

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-THEME-001` | `CURRENT` | `SRC-REPO-CODE-THEME`, `SRC-REPO-DOC-THEME-BUILDER` | Current Theme Builder manages draft, published, and deactivated custom themes stored in local storage. | Theme state is global, not viewport-specific. | Publish/deactivate actions need textual confirmation. | Claude describes current theme persistence and status without inventing backend governance. | Backend persistence gap remains. |
| `DS-THEME-002` | `CURRENT` | `SRC-REPO-CODE-THEME` | Published custom themes are merged with built-in themes through Theme Provider behavior. | Active theme applies across viewport sizes. | Theme switcher exposes selected theme textually. | Current design requests can use published theme behavior. | None |
| `DS-THEME-003` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON` | Settings define available controls; styles define visual output; presets expose named reusable choices. | Responsive presets set defaults but do not override explicit device values. | Setting controls require labels and descriptions. | Claude-generated theme docs separate settings, styles, presets, and variations. | Current implementation is limited. |
| `DS-THEME-004` | `TARGET` | `SRC-SHOT-004`, `SRC-TARGET-GLOBAL-STYLES` | Target global styles include typography scale, color styles, spacing scale, layout defaults, surface hierarchy, and component defaults. | Local breakpoint overrides apply after global style defaults. | Global styles preserve contrast and text scaling. | A target design can specify global and local style impact separately. | Implementation not guaranteed. |
| `DS-THEME-005` | `TARGET` | `SRC-WP-GLOBAL-STYLES`, `SRC-TARGET-PUBLISH-GOVERNANCE` | Target publish lifecycle includes draft, validation, review, publish, deactivate, rollback, and audit trail. | Published styles apply globally while responsive overrides remain part of the style payload. | Review and publish actions require clear labels and confirmation. | Claude includes lifecycle states when target governance is requested. | Current Theme Builder lacks full governance. |
| `DS-THEME-006` | `ADOPTED` | `SRC-WP-GLOBAL-STYLES`, `SRC-WP-THEME-JSON`, `SRC-WP-THEME-HANDBOOK` | Target WordPress-inspired settings support both top-level defaults and block/component-level availability, so a control can be enabled globally but disabled or customized for a specific block or component. | Responsive defaults may be defined globally while explicit breakpoint overrides remain local and later in precedence. | Settings availability controls need readable labels and descriptions. | Claude can state whether a setting is global-only, block/component-specific, inherited, or locally overridden. | Current implementation is limited. |

## Settings And Style Hierarchy

| Layer | Role | Example |
|---|---|---|
| Platform default | Fallback values when no theme is active | Default spacing, neutral colors |
| Theme setting | Configurable design capability | Allowed font families |
| Block or component setting | Control availability scoped to one block/component family | Heading supports typography controls while another component does not |
| Global style | Chosen app-wide visual output | Heading font set to Noto Sans |
| Component style | Component-specific default | Button radius uses button radius token |
| Local override | Element or screen-specific change | Heading margin changes in the inspector |
| Responsive override | Breakpoint-specific local value | Mobile heading line-height differs from desktop |

## Current Theme Builder Limits

| Area | Current Limit |
|---|---|
| Fonts | Controlled list only |
| Base font size | 12 to 18 |
| Font weight | 400 to 700 |
| Line height | 16 to 28 |
| Radius | 0 to 24 |
| Spacing scale | 2 to 8 |
| Shadow | soft, medium, strong |
| Persistence | local storage |
| Governance | no full approval workflow found |
