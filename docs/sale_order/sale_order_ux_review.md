# Sale Order UX Review

This review is based on the current repository implementation of the Sale Order experience, including the catalogue view, create/edit page, line-item grid, amount summary drawer, preview drawer, cancel flow, and success/share/print behavior. It is a static UX review based on code and available screenshots, not a live runtime audit.

Relevant implementation evidence reviewed:
- `src/pages/sale-order/CreateSaleOrder.tsx`
- `src/pages/sale-order/saleorderlist.tsx`
- `src/pages/sale-order/saleOrderData.ts`
- `src/components/common/AmountBreakdownDrawer.tsx`
- `src/components/common/DocumentPreviewDrawer.tsx`
- `src/components/common/CancelDocumentDialog.tsx`
- `src/components/common/SuccessSummaryDialog.tsx`
- `src/components/common/StatusBadge.tsx`
- `src/components/common/CommonDataGrid.tsx`

Available screenshots referenced in this review:
- ![Sale Order - Catalogue View Selector](./screenshots/catalogue_view_selector_1777354444764.png)
- ![Sale Order - Filter Drawer](./screenshots/filter_drawer_1777354618843.png)
- ![Sale Order - Column Header Menu](./screenshots/column_header_menu_1777354599413.png)
- ![Sale Order - Preview Drawer](./screenshots/document_preview_drawer_1777354708412.png)
- ![Sale Order - Cancel Dialog](./screenshots/cancel_document_dialog_initial_1777356471445.png)
- ![Sale Order - Cancel Dialog With Reason](./screenshots/cancel_document_dialog_reason_selected_v2_1777356508321.png)
- ![Sale Order - Success Summary Dialog](./screenshots/success_summary_dialog_1777356706412.png)

Missing screenshot references:
- [Insert screenshot of Sale Order - Create Screen here]
- [Insert screenshot of Sale Order - Product Detail Grid here]
- [Insert screenshot of Sale Order - Amount Summary Drawer here]
- [Insert screenshot of Sale Order - Payment and Finance Tab here]
- [Insert screenshot of Sale Order - Delivery and Shipping Tab here]

## A. UX summary

The current Sale Order experience is functionally rich and operationally aware, but it is stronger as an internal data-entry tool than as a polished business document workflow. For a sales executive, the page supports detailed order capture and protects against several common mistakes. For a manager or customer-facing review, however, the experience is weaker because the current preview and print path is generic rather than document-oriented. The overall UX is usable, but it needs better information hierarchy, a cleaner review state, and a more intentional print/PDF layout to feel truly business-ready.

## B. What works well

- The experience is structured into clear functional tabs:
  - `Customer & Order`
  - `Product detail`
  - `Payment and Finance`
  - `Delivery and Shipping`
- Important operational validations already exist and reduce avoidable mistakes:
  - requested delivery date must be future
  - valid till date must be current/future and greater than requested delivery date where applicable
  - promised delivery date must be current/future
  - discount percent cannot reach 100
  - discount amount cannot reach or exceed the base amount
  - amount-related fields sanitize alphabetic and unwanted character input
- Changing or removing the customer after downstream data entry triggers a confirmation dialog. This is very strong workflow protection for sales users.
- The line grid captures downstream operational data such as allocation, invoicing, delivery, and returns. That is useful for operations and accounting users who need lifecycle visibility.
- The amount summary is grouped and audit-friendly in concept. Separate discount, charges, and tax sections are a good foundation for trust and explainability.
- The catalogue includes search, filters, list/grid modes, row actions, preview, and cancellation flows. This is a good operational baseline.
- The cancel dialog requires a reason before cancellation. That improves process discipline.
- Status badges are reused across screens, which supports consistency.

## C. Major UX issues

