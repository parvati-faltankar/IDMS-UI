# IDMS-UI — Complete UI/UX Feature Reference

**Audience:** Senior product and engineering stakeholders.
**Scope:** All 9 transaction modules, the admin panel (12 groups, 72 masters, 5 specialised editors), and 5 builder tools. Structured by feature area; each entry covers what the feature is, where it lives, how it works, and the key user interactions.

---

## Section 1 — App Shell & Global Navigation

### AppShell

The AppShell is the root layout wrapper that frames every screen in IDMS-UI. It is composed of three structural layers: the top header (fixed, full-width), the left sidebar (fixed-width, scrollable), and the main content slot (fills remaining viewport). Every page — transaction list, form, admin configuration, or builder tool — is rendered inside this shell without reloading the frame.

**Where it lives:** Applied via `AppShell` wrapping the router outlet in `App.tsx`.

**How it works:**
- The top header and sidebar are always rendered regardless of the active route.
- The content area receives the active page component and handles its own internal scrolling.
- On small viewports a hamburger icon in the top header toggles the sidebar between visible and hidden states with a slide-in animation.
- The sidebar collapse state is persisted to `localStorage` so it survives page refreshes.

### Top Header Bar

The top header bar spans the full width of the screen at 52px height. It is the persistent global control surface for app-wide actions that are always reachable regardless of the active page.

**Contents (left to right):**
- **Logo / app name** — navigates to the home/dashboard on click.
- **Global search trigger** — opens the GlobalSearchPanel overlay for cross-module search.
- **Theme switcher** — cycles or selects between the available published themes; applies immediately.
- **Language selector** — dropdown of supported languages; switching updates all UI strings in real time.
- **Notifications bell** — shows unread alert count; opens the notifications panel.
- **User menu** — avatar or initials; dropdown with profile, settings, and sign-out.

### Left Sidebar (AppSidebar)

The sidebar provides three-level hierarchical navigation for all modules and admin areas. It renders as a vertical list of groups; each group expands to show modules and each module can reveal sub-items.

**Key interaction patterns:**
1. **Expand a group** — click the group header; the group opens and pushes lower items down.
2. **Navigate to a page** — click any module or sub-item; the active route is highlighted with a primary-colour left border and background tint.
3. **Collapse the sidebar** — click the collapse toggle (arrow icon at the bottom); sidebar shrinks to icon-only mode to give content more space. Icons remain as visual anchors.
4. **Mobile nav toggle** — on viewports below the sidebar breakpoint the sidebar is hidden; the hamburger button in the top header slides it in as an overlay.

---

## Section 2 — Global Search & Command Palette

### Global Search Panel

The global search feature gives users a single entry point to find any record across all 9 transaction modules without knowing which list to navigate to first.

**Where it lives:** Triggered from the search icon in the top header; opens as a full-overlay panel.

**How it works:**
- As the user types, results stream in and are grouped by entity type (Purchase Requisitions, Purchase Orders, Sale Orders, etc.).
- Matched text is highlighted inline so users can confirm relevance at a glance.
- **Search scopes** narrow results: All, Procurement module, Sales module, Form Layout, Approval Studio, Print Builder. The scope selector appears as chips below the search input.
- **Recent searches** are shown when the input is empty; clicking a recent search re-runs it instantly.
- Pressing **Escape** closes the panel without navigating.

**Key interactions:**
1. Click the search icon (or press Ctrl+K to also open the command palette) → panel slides down.
2. Type a document number, supplier name, or keyword → grouped results appear within ~300ms.
3. Click a result → navigates to the full record or filtered list view.
4. Click a scope chip → results refresh within that scope only.

### Command Palette (Ctrl+K)

The command palette is a keyboard-first launcher that lets power users navigate and trigger actions without reaching for the mouse.

**Where it lives:** Available in all admin pages via the Ctrl+K shortcut; also accessible via the search icon.

**How it works:**
- Opens as a centred modal with a search input.
- The top items are **"Continue: [label]"** commands that resume the most recently visited admin master screens (up to 3), so an admin can pick up exactly where they left off without navigating through groups.
- Below those, all registered commands are searchable — navigation shortcuts, master open commands, and action triggers.
- Arrow Up / Down navigate the list; Enter executes the highlighted command; Escape closes.
- Commands are registered in a central `commandRegistry`; individual pages can add contextual commands without hardcoding them in the palette component.

### Search Insights

Search insights are proactive suggestion cards that appear on dashboard and catalogue pages. They surface contextual prompts based on data patterns — for example, "12 high-value purchase orders pending approval" or "3 customers with incomplete KYC". Clicking a card opens the relevant filtered list view with the suggested filter already applied, turning the suggestion into an immediate action.

### Voice Command

The voice command module listens to a spoken phrase and resolves it to a registered navigation action. For example, saying "open purchase requisition" navigates to the PR list. Voice input is parsed against the same command registry used by the command palette, so any command reachable by keyboard is also reachable by voice.

---

## Section 3 — Catalogue / List View System

Every transaction module and many admin pages share a common catalogue shell that provides a consistent and feature-rich list experience.

### CatalogueInsightCards

A row of summary metric cards rendered at the top of each catalogue list. Each card shows a label (e.g., "Total", "Approved", "Pending Approval") and a count or amount value. Clicking a card applies that status as an active filter on the list, instantly narrowing the grid to matching records. The cards update in real time as the underlying data or active filters change.

