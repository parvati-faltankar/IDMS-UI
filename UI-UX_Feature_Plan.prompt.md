# Plan: IDMS-UI Comprehensive UI/UX Features Document

## Goal

Produce `docs/ui-ux-features-complete.md` — a single, thorough document covering every UI/UX feature across all 9 transaction modules, the admin panel, and the 5 builder tools. Structured by *feature area*, not code file. Each entry answers: what it is → where it lives → how it works → key user interactions. Audience: senior product/engineering stakeholders.

---

## Scope snapshot (from codebase exploration)

| Area | Count |
|---|---|
| Transaction modules | 9 (Purchase + Sales lifecycle + Approval Studio) |
| Admin master groups | 12 groups, 72 masters |
| Specialized admin page editors | 5 (Org, Numbering, Picklist, KYC, Code Gen Policy) |
| Builder tools (Profile area) | 5 (Theme, Menu, Print, Form Layout, Language) |
| Shared common components | 25+ |
| Experience / advanced UX components | 10 |
| Catalogue features per module | 15+ toolbar/grid features each |
| Supported languages | 5 (including Arabic RTL) |

---

## Document sections — 17 major areas

### Section 1 — App Shell & Global Navigation
- Top header bar (global search, theme switcher, language selector, notifications, user menu)
- Left sidebar: 3-level hierarchical navigation with icons, active states, collapse/expand
- AppShell wrapper pattern (top header + sidebar + content slot)
- Mobile nav toggle

### Section 2 — Global Search & Command Palette
- Global search panel: full-text cross-module search across all 9 modules
- Search scopes: All / Per-entity / Module (Procurement / Sales) / Form Layout / Approval Studio / Print Builder
- Search result grouping by entity, highlighted matched text, recent searches
- Command palette (Ctrl+K): keyboard-accessible launcher, arrow-key navigation, Enter to execute, Escape to close
- "Continue: [label]" recent-master commands at top of palette
- Voice command parsing: spoken phrase → resolved navigation action
- Search insights: contextual suggestion cards (e.g., "High-value orders pending approval") → filtered view

### Section 3 — Catalogue / List View System (shared across all 9 modules)
- CatalogueInsightCards: summary metric cards (Total count, Status breakdown, Amount metrics); clicking a card applies that status filter
- Toolbar standard actions: + New, Filter, Columns, Chart, Preview, View, Export, … More
- CatalogueViewSelector: dropdown to switch between system views and custom saved views; pin/unpin favourite views; view count display
- CatalogueViewConfigurator: create/edit saved views — owner scope (All / Mine / Specific), primary entity filter, secondary entity filter, sort configuration, pin as default, delete
- Advanced filter drawer (CatalogueFilterDrawer): Date range, Status multi-select, Supplier/Customer, Priority, Amount range, Owner; applied filters shown as chips in toolbar
- Status badges: colour-coded pills (Draft, Pending Approval, Approved, Rejected, Cancelled, Active, Inactive)

### Section 4 — CommonDataGrid — Deep Dive
- Sortable columns: click header → ascending; click again → descending; sort indicator arrows shown
- Column pinning: pin columns to left/right so they stay visible on horizontal scroll
- Column reordering: drag-drop column headers to rearrange (via DataGridConfigurator)
- Column visibility toggle: show/hide columns via Columns toolbar button; state saved per user
- Density toggle: Compact / Comfortable / Spacious row height
- Row selection: checkbox per row + "Select All" on header; multi-select with Shift+click
- Bulk actions: appear in toolbar when rows are selected (Export CSV, Archive, Delete, Change Status)
- CSV export: exports selected rows or all filtered rows as a downloadable CSV
- Inline aggregations: count of selected rows; sum of amount columns shown in footer
- Saved column preferences: column widths, visibility, pin state, density saved to localStorage per module

### Section 5 — View Modes: Table / Card / Split
- **Table view** (default): full CommonDataGrid with all sortable/filterable columns
- **Card view**: each record rendered as a card tile in a grid layout; shows key fields (document number, date, status, amount); configured via CatalogueSectionLayoutSettings
- **Split view**: left panel is the list (condensed rows); right panel is the DocumentPreviewDrawer for the selected row; resizable split
- **Switching views**: toolbar View button or CatalogueSectionLayoutSettings menu; preference saved per module
- Planned (future): Kanban view — drag-drop cards between status columns

