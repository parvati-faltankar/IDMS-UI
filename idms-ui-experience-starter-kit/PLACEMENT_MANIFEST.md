# Placement Manifest

Use this file to tell your AI coding tool exactly how to place and integrate this starter kit.

## Copy these folders to project root

| Starter Kit Folder | Destination | Purpose |
|---|---|---|
| `docs/` | `<repo>/docs/` | UI standards, implementation rules, future feature governance |
| `src/experience/` | `<repo>/src/experience/` | Reusable experience components, help content, navigation intelligence |
| `scripts/` | `<repo>/scripts/` | Governance and quality checks |
| `.storybook/` | `<repo>/.storybook/` | Storybook configuration; merge carefully if already exists |
| `tests/visual/` | `<repo>/tests/visual/` | Optional Playwright visual test templates |

## Merge rules

1. Do not overwrite existing `.storybook` files blindly. Merge configuration manually or ask AI to merge.
2. Do not replace existing `AdminShell`, `AdminSidebar`, or `AdminDashboard` directly. Integrate components gradually.
3. Do not touch transaction screens during Phase 1.
4. Preserve existing routes and localStorage keys.
5. Use existing theme CSS variables where possible.
6. If the project already has a component with the same name, keep this kit under `src/experience/components` until the app is migrated.

## First integration target

Start with only:

- `src/experience/components/PageHeader`
- `src/experience/components/HelpDrawer`
- `src/experience/components/AdminSetupAssistant`
- `src/experience/help/helpTopics.ts`
- `src/admin/AdminDashboard.tsx`

Success criteria:

- Admin Dashboard renders with `PageHeader`.
- Admin Dashboard includes `AdminSetupAssistant`.
- Help drawer opens from the dashboard.
- Existing admin route remains unchanged.
- Build passes.
- Empty/placeholder checks pass.

## Do not integrate first

Avoid integrating these in the first run:

- `CommandPalette`
- `SmartSidebar`
- `AdminConfigShell`
- `FieldHelpPopover`
- `ValidationChecklist`

They are included for the next phases.