### Toolbar Standard Actions

The catalogue toolbar provides a consistent set of actions across all modules:

| Button | Action |
|---|---|
| **+ New** | Opens the Create form for this document type |
| **Filter** | Opens the CatalogueFilterDrawer advanced filter panel |
| **Columns** | Opens DataGridConfigurator to show/hide/reorder columns |
| **Chart** | Opens DataGridChartDrawer for data visualisation |
| **Preview** | Toggles split view (list + detail side-by-side) |
| **View** | Opens CatalogueViewSelector to switch or manage saved views |
| **Export** | Exports current filtered rows as a CSV download |
| **… More** | Reveals additional bulk or contextual actions |

When one or more rows are selected via checkboxes, bulk action buttons appear in the toolbar — for example, Export Selected, Archive, Delete, or Change Status.

### CatalogueViewSelector

A dropdown attached to the View toolbar button that lets users switch between the default system view and any custom saved views they or their team have created. Each view entry shows its name, owner scope, and a pin icon. Pinning a view sets it as the default for that module; the pin state and active view are persisted per module in `localStorage`.

### CatalogueViewConfigurator

The create/edit interface for saved views. Opened from the CatalogueViewSelector dropdown's "New View" or "Edit" actions. Configuration options:

- **Name** — the label shown in the view list.
- **Owner scope** — All records / Mine / Specific user or team.
- **Primary entity filter** — the main document status or type to filter on.
- **Secondary entity filter** — a second dimension (e.g., supplier, priority).
- **Sort** — which column to sort by and in which direction.
- **Pin as default** — makes this view load automatically on next visit.
- Save creates the view; Delete removes it (with a confirmation dialog).

### Advanced Filter Drawer (CatalogueFilterDrawer)

A slide-in panel from the right that exposes all available filter dimensions for a module. Standard filters across all modules include: date range picker, status multi-select, supplier or customer lookup, priority selector, amount range (min / max), and owner. Applied filters appear as removable chips in the toolbar row so users always see what is active without reopening the drawer.

### Status Badges

Colour-coded pill badges are used consistently across all list views and document forms to communicate the lifecycle state of every record:

| Status | Colour |
|---|---|
| Draft | Neutral grey |
| Pending Approval | Amber |
| Approved | Green |
| Rejected | Red |
| Cancelled | Muted grey |
| Active | Green |
| Inactive | Muted grey |

---

## Section 4 — CommonDataGrid — Deep Dive

CommonDataGrid is the shared, feature-rich table component used on every catalogue list across all 9 transaction modules and many admin pages. It wraps a standard HTML table with an extensive feature set managed through a centralised configurator.

### Column Sorting

Clicking any sortable column header sorts the list ascending. Clicking the same header again reverses the sort direction. A small arrow indicator on the header shows the current sort column and direction. Only one column can be the primary sort at a time.

### Column Pinning

Any column can be pinned to the left or right edge of the table. Pinned columns stay fixed while the user scrolls horizontally through wide datasets. A pin icon appears in the column header context menu. The pin state is saved per user per module.

### Column Reordering and Visibility

The DataGridConfigurator (Columns toolbar button) opens a panel listing all available columns with toggles to show or hide each one. Columns can be dragged to a new position in the list to reorder them in the table. All changes are applied immediately and saved to `localStorage` per module key so the configuration survives page refreshes.

### Density Toggle

The toolbar provides a density selector with three options — Compact (tight rows for scanning many records), Comfortable (default), and Spacious (more breathing room for reading content). The selection is saved per module.

### Row Selection and Bulk Actions

Each row has a leading checkbox; the column header has a "Select All" checkbox that selects all rows on the current page. Holding Shift while clicking a row extends the selection range. When any rows are selected, bulk action buttons appear in the toolbar. Bulk actions include: Export CSV (selected rows only), Archive, Delete (with a confirmation dialog), and Change Status. The count of selected rows is shown in the toolbar.

### CSV Export

Exports either the selected rows or all rows matching the current filter as a CSV file downloaded to the user's device. Column order in the export matches the current visible column order in the grid.

### Inline Aggregations

A fixed footer row below the table displays aggregate values: the count of selected rows and the sum of any amount-type columns (e.g., Total Amount). This lets users quickly verify totals without exporting.

---

## Section 5 — View Modes: Table / Card / Split

Each catalogue list supports three rendering modes that can be switched from the toolbar.

### Table View

The default mode renders the full CommonDataGrid with all configured columns, sorting, pinning, and density features active. This view is optimised for scanning and comparing many records at once.

### Card View

Each record is rendered as a card tile in a responsive grid layout. Cards show the most important fields — document number, date, status badge, primary party name (customer or supplier), and amount — without showing every column. Card view is configured via CatalogueSectionLayoutSettings and is ideal for visual scanning where identity matters more than column comparison. Clicking a card navigates to the full record.

### Split View

The list is rendered in a condensed left panel (roughly 40% width). When a row is clicked, a DocumentPreviewDrawer slides into the right panel (60%) showing full document details without navigating away from the list. The split proportion is resizable by dragging the divider. This view is designed for triage workflows where users need to review many documents quickly and act on each one without losing their place in the list.

### Switching Views

The View toolbar button opens CatalogueSectionLayoutSettings, which shows the three view mode options. The selected mode is saved per module in `localStorage`.

---

## Section 6 — Document Preview Drawer

The DocumentPreviewDrawer is a right-side slide-in panel that shows the full details of a selected document without navigating away from the list.

**Triggered by:** Clicking a document number link in any catalogue list row (in Table view), or automatically when a row is clicked in Split view.

**Contents:**
- Document number and creation date
- Status badge
- Key header fields (party name, reference, date, assigned user)
- Line items preview — a condensed table of items, quantities, and amounts
- Amount breakdown — subtotal, tax, discount, and grand total
- Footer actions — quick links to Edit, Print, or Cancel the document

**Closing:** The ✕ button in the drawer header or pressing Escape closes the drawer and returns focus to the grid row.

**Purchase Requisition variant:** The `PurchaseRequisitionPreviewDrawer` is a specialised version with PR-specific fields including requested delivery date, priority, requesting department, and approval status per approver level.

---

## Section 7 — Chart Visualization Drawer (DataGridChartDrawer)

**Triggered by:** The Chart toolbar button on any catalogue list.

The DataGridChartDrawer opens as a full-height right-side panel and renders a live chart from the current filtered grid data. It is designed to give users instant visual insight without exporting to a spreadsheet.

**Chart types:** Bar, Line, Area, and Pie. The user selects the type from a button group at the top of the drawer.

**Configuration:**
- **Dimension column** — the field to group data by (e.g., Status, Supplier name, Priority, Month). Each unique value in this column becomes a segment or bar.
- **Metric column** — the numeric field to aggregate (e.g., Total Amount, Quantity, Count of records).
- **Aggregation mode** — Count (number of records per group) or Sum (sum of the metric column per group).
- **Series grouping** — for Bar and Line charts, a second dimension field can be selected to colour-code the bars or lines by group (e.g., status within each supplier).

Charts rerender immediately when the configuration changes. The chart reflects the same rows as the current active filter in the grid — if the user has filtered to "Approved" orders only, the chart shows only approved orders.

---

## Section 8 — Transaction Modules × 9

All 9 modules share the same outer shell: a catalogue list view using CommonDataGrid with the full toolbar feature set, and a Create/Edit form with a multi-tab layout, inline line-item grid, document lifecycle actions, and print integration. The module-specific details below describe what makes each one distinct.

### Purchase Requisition (PR)

The PR module is the first step in the procurement lifecycle, allowing any department user to request items before a purchase order is raised.

**Route:** `/purchase-requisition` (list), `/purchase-requisition/new` (form).

**Form tabs:** Basic Info (requester, department, priority, reference date), Requested Items (inline editable grid — product lookup, UOM, quantity, estimated rate, required delivery date, inline delete), Delivery Details, Finance (budget code, cost centre), Attachments, Notes.

**Document lifecycle:** Draft → Pending Approval → Approved / Rejected / Cancelled.

**Special features:** On first visit a `TourInvitePopup` banner invites the user to take a guided tour. Accepting launches a `GuidedTour` overlay — a sequence of popover cards with focus trapping that walks through the form tabs step by step. The tour state is saved to `localStorage` so it does not reappear after completion. PR also integrates with the Form Layout Builder and GridColumnConfigurator so admins can customise the visible fields and inline grid columns.

### Purchase Order (PO)

The PO is raised after a requisition is approved or directly for planned procurement. It is the binding document sent to a supplier.

**Route:** `/purchase-order` (list), `/purchase-order/new` (form).

**Form tabs:** Header (supplier lookup with contact management side-panel, PO date, delivery address, reference), Line Items (product, UOM, ordered quantity, unit rate, discount percentage, tax rate, line total), Payment Terms (configurable schedule with due dates and percentages), Delivery, Notes.

**Document lifecycle:** Draft → Confirmed → Partially Received → Fully Received → Closed / Cancelled.

Draft state is auto-saved to `localStorage` via the `documentStore`, so an incomplete PO can be resumed across sessions.

### Purchase Receipt (GRN)

The Goods Receipt Note records the physical receipt of items against a confirmed Purchase Order.

**Route:** `/purchase-receipt` (list), `/purchase-receipt/new` (form).

**How it works:** The user selects a confirmed PO from a lookup; line items auto-populate with the ordered quantity for each product. For each line the user enters the received quantity, which is compared against the ordered quantity to show a visual variance. Quality inspection fields capture inspection outcome per line. Serial and batch numbers are captured per received item. Partial acceptance is supported — items that fail inspection have a rejection reason captured; they are excluded from stock receipts.

### Purchase Invoice

The purchase invoice records the supplier's billing document and reconciles it against the PO and GRN.

**Route:** `/purchase-invoice` (list), `/purchase-invoice/new` (form).

**3-way matching:** The form links a PO and its associated GRN to the invoice. Variance highlighting shows any quantity or rate differences between what was ordered, received, and invoiced, alerting the user to potential billing errors before approval.

**Tax fields:** CGST, SGST, and IGST lines for Indian GST compliance; TDS (Tax Deducted at Source) configuration with applicable percentage.

**Payment tracking:** The invoice status progresses through Unpaid → Partially Paid → Paid as payment records are posted. Invoice date and accounting date are tracked separately to support month-end cut-off scenarios.

### Sale Order (SO)

The Sale Order is the primary sales transaction, capturing a customer's order for products including complex vehicle and serialised goods scenarios.

**Route:** `/sale-order` (list), `/sale-order/new` (form).

**Form tabs:** Customer Order (customer lookup, order date, sales executive, reference), Product Detail (line items — product, serial number, batch, warranty details, exchange product), Payment & Finance (payment mode selector, EMI calculator for financed purchases, part-payment tracking), Delivery & Shipping (delivery address, shipping method, expected delivery date).

**Special features:**
- The **EMI calculator** activates when the Finance payment mode is selected; it computes the instalment schedule based on principal, interest rate, and tenure.
- **Exchange product tracking** records the old unit being traded in (model, serial number, condition) against the new unit being sold out.
- The `documentStore` keeps form state reactive across tabs — updating a line item total in the Product Detail tab immediately updates the amount displayed in the Payment & Finance tab without re-render.
- Custom catalogue views are pre-defined in `saleOrderViews.ts` and appear in the ViewSelector on the SO list.

### Sale Allocation Requisition (SAR)

The SAR is an internal request to reserve stock for one or more confirmed Sale Orders before physical allocation is confirmed.

**Route:** `/sale-allocation-requisition` (list), `/sale-allocation-requisition/new` (form).

Each line references a confirmed Sale Order line; the user selects the source warehouse and bin location. The SAR feeds into the Sale Allocation step to ensure stock is ring-fenced.

### Sale Allocation (SA)

The Sale Allocation records the physical assignment of available stock to fulfilment of confirmed Sale Orders.

**Route:** `/sale-allocation` (list), `/sale-allocation/new` (form).

The grid shows each line with columns for Requested Quantity, Currently Available, and Allocated Quantity. Partial allocation is supported — the remainder stays unfulfilled and the document can be returned to for completion when more stock arrives. Quantity counters update in real time as allocation values are entered.

### Sale Invoice (SI)

The Sale Invoice is generated once an allocation is complete and goods are ready for dispatch. It is the billing document issued to the customer.

**Route:** `/sale-invoice` (list), `/sale-invoice/new` (form).

Payment collection tracking records each payment receipt: mode (cash, cheque, bank transfer, UPI), reference number, amount, and date. The invoice status moves through Unpaid → Partially Paid → Paid as payments are recorded. Credit note generation is supported for full or partial returns.

### Delivery

The Delivery document tracks the physical dispatch of goods to the customer after allocation and invoicing.

**Route:** `/delivery` (list), `/delivery/new` (form).

Shipment details include carrier name, vehicle number, LR (Lorry Receipt) number, and expected delivery date. Dispatch confirmation records the actual dispatch date and sets the document to a Dispatched status. Route assignment and multi-stop shipment support allow splitting a delivery across multiple legs.

### Approval Studio

The Approval Studio is a no-code approval workflow builder that lets administrators define conditional, multi-level approval chains for any business document type.

**Route:** `/approval-studio` (list), `/approval-studio/new` (6-step wizard form).

**Wizard steps:**
1. **Basic Details** — workflow name, description, business domain (Purchase / Sales / Service / HR / Finance / General), and the target document type.
2. **Trigger** — define when the workflow fires: the document event (Submit, Update, Cancel) and optional conditions (e.g., Total Amount greater than 10,000; Priority equals High).
3. **Approvers** — add approval levels; each level assigns approvers by role or by specific user; escalation timeout rules are set per level.
4. **Rules** — a DMN-style decision table where condition columns (field comparisons) map to approval level outcomes. Multiple rules can be stacked.
5. **Actions** — configure what happens on approval (auto-notify, status change, create follow-up document, delegate) and on rejection (revert to draft, notify requester, log reason).
6. **Publish** — review summary, activate the workflow.

**Flow types:** Sequential (each approver acts one after another), Parallel (all approvers notified simultaneously; all must act), Hybrid (a mix of sequential and parallel levels).

**Snapshot and rollback:** When a document is rejected, the system rolls it back to the last approved snapshot state, discarding changes made after the last approval.

**Bulk actions on list:** Archive, Duplicate (creates a copy for reuse as a template), Delete, with filters for status, workflow type, owner, and date range.

---

## Section 9 — Form Layout System

All 9 transaction forms share a common layout architecture. Understanding this architecture is essential for predicting how any form behaves.

```
Multi-tab container
  └── Tab  (e.g. Basic Info, Requested Items, Finance, Delivery, Notes)
        └── Section  (logical field grouping within the tab)
              └── FormField  (label + input + inline help tooltip + error message)
                    └── Input type: text, number, email, date picker, select dropdown, textarea
```

### Inline Line Item Grid

Every form that records products or services has an embedded editable grid in the Items or Requested Items tab. The grid behaves like a lightweight spreadsheet:

- **Tab key** moves focus right across cells in the current row.
- **Enter** confirms the current cell edit and moves focus to the first cell of the next row.
- **Tab at the last cell** of any row automatically appends a new empty row and focuses its first cell.
- Each row has a delete (✕) button on the right that removes that line.
- Required cells that are empty on submit are highlighted with a red border and an inline error message.

### Form Actions

Every transaction form has a consistent action bar:

- **Save Draft** — saves the current state immediately without running validation. A green success banner confirms the save. Available on all lifecycle states before final approval.
- **Cancel** — if the form has unsaved changes (dirty state), a `ConfirmationDialog` asks the user to confirm before discarding and returning to the list.
- **Submit / Approve** — triggers full form validation. If all required fields and grid rows are valid, the document lifecycle state advances and a `SuccessSummaryDialog` shows the document number, status, and next-step actions. If validation fails, all errors are highlighted and an error summary lists each issue.
- **Print** — triggers the `useDocumentPrint` hook, which opens the `PrintTemplatePreviewOverlay` with the current form data rendered into the relevant print template for that document type.

### Validation States

- **Field-level**: red border + error message directly below the input.
- **Section-level**: the section header shows a small red incomplete indicator dot so users can spot which section has gaps without scrolling.
- **Form-level**: the Submit button is disabled until all required fields are satisfied; an error count badge appears on the Submit button showing how many issues remain.

---

## Section 10 — Form Layout Builder

**Route:** `/profile/form-layout` (settings list), `/profile/form-layout/edit` (visual editor).

The Form Layout Builder lets a system administrator visually restructure any transaction form — adding, renaming, reordering, and deleting tabs, sections, and fields — without writing code. Changes are published as a form schema that all users see when they open that document type.

### Tab Management

- **Create tab** — opens `CompactFormDialog` to enter the tab name; the tab is appended at the right.
- **Rename** — double-click a tab label to edit it inline.
- **Reorder** — drag a tab left or right to a new position.
- **Delete** — removes the tab; a confirmation dialog warns if the tab has fields.

### Section Management

Within each tab, sections group related fields visually. Sections can be created (with a name), renamed inline, merged (two adjacent sections collapse into one), and deleted.

### Field Reordering and Movement

Fields are rendered as draggable cards within their section. Dragging a field to a new position in the same section reorders it. Dragging it to a different section moves it. Holding a field over a different tab (while the tab bar is visible) transfers it to that tab.

### Fields-per-Row

Each section has a column count selector: 1, 2, or 3 columns per row. At 1 column each field spans the full width; at 3 columns fields share space in thirds. This setting is applied per section, not per individual field.

### Draft → Publish Lifecycle

All changes are saved to a draft schema. The **Publish** button promotes the draft to live; all users will see the new layout on their next form open. A **Reset to template** option reverts the form to the system default schema with a confirmation dialog.

### GridColumnConfigurator

A separate panel for configuring which columns appear in inline line-item grids. This is independent from the form field layout — it specifically controls the editable grid inside the Items tab for each document type. Column visibility, order, and width can be adjusted.

---

## Section 11 — Navigation / Menu Builder

**Route:** `/profile/menu-builder`.

The Menu Builder lets administrators define the entire sidebar navigation structure — groups, modules, sub-items, icons, and routes — and publish it without a code deployment.

### MenuTree (Visual Tree Editor)

The left panel shows the full current menu hierarchy as a recursive tree. Each node shows its icon, label, and route path. Nodes can be:

- **Dragged** up or down to reorder within the same level.
- **Dragged inward** to nest under a parent (increase depth).
- **Dragged outward** to promote to a higher level (decrease depth).

The maximum nesting depth is three levels: Group → Module → Sub-item.

### MenuFormDialog (Add / Edit Items)

Clicking "Add item" or the edit icon on any node opens a compact dialog with fields for: label (the display name), route path (the URL the item navigates to), icon (selected from an icon picker showing the full Lucide icon library), and parent assignment. Validation prevents saving a node without a label or with a route path that is not registered in the application's route configuration.

### Live Preview (MenuPreview)

The right panel renders a pixel-accurate preview of the sidebar as it will appear to users. It updates in real time as items are added, edited, reordered, or deleted — there is no "refresh preview" button needed.

### MenuValidationSummary

Before publishing, a validation summary panel lists any blocking issues: missing labels, unregistered route paths, or duplicate labels at the same nesting level. The Publish button is disabled until all blocking issues are resolved.

### MenuStatusBadge

A badge in the builder header shows the current state of the menu definition: **Draft** (edits not yet published), **Published** (the live menu matches the last published version), or **Needs Attention** (validation errors are blocking publish).

### Publish

Clicking Publish saves the menu definition as the active navigation schema. The `usePublishedMenu` hook in `AppSidebar` reads this schema, so the sidebar updates immediately for all users on their next page navigation.

---

## Section 12 — Theme Builder

**Route:** `/profile/theme-builder`.

The Theme Builder gives administrators full control over the visual identity of the application — brand colours, typography, and light/dark mode — with immediate live preview.

### Built-in Themes

Seven read-only system themes are pre-installed: Default, Excellon, Sky Blue, Forest Green, Sunset Orange, Royal Purple, and Minimal Gray. These cannot be edited but any of them can be **Duplicated** to create an editable custom theme that starts from those colour values.

### Custom Theme Creation

1. Click **New Theme** → enter a name.
2. Configure the **16 colour slots**: Primary, Secondary, Accent, Text Primary, Text Secondary, Background, Surface, Border, Error, Warning, Success, Info, Header Background, Sidebar Background, Button Background, Link.
3. Select a **font** from 8 options: Roboto, Inter, Poppins, Helvetica, Times New Roman, Courier, Georgia, Trebuchet MS.
4. Choose **Light** or **Dark** appearance mode.
5. **Save Draft** → **Publish**.

