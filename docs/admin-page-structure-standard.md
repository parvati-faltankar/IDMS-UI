# Admin Page Structure Standard

This document is the authoritative reference for how every admin page in IDMS-UI must be structured.
All new admin pages and all backlog fixes to existing pages must conform to this standard.

---

## 1. Two approved admin page shell types

IDMS-UI uses **two distinct inner shell types** depending on whether the page is primarily a
list/table view or a configuration form. Choosing the correct shell is mandatory.

### 1a. AdminListPageShell — for list and table pages

Use `AdminListPageShell` when the primary purpose of the page is browsing, filtering, and
taking action on a collection of records.

```
┌────────────────────────────────────────────────────────────────┐
│  AppTopHeader (global dark header — rendered by AdminShell)    │
├────────────────────────────────────────────────────────────────┤
│  AdminSidebar (rendered by AdminShell)                         │
├────────────────────────────────────────────────────────────────┤
│  PageBar (compact)                                             │  ← ~80–95px total
│  breadcrumbs (11px muted) / title (16px bold) + actions / desc │
├────────────────────────────────────────────────────────────────┤
│  SmartToolbar (single compact row)                             │  ← ~44px
│  5 Total · 3 Active · 1 Draft  |  [Search] [All][Active] [▿] │
├────────────────────────────────────────────────────────────────┤
│  Table — visible above the fold on standard laptop screens     │  ← starts ~136px from top of content
└────────────────────────────────────────────────────────────────┘
```

**Use AdminListPageShell for:**
- All specialised admin list/table pages (e.g. `CodeGenerationPolicyPage` list view)
- Any page where the primary interaction is browsing and filtering a record set
- Pages where the table must be visible above the fold without scrolling

**Do not use AdminListPageShell for:**
- Multi-section configuration forms
- Pages where a single large form is the primary content
- Detail/edit forms — those belong in AdminPageShell or AdminConfigShell

### 1b. AdminPageShell + AdminConfigShell — for configuration and form pages

Use `AdminPageShell` (or `AdminConfigShell` for multi-section flows) when the primary purpose
of the page is completing a guided form, configuration workflow, or activation checklist.

```
┌────────────────────────────────────────────────────────────────┐
│  AppTopHeader + AdminSidebar (rendered by AdminShell)          │
├────────────────────────────────────────────────────────────────┤
│  PageHeader (full)                                             │
│  Breadcrumb / Title (24px h1) / Description / Actions          │
├────────────────────────────────────────────────────────────────┤
│  Summary strip (if applicable)                                 │
├────────────────────────────────────────────────────────────────┤
│  Form / Configuration content                                  │
└────────────────────────────────────────────────────────────────┘
```

**Use AdminPageShell / AdminConfigShell for:**
- Organisation Master form (`OrgMasterFormPage`)
- KYC Setup form view
- Picklist configuration
- Code Generation Policy form view
- Any multi-section setup or activation workflow
- Long configuration pages where section navigation adds value

---

## 2. Why this structure is the standard (legacy overview)

Every admin page must follow this layer order, top to bottom:

```
┌────────────────────────────────────────────────────────────────┐
│  AppTopHeader (global dark header — rendered by AdminShell)    │
│  Logo · Global Search · Theme Switcher · Language · User Menu  │
├────────────────────────────────────────────────────────────────┤
│  AdminSidebar (rendered by AdminShell)                         │
│  Group accordion navigation · Favourites · Recently Visited    │
├────────────────────────────────────────────────────────────────┤
│  PageHeader  ← first thing inside app-shell__content          │
│  Title · Breadcrumb · Description · Primary Action · Help btn  │
├────────────────────────────────────────────────────────────────┤
│  Summary / Setup health strip  (if applicable)                 │
│  Count metrics · Status pills · Completion indicators          │
├────────────────────────────────────────────────────────────────┤
│  Toolbar: Search + Quick filters (chips / select)              │
│  Collapsible advanced filters if more than 2 dimensions        │
├────────────────────────────────────────────────────────────────┤
│  Content area                                                  │
│  Table  /  Form  /  Configuration content                      │
├────────────────────────────────────────────────────────────────┤
│  Help Drawer / Preview Drawer (on demand, fixed-position)      │
└────────────────────────────────────────────────────────────────┘
```

