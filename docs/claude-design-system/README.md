---
title: Claude-Ready WordPress-Inspired Design System Requirements Pack
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Claude-Ready WordPress-Inspired Design System Requirements Pack

This folder is the authoritative requirement pack for Claude-generated IDMS-UI design work. It separates current implementation truth from adopted WordPress-like behavior and target design-system capability.

## Pack Status

| Field | Value |
|---|---|
| Pack maturity | v1.2 approved evidence-hardened source-of-truth baseline |
| Markdown files | 23 |
| Screenshot assets | `evidence/screenshots/*.png` |
| Runtime code changes | None |
| Dev server, build, tests, browser automation | Out of scope |

## Reading Order

1. `00-claude-design-contract.md`
2. `01-scope-and-glossary.md`
3. `02-source-precedence-and-conflict-resolution.md`
4. `03-product-and-experience-principles.md`
5. `04-foundations-and-tokens.md`
6. `05-global-styles-and-theme-settings.md`
7. `06-layout-and-responsive-system.md`
8. `07-wordpress-parity-matrix.md`
9. `08-screenshot-evidence-index.md`
10. `components/*`
11. `patterns/*`
12. `quality/*`
13. `templates/design-brief-template.md`
14. `traceability-and-gap-register.md`

## Evidence Registry

