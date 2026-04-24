# Purchase Requisition (PR)

**Module:** Procurement  
**Transaction:** Purchase Requisition  
**Document Type:** Functional Requirement Document  
**Version:** 1.0  
**Status:** Draft  
**Prepared by:** Ankit Gupta  
**Created on:** 06 April 2026

---

## 1. What is Purchase Requisition?

Purchase Requisition (PR) is an internal procurement transaction used to record and control business demand for required items before any supplier commitment is made through Purchase Order creation. A PR captures demand at header and line level so the organization can review, track, amend, cancel, partially order, and progressively convert eligible quantities into downstream Purchase Orders under controlled business rules.

A PR is not:
- a supplier-facing order
- a receipt or proof of fulfilment
- an invoice or payment claim

Its purpose is to establish a controlled and auditable source of internal demand before downstream ordering begins.

## 2. Why is Purchase Requisition used?

Purchase Requisition is used to formalize internal demand in a controlled pre-order stage before any supplier commitment is made. It creates an auditable demand record that supports quantity tracking, controlled amendment and cancellation, lifecycle visibility, and partial or full downstream conversion into Purchase Orders.

## 3. PR Lifecycle Overview

> Lifecycle diagram exists in the source PDF. Core lifecycle states are: **Open**, **Expired**, **Cancelled**, **Partially Ordered**, **Fully Ordered** (system-transient/history only), and **Closed**.

---

## 4. Scope

| Area | Included in Current Scope | Boundary Note |
|---|---|---|
| PR Creation | Create PR with header and line details | Internal demand capture only |
| Header Management | Maintain eligible header fields before ordering starts | Editable only in allowed pre-order state |
| Line Management | Add, edit, and delete eligible lines before ordering starts | Subject to editability, soft-delete, and cancellation-history rules |
| Quantity Control | Maintain Requested, Ordered, Cancelled, and Pending quantities | Ordered Qty is system-derived from PR-to-PO linkage only |
| Amendment Control | Amend eligible PR data before ordering starts | No amendment once ordering begins |
| Cancellation Control | Support document cancellation, line cancellation, and cancellation correction | Controlled, reason-based, pre-order rules apply |
| Lifecycle Control | Support Open, Expired, Cancelled, Partially Ordered, and Closed lifecycle behavior | Fully Ordered is transient/history-only |
| PO Conversion Linkage | Support PR-to-PO ordered quantity linkage and pending quantity consumption | Only limited downstream dependency is covered here |
| Attachments | Add and manage attachments while PR is editable | View/download may remain available later, subject to access control |
| Auditability | Capture history for creation, amendment, cancellation, correction, conversion, closure, and attachment changes | Detailed retention/security rules may depend on platform capability |
| Exception Handling | Cover major transaction exceptions and recovery paths relevant to PR lifecycle | Does not redesign external modules |

## 5. Out of Scope

| Area | Classification | Scope Note |
|---|---|---|
| Approval workflow | [OUT OF CURRENT SCOPE] | Approval routing, approval states, rejection, and approval rework are not designed in this FRD |
| Rejection | [OUT OF CURRENT SCOPE] | Not part of current PR lifecycle design |
| Notifications, Alerts & Escalations | [OUT OF CURRENT SCOPE] | Triggering and dispatch behavior are not designed here |
| Dashboards & Analytics | [OUT OF CURRENT SCOPE] | Reporting and analytical outputs are excluded |
| Technical RBAC design | [EXTERNAL MODULE] | This FRD defines business ownership only, not technical permission mapping |
| Tax Module | [OUT OF CURRENT SCOPE] | Tax behavior belongs to a separate tax module and is not validated inside PR |
| Price Configuration | [OUT OF CURRENT SCOPE] | PR is not a pricing or financial-calculation document in current scope |
| Receipt processing | [OUT OF CURRENT SCOPE] | Receipt proof and fulfilment handling are not part of PR |
| Invoice & payment behavior | [OUT OF CURRENT SCOPE] | Invoice and payment claim handling are excluded |
| Warehouse & location handling | [OUT OF CURRENT SCOPE] | No warehouse or location fields are designed in PR |
| Full Purchase Order processing | [EXTERNAL MODULE] | Only PR-to-PO quantity linkage is referenced here |
| PR copy & clone creation | [OUT OF CURRENT SCOPE] | Copy-based PR creation is not supported in current design |
| System-assisted replacement PR linkage | [OUT OF CURRENT SCOPE] | Revised demand after ordering starts requires manual new PR creation |
| Print & export design | [EXTERNAL MODULE] | Choose one based on platform responsibility |

---

## 6. Core Principles & Non-Negotiables

| Principle | Meaning / Intent | Design Implication |
|---|---|---|
| PR vs PO Separation | Purchase Requisition is an internal demand document only | PR must not behave as supplier commitment |
| Receipt Separation | PR is not proof of receipt or fulfilment | Receipt behavior must not be designed in PR |
| Invoice & Payment Separation | PR is not an invoice, bill, or payment claim | Financial claim behavior is excluded from PR |
| Supplier Informational Only | Supplier on PR, if captured, is optional and informational in current scope | PR supplier must not create supplier commitment and may be changed during PO creation |
| Ordered Quantity Derivation | Ordered Qty is system-derived from valid PR-to-PO linkage only | Manual Ordered Qty entry is not allowed |
| Quantity Integrity | Requested, Ordered, Cancelled, and Pending quantities must remain internally consistent | Quantity formulas and controls must be system-enforced |
| Status Control | Document and line statuses are system-derived from actions and quantities | Status must not be user-editable |
| Amendment Governance | Amendment is allowed only in eligible pre-order state | Once ordering starts, normal amendment is blocked |
| Edit Freeze After Ordering | Consumed demand trail must not be mutated through normal edit actions | Header/line edit, delete, cancellation correction, and attachment maintenance are blocked once ordering begins |
| Controlled Cancellation | Document and line cancellation must be reason-based and auditable | Cancellation must follow controlled action rules |
| Soft Delete with Audit Preservation | Eligible line deletion must preserve history and avoid destructive loss | Line delete must be soft delete only |
| Numbering Control | Document identity is system-generated through controlled code generation | User-entered PR number is not allowed |
| Master Data Dependence | PR behavior depends on valid and active reference data | Inactive/invalid master data must restrict selection or conversion where applicable |
| Auditability | Creation, amendment, cancellation, correction, conversion, closure, and key exceptions must remain traceable | History must be retained and reviewable |
| Privacy by Design | Only necessary data should be visible or searchable in PR | Avoid unnecessary exposure of personal or sensitive supplier data |
| Configuration over Hardcoding | Configurable behavior should be preferred where business variation is expected | Search thresholds, attachment rules, and similar controls should be configurable |