`AdminShell` wraps every admin page and is responsible for rendering `AppTopHeader`, `AdminSidebar`,
the global `CommandPalette` (Ctrl+K), and the global `HelpDrawer`. Page components must never
re-render any of those.

---

## 2. Why this structure is the standard

**Single global header.** `AppTopHeader` is the one and only header in the admin area.
Adding a second header (e.g. a `GlobalHeader` block, a custom `<div>` mimicking a title bar)
creates visual noise, wastes vertical space, and breaks keyboard navigation order.

**PageHeader as the single source of identity.** Every page has exactly one `PageHeader`,
which is the canonical location for: page title, breadcrumb path, one-sentence description,
primary action button, secondary actions, status badge, and the "How this works" help entry.
This makes every page predictable to users and consistent for AI tooling.

**Summary strip at the top.** For pages that manage a collection of records, a 4–6 metric
summary strip below PageHeader gives users instant context (total count, active/draft/inactive
breakdown) without making them count rows in a table.

**Clean toolbar under the strip.** Search and quick filter chips live immediately above the
table. Status chips provide one-click filtering without opening a dropdown. Advanced filters
are collapsed behind a "Filters" button to reduce initial visual weight.

**Drawers for detail, not modals.** Preview drawers and help drawers slide in from the right
without navigating away from the list. Full-form edit navigates to the form view.

---

## 2a. Vertical efficiency rules for list pages

Admin list pages — those whose primary content is a table of records — must follow these rules.
Violations are caught by `scripts/check-admin-structure.js` and block or warn governance.

### Rules (FAIL on violation)

1. **No duplicate admin header.**
   A page inside `AdminShell` must never render a second title bar, custom `<div>` header,
   or `GlobalHeader` block. `AppTopHeader` is the only header in the admin area.

2. **No page-level CommandPalette.**
   `CommandPalette` is rendered exclusively by `AdminShell`. Rendering it again inside a page
   component creates duplicate keyboard shortcut handling.

3. **No AdminConfigShell in masters/ without a documented multi-section config need.**
   `AdminConfigShell` is reserved for complex multi-section config forms. A flat list page
   must not wrap itself in `AdminConfigShell`.

### Rules (WARN on violation)

4. **Specialised list pages should use AdminListPageShell.**
   A file in `src/admin/masters/` that implements a list view with `renderList` / filter state
   should use `AdminListPageShell` rather than `AdminPageShell` for that list view.
   This maximises vertical efficiency and keeps the table visible above the fold.

5. **No placeholder content.**
   Files containing `"Help coming soon"`, `"Coming soon"`, `"TODO"`, or `"Placeholder"`
   in JSX content are not production-ready. Replace with real content before shipping.

6. **Table must be visible above the fold on standard laptop screens (1366×768).**
   On a 1366×768 viewport with a 48px topbar:
   - AdminListPageShell: ≈184px consumed (24%) — compliant.
   - AdminPageShell with full PageHeader + SummaryStrip + Toolbar: ≈436px consumed (57%) — discouraged for list pages.

---

## 3. When to use this default structure

### Generic master list pages

All masters routed through `MasterListPage` (`/admin/master/:masterKey`) automatically use
this structure. The component reads its config from `adminNavConfig.ts` and renders:
`PageHeader` → toolbar (search + status filter) → sortable table + pagination.

Examples: `area-master`, `brand`, `designation-master`, `currency-master`, `bay-master`.

### Generic master form pages

All forms routed through `MasterFormPage` (`/admin/master/:masterKey/new` or `/:recordId`)
use `PageHeader` with a dynamic title (`New / Edit / View {master.label}`) and tabbed sections
(Basic Information, Additional Details, Configuration, Notes).

Examples: same set as above — any master that does not have a specialised page.

### Specialised admin pages with a list view

Pages that manage a typed record set but need custom columns, statuses, or row actions must
use `AdminListPageShell` for the list view. The compact PageBar + SmartToolbar layout ensures
the table is visible above the fold on standard laptop screens.

