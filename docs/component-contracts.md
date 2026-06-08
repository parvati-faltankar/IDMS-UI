# Component Contracts

This document defines the reusable experience components. AI tools must follow these contracts instead of creating one-off alternatives.

## PageHeader

Purpose: Standard page title, description, breadcrumb, status, actions, and help entry.

Used by:

- Admin Dashboard
- Admin master pages
- Transaction list pages in later phases
- Settings/builder pages

Rules:

- Use one primary action.
- Show help only when `helpTopicId` is provided.
- Breadcrumbs must be human-readable.
- Do not add complex filtering/search inside PageHeader.

## HelpDrawer

Purpose: Contextual help surface for global, page-level, and admin guidance.

Rules:

- Drawer should open from header/help buttons.
- Help content comes from `helpTopics.ts`.
- Avoid long permanent help text on pages.
- Include steps and tips when useful.

## AdminSetupAssistant

Purpose: Show admin setup progress, recommended next action, and key configuration status.

Rules:

- Display a small number of important setup areas.
- Do not show all 72 masters.
- Include action to resume or open the recommended next page.

## AdminConfigShell

Purpose: Standard layout for specialized admin configuration pages.

Rules:

- Left or top section navigation.
- Main content area.
- Help entry.
- Status/lifecycle display.
- Optional validation checklist.
- Sticky action area if the form is long.

## CommandPalette

Purpose: Fast command/search interface for navigation and actions.

Rules:

- Should support keyboard access later.
- Commands should be registered in `commandRegistry.ts`.
- Do not hardcode page-specific commands inside the component.

## GlobalHeader

Purpose: Persistent 52px admin context bar showing app branding, command palette trigger, and help entry.

Rules:

- Render once inside AdminShell above the main content.
- Use `onOpenCommandPalette` to wire Ctrl+K shortcut.
- Do not add page-specific content — use `rightSlot` for additions.
- Keep height fixed at 52px.

## SmartSidebar

Purpose: Minimal grouped navigation with support for favorites and recent items.

Rules:

- Group admin masters.
- Keep first view light.
- Use recently visited and favorites.
- Do not expand every group by default.

## FieldHelpPopover

Purpose: Small contextual explanation for complex form fields, shown on demand via a "?" button.

Rules:

- Use only for fields that genuinely need explanation (regex, entity type, series type, attachment rules, proof category).
- Do not add to every field — only where a business user would reasonably be confused.
- Keep description to 1–3 sentences. Use the example field for format examples.
- Popover closes on Escape or outside click.

## AdminConfigShell

Purpose: Standard two-pane layout for admin configuration pages with section navigation.

Rules:

- Left section navigation with completion indicators and optional progress bar.
- Scrollable content area on the right.
- Sections array drives the nav; parent controls active section state.
- Do not include business logic — purely a layout shell.
- Use in form/config views, not list views.

## ValidationChecklist

Purpose: Displays activation requirements as a list of checkable items with ok/error/warn status indicators.

Rules:

- Show ok/error/warn status per item.
- Clicking an item navigates to the relevant section (via onNavigateToSection).
- Expand errors inline below the item.
- Include an activation summary bar showing how many requirements are met.
- Do not show this component in list views — form/config pages only.

## EmptyStateGuide

Purpose: Shown when a list, panel, or section tab has no data yet. Communicates what is empty, why it matters, and what the user should do next.

Rules:

- Use inside list views, section panels, and sub-tabs when content is absent.
- Always provide a meaningful `title` and `description` — do not leave either blank.
- Use `primaryActionLabel` for the main call-to-action (e.g. "Add proof rule").
- Use `secondaryActionLabel` only when a non-destructive alternative exists (e.g. "How this works").
- Use `compact` mode inside section tabs or panels where vertical space is limited.
- Do not use as a loading skeleton or error banner — use dedicated components for those cases.

## AdminPageShell

Purpose: Standard layout wrapper that enforces the approved admin page structure: PageHeader → setup health strip → summary strip → toolbar slot → children.

Rules:

- Use for every new admin list page and specialised admin page that is not a multi-section config form.
- Do not use inside `AdminConfigShell` — the two shells are mutually exclusive.
- `helpTopicId` must reference a real topic in `helpTopics.ts`. Do not pass a placeholder id.
- `summaryItems` should show 3–6 meaningful metrics. Omit the prop entirely for pure config pages.
- `setupHealth` is optional — use only when there is a blocking configuration gap to surface.
- `toolbar` slot is for search + filter chips. Do not put heavy navigation tabs in the toolbar.
- `maxContentWidth` is for narrow config forms. Leave undefined for full-width list pages.
- Does not render a global header, sidebar, HelpDrawer, or CommandPalette — those are owned by AdminShell.

## AdminListPageShell

Purpose: Compact, productivity-first layout shell for admin list and table pages. Replaces AdminPageShell for list views where minimising vertical space before the table is critical.

Rules:

- Use for admin list/table pages where a compact PageBar + SmartToolbar is preferred over the full PageHeader + SummaryStrip + Toolbar stack.
- Do not use for form, config, or multi-section pages — use AdminPageShell for those.
- `helpTopicId` must reference a real topic in `helpTopics.ts`.
- `summaryItems` renders inline in the SmartToolbar left segment, not as a separate strip. Show 2–5 items.
- `quickFilterItems` renders as chips in the SmartToolbar right segment.
- Does not render a global header, sidebar, HelpDrawer, or CommandPalette — those are owned by AdminShell.
- Use `density="compact"` only when maximum vertical real estate is required.