### Colour Input

Each colour slot has a hex code text field next to a live colour swatch. Typing a valid hex value updates the swatch instantly. Entering an invalid hex format shows an inline validation error and prevents saving.

### Light / Dark Mode

Each theme is associated with one appearance mode. Switching between themes can therefore also switch the application's appearance. The `ThemeProvider` applies the CSS variables from the active theme to the root element; the dark mode variant swaps values under a `[data-appearance='dark']` selector.

### Draft → Publish Lifecycle

Saving creates a draft that is only visible in the builder preview. Publishing promotes the draft to live — the `ThemeProvider` picks up the new CSS variable values and the entire application re-renders with the new theme within the same session.

### Delete and Sort

Custom themes can be deleted (with a confirmation dialog). The theme list is sorted by last-updated date, most recently changed first.

---

## Section 13 — Print Builder

**Routes:** `/profile/print-builder` (template list), `/profile/print-builder/edit` (drag-drop editor).

The Print Builder is a visual block editor for designing the printable document templates that are produced when a user clicks **Print** on any transaction form.

### Block Types

Blocks are dragged from a left-side palette onto the canvas:

| Block | Purpose |
|---|---|
| **Text Block** | Static text or dynamic field tokens (e.g., `{{companyName}}`, `{{documentNumber}}`) |
| **Image Block** | Company logo or other image; accepts URL or file upload |
| **Table Block** | Dynamic table populated from the document's line items; configurable headers, row fields, and footer totals |
| **Divider Block** | Horizontal rule for visual separation |
| **QR Code Block** | Auto-generates a QR code encoding the document reference URL |
| **Barcode Block** | Encodes the document number as a linear barcode |

### Block Styling

Each selected block exposes a properties panel with: font family, size, weight, italic, underline, text colour, text alignment, padding (top/bottom/left/right), and margin. Changes apply to the canvas preview in real time.

### Block Layout

Blocks can be set to full-width (spanning the full page width) or half-width (placed in a two-column layout). Drag-and-drop on the canvas reorders blocks vertically; dragging a half-width block beside another half-width block places them side by side.

### Entity Registry

Each print template is associated with exactly one document entity type (Sale Order, Purchase Order, Purchase Receipt, Purchase Invoice, Delivery, Sale Invoice, Sale Allocation, Sale Allocation Requisition). The association determines which field tokens are available for that template and which document data is passed when the Print button is clicked from a transaction form.

### Print Preview Overlay

The `PrintTemplatePreviewOverlay` is a floating A4-frame panel that appears over the form when Print is clicked. It renders the template with real document data substituted for all field tokens. Multiple copy configurations (e.g., Original + Duplicate) print as separate pages. The overlay can be closed without printing.

### useDocumentPrint Hook

Every transaction Create/Edit form includes the `useDocumentPrint` hook, which manages the open/close state of the preview overlay and provides a `handlePrint()` function wired to the Print button. This decouples print logic from form logic and makes it trivially easy to add print support to any new document type.

---

## Section 14 — Language & Localisation

**Route:** Language selector in the top header bar.

IDMS-UI supports 5 languages with full UI string translation and bidirectional layout support.

### LocalizationProvider

The `LocalizationProvider` component wraps the entire application at the root level. It exposes a `useLocalization()` hook that every component uses to retrieve translated strings. Switching language triggers a context update that re-renders all consuming components — no page reload is required.

### Language Switcher

The language selector in the top header is a dropdown showing the current language and all available options. Selecting a language stores the preference in `localStorage` and triggers the context update.

### Arabic RTL Layout

Arabic is the one language that also changes the layout direction. When Arabic is selected, the root element receives `dir="rtl"`. All layout components are written using CSS logical properties — `padding-inline-start/end`, `border-inline-start/end`, `margin-inline-start/end` — so they automatically mirror directionally without requiring separate RTL stylesheets. The sidebar appears on the right, the header items reverse order, and all form labels and inputs align right-to-left.

---

## Section 15 — Admin Panel & Master Configuration

The admin panel is a separate shell (`AdminShell`) from the main transaction shell. It is accessed via the admin entry point in the navigation and provides a structured, governed interface for configuring every aspect of the system before business operations begin.

### Admin Dashboard

The dashboard is the entry point for all admin configuration. It shows the `AdminSetupAssistant` — a progress card identifying which of the critical setup areas are complete and which still need attention. A hero search lets the admin find any of the 72 masters directly by name. Frequently visited masters are shown as a Quick Access grid and the recently visited list allows resuming incomplete configurations.

### Admin Sidebar (SmartSidebar)

The admin sidebar groups all 72 masters into 12 logical groups — Organisation, Users & Roles, Location & Territory, Business Partners, Products & Catalogue, Warehouse & Inventory, Service Config, Complaints & Cases, Finance & Pricing, Documents & Templates, Process & Checklists, and Workshop Operations. Each group is an expandable accordion section. Favourited masters and recently visited masters are surfaced at the top for fast access.

### Generic Master List (MasterListPage)

The vast majority of the 72 masters use a shared list page that provides: `PageHeader` (with title, group breadcrumb, New action, and help button), a summary metric strip (Total / Active / Inactive counts), a search input, status filter chips, a sortable table with `MoreHorizontal` row menus (Edit / Activate / Deactivate / Delete), an empty state guide, and a wired `HelpDrawer`. All of this is driven by configuration in `adminNavConfig.ts` — no per-master page code is needed.