Examples: `CodeGenerationPolicyPage` (list view uses `AdminListPageShell`), `KycSetupPage` (list view).

### Future admin masters

Any new master added to `adminNavConfig.ts` automatically gets the generic
list + form experience from `MasterListPage` and `MasterFormPage` at zero extra cost.
Only build a specialised page when the generic table cannot represent the entity's structure.

---

## 4. When tabs or section switchers are allowed

Use a horizontal tab bar or an `AdminConfigShell` section navigator when:

- The page manages **two or more closely related sub-entities** that share the same route.
  Example: `NumberingSettingsPage` combines "Code Prefix Master" and "Code Generation Policy"
  because both are always configured together before any document is created.

- The page manages a **composite configuration workflow** where the subtabs have different
  table structures and independent CRUD actions.

- There are **3 or more sections** and a linear scrolling form would exceed a typical viewport.

Do not use tabs just to split a single form into groups of fields — use `AdminConfigShell`
section navigation instead (see section 5 below).

---

## 5. When AdminConfigShell section navigation is allowed

`AdminConfigShell` renders a fixed left-side section navigator with completion indicators.
It is allowed **only** for these cases:

- **Long multi-section setup forms** where each section is independently completable and
  the user may return to earlier sections mid-workflow.
  Examples: `OrgMasterFormPage` (5 sections), `KycSetupPage` form view (3 sections + checklist),
  `CodeGenerationPolicyPage` form view (6 sections).

- **Multi-step activation workflows** that have a visible Activation Checklist section at the end.
  The checklist section in `AdminConfigShell` provides a live validation summary.

- **Any page where section completion state must be visible at all times** — i.e. the user
  needs to know which sections are complete/partial/empty while editing any one section.

`AdminConfigShell` is **not** a general layout tool. Do not use it for:
- Simple 1–2 field forms.
- Pages that are list-only (no configuration workflow).
- Pages where all fields fit comfortably on one screen.

---

## 6. Forbidden patterns

The following patterns are explicitly prohibited. Any pull request introducing them must be
rejected and reworked before merge.

| Forbidden | Reason | Compliant alternative |
|---|---|---|
| Second inner admin header (title bar, custom header `<div>`) | Duplicates `AppTopHeader`; adds a third visual layer | Use `PageHeader` at top of content area |
| `GlobalHeader` inside `AdminShell` content | Was the legacy inner header — removed | Ctrl+K opens `CommandPalette` directly |
| Second command/search bar inside page content | Confuses users as to which search is global | Dashboard hero search is an intentional exception; new pages must not add one |
| Permanent inner sidebar on a simple page | Takes space from content without navigation benefit | Use `AdminConfigShell` only for complex multi-section config |
| Heavy nested layouts (shell inside shell) | Breaks scroll, height calculation, and keyboard tab order | Flatten layout; use drawers for detail |
| One-off page headers (custom `<div>` with icon + title + help button) | Inconsistent visual weight; not upgradable | Replace with `PageHeader` component |
| Placeholder help content (`"Help coming soon"`, empty `HelpTopic`) | Breaks governance check and misleads users | Write real steps and tips before shipping |
| Inline `HelpCircle` button outside `PageHeader` | Splits help entry into multiple locations | Wire help through `PageHeader.onHelpClick` |
| Custom modal for a simple confirmation | Heavy for a yes/no decision | Use the confirm pattern already established in `CodeGenerationPolicyPage` |

---

## 7. Smart Admin Table Standard

Admin tables in IDMS-UI are **decision surfaces**, not just data displays. A user scanning a
table should be able to understand the state and action potential of each record at a glance,
without needing to open each one.

### 7a. Core principle

Every admin list table must answer these questions for every row without requiring a click:

- **What is this record?** (primary identity)
- **Where does it apply?** (business context)
- **How is it configured?** (key configuration)
- **Is it healthy and usable?** (status / health signal)
- **What can I do with it?** (actions)

### 7b. Standard 5-column pattern

