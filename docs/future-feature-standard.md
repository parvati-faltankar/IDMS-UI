# Future Feature Implementation Standard

Every future UI feature must follow this process. AI tools must read this document before
implementing any new page, module, or component.

## Feature gate checklist

Every new feature must satisfy all items below before implementation begins. This list is
machine-verified by `scripts/check-future-feature-standard.js`.

### Required definitions

- [ ] **UX intent** — One sentence describing the user goal this feature serves.
- [ ] **Route placement** — The exact route path (e.g. `/admin/master/tax-master`).
- [ ] **Page shell** — Which shell component wraps the page: `AdminShell` + `AdminListPageShell` (list/table pages), `AdminShell` + `AdminPageShell` (config pages), `AdminConfigShell` (multi-section form flows), or **Compact Form Workspace** (guided multi-step activation workflows with Draft → Active lifecycle — see `docs/admin-page-structure-standard.md §10`).
- [ ] **Reused components** — List every experience component that will be reused from `src/experience/components/`.
- [ ] **Help topic** — The `helpTopicId` string that links this page to a `HelpTopic` entry in `helpTopics.ts`.
- [ ] **Empty state** — What `EmptyStateGuide` title/description/action appears when the section has no data.
- [ ] **Loading state** — How the page communicates async data loading (skeleton, spinner, disabled state).
- [ ] **Error state** — How the page communicates a failed load or save operation.
- [ ] **Storybook story** — If a new reusable component is introduced, a `.stories.tsx` file is mandatory.
- [ ] **Governance checks** — All scripts in `npm run ui:governance` must pass before the feature is merged.

## Before implementation

1. Identify the user goal and write the **UX intent** statement.
2. Confirm the **route placement** does not conflict with existing routes in `routeConfig.ts`.
3. Choose the correct **page shell**:
   - **Admin list/table page** — use `AdminListPageShell`. This is the default for any new admin page whose primary content is a searchable/filterable table. It keeps the table visible above the fold on standard laptop screens.
   - **Admin config/form page** — use `AdminPageShell` for standard form pages. Use `AdminConfigShell` for multi-section setup workflows with a visible completion state.
   - **Guided create/edit form** (4+ ordered steps + Draft → Active lifecycle) — use the **Compact Form Workspace** layout instead of AdminPageShell. See `docs/admin-page-structure-standard.md §10` and run the generator with `--type guided`.
   - See `docs/admin-page-structure-standard.md §1a`, `§1b`, `§1c`, `§10` for the full decision guide.
4. List the **reused components** from `src/experience/components/` that apply.
5. Check whether a **help topic** already exists in `helpTopics.ts`; add one if not.
6. Define the **empty state** copy (title, description, primary action label).
7. Define the **loading state** treatment — prefer skeleton rows over spinners for table data.
8. Define the **error state** treatment — inline error strip with a retry action.
9. Define **Storybook story** requirements for any new reusable component.
10. Confirm the feature does not duplicate an existing component — consult `docs/component-contracts.md`.

## During implementation

Rules:

- Use `AdminListPageShell` for all new admin list/table pages. It provides a compact PageBar + SmartToolbar that keeps the table above the fold without wasting vertical space on large marketing-style headers.
- Use `AdminPageShell` for config and form pages. Use `AdminConfigShell` for multi-section config pages (org master, KYC, numbering, etc.).
- Use the **Compact Form Workspace** layout for guided create/edit forms with 4+ steps and a Draft → Active lifecycle. Do NOT use `AdminPageShell` for these forms.
- Do not create one-off drawer, dialog, header, or sidebar components — reuse experience components.
- Every admin/configuration page must wire a `helpTopicId` and render `<HelpDrawer>`.
- Every section with no data must render `<EmptyStateGuide>` with a clear next action.
- Keep UI light and uncluttered — apply progressive disclosure for advanced options.
- Add `.stories.tsx` for every new reusable component.
- Route files must follow the conventions in `routeConfig.ts`. For admin masters specifically, follow `docs/admin-master-factory.md`.

## After implementation

Run all governance scripts in order:

- `npm run build` — must produce zero TypeScript errors in changed files
- `npm run ui:governance` — runs all checks below:
  - `check-empty-files.js` — no placeholder or empty files
  - `check-help-topics.js` — all required help topics present
  - `check-stories.js` — every component directory has a `.stories.tsx`
  - `check-component-contracts.js` — `.tsx`, `.types.ts`, `.stories.tsx`, `index.ts` all present
  - `check-future-feature-standard.js` — governance docs present and complete
  - `check-page-structure.js` — admin pages use approved shells and wire help

## Acceptance checklist

A feature is accepted only if:

- It has one clear primary action.
- Advanced actions are not overexposed.
- It uses approved components (or has a documented reason in `docs/component-contracts.md`).
- It has meaningful labels, descriptions, and empty states using `EmptyStateGuide`.
- It has a wired `helpTopicId` (admin/config pages) or documented exemption.
- It does not introduce duplicate layout patterns (no custom header, sidebar, or drawer re-implementations).
- It passes all governance scripts with zero failures.
- Its Storybook stories cover at least: Default, Empty, and one variant state.

## Guided admin create/edit form checklist

