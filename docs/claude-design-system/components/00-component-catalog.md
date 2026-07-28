---
title: Component Catalog
status: approved-baseline
version: 1.2
last_verified: 2026-07-24
---

# Component Catalog

## Requirement Table

| Requirement ID | Status | Evidence | Behavior | Responsive Rule | Accessibility Rule | Acceptance Criteria | Gap Note |
|---|---|---|---|---|---|---|---|
| `DS-COMP-CATALOG-001` | `ADOPTED` | `SRC-REPO-DOC-UIUX`, `SRC-REPO-CODE-COMPONENTS` | Claude uses the current component catalog before inventing target-only components. | Components inherit responsive behavior from their shell or explicit component row. | Each component row carries an accessibility rule. | All mandatory components appear in the inventory below. | None |
| `DS-COMP-CATALOG-002` | `TARGET` | `SRC-REPO-CODE-UI-STUDIO`, `SRC-TARGET-COMPONENT-REGISTRY` | UI Studio target catalog expands beyond the current small registry while marking missing runtime support as target. | Surface availability may vary by viewport and builder surface. | Registry components need labels, focus behavior, and validation states. | UI Studio registry breadth is tracked in the gap register. | Current registry is limited. |
| `DS-COMP-CATALOG-003` | `ADOPTED` | `SRC-REPO-DOC-COMPONENT-CONTRACTS`, `SRC-REPO-CODE-COMPONENTS` | Component families include anatomy and variant guidance before Claude composes screens. | Family variants inherit responsive behavior from their shell, drawer, grid, or builder surface. | Anatomy definitions identify labeled regions and focusable controls. | The anatomy and variants matrix below covers the major component families. | None |

## Component Inventory

| Component | Status | Evidence | Purpose | States | Responsive | Accessibility | Acceptance |
|---|---|---|---|---|---|---|---|
| `AppShell` | `CURRENT` | `SRC-REPO-CODE-APP-CHROME`, `SRC-REPO-DOC-UIUX` | Global application frame | default, collapsed nav, mobile nav | Sidebar adapts on smaller viewports | Header and nav controls labeled | Shell is used as outer app frame |
| `AppSidebar` | `CURRENT` | `SRC-REPO-CODE-APP-CHROME` | Main navigation | expanded, collapsed, active item | Collapses or overlays on small screens | Items expose readable labels | Active route is visible |
| `AppTopHeader` | `CURRENT` | `SRC-REPO-CODE-APP-CHROME` | Global top bar | search open, help open, theme menu, user menu | Mobile search trigger adapts | Buttons expose names and expanded state | Global actions remain reachable |
| `AdminShell` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-ADMIN-SPEC` | Admin wrapper | nav open, command open, help open | Mobile nav closes on larger viewport | Ctrl/Cmd+K and Escape behavior documented | Admin pages do not duplicate shell controls |
| `PageHeader` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Page identity and actions | status, badges, primary/secondary actions | Compact variants allowed | Help action labeled | Exactly one page identity region |
| `AdminPageShell` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Form/config page shell | summary, setup health, toolbar, footer | Navigation slot may collapse | Header and help topic are accessible | Used for form/config pages |
| `AdminListPageShell` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-PAGE-STRUCTURE` | Compact list shell | search, filters, summary, density | Keeps list work visible | Toolbar controls labeled | Used for list/table pages |
| `AdminConfigShell` | `CURRENT` | `SRC-REPO-CODE-ADMIN-SHELLS`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Multi-section config shell | active section, validation, sticky actions | Section nav adapts | Section nav is keyboard reachable | Used for long config flows |
| `CommonDataGrid` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Feature-rich table | sort, select, density, export, pinning | Horizontal overflow handled by grid | Headers and row actions labeled | Used for catalogue data display |
| `MasterDataTable` | `CURRENT` | `SRC-REPO-CODE-DATA` | Admin master table wrapper | sort, actions, empty | Follows grid constraints | Table semantics preserved | Admin masters can use shared table |
| `FormControls` | `CURRENT` | `SRC-REPO-CODE-FORMS`, `SRC-REPO-DOC-UIUX` | Input, select, textarea, form field | default, focus, error, disabled | Inputs fill available width | Labels and errors associated | Forms use shared primitives |
| `DatePicker` | `CURRENT` | `SRC-REPO-CODE-FORMS` | Date input with popup | open, selected, invalid, disabled | Popup fits viewport | Keyboard and labels required | Date input has readable value |
| `StatusBadge` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Lifecycle status display | neutral, warning, success, danger | Wraps or truncates safely | Text accompanies color | Status is not color-only |
| `GlobalSearchPanel` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Cross-module search overlay | empty, loading, results, recent | Adapts to mobile overlay | Results are keyboard selectable | Search closes and restores context |
| `ThemeSwitcher` | `CURRENT` | `SRC-REPO-CODE-APP-CHROME`, `SRC-REPO-CODE-THEME` | Theme selection | active, menu open, disabled | Header placement adapts | Active theme text available | Published themes selectable |
| `CatalogueViewSelector` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Saved view selection | default, custom, pinned | Toolbar placement adapts | Menu items labeled | Active view is clear |
| `CatalogueViewConfigurator` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Saved view editor | create, edit, delete, error | Drawer/dialog adapts | Form fields labeled | View can be saved or cancelled |
| `CatalogueFilterDrawer` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Advanced filters | open, applied, cleared | Drawer fits viewport | Focus returns to trigger | Applied filters visible |
| `DataGridConfigurator` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Column and grid setup | reorder, show/hide, save | Drawer/panel adapts | Reorder controls need labels | Grid preferences can be changed |
| `DataGridChartDrawer` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Chart from grid data | chart type, dimension, metric | Drawer responsive | Controls labeled | Chart config is understandable |
| `ConfirmationDialog` | `CURRENT` | `SRC-REPO-CODE-APP-PRIMITIVES`, `SRC-REPO-CODE-DATA` | Confirm high-impact action | open, confirm, cancel, danger | Dialog stays in viewport | Focus trap and Escape behavior | Destructive action has confirmation |
| `DocumentPreviewDrawer` | `CURRENT` | `SRC-REPO-CODE-DATA`, `SRC-REPO-DOC-UIUX` | Record preview | open, loading, populated | Drawer width adapts | Close returns focus | Preview does not replace edit flow |
| `AppButton` | `CURRENT` | `SRC-REPO-CODE-APP-PRIMITIVES` | App action button | primary, secondary, ghost, danger | Text wraps safely | Name and state exposed | Button tone matches action |
| `AppDialog` | `CURRENT` | `SRC-REPO-CODE-APP-PRIMITIVES` | App dialog shell | open, close, destructive | Constrained viewport | Focus trap required | Dialog has title and close path |
| `AppDrawer` | `CURRENT` | `SRC-REPO-CODE-APP-PRIMITIVES` | App drawer shell | open, close, actions | Side panel adapts | Escape and focus return | Drawer has labeled title |
| `SmartDrawer` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Experience drawer shell | sizes, actions, help | Width adapts by size token | Focus and close controls | Drawer behavior is consistent |
| `HelpDrawer` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Contextual help | open, related topics, close | Right drawer on available space | Related topics keyboard reachable | Help topic is sourced by ID |
| `CommandPalette` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Ctrl/Cmd+K launcher | open, search, selected, empty | Modal layout adapts | Arrow, Enter, Escape behavior | Commands are searchable |
| `EmptyStateGuide` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Empty state guidance | default, compact, action | Fits panel or page | Action labels are descriptive | Empty state explains next step |
| `ValidationChecklist` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Activation checklist | ok, warn, error, read-only | Fits config pages | Item navigation accessible | Validation state is understandable |
| `FieldHelpPopover` | `CURRENT` | `SRC-REPO-CODE-EXPERIENCE`, `SRC-REPO-DOC-COMPONENT-CONTRACTS` | Field help | open, close, related field | Popover stays in viewport | Escape and outside click close | Help is concise and scoped |
| `ThemeBuilder` | `CURRENT` | `SRC-REPO-CODE-BUILDERS`, `SRC-REPO-DOC-THEME-BUILDER` | Brand/theme management | draft, published, deactivated | Preview overlay adapts | Publish actions labeled | Current limits are documented |
| `MenuBuilder` | `CURRENT` | `SRC-REPO-CODE-BUILDERS`, `SRC-REPO-DOC-MENU-BUILDER` | Navigation builder | draft, valid, invalid, published | Structure editor and preview adapt | Tree actions labeled | Validation blocks bad publish |
| `PrintBuilder` | `CURRENT` | `SRC-REPO-CODE-BUILDERS`, `SRC-REPO-DOC-UIUX` | Print template surface | edit, preview, publish target | Preview adapts | Controls labeled | Print surface is cataloged |
| `LanguageBuilder` | `CURRENT` | `SRC-REPO-CODE-BUILDERS`, `SRC-REPO-DOC-UIUX` | Localization builder surface | edit, validate, preview target | Text expansion considered | Locale controls labeled | Locale surface is cataloged |
| `UI Studio` | `TARGET` | `SRC-REPO-CODE-UI-STUDIO`, `SRC-REPO-DOC-UI-STUDIO` | Metadata-driven design/control plane | draft, preview, validate, publish target | Device preview target behavior | Registry components need a11y contracts | Current registry gap is explicit |