---

## 7. Terminology Control

| Term | Meaning |
|---|---|
| Amendment | Pre-order change to eligible editable PR data while the PR remains in allowed editable state |
| Document Cancel | Controlled cancellation of the full Purchase Requisition before ordering starts |
| Line Cancel | Controlled cancellation of some or all remaining pending quantity on an eligible PR line |
| Cancellation Correction | Controlled pre-order reduction of previously cancelled quantity on a line, with mandatory reason |
| Manual Close | Controlled terminal closure of a PR after ordering and cancellation outcomes are fully resolved, and total pending quantity is zero |
| PO Conversion | Consumption of eligible PR pending quantity into one or more Purchase Orders through downstream linkage |
| Requested Qty | Quantity originally requested on the PR line |
| Ordered Qty | Quantity already consumed through valid PR-to-PO conversion linkage |
| Cancelled Qty | Quantity removed from further conversion eligibility through controlled cancellation |
| Pending Qty | Remaining quantity eligible for future conversion, calculated as Requested Qty - Ordered Qty - Cancelled Qty |
| Editable State | In current scope: Status = Open and Total Ordered Qty = 0, subject to additional line restrictions |
| Eligible for Conversion | PR or PR line condition in which downstream PO conversion is allowed based on status and available pending quantity |
| Open | Active pre-order PR state in which demand exists, and no ordering has yet started |
| Partially Ordered | PR or line state in which some quantity has been ordered but pending or cancelled balance still affects lifecycle outcome |
| Cancelled | Terminal state in which the full document or full line quantity has been cancelled from further conversion |
| Expired | Terminal pre-order PR state reached when Valid Till Date is crossed before any ordering starts |
| Closed | Terminal PR state reached after full lifecycle resolution through auto-close or manual close |
| Fully Ordered | Transitional/history-only document condition reached when all remaining demand is ordered with no cancellation remainder; it auto-closes immediately to Closed |
| Deleted Line | Soft-deleted PR line excluded from active totals and conversion logic but retained in history and audit |
| Non-deleted Line | Any PR line that is not soft deleted |
| Soft Delete | Non-destructive line removal model in which the line is excluded from active behavior but retained for traceability |
| Audit Trail | Recorded evidence of key PR events such as create, amend, cancel, correction, conversion, close, and attachment changes |

---

## 8. Role Matrix

| Actor | Actor Type | Business Responsibility | PR Interaction Type | Notes & Boundary |
|---|---|---|---|---|
| Requester | Direct business user | Raises internal demand and maintains eligible own demand before ordering starts | Direct PR create and pre-order maintenance | Own-demand scope should be governed by access rules outside this FRD |
| Purchase Executive | Operational procurement user | Maintains eligible PRs, manages shared-demand actions, performs cancellation and operational follow-up where authorized | Direct operational PR user | May act beyond requester-owned records based on external entitlement design |
| Purchase Manager | Supervisory | Oversees lifecycle exceptions, manual close governance, and operational control compliance | Oversight and exception-handling user | Not required for routine PR creation |
| PO Conversion User | Downstream transaction user | Consumes eligible PR pending quantities during PO creation | Downstream consumer of PR quantities | Uses PR as source demand; does not redefine PR ownership |
| Admin | Configuration | Maintains numbering, picklists, attachment rules, configuration parameters, and relevant transaction setup | Indirect supporting actor | Not a routine PR transaction operator |
| Master Data Steward | Data governance user | Maintains Product, UOM mapping, Supplier, Department, and Priority master data required by PR | Indirect supporting actor | Critical to transaction quality |
| Auditor | Audit actor | Reviews PR history, cancellation evidence, closure evidence, corrections, and traceability | Oversight / review | Read-oriented control role |

## 8.1 Role-Action Ownership Matrix

| Action | Requester | Purchase Executive | Purchase Manager | PO Conversion User | Admin | Auditor | Notes |
|---|---|---|---|---|---|---|---|
| Create PR | Primary | Secondary | Secondary | No | No | No | Subject to external entitlement model |
| View PR | Own, as allowed | Primary | Primary | Primary | Support | Review | Includes active and terminal states |
| Edit Header | Own, as allowed | Primary | Review & exceptional | No | No | No | Only in eligible editable state |
| Edit Line | Own, as allowed | Primary | Review & exceptional | No | No | No | Only in eligible editable state and line state |
| Add Line | Own, as allowed | Primary | Review & exceptional | No | No | No | Allowed only before ordering starts |
| Delete Line | Own, as allowed | Primary | Review & exceptional | No | No | No | Soft delete + history rules apply |
| Cancel Document | Own, as allowed | Primary | Review & exceptional | No | No | No | Pre-order only; reason mandatory |
| Cancel Line Quantity | Own, as allowed | Primary | Review & exceptional | No | No | No | Pending quantity and reason rules apply |
| Cancellation Correction | Own, as allowed | Primary | Review & exceptional | No | No | No | Pre-order only; blocked after ordering starts |
| Manual Close | No | Primary | Review & exceptional | No | No | No | Allowed only when pending conditions are satisfied |
| Convert to PO | No | Secondary | Review & exceptional | Primary | No | No | Downstream PO action |
| Add & Remove Attachment | Own, as allowed | Primary | Review & exceptional | No | No | No | Allowed only while PR remains editable |
| Audit | Own, as allowed | Primary | Primary | Primary | Support | Primary | Subject to visibility rules |

---

## 9. Dependency & Data Readiness

### 9.1 External Dependencies

| Dependency | Classification | Why PR Depends on It | Impact if Missing or Broken | Scope Boundary |
|---|---|---|---|---|
| RBAC | [EXTERNAL MODULE] | Controls who can view and perform PR actions | Users may see incorrect access or action availability | Business ownership only, not technical permissions |
| PO Module & PR-to-PO Integration | [NEEDS INTEGRATION] | Updates Ordered Qty, consumes Pending Qty, supports linked PO traceability | Ordered/Pending quantities and lifecycle outcomes become unreliable | Only limited PR-to-PO linkage is in scope here |
| Business Date & Scheduler Service | [EXTERNAL MODULE] | Required for Valid Till Date expiry evaluation and date-based status movement | Expiry may not trigger correctly | PR defines expiry rule, not scheduler design |
| Attachment | [EXTERNAL MODULE] | Required to store, retrieve, and manage PR attachments | Upload, view, or retrieval failures may affect usability | PR defines business rules only |
| Audit | [EXTERNAL MODULE] | Required to retain change history and action evidence | Audit trail may be incomplete or unavailable | PR defines audit expectations only |
| Document Code Generation | Configuration Dependency | Required to generate PR number on first successful save | PR creation must be blocked if number generation fails | System-controlled identity generation only |
| Document Type Configuration | Configuration Dependency | Controls PR document identity, type/template behavior, and related transaction setup | PR may fail to render or save correctly if configuration is missing | Functional behavior depends on valid setup |

### 9.2 Master Dependencies

| Master Name | Used for | Applies To |
|---|---|---|
| Organisation | Access | Document |
| Branch | Access | Document |
| Employee | Requester & Created By identity | Header, Audit |
| Identity Master | Roles & Access | Roles & Access |
| Product Master | Line-item selection | Lines |
| Product-UOM Mapping | Allowed UOM list per Product | Lines |
| Supplier Master | Optional informational Supplier in PR | Header & Cross-transaction |
| Department Master | Optional header Department | Header |
| Picklist | Optional header and line Priority | Header & line |
| Document Code Generation | PR number generation | Document |
| Prefix Template | Document prefix generation | Document |
| Entity Studio | Document Type, Field behaviour, lookup configuration | Document & configuration |
| Rule Engine | Configuration, Business Rules, Validation Rules | Document & Configuration |
| Tax Module | Tax configuration | Line & Header |
| Price Configuration | Product price | Line |

---

## 10. Field Specification

### 10.1 Header Field Specification

| Field Name | Data Type | Format & Length | Lookup Configuration | Mandatory | Editable |
|---|---|---|---|---|---|
| Document Number | Alphanumeric | As defined | Document Code Generation | Mandatory | No |
| Document Date | Date | N/A | N/A | Mandatory | No |
| Requester (logged-in user) | Read-only | N/A | Employee Master | Mandatory | No |
| Department | Lookup | Single selection | Department Master | Optional | Yes, while editable |
| Supplier | Lookup | Single selection | Supplier Master | Optional | Yes, while editable |
| Priority | Picklist | N/A | Priority Master | Optional | Yes, while editable |
| Requirement Date | Date | N/A | N/A | Optional | Yes, while editable |
| Valid Till Date | Date | N/A | N/A | Optional | Yes, while editable |
| Reference Number | Alphanumeric | Max 50 | N/A | Optional | Yes, while editable |
| Remarks | Long text | Max 1000 | N/A | Optional | Yes, while editable |
| Status | Read-only | N/A | Business Rules | Mandatory | No |
| Created By | Read-only | N/A | Logged-in user | Mandatory | No |
| Created On | Read-only | N/A | Logged-in user | Mandatory | No |
| Attachment | File | N/A | N/A | Optional | Conditional |

### 10.2 Line Field Specification

| Field Name | Data Type | Format & Length | Lookup (Master) | Mandatory / Optional | Editable |
|---|---|---|---|---|---|
| Line Number | Number | N/A | Parent PR | Mandatory | No |
| Product Code | Lookup | Single selection | Product Master | Mandatory | No |
| Product Name | Read only | N/A | Product Master | Mandatory | No |
| Description | Read only | N/A | Product Master | Optional | No |
| UOM | Lookup | Single selection | Product-UOM Mapping | Mandatory | Yes, only when editable |
| Priority | Picklist | Single selection | Priority Master | Optional | Yes, only when editable |
| Requirement Date | Date | N/A | N/A | Optional | Yes, only when editable |
| Requested Qty | Number | 3 decimals | N/A | Mandatory | Yes, only when editable |
| Ordered Qty | Read only | 3 decimals | PR-to-PO integration | Mandatory | No |
| Cancelled Qty | Number | 3 decimals | N/A | Mandatory | No |
| Pending Qty | Read only | 3 decimals | N/A | Mandatory | No |
| Status | Status | N/A | System / Qty-status rules | Mandatory | No |
| Cancellation Reason | Picklist | Single selection | Configured values | Conditional | No after action saved |
| Remarks | Long text | Max 500 | N/A | Optional | Yes, only when editable |

### 10.3 Lookup & Search Behaviour

| Lookup | Searchable Keys | Min Characters | Eligible Records | Result Ordering |
|---|---|---|---|---|
| Product | Product Code, Product Name | 3 | Active Products only | Product Code asc, then Product Name asc |
| Supplier | Supplier Code, Supplier Name, Mobile Number, GSTIN | 3 | Active Suppliers only | Supplier Code asc, then Supplier Name asc |
| Department | Department Code, Department Name | 0 | Active Departments only | Department Name asc |
| Priority | Priority Code, Priority Name | N/A | Configured values | Config order |
| Cancellation Reason | Reason code, reason name | N/A | Configured values | Config order |

### 10.4 Attachment Field & Behaviour

| Rule | Requirement |
|---|---|
| Attachment support | Optional in core PR design |
| Max count | Configurable; recommended default 3 attachments per PR |
| Max file size | Configurable; recommended default 5 MB per file |
| Allowed file types | Configurable; recommended default PDF, JPG, JPEG, PNG, XLS, XLSX, DOC, DOCX |
| Add / remove / metadata update | Allowed only when Status = Open and Total Ordered Quantity = 0 |
| View / download in terminal states | Allowed subject to RBAC and file-service availability |
| Replacement behavior | Treat as remove existing attachment + upload new attachment unless native versioning exists |
| Naming behavior | Original filename retained; attachment reference must remain unique |
| Category / remarks | Editable only while PR remains editable |
| Failure handling | No incomplete metadata on failed upload; show exact failure and allow retry |
| Delete behavior | Remove from active list only while editable; removal remains auditable |
| Visibility after ordering starts | Maintenance blocked; only view/download may remain |
| Validation | Count, size, and type validations must show precise user-facing messages |
| Restore behavior | No undo remove unless explicitly designed; re-upload creates new attachment reference |

### 10.5 Line Deletion Model

| Topic | Requirement |
|---|---|
| Deletion model | Soft delete only; hard delete not allowed |
| Eligibility | Allowed only while PR is editable and only for lines with no ordered quantity, no cancelled quantity, and no prior activity history that must remain in active trail |
| Active-screen effect | Deleted lines removed from active line grid |
| Editability after delete | Deleted lines are not editable |
| Effect on totals | Deleted lines excluded from active totals and calculations |
| Effect on duplicate check | Deleted lines ignored; duplicate check continues across all non-deleted lines, including cancelled lines |
| Effect on conversion | Deleted lines cannot be converted to PO |
| History visibility | Deleted lines remain visible in audit/history with delete evidence |
| Line numbering | Deleted line numbers must not be reused |
| Recovery | No undelete in current scope; add new line manually if demand still exists |

---

## 11. Business Rules (Condensed)

### 11.1 Core Transaction Rules

1. PR can be created only when at least one valid non-deleted line exists with product, UOM, and requested quantity.
2. On first successful save, the system generates a unique PR number; create is blocked if numbering fails.
3. There is no Draft state; successful create moves directly to **Open**.
4. Document Date and Requester are system-derived and read-only.
5. Header fields may be amended only while PR is editable: **Status = Open** and **Total Ordered Qty = 0**.
6. Line fields may be amended only while document is Open, total ordered quantity is 0, line is not deleted, and line cancelled quantity is 0.
7. Lines with cancelled quantity cannot be edited directly; cancellation correction is required first.
8. Supplier on PR is optional and informational only; PO user may change it.
9. Only active products can be selected on new/editable lines.
10. If supplier is entered, it must be active.
11. UOM defaults from product default and may only be changed to allowed mapped values.
12. Requested quantity must be greater than 0.
13. Fractional quantity is allowed only if the selected UOM permits fractions.
14. Duplicate product lines are not allowed across non-deleted lines, including cancelled lines.
15. On product change, product attributes refresh, UOM resets to default, requested qty clears, and optional context fields remain.
16. Add/delete line actions are allowed only while PR is editable.
17. Soft delete is blocked for lines with ordered quantity > 0 or cancelled quantity > 0.
18. Document deletion is never allowed.
19. Full document cancellation is allowed only while PR is editable; reason mandatory; no reopen.
20. Line cancellation is allowed only where pending quantity exists; quantity must be > 0 and <= pending quantity; reason mandatory.
21. Cancellation correction is allowed only while PR is editable; correction qty must be > 0 and <= current cancelled qty; reason mandatory.
22. After cancellation correction, line and document statuses are immediately re-derived.
23. Ordered quantity is derived only from PO conversion linkage; manual entry not allowed.
24. Conversion quantity must be > 0 and <= line pending quantity.
25. Only **Open** and **Partially Ordered** PRs with pending quantity > 0 are eligible for PO conversion.
26. If product becomes inactive after PR creation, line remains viewable but conversion is blocked.
27. Once any ordered quantity exists, header edit, line edit, line delete, document cancel, attachment maintenance, and cancellation correction are blocked; only remaining pending quantity cancellation is allowed.
28. Pending Qty = Requested Qty - Ordered Qty - Cancelled Qty.
29. Line status is system-derived from ordered, pending, and cancelled quantities.
30. Document status is derived from non-deleted line outcomes and document-level actions.
31. Valid Till Date affects PR only until first ordering starts.
32. If Valid Till Date is crossed while PR is Open and total ordered quantity = 0, status becomes **Expired**.
33. Manual close is allowed only when status = **Partially Ordered** and total pending quantity = 0.
34. Manual close requires remarks.
35. Fully Ordered is system-transient/history-only and auto-closes immediately to Closed.
36. If ordered > 0, cancelled > 0, and pending = 0, document remains Partially Ordered until manual close.
37. Header priority and line priority are optional and independent.
38. Header requirement date and line requirement date are optional and independent.
39. Attachment add/remove/update is allowed only while PR is editable.
40. Product and supplier search results appear only after minimum 3 characters; threshold is configurable.
41. Product lookup returns all active products in base entity; no organization/branch filter in core design.
42. Supplier lookup returns all active suppliers in base entity; no organization/branch filter in core design.
43. Department lookup supports code/name search with no minimum threshold and is sorted by department name ascending.
44. Replacement PR creation/linkage is out of scope; after ordering starts, revised demand needs a new PR raised manually.
45. Blank Valid Till Date means no automatic expiry.
46. Valid Till Date, if entered, must not be earlier than document date or any entered requirement date.
47. Historical inactive supplier/department values remain viewable but cannot be newly selected in editable state.
48. Historical invalid product-UOM mappings remain viewable but editable save must use currently valid mapping.
49. Ordered and pending quantities must recalculate when valid downstream PO linkage is reduced, cancelled, reversed, or otherwise changed.
50. Save, cancel, correction, delete, and conversion actions must be blocked on stale versions when another user has updated the record.
51. Create/first save must be atomic; no partial PR should be committed if create fails.
52. On document cancel, all non-deleted lines must be system-derived to fully cancelled for remaining demand, with audit retained.
53. Deleted lines cannot be restored in current scope.
54. Deleted line numbers must not be reused; new lines get the next sequence number.
55. Eligible line delete should capture delete actor, timestamp, and reason / audit note.
56. Fully Ordered must not behave as a stable working status for users; it should appear only in history/audit before immediate closure.