### Section 6 — Document Preview Drawer
- Click on any document number in the grid → DocumentPreviewDrawer slides in from the right
- Shows: document number, status badge, key fields summary, line items preview, amount breakdown
- Does NOT navigate away from the list — full list remains visible (Split view pattern)
- Close with ✕ button or press Escape
- PurchaseRequisitionPreviewDrawer: specialised variant for PR with additional PR-specific fields

### Section 7 — Chart Visualization Drawer (DataGridChartDrawer)
- Opened via "Chart" toolbar button on any catalogue list
- Chart types: Bar, Line, Area, Pie
- Dimension column selector: choose which field to group by (e.g., Status, Supplier, Priority)
- Metric column selector: choose which numeric column to aggregate (e.g., Total Amount, Quantity)
- Aggregation modes: Count (number of records) or Sum (numeric total)
- Series grouping: break a bar/line chart into colour-coded series per group value
- Chart powered by Recharts; renders live from current filtered grid data

### Section 8 — Transaction Modules × 9

Each module follows the same shell pattern (Catalogue list + Create/Edit form) but has module-specific fields, tabs, and workflows.

#### Purchase Requisition (PR)
- Route: `/purchase-requisition` (list), `/purchase-requisition/new` (form)
- Form tabs: Basic Info, Requested Items (inline grid), Delivery Details, Finance, Attachments, Notes
- Line item grid: product lookup, UOM, quantity, estimated rate, required date, inline delete
- Document lifecycle: Draft → Pending Approval → Approved / Rejected / Cancelled
- Special: Guided tour on first open (TourInvitePopup + GuidedTour popovers with focus trap); Form layout preview + GridColumnConfigurator; Print integration (useDocumentPrint)

#### Purchase Order (PO)
- Route: `/purchase-order` (list), `/purchase-order/new` (form)
- Form tabs: Header (Supplier, PO date, reference), Line Items (product, UOM, qty, rate, discount, tax), Payment Terms, Delivery, Notes
- Supplier selection with contact management panel
- Payment terms: configurable payment schedule
- localStorage persistence for auto-save of draft
- Document lifecycle: Draft → Confirmed → Partially Received → Fully Received → Closed / Cancelled

#### Purchase Receipt (GRN)
- Route: `/purchase-receipt` (list), `/purchase-receipt/new` (form)
- GRN (Goods Receipt Note) against a Purchase Order
- PO matching: select PO → line items auto-populate with ordered qty vs received qty
- Quality inspection fields per line item
- Serial/batch number capture per line
- Rejection handling: partial acceptance + rejection reason per line

#### Purchase Invoice
- Route: `/purchase-invoice` (list), `/purchase-invoice/new` (form)
- 3-way matching: links PO ↔ Receipt ↔ Invoice with variance highlighting
- Tax fields: GST (CGST/SGST/IGST), TDS configuration
- Payment status tracking: Unpaid / Partially Paid / Paid
- Invoice date vs. accounting date separation

#### Sale Order (SO)
- Route: `/sale-order` (list), `/sale-order/new` (form)
- Form tabs: Customer Order, Product Detail (line items), Payment & Finance, Delivery & Shipping
- Complex line items: product, serial number, batch, warranty details, exchange product details
- Payment modes: Cash, Finance (with EMI calculator), Part-payment
- Delivery terms & shipping method selection
- Exchange product tracking (old unit in + new unit out)
- documentStore integration for cross-component real-time updates
- Custom catalogue views with pinning (saleOrderViews.ts)

#### Sale Allocation Requisition (SAR)
- Route: `/sale-allocation-requisition` (list), `/sale-allocation-requisition/new` (form)
- Allocation request against confirmed Sale Orders
- Warehouse and bin-location selection per line

#### Sale Allocation (SA)
- Route: `/sale-allocation` (list), `/sale-allocation/new` (form)
- Physical stock allocation to fulfilment orders
- Quantity tracking: Requested vs Allocated vs Available
- Partial allocation support

#### Sale Invoice (SI)
- Route: `/sale-invoice` (list), `/sale-invoice/new` (form)
- Invoice generated against completed allocation
- Payment collection tracking: mode, reference, amount, date
- Credit note generation for returns

#### Delivery
- Route: `/delivery` (list), `/delivery/new` (form)
- Delivery/dispatch tracking after allocation
- Shipment routing and carrier assignment
- Dispatch confirmation with vehicle/LR number capture