## Component Family Anatomy and Variants

| Family | Anatomy | Variants | Required Evidence | Claude Acceptance |
|---|---|---|---|---|
| App chrome | Top header, sidebar, route content, global search/help/theme controls | Expanded nav, collapsed nav, mobile overlay nav | `SRC-REPO-CODE-APP-CHROME` | Use one global app frame and do not duplicate chrome inside pages. |
| Admin page shells | Page identity, summary/setup strip, toolbar, work area, help path, actions | List shell, form shell, config shell | `SRC-REPO-CODE-ADMIN-SHELLS` | Select exactly one admin shell based on workflow intent. |
| Data and catalogue | Toolbar, saved views, filters, grid/table/list, preview, chart/config drawers | Table, card/list, split preview, chart drawer | `SRC-REPO-CODE-DATA` | Preserve sorting, filtering, selection, preview, empty, and export/config affordances where relevant. |
| Forms and actions | Label, input/control, helper text, error, field help, primary/secondary actions | Text, select, textarea, date, button, read-only, error | `SRC-REPO-CODE-FORMS`, `SRC-REPO-CODE-APP-PRIMITIVES` | Labels, validation, and action hierarchy are explicit. |
| Overlays and feedback | Trigger, title, body, action footer, close path, focus return | Dialog, drawer, popover, confirmation, help drawer, command palette | `SRC-REPO-CODE-APP-PRIMITIVES`, `SRC-REPO-CODE-EXPERIENCE` | Every overlay defines trigger, title, focus behavior, close path, and return target. |
| Profile builders | List/preview, edit form, validation, draft/publish/deactivate actions | Theme, menu, print, language | `SRC-REPO-CODE-BUILDERS` | Current builder behavior stays separate from target governance behavior. |
| Builder inspector | Tabs, property groups, controls, responsive marker, reset state, canvas context | Content, Style, Advanced, layout, typography, responsive | `SRC-SHOT-001`, `SRC-SHOT-002`, `SRC-SHOT-003`, `SRC-SHOT-004` | Screenshot-derived inspector behavior is `ADOPTED` or `TARGET`, never `CURRENT` without matching runtime code. |