---

## 12. Validation Rules (Condensed by ID)

### 12.1 Create / Save / Master Data / Quantity

- **VAL-001**: At least one valid non-deleted line is required before create.
- **VAL-002**: Number generation failure blocks PR creation.
- **VAL-003**: Department must be valid.
- **VAL-004**: Supplier must be active if selected.
- **VAL-005**: Product is required on line.
- **VAL-006**: Product must be active.
- **VAL-007**: UOM must be mapped to selected product.
- **VAL-008**: Requested quantity must be greater than zero.
- **VAL-009**: Fraction not allowed for non-fractional UOM.
- **VAL-010**: Duplicate product line not allowed across non-deleted lines.
- **VAL-011**: Line edit blocked when document/line editability conditions are not satisfied.
- **VAL-012**: Header edit blocked when document is not editable.
- **VAL-013**: Product change requires requested quantity re-entry.
- **VAL-014**: Historical inactive product remains viewable but not newly selectable.
- **VAL-015**: Supplier remains optional on PR but may be required at PO stage through downstream integration.
- **VAL-016**: Line add allowed only before ordering starts.

### 12.2 Delete / Cancel / Correction / Conversion

- **VAL-017**: Line delete blocked when line status does not allow deletion or ordered/cancelled history exists.
- **VAL-018**: Line delete blocked when ordered or cancelled history exists.
- **VAL-019**: Document delete is not allowed; use cancellation.
- **VAL-020**: Document cancel requires editable status and reason.
- **VAL-021**: Line cancellation requires eligible status, valid quantity, and reason.
- **VAL-022**: Final all-line cancellation before ordering must use Document Cancel, not line cancellation.
- **VAL-023**: Cancellation correction blocked when ordering has started or status does not allow it.
- **VAL-024**: Cancellation correction quantity must be within previously cancelled amount.
- **VAL-024A**: Cancellation correction reason is mandatory.
- **VAL-025**: Direct line edit on cancelled/partially cancelled line is blocked.
- **VAL-026**: Requested qty must be re-entered after product change.
- **VAL-027**: Conversion blocked when PR status is not eligible.
- **VAL-028**: Conversion quantity must be greater than zero.
- **VAL-029**: Conversion quantity must not exceed pending quantity.
- **VAL-030**: Inactive product cannot be converted to PO.
- **VAL-031**: Supplier required at PO creation stage.
- **VAL-032**: Manual close allowed only from Partially Ordered status.
- **VAL-033**: Manual close allowed only when total pending quantity is zero.
- **VAL-034**: Manual close remarks are mandatory.
- **VAL-035**: At least one valid non-deleted line must remain before ordering.
- **VAL-036**: Attachment count limit enforced.
- **VAL-037**: Attachment size limit enforced.
- **VAL-038**: Attachment type restriction enforced.
- **WARN-001**: Supplier on PR is informational only and may change during PO creation.
- **VAL-039**: Historical inactive supplier remains visible but cannot be reselected.
- **VAL-040**: Historical inactive department remains visible but cannot be reselected.
- **VAL-041**: Historical product-UOM mapping may remain visible, but editable save requires currently valid mapping.
- **VAL-042**: Stale version / concurrent update blocks save/cancel/delete/correction/conversion.
- **VAL-043**: Delete reason required where delete-governance is enabled.
- **VAL-044**: Deleted lines cannot be restored.
- **VAL-045**: Atomic create/save failure prevents partial PR save.
- **VAL-046**: Downstream PO quantity changes require refresh before proceeding.

---

## 13. Lifecycle and Action Control

### 13.1 Status Definition

