# Future Feature Implementation Standard

Every future UI feature must follow this process. AI tools must read this document before
implementing any new page, module, or component.

## Feature gate checklist

Every new feature must satisfy all items below before implementation begins. This list is
machine-verified by `scripts/check-future-feature-standard.js`.

### Required definitions

- [ ] **UX intent** — One sentence describing the user goal this feature serves.
- [ ] **Route placement** — The exact route path (e.g. `/admin/master/tax-master`).
- [ ] **Page shell** — Which shell component wraps the page: `AdminShell` + `AdminListPageShell` (list/table pages), `AdminShell` + `AdminPageShell` (config pages), or `AdminConfigShell` (multi-section form flows).
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
   - See `docs/admin-page-structure-standard.md §1a` and `§1b` for the full decision guide.
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