1. The create page is optimized for data capture, but not for fast review. Managers and customers need a clearer read-only order summary than the current generic preview drawer.
2. The product grid is too dense for primary order entry. It mixes entry fields, operational quantity tracking, fulfilment data, and inventory metadata in one place, which increases scanning effort and horizontal pressure.
3. The customer selection area is lightweight to the point of losing context after selection. Once a customer is selected, the page should still provide a compact, anchored customer identity summary somewhere nearby.
4. The most important financial outcome, such as the final payable amount and total commercial effect, is not prominent enough on the main create screen. It is available through the amount drawer, but not visually anchored in the main workflow.
5. The current print/share flow appears to depend on a generic `window.print()` call from the success dialog rather than a dedicated Sale Order print layout. That is not sufficient for a customer-facing or audit-grade document.
6. The preview drawer is useful as a quick glance tool, but it is not a proper business document review surface. It lacks a strong document hierarchy, printable structure, and approval-facing emphasis.
7. The catalogue includes columns such as `Branch` and `Created By` that currently render as `-`. Placeholder data in high-value columns reduces confidence and makes the list feel unfinished.
8. Approval workflow is only partially visible through statuses such as `Pending Approval`, `Approved`, `Rejected`, and `Cancelled`. The screen does not yet clearly communicate next-step actions for a manager or reviewer.

## D. Detailed improvement suggestions

### 1. Header and document identity

- Keep document number and document date under the title, but treat them as a compact metadata row rather than plain subtext. They should read like formal document attributes.
- Add status visibility directly in the create header, not only in list views and preview moments.
- Keep `Save` as the current primary action for create mode, but introduce a clearer review or next-step action once the document is sufficiently complete.
- Reduce visual competition in the header. The header should prioritize:
  - document title
  - document number/date
  - status
  - primary action

### 2. Customer and order metadata

- The current customer search works as a picker, but after selection the page should preserve a compact customer summary. The previously removed large customer card was too heavy, but a small summary strip would be helpful.
- The `Customer & Order` tab is logically placed first, but the layout can be tightened so the customer field and order details feel like one coherent opening step rather than two visually separate mini-stages.
- `Place of Supply` is marked required and is important for tax handling. It should be grouped visually with tax-relevant metadata such as delivery commitments, not left to feel like a standard dropdown.
- `Priority` is currently present, but it is visually just another field. If it affects service levels or approvals, it should have stronger visual semantics.

### 3. Product grid

- The product grid needs progressive disclosure. A sales executive entering products does not need all downstream operational quantity fields in the same first-view grid.
- Recommended approach:
  - primary visible columns for entry
  - secondary columns for operational review
  - advanced fulfilment and inventory columns hidden behind expand, overflow, or column-set switch
- Better primary entry set:
  - Product Code
  - Product Name
  - UOM
  - Requested Date
  - Priority
  - Warehouse
  - Location/bin
  - Rate
  - Order Qty
  - Discount %
  - Discount Amount
  - Taxable Amount
  - Tax
  - Total Amount
  - Remark
- Move or collapse these into an advanced operational group:
  - Cancelled Qty
  - Allocated Qty
  - Pending Allocation Qty
  - Invoiced Qty
  - Pending Invoice Qty
  - Delivery Qty
  - Pending Delivery Qty
  - Returned Qty
  - Serial Number
  - Batch/Lot Number
  - Manufacturing Date
  - Expiry Date
- `Product Name` and `HSN/SAC` are readonly, but they should look intentionally readonly rather than merely disabled. This was partially improved in CSS, but the visual distinction should still communicate “system-filled, trustworthy, non-editable.”
- Long item descriptions are not visibly addressed in the current implementation. The row design should support wrap or controlled truncation with a hover/expand pattern.
- The empty state for the grid should be more descriptive than just a count and add button. A first-line helper would reduce hesitation for new users.

### 4. Payment and finance