#### Approval Studio
- Route: `/approval-studio` (list), `/approval-studio/new` (form)
- 6-step wizard: Basic Details → Trigger → Approvers → Rules → Actions → Publish
- Approval flow types: Sequential (one after another), Parallel (all at once), Hybrid (mix)
- Business domains: Purchase, Sales, Service, HR, Finance, General
- Trigger configuration: document type + condition (e.g., "Amount > 10,000")
- Approver setup: role-based or user-specific; escalation rules
- Rules (DMN-style decision table): condition columns mapped to approval levels
- Actions on approval/rejection: auto-notify, status update, create follow-up document, delegate
- Snapshot & rollback: rejected documents revert to last approved state
- List bulk actions: Archive, Duplicate, Delete; filter by status, type, owner, date range

### Section 9 — Form Layout System

#### Architecture
```
Multi-tab container
  └── Tab (Basic, Items, Finance, Delivery, etc.)
        └── Section (within a tab — logical field grouping)
              └── FormField (label + input + help + error)
                    └── Input types: text, number, email, date (DatePicker popup), select dropdown, textarea
```

#### Inline Line Item Grid
- Each form with line items uses an editable grid embedded in the "Items" tab
- Keyboard navigation: Tab moves right across cells; Enter confirms and moves to next row; Tab at last cell of a row appends a new empty row
- Each row has a delete (✕) button
- Validation runs on save: required cells highlighted in red

#### Form Actions
- **Save Draft**: saves current state without validation; shows toast/success banner
- **Cancel**: confirms via ConfirmationDialog if form is dirty; navigates back to list
- **Submit/Approve**: full validation run; on pass → SuccessSummaryDialog with document reference
- **Print**: triggers useDocumentPrint hook → PrintTemplatePreviewOverlay opens

#### Validation States
- Field-level: red border + error message below field
- Section-level: section header shows incomplete indicator
- Form-level: submit blocked; error summary listed

### Section 10 — Form Layout Builder

- **Route**: `/profile/form-layout` (settings/list), `/profile/form-layout/edit` (editor)
- **Purpose**: Lets an admin rearrange tabs, sections, and fields on any transaction form without code changes
- **Tab management**: Create new tab (CompactFormDialog), rename inline, drag to reorder, delete (with confirmation)
- **Section management**: Create sections within a tab, rename inline, merge two sections, delete
- **Field reordering**: Drag-drop fields within a section; move fields between sections
- **Fields-per-row**: Set 1, 2, or 3 columns per section row for compact or spacious layout
- **Draft → Publish**: Save to draft for review; publish makes it live for all users
- **Reset to template**: Revert all customisations to the default system template
- **GridColumnConfigurator**: Configure which columns appear in inline line-item grids (separate from form fields)

### Section 11 — Navigation / Menu Builder

- **Route**: `/profile/menu-builder`
- **Purpose**: Build and publish the application sidebar navigation without code changes
- **Tree editor (MenuTree)**: Visual recursive tree showing menu hierarchy; drag-drop to reorder items or change nesting depth
- **Add/Edit items (MenuFormDialog)**: Label, route path, icon picker (icon library), parent assignment
- **Nesting**: Supports multi-level hierarchy (Group → Module → Sub-item)
- **Live preview (MenuPreview)**: Right panel shows the exact sidebar rendering as it will appear to users; updates in real time as items are added/edited
- **Validation (MenuValidationSummary)**: Checks for required fields, broken/unregistered routes, duplicate labels; publish is blocked until validation passes
- **MenuStatusBadge**: Shows current menu state (Draft / Published / Needs Attention)
- **Publish**: Saves and activates new menu; reflected immediately in AppSidebar for all users

### Section 12 — Theme Builder

- **Route**: `/profile/theme-builder`
- **Purpose**: Create and publish visual themes (brand colours, fonts, appearance)
- **Built-in themes (7)**: Default, Excellon, Sky Blue, Forest Green, Sunset Orange, Royal Purple, Minimal Gray — read-only; can be duplicated as base for custom
- **Custom theme creation**: Name a theme → configure 16 colour slots → select font → choose light/dark mode → Save Draft → Publish
- **16 colour slots**: Primary, Secondary, Accent, Text Primary, Text Secondary, Background, Surface, Border, Error, Warning, Success, Info, Header Background, Sidebar Background, Button Background, Link
- **Font selection (8 options)**: Roboto, Inter, Poppins, Helvetica, Times New Roman, Courier, Georgia, Trebuchet MS
- **Colour input**: Hex code field with live colour swatch preview; validates hex format
- **Light / Dark appearance**: Each theme can be set to Light or Dark mode; applies `data-appearance` on root element for CSS variable switching
- **Draft → Publish lifecycle**: Published theme immediately updates CSS variables site-wide via ThemeProvider
- **Delete / Reset**: Delete custom themes; Reset built-in themes to system defaults
- **Sort**: List sorted by created/updated date