| Status | Definition | Entry Condition | Allowed Actions | Editable | Next State | Reversal & Correction Path |
|---|---|---|---|---|---|---|
| Open | Active purchase requisition before any ordering starts | Successful create with total ordered quantity = 0 | View, edit header, edit eligible line, add line, delete eligible line, cancel document, cancel line quantity, cancellation correction, add/remove/update attachment metadata, convert to PO, view history | Yes, only while total ordered qty = 0 and subject to line-state restrictions | Partially Ordered / Fully Ordered (transitional only) / Cancelled / Expired | Amend while editable; cancellation correction allowed where cancelled qty exists |
| Partially Ordered | Some ordered quantity exists and demand is not fully resolved by pure ordering | Any ordered quantity exists and either total pending qty > 0 or total cancelled qty > 0 | View, cancel remaining line qty, convert remaining eligible qty, manual close when total pending qty = 0, view history | No core edits | Continue as Partially Ordered or move to Closed | Cancel remaining pending qty if required; revised demand requires new PR |
| Fully Ordered | Transitional/history-only state where all non-deleted demand is ordered with no cancellation remainder | Total requested qty fully consumed by ordering, total cancelled qty = 0, total pending qty = 0 | No separate user working action; history/view visibility only | No | Closed immediately | System auto-closes immediately |
| Cancelled | Terminal pre-order document cancellation state | Document cancel action before ordering starts | View, view history | No | Terminal | No reopen; raise new PR manually if needed |
| Expired | Terminal pre-order expiry state | Open PR with total ordered qty = 0 crosses Valid Till Date | View, view history | No | Terminal | No reopen; raise new PR manually if needed |
| Closed | Final terminal state | Auto-close from Fully Ordered or manual close from Partially Ordered with pending = 0 | View, view history | No | Terminal | No reopen; revised demand requires new PR |

### 13.2 Line Status Definition

| Line Status | Exact Condition | Meaning & Clarification | Editability Note |
|---|---|---|---|
| Open | Ordered qty = 0, cancelled qty = 0, pending qty > 0 | Untouched active demand line | Editable only when document is Open, total ordered qty = 0, line is not deleted, and line cancelled qty = 0 |
| Partially Cancelled | Ordered qty = 0, cancelled qty > 0, pending qty > 0 | Pre-order partial cancellation occurred | Direct edit blocked; use cancellation correction first |
| Partially Ordered | Ordered qty > 0 and (pending qty > 0 or cancelled qty > 0) | Some demand has been converted and line is not fully resolved | Normal line edit blocked after ordering starts |
| Fully Ordered | Ordered qty = requested qty and cancelled qty = 0 and pending qty = 0 | All requested quantity converted with no cancellation remainder | History/derivation state only |
| Cancelled | Ordered qty = 0 and cancelled qty = requested qty and pending qty = 0 | Full line cancellation before ordering, or document-cancel cascade before ordering | Non-editable terminal line state |

### 13.3 Document Status Definition

| Scenario | Derived Status | Notes / Clarification |
|---|---|---|
| PR created successfully with no ordering | Open | Initial active state |
| Open PR fully cancelled through document cancel before ordering | Cancelled | Terminal pre-order cancellation state |
| Open PR crosses valid till date before ordering | Expired | Terminal expiry state |
| Total ordered qty > 0 and total pending qty > 0 | Partially Ordered | Active downstream consumption with remaining pending demand |
| Total ordered qty > 0 and total cancelled qty > 0 and total pending qty = 0 | Partially Ordered until Manual Close | Mixed ordered-plus-cancelled resolution requires manual close |
| Total ordered qty = total requested qty and total cancelled qty = 0 and total pending qty = 0 | Fully Ordered then Closed | Transitional only; auto-closes immediately |
| Manual close performed from Partially Ordered with total pending qty = 0 | Closed | Controlled manual close |
| Downstream PO feedback reduces ordered qty after earlier conversion | Re-derive from latest totals | Status recalculates from refreshed totals |

### 13.4 Status – Action Matrix

| Action | Open | Partially Ordered | Fully Ordered | Cancelled | Expired | Closed | Notes |
|---|---|---|---|---|---|---|---|
| View | Enabled | Enabled | Enabled | Enabled | Enabled | Enabled | N/A |
| Edit Header | Enabled | Disabled | Disabled | Disabled | Disabled | Disabled | Only while editable |
| Edit Line | Enabled only when line is eligible | Disabled | Disabled | Disabled | Disabled | Disabled | Line-state restrictions still apply |
| Add Line | Enabled | Disabled | Disabled | Disabled | Disabled | Disabled | Before ordering only |
| Delete Line | Enabled only on untouched eligible lines | Disabled | Disabled | Disabled | Disabled | Disabled | Soft delete only |
| Cancel Document | Enabled | Disabled | Disabled | Disabled | Disabled | Disabled | Before any ordered qty only |
| Cancel Line Quantity | Enabled if pending exists and final all-line rule not violated | Enabled if pending exists | Disabled | Disabled | Disabled | Disabled | In Partially Ordered, only remaining pending qty may be cancelled |
| Cancellation Correction | Enabled only on lines with cancelled qty > 0 | Disabled | Disabled | Disabled | Disabled | Disabled | Before ordering only |
| Manual Close | Disabled | Enabled only when total pending qty = 0 | Disabled | Disabled | Disabled | Disabled | Remarks required |
| Attachment Metadata | Enabled | Disabled | Disabled | Disabled | Disabled | Disabled | Only while editable |
| Convert to PO | Enabled if eligible line pending > 0 | Enabled if eligible line pending > 0 | Disabled | Disabled | Disabled | Disabled | Also depends on line/product/downstream constraints |
| View History | Enabled | Enabled | Enabled | Enabled | Enabled | Enabled | Subject to access control |

---

## 14. Screen & Operational Behaviour

### 14.1 Screen Behavior

