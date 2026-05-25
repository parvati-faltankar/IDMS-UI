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

## SmartSidebar

Purpose: Minimal grouped navigation with support for favorites and recent items.

Rules:

- Group admin masters.
- Keep first view light.
- Use recently visited and favorites.
- Do not expand every group by default.

## FieldHelpPopover

Purpose: Small contextual explanation for complex fields.

Rules:

- Use only for fields that need explanation.
- Keep text short.
- Link to HelpDrawer for longer guidance.

## ValidationChecklist

Purpose: Explain completion requirements before activation/submission.

Rules:

- Use clear pass/fail/in-progress states.
- Checklist item text should be business-friendly.
- Clicking an item may navigate to a section.

## EmptyStateGuide

Purpose: Consistent empty-state guidance.

Rules:

- Explain why the screen is empty.
- Provide one primary next action.
- Add optional help link.