### Section 13 — Print Builder

- **Routes**: `/profile/print-builder` (template list), `/profile/print-builder/edit` (drag-drop editor)
- **Purpose**: Design printable document templates (invoices, orders, receipts) with a visual block editor
- **Block types (drag onto canvas)**:
  - Text Block — free text or dynamic field token (e.g., `{{companyName}}`)
  - Image Block — URL or upload
  - Table Block — dynamic columns from document data (headers, rows, footer totals)
  - Divider Block — horizontal rule
  - QR Code Block — encodes document reference URL
  - Barcode Block — encodes document number
- **Block styling**: font, size, weight, italic, underline, text colour, alignment, padding, margin
- **Block layout**: full-width or half-width (two-column) placement
- **Entity registry**: Each template is associated with one entity (SO, PO, PR, Invoice, Receipt, Delivery, SAR, SA, Sale Invoice)
- **Print preview overlay (PrintTemplatePreviewOverlay)**: Floating A4-frame preview rendered from the block tree; opened from the form's Print button
- **useDocumentPrint hook**: Embedded in every transaction Create form; provides `handlePrint()` that opens the preview overlay with current form data
- **Multiple copies**: Configure number of printed copies (e.g., Original + Duplicate)



#### Keyboard Shortcuts Reference
| Shortcut | Action |
|---|---|
| Ctrl + K | Open command palette / global search |
| Escape | Close any open drawer, dialog, or palette |
| Tab | Move to next cell in inline grid |
| Enter | Confirm inline cell edit; append new grid row at end |
| Arrow Up/Down | Navigate command palette results |
| Shift + Click | Multi-select rows in data grid |

#### LocalStorage Persistence Strategy
- **Column preferences** (visibility, width, density, sort) — saved per module key
- **Catalogue view** (active view, custom views, pinned views) — saved per module
- **Recently visited masters** — saved as a shared list; max 10 entries; newest first
- **Favourited masters** — saved as a set of master keys
- **Form draft state** (PO, SO) — saved via documentStore to allow resuming incomplete forms
- **Dismissed alerts** — dashboard alerts dismissed by session

#### Localization & RTL
- **LocalizationProvider** wraps the entire app; exposes `useLocalization()` hook
- Language switcher in top header; updates all UI strings immediately
- Arabic mode: root element gets `dir="rtl"`; layout components use CSS logical properties for correct directional mirroring (paddingInlineStart/End, borderInlineStart/End, marginInlineStart/End)

---

## Component Reference Table

