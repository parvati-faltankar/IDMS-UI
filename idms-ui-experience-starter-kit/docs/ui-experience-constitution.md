# UI Experience Constitution

## Product Direction

IDMS-UI must feel like a **light, modern, guided enterprise SaaS product**. The UI should not be heavy, crowded, or over-decorated. Complexity should exist in the product, but it should be revealed progressively.

The experience should feel:

- Clean
- Calm
- Fast
- Guided
- Low-click
- Consistent
- Premium
- Enterprise-safe
- Not heavy
- Not cluttered

## Core Principles

### 1. Minimal surface, maximum intelligence

Show only the actions and information the user needs now. Hide advanced configuration in drawers, menus, or guided sections.

### 2. One clear primary action

Every page area should have one obvious primary action. Secondary actions should be grouped or moved to a menu.

### 3. Progressive disclosure

Large forms, complex admin pages, and advanced filters must use section navigation, drawers, or expandable areas.

### 4. Consistent page structure

Every major page should use a consistent header pattern with title, description, breadcrumb, actions, and help entry.

### 5. Admin must be guided

Admin pages should explain what they do, why they matter, and how to complete them. Admin should feel like setup assistance, not raw master data entry.

### 6. No one-off layouts

A page should not create a custom header, sidebar, drawer, form action area, or help mechanism if a shared experience component exists.

## Page Rules

- Every page must have a `PageHeader` or equivalent shell header.
- Every admin/configuration page must include a help entry.
- Every complex form must be divided into sections.
- Every long configuration page must have progress or completion guidance.
- Every list page must use consistent search, filter, view, and table behavior.
- Every empty page must guide the next action.

## Navigation Rules

- Navigation should be grouped, minimal, and searchable.
- Do not expose all 72 admin masters at once in the first view.
- Use Favorites and Recently Visited for speed.
- Use command search for direct actions and deep navigation.
- Breadcrumbs should explain where the user is.

## Admin Rules

- Admin dashboard should act as a setup workspace.
- Specialized admin pages should use section navigation.
- Draft / Active / Inactive lifecycle must be clearly explained.
- Complex fields must include field-level help.
- Activation should use a validation checklist.

## Visual Rules

- Use generous whitespace.
- Use subtle borders and soft surfaces.
- Use colors sparingly.
- Avoid decorative charts or noisy cards.
- Status colors should have consistent meaning.
- Icons should clarify, not decorate.

## Interaction Rules

- Use drawers for preview, help, filters, and compact contextual actions.
- Use dialogs only for confirmation or short focused tasks.
- Use sticky footer actions for long forms.
- Avoid forcing navigation when preview or drawer interaction is enough.

## Content Rules

- Help text should explain business meaning, not obvious UI behavior.
- Avoid generic text like “click save to save.”
- Use clear labels that users understand.
- Do not expose technical names like component names, route keys, or internal IDs.

## Anti-patterns

Avoid:

- Heavy dashboards with too many cards
- Ten buttons in one toolbar
- Tables with too many visible row actions
- All admin masters expanded at once
- Forms with no sectioning
- Help text permanently displayed everywhere
- Placeholder labels, lorem ipsum, or TODO content
- Feature-specific custom layouts that duplicate shared components
