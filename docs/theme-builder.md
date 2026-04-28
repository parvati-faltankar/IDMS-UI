# Theme Builder

Theme Builder lives at `/profile/theme-builder` and stores user-created themes in local storage using `theme-builder-themes:v1`.

The list view includes built-in brand themes from the static registry, such as Tata Motors, Ola, Eka, Hero, Bajaj, Royal Enfield, and Excellon, plus user-created themes from storage. Built-in themes are shown as system themes and can be previewed or used as a starting point for a custom editable theme.

Saved custom themes can be `draft`, `published`, or `deactivated`. Only `published` themes are merged into the runtime theme provider and exposed through the header theme dropdown. Draft and deactivated custom themes remain visible in Theme Builder for editing and workflow control, but they are not selectable from the header.

The runtime provider listens for the `theme-builder-themes-updated` event and refreshes the available theme list immediately after save, publish, deactivate, or reactivate. If the currently selected custom theme is deactivated or otherwise unavailable, the provider safely falls back to the default theme.

Theme Builder uses the same CSS token system as the existing static brand themes. Custom theme colors, typography, radius, spacing, shadows, and logo values are converted to a `BrandThemeDefinition` before being applied.
