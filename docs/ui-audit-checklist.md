# UI Audit Checklist

Use this checklist for every page, especially AI-generated changes.

## Structure

- [ ] Page uses `PageHeader` or approved shell.
- [ ] Title is clear and business-friendly.
- [ ] Description explains the page purpose.
- [ ] Breadcrumb is available where useful.
- [ ] One primary action is visible.
- [ ] Secondary actions are grouped.

## Navigation

- [ ] Page is reachable from grouped navigation or command search.
- [ ] Breadcrumb uses human-readable labels.
- [ ] User can return to previous context.
- [ ] Recent/favorite behavior is preserved if applicable.

## Help and guidance

- [ ] Help entry exists for admin/configuration pages.
- [ ] Help text explains business meaning.
- [ ] Complex fields include short field help.
- [ ] Empty states guide the next action.
- [ ] No permanent walls of help text.

## Visual quality

- [ ] UI is light and not heavy.
- [ ] Spacing is consistent.
- [ ] Color usage is restrained.
- [ ] Icons are meaningful.
- [ ] Tables are not overdecorated.

## Interaction

- [ ] Long forms use sections.
- [ ] Drawers are used for contextual information.
- [ ] Dialogs are used only for focused decisions.
- [ ] Validation is visible and actionable.

## Drawer usage

Use this section for any admin page that adds or integrates a drawer.
See `docs/admin-drawer-usage-standard.md` for the full standard.

**Decision**
- [ ] Drawer type is one of: Preview / Quick Create / Quick Edit / Help / Filter / Review / Dependency / Activity.
- [ ] Width token is appropriate: `sm` / `md` / `lg` / `xl`.
- [ ] Operation is genuinely contextual and reversible (not a complex multi-step form).
- [ ] Component is `SmartDrawer`, `SmartPreviewDrawer`, `SmartFormDrawer`, or `SmartReviewDrawer` — not a one-off wrapper.

**Structure**
- [ ] Drawer has header with title, optional subtitle, and close button (×).
- [ ] Body region scrolls independently (`overflowY: auto`).
- [ ] Footer has at minimum a clear close/cancel action.
- [ ] Footer is `flexShrink: 0` — not `position: sticky` or absolute.
- [ ] Backdrop click closes the drawer.
- [ ] Close button has `aria-label="Close"`.

**Behaviour**
- [ ] Row click and Eye/View icon open the drawer — they do NOT navigate to a full page for read-only detail.
- [ ] Edit action navigates to the full form page (drawer is not a substitute for the edit page).
- [ ] Form drawer warns about unsaved changes before close (dirty-state guard).
- [ ] Complex multi-step configuration remains full-page (not in a drawer).

**Governance**
- [ ] `npm run ui:governance` passes with 0 new drawer-usage warnings.

## Guided workflow forms

Use this section for any multi-step admin setup/activation form (e.g. Code Generation Policy,
Numbering Policy, KYC Setup flows). See `docs/admin-page-structure-standard.md §10` for the
full Guided Admin Create/Edit Standard.

**Layout & structure**
- [ ] Compact form header does not exceed 88 px of vertical height.
- [ ] Workflow/stepper bar does not exceed 48 px of vertical height.
- [ ] Combined compact header + stepper is below 136 px total.
- [ ] Form body scrolls independently (`flex: 1; overflow-y: auto` on the scroll container).
- [ ] Footer is a flex child (`flexShrink: 0`) at the bottom of a flex-column workspace — NOT `position: sticky`.
- [ ] Footer does not overlap form fields at any scroll position.
- [ ] `height: 100%; display: flex; flex-direction: column; overflow: hidden` on the form workspace container.
- [ ] Section panel card padding is ≤ 20 px top/bottom (prefer `padding: 16px 20px`).

**Actions**
- [ ] Save Draft appears only in the footer — NOT duplicated in header `secondaryActions`.
- [ ] Activate / primary activation action only visible when readiness checklist passes (`!checklistAllPassed` disables the button).
- [ ] Activate opens a confirmation dialog with a policy summary grid and a consequence warning.
- [ ] Header contains only: Back to List + How this works (help). No form actions.

**Steps & states**
- [ ] Step states are logically gated — no downstream step shows "complete" before its prerequisites are done.
- [ ] Section panel completion badges match step nav state — use `completionOverride` when gating applies.
- [ ] Review step does not show "complete" while editing — only `inprogress` when active.
- [ ] Usage / History step hidden or disabled for unsaved new records.

**Code & preview**
- [ ] Auto-generated codes (e.g. Policy Code) shown as compact metadata row, not full-width disabled input.
- [ ] Sample output preview shown as compact chip (green when ready, muted when incomplete) — no weak italic text.
- [ ] Incomplete preview message is specific and actionable (e.g. "Complete prefix & format to preview").

## Governance scripts (guided forms)

`npm run ui:governance` runs `scripts/check-guided-form-layout.js` which warns on:

| Pattern | Severity |
|---|---|
| "Save Draft" in both `secondaryActions` and footer | WARN |
| `position: 'sticky'` footer without flex-column workspace | WARN |
| Full-width locked FInput for auto-generated code field | WARN |
| Multi-step form passing step nav as `toolbar` prop to AdminPageShell | WARN |
| Guided form with Activate button but no activation confirmation dialog | WARN |
| Guided `renderForm` with no footer action bar | WARN |



- [ ] No empty files.
- [ ] No TODO-only files.
- [ ] No lorem ipsum.
- [ ] No placeholder components.
- [ ] No unused generated components.

## New feature gate

Run this checklist before starting implementation of any new page or module.

### Required definitions (verify all 10 before writing code)

- [ ] **UX intent** written — one sentence describing the user goal.
- [ ] **Route placement** confirmed — path added to `routeConfig.ts`.
- [ ] **Page shell** chosen — `PageHeader` for list/overview, `AdminConfigShell` for multi-section config.
- [ ] **Reused components** listed — checked against `docs/component-contracts.md`.
- [ ] **Help topic** identified — entry exists or will be added to `helpTopics.ts`.
- [ ] **Empty state** copy written — title, description, primary action label for `EmptyStateGuide`.
- [ ] **Loading state** treatment defined — skeleton rows preferred over full-page spinner.
- [ ] **Error state** treatment defined — inline error strip with a retry action.
- [ ] **Storybook stories** scoped — new reusable components need `.stories.tsx` with Default + variants.
- [ ] **Governance scripts** confirmed passing — `npm run ui:governance` passes before merge.

### Post-implementation verification

- [ ] `npm run build` — zero TypeScript errors in changed files.
- [ ] `npm run ui:governance` — all 6 governance checks pass.
- [ ] Stories cover Default, Empty, and at least one variant (In Progress / Completed / Needs Attention).
- [ ] Dark mode verified using Storybook Appearance toolbar.
- [ ] No hardcoded hex colors — all colors use `var(--color-*)` or `color-mix()`.

