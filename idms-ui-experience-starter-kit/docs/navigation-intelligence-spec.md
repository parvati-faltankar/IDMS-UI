# Navigation Intelligence Spec

## Goal

Navigation should be minimal on the surface and powerful when the user searches or needs context.

## Navigation Layers

1. Global header
2. Smart sidebar
3. Command palette
4. Breadcrumbs
5. Recently visited
6. Favorites
7. Contextual next actions

## Global Header

Should include:

- Logo or app name
- Command search entry
- Help icon
- Theme/language/user controls if already present

Do not overload the header with many icons.

## Sidebar

Top-level areas:

- Favorites
- Recently Visited
- Purchase
- Sales
- Admin
- Settings

Admin groups should be collapsed by default.

## Command Palette

Example commands:

- Open Admin Dashboard
- Open KYC Setup
- Open Picklist Master
- Open Numbering & Code Setup
- Open Code Generation Policy
- Create Purchase Order
- Open Sale Orders

Command palette should use `commandRegistry.ts`.

## Breadcrumbs

Example:

Admin / Finance & Pricing / KYC Setup

Breadcrumbs must use readable labels, not route keys.

## Recent Items

Recent items should help users resume work. They should not replace the main navigation.

## Favorites

Favorites should support frequently used modules or admin pages. Start with static/localStorage behavior if needed.
