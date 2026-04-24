# Common Components Source Of Truth

This file is the shared-component reference for the project. When behavior, styling, spacing, accessibility, or interaction rules need to change for a shared pattern, update the component itself and then update this file.

## Maintenance rule

- Do not create a new one-off component if an existing shared component already covers the pattern with small prop-level changes.
- When a shared component changes, update the shared component first, then update all consuming screens, then update this document.
- Screen files should contain domain-specific composition, not repeated implementations of base controls.

## Shared components

### `AppShell`

Location:
- `src/components/AppShell.tsx`

Purpose:
- Provides the application frame, navigation sidebar, top header, overlay behavior, and shared content region.

Use when:
- A new full-page business screen needs the standard Excellon shell.

Props summary:
- `children`
- `activeLeaf`
- `onPurchaseRequisitionClick`
- `contentRef`
- `contentClassName`
- `onContentScroll`

Do:
- Use it for top-level pages and major workspace screens.
- Pass `contentRef` and `onContentScroll` only when the screen really needs scroll-driven behavior.

Don't:
- Recreate the sidebar or top header inside individual screens.
- Add screen-specific styling rules into `AppShell` unless they belong to the shell itself.

### `FormControls`

Location:
- `src/components/common/FormControls.tsx`

Exports:
- `FormField`
- `Input`
- `Select`
- `Textarea`

Purpose:
- Standardizes labels, error states, helper text, and field classes.

Use when:
- Building forms, filter drawers, notes sections, compact line-entry fields, and design-system previews.

Props/API summary:
- `FormField`: `label`, `required`, `help`, `children`
- `Input`: native input props plus `error`
- `Select`: native select props plus `options` and `error`
- `Textarea`: native textarea props plus `error`

Visual/behavior rules:
- Labels sit above the control.
- Error styling uses the shared field error classes.
- Inputs, selects, and textarea inherit design tokens from `excellon-brand-guidelines.css`.

Do:
- Reuse these for any brand-aligned form control before creating local field wrappers.
- Pass `options` to `Select` when the choices are static or easily derived.

Don't:
- Rebuild field wrappers in page files unless the pattern is domain-specific and truly unique.
- Hardcode error borders or helper-text styling inline.

Example:

```tsx
<FormField label="Supplier" required help="Choose the preferred supplier.">
  <Select
    value={supplier}
    onChange={(event) => setSupplier(event.target.value)}
    options={[
      { value: '', label: 'Select supplier' },
      { value: 'techsupply', label: 'Techsupply Corp' },
    ]}
  />
</FormField>
```

### `SideDrawer`

Location:
- `src/components/common/SideDrawer.tsx`

Purpose:
- Shared right-side drawer container with backdrop, header, close button, content area, optional footer, and built-in keyboard focus handling.

Use when:
- Building preview drawers, filter drawers, or any right-panel workflow that needs consistent behavior.

Props/API summary:
- `isOpen`
- `title`
- `subtitle`
- `headerMeta`
- `children`
- `footer`
- `onClose`
- `initialFocusRef`
- `panelClassName`
- `contentClassName`

Behavior rules:
- Opens from the right.
- Supports Escape to close.
- Traps keyboard navigation inside the drawer while open.
- Uses the shared close button, header, and footer pattern.

Do:
- Use `panelClassName="side-drawer__panel--narrow"` for filter-style drawers.
- Pass a focused field via `initialFocusRef` when the first control should receive focus on open.

Don't:
- Re-implement backdrop, focus trapping, or close handling in page files.
- Use screen-local drawer markup unless the base component cannot support the requirement safely.

Example:

```tsx
<SideDrawer
  isOpen={isOpen}
  title="Filters"
  onClose={handleClose}
  panelClassName="side-drawer__panel--narrow"
  footer={<button className="btn btn--primary">Apply</button>}
>
  <div className="drawer-form">...</div>
</SideDrawer>
```

### `CatalogueFilterDrawer`

Location:
- `src/components/common/CatalogueFilterDrawer.tsx`

Purpose:
- Provides a reusable narrow filter drawer for catalogue pages that need customer/supplier-style filtering, priority, branch/warehouse, and date range controls.

Use when:
- A catalogue page needs the same right-side filter UX as Purchase Requisition without rebuilding drawer markup.

Props/API summary:
- `isOpen`
- `subtitle`
- `draftFilters`
- `primaryLabel`
- `primaryOptions`
- `branchLabel`
- `branchOptions`
- `dateFromLabel`
- `dateToLabel`
- `dateRangeError`
- `onClose`
- `onApply`
- `onReset`
- `onFilterChange`

Behavior rules:
- Uses `SideDrawer` with `side-drawer__panel--narrow` so filter drawers stay consistent across modules.
- Uses shared `Input` and `Select` controls.
- Keeps header and footer behavior consistent with other drawer workflows.

Do:
- Use this for new catalogue filter drawers before creating page-local filter UI.
- Derive option lists from the visible catalogue dataset when the filter should only show available values.

Don't:
- Hardcode a different drawer width for module-specific filters.
- Duplicate the same supplier/customer, priority, branch/warehouse, and date-range form in page files.

### `SortableTableHeader`

Location:
- `src/components/common/SortableTableHeader.tsx`

Exports:
- `SortableTableHeader`

Purpose:
- Standardizes sortable table header rendering, icon state, active state, and tri-state sort toggling.

Use when:
- A catalogue table needs sortable columns.

Props/API summary:
- `label`
- `sortKey`
- `sortState`
- `onSort`
- `className`

Behavior rules:
- First click sorts ascending, second click sorts descending, third click clears sorting.
- Uses shared `catalogue-table__sort-button` styles.
- Sets `aria-sort` for accessibility.

Do:
- Use this instead of copying local sortable header implementations into catalogue pages.
- Keep the actual row comparison logic in the page when it is domain-specific.
- Import sort state helpers from `src/utils/sortState.ts`.

Don't:
- Recreate sort icons and `aria-sort` behavior in each screen.
- Put business-specific sorting rules into the shared header component.

### `ConfirmationDialog`

Location:
- `src/components/common/ConfirmationDialog.tsx`

Purpose:
- Shared confirmation popup for discard, destructive, or leave-flow prompts that need consistent messaging, focus handling, and button layout.

Use when:
- A screen needs a lightweight Yes/No confirmation before clearing entered data or continuing a destructive action.

Props/API summary:
- `isOpen`
- `title`
- `description`
- `confirmLabel`
- `cancelLabel`
- `onConfirm`
- `onClose`

Behavior rules:
- Opens centered over a dimmed backdrop.
- Supports Escape to close.
- Traps keyboard navigation inside the dialog while open.
- Defaults to `Yes` / `No` labels unless the consuming screen needs different wording.

Do:
- Use this for discard confirmations on create or edit screens.
- Keep the message clear and action-oriented.

Don't:
- Recreate browser `window.confirm` flows for standard app confirmations.
- Build page-local confirmation markup unless the shared component truly cannot support the need.

Example:

```tsx
<ConfirmationDialog
  isOpen={isDiscardDialogOpen}
  title="Discard changes?"
  description="Are you sure you want to discard? All your entered information will be cleared."
  onConfirm={handleDiscardConfirm}
  onClose={() => setIsDiscardDialogOpen(false)}
/>
```

### `StatusBadge`

Location:
- `src/components/common/StatusBadge.tsx`

Purpose:
- Standardizes badge rendering for requisition statuses, priorities, and line statuses using shared brand badge classes.

Use when:
- Displaying status or priority chips in catalogue rows, preview drawers, or line details.

Props/API summary:
- `kind`: `'requisition-status' | 'priority' | 'line-status'`
- `value`
- `className`

Behavior rules:
- Maps supported domain values to the shared badge tokens.
- Keeps badge appearance consistent across screens.

Do:
- Use this instead of page-local switch statements for badge class names.

Don't:
- Hardcode badge colors inline.
- Duplicate badge-class switch logic in screens.

Example:

```tsx
<StatusBadge kind="priority" value="High" />
<StatusBadge kind="requisition-status" value="Pending Approval" />
```

## Shared hooks

### `useDialogFocusTrap`

Location:
- `src/hooks/useDialogFocusTrap.ts`

Purpose:
- Centralizes Escape handling, initial focus placement, and tab-loop focus trapping for dialog-like surfaces.

Use when:
- A shared or local dialog or drawer needs keyboard-safe focus behavior.

Do:
- Reuse this hook instead of re-implementing keydown and focus-loop logic.

## Shared utilities

### `cn`

Location:
- `src/utils/classNames.ts`

Purpose:
- Small utility for conditional class-string composition.

### `formatDate` / `formatDateTime`

Location:
- `src/utils/dateFormat.ts`

Purpose:
- Shared date formatting helpers used by catalogue and create experiences.

### Catalogue filter helpers

Location:
- `src/catalogueFilters.ts`

Exports:
- `emptyCatalogueFilters`
- `getActiveFilterCount`
- `validateDateRange`

Purpose:
- Keeps filter defaults and validation logic in one place.

### Sort state helpers

Location:
- `src/utils/sortState.ts`

Exports:
- `getNextSortState`
- `SortState`
- `SortDirection`

Purpose:
- Keeps catalogue sort state transitions reusable while keeping component files Fast Refresh friendly.

## Old pattern to shared pattern mapping

- Page-local `cn` helper in `prShellUtils.ts` -> `src/utils/classNames.ts`
- Page-local date formatting inside catalogue and create screens -> `src/utils/dateFormat.ts`
- Page-local drawer implementation inside catalogue view -> `src/components/common/SideDrawer.tsx`
- Page-local catalogue filter drawers -> `src/components/common/CatalogueFilterDrawer.tsx`
- Page-local sortable table header components -> `src/components/common/SortableTableHeader.tsx`
- Page-local discard confirmation popup -> `src/components/common/ConfirmationDialog.tsx`
- Page-local badge class switch logic -> `src/components/common/StatusBadge.tsx`
- Repeated field wrappers in preview and filter flows -> `src/components/common/FormControls.tsx`

## When not to create a new shared component

- When the UI is truly domain-specific and used in only one place with complex business behavior
- When extracting would create a more confusing abstraction than the local markup it replaces
- When the pattern is still unstable and likely to change heavily during exploration

In those cases:
- Keep the implementation local
- Name it clearly
- Document why it stayed local if the pattern looks reusable at first glance

## Current screen usage summary

- `AppShell` is used by the catalogue view, create view, and brand-guidelines preview
- `FormControls` are used by the create screen, filter drawer, and brand-guidelines preview
- `SideDrawer` is used by the Purchase Requisition filter drawer and document preview drawer
- `CatalogueFilterDrawer` is used by the Sale Allocation Requisition and Sale Allocation catalogue views
- `SortableTableHeader` is used by the Sale Allocation Requisition and Sale Allocation catalogue tables
- `ConfirmationDialog` is used by the Purchase Requisition and Purchase Order discard flows
- `StatusBadge` is used in the catalogue table, preview drawer, and create line-item grid
