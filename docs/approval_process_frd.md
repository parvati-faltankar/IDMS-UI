# Approval Studio — Functional Requirements Document

| | |
|---|---|
| **Document ID** | IDMS-FRD-APPROVAL-001 |
| **Version** | 2.0 |
| **Status** | Final Draft |
| **Classification** | Internal — Restricted |
| **Date** | 28 May 2026 |
| **Prepared By** | Product Management, IDMS Platform |
| **Primary Audience** | Chief Enterprise Architect · Senior Product Manager |
| **Secondary Audience** | Business Analysts · QA Architects · Solution Architects |

---

> **Purpose of This Document**
> This document is the single authoritative source of truth for every functional capability of the Approval Studio module. It defines what the system does, why each capability exists, and the exact rules that govern its behaviour. It does not describe implementation details, database schemas, or UI aesthetics.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context and Strategic Intent](#2-business-context-and-strategic-intent)
3. [Scope and Boundaries](#3-scope-and-boundaries)
4. [Actors and Stakeholders](#4-actors-and-stakeholders)
5. [Conceptual Architecture](#5-conceptual-architecture)
6. [Approval Workflow Lifecycle](#6-approval-workflow-lifecycle)
7. [Feature Specification: Workflow Management](#7-feature-specification-workflow-management)
8. [Feature Specification: Wizard — Step 1 Basic Details](#8-feature-specification-wizard--step-1-basic-details)
9. [Feature Specification: Wizard — Step 2 Trigger and Data Capture](#9-feature-specification-wizard--step-2-trigger-and-data-capture)
10. [Feature Specification: Wizard — Step 3 Approver Configuration](#10-feature-specification-wizard--step-3-approver-configuration)
11. [Feature Specification: Wizard — Step 4 Rules and Decision Logic](#11-feature-specification-wizard--step-4-rules-and-decision-logic)
12. [Feature Specification: Wizard — Step 5 Actions and Notifications](#12-feature-specification-wizard--step-5-actions-and-notifications)
13. [Feature Specification: Wizard — Step 6 Publish and Activation](#13-feature-specification-wizard--step-6-publish-and-activation)
14. [Feature Specification: Advanced Governance Controls](#14-feature-specification-advanced-governance-controls)
15. [Feature Specification: End-User Approval Experience](#15-feature-specification-end-user-approval-experience)
16. [Business Domain Coverage](#16-business-domain-coverage)
17. [Consolidated Business Rules](#17-consolidated-business-rules)
18. [Non-Functional Requirements](#18-non-functional-requirements)
19. [Glossary](#19-glossary)
20. [Appendix](#20-appendix)

---

## 1. Executive Summary

Approval Studio is the **enterprise workflow orchestration layer** of the IDMS platform. It gives operations and compliance teams the power to design, enforce, and audit multi-step approval processes across every business-critical transaction — without writing code or raising IT change requests.

### Why It Exists

In complex enterprises, financial and operational controls collapse when approval logic is scattered across email threads, spreadsheet trackers, and individual managers' discretion. Approval Studio solves this by making approval policy an **explicit, versioned, auditable configuration** — one that the business can own, adjust, and trace independently of the software development cycle.

### What It Delivers

| Capability | Business Value |
|---|---|
| **No-code workflow design** | Operations teams configure policies in hours, not weeks |
| **Six approval types** | Covers every governance pattern from simple sign-off to enterprise hierarchy routing |
| **Four business domains** | Single engine governs Procurement, Sales, Inventory, and Service uniformly |
| **DMN decision tables** | Finance and compliance teams encode complex approval matrices without developer involvement |
| **Real-time audit trail** | Every decision is captured immutably — satisfying internal audit and external regulatory review |
| **SLA enforcement** | Approvals never stall silently; reminders, escalation, and auto-action ensure process velocity |
| **External approvals** | Vendors, customers, and external auditors can participate in workflows without an IDMS account |
| **Maker-checker by default** | Segregation of duties is enforced at the configuration level, not left to manual practice |

### Key Metrics Targeted

- Zero lost or undocumented approvals
- Approval cycle time reduction by configurable SLA thresholds
- Full regulatory audit readiness for every approved transaction
- Policy changes effective within minutes, with zero downtime

---

## 2. Business Context and Strategic Intent

### 2.1 The Problem

Enterprise approval processes have three structural weaknesses that Approval Studio is designed to eliminate:

1. **Opacity** — Approvals happen in email, verbal conversations, or messaging apps. There is no system of record. Auditors cannot trace who approved what and when.
2. **Brittleness** — When an approver leaves the organisation or changes roles, approval chains break. Documents get stuck. Deals are delayed.
3. **Rigidity** — When business rules change (e.g. a new discount threshold, a new branch, a new regulatory requirement), IT must be engaged to modify hardcoded logic. This takes weeks and creates backlog.

### 2.2 The Strategic Solution

Approval Studio separates **policy definition** (who must approve, under what conditions) from **policy execution** (the runtime engine that routes documents). This separation achieves:

- **Business agility** — Policy Owners can modify workflows and publish changes immediately, without touching code.
- **Governance depth** — Every rule, every approver assignment, every decision is captured in a structured, queryable audit log.
- **Operational resilience** — Fallback chains, delegation, and SLA auto-actions ensure no document waits indefinitely.

### 2.3 Design Principles

| Principle | Implication |
|---|---|
| **Configuration over customisation** | Every governance need is met by configuration. No approval logic lives in code. |
| **Explicit over implicit** | Every rule, every condition, every exception is stated in the workflow definition. Nothing is assumed. |
| **Audit-first design** | Every state transition generates an immutable audit record. Compliance is structural, not procedural. |
| **Separation of concerns** | Approval Studio configures. The Approval Engine executes. Document modules own their data. |
| **Progressive disclosure** | Quick Setup surfaces only essential settings. Detailed Setup reveals all advanced capabilities. |
| **Fail-safe defaults** | Default settings (Lock on Submit, No Edit, Remarks Required on Reject) favour control over convenience. |

---

## 3. Scope and Boundaries

### 3.1 In Scope

This document covers the complete functional specification of:

- **Approval Studio (Admin)** — creating, configuring, publishing, and managing approval workflow policies
- **Approval Runtime (End User)** — submitting, reviewing, approving, rejecting, recalling documents, and monitoring approval status
- **All four business domains** — Procurement, Sales, Inventory, Service
- **All advanced governance features** — SLA, escalation, delegation, external approvals, bulk approval, partial approval, rejection handling, and audit trail

### 3.2 Out of Scope

The following are explicitly excluded from this document:

| Excluded Item | Covered Where |
|---|---|
| Document creation and editing | Individual module FRDs (e.g. Purchase Order FRD) |
| User management, role assignment | User and Role Master FRD |
| Email/SMS gateway configuration | Notification Infrastructure FRD |
| Calendar and business hours setup | Calendar Master FRD |
| Approver Routing Matrix setup | Approver Routing Matrix FRD |
| Approval Engine runtime architecture | Technical Architecture Document |
| Database schema and API contracts | Technical Specification Documents |

### 3.3 Assumptions

1. The Approval Engine is a deployed, operational back-end service that reads and executes Approval Studio configurations.
2. Users and roles exist in the User Master before being referenced in workflow configurations.
3. Calendar and business hours are pre-configured before SLA policies are activated.
4. Document modules expose a consistent submission and status-update API that the Approval Engine can invoke.

---

## 4. Actors and Stakeholders

### 4.1 Primary Actors

| Actor | Role in Approval Studio | Permissions |
|---|---|---|
| **System Administrator** | Full administrative authority over all workflows, all organisations, all configurations. | Create, read, update, delete, publish, archive, pause all workflows. Enable Auto-Approve on timeout. Override any restriction. |
| **Policy Owner** | Accountable for the correctness and currency of the workflows they own. | Create, edit, publish, archive, duplicate workflows they own. Cannot modify another owner's workflows. Cannot enable Auto-Approve on timeout. |
| **Approver** | Receives and acts on approval tasks. | View assigned documents. Approve, reject, reassign (if permitted), delegate. Cannot configure workflows. |
| **Requester / Submitter** | Creates and submits documents for approval. | Submit documents, recall documents subject to the recall policy, view approval status on own documents. |
| **Auditor / Read-Only** | Reviews configurations and history for compliance or reporting. | Read-only access to all workflow configurations, approval records, and audit trails. No write operations. |

### 4.2 Secondary Stakeholders

| Stakeholder | Interest in Approval Studio |
|---|---|
| **Chief Compliance Officer** | Audit trail completeness, segregation of duties enforcement, regulatory traceability |
| **Finance Controller** | Approval thresholds, multi-level sign-off for high-value transactions |
| **IT/Platform Team** | Integration stability, version management, configuration export/import |
| **External Approver** | Secure, friction-free link-based approval without system registration |

---

## 5. Conceptual Architecture

### 5.1 Layered Model

```
+------------------------------------------------------------------+
|                      APPROVAL STUDIO (Admin)                      |
|  Policy Design  |  Rule Engine Config  |  Workflow Versioning     |
+------------------------------------------------------------------+
                            |  Publishes to
+------------------------------------------------------------------+
|                      APPROVAL ENGINE (Runtime)                    |
|  Task Routing   |  SLA Timers   |  Notification Dispatch          |
+------------------------------------------------------------------+
         |  Reads from                   |  Writes to
+-------------------+          +-------------------------+
|  DOCUMENT MODULES |          |   AUDIT & COMPLIANCE    |
|  (PO, SO, GRN...) |          |   (Immutable Log Store) |
+-------------------+          +-------------------------+
```

### 5.2 Approval Studio Components

| Component | Responsibility |
|---|---|
| **Workflow Registry** | Stores all workflow definitions, versions, and metadata |
| **Configuration Wizard** | Six-step guided interface for creating and editing workflow policies |
| **Rule Engine Designer** | Condition builder, formula editor, and DMN decision table authoring tool |
| **Approver Configuration** | Stage, step, and fallback chain designer |
| **Action Designer** | Event-driven action and notification configuration |
| **Publish Manager** | Validation, versioning, scheduling, and activation of workflows |
| **Audit Viewer** | Read-only, immutable approval history and decision trace viewer |

### 5.3 Approval Types at a Glance

| Type | Pattern | Typical Use |
|---|---|---|
| **Single** | One approver, one decision | Low-risk, high-volume transactions |
| **Sequential** | Approvers act in strict order | Controlled multi-level sign-off (Manager → Director) |
| **Parallel** | All approvers notified simultaneously | Cross-functional review (Finance + Legal + Ops) |
| **Conditional** | Path selected dynamically by rules | Amount-band or risk-tier routing |
| **Fallback** | Primary → Fallback chain on SLA breach | Availability-resilient single-threaded approval |
| **Multi-level** | Hierarchical escalation through management layers | High-value enterprise transactions |

### 5.4 Approval Granularity

| Mode | Behaviour |
|---|---|
| **Header** | Document is approved or rejected as a single unit |
| **Line** | Each line item carries its own independent approval decision |
| **Hybrid** | Header and line items can both carry approval decisions simultaneously |

---

## 6. Approval Workflow Lifecycle

### 6.1 Policy Lifecycle States

| State | Description | Allowed Transitions |
|---|---|---|
| **Draft** | Being configured. Not applied to any documents. | → Active, → Archived |
| **Active** | Published and applied to new documents of the configured type/scope. | → Paused, → Archived |
| **Paused** | Temporarily suspended. Documents submitted during this period skip this workflow. | → Active, → Archived |
| **Archived** | Permanently decommissioned. Historical data retained. | None (terminal) |

**Governance rules on lifecycle transitions:**

- `BR-001` A workflow cannot move from Draft to Active without passing all publish validation checks.
- `BR-002` Publishing a new version of a workflow automatically archives the previous Active version.
- `BR-003` Archived workflows cannot be reactivated. A duplicate must be created to build upon them.
- `BR-004` Auto-save occurs on every wizard step navigation, persisting the Draft.

### 6.2 Document Approval Lifecycle

A document submitted under an active workflow passes through the following states:

| State | Meaning |
|---|---|
| **Pending Approval** | Submitted; waiting for approval at the current step |
| **In Progress** | At least one step approved; more remain |
| **Approved** | All required steps approved; document proceeds |
| **Rejected** | A step decision has triggered the rejection policy |
| **Recalled** | Requester withdrew the document before final decision |
| **Cancelled** | Authorised user cancelled the in-progress approval |
| **Escalated** | SLA breached; task moved to fallback approver |
| **Timed Out** | SLA expired; auto-action applied (Auto Approve / Auto Reject / Manual Review) |

### 6.3 State Transition Diagram

```
           Submit
             |
    [Pending Approval] ──────────────── Recall ──► [Recalled]
             |
      Step Decision
         /        \
   Approve      Reject
     |               \──────────────────────────────► [Rejected]
     |
 More Steps? ──Yes──► [In Progress] ──► (next step)
     |
    No
     |
  [Approved]

[Pending Approval] ──SLA Breach──► [Escalated] ──► (fallback step)
[Escalated]        ──Timeout──────► [Timed Out] ──► (auto-action)
```

---

## 7. Feature Specification: Workflow Management

### 7.1 Workflow List

The Workflow List is the home screen of Approval Studio. Every workflow the current user has permission to view is displayed in a sortable, searchable grid.

#### 7.1.1 List Columns

| Column | Description |
|---|---|
| **Name** | Workflow name. Clickable — opens the detail side panel. |
| **Type** | Sequential, Parallel, Conditional, etc. |
| **Domain** | Business domain badge (Procurement, Sales, Inventory, Service) |
| **Owner** | Name of the workflow's Policy Owner |
| **Created** | Timestamp of first save |
| **Updated** | Timestamp of last modification |
| **Status** | Colour-coded badge: Active (green), Draft (grey), Paused (amber), Archived (red) |

#### 7.1.2 Search and Filter

| Filter | Behaviour |
|---|---|
| **Full-text search** | Matches against name, description, status, type, owner, and owner team simultaneously |
| **Status** | Single-select: Draft, Active, Paused, Archived |
| **Type** | Single-select: any of the six approval types |
| **Owner** | Dropdown populated from distinct owners in the loaded workflow set |
| **Created date range** | From / To date pickers |
| **Updated date range** | From / To date pickers |

#### 7.1.3 Per-Row Actions

| Action | Available When | Description |
|---|---|---|
| **View** | All statuses | Open in read-only mode |
| **Edit** | Draft or Paused only | Open in edit mode |
| **Duplicate** | All statuses | Create a Draft copy with a new system-assigned Policy Code |
| **Archive** | Draft, Active, or Paused | Move to Archived state permanently |
| **Delete** | Draft only | Permanently remove. Requires confirmation dialog. |

- `BR-005` Delete is irreversible. The system presents a confirmation prompt naming the workflow before proceeding.
- `BR-006` Archived workflows can be duplicated but never directly edited or re-activated.

#### 7.1.4 Bulk Operations

Users can select multiple rows using checkboxes and apply:

| Bulk Action | Eligibility |
|---|---|
| **Bulk Archive** | Any non-Archived workflow |
| **Bulk Duplicate** | Any workflow, regardless of status |
| **Bulk Delete** | Draft workflows only |

- `BR-007` Bulk Delete silently skips non-Draft workflows in the selection; it does not error.

#### 7.1.5 Summary Side Panel

Clicking a workflow name opens a slide-in side panel showing a read-only snapshot of all key settings, plus quick-action buttons (Edit, Archive, Duplicate). This allows policy review without full-page navigation.

---

## 8. Feature Specification: Wizard — Step 1 Basic Details

Step 1 establishes the workflow's identity, applicability, and governance classification.

### 8.1 Setup Mode

| Mode | Effect |
|---|---|
| **Quick Setup** | Minimal field set. Advanced options hidden. Suitable for standard, single-step workflows. Flow type limited to: Single, Sequential, Parallel, Conditional. |
| **Detailed Setup** | All fields and advanced options visible. Required for multi-stage, conditional, or complex workflows. |

Switching mode after configuration does not delete existing data — it only changes which fields are visible.

### 8.2 Identity Fields

| Field | Validation | Notes |
|---|---|---|
| **Policy Code** | System-generated on first save (e.g. `APR-0001`). Read-only thereafter. | Globally unique identifier |
| **Workflow Name** | Required. Max 100 characters. Must be unique per domain + document type combination. | `BR-008` |
| **Description** | Optional. Max 255 characters. | Free text |
| **Category** | Optional free text. | Grouping label for reporting |
| **Tags** | Multi-value. Each tag max 50 characters. No duplicates within the same workflow. | `BR-009` |

### 8.3 Applicability Fields

| Field | Validation | Notes |
|---|---|---|
| **Business Domain** | Required. | Procurement, Sales, Inventory, Service |
| **Document Type** | Required. Options filtered by selected Domain. | Changing Domain resets Document Type — `BR-010` |
| **Entity / Company** | Optional. | Leave blank for all entities |
| **Approval Granularity** | Required. Default: Header. | Header, Line, or Hybrid |
| **Scope Level** | Required. Default: Global. | Global, Organisation, Branch, Department, Role, User, Custom, Region |
| **Scope Values** | Required when Scope Level is not Global. No duplicates. | Multi-select. Options dynamically driven by Scope Level. — `BR-011` |

### 8.4 Governance Fields

| Field | Validation | Notes |
|---|---|---|
| **Policy Priority** | Required. Positive integer. Must not conflict with another Active workflow of the same domain, document type, scope level, and scope values. | `BR-012` Lower number = higher priority |
| **Policy Owner** | Optional. Must be an active system user if provided. | Receives SLA breach and failure alerts |
| **Owner Team** | Optional. | Organisational team grouping |
| **Priority** | Required. Default: Medium. | Low, Medium, High, Critical — affects notification urgency and SLA defaults |
| **Visibility** | Required. Default: Team only. | Private, Team only, Organization-wide, Specific roles/users |
| **Approval Type** | Required. Shown as selectable cards with description and recommended use case. | Single, Sequential, Parallel, Conditional, Fallback, Multi-level |

### 8.5 Acceptance Criteria

- AC-001: Submitting Step 1 with a duplicate workflow name for the same domain + document type combination displays a field-level error and blocks progression.
- AC-002: Changing Business Domain clears Document Type and all dependent downstream configuration (Scope Values remain).
- AC-003: Policy Code is auto-generated on first save and remains immutable for the lifetime of the workflow.
- AC-004: Priority conflict with an existing Active workflow at the same scope raises a field-level error.

---

## 9. Feature Specification: Wizard — Step 2 Trigger and Data Capture

Step 2 defines when the approval process starts, what document data is preserved for audit, and whether the document qualifies for approval at all.

### 9.1 Submission Trigger Mode

| Mode | Description | Additional Required Field |
|---|---|---|
| **User Submit** | Approval begins when a user clicks "Submit for Approval" on the document. | None |
| **System Event** | Approval begins when a designated system event fires (e.g. On Save, On Status Change, On Amount Change). | System Event selector |
| **API** | An external system triggers approval via an API call. | API Trigger Key (uppercase alphanumeric, underscore, hyphen; 1–100 chars) — `BR-013` |

### 9.2 Approval Granularity

Granularity is set in Step 1 but determines which fields are required in Step 2:

- **Line or Hybrid** → Line Fields to Capture is mandatory
- **Header only** → Line Fields to Capture is hidden

### 9.3 Data Capture (Snapshot Configuration)

| Setting | Options | Description |
|---|---|---|
| **Snapshot Mode** | Snapshot / Live | Snapshot: document data frozen at capture point. Live: approvers always see the current document state. |
| **Snapshot Capture Point** | On Submit / On Trigger Event / On First Approval Step | When the frozen copy is taken. Required when Snapshot Mode = Snapshot. |
| **Header Fields to Capture** | Multi-select (documentNo, documentDate, requester, department, supplier, branch, priority, amount) | At least one required. |
| **Line Fields to Capture** | Multi-select (lineNo, itemCode, itemDescription, uom, qty, rate, lineAmount, remarks) | Required for Line / Hybrid granularity. |
| **Include Related Fields** | Toggle | Whether to capture data from linked master records (e.g. Supplier Type from Supplier Master). |
| **Related Fields to Capture** | Multi-select | Required when Include Related Fields = Yes. |

### 9.4 Entry Criteria

Entry Criteria determine whether a submitted document actually requires approval. If not met, the document bypasses the workflow.

#### 9.4.1 Entry Criteria Types

| Type | Description | Best For |
|---|---|---|
| **Condition** | Visual row-by-row rule builder. Field + Operator + Value. Combine with AND / OR. | Simple threshold checks (e.g. amount > 500,000) |
| **Formula** | Free-form calculated expression. Live test result (True / False / Error) shown inline. | Computed financial logic |
| **Approval Eligibility Matrix** | Multi-factor matrix mapping combinations of field values to approval requirements. | Multi-dimensional routing |
| **Hybrid** | Combines any of the above types. | Advanced policies with layered criteria |

#### 9.4.2 Condition Builder Detail

| Element | Options |
|---|---|
| **Operator** | > (greater than), >= (greater than or equal), = (equal to), != (not equal to), <= (less than or equal), < (less than), contains, between |
| **Comparison Type** | Literal value, Reference to another field, Expression |
| **Join Logic** | AND or OR between rows |
| **Null Handling** | Fail (treat null as evaluation error), Treat as blank, Skip (ignore the condition row) |
| **Priority** | Numeric priority for row ordering |
| **Effective Date Range** | Optional. Row applies only within the specified date window. |

#### 9.4.3 Rule Output Settings

| Setting | Options | Description |
|---|---|---|
| **Rule Output When Matched** | Approval Required / Approval Not Required / Route to Matrix | What happens when criteria are satisfied |
| **Re-evaluate on Edit** | Yes / No | If the document is edited after submission, re-run entry criteria. If criteria no longer pass, the approval is invalidated. — `BR-014` |
| **No Match Handling** | Approval Not Required / Block Submission / Send to Manual Review | What happens when no rule matches and no default exists |
| **Condition Logic** | AND / OR / Custom Logic | How rows are combined |

#### 9.4.4 Input Set (for Formula and Matrix modes)

| Field | Description |
|---|---|
| **Input Set Name** | Logical name for this group of rule inputs |
| **Input Code** | Unique identifier for each input. Codes must be unique within the set. — `BR-015` |
| **Data Type** | Number, Text, Date, Boolean, Lookup |
| **Source Type** | Record (from document), Related (from linked record), Context (runtime context), Constant, Derived |
| **Source Mapping** | Field path or expression for Record, Related, and Derived types |
| **Constant Value** | Required when Source Type = Constant |
| **Default Value** | Fallback value when Null Handling = Use Default |
| **Null Handling** | Error, Zero (numeric null → 0), False (boolean null → false), Skip, Use Default |
| **Mandatory for Evaluation** | Whether the rule fails if this input resolves to null |

#### 9.4.5 Derivation Rules

Derivation Rules compute new output values from input values before the decision table or formula is evaluated.

| Field | Description |
|---|---|
| **Derived Output Code** | Identifier for the derived variable |
| **Derivation Expression** | Mathematical or logical expression using input codes |
| **Evaluation Order** | Execution sequence when multiple derivation rules exist |

### 9.5 Submission Settings

| Setting | Description |
|---|---|
| **Require Remarks Per Line** | For Line or Hybrid granularity: submitter must enter a remark on each line before the Submit button is enabled. |
| **Require Attachments on Submission** | Submitter must upload at least one attachment before submission is accepted. |

### 9.6 Acceptance Criteria

- AC-005: API Trigger Key must match the pattern `[A-Z0-9_-]{1,100}`. Any other value is rejected with a field error.
- AC-006: At least one Header Field must be selected; the system blocks progression if this is empty.
- AC-007: When Include Related Fields = Yes and no related fields are selected, the system shows a validation error.
- AC-008: When Re-evaluate on Edit = Yes and a document edit causes entry criteria to fail, the approval is cancelled, the document returns to draft, and an Invalidation event is written to the audit trail.

---

## 10. Feature Specification: Wizard — Step 3 Approver Configuration

Step 3 defines who approves the document, in what structure, and how missing or unavailable approvers are handled.

### 10.1 Setup Mode Effect

| Mode | Approver Config Behaviour |
|---|---|
| **Quick Setup** | Single stage, single step. Stage execution mode hidden. |
| **Detailed Setup** | Multiple stages and multiple steps per stage. Stage execution mode exposed. |

### 10.2 Stage and Step Structure

| Level | Definition |
|---|---|
| **Stage** | A logical grouping of steps. Stages always execute sequentially. A stage is complete when all its steps meet their required approvals. |
| **Step** | One approval task within a stage. Each step is assigned to one or more approvers via a Resolution Type. |

#### 10.2.1 Stage Execution Modes (Detailed Setup only)

| Mode | Description |
|---|---|
| **Sequential** | Steps within the stage execute one after another |
| **Parallel** | All steps in the stage are activated simultaneously |
| **Any-One** | Stage complete as soon as any one step in it is approved |
| **All** | Every step in the stage must be individually approved |

#### 10.2.2 Step Configuration Fields

| Field | Validation | Description |
|---|---|---|
| **Stage Name** | Required in Detailed Setup | Labels the stage in notifications and audit trail |
| **Stage Sequence** | Required. Positive integer. | Order of stage execution |
| **Step Name** | Required. Must be unique within the workflow. | Labels the step in notifications and the approval inbox |
| **Step Sequence** | Required. Positive integer. | Order within a stage |
| **Step Description** | Optional | Context for the approver |

### 10.3 Resolution Types

Resolution Type defines how the system identifies the approver(s) for a step at runtime.

| Type | Configuration Required | Description |
|---|---|---|
| **Role** | Role name | Any user holding the specified role can approve |
| **User** | One or more specific user names | Named individuals only |
| **Queue** | Queue name | A shared pool; any member can claim and approve the task |
| **Hierarchy** | Manager Level (integer ≥ 1) | N levels up the submitter's reporting chain |
| **Approver Routing Matrix** | Matrix reference | Looks up the correct approver by matching document attributes against a pre-configured matrix |
| **Attribute Rule** | Rule reference | A rule expression derived from document fields identifies the approver at runtime |

### 10.4 Required Approvals Mode

When a step is assigned to multiple approvers, this setting governs how many approvals are needed to complete the step.

| Mode | Description |
|---|---|
| **ALL** | Every assigned approver must approve |
| **ANY** | The first approval from any assigned approver completes the step |
| **N-of-M** | A specific count (N) out of the total (M) assigned approvers must approve. N must be a positive integer ≤ M. — `BR-016` |

### 10.5 Fallback Chain

For each step, a fallback chain handles situations where no matching approver can be found.

| Setting | Description |
|---|---|
| **Fallback Chain entries** | Priority-ordered list. Each entry has a Type (Queue, Role, User, Admin) and a Value. |
| **Final Fallback Owner** | The last resort when all fallback entries are also unresolvable. Required when Missing Approver Action = Use Fallback Chain. |
| **Missing Approver Action** | Use Fallback Chain / Block Submission / Send to Admin Queue |

- `BR-017` A fallback chain must have at least one fully configured entry when Missing Approver Action = Use Fallback Chain.

### 10.6 Additional Governance Settings

| Setting | Default | Description |
|---|---|---|
| **Approver Availability Check** | On | Validates that the resolved approver is an active user before assignment |
| **Segregation of Duties** | On | Blocks the requester from being in the approval queue for their own document — `BR-018` |
| **Allow Requester in Approval Queue** | Off | Override for the segregation rule. Turning this on generates a configuration warning. |
| **Delegation Allowed** | Off | Whether approvers can delegate their tasks to others |
| **Delegation Source** | — | User Delegation, Role Delegation, or System Delegation Rule. Required when Delegation Allowed = Yes. |
| **Reassignment Allowed** | Off | Whether tasks can be reassigned to a different person |
| **Reassignment Authority** | — | Current Approver, Admin, Policy Owner, or Same Role Manager. Required when Reassignment Allowed = Yes. |
| **Bulk Approval Allowed** | Off | Whether approvers can action multiple tasks in one operation |
| **Max Bulk Approval Count** | — | Positive integer. Required when Bulk Approval Allowed = Yes. — `BR-019` |

### 10.7 Acceptance Criteria

- AC-009: Step Name must be unique across all steps in the workflow. Duplicate names are blocked on save.
- AC-010: For N-of-M Required Approvals, N must be a positive integer. If Total Approver Count is provided, N must not exceed it.
- AC-011: When Segregation of Duties is On and a step's User resolution includes the requester's name, the system shows a validation error on the checklist.

---

## 11. Feature Specification: Wizard — Step 4 Rules and Decision Logic

Step 4 configures the decision tables, rule sets, and derivation logic that determine — at runtime — whether approval is required and, if so, how the document should be routed.

### 11.1 DMN Decision Table

The Decision Table is an industry-standard DMN (Decision Model and Notation) format for encoding complex multi-variable business decisions.

#### 11.1.1 Decision Table Structure

| Component | Description |
|---|---|
| **Table Name** | Logical name for the decision table (e.g. "PO Value Routing") |
| **Version** | Integer. Increments on each activation. |
| **Status** | Draft, Active, Retired |
| **Input Columns** | Document fields evaluated as conditions (e.g. amount, department) |
| **Output Columns** | Values the table produces when a row matches (e.g. approvalPath, requiredRole, autoApproveFlag) |
| **Decision Rows** | Each row: Condition Expression + Output Value + Priority + Optional Effective Date Range |

#### 11.1.2 Hit Policies

Hit Policy determines how the engine behaves when more than one row matches.

| Hit Policy | Description | Use Case |
|---|---|---|
| **FIRST_MATCH** | Use the first matching row; ignore all subsequent. | Ordered priority rules where earlier rows override later ones. |
| **PRIORITY** | Among all matching rows, use the one with the lowest priority number. | Rules with explicit precedence rankings. |
| **ALL_MATCH** | Apply all matching rows' outputs. | Scenarios where multiple actions must all occur (e.g. notify multiple teams). |
| **COLLECT** | Aggregate numeric outputs from all matching rows (sum, min, max, count). | Threshold computations derived from multiple matching conditions. |

- `BR-020` Under FIRST_MATCH or PRIORITY, duplicate row conditions trigger a validation warning (not an error) that is surfaced in the pre-publish checklist.
- `BR-021` PRIORITY hit policy requires every row to have a unique, positive integer priority. Duplicate priorities are rejected on save.

#### 11.1.3 Overlap and Gap Detection

| Check | Description | Trigger |
|---|---|---|
| **Overlap Detection** | Identifies rows with identical condition expressions under FIRST_MATCH or PRIORITY hit policies | Runs on save; result shown in publish validation checklist |
| **Gap Detection** | Identifies input combinations that no row covers | Optional; shown as Warning in checklist |
| **Default Row** | A catch-all row with no conditions that applies when nothing else matches | Recommended; absence generates a Warning |

#### 11.1.4 Row Effective Date Range

Each decision row can be scoped to a date range. At runtime, only rows whose date range includes the submission date are evaluated.

- `BR-022` When a row's effective date range has expired, the row is silently skipped. If no other row matches, No Match Handling applies.

### 11.2 Test Mode (Rule Simulation)

Before publishing, administrators can validate rule logic in the wizard:

| Feature | Description |
|---|---|
| **Sample Data Source** | Manual Entry, Existing Record, or Uploaded Sample |
| **Sample Data Input** | JSON or field-value form input matching the decision table's input columns |
| **Rule Result Preview** | Computed output: Approval Required / Approval Not Required / Manual Review / Block Submission / Error |
| **Decision Trace** | The specific row(s) matched, and the output values produced, displayed step by step |

### 11.3 Rule Validation Checklist

The wizard displays a live validation checklist for Step 4, covering:

- Entry Criteria Type selected
- Rule Set Name entered
- Input Set Name entered
- Input Codes are unique
- All Input Data Types selected
- All Source Types selected
- Source Mappings valid
- Constant Values provided where Source Type = Constant
- Null Handling valid (default value set when Null Handling = Use Default)
- Condition rows valid (field, operator, value, action all populated)
- Formula expression present if Formula type selected
- Derivation rules fully configured (output code and expression both populated)
- Decision Table name, input columns, output columns, and rows all present and valid
- Hit Policy selected for decision tables
- Overlap detection passed
- No Match Handling selected

All items must pass before the Step 4 validation is considered complete.

### 11.4 Acceptance Criteria

- AC-012: A decision table cannot be set to Active status with zero decision rows.
- AC-013: Rule Simulation produces a Decision Trace output that names every row evaluated and the matching row(s) applied.
- AC-014: When Null Handling = Use Default and no default value is provided, the validation checklist shows a failure for that input row.
- AC-015: Changing the Hit Policy after rows are entered does not delete rows but triggers re-validation.

---

## 12. Feature Specification: Wizard — Step 5 Actions and Notifications

Step 5 defines what happens automatically at each approval event, who is notified, and how.

### 12.1 Event-Driven Action Model

Approval Studio uses a publish-subscribe model. Each Action is attached to one Trigger Event.

#### 12.1.1 Trigger Events

| Event | Fires When |
|---|---|
| **OnSubmit** | Document is successfully submitted for approval |
| **StepApprove** | Any individual step is approved |
| **StepReject** | Any individual step is rejected |
| **FinalApprove** | Last required step is approved; workflow reaches successful conclusion |
| **FinalReject** | A step rejection triggers a terminal rejection of the workflow |
| **Timeout** | An SLA timer expires without a decision |
| **Recall** | Requester withdraws the document |

#### 12.1.2 Action Types

| Type | Configuration Fields | Description |
|---|---|---|
| **Field Update** | Field to Update, Update Value | Sets a document field to a specified value (e.g. Status = "Approved") |
| **Notify** | See Notification Config | Sends a notification to configured recipients |
| **API** | Endpoint URL, HTTP Method, Headers, Payload Template, Retry Policy, Timeout | Calls an external API — `BR-023` |
| **Lock** | — | Locks the document according to the Record Lock Policy |
| **Unlock** | — | Removes the document lock |
| **Task** | Task Template | Creates a follow-up task assigned to a specified user or role |
| **Script** | Script Action reference | Executes a named server-side business logic script |

#### 12.1.3 API Action Detail

| Field | Validation | Notes |
|---|---|---|
| **Endpoint URL** | Must use HTTPS | `BR-023` HTTP endpoints rejected on save |
| **HTTP Method** | GET, POST, PUT, PATCH | |
| **Headers** | Key-value pairs | Includes authorisation headers |
| **Payload Template** | JSON with `{{placeholder}}` variables | Template variables resolved at runtime |
| **Retry Policy** | None, Fixed, Exponential | |
| **Retry Count** | Positive integer | Used when Retry Policy is not None |
| **Failure Handling** | Reject / Hold Pending / Manual Review / Retry Later | What to do if all retries fail |
| **Idempotency Key Rule** | Expression or constant | Prevents duplicate API calls on retry |

- `BR-024` API action failures do not roll back the approval decision. Failures are logged in the audit trail and handled per the Failure Handling setting.

### 12.2 Notification Configuration

#### 12.2.1 Notification Events

| Event | When Triggered |
|---|---|
| **Submitted** | Document enters the approval queue |
| **Assigned** | A step is assigned to an approver |
| **Approved** | A step is approved |
| **Rejected** | A step is rejected |
| **Recalled** | Document is recalled by the requester |
| **Escalated** | Task escalates due to SLA breach |
| **Timed Out** | SLA deadline passes without action |
| **Failed** | An action or routing step fails |
| **Final Approved** | The workflow concludes with full approval |
| **Final Rejected** | The workflow concludes with rejection |

#### 12.2.2 Notification Channels

| Channel | Toggle |
|---|---|
| **In-App** | Enabled by default |
| **Email** | Optional |
| **SMS** | Optional |
| **WhatsApp** | Optional |

#### 12.2.3 Notification Recipients

Any combination of: Requester, Current Approver, Previous Approver, Next Approver, Policy Owner, Admin, Custom User, Role, Queue.

#### 12.2.4 Notification Settings

| Setting | Description |
|---|---|
| **Template Mapping** | Reference to a notification template defined in the Notification Master |
| **Notification Language** | Default (tenant setting), User Preferred, or Specific Language |
| **Digest Notification** | Batches notifications on a schedule (Hourly, Daily, Weekly) rather than per event |

### 12.3 Attachment Requirements

| Setting | Description |
|---|---|
| **Decision Attachment Required** | Whether an attachment is mandatory at decision time |
| **Attachment Required Events** | Approve, Reject, Recall, and/or Reassign |
| **Allowed File Types** | PDF, JPG, PNG, DOCX, XLSX (multi-select) |
| **Maximum File Size (MB)** | Positive integer |

### 12.4 Remarks Requirements

| Setting | Default | Description |
|---|---|---|
| **Remarks Required on Approve** | Off | Approver must enter remarks before confirming approval |
| **Remarks Required on Reject** | On | Approver must enter remarks before confirming rejection |
| **Remarks Required on Recall** | On | Requester must enter remarks before confirming recall |
| **Bulk Action Remarks Required** | On | Remarks required when using bulk approve or bulk reject |

### 12.5 SLA Configuration

| Setting | Description |
|---|---|
| **SLA Enabled** | Toggle. When off, all SLA settings are hidden. |
| **SLA Duration** | Numeric value |
| **SLA Unit** | Hours or Days |
| **SLA Calendar** | Business Calendar (respects working hours and holidays) or 24x7 Calendar |
| **Reminder Before Due** | Toggle. Sends a reminder before the SLA deadline. |
| **Reminder Time Before Due** | How far in advance to send the reminder (same unit as SLA) |
| **Escalation Policy** | Reference to an escalation rule set |
| **Escalation Level Count** | Number of escalation levels before auto-action |
| **Auto Action on Timeout** | None / Auto Approve / Auto Reject / Escalate Only — `BR-025` |
| **Timeout Justification** | Mandatory text when Auto Action = Auto Approve, documenting the business reason |

### 12.6 Acceptance Criteria

- AC-016: An API action with an HTTP (non-HTTPS) endpoint is rejected on save with a field error.
- AC-017: When Auto Action = Auto Approve, a Timeout Justification text field is mandatory and the option is only available to System Administrators.
- AC-018: Digest Notification requires Digest Frequency to be selected. If not selected, the checklist shows a failure.

---

## 13. Feature Specification: Wizard — Step 6 Publish and Activation

Step 6 is the final gateway before a workflow becomes live. It provides a comprehensive pre-flight check, version management, and activation options.

### 13.1 Pre-Publish Validation

The system runs an automated validation checklist before publishing is allowed. Each item shows a Pass, Fail, or Warning status.

#### 13.1.1 Basic Details Checklist

- Policy Name is unique for the domain + document type
- Business Domain and Document Type selected
- Scope Level and Scope Values valid
- Policy Priority set with no conflict against existing Active workflows
- Approval Type selected

#### 13.1.2 Trigger Checklist

- Submission Trigger Mode selected
- API Trigger Key valid (if API mode)
- At least one Header Field selected
- Line Fields selected (if Line or Hybrid granularity)
- Snapshot Mode selected
- Snapshot Capture Point selected (if Snapshot Mode = Snapshot)
- Entry Criteria Type selected

#### 13.1.3 Approver Configuration Checklist

- Approval Flow Type selected
- At least one step exists
- Step Names are unique
- Required Approvals Mode selected for all steps
- N-of-M count valid (if used)
- Resolution Type selected for all steps
- Relevant resolution target configured per Resolution Type (role / user / queue / manager level / matrix / attribute rule)
- Fallback chain configured (if Missing Approver Action = Use Fallback Chain)
- Segregation of Duties validation passed
- Delegation Source selected (if Delegation Allowed)
- Reassignment Authority selected (if Reassignment Allowed)
- Max Bulk Count valid (if Bulk Approval Allowed)

#### 13.1.4 Rules Checklist

- Entry Criteria Type selected
- Rule Set Name and Input Set Name provided
- Input Codes unique
- All data types, source types, and source mappings valid
- Condition, formula, or decision table rows valid per selected type
- Hit Policy selected for decision tables
- Overlap detection passed (FIRST_MATCH / PRIORITY)
- No Match Handling selected

#### 13.1.5 Actions Checklist

- All API action endpoints use HTTPS
- Timeout Justification provided (if Auto Approve on Timeout)
- Digest Frequency selected (if Digest Notification enabled)

**Behaviour:** Items marked **Fail** block publishing. Items marked **Warning** are advisory — the Policy Owner must acknowledge them but can still proceed.

- `BR-026` Publishing is blocked if any checklist item has status Fail.
- `BR-027` All Warnings must be explicitly acknowledged via a checkbox before the Publish button activates.

### 13.2 Workflow Conflict Detection

Before activation, the system checks for scope overlaps with existing Active workflows:

- `BR-028` If another Active workflow exists for the same domain, document type, scope level, scope values, and same or overlapping priority, a Warning is raised identifying the conflicting workflow by name and policy code.

### 13.3 Activation Options

| Setting | Description |
|---|---|
| **Activation Type** | Activate Now or Schedule for Later |
| **Effective From** | Date and time for scheduled activation (required when Schedule for Later) |
| **Effective Time Zone** | Tenant default, Asia/Kolkata, or UTC |
| **Version Action** | Create New Active Version / Replace Existing Active Version / Schedule New Version |
| **Retire Previous Version** | Toggle. When on, the currently Active version of this workflow is archived on activation. Default: On. |
| **Change Log** | Free text. Records what changed in this version. |
| **Activation Notes** | Internal notes for the audit trail. |
| **User Confirmation** | Checkbox: the Policy Owner confirms they have reviewed all settings. Required before publishing. |

### 13.4 Acceptance Criteria

- AC-019: The Publish Now button is disabled until all Fail items are resolved and all Warnings acknowledged.
- AC-020: Scheduled activation fires at the configured effective datetime in the selected time zone.
- AC-021: On activation, the system creates an immutable Activation audit record containing: version number, activating user, timestamp, change log, and activation notes.
- AC-022: When Retire Previous Version = On, the previous Active version moves to Archived state as an atomic operation with the new version's activation.

---

## 14. Feature Specification: Advanced Governance Controls

### 14.1 Record Lock and Edit Policies

#### 14.1.1 Record Lock Policy

Controls whether documents are editable while under approval.

| Policy | Description |
|---|---|
| **Do Not Lock** | Document remains fully editable throughout the approval process |
| **Lock on Submit** | Document locked the moment it enters the approval queue *(system default)* |
| **Lock on Step Approval** | Document locked after the first step is approved |
| **Lock on Final Approval** | Document locked only upon reaching Final Approved status |

#### 14.1.2 Edit During Approval Policy

| Policy | Description |
|---|---|
| **No Edit** | No fields can be changed while approval is in progress *(system default)* |
| **Allow Edit with Invalidation** | Saving any edit resets the entire approval. Document must be resubmitted from Step 1. — `BR-029` |
| **Allow Edit without Invalidation** | Only non-approval-sensitive fields can be edited. Approval-sensitive fields remain locked. — `BR-030` |

#### 14.1.3 Unlock and Invalidation Settings

| Setting | Default | Description |
|---|---|---|
| **Unlock on Rejection** | On | Lock released automatically when a step rejection triggers the rejection policy |
| **Unlock on Recall** | On | Lock released automatically when the requester recalls |
| **Invalidation Enabled** | Off | Whether edits can trigger invalidation at all |
| **Invalidation Triggers** | — | Specific fields or events that trigger invalidation when changed |
| **Invalidation Strategy** | Invalidate Impacted Lines / Invalidate Whole Request | Scope of reset when invalidation fires |
| **Auto Resubmit on Save** | Off | If on, saving an edit that triggers invalidation automatically resubmits without requiring the user to click Submit again |
| **Resubmission Requires Remarks** | On | User must explain the reason for editing when resubmission occurs |

### 14.2 SLA and Escalation

Configured in Step 5 but detailed here for completeness.

- `BR-031` SLA timers are paused outside Business Calendar hours when SLA Calendar = Business Calendar.
- `BR-032` SLA timers resume from the elapsed position (not reset) when a task is delegated, reassigned, or escalated to a fallback approver.
- `BR-033` Auto Approve on Timeout can only be configured by a System Administrator. Policy Owners see the option as disabled.
- `BR-034` Every Auto Approve event generates an audit record with actor = "System" and the triggering rule name.

### 14.3 External Approval via Secure Link

Allows approvers outside the IDMS system to review and decide on documents via a one-time secured URL.

#### 14.3.1 External Approval Modes

| Mode | Description |
|---|---|
| **Secure Link** | Approver accesses a secure hosted page without logging in. Identity confirmed via OTP. |
| **Login Required** | External approver must have an IDMS guest account and authenticate before accessing the approval page. |

#### 14.3.2 Secure Link Settings

| Setting | Description |
|---|---|
| **Approve via Secure Link** | Toggle to enable |
| **Token TTL** | Expiry time in minutes from link issuance. Default: 120. |
| **OTP Required** | Toggle. Default: On. |
| **OTP Channel** | SMS, Email, or WhatsApp |
| **Max OTP Attempts** | Number of failed OTP entries before the link is permanently locked. Default: 3. |
| **Allow Link Resend** | Whether the Policy Owner can issue a replacement link after expiry or lockout. Default: On. |
| **Revoke Link on Decision** | Whether the link is immediately deactivated after the approver submits a decision. Default: On. |

- `BR-035` A secure link is single-use by default. Once a decision is submitted, the link is immediately deactivated regardless of Revoke setting.
- `BR-036` If OTP fails the maximum number of attempts, the link is permanently locked. No further attempts are possible with that link.
- `BR-037` External approval decisions are written to the audit trail with a flag: "External Approval — Secure Link."

### 14.4 Delegation and Reassignment

#### 14.4.1 Delegation Sources

| Source | Description |
|---|---|
| **User Delegation** | Approver proactively sets up a delegation (e.g. before leave), specifying delegate, date range, and scope. |
| **Role Delegation** | Delegation applies to all users in a specified role. |
| **System Delegation Rule** | System automatically delegates based on out-of-office status and a pre-configured auto-delegate setting. |

- `BR-038` An approver cannot delegate to the document's requester when Segregation of Duties is active.
- `BR-039` When a delegation period ends, all outstanding tasks revert to the original approver. The original approver receives a re-assignment notification.

#### 14.4.2 Reassignment Authority

| Option | Who Can Reassign |
|---|---|
| **Current Approver** | The assigned approver can move the task to another eligible person |
| **Admin** | Only a System Administrator can reassign |
| **Policy Owner** | The workflow's Policy Owner can reassign |
| **Same Role Manager** | The manager of the current approver's role can reassign |

Every reassignment generates an audit record: original approver, new approver, timestamp, and reason.

### 14.5 Bulk Approval

Allows an approver to process multiple pending tasks in one action.

| Setting | Description |
|---|---|
| **Bulk Approval Allowed** | Toggle per step |
| **Max Bulk Approval Count** | Upper limit per batch (must be a positive integer). Configurable up to the system ceiling. |
| **Allow Bulk Reject** | Whether the bulk action can also reject tasks. Default: follows Allow Bulk Approve. |
| **Bulk Action Remarks Required** | Whether a shared remarks entry is mandatory for a bulk action |
| **Remarks Apply To** | Each document individually, or the batch record only |

- `BR-040` Bulk Approval is available only when all selected tasks are at the same step and the user is an authorised approver for that step.
- `BR-041` Each document in a bulk action generates its own individual approval record in the audit trail. The batch remarks are linked to all records.

### 14.6 Partial Approval

Applies only when Approval Granularity = Line or Hybrid.

#### 14.6.1 Partial Approval Policies

| Policy | Description |
|---|---|
| **Block All** | Any line rejection blocks the entire document. No lines proceed until all are approved. |
| **Allow Approved Only** | Approved lines proceed. Rejected lines are returned to the requester. |
| **Split Processing** | The document splits: approved lines form Document A (proceeds), rejected lines form Document B (returned). |

#### 14.6.2 Related Settings

| Setting | Description |
|---|---|
| **Header Aggregation Rule** | How header totals are recalculated after partial approval (e.g. "Header status reflects aggregate of line decisions") |
| **Rejected Line Edit Policy** | Allow Edit / View Only / Remove from Processing |

- `BR-042` Partial Approval is unavailable when Approval Granularity = Header. The setting is hidden.

### 14.7 Rejection Handling and Recall

#### 14.7.1 Rejection Handling Policies

| Policy | Description |
|---|---|
| **Block + Edit + Resubmit** | Document blocked. Requester notified. Requester may edit and resubmit. Resubmission starts approval from Step 1. *(system default)* — `BR-043` |
| **Block Permanently** | Document blocked. No further editing or resubmission allowed. Only cancellation possible. |
| **Cancel** | Document is automatically cancelled upon rejection. |

#### 14.7.2 Recall Policy

| Setting | Default | Options |
|---|---|---|
| **Recall Allowed** | On | On / Off |
| **Recall Allowed Until** | Before Final Approval | Before First Approval / Before Final Approval / Anytime Before Completion |
| **Require Remarks on Recall** | On | On / Off |

- `BR-044` Recall is permanently unavailable after a Final Approve or Final Reject decision has been recorded.
- `BR-045` When recalled, all pending approval tasks for the document are cancelled. The document returns to its pre-submission state with lock removed.

#### 14.7.3 Cancel Approval Permissions

| Setting | Description |
|---|---|
| **Cancel Approval Permission** | Multi-select: Requester, Policy Owner, Admin, Approver |

---

## 15. Feature Specification: End-User Approval Experience

### 15.1 Submitting a Document for Approval

#### 15.1.1 Pre-Submission Gate

The "Submit for Approval" button on a document is rendered based on:

| Condition | Button State |
|---|---|
| Document is in an editable state | Button visible |
| User has submission rights | Button visible |
| All mandatory document fields are complete | Button enabled |
| Required attachments uploaded (if configured) | Button enabled |
| No active workflow found for this document type + scope | Button visible; submission proceeds but bypasses approval — `BR-046` |

#### 15.1.2 Submission Flow

1. User clicks **Submit for Approval**.
2. System shows a confirmation dialog: workflow name, first approver or group (if determinable), estimated SLA.
3. User confirms.
4. Entry Criteria evaluated. If not met → document marked "Approval Not Required" and advances.
5. If Entry Criteria met → Snapshot captured (per snapshot policy).
6. Step 1 approver(s) resolved and notified.
7. Document status → **Pending Approval**. Record locked per lock policy.
8. Submit button replaced by **Approval Status** panel showing step, approver, and SLA countdown.

- `BR-046` When no matching Active workflow is found, the submission is recorded in the audit trail as "No Matching Workflow — Approval Bypassed."
- `BR-047` If the system cannot resolve the approver for Step 1 (e.g. empty routing matrix row), the document enters "Pending Manual Assignment" and the Policy Owner is alerted.

### 15.2 Approval Inbox

The Approval Inbox aggregates all tasks assigned to the current user across all workflows and document types.

#### 15.2.1 Inbox Columns

| Column | Description |
|---|---|
| **Document** | Document number and type, click to open |
| **Requester** | Submitter's name |
| **Submitted On** | Date and time of submission |
| **Workflow** | Name of the active workflow |
| **Step** | Current step name |
| **Priority** | Task urgency badge |
| **SLA Due** | Countdown. Colour coded: green (on track), amber (warning threshold reached), red (breached). |
| **Status** | Pending, Action Required, Escalated, Waiting for Others |

#### 15.2.2 Inbox Filters

| Filter | Options |
|---|---|
| **Document Type** | By module or specific document type |
| **Priority** | Low, Medium, High, Critical |
| **SLA Status** | All, On Track, Warning, Overdue |
| **Submission Date Range** | From / To |

### 15.3 Approving a Document

1. Approver opens the document from the inbox or a notification link.
2. **Approval Action Panel** appears alongside the document showing:
   - Workflow name and step name
   - Snapshot data (with change highlights if the document was edited after snapshot)
   - Approval history: previous approvers, their decisions, timestamps, and remarks
   - SLA countdown
3. Approver reviews content, optionally enters remarks (mandatory if Remarks Required on Approve = On).
4. Approver clicks **Approve**.
5. If more steps remain → next step approver(s) notified. If final step → document advances to Final Approved status.

### 15.4 Rejecting a Document

1. Approver clicks **Reject** in the Approval Action Panel.
2. Rejection dialog appears.
3. Remarks are mandatory (if Remarks Required on Reject = On). Confirm button disabled until remarks entered.
4. Approver confirms.
5. Configured Rejection Handling Policy applied:
   - **Block + Edit + Resubmit**: Lock released; requester notified; document editable and resubmittable.
   - **Block Permanently**: Document blocked; only cancellation available.
   - **Cancel**: Document auto-cancelled; requester notified.

- `BR-048` Rejection remarks are always stored in the audit trail, regardless of whether the remarks field was mandatory. When left blank, the audit record notes "No remarks provided."

### 15.5 External Link Approval

1. External approver receives email / SMS / WhatsApp containing a secure link and document summary.
2. Approver clicks the link → lands on the IDMS Secure Approval page (no login required).
3. If OTP required: OTP sent to configured channel. Approver enters OTP.
4. Page displays document summary and **Approve / Reject** buttons.
5. Approver selects decision, optionally enters remarks, confirms.
6. Confirmation page displayed. Link immediately deactivated.
7. Decision recorded in audit trail with "External Approval — Secure Link" flag.

### 15.6 Recalling a Document

1. Requester navigates to the submitted document.
2. **Recall** button visible when recall is currently permitted per recall policy.
3. Recall dialog appears. Remarks mandatory if Remarks Required on Recall = On.
4. Requester confirms.
5. All pending approval tasks cancelled. Assigned approvers notified.
6. Document unlocked (if Unlock on Recall = On). Status → Draft (or pre-submission status).

- `BR-049` Recall resets all approval progress. On resubmission, the full workflow restarts from Step 1.

### 15.7 Approval Status Panel

While a document is under approval, requesters see a persistent status panel on the document page showing:

| Element | Description |
|---|---|
| **Workflow Name** | Active workflow applied to this document |
| **Current Step** | Step name and stage |
| **Current Approver(s)** | Name(s) or role of assigned approver(s) |
| **SLA Due** | Countdown with colour coding |
| **Approval History** | Collapsed timeline of all previous decisions |
| **Recall Button** | Visible if recall is currently permitted |

### 15.8 Audit Trail

The Approval Audit Trail is the immutable, append-only record of every event in the lifecycle of a document's approval.

#### 15.8.1 Audit Record Fields

| Field | Description |
|---|---|
| **Event Type** | Submit, Step Approve, Step Reject, Final Approve, Final Reject, Recall, Cancel, Escalation, Delegation, Reassignment, Timeout, Auto Approve, Invalidation, External Link Issued, External Link Used, External Link Expired, System Override |
| **Timestamp** | UTC and local time |
| **Actor** | Name of user or "System" with rule name for automated events |
| **Step / Stage** | Which step and stage the event belongs to |
| **Decision** | Approved, Rejected, Recalled, Escalated, etc. |
| **Remarks** | Actor's remarks, or "No remarks provided" |
| **IP Address** | Origin IP (external IP for secure link approvals) |
| **Snapshot Reference** | Link to the frozen document snapshot for this event |
| **External Flag** | Marked when decision was made via Secure Link |

#### 15.8.2 Audit Trail Access

| Role | Access Level |
|---|---|
| System Administrator | Full audit trail across all documents |
| Policy Owner | Full trail for documents under their workflows |
| Approver | Trail for documents they have been involved in |
| Requester | Trail for their own submitted documents |
| Auditor | Full read-only access across all documents |

- `BR-050` Audit trail records are append-only. No user — including System Administrators — can edit or delete audit entries.
- `BR-051` Audit trail data must be retained for a minimum configurable period (default: 7 years). Data remains accessible even after a workflow is archived.

---

## 16. Business Domain Coverage

### 16.1 Procurement

| Document Type | Supported Approval Scenarios | Key Entry Criteria |
|---|---|---|
| **Purchase Requisition** | Department Head approval before PO creation. Finance countersign for capital items. | Total estimated value, department, item category |
| **Purchase Return Requisition** | Warehouse and supplier compliance review | Return value, reason code |
| **Purchase Order** | Finance + Procurement sign-off for high-value commitments. Sequential approval for CAPEX. | Order value, vendor category, purchase type (CAPEX / OPEX) |
| **Purchase Receipt (GRN)** | Quality Controller confirmation of goods received before invoice matching. | Supplier type, received value, inspection result |
| **Purchase Invoice** | Finance approval for invoice-PO-GRN three-way match exceptions. Payment release. | Invoice amount, match status, payment terms |
| **Purchase Return** | Warehouse and Finance approval to reverse stock and initiate credit note. | Return value, return reason |

### 16.2 Sales

| Document Type | Supported Approval Scenarios | Key Entry Criteria |
|---|---|---|
| **Sale Order** | Sales Manager approval for above-threshold discounts or key accounts. | Order value, discount percentage, customer tier |
| **Sale Return Requisition** | Customer Service Manager approval before return processing begins. | Return value, time since sale, reason |
| **Sale Allocation Requisition** | Warehouse confirmation of stock availability for prioritised allocation. | Requested quantity, available stock |
| **Sale Allocation** | Approval for allocation override or reallocation between customers. | Allocation quantity, customer priority |
| **Sale Invoice** | Finance review for special pricing, adjustments, or credit limit exceptions. | Invoice amount, applied discount, credit status |
| **Sale Return** | Finance and Operations approval for credit note issuance. | Credit value, tax implications |
| **Delivery** | Dispatch authorisation for high-value or sensitive shipments. | Delivery value, destination, transport mode |

### 16.3 Inventory

| Document Type | Supported Approval Scenarios | Key Entry Criteria |
|---|---|---|
| **Stock Transfer Requisition** | Inventory Manager approval before committing to inter-branch stock movement. | Requested quantity, item value, branch pair |
| **Stock Transfer** | Sending and receiving branch confirmation. Parallel approval pattern. | Transfer value, item category, urgency flag |
| **Stock Adjustment Requisition** | Finance and Operations pre-approval before manual stock count changes. | Adjustment type, estimated variance value |
| **Stock Adjustment** | Post-audit approval for write-offs, wastage, or damage acknowledgements. | Adjustment quantity, item value, reason code |

### 16.4 Service

| Document Type | Supported Approval Scenarios | Key Entry Criteria |
|---|---|---|
| **Appointment** | Service Manager confirmation for VIP or high-priority service appointments. | Customer tier, appointment type |
| **Job Card** | Workshop Supervisor approval when estimated labour hours or cost exceeds threshold. | Estimated hours, estimated cost |
| **Service Estimate** | Service Manager approval before estimate is sent to customer. | Estimate value, service type |
| **Service Invoice** | Finance approval for warranty claims, adjustments, or special pricing. | Invoice value, claim type, warranty status |
| **Service Invoice Return** | Credit and compliance review for service invoice reversals. | Reversal value, reason |
| **Spare Issue** | Inventory Controller approval for high-value or scarce spare parts issuance. | Part value, part category, stock level |
| **Spare Issue Return** | Warehouse confirmation and inventory recon for returned spares. | Return quantity, part value |

---

## 17. Consolidated Business Rules

The following table consolidates all business rules defined across this document. Each rule is uniquely numbered and cross-referenced to the section where it is specified in detail.

| Rule ID | Section | Rule Statement |
|---|---|---|
| BR-001 | 6.1 | A workflow cannot be published without passing all Fail-level validation checks. |
| BR-002 | 6.1 | Publishing a new version automatically archives the previous Active version of the same workflow. |
| BR-003 | 6.1 | Archived workflows cannot be reactivated. A Duplicate must be created to build on them. |
| BR-004 | 6.1 | The wizard auto-saves on every step navigation. Draft state is preserved on browser close. |
| BR-005 | 7.1 | Delete presents a confirmation prompt naming the workflow. The action is irreversible. |
| BR-006 | 7.1 | Archived workflows can be duplicated but cannot be edited or re-activated. |
| BR-007 | 7.1 | Bulk Delete silently skips non-Draft selections without raising an error. |
| BR-008 | 8.2 | Workflow Name must be unique per business domain + document type combination. |
| BR-009 | 8.2 | Tags must be unique within a workflow. Each tag is max 50 characters. |
| BR-010 | 8.3 | Changing Business Domain clears the Document Type selection and all type-dependent settings. |
| BR-011 | 8.3 | Scope Values is mandatory when Scope Level is not Global. Duplicate values are rejected. |
| BR-012 | 8.4 | Policy Priority must not conflict with an existing Active workflow at the same scope. |
| BR-013 | 9.1 | API Trigger Key must match `[A-Z0-9_-]{1,100}`. Any other value is rejected with a field error. |
| BR-014 | 9.4 | Re-evaluate on Edit: if criteria fail on edit, approval is cancelled and an Invalidation event is logged. |
| BR-015 | 9.4 | Input Codes must be unique within an Input Set. Duplicate codes are blocked on save. |
| BR-016 | 10.4 | N-of-M Required Approvals: N must be positive and must not exceed M when M is specified. |
| BR-017 | 10.5 | When Missing Approver Action = Use Fallback Chain, the fallback chain must have at least one fully configured entry. |
| BR-018 | 10.6 | Segregation of Duties: the requester's name cannot appear in a step's User resolution list when SoD is On. |
| BR-019 | 10.6 | Max Bulk Approval Count must be a positive integer when Bulk Approval Allowed = Yes. |
| BR-020 | 11.1 | Duplicate row conditions under FIRST_MATCH or PRIORITY hit policies generate a Warning in the checklist. |
| BR-021 | 11.1 | PRIORITY hit policy: every row must have a unique positive integer priority. Duplicates blocked on save. |
| BR-022 | 11.1 | Rows with expired effective date ranges are silently skipped at runtime. No Match Handling applies if nothing else matches. |
| BR-023 | 12.1 | API action endpoints must use HTTPS. HTTP endpoints are rejected on save. |
| BR-024 | 12.1 | API action failures do not roll back approval decisions. Failures are logged and handled per Failure Handling setting. |
| BR-025 | 12.5 | Auto Approve on Timeout requires a Timeout Justification and is restricted to System Administrators. |
| BR-026 | 13.1 | Publishing is blocked when any checklist item has Fail status. |
| BR-027 | 13.1 | All Warning items must be explicitly acknowledged before the Publish button activates. |
| BR-028 | 13.2 | Scope overlap with an existing Active workflow raises a Warning identifying the conflicting workflow. |
| BR-029 | 14.1 | Allow Edit with Invalidation: any save resets the entire approval. Document must be resubmitted. |
| BR-030 | 14.1 | Allow Edit without Invalidation requires explicit designation of approval-sensitive vs. non-sensitive fields. |
| BR-031 | 14.2 | SLA timers pause outside Business Calendar hours when SLA Calendar = Business Calendar. |
| BR-032 | 14.2 | SLA timers resume from the elapsed position (not reset) on delegation, reassignment, or escalation. |
| BR-033 | 14.2 | Auto Approve on Timeout is only configurable by System Administrators. |
| BR-034 | 14.2 | Auto Approve events are logged with actor = "System" and the triggering rule name. |
| BR-035 | 14.3 | A secure link is single-use. Deactivated immediately on decision submission. |
| BR-036 | 14.3 | Max OTP failures locks the link permanently. Policy Owner must re-issue. |
| BR-037 | 14.3 | External approval decisions are flagged "External Approval — Secure Link" in the audit trail. |
| BR-038 | 14.4 | Approvers cannot delegate to the document's requester when SoD is active. |
| BR-039 | 14.4 | Outstanding tasks revert to original approver when delegation period ends. Notification sent. |
| BR-040 | 14.5 | Bulk Approval requires all selected tasks to be at the same step and the user to be an authorised approver. |
| BR-041 | 14.5 | Each document in a bulk action generates its own audit record. Batch remarks linked to all. |
| BR-042 | 14.6 | Partial Approval settings are hidden when Approval Granularity = Header. |
| BR-043 | 14.7 | Block + Edit + Resubmit: resubmission starts the entire approval from Step 1, voiding all prior approvals. |
| BR-044 | 14.7 | Recall is permanently unavailable after Final Approve or Final Reject has been recorded. |
| BR-045 | 14.7 | Recall cancels all pending tasks, releases the lock, and returns the document to draft. |
| BR-046 | 15.1 | No matching Active workflow: submission proceeds; audit records "No Matching Workflow — Approval Bypassed." |
| BR-047 | 15.1 | Unresolvable Step 1 approver: document enters "Pending Manual Assignment"; Policy Owner alerted. |
| BR-048 | 15.4 | Rejection remarks always stored in audit. Blank remarks recorded as "No remarks provided." |
| BR-049 | 15.6 | Recall resets all approval progress. Resubmission starts the workflow from Step 1. |
| BR-050 | 15.8 | Audit trail entries are append-only. No user can edit or delete them. |
| BR-051 | 15.8 | Audit trail retained for a minimum configurable period. Default: 7 years. |

---

## 18. Non-Functional Requirements

### 18.1 Performance

| Requirement | Target |
|---|---|
| Workflow configuration save | < 1 second (p95) |
| Publish validation checklist computation | < 3 seconds (p95) |
| Approval task routing and notification dispatch | < 5 seconds from submission (p95) |
| Audit trail write | < 1 second (p99) |
| Approval Inbox load | < 2 seconds for 500 tasks (p95) |
| Decision table evaluation | < 500 ms per document (p99) |
| Rule Simulation (test mode) | < 2 seconds (p95) |

### 18.2 Availability and Reliability

| Requirement | Target |
|---|---|
| Approval Studio (Admin) availability | 99.5% uptime |
| Approval Engine (Runtime) availability | 99.9% uptime |
| Notification delivery success rate | > 99% for in-app; > 97% for email; > 95% for SMS/WhatsApp |
| Zero data loss on submission | Guaranteed via synchronous audit write before task routing |

### 18.3 Scalability

| Requirement | Target |
|---|---|
| Concurrent approval task submissions | 200 simultaneous submissions without degradation |
| Workflow definitions stored | No upper bound; pagination after 1,000 |
| Decision table rows per table | Up to 10,000 rows |
| Active workflows per tenant | No hard limit |
| Bulk approval batch size | Up to 200 documents per batch (configurable ceiling) |

### 18.4 Security

| Requirement | Description |
|---|---|
| **Authentication** | All admin and approver actions require authenticated sessions. External secure link bypasses login via OTP-verified token only. |
| **Authorisation** | Role-based. Every action checked against the actor's permissions before execution. |
| **Audit immutability** | Audit records written to an append-only store. No update or delete APIs exposed. |
| **API action security** | HTTPS enforced for all outbound API actions. Credentials stored in encrypted vault, never in plain text. |
| **Secure link token** | Cryptographically signed, time-limited token. IP restriction optionally enforceable. |
| **OTP security** | OTP is single-use, expires in 10 minutes by default, and is rate-limited to Max OTP Attempts. |
| **Data sensitivity** | Approval configuration is tenant-isolated. Cross-tenant data access is architecturally prohibited. |

### 18.5 Compliance and Audit

| Requirement | Description |
|---|---|
| **Regulatory alignment** | Audit trail design supports SOX, ISO 27001, and GST audit trail requirements. |
| **Data retention** | Configurable per tenant. Default: 7 years minimum. |
| **Right to audit** | Auditor role provides read-only access to all records across all tenants (with appropriate authorisation). |
| **Immutability guarantee** | Audit records are write-once; no modification API exists at any layer. |

### 18.6 Accessibility

| Requirement | Standard |
|---|---|
| Approval Studio (Admin) | WCAG 2.1 Level AA |
| Approval Inbox and Action Panel | WCAG 2.1 Level AA |
| Secure External Approval page | WCAG 2.1 Level AA |
| Keyboard navigability | Full keyboard support for all primary approval actions |
| Screen reader compatibility | ARIA labels on all interactive elements |

### 18.7 Localisation

| Requirement | Description |
|---|---|
| **Notification language** | Per-recipient preferred language. Default fallback to tenant language. |
| **Date and time formats** | Driven by tenant locale settings. Timestamps stored as UTC; displayed in local timezone. |
| **RTL support** | UI layout supports right-to-left languages where the platform's RTL theme is active. |
| **Currency and number formatting** | Entry criteria values displayed in tenant locale format. |

---

## 19. Glossary

| Term | Definition |
|---|---|
| **Approval Engine** | The back-end service that reads Approval Studio configurations and executes them at runtime — routing tasks, managing SLA timers, dispatching notifications. |
| **Approval Granularity** | Whether approval covers the entire document (Header), individual line items (Line), or both (Hybrid). |
| **Approval Studio** | The admin configuration interface where Policy Owners design and publish approval workflow policies. |
| **Approval Type** | The routing pattern: Single, Sequential, Parallel, Conditional, Fallback, or Multi-level. |
| **Attribute Rule** | A rule expression that identifies an approver dynamically based on the document's field values. |
| **Audit Trail** | The append-only, tamper-proof log of every event in a document's approval lifecycle. |
| **Bulk Approval** | An action that allows an approver to approve or reject multiple documents in one operation. |
| **Condition Builder** | A visual, no-code interface for constructing logical rules by combining field + operator + value pairs. |
| **Decision Table (DMN)** | A structured matrix of input conditions and corresponding output actions, conforming to the DMN standard. |
| **Delegation** | An approver authorising another person to act on their behalf for a specified period. |
| **Derivation Rule** | A computed expression that produces a new variable from existing input variables before rule evaluation. |
| **DMN** | Decision Model and Notation — an industry standard for representing decision logic. |
| **Entry Criteria** | Conditions that must be true for a workflow to be triggered. If not met, the document bypasses approval. |
| **Fallback Chain** | A priority-ordered list of alternative approvers activated when the primary approver is unavailable. |
| **Granularity** | See Approval Granularity. |
| **Hit Policy** | The rule governing how a Decision Table handles multiple matching rows: FIRST_MATCH, PRIORITY, ALL_MATCH, COLLECT. |
| **Idempotency Key** | A unique identifier for an API call that prevents duplicate execution on retry. |
| **Invalidation** | The act of resetting an in-progress approval when the document is edited, requiring resubmission. |
| **Maker-Checker** | A control pattern where one person creates a record (Maker) and a different person approves it (Checker). Enforced by Segregation of Duties. |
| **Missing Approver Action** | How the system responds when it cannot resolve an approver for a step: Use Fallback Chain, Block Submission, or Send to Admin Queue. |
| **N-of-M** | A Required Approvals mode where N out of M assigned approvers must approve to complete a step. |
| **No Match Handling** | What happens when no entry criteria rule matches: Approval Not Required, Block Submission, or Send to Manual Review. |
| **OTP** | One-Time Password — a single-use code sent via SMS, Email, or WhatsApp to verify an external approver's identity. |
| **Partial Approval** | When only some line items on a document are approved; the remaining lines are rejected or returned. |
| **Policy Code** | A system-generated unique identifier for a workflow (e.g. APR-0001). Immutable after generation. |
| **Policy Owner** | The person accountable for a workflow's correctness and currency. |
| **Queue** | A shared pool of users. Any member can claim and approve tasks assigned to the queue. |
| **Recall** | The requester withdrawing a document from the approval process before a final decision. |
| **Resolution Type** | How the system identifies the correct approver at runtime: Role, User, Queue, Hierarchy, Approver Routing Matrix, or Attribute Rule. |
| **Scope Level** | The organisational boundary to which a workflow applies: Global, Organisation, Branch, Department, Role, User, Custom, or Region. |
| **Secure Link** | A one-time URL allowing an external approver to review and decide on a document without an IDMS account. |
| **Segregation of Duties (SoD)** | The principle that the person who creates a transaction should not also be the person who approves it. |
| **SLA** | Service Level Agreement — the maximum time permitted for an approval step to be completed. |
| **Snapshot** | A frozen copy of document data captured at a defined point during approval, used for audit comparison. |
| **Stage** | A logical grouping of approval steps. Stages execute sequentially; steps within a stage may execute in various modes. |
| **Step** | A single approval task within a stage. One step = one assignment to one or more approvers. |
| **Timeout** | The state reached when a step's SLA expires without a decision. |
| **Workflow Policy** | The complete configuration definition for an approval workflow — all six wizard steps combined. |

---

## 20. Appendix

### A. Document Type Reference by Domain

#### Procurement
| System Key | Display Name |
|---|---|
| Purchase Requisition | Purchase Requisition |
| Purchase Return Requisition | Purchase Return Requisition |
| Purchase Order | Purchase Order |
| Purchase Receipt | Purchase Receipt (GRN) |
| Purchase Invoice | Purchase Invoice |
| Purchase Return | Purchase Return |

#### Sales
| System Key | Display Name |
|---|---|
| Sale Order | Sale Order |
| Sale Return Requisition | Sale Return Requisition |
| Sale Allocation Requisition | Sale Allocation Requisition |
| Sale Allocation | Sale Allocation |
| Sale Invoice | Sale Invoice |
| Sale Return | Sale Return |
| Delivery | Delivery Note |

#### Inventory
| System Key | Display Name |
|---|---|
| Stock Transfer Requisition | Stock Transfer Requisition |
| Stock Transfer | Stock Transfer |
| Stock Adjustment Requisition | Stock Adjustment Requisition |
| Stock Adjustment | Stock Adjustment |

#### Service
| System Key | Display Name |
|---|---|
| Appointment | Service Appointment |
| Job Card | Job Card |
| Service Estimate | Service Estimate |
| Service Invoice | Service Invoice |
| Service Invoice Return | Service Invoice Return |
| Spare Issue | Spare Parts Issue |
| Spare Issue Return | Spare Parts Issue Return |

---

### B. Example Decision Table — Purchase Order Approval Routing

**Table Name:** PO Value Routing
**Hit Policy:** FIRST_MATCH
**Input Columns:** `amount`, `department`
**Output Column:** `approvalPath`

| Row | amount | department | approvalPath |
|---|---|---|---|
| 1 | > 5,000,000 | * | CFO + Board |
| 2 | > 1,000,000 | Procurement | CFO Only |
| 3 | > 500,000 | * | Finance Manager |
| 4 | > 100,000 | * | Branch Manager |
| 5 | * | * | Department Head |

`*` denotes "any value" (default match for that column).
Rows are evaluated top-down; the first match determines the output.

---

### C. Approval Status Code Reference

| Status Code | Display Label | Terminal? | Description |
|---|---|---|---|
| PENDING_APPROVAL | Pending Approval | No | Submitted; awaiting action at the current step |
| IN_PROGRESS | In Progress | No | At least one step approved; more remain |
| APPROVED | Approved | Yes | All required steps approved |
| REJECTED | Rejected | Yes | A step rejection has been finalised |
| RECALLED | Recalled | Yes | Requester withdrew before final decision |
| ESCALATED | Escalated | No | SLA breached; task moved to fallback |
| TIMED_OUT | Timed Out | Yes | SLA expired; auto-action applied |
| CANCELLED | Cancelled | Yes | Authorised user cancelled the in-progress approval |

---

### D. Notification Template Placeholder Reference

The following placeholders can be used in notification subject lines and body templates:

| Placeholder | Resolves To |
|---|---|
| `{{documentNumber}}` | Document number (e.g. PO-2026-00145) |
| `{{documentType}}` | Document type label (e.g. Purchase Order) |
| `{{requesterName}}` | Name of the person who submitted |
| `{{approverName}}` | Name of the current assigned approver |
| `{{stepName}}` | Current step name |
| `{{workflowName}}` | Name of the active workflow |
| `{{policyCode}}` | Workflow policy code |
| `{{submissionDate}}` | Date and time of submission |
| `{{slaDueDate}}` | SLA deadline date and time |
| `{{slaRemainingTime}}` | Time remaining before SLA expiry |
| `{{decisionDate}}` | Date and time of the approval decision |
| `{{remarks}}` | Approver's or requester's remarks |
| `{{approvalLink}}` | Secure approval link (for external approvals) |
| `{{tenantName}}` | Organisation / tenant name |
| `{{currentStatus}}` | Current approval status label |

---

### E. Acceptance Criteria Summary

| AC ID | Section | Acceptance Criterion |
|---|---|---|
| AC-001 | 8.5 | Duplicate workflow name for same domain + document type shows field error and blocks progression |
| AC-002 | 8.5 | Changing Business Domain clears Document Type and dependent config |
| AC-003 | 8.5 | Policy Code auto-generated on first save; immutable thereafter |
| AC-004 | 8.5 | Priority conflict with existing Active workflow raises field error |
| AC-005 | 9.6 | API Trigger Key rejects non-matching pattern |
| AC-006 | 9.6 | Empty Header Fields blocks step progression |
| AC-007 | 9.6 | Include Related Fields = Yes with no fields selected shows validation error |
| AC-008 | 9.6 | Re-evaluate on Edit invalidation cancels approval and writes audit event |
| AC-009 | 10.7 | Duplicate Step Name blocked on save |
| AC-010 | 10.7 | N-of-M N exceeding M rejected |
| AC-011 | 10.7 | Requester in User resolution with SoD On shows checklist failure |
| AC-012 | 11.4 | Decision table cannot be set Active with zero rows |
| AC-013 | 11.4 | Rule Simulation produces Decision Trace naming all evaluated rows |
| AC-014 | 11.4 | Null Handling = Use Default with no default value shows checklist failure |
| AC-015 | 11.4 | Changing Hit Policy triggers re-validation without deleting rows |
| AC-016 | 12.6 | HTTP endpoint in API action rejected on save |
| AC-017 | 12.6 | Auto Approve requires Timeout Justification; restricted to System Administrators |
| AC-018 | 12.6 | Digest Notification without Digest Frequency shows checklist failure |
| AC-019 | 13.4 | Publish button disabled until all Fail items resolved and Warnings acknowledged |
| AC-020 | 13.4 | Scheduled activation fires at configured datetime in selected timezone |
| AC-021 | 13.4 | Activation generates immutable audit record with version, user, timestamp, changelog |
| AC-022 | 13.4 | Retire Previous Version archives prior Active version atomically with new activation |

---

*End of Document*

---
**Document ID:** IDMS-FRD-APPROVAL-001 | **Version:** 2.0 | **Date:** 28 May 2026