- `Payment and Finance` is a useful operational split, but the page should visually communicate when finance fields become active because of payment mode.
- `Balance Amount` logic for finance mode is strong from a business-rule perspective. It should be explained inline or via subtle help text because it is system-calculated.
- `Insurance Details` sits in the same tab, which is acceptable, but it can feel like a different business topic. A subheading with a clearer business purpose would help.
- `Policy Date` and `Remarks` are useful additions, but `Remarks` should be named more specifically if it is insurance-specific, such as `Insurance Remarks`, to avoid ambiguity with general document notes.

### 5. Delivery and shipping

- This tab is functionally correct, but it risks feeling like a second-tier section because it is separated from the delivery dates already collected in `Customer & Order`.
- Consider a clearer distinction between:
  - commercial commitment dates
  - physical delivery execution details
- `Delivery Address` and `Shipping Address` are high-impact fields. If both exist, the UI should make it obvious whether they can differ and when users should use each one.

### 6. Amount summary and totals

- The grouped summary drawer is conceptually good, but the most important total should also be visible on the main screen during order creation.
- `Net Payable Amount` should be visually dominant and easier to find without opening a secondary surface.
- The formula-oriented labels help auditability, but they should be paired with plain-language labels so business users do not need to mentally decode them.
- `Advance Paid` is included in the final formula, which is useful, but the hierarchy between line-level values, order-level values, and final customer-payable value should be visually stronger.
- Show a persistent compact total bar or sticky order total panel during editing so users do not lose financial context while scrolling the product grid.

### 7. Status, review, cancel, share, and print flows

- The list page communicates document status reasonably well through status badges and analytics cards.
- The create page lacks a dedicated review state for manager or approver use. It is primarily a data-entry form.
- The preview drawer is not yet strong enough as a review surface. It should be more document-like if it is expected to support approval or final commercial review.
- The success dialog is useful as immediate feedback, but it should not be the main doorway to print/share. Those are document-level actions and should exist in a stable post-save review context too.
- The cancel flow is solid and appropriately cautious. That pattern can be reused for other destructive or irreversible actions.

### 8. Catalogue discoverability

- The catalogue is feature-complete enough for internal users, but it is becoming dense:
  - many columns
  - grid and list modes
  - analytics cards
  - filter drawer
  - preview and action menus
- The selected column set is operationally detailed, but not all columns deserve equal prominence.
- Consider a default “business summary” column set and a secondary “operations detail” column set.
- `Branch` and `Created By` should either be populated properly or removed until supported.
- The list supports good filtering, but a saved view or quick filter pattern would improve frequent usage.

## E. Suggested improved layout

Ideal screen layout order for the Sale Order create/review experience:

1. **Document header**
   - Sale Order title
   - document number
   - document date
   - status badge
   - primary and secondary actions
2. **Customer and commercial summary strip**
   - selected customer
   - sales executive
   - order source
   - place of supply
   - priority
3. **Delivery commitment strip**
   - requested delivery date
   - promised delivery date
   - valid till date
4. **Product entry and item grid**
   - compact entry-first columns
   - advanced operational columns hidden by default
5. **Order-level commercial adjustments**
   - order discount
   - charges
   - tax summary
6. **Payment and finance**
   - payment terms
   - finance values
   - insurance details when relevant
7. **Delivery and shipping**
   - physical fulfilment instructions
8. **Review summary panel**
   - subtotal
   - discount
   - taxable amount
   - tax
   - charges
   - advance paid
   - final payable amount
9. **Notes, terms, and approval/audit area**
   - internal remarks
   - customer-facing notes
   - approval history or reviewer notes, if applicable

Ideal printable/PDF layout order:

1. Company branding and contact block
2. Sale Order title and status
3. Document number, document date, validity date
4. Customer billing and shipping details
5. Order and salesperson metadata
6. Item table
7. Totals and tax summary
8. Payment and delivery terms
9. Notes and terms and conditions
10. Signature or approval block

## F. Field-level recommendations