### Generic Master Form (MasterFormPage)

Create and Edit forms for generic masters use a tabbed layout: Basic Information, Additional Details, Configuration, and Notes. The page title dynamically adapts to the mode — "New [Master]", "Edit [Master]", or "View [Master]". A wired `HelpDrawer` provides contextual guidance for every master.

### Specialised Admin Editors

Five masters have bespoke page implementations because their configuration complexity exceeds what the generic list/form can express:

- **Organisation Master** — a 5-section `AdminConfigShell` form covering Identity, Address, Legal, Branding, and Settings for the legal entity.
- **Numbering & Code Setup** — two subsections (Code Prefix Master and Code Generation Policy list) combined in a single page because they are always configured together.
- **Picklist Master** — a 4-section configuration form (Config, Levels, Values, Mapping) for defining dropdown values used across transaction forms.
- **KYC Setup** — a list view of KYC configurations and a 3-section form (Overview, KYC Grid, Activation Checklist) for defining country-wise proof document requirements per entity type.
- **Code Generation Policy** — a list view with a summary metric strip, advanced filters (Applicable For, Series Type), a clickable-row preview drawer, and a 6-section `AdminConfigShell` form for full policy configuration.

### AdminPageShell

The `AdminPageShell` component enforces the approved page structure for all admin pages. It renders `PageHeader → optional setup health strip → optional summary metric strip → optional toolbar slot → children`. All new admin pages and future admin masters use this shell to guarantee structural consistency. It does not render a global header, sidebar, or HelpDrawer — those are owned by `AdminShell`.

### HelpDrawer & Help Topics

Every admin page wires a `helpTopicId` through `PageHeader` to the global `HelpDrawer`. Clicking "How this works" opens the drawer with topic-specific guidance: a summary, numbered steps, tips, common mistakes, and links to related topics. All help topics are centralised in `helpTopics.ts` and governed by the `check-help-topics` script.

---

## Section 16 — Cross-Cutting UX Patterns

These patterns appear consistently across many parts of the application and define the baseline interaction quality.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl + K | Open command palette |
| Escape | Close any open drawer, dialog, or palette |
| Tab | Move to next cell in inline line-item grid |
| Enter | Confirm inline cell edit; append new row at end of grid |
| Arrow Up / Down | Navigate command palette result list |
| Shift + Click | Extend row selection range in data grid |

### LocalStorage Persistence Strategy

The application persists several categories of UI state to `localStorage` so sessions feel continuous:

| What is persisted | Scope |
|---|---|
| Column preferences (visibility, width, density, sort) | Per module |
| Active catalogue view and custom views | Per module |
| Recently visited admin masters | Shared list; max 10 entries; newest first |
| Favourited admin masters | Shared set of master keys |
| Form draft state (PO, SO) | Per document type via `documentStore` |
| Dismissed dashboard alert banners | Session-scoped only |
| Sidebar collapse state | Global |
| Active language | Global |

### Confirmation Dialogs

Any destructive or irreversible action — delete, cancel a document, discard unsaved form changes, reset to template — is gated by a `ConfirmationDialog`. The dialog states exactly what will be lost and requires an explicit "Yes, [action]" click to proceed. Pressing Escape or clicking outside the dialog cancels it.

### Success Summary Dialog

After any successful document submission or activation, a `SuccessSummaryDialog` appears. It shows the new document reference number, the status it has reached, and optional next-step action buttons (e.g., Print, View in list, Create another). This closes the feedback loop for the user and removes ambiguity about whether the action was completed.

### Toast Notifications

Save Draft, non-critical status updates, and copy-to-clipboard actions provide feedback via brief toast messages at the bottom of the screen. Toasts auto-dismiss after a few seconds and do not block the UI.

### Empty State Guide (EmptyStateGuide)

Every list view, section tab, and configuration panel that can be empty renders an `EmptyStateGuide` instead of a blank space. The guide has a title ("No [entities] found"), a one-to-two sentence explanation of why it is empty and what to do, a primary action button (e.g., "Add proof rule"), and an optional secondary action ("How this works"). A compact variant is used inside section tabs where vertical space is limited.

### Validation Checklist (ValidationChecklist)

Complex multi-section config pages — KYC Setup and Code Generation Policy — include an Activation Checklist section rendered by `ValidationChecklist`. It shows each activation requirement as a list item with a status indicator (ok / error / warn) and a count of met vs. total requirements. Clicking a failed item scrolls to the relevant section. The Activate button is enabled only when all requirements are met.

---

## Section 17 — Component Reference Appendix

Complete index of reusable components. Import paths reference the source layout only; do not use these paths in product documentation outside engineering discussions.