| Evidence ID | Source | Last Checked | Notes |
|---|---|---|---|
| `SRC-REPO-DOC-ADMIN-SPEC` | `docs/adminspecification.md` | 2026-07-24 | Admin shell and admin component specification. |
| `SRC-REPO-DOC-PAGE-STRUCTURE` | `docs/admin-page-structure-standard.md` | 2026-07-24 | Page shell rules and legacy conflict notes. |
| `SRC-REPO-DOC-COMPONENT-CONTRACTS` | `docs/component-contracts.md` | 2026-07-24 | Shared component behavior contracts. |
| `SRC-REPO-DOC-UIUX` | `docs/ui-ux-features-complete.md` | 2026-07-24 | Current UI/UX feature documentation. |
| `SRC-REPO-DOC-UI-STUDIO` | `docs/UI_Studio_Feature_Set_and_Implementation_Alignment.md`, `src/ui-studio/README.md` | 2026-07-24 | UI Studio target and kickoff evidence. |
| `SRC-REPO-DOC-THEME-BUILDER` | `docs/ui_components/theme_builder.md` | 2026-07-24 | Theme Builder documentation. |
| `SRC-REPO-DOC-MENU-BUILDER` | `docs/ui_components/menu_builder.md` | 2026-07-24 | Menu Builder documentation. |
| `SRC-REPO-CODE-APP-CHROME` | `src/components/common/AppShell.tsx`, `src/components/common/AppSidebar.tsx`, `src/components/common/AppTopHeader.tsx`, `src/components/common/ThemeSwitcher.tsx` | 2026-07-24 | Runtime app chrome evidence. |
| `SRC-REPO-CODE-APP-PRIMITIVES` | `src/components/app/AppButton.tsx`, `src/components/app/AppDialog.tsx`, `src/components/app/AppDrawer.tsx` | 2026-07-24 | Runtime app primitive evidence. |
| `SRC-REPO-CODE-ADMIN-SHELLS` | `src/admin/AdminShell.tsx`, `src/experience/components/AdminPageShell/*`, `src/experience/components/AdminListPageShell/*`, `src/experience/components/AdminConfigShell/*`, `src/experience/components/PageHeader/*` | 2026-07-24 | Runtime admin shell evidence. |
| `SRC-REPO-CODE-DATA` | `src/components/common/CommonDataGrid.tsx`, `src/components/common/MasterDataTable.tsx`, `src/components/common/CatalogueViewSelector.tsx`, `src/components/common/CatalogueViewConfigurator.tsx`, `src/components/common/CatalogueFilterDrawer.tsx`, `src/components/common/DataGridConfigurator.tsx`, `src/components/common/DataGridChartDrawer.tsx`, `src/components/common/DocumentPreviewDrawer.tsx`, `src/components/common/StatusBadge.tsx`, `src/components/common/GlobalSearchPanel.tsx` | 2026-07-24 | Runtime data and catalogue component evidence. |
| `SRC-REPO-CODE-FORMS` | `src/components/common/DatePicker.tsx`, `src/experience/components/AdminPageShell/MasterFormField.tsx`, `src/experience/components/AdminPageShell/MasterFormGrid.tsx` | 2026-07-24 | Runtime form control evidence. |
| `SRC-REPO-CODE-EXPERIENCE` | `src/experience/components/SmartDrawer/*`, `src/experience/components/HelpDrawer/*`, `src/experience/components/CommandPalette/*`, `src/experience/components/EmptyStateGuide/*`, `src/experience/components/ValidationChecklist/*`, `src/experience/components/FieldHelpPopover/*` | 2026-07-24 | Runtime experience component evidence. |
| `SRC-REPO-CODE-BUILDERS` | `src/pages/profile/ThemeBuilder.tsx`, `src/components/common/MenuBuilder/MenuBuilderPage.tsx`, `src/pages/profile/PrintBuilder.tsx`, `src/pages/profile/LanguageBuilder.tsx` | 2026-07-24 | Runtime builder surface evidence. |
| `SRC-REPO-CODE-THEME` | `src/theme/themeRegistry.ts`, `src/theme/customThemeBuilder.ts`, `src/theme/ThemeProvider.tsx` | 2026-07-24 | Runtime theme model evidence. |
| `SRC-REPO-CODE-COMPONENTS` | `src/components/common/*`, `src/components/app/*`, `src/experience/components/*` | 2026-07-24 | Broad component code fallback; prefer exact code IDs above for `CURRENT` rows. |
| `SRC-REPO-CODE-UI-STUDIO` | `src/ui-studio/*` | 2026-07-24 | Runtime UI Studio kickoff evidence. |
| `SRC-WP-DESIGN` | `https://make.wordpress.org/design/handbook/` | 2026-07-24 | WordPress design handbook reference. |
| `SRC-WP-ADMIN-SCREENS` | `https://wordpress.org/documentation/article/administration-screens/` | 2026-07-24 | WordPress admin screen layout reference. |
| `SRC-WP-ADMIN-UI` | `https://developer.wordpress.org/block-editor/reference-guides/packages/packages-admin-ui/` | 2026-07-24 | WordPress admin UI package reference. |
| `SRC-WP-BLOCK-EDITOR` | `https://developer.wordpress.org/block-editor/` | 2026-07-24 | WordPress block editor architecture reference. |
| `SRC-WP-COMPONENTS` | `https://developer.wordpress.org/block-editor/reference-guides/components/` | 2026-07-24 | WordPress component reference. |
| `SRC-WP-GLOBAL-STYLES` | `https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/` | 2026-07-24 | WordPress global settings and styles guide. |
| `SRC-WP-THEME-HANDBOOK` | `https://developer.wordpress.org/themes/global-settings-and-styles/` | 2026-07-24 | WordPress Theme Handbook global styles reference. |
| `SRC-WP-THEME-JSON` | `https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/` | 2026-07-24 | WordPress theme.json reference. |
| `SRC-SHOT-001` | `evidence/screenshots/wp-editor-layout-panel.png` | 2026-07-24 | Inspector layout panel screenshot. |
| `SRC-SHOT-002` | `evidence/screenshots/wp-editor-responsive-spacing-popover.png` | 2026-07-24 | Responsive spacing popover screenshot. |
| `SRC-SHOT-003` | `evidence/screenshots/wp-editor-canvas-toolbar.png` | 2026-07-24 | Canvas toolbar screenshot. |
| `SRC-SHOT-004` | `evidence/screenshots/wp-editor-typography-popover.png` | 2026-07-24 | Typography popover screenshot. |
| `SRC-TARGET-BUILDER-GOVERNANCE` | Target requirement documented in this pack | 2026-07-24 | Builder validation, review, and publish governance. |
| `SRC-TARGET-CLAUDE-STRICTNESS` | Target requirement documented in this pack | 2026-07-24 | Claude no-invention and source-strictness behavior. |
| `SRC-TARGET-COMPONENT-REGISTRY` | Target requirement documented in this pack | 2026-07-24 | Expanded UI Studio/component registry behavior. |
| `SRC-TARGET-DATA-DISPLAY` | Target requirement documented in this pack | 2026-07-24 | Loading, offline, permission, and partial data states. |
| `SRC-TARGET-DOC-GOVERNANCE` | Target requirement documented in this pack | 2026-07-24 | Documentation governance and contradiction handling. |
| `SRC-TARGET-DOC-HARDENING` | Target requirement documented in this pack | 2026-07-24 | Red-team hardening baseline. |
| `SRC-TARGET-FEEDBACK-STATES` | Target requirement documented in this pack | 2026-07-24 | Enterprise feedback state coverage. |
| `SRC-TARGET-GLOBAL-STYLES` | Target requirement documented in this pack | 2026-07-24 | Expanded global styles behavior. |
| `SRC-TARGET-LOCALIZATION` | Target requirement documented in this pack | 2026-07-24 | Localization, RTL, and text expansion. |
| `SRC-TARGET-MOTION` | Target requirement documented in this pack | 2026-07-24 | Motion tokens and reduced-motion behavior. |
| `SRC-TARGET-NON-DESTRUCTIVE-EDITING` | Target requirement documented in this pack | 2026-07-24 | Undo, reset, and reversible editing. |
| `SRC-TARGET-PUBLISH-GOVERNANCE` | Target requirement documented in this pack | 2026-07-24 | Publish, rollback, audit, and approval lifecycle. |
| `SRC-TARGET-REDUCED-MOTION` | Target requirement documented in this pack | 2026-07-24 | Reduced-motion accessibility. |
| `SRC-TARGET-RESPONSIVE` | Target requirement documented in this pack | 2026-07-24 | Responsive editing model. |
| `SRC-TARGET-SEMANTIC-TOKENS` | Target requirement documented in this pack | 2026-07-24 | Semantic token architecture. |
| `SRC-TARGET-TYPOGRAPHY` | Target requirement documented in this pack | 2026-07-24 | Rich typography inspector behavior. |
| `SRC-TARGET-WORKFLOW-STATES` | Target requirement documented in this pack | 2026-07-24 | Workflow state coverage. |

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-README-001` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS`, `SRC-REPO-DOC-UIUX` | Claude reads this pack before generating screens, components, or builder behavior. | Reading order applies to desktop, tablet, and mobile design requests. | Generated output follows the quality docs. | A Claude prompt can name this README and resolve the correct next document. | None |
| `DS-README-002` | `ADOPTED` | `SRC-WP-ADMIN-SCREENS`, `SRC-WP-ADMIN-UI`, `SRC-WP-GLOBAL-STYLES`, `SRC-SHOT-001` | WordPress-like means admin shell conventions, global settings/styles hierarchy, and screenshot-backed builder inspector behavior. | Responsive behavior follows the layout and responsive docs. | Inspector and canvas controls remain keyboard and screen-reader aware. | No generated design claims literal WordPress parity unless the parity matrix adopts it. | None |
| `DS-README-003` | `ADOPTED` | `SRC-TARGET-DOC-HARDENING` | This pack is approved as the Claude generation source after red-team hardening and static validation. | Target rows never imply current runtime support. | Target controls still require accessibility rules. | Every target capability uses a concrete evidence ID and appears in the gap register where implementation is missing. | None |

## Claude Usage Rules

- Use `CURRENT` rows for current-state designs.
- Use `ADOPTED` rows for approved behavior from docs, WordPress, or screenshots.
- Use `TARGET` rows only when future capability is allowed.
- Never generate from a `DEPRECATED` row.
- Resolve evidence conflicts through `02-source-precedence-and-conflict-resolution.md`.
- Prefer exact code evidence IDs, such as `SRC-REPO-CODE-ADMIN-SHELLS` or `SRC-REPO-CODE-DATA`, over broad fallback IDs when proving `CURRENT` behavior.