| Field/Section | Current UX issue | Recommended improvement | Priority |
|---|---|---|---|
| Header actions | `Save` is clear, but the workflow after save is less clear for submit/review/approve scenarios | Add explicit next-step actions by document state, such as `Save Draft`, `Review`, `Submit for Approval`, `Print`, `Share` | High |
| Document status on create page | Status is not strongly visible during form entry | Show a visible status badge in the header | High |
| Select Customer | Customer can be selected, but ongoing customer context becomes weak after selection | Add a compact customer summary strip under or beside the selector | High |
| Order Source | Reads as standard metadata, but importance depends on downstream reporting | Keep in first tab, but group with sales and channel fields visually | Medium |
| Sales Executive | Important for accountability but visually understated | Keep near customer metadata and show in review/print summary | Medium |
| Requested Delivery Date | Validation exists, but importance is not strongly emphasized | Highlight as a commitment field and visually pair with promised delivery date | High |
| Valid Till Date | Relationship to requested delivery date may not be obvious | Add helper text or subtle dependency cue | Medium |
| Place of Supply | Critical for tax, but visually treated as a regular dropdown | Group with tax/commercial metadata | High |
| Product grid overall | Too many columns for first-pass entry | Split into entry columns and advanced operational columns | High |
| Product Name / HSN/SAC | Readonly fields still behave visually like form inputs | Use a clearer readonly presentation pattern | Medium |
| Warehouse / Location/bin | Useful but add complexity early | Keep visible only if inventory-controlled products require it | Medium |
| Serial / Batch / Mfg / Expiry | Heavy operational detail in core entry grid | Move to advanced or conditional view | High |
| Cancelled / Allocated / Invoiced / Delivery / Returned quantities | Valuable for tracking, but poor fit for primary sales-entry mode | Hide by default in create mode; show in operational review mode | High |
| Discount % / Discount Amount | Dual-entry behavior is useful, but users need clearer cues about sync | Add inline helper or auto-calc indicator | Medium |
| Taxation Column | Label is not business-friendly | Rename to a clearer label such as `Tax` or `Tax Category`, based on actual business meaning | High |
| Remark at line level | Singular label feels generic | Rename to `Line Remark` or `Item Remark` | Low |
| Payment Remarks | Too generic | Rename to `Payment Remarks` only if truly payment-specific; otherwise separate document notes elsewhere | Medium |
| Balance Amount | System-derived but may look editable in concept | Add inline “Auto-calculated” treatment and explanation when finance mode applies | Medium |
| Insurance Remarks | Current field name is only `Remarks` in that section | Rename to `Insurance Remarks` | Medium |
| Delivery Address / Shipping Address | Relationship may be unclear | Add a visual cue or checkbox for “same as delivery/billing” if supported later | Medium |
| Amount summary drawer | Important totals are hidden behind a secondary surface | Add a persistent compact on-page total summary | High |
| Branch in catalogue | Currently shows `-` | Populate correctly or remove from default list | High |
| Created By in catalogue | Currently shows `-` | Populate correctly or remove from default list | High |

## G. Action button recommendations

### Create screen

- **Primary**
  - `Save Draft` while document is still being prepared
  - `Submit for Approval` once minimum required data is complete, if approval exists
- **Secondary**
  - `Review`
  - `View Amount Summary`
  - `Print`
  - `Share`
- **Destructive**
  - `Discard`

### Manager review / approval state

- **Primary**
  - `Approve`
- **Secondary**
  - `Reject`
  - `Send Back for Correction`
  - `View Full Summary`
  - `Download PDF`
- **Destructive**
  - `Cancel Order`, only when policy allows

### Catalogue row actions

- **Primary row actions**
  - `View`
  - `Edit`
- **Secondary row actions**
  - `Print`
  - `Share`
  - `Duplicate`
- **Destructive**
  - `Cancel`

### Success / post-save moments

- **Primary**
  - `View Sale Order`
- **Secondary**
  - `Print`
  - `Share`
  - `Create Another`

## H. Print/PDF recommendations

