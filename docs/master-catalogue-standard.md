# Master Catalogue Standard

## Purpose
Use the Code Generation Policy catalogue experience as the default pattern for admin/master list screens.

The standard stack is:

- `AdminListPageShell` for breadcrumb, title, search, filters, and command rail
- `MasterDataTable` for the shared catalogue grid
- `SmartPreviewDrawer` for read interaction
- shared master-table helpers for identifier, text, status, metrics, booleans, and row actions

## Required Rules

### Page shell
- Keep breadcrumb and title in `AdminListPageShell`
- Keep search in the shell command row
- Keep help, filter, and primary CTA in the shared action rail
- Use `toolbarActionsPlacement="command"` only when an anchored filter popover needs to sit beside the action rail

### Table behavior
- Use `MasterDataTable` for ordinary master catalogue screens
- Make the identifier column clickable
- Do not make row click the primary interaction when there are embedded actions
- Use shared helper cells before creating page-local table markup
- Keep empty state, record count, and row actions consistent with the shared pattern

### Preview and actions
- Preview should open from the identifier link or explicit preview action
- Edit, activate, deactivate, and delete should live in the shared row-actions pattern
- Keep destructive actions visually restrained and menu-based unless there is a strong reason not to

## Recommended Build Pattern

1. Define the row type for the master screen.
2. Define filters and quick-filter items in page state.
3. Build `DataGridColumn[]` using shared helpers from `MasterDataTable`.
4. Render `AdminListPageShell`.
5. Render `MasterDataTable` inside the shell.
6. Wire `SmartPreviewDrawer` and page actions.

## Starter Example

```tsx
const columns: DataGridColumn<MyRow>[] = [
  createMasterIdentifierColumn({
    id: 'code',
    label: 'Code',
    getValue: (row) => row.code,
    onClick: (row) => setPreviewRow(row),
  }),
  createMasterTextColumn({
    id: 'name',
    label: 'Name',
    primary: (row) => row.name,
    secondary: (row) => row.description,
  }),
  createMasterStatusColumn({
    getStatus: (row) => row.status,
  }),
  createMasterActionsColumn({
    rowLabel: (row) => row.code,
    menuActions: (row) => [
      { label: 'Preview details', onSelect: () => setPreviewRow(row) },
      { label: 'Edit record', onSelect: () => navigate(`/admin/master/example/${row.id}`) },
    ],
  }),
];
```

## Migration Checklist
- Replace bespoke inline grid/table markup with `MasterDataTable`
- Keep search and filters functionally equivalent
- Move identifier interaction to shared identifier-link treatment
- Replace local badges/pills with shared master-table helpers where possible
- Preserve preview drawer behavior
- Preserve activation/deactivation/delete flows
- Remove obsolete page-local grid constants and styling after migration

## PR Review Checklist
- Does the master list use `MasterDataTable`?
- Is the identifier column clickable?
- Are row actions using the shared actions menu?
- Is the page shell using `AdminListPageShell` consistently?
- Does the page avoid bespoke inline table layout unless there is a justified exception?