For any new admin form that uses the **Compact Form Workspace** (Draft → Active lifecycle,
4+ steps), complete this checklist **before writing code**.
See `docs/admin-page-structure-standard.md §10` for the full standard.

### Required definitions (all must be documented before implementation)

- [ ] **Step model** — List each step key in order (e.g. `['basic', 'applicability', 'config', 'format', 'review']`). Document which steps gate which downstream steps.
- [ ] **Action hierarchy** — Document what appears in: compact header, footer during setup, footer on review step, footer for view-only mode, footer for active-policy edit.
- [ ] **Validation checklist** — List all `computeActivationChecklist` items (one per required field or business rule). Gate the Activate button on `checklistAllPassed`.
- [ ] **Preview strategy** — Does the form generate an output (code, number, label)? If yes, define `buildSamplePreview()` logic and the incomplete message. If no, omit the preview chip.
- [ ] **Footer behaviour** — Confirm: Save Draft in footer only (not in header `secondaryActions`), Activate behind checklist + confirmation dialog, Continue disabled or gated when required fields are missing.
- [ ] **Help topic** — Define `helpTopicId` and write the help topic `steps` covering the full workflow from new record to activation.
- [ ] **Empty / loading / error states** — Define `EMPTY_FORM` defaults, loading treatment (disable save until ready), and error treatment (inline banner, no navigation away).
- [ ] **Locked fields strategy** — Which fields are locked once the record is Active? Document the `isLocked(field)` logic and what `lockedInputStyle` looks like.

### Post-implementation verification (guided forms)

- [ ] Combined compact header + workflow bar is ≤ 136 px.
- [ ] Footer uses `flexShrink: 0`, NOT `position: sticky`.
- [ ] Footer does not overlap form fields at any scroll position.
- [ ] Save Draft appears only in footer — NOT in header `secondaryActions`.
- [ ] Activate button is disabled when `!checklistAllPassed`.
- [ ] Activate opens a confirmation dialog with summary grid + consequence warning.
- [ ] Step nav states are logically gated — no downstream step shows "complete" before prerequisites are met.
- [ ] Section panel badges match step nav state (use `completionOverride` when gating applies).
- [ ] Auto-generated codes are compact metadata rows, not full-width disabled inputs.
- [ ] `npm run ui:governance` passes with 0 failures and 0 guided form layout warnings.

## Table design checklist

For any new admin list page that uses a table, complete this checklist **before writing code**.
AI tools and developers must document answers to each item in the feature spec or PR description.

- [ ] **Table intent** — What decision should a user be able to make from the table alone, without clicking into a record?
- [ ] **Smart column design** — Are columns grouped using the standard 5-column pattern (Identity, Context, Key Configuration, Status/Health, Actions)? See `docs/admin-page-structure-standard.md §7b` and `docs/admin-master-factory.md §7`.
- [ ] **Row action strategy** — Which actions are visible icons (max 2) and which go in the more menu? Are destructive actions separated by a divider?
- [ ] **Preview drawer strategy** — Does the page need a preview drawer? If yes, what does it show? If no, document why (e.g. "record is simple enough that Edit is the only action").
- [ ] **Empty state** — What is shown when the filtered set is empty? Is there a different message for "no records exist" vs. "no records match the current filter"?
- [ ] **Help topic** — Is `helpTopicId` linked to a real `HelpTopic` entry with domain-specific `steps` and `tips`?
- [ ] **Governance** — Does `npm run ui:governance` pass with zero failures and no new admin table design warnings?

## Drawer usage checklist

For any admin list page that adds or modifies drawer behaviour, complete this checklist.
See `docs/admin-drawer-usage-standard.md` for the full decision matrix.

### Before implementing a drawer

- [ ] **Drawer type decision** — Document which type applies: Preview / Quick Create / Quick Edit / Help / Filter / Review / Dependency / Activity. See `docs/admin-drawer-usage-standard.md §2`.
- [ ] **Width token** — Which token is correct: `sm` / `md` / `lg` / `xl`? Justify choice against the width table in `docs/admin-drawer-usage-standard.md §5`.
- [ ] **Full-page check** — Is the operation genuinely contextual and reversible, or does it require a multi-section guided form? Multi-section forms must stay full-page.
- [ ] **Component selection** — Use `SmartDrawer`, `SmartPreviewDrawer`, `SmartFormDrawer`, or `SmartReviewDrawer` from `src/experience/components/`. Do not create one-off drawer wrappers.
- [ ] **Footer actions defined** — At minimum: one clear close/cancel action. Primary action uses `btnPrimary` style, secondary uses `btnOutline`.

### Post-implementation verification (drawers)

- [ ] Drawer has a close button with `aria-label="Close"`.
- [ ] Body region has `overflowY: auto` (or equivalent) to enable internal scrolling.
- [ ] Footer is `flexShrink: 0` — not `position: sticky`.
- [ ] Form drawer warns on unsaved changes before close (dirty-state guard).
- [ ] Backdrop click closes the drawer.
- [ ] Row click/view icon opens the drawer — does NOT navigate to a full page for view-only details.
- [ ] Edit action still navigates to the full form page (drawer is not a form replacement for complex pages).
- [ ] `npm run ui:governance` passes with 0 drawer-usage warnings.