| Column | Content | Notes |
|---|---|---|
| **Primary Identity** | Code (monospace) + name + secondary label stacked | Monospace code is visually scannable at a glance. |
| **Business Context** | Applicability badge + module/entity path + sub-type stacked | Answers "where does this apply?" |
| **Key Configuration** | The most discriminating config values for this entity | Combine related fields (prefix + series + sample code). |
| **Status / Health** | Status pill (Active/Draft/Inactive) + health signal row | Two-row. Health signal provides a second dimension beyond lifecycle state. |
| **Actions** | Eye (preview/detail) + MoreHorizontal (secondary actions) | Max 2 visible icons. All other actions in more menu. |

### 7c. Column design rules

1. **Prefer ≤5 columns.** Combine low-value technical columns into logical groups.
   - Combine code + name + display label into one **Identity** column.
   - Combine module + entity + entity type into one **Context** column.
   - Combine prefix + series type + sample code into one **Configuration** column.
2. **Do not expose more than 7 columns without documented justification.** If a table needs 8+
   columns, at least two columns must be candidates for grouping or demotion to the preview drawer.
3. **Status and health are separate signals.** Status (Active/Draft/Inactive) answers "what lifecycle
   state?" Health (Healthy/Needs Review/Prefix Missing) answers "is it ready to use?". Show both.
4. **Technical IDs, audit timestamps, and secondary description text belong in the preview drawer,
   not in list columns.**

### 7d. Row density targets

| Metric | Target |
|---|---|
| Row height | 56–68 px via `minHeight: '62px'` |
| Row padding | `10px 20px` |
| Header font | 11 px, uppercase, muted colour, `letterSpacing: '0.05em'` |
| Header position | `position: sticky; top: 0` so headers stay visible on scroll |
| Grid | CSS grid (`display: grid`) with `gridTemplateColumns` — not `<table>` |

### 7e. Row action rules

- **Maximum 2 visible action icons per row** (typically Eye + MoreHorizontal).
- All secondary actions (Edit, Activate, Deactivate, Delete) go in the more menu.
- The more menu must include a **backdrop `<div>`** (`position: fixed; inset: 0; zIndex: 99`)
  that closes the menu on outside click.
- Destructive actions (Delete, Deactivate) must be separated from safe actions by a `1px` divider.

### 7f. Empty state

Every list view must render an explicit empty state when the filtered set is empty:

- Headline: `"No {Entity} records found"`
- Context-sensitive sub-text: different message for zero records vs. zero filter matches
- Primary action: `"New {Entity}"` or `"Clear filters"`

### 7g. Preview drawer

Specialised admin list pages with complex records must provide a **preview drawer** accessible
by clicking a row or the Eye action icon. The preview drawer shows full detail without navigating
away from the list. Full editing still navigates to the form view.

### 7h. Reference implementation

**`src/admin/masters/CodeGenerationPolicyPage.tsx`** is the canonical reference for the smart
admin table standard. Its `renderList()` function demonstrates:

- `AdminListPageShell` with `summaryItems` (toned), search, and quick filters
- 5-column smart CSS grid: Policy | Scope | Numbering Format | Status / Health | Actions
- `getPolicyHealth()` + `getHealthIndicator()` helpers for the health signal
- Backdrop `<div>` for the more menu
- Inline empty state
- 380 px preview drawer on the right side

---

## 7. Required elements for every admin page

Every admin page — generic or specialised — must include all of the following.

### Page shell selection (mandatory)

Choose based on the page’s primary purpose:

| Page type | Required shell | Props |
|---|---|---|
| Specialised admin list/table | `AdminListPageShell` | `title`, `primaryAction`, `summaryItems`, `searchValue`, `onSearchChange`, `quickFilterItems`, `helpTopicId` |
| Generic admin list | `AdminPageShell` (via `MasterListPage`) | standard props |
| Admin config / long form | `AdminPageShell` or `AdminConfigShell` | `title`, `breadcrumbs`, `toolbar` (section tabs), `helpTopicId` |

### PageHeader (mandatory for AdminPageShell / AdminConfigShell pages)

```tsx
<PageHeader
  title={master.label}
  description={master.description}          // one sentence
  breadcrumbs={[group.label]}               // at minimum the group label
  primaryAction={{ label: 'New X', tone: 'primary', onClick: openAddForm }}
  helpTopicId="your-help-topic-id"
  onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
/>
```