| Area | Applies To | Corrected Behavior | Notes / Dependency |
|---|---|---|---|
| Create screen | PR Screen | User may enter optional header details and one or more valid lines. First successful save creates PR directly in Open. No Draft state. | Depends on valid line rules, numbering, and create validation |
| Header layout | PR Screen | Show PR Number, Document Date, Requester, Department, Supplier, Priority, Requirement Date, Valid Till Date, Reference Number, Remarks, and Status | PR Number, Document Date, Requester, and Status are read-only |
| Requester display | Header / Display | Requester shown read-only | Align with requester identity and audit model |
| Supplier behavior | PR Screen | Supplier is optional and informational only; may prefill PO but PO user may change it | Must align with supplier informational-only rule |
| Requirement date / priority | PR Screen | Header and line values are independent; no inheritance or auto-sync | Keep explicit in UI help text |
| Header editability | PR Screen | Editable header fields enabled only while PR is editable; become read-only after ordering starts | Depends on Status and Total Ordered Quantity |
| Line grid | Line / Grid | Active grid shows only non-deleted lines. Each Product can exist only once across non-deleted lines, including cancelled lines. | Deleted lines must not remain in active grid |
| Line quantity display | Line / Grid | Ordered, Cancelled, and Pending Qty are always read-only and system-derived | Prevent manual mutation |
| Product change behavior | PR Screen / Line Grid | Confirmation popup required. On confirm, refresh product fields, reset UOM to default, clear Requested Qty, preserve optional context fields | Must align with product change rule and audit trail |
| UOM behavior | Line / Grid | UOM dropdown restricted to allowed values for selected Product | Depends on Product-UOM mapping |
| Quantity panel | PR Screen | Ordered, Cancelled, and Pending are read-only. Requested Qty entered via line controls only. | Keep semantics visible |
| Delete line behavior | Line / Grid | Delete confirmation required. If delete-reason governance adopted, require delete reason in popup. | Depends on soft-delete model |
| Cancel line behavior | Line / Grid | Show action only where pending quantity exists and rules allow it. Prompt for cancellation quantity and reason. | Must align with line-cancel validation |
| Cancellation correction helper | PR Screen | Show helper text: use correction only to reverse pre-order cancellation; after ordering starts, raise new PR instead. | Correct and should remain |
| Valid Till display note after ordering | PR Screen | When Total Ordered Qty > 0, show helper text that Valid Till Date is informational only after ordering starts | Keeps lifecycle understandable |
| Attachment area | Attachment | Show attachments and metadata; add/remove/update only while editable; later only view/download may remain | Depends on attachment rules and RBAC |
| History area | History | History remains viewable where authorized; deleted lines appear only in history/audit | Align with audit/history rules |
| Linked PO trace area | PR Screen / History | Show linked PO number/reference, PR line reference, converted quantity, and timestamp in history or related detail area | Depends on PO integration |
| Action enable / disable | PR Screen | Buttons and row actions render according to status, editability, and line-state rules; disabled actions should show contextual help text | Final visibility still depends on RBAC |
| Stale data / concurrent update | PR Screen | If PR changed after user loaded it, save/cancel/delete/correction/conversion actions must be blocked and user prompted to refresh | Depends on record version control |
| Replacement PR linkage | PR Screen | No system-assisted replacement PR creation action should be shown | Out of current scope |
| Core branch demand assumption | PR Screen / Core Model | Demand is assumed to be raised in logged-in branch context; warehouse/location/destination demand not in core model | Extension only through governed clone/configuration |

### 14.2 List View & Filter

| View Name | Purpose | Default Columns | Default Sort | Search Scope | Filters | Notes |
|---|---|---|---|---|---|---|
| Open PRs | Primary worklist for editable PRs before ordering starts | PR Number, Document Date, Requester, Department, Supplier, Priority, Requirement Date, Valid Till Date, Status | Last Updated On desc | PR Number, Reference Number, Product Code, Product Name, Supplier Code, Supplier Name, Requester | Status, Requester, Department, Supplier, Priority, Requirement Date range, Valid Till Date range | Avoid misleading mixed-UOM quantity totals |
| Partially Ordered PRs | Operational queue for in-progress requisitions where ordering has started | PR Number, Document Date, Requester, Supplier, Status, Last Updated On | Last Updated On desc | PR Number, Product Code, Product Name, Supplier Code, Supplier Name, Requester | Status, Requester, Supplier, Valid Till Date range | Clarify any quantity summaries are document totals, not normalized totals |
| Awaiting Manual Close | Queue for zero-pending requisitions that still require controlled manual closure | PR Number, Document Date, Requester, Status, Last Updated On | Last Updated On desc | PR Number, Requester, Product Code, Product Name | Status = Partially Ordered, Total Pending Quantity = 0 | Strong operational queue |
| Terminal PRs | Read-only worklist for completed or inactive lifecycle outcomes | PR Number, Document Date, Requester, Supplier, Status, Last Updated On | Last Updated On desc | PR Number, Reference Number, Supplier, Requester | Status, Requester, Supplier, Date range | Includes Cancelled, Expired, and Closed; Fully Ordered should not be a normal list state |
| Supplier Blank PRs | Operational list where supplier remains blank and later sourcing input may be needed | PR Number, Document Date, Requester, Department, Status, Last Updated On | Document Date desc | PR Number, Product Code, Product Name, Requester | Status, Supplier blank | Optional worklist because supplier is informational in core design |

---

## 15. Cross-Transaction & Exceptional Handling

### 15.1 Parent-Child Impact (Purchase Requisition to Purchase Order)