| Component | File location | Purpose | Used on |
|---|---|---|---|
| AppShell | src/components/common/AppShell.tsx | Main layout wrapper | All pages |
| AppSidebar | src/components/common/AppSidebar.tsx | Left nav (3-level) | All pages |
| AppTopHeader | src/components/common/AppTopHeader.tsx | Global top bar | All pages |
| CommonDataGrid | src/components/common/CommonDataGrid.tsx | Feature-rich sortable table | All catalogue lists |
| CatalogueViewSelector | src/components/common/CatalogueViewSelector.tsx | View switcher dropdown | All catalogue lists |
| CatalogueViewConfigurator | src/components/common/CatalogueViewConfigurator.tsx | Create/edit saved views | All catalogue lists |
| CatalogueFilterDrawer | src/components/common/CatalogueFilterDrawer.tsx | Advanced filter panel | All catalogue lists |
| CatalogueInsightCards | src/components/common/CatalogueInsightCards.tsx | Summary stat cards | All catalogue lists |
| DataGridChartDrawer | src/components/common/DataGridChartDrawer.tsx | Chart from grid data | All catalogue lists |
| DataGridConfigurator | src/components/common/DataGridConfigurator.tsx | Column show/hide/reorder | All catalogue lists |
| DocumentPreviewDrawer | src/components/common/DocumentPreviewDrawer.tsx | Side detail panel | All catalogue lists |
| SortableTableHeader | src/components/common/SortableTableHeader.tsx | Sort indicator UI | CommonDataGrid |
| CatalogueSectionLayoutSettings | src/components/common/CatalogueSectionLayoutSettings.tsx | View mode switch (Table/Card/Split) | All catalogue lists |
| FormControls | src/components/common/FormControls.tsx | Input, Select, Textarea, FormField | All transaction forms |
| DatePicker | src/components/common/DatePicker.tsx | Date input with calendar popup | All transaction forms |
| AppDialog | src/components/common/AppDialog.tsx | Centered modal | Confirmation, success dialogs |
| AppDrawer | src/components/common/AppDrawer.tsx | Slide-out panel | Filters, help, details |
| SideDrawer | src/components/common/SideDrawer.tsx | Right-sliding drawer | Preview, chart, help |
| ConfirmationDialog | src/components/common/ConfirmationDialog.tsx | Confirm/Cancel action | Delete, cancel document |
| SuccessSummaryDialog | src/components/common/SuccessSummaryDialog.tsx | Success feedback + summary | Post-submit on forms |
| CancelDocumentDialog | src/components/common/CancelDocumentDialog.tsx | Cancel with reason capture | All transaction forms |
| CompactFormDialog | src/components/common/CompactFormDialog.tsx | Quick single-field dialog | Form layout builder (rename/create) |
| GlobalSearchPanel | src/components/common/GlobalSearchPanel.tsx | Search results UI | Global search overlay |
| AmountBreakdownDrawer | src/components/common/AmountBreakdownDrawer.tsx | Financial breakdown panel | Transaction forms + preview |
| StatusBadge | src/components/common/StatusBadge.tsx | Colour-coded status pill | All lists and forms |
| GuidedTour | src/components/common/GuidedTour.tsx | Step-by-step tour overlay | Purchase Requisition (first visit) |
| TourInvitePopup | src/components/common/TourInvitePopup.tsx | Tour invite banner | Purchase Requisition |
| MenuBuilder/* | src/components/common/MenuBuilder/ | Full menu editor (7 files) | /profile/menu-builder |
| GridColumnConfigurator | src/components/common/GridColumnConfigurator.tsx | Inline grid column management | Form Layout Builder |
| FormLayoutPreviewOverlay | src/components/common/FormLayoutPreviewOverlay.tsx | Form layout preview panel | Form Layout Builder |
| PageHeader | src/experience/components/PageHeader/ | Page title + breadcrumb + actions | All admin and builder pages |
| GlobalHeader | src/experience/components/GlobalHeader/ | Top nav with search + help | Admin shell |
| SmartSidebar | src/experience/components/SmartSidebar/ | Collapsible group sidebar | Admin shell |
| CommandPalette | src/experience/components/CommandPalette/ | Ctrl+K launcher | Admin shell |
| HelpDrawer | src/experience/components/HelpDrawer/ | Contextual help panel | Admin shell + transaction forms |
| FieldHelpPopover | src/experience/components/FieldHelpPopover/ | Inline field help | Admin master forms |
| AdminConfigShell | src/experience/components/AdminConfigShell/ | Admin setup page wrapper | All 5 specialized admin editors |
| AdminSetupAssistant | src/experience/components/AdminSetupAssistant/ | First-run setup checklist | Admin Dashboard |
| EmptyStateGuide | src/experience/components/EmptyStateGuide/ | Contextual empty state | Admin and transaction lists |
| ValidationChecklist | src/experience/components/ValidationChecklist/ | Step-by-step validation UI | KYC Setup, Code Gen Policy |
| PrintTemplateDocument | src/print-builder/PrintTemplateDocument.tsx | Print block renderer | Print Builder editor + preview |
| PrintTemplatePreviewOverlay | src/print-builder/PrintTemplatePreviewOverlay.tsx | A4 print preview float panel | All transaction Create forms |
| ThemeProvider | src/theme/ThemeProvider.tsx | CSS variable injection | Root (wraps entire app) |

---

## Document format rules

- Each feature entry: **Feature Name** → what it is → where it is used → how it works → key user interactions (numbered steps or bullet list)
- Architecture flows as text diagrams for complex component compositions
- Tables for reference lists (shortcuts, status colours, config slots)
- Tone: product-facing, non-technical prose. No TypeScript interfaces or import paths in the body — only in the reference table appendix.
- Approximate length: 400–450 lines of structured markdown; ~6,500–8,000 words.

---

## Output

File to create: `docs/ui-ux-features-complete.md`

After creation, verify:
1. All 17 section headings present
2. `npm run ui:governance` still passes (file must be > 80 chars — it will be ~40,000+ chars)