| Component | Location | Purpose | Used on |
|---|---|---|---|
| AppShell | src/components/common/AppShell.tsx | Root layout: top header + sidebar + content slot | All pages |
| AppSidebar | src/components/common/AppSidebar.tsx | Three-level left navigation | All pages |
| AppTopHeader | src/components/common/AppTopHeader.tsx | Global 52px top bar | All pages |
| CommonDataGrid | src/components/common/CommonDataGrid.tsx | Feature-rich sortable table | All catalogue lists |
| CatalogueViewSelector | src/components/common/CatalogueViewSelector.tsx | View switcher dropdown | All catalogue lists |
| CatalogueViewConfigurator | src/components/common/CatalogueViewConfigurator.tsx | Create/edit saved views | All catalogue lists |
| CatalogueFilterDrawer | src/components/common/CatalogueFilterDrawer.tsx | Advanced filter panel | All catalogue lists |
| CatalogueInsightCards | src/components/common/CatalogueInsightCards.tsx | Summary stat metric cards | All catalogue lists |
| DataGridChartDrawer | src/components/common/DataGridChartDrawer.tsx | Live chart from grid data | All catalogue lists |
| DataGridConfigurator | src/components/common/DataGridConfigurator.tsx | Column show/hide/reorder panel | All catalogue lists |
| DocumentPreviewDrawer | src/components/common/DocumentPreviewDrawer.tsx | Right-side document detail panel | All catalogue lists |
| PurchaseRequisitionPreviewDrawer | src/components/common/PurchaseRequisitionPreviewDrawer.tsx | PR-specific preview variant | Purchase Requisition |
| SortableTableHeader | src/components/common/SortableTableHeader.tsx | Sort indicator column header | CommonDataGrid |
| CatalogueSectionLayoutSettings | src/components/common/CatalogueSectionLayoutSettings.tsx | View mode selector (Table / Card / Split) | All catalogue lists |
| FormControls | src/components/common/FormControls.tsx | Input, Select, Textarea, FormField | All transaction forms |
| DatePicker | src/components/common/DatePicker.tsx | Date input with calendar popup | All transaction forms |
| AppDialog | src/components/common/AppDialog.tsx | Centred modal wrapper | Confirmation, success dialogs |
| AppDrawer | src/components/common/AppDrawer.tsx | Slide-out panel | Filters, help, details |
| SideDrawer | src/components/common/SideDrawer.tsx | Right-sliding drawer | Preview, chart, help |
| ConfirmationDialog | src/components/common/ConfirmationDialog.tsx | Confirm / Cancel destructive action | Delete, cancel document |
| SuccessSummaryDialog | src/components/common/SuccessSummaryDialog.tsx | Success feedback with document reference | Post-submit on all forms |
| CancelDocumentDialog | src/components/common/CancelDocumentDialog.tsx | Cancel with reason capture | All transaction forms |
| CompactFormDialog | src/components/common/CompactFormDialog.tsx | Quick single-field inline dialog | Form Layout Builder |
| GlobalSearchPanel | src/components/common/GlobalSearchPanel.tsx | Cross-module search results overlay | Global search trigger |
| AmountBreakdownDrawer | src/components/common/AmountBreakdownDrawer.tsx | Financial breakdown side panel | Transaction forms and preview |
| StatusBadge | src/components/common/StatusBadge.tsx | Colour-coded lifecycle status pill | All lists and forms |
| GuidedTour | src/components/common/GuidedTour.tsx | Step-by-step popover tour | Purchase Requisition (first visit) |
| TourInvitePopup | src/components/common/TourInvitePopup.tsx | Tour invite banner | Purchase Requisition |
| MenuBuilder/* | src/components/common/MenuBuilder/ | Full menu tree editor (7 sub-components) | /profile/menu-builder |
| GridColumnConfigurator | src/components/common/GridColumnConfigurator.tsx | Inline grid column management | Form Layout Builder |
| FormLayoutPreviewOverlay | src/components/common/FormLayoutPreviewOverlay.tsx | Form layout live preview panel | Form Layout Builder |
| PageHeader | src/experience/components/PageHeader/ | Page title, breadcrumb, actions, help entry | All admin and builder pages |
| AdminPageShell | src/experience/components/AdminPageShell/ | Standard admin page layout wrapper | All admin list and specialised pages |
| GlobalHeader | src/experience/components/GlobalHeader/ | Legacy inner admin bar (removed from AdminShell) | — |
| SmartSidebar | src/experience/components/SmartSidebar/ | Collapsible grouped admin sidebar | Admin shell |
| CommandPalette | src/experience/components/CommandPalette/ | Ctrl+K command launcher | Admin shell |
| HelpDrawer | src/experience/components/HelpDrawer/ | Contextual help slide-in panel | Admin shell and transaction forms |
| FieldHelpPopover | src/experience/components/FieldHelpPopover/ | Inline field-level help popover | Admin master forms |
| AdminConfigShell | src/experience/components/AdminConfigShell/ | Two-pane layout for multi-section config | Organisation, Numbering, Picklist, KYC, CGP |
| AdminSetupAssistant | src/experience/components/AdminSetupAssistant/ | First-run setup progress card | Admin Dashboard |
| EmptyStateGuide | src/experience/components/EmptyStateGuide/ | Contextual empty state guidance | Admin and transaction lists |
| ValidationChecklist | src/experience/components/ValidationChecklist/ | Activation requirement checklist | KYC Setup, Code Generation Policy |
| PrintTemplateDocument | src/print-builder/PrintTemplateDocument.tsx | Block-based print renderer | Print Builder editor and overlay |
| PrintTemplatePreviewOverlay | src/print-builder/PrintTemplatePreviewOverlay.tsx | Floating A4-frame print preview | All transaction Create forms |
| ThemeProvider | src/theme/ThemeProvider.tsx | CSS variable injection from active theme | Root — wraps entire application |