`helpTopicId` must match a real entry in `src/experience/help/helpTopics.ts`. Pages without
a real help topic must not ship — add the topic first.

### Summary strip (required when the page manages a list)

Show at minimum: Total, Active, one other status relevant to the entity.
Position immediately below the PageHeader `<div>` wrapper, before the toolbar.

```tsx
{[
  { label: 'Total',    value: records.length },
  { label: 'Active',   value: records.filter(r => r.status === 'Active').length },
  { label: 'Inactive', value: records.filter(r => r.status === 'Inactive').length },
].map(({ label, value }) => (
  <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
    <span style={{ fontSize: '17px', fontWeight: 800 }}>{value}</span>
    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</span>
  </div>
))}
```

### Primary action (mandatory)

Every page with a list must have exactly one primary action visible at all times — typically
"New [Entity]" — wired through `PageHeader.primaryAction`. Secondary actions (Import, Export)
go in `PageHeader.secondaryActions`.

### Search + quick filter toolbar (required for list pages)

```
[ Search input (280px flex) ] [ All ] [ Active ] [ Draft ] [ Inactive ] [ Filters ▾ ]
```

- Search is a text input with a leading Search icon.
- Status quick-filters are pill chips — not a `<select>` dropdown.
- Advanced filters (Applicable For, Series Type, etc.) are behind a collapsible "Filters" button.

### Empty state (required for every list)

When the filtered or unfiltered list is empty:

```tsx
<div style={{ textAlign: 'center', padding: '60px 24px' }}>
  <GroupIcon size={40} style={{ opacity: 0.2 }} />
  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
    No {master.label} records found
  </div>
  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
    {searchQuery ? 'Try a different search term.' : 'Create your first record to get started.'}
  </div>
  {!searchQuery && (
    <button type="button" onClick={openAddForm} style={btnPrimary}>
      New {master.label}
    </button>
  )}
</div>
```

The empty state must distinguish between "truly empty" and "filtered empty".

### Clean toolbar (no three-dropdown rows)

Maximum two quick-filter chips rows. Move additional filter dimensions behind the "Filters"
collapsible dropdown. Do not render three independent `<select>` dropdowns side by side.

### Consistent action placement

| Context | Placement |
|---|---|
| Primary page action | `PageHeader.primaryAction` |
| Secondary page actions (import/export) | `PageHeader.secondaryActions` |
| Row-level primary action | Eye icon (view detail) — always first |
| Row-level secondary actions | `MoreHorizontal` dropdown menu (Edit / Activate / Deactivate / Delete) |
| Form-level save | Save Draft + Activate in the form header bar |
| Destructive actions | Never exposed in the main toolbar; inside More menu or deactivation modal |

---

## 8. Existing pages and their compliance status

| Page | File | Shell | Status |
|---|---|---|---|
| Admin Dashboard | `AdminDashboard.tsx` | — | Compliant |
| Generic master list | `MasterListPage.tsx` | `AdminPageShell` | Compliant |
| Generic master form | `MasterFormPage.tsx` | `AdminPageShell` | Compliant |
| Code Generation Policy (list) | `CodeGenerationPolicyPage.tsx` | `AdminListPageShell` | ✅ Compliant |
| Code Generation Policy (form) | `CodeGenerationPolicyPage.tsx` | `AdminPageShell` | ✅ Compliant |
| Organisation Master | `OrgMasterFormPage.tsx` | `AdminPageShell` | Compliant |
| KYC Setup (list) | `KycSetupPage.tsx` | `AdminPageShell` | Needs migration to `AdminListPageShell` |
| KYC Setup (form) | `KycSetupPage.tsx` | `AdminPageShell` | Compliant |
| Numbering & Code Setup | `NumberingSettingsPage.tsx` | `AdminPageShell` | Compliant |
| Picklist Master | `PicklistMasterPage.tsx` | `AdminPageShell` | Compliant |

Pending pages are tracked in Wave 1 / Wave 2 in the implementation backlog.
See `docs/admin-demo-walkthrough.md` for the demo readiness status.