- The current code suggests a generic browser print approach from the success flow. That is not enough for a professional Sale Order output.
- A proper print/PDF version should include:
  - company logo and address
  - customer billing and shipping blocks
  - document number and order date
  - validity date
  - salesperson name
  - order status, only if appropriate for customer-facing output
  - clean item table with repeated header on page breaks
  - summary totals anchored at the end of the item table
  - tax breakup
  - payment terms
  - delivery terms
  - notes and terms
  - signature or approval blocks
- Multi-page behavior should ensure:
  - table headers repeat on new pages
  - totals do not split awkwardly
  - footer contains page number and company contact details
  - notes and signatures stay together where possible
- Customer-facing PDFs should avoid showing internal-only operational columns such as:
  - allocation status quantities
  - internal finance fields not relevant to the customer
  - internal cancellation or workflow metadata

## I. UX score

**6.5 / 10**

Why this score:
- Strong points:
  - meaningful validations
  - detailed operational coverage
  - useful search, filter, preview, cancel, and success flows
  - good reusable component foundation
- What holds it back:
  - create screen is dense and better for operators than for reviewers
  - no strong dedicated business-document review mode
  - print/share path is not mature enough for external-facing output
  - item grid needs clearer prioritization and less first-view complexity
  - key commercial totals are not prominent enough in the main editing workflow

## J. Final checklist

Use this checklist before releasing the Sale Order experience:

| Checklist Item | Status |
|---|---|
| Document number, date, and status are clearly visible | Needs review |
| Selected customer remains visible after selection | Needs review |
| Most important commercial fields are grouped together | Needs review |
| Requested, promised, and validity dates are easy to understand | Partly done |
| Product grid entry columns are not overloaded | Needs review |
| Operational quantity columns are shown only where useful | Needs review |
| Readonly fields are visually distinct and trustworthy | Partly done |
| Discount and tax behavior is understandable to business users | Needs review |
| Final payable amount is visible without opening a secondary drawer | Needs review |
| Payment and finance logic is clearly explained | Needs review |
| Delivery and shipping fields are easy to differentiate | Needs review |
| Catalogue columns show meaningful data, not placeholder dashes | Needs review |
| Status badges are consistent across list, preview, and create flows | Partly done |
| Cancel flow requires and explains reason appropriately | Done |
| Manager review actions are visible and workflow-specific | Needs confirmation from project team. |
| Print/PDF output has a dedicated document layout | Needs review |
| Customer-facing output excludes internal-only fields | Needs review |
| Accessibility is validated for keyboard and color-independent meaning | Needs review |
| Tablet and print readability are checked | Needs review |
| Internal notes and customer-facing notes are clearly separated | Needs review |

## Additional reviewer notes by persona

### 1. Sales executive creating a new order

- The current form supports real work, but the product grid asks the sales user to carry too much operational context too early.
- The user is protected against some important date and discount mistakes.
- The user still needs a stronger sense of “where am I in the order” and “what is the current commercial total.”

### 2. Manager reviewing or approving the order

- The current system shows status values and offers preview, but it does not yet feel like a manager-first review experience.
- A manager needs:
  - stronger summary hierarchy
  - customer and salesperson context up front
  - clearer deviations and risk indicators
  - dedicated approval/reject actions where applicable

### 3. Operations/accounting user checking accuracy

- This persona benefits the most from the current detail-rich model.
- Allocation, invoicing, delivery, return, payment, and finance data are helpful.
- The risk is not lack of detail, but poor prioritization of detail. Operations users will manage it, but sales users will feel the weight of it.

### 4. Customer receiving the printed or PDF version

- The current implementation does not yet demonstrate a strong customer-facing document output.
- A customer should receive a clean Sale Order layout focused on:
  - who the order is for
  - what was ordered
  - when it will be delivered
  - how much is payable
  - tax breakup
  - terms and contact details
- Internal fields and operational tracking columns should not appear in that output.