| Topic | Applies To | PR-side Rule & Behavior | Dependency / External Module Note |
|---|---|---|---|
| Parent-child structure | Document / Line / Cross-transaction | One PR has one or more non-deleted lines. Each eligible line may contribute quantity to one or more downstream POs through controlled partial conversion. | Downstream PO implementation handled in PO module |
| Ordered quantity source | Document / Line / Cross-transaction | Ordered Qty updates only from valid linked PO conversion events. Manual overwrite not allowed. | PO integration required |
| Pending quantity effect | Document / Line / Cross-transaction | Each valid conversion reduces line Pending Qty and updates document totals and derived statuses immediately. | PO integration required |
| Conversion quantity | Document / Line / Cross-transaction | Conversion quantity must be > 0 and <= line Pending Qty at moment of conversion. | PO integration required |
| Conversion statuses | Document / Line / Cross-transaction | Only Open and Partially Ordered PRs may provide quantities for PO conversion. Cancelled, Expired, and Closed are not eligible. | PR-side status control only |
| Supplier at PO stage | Document / Line / Cross-transaction | If PR Supplier is populated, it may prefill PO Supplier as default/reference only; PO user may change it. | PO integration required |
| Supplier mandatory at PO stage | Document / Line / Cross-transaction | Supplier must be selected before PO creation even though it is optional on PR | [NEEDS INTEGRATION] PO-side mandatory control |
| One PR to many POs | Document / Line / Cross-transaction | Allowed through multiple partial conversions as long as cumulative converted qty never exceeds line Pending Qty | PO integration required |
| Many PRs to one PO | Document / Line / Cross-transaction | Allowed only if PO-side merge logic governs compatibility and source trace | [NEEDS INTEGRATION] PO-side merge/source trace required |
| PO feedback / reversal | Document / Line / Cross-transaction | If linked PO qty is reduced, cancelled, reversed, or otherwise changed, Ordered Qty, Pending Qty, line status, and document status must recalculate from latest valid linkage | Downstream sync required |
| Post-order amendment | Document / Line / Cross-transaction | Once ordering starts, the same PR cannot be amended for revised demand. Cancel remaining pending qty where appropriate and raise a new PR manually if needed. | PR-side behavior only |
| Inactive product before conversion | Document / Line / Cross-transaction | PR remains viewable and line conversion is blocked | Product master + PO integration required |
| Inactive supplier/department after creation | Document / Line / Cross-transaction | Historical values remain visible but cannot be newly selected or re-saved in editable mode | Master-data consistency required |
| Product-UOM mapping changed after creation | Document / Line / Cross-transaction | Historical line remains viewable; further edit must use valid current mapping | Product-UOM mapping dependency required |
| Valid till after ordering starts | Document / Line / Cross-transaction | Valid Till Date has no further effect after any ordered qty exists | Internal PR rule only |
| Linked PO traceability | Document / Line / Cross-transaction | History should retain PO number/reference, PR line reference, converted qty, and timestamp for each valid conversion | Supported by audit/history |
| Downstream status dependency | Document / Line / Cross-transaction | PR derives its own status from PR-side totals only; it does not inherit PO header status directly | Prevents lifecycle confusion |
| Replacement PR linkage | Document / Line / Cross-transaction | System-assisted linked replacement PR creation remains out of scope; continuity may be maintained manually via Reference Number or Remarks | Governance note only |

### 15.2 Exceptions & Edge Cases

| Scenario | System Handling | User Recovery Action |
|---|---|---|
| User tries to create PR with no lines | Blocks create | Add at least one valid line |
| Duplicate product entered | Block duplicate line | Update existing line instead |
| Product changed on line | Reset UOM, clear requested qty, preserve optional context fields | Re-enter quantity and review UOM |
| Wrong line cancelled before ordering starts | Use cancellation correction with reason | Reduce cancelled quantity through controlled correction |
| Wrong line cancelled after ordering starts | No correction in same PR | Raise a new PR manually if more demand is required |
| Wrong document cancelled | No reopen | Raise a new PR manually; record trace in remarks/reference if needed |
| Wrong manual close | No reopen | Raise a new PR manually if further demand is needed; rely on closure audit trail |
| Mistaken line deletion | No undelete in current scope | Re-add line manually if PR is still editable |
| Demand changed after partial ordering | Old PR cannot be amended | Cancel remaining pending qty and raise a new PR manually |
| Product became inactive after PR creation | PR remains viewable; conversion blocked | Resolve product master issue or raise new PR with valid product |
| Open PR crossed valid till date | Move to Expired | Raise new PR if demand is still valid |
| Partially Ordered PR crossed valid till date | No expiry effect after ordering starts | Continue per Partially Ordered rules |
| Attempt to fully cancel all non-deleted lines before ordering through line cancellation | Block final line cancellation | Use Document Cancel instead |
| Remaining pending qty fully cancelled after partial ordering | PR stays Partially Ordered until Manual Close | Use Manual Close once total pending qty = 0 |
| Attempt to re-add fully cancelled product | Block duplicate | Existing cancelled line remains demand trail |
| Attachment upload blocked | Show exact validation | Reduce file size/type/count and retry |
| High-SKU / large catalog environments | Core PR stays generic; lookup usability may be improved through governed clone/configuration filters | Apply approved clone/configuration filters |
| Business requires earlier supplier-feasibility discipline | Core PR keeps Supplier optional and informational | Use governed clone/configuration model if earlier supplier discipline is needed |
| Cross-branch / destination-demand variants | Core PR assumes logged-in branch context | Use governed clone/configuration extension if destination semantics are required |
| Linked PO quantity reduced after earlier conversion | Refresh ordered/pending quantities and re-derive statuses | Refresh and continue based on current totals |
| Stale user action after another user changed PR | Block action on stale version | Refresh and retry |
| Historical supplier/department became inactive | Keep historical value visible; block new selection / re-save of inactive value in editable context | Choose active value or clear field |
| Product-UOM mapping changed after save | Keep historical line visible; block editable save unless current mapping is valid | Choose currently allowed UOM |
| Create failed after numbering or transaction error | Do not leave partial PR | Retry create and contact support if needed |
| User attempts to restore deleted line | No restore action in current scope | Add a new eligible line manually |
| Delete reason required but not entered | Block delete and prompt for reason | Enter delete reason and retry |

---

## 16. Notes

- This markdown version is a normalized text conversion of the attached PDF FRD.
- The lifecycle diagram from the PDF has been represented as a note rather than re-drawn.
- Core meaning, status logic, validation intent, and transaction boundaries have been preserved.

