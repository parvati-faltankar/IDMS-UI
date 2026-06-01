# Sale Order Configurable Implementation Blueprint
## Rule Engine + Workflow Engine + Business Services

---

## 1. Purpose

This document defines how the Sale Order specification shall be converted into configurable **Rules**, **Workflow**, and **Business Services**.

The objective is to ensure that Sale Order behavior is not hardcoded inside application code. Instead, the system shall use:

```text
Rule Engine      = validation, derivation, approval trigger, field behavior, eligibility
Workflow Engine  = process orchestration, step sequence, routing, approval wait/resume, status movement
Services         = pricing, tax, charge, discount, approval, numbering, currency, audit, attachment, notification, downstream events
```

Sale Order shall remain a **Configurable Core document type**. Core behavior must stay stable, while variable behavior should be configurable by rule, workflow, service configuration, extension pack, geography pack, or tenant policy.

Source basis:
- Sale Order Specification v2.0 defines Sale Order as configurable core with core, configurable core, platform capability, domain extension, geography extension, tenant rule, and downstream process separation.
- Rule and Workflow Engine document defines Rule Engine and Workflow Engine separation, where Workflow calls Rule Engine through RuleTask steps and Rule Engine returns validation, warning, derivation, and approval outputs.

---

## 2. Architecture Principle

### 2.1 What Rule Engine Owns

Rule Engine owns configurable business decisions.

Examples:

```text
Mandatory field checks
Conditional validation
Warning checks
Derivation rules
Approval trigger rules
Eligibility rules
Field behavior rules
Shortcut eligibility rules
Downstream protection rules
Tenant-specific rules
```

Rule Engine should answer:

```text
Is the transaction valid?
Are there errors?
Are there warnings?
What values should be derived?
Is approval required?
Which approval case should be created?
Which downstream shortcut is allowed?
Which field should be readonly/hidden/mandatory?
```

---

### 2.2 What Workflow Engine Owns

Workflow Engine owns the transaction journey.

Examples:

```text
Create Draft
Validate
Calculate
Submit
Approve
Hold
Release
Cancel
Amend
Close
Reopen
Publish downstream event
```

Workflow Engine should answer:

```text
Which step should run next?
Which rule set should execute?
Which service should be called?
Should workflow pause for user action?
What happens after approval?
What happens after rejection?
What status should be assigned?
```

---

### 2.3 What Services Own

Services own actual execution and system-of-record actions.

Examples:

```text
SaleOrderService
NumberingService
PricingService
DiscountService
TaxService
ChargeService
CurrencyService
ApprovalService
InventoryPlanningService
AttachmentService
NotificationService
AuditService
IntegrationEventService
OutputService
PrivacyMaskingService
RBACService
```

Services should answer:

```text
Generate document number
Create sale order draft
Calculate price
Validate price override
Calculate discount
Calculate tax
Calculate charges
Create approval task
Check approval matrix
Assign approver
Apply hold
Release hold
Cancel order
Create audit event
Publish domain event
```

---

## 3. High-Level Architecture Diagram

```text
UI Studio / Sale Order Form
        |
        |  EntityName, ViewCode, Action, Header, Lines, Context
        v
Sale Order API / Application Layer
        |
        v
Workflow Resolver
        |
        |-- uses EntityName
        |-- uses ViewCode
        |-- uses Action
        |-- uses OrderType / ProductType / Tenant / Branch / Channel
        v
Workflow Engine
        |
        |---------------------------------------------------------
        | Step Type             Runtime Action
        |---------------------------------------------------------
        | RuleTask              Call Rule Engine
        | ServiceTask           Call Business Service
        | Decision              Route based on result
        | UserTask              Pause for user / approval / correction
        | NotificationTask      Call Notification Service
        | IntegrationTask       Call Integration Event Service
        |---------------------------------------------------------
        |
        v
Business Services
        |
        |-- SaleOrderService
        |-- NumberingService
        |-- PricingService
        |-- DiscountService
        |-- TaxService
        |-- ChargeService
        |-- CurrencyService
        |-- ApprovalService
        |-- AuditService
        |-- NotificationService
        |-- IntegrationEventService
        |
        v
Database / Audit / Outbox / Read Model
```

---

## 4. Three-Layer Segregation Model

| Specification Item | Rule Engine | Workflow Engine | Service |
|---|---|---|---|
| Customer mandatory | Yes | Calls rule set | No |
| Document number generation | No | Calls service | NumberingService |
| Draft creation | No | Calls service | SaleOrderService |
| Pricing hook | May validate/derive policy | Calls service | PricingService |
| Discount validation | Yes | Calls rule set / service | DiscountService |
| Tax jurisdiction validation | Yes | Calls rule set / service | TaxService |
| Tax calculation | No | Calls service | TaxService |
| Charge calculation | No | Calls service | ChargeService |
| Approval trigger | Yes | Calls approval rule set | ApprovalService creates task |
| Approval routing matrix | No | Calls service | ApprovalService |
| Approval wait/resume | No | UserTask | Workflow Engine + ApprovalService |
| Hold / release eligibility | Yes | Workflow controls action | HoldService / SaleOrderService |
| Cancellation eligibility | Yes | Workflow controls action | SaleOrderService |
| Processed quantity protection | Yes | Calls rule set | SourceLineLedgerService |
| Downstream status update | No | Integration step | IntegrationEventService |
| Audit | No | Calls audit/log step | AuditService |

---

# 5. Required Services

## 5.1 SaleOrderService

### Purpose

Owns the Sale Order transaction record.

### Responsibilities

```text
Create draft sale order
Update sale order
Save header
Save lines
Validate row version
Maintain status
Apply cancellation
Apply amendment
Apply close/reopen
Protect processed scope
Maintain source line identity
Return latest saved document
```

### Called By Workflow Steps

```text
CREATE_DRAFT
UPDATE_DRAFT
SAVE_ORDER
SUBMIT_ORDER
CANCEL_ORDER
AMEND_ORDER
CLOSE_ORDER
REOPEN_ORDER
```

### Example Service Output

```json
{
  "success": true,
  "saleOrderId": "SO-1001",
  "status": "Draft",
  "rowVersion": 3
}
```

---

## 5.2 NumberingService

### Purpose

Generates document number using configured document type, legal entity, branch, fiscal period, and prefix rules.

### Responsibilities

```text
Generate document number
Validate document series
Prevent duplicate document number
Maintain fiscal sequence
Return document type code, series, number
```

### Called By Workflow Steps

```text
GENERATE_DOCUMENT_NUMBER
CREATE_DRAFT
```

### Example Output

```json
{
  "success": true,
  "documentNumber": "SO/MUM/2026/000001",
  "documentTypeCode": "SO",
  "documentSeries": "SO-MUM-2026",
  "documentNoInt": 1
}
```

---

## 5.3 PricingService

### Purpose

Owns price determination and pricing references.

### Responsibilities

```text
Default price
Validate price list
Validate rate validity
Validate price override tolerance
Return pricing engine reference
Return base price
Return calculated line rate
```

### Called By Workflow Steps

```text
CALCULATE_PRICING
VALIDATE_PRICE_OVERRIDE
REPRICE_ORDER
```

### Example Output

```json
{
  "success": true,
  "pricingEngineReference": "PRICE-RUN-9821",
  "lines": [
    {
      "lineId": "1",
      "basePrice": 100000,
      "rate": 98000,
      "priceListCode": "RETAIL"
    }
  ]
}
```

---

## 5.4 DiscountService

### Purpose

Owns discount calculation and discount policy evaluation.

### Responsibilities

```text
Calculate allowed discount
Calculate discount amount
Validate discount percent
Validate discount amount
Return discount policy reference
Return approval trigger context if discount exceeds allowed limit
```

### Called By Workflow Steps

```text
CALCULATE_DISCOUNT
VALIDATE_DISCOUNT
```

### Example Output

```json
{
  "success": true,
  "discountPolicyReference": "DISC-POLICY-2026-01",
  "approvalSuggested": true,
  "reason": "Discount exceeds configured tolerance"
}
```

---

## 5.5 TaxService

### Purpose

Owns tax jurisdiction, tax classification, tax calculation, and tax engine reference.

### Responsibilities

```text
Derive tax jurisdiction
Validate party tax identifier where enabled
Validate tax classification code
Calculate line tax
Calculate header tax summary
Return tax engine reference
Return tax breakdown
```

### Called By Workflow Steps

```text
DERIVE_TAX_CONTEXT
VALIDATE_TAX_CONTEXT
CALCULATE_TAX
```

### Example Output

```json
{
  "success": true,
  "taxEngineReference": "TAX-RUN-5501",
  "taxStructure": "GENERIC_TAX",
  "totalTaxAmount": 18000,
  "lines": [
    {
      "lineId": "1",
      "taxableAmount": 100000,
      "taxAmount": 18000,
      "taxBreakdown": [
        {
          "taxCode": "TAX-A",
          "rate": 18,
          "amount": 18000
        }
      ]
    }
  ]
}
```

---

## 5.6 ChargeService

### Purpose

Owns additional charges such as freight, handling, surcharge, platform fee, and service fee.

### Responsibilities

```text
Calculate freight
Calculate handling
Calculate surcharge
Calculate other configured charges
Return charge engine reference
Return charge breakdown
```

### Called By Workflow Steps

```text
CALCULATE_CHARGES
VALIDATE_CHARGES
```

---

## 5.7 CurrencyService

### Purpose

Owns currency, exchange rate, base currency, transaction currency, and rounding policy.

### Responsibilities

```text
Default transaction currency
Derive base currency
Get exchange rate
Validate exchange rate date
Apply rounding policy
Return currency reference
```

### Called By Workflow Steps

```text
DERIVE_CURRENCY
VALIDATE_EXCHANGE_RATE
APPLY_ROUNDING
```

---

## 5.8 ApprovalService

### Purpose

Owns approval matrix, approval assignment, escalation, delegation, approval history, and approval task state.

### Responsibilities

```text
Evaluate approval matrix
Create approval case
Create approval task
Assign approver
Determine approval level
Handle sequential approval
Handle parallel approval
Handle escalation
Handle delegation
Approve
Reject
Return for correction
Resume workflow after approval outcome
```

### Called By Workflow Steps

```text
CREATE_APPROVAL_CASE
ASSIGN_APPROVAL_TASK
WAIT_FOR_APPROVAL
APPROVE_ORDER
REJECT_ORDER
RETURN_FOR_CORRECTION
ESCALATE_APPROVAL
```

### Important Design

Rule Engine should only decide:

```text
Approval is required
Approval reason
Approval category
Approval trigger context
```

ApprovalService should decide:

```text
Who should approve
Which level should approve
Whether ASM / Service Manager / HQ approval is required
Whether escalation applies
Whether delegation applies
```

### Example Approval Trigger from Rule Engine

```json
{
  "approvalRequired": true,
  "approvalRequests": [
    {
      "approvalCategory": "DISCOUNT_EXCEPTION",
      "approvalReason": "Discount exceeds allowed limit",
      "triggerRule": "SO-RULE-DISCOUNT-EXCEEDS-LIMIT",
      "amount": 100000,
      "discountPercent": 12
    }
  ]
}
```

### Example ApprovalService Output

```json
{
  "success": true,
  "approvalCaseId": "APR-10001",
  "approvalTasks": [
    {
      "level": 1,
      "role": "ASM",
      "assignedTo": "user_asm_01",
      "status": "Pending"
    },
    {
      "level": 2,
      "role": "HQ_MANAGER",
      "assignedTo": null,
      "status": "Waiting"
    }
  ],
  "workflowAction": "PAUSE"
}
```

---

## 5.9 SourceLineLedgerService

### Purpose

Owns source-line identity, downstream consumed quantity, pending quantity, and processed-scope protection.

### Responsibilities

```text
Generate source line reference
Track consumed quantity
Track cancelled quantity
Track pending quantity
Prevent edit of processed quantity
Prevent cancellation beyond pending quantity
Validate downstream read model
```

### Called By Workflow Steps

```text
GENERATE_SOURCE_LINE_REFERENCE
VALIDATE_PROCESSED_SCOPE
VALIDATE_PENDING_QUANTITY
UPDATE_SOURCE_LINE_LEDGER
```

---

## 5.10 AuditService

### Purpose

Owns immutable audit event creation.

### Responsibilities

```text
Log create
Log update
Log status change
Log approval action
Log cancellation
Log hold/release
Log amendment
Log downstream event update
Log before/after values
```

### Called By Workflow Steps

```text
WRITE_AUDIT_EVENT
WRITE_STATUS_AUDIT
WRITE_APPROVAL_AUDIT
```

---

## 5.11 IntegrationEventService

### Purpose

Publishes domain events and downstream read-model events.

### Responsibilities

```text
Publish SaleOrderCreated
Publish SaleOrderSubmitted
Publish SaleOrderApproved
Publish SaleOrderCancelled
Publish SaleOrderAmended
Publish SaleOrderClosed
Publish downstream readiness event
Maintain idempotency key
Maintain correlation ID
```

### Called By Workflow Steps

```text
PUBLISH_DRAFT_CREATED
PUBLISH_SUBMITTED
PUBLISH_APPROVED
PUBLISH_CANCELLED
PUBLISH_DOWNSTREAM_READY
```

---

## 5.12 NotificationService

### Purpose

Sends notifications based on workflow and event configuration.

### Responsibilities

```text
Notify order created
Notify approval pending
Notify approval approved/rejected
Notify hold/release
Notify cancellation
Notify downstream exception
```

### Called By Workflow Steps

```text
NOTIFY_CREATION
NOTIFY_APPROVAL_PENDING
NOTIFY_APPROVAL_DECISION
NOTIFY_CANCELLATION
```

---

# 6. Rule Set Design

## 6.1 Recommended Rule Set Groups

```text
SO_PRE_VALIDATION_RULES
SO_SYSTEM_DERIVATION_RULES
SO_PARTY_RULES
SO_ORG_CONTEXT_RULES
SO_DATE_VALIDITY_RULES
SO_PAYMENT_RULES
SO_LINE_VALIDATION_RULES
SO_PRICING_RULES
SO_DISCOUNT_RULES
SO_TAX_RULES
SO_CHARGE_RULES
SO_TOTAL_CALCULATION_RULES
SO_APPROVAL_TRIGGER_RULES
SO_LIFECYCLE_RULES
SO_HOLD_RELEASE_RULES
SO_CANCELLATION_RULES
SO_AMENDMENT_RULES
SO_DOWNSTREAM_PROTECTION_RULES
SO_SHORTCUT_ELIGIBILITY_RULES
SO_SECURITY_FIELD_BEHAVIOR_RULES
SO_OUTPUT_EXPORT_RULES
```

---

# 7. Rule Breakdown from Sale Order Specification

## 7.1 Core System Invariant Rules

These are non-weakenable core rules. They may be represented in the rule catalog for traceability, but actual enforcement should be done by core services.

| Rule Area | Rule Type | Owner | Execution |
|---|---|---|---|
| Document number system-generated | System invariant | NumberingService | ServiceTask |
| Created by auto-derived | System invariant | SaleOrderService | ServiceTask |
| Created date-time auto-captured | System invariant | SaleOrderService | ServiceTask |
| Last updated by auto-derived | System invariant | SaleOrderService | ServiceTask |
| Last updated date-time auto-captured | System invariant | SaleOrderService | ServiceTask |
| Row version generated | System invariant | SaleOrderService | ServiceTask |
| Duplicate save protection | System invariant | SaleOrderService | ServiceTask |
| Save atomicity | System invariant | SaleOrderService | ServiceTask |
| Source-line identity | System invariant | SourceLineLedgerService | ServiceTask |

---

## 7.2 Header Validation Rules

### Rule Set: `SO_HEADER_VALIDATION_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-HDR-DOC-DATE-REQ | Document Date | Validation | RaiseError | Rule Engine |
| SO-HDR-DOC-DATE-OPEN-PERIOD | Document Date | Validation | RaiseError | Rule Engine / Period Service |
| SO-HDR-ORG-REQ | Organisation | Validation | RaiseError | Rule Engine |
| SO-HDR-BRANCH-REQ | Branch | Validation | RaiseError | Rule Engine |
| SO-HDR-DEPT-BRANCH-MATCH | Department | Validation | RaiseError | Rule Engine |
| SO-HDR-CUSTOMER-REQ | Customer / Account | Validation | RaiseError | Rule Engine |
| SO-HDR-SALES-OWNER-REQ | Sales Owner | Validation | RaiseError | Rule Engine |
| SO-HDR-SALES-OWNER-ACTIVE | Sales Owner | Validation | RaiseError | Rule Engine |
| SO-HDR-TAX-JURISDICTION-REQ | Tax Jurisdiction | Validation | RaiseError | Rule Engine |
| SO-HDR-VALID-TILL-DATE | Valid Till Date | Validation | RaiseError / Warning | Rule Engine |
| SO-HDR-REQUESTED-DATE | Requested Fulfillment Date | Validation | RaiseWarning / RaiseError | Rule Engine |
| SO-HDR-PROMISED-DATE | Promised Fulfillment Date | Validation | RaiseWarning / RaiseError | Rule Engine |

---

## 7.3 Customer / Party Rules

### Rule Set: `SO_PARTY_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-PARTY-CUSTOMER-MANDATORY | Customer / Account | Validation | RaiseError | Rule Engine |
| SO-PARTY-CUSTOMER-ACTIVE | Customer / Account | Validation | RaiseError | Rule Engine |
| SO-PARTY-CUSTOMER-DERIVE-CONTACT | Primary/Secondary Contact | Derivation | DeriveValue | Rule Engine / PartyService |
| SO-PARTY-CUSTOMER-DERIVE-EMAIL | Email | Derivation | DeriveValue | Rule Engine / PartyService |
| SO-PARTY-CUSTOMER-DERIVE-BILLING-ADDRESS | Billing Address | Derivation | DeriveValue | Rule Engine / PartyService |
| SO-PARTY-TAX-ID-REQUIRED-WHEN-ENABLED | Party Tax Identifier | Conditional Validation | RaiseError | Rule Engine |
| SO-PARTY-MASKING-POLICY | Contact / Email / Tax ID | Field Behavior | ApplyMaskingPolicy | PrivacyService |

---

## 7.4 Fulfillment Rules

### Rule Set: `SO_FULFILLMENT_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-FULFILLMENT-ADDRESS-BELONGS-CUSTOMER | Fulfillment Address | Validation | RaiseError | Rule Engine |
| SO-FULFILLMENT-METHOD-VALID | Fulfillment Method / Term | Validation | RaiseError | Rule Engine |
| SO-FULFILLMENT-INSTRUCTION-LENGTH | Fulfillment Instruction | Validation | RaiseWarning / Error | Rule Engine |
| SO-FULFILLMENT-PREFERENCE-VALID | Fulfillment Preference Type | Validation | RaiseError | Rule Engine |

Note:

```text
Warehouse, serial, batch, bin, allocation, and reservation behavior are not Phase 1 configurable core.
They belong to inventory/traceability extension packs or downstream processes.
```

---

## 7.5 Payment Rules

### Rule Set: `SO_PAYMENT_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-PAYMENT-MODE-VALID | Payment Mode | Validation | RaiseError | Rule Engine |
| SO-PAYMENT-METHOD-REQ-CASH | Payment Method | Conditional Validation | RaiseError | Rule Engine |
| SO-PAYMENT-ADVANCE-NONNEGATIVE | Advance Payment | Validation | RaiseError | Rule Engine |
| SO-PAYMENT-ADVANCE-CONTEXT-ONLY | Advance Payment | Boundary Rule | RaiseWarning / Block Receipt Creation | Rule Engine |
| SO-PAYMENT-TERM-VALID | Payment Term | Validation | RaiseError | Rule Engine |

Finance fields such as financier, down payment, EMI amount, finance amount, tenure, and interest rate should be moved to Finance Sale Extension.

---

## 7.6 Finance Extension Rules

### Rule Set: `SO_FINANCE_EXTENSION_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-FIN-FINANCIER-REQ-WHEN-FINANCE | Financier | Conditional Validation | RaiseError | Rule Engine |
| SO-FIN-DOWN-PAYMENT-NONNEGATIVE | Down Payment | Validation | RaiseError | Rule Engine |
| SO-FIN-FINANCE-AMOUNT-NONNEGATIVE | Finance Amount | Validation | RaiseError | Rule Engine |
| SO-FIN-EMI-NONNEGATIVE | EMI Amount | Validation | RaiseError | Rule Engine |
| SO-FIN-INTEREST-NONNEGATIVE | EMI Interest Rate | Validation | RaiseError | Rule Engine |
| SO-FIN-BALANCE-DERIVATION | Balance Amount | Derivation | DeriveValue | Rule Engine / FinanceService |

Execution condition:

```text
Only when Finance Sale Extension is enabled.
```

---

## 7.7 Insurance Extension Rules

### Rule Set: `SO_INSURANCE_EXTENSION_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-INS-PROVIDER-VALID | Insurance Provider | Validation | RaiseError | Rule Engine |
| SO-INS-POLICY-NO-VALID | Insurance Policy Number | Validation | RaiseWarning / Error | Rule Engine |
| SO-INS-POLICY-DATE-VALID | Insurance Policy Date | Validation | RaiseWarning / Error | Rule Engine |
| SO-INS-REMARKS-VALID | Insurance Remarks | Validation | RaiseWarning | Rule Engine |

Execution condition:

```text
Only when Insurance Context Extension is enabled.
```

---

## 7.8 Line Validation Rules

### Rule Set: `SO_LINE_VALIDATION_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-LINE-ATLEAST-ONE-LINE | Lines | Validation | RaiseError | Rule Engine |
| SO-LINE-ITEM-REQ | Orderable Item / Offering Code | Validation | RaiseError | Rule Engine |
| SO-LINE-ITEM-ACTIVE | Orderable Item / Offering Code | Validation | RaiseError | Rule Engine |
| SO-LINE-UOM-REQ | Unit / UOM | Validation | RaiseError | Rule Engine |
| SO-LINE-UOM-VALID-FOR-ITEM | Unit / UOM | Validation | RaiseError | Rule Engine |
| SO-LINE-QTY-GT-ZERO | Order Quantity | Validation | RaiseError | Rule Engine |
| SO-LINE-QTY-CAPS | Order Quantity | Configurable Validation | RaiseError / Warning | Rule Engine |
| SO-LINE-RATE-REQ | Rate | Validation | RaiseError | Rule Engine |
| SO-LINE-RATE-NONNEGATIVE | Rate | Validation | RaiseError | Rule Engine |
| SO-LINE-DISCOUNT-PERCENT-RANGE | Discount % | Validation | RaiseError | Rule Engine |
| SO-LINE-DISCOUNT-AMOUNT-RANGE | Discount Amount | Validation | RaiseError | Rule Engine |
| SO-LINE-TAXABLE-AMOUNT-DERIVE | Taxable Amount | Derivation | DeriveValue | Rule Engine / CalculationService |
| SO-LINE-AMOUNT-DERIVE | Line Amount | Derivation | DeriveValue | Rule Engine / CalculationService |

---

## 7.9 Pricing Rules

### Rule Set: `SO_PRICING_RULES`

| Rule Code | Rule Type | Action | Owner |
|---|---|---|---|
| SO-PRICE-LIST-DERIVE | Derivation | DeriveValue | Rule Engine / PricingService |
| SO-PRICE-RATE-DEFAULT | Derivation | DeriveValue | PricingService |
| SO-PRICE-RATE-VALIDITY | Validation | RaiseError | PricingService / Rule Engine |
| SO-PRICE-OVERRIDE-TOLERANCE | Approval Trigger | RequireApproval | Rule Engine |
| SO-PRICE-ENGINE-REFERENCE | Derivation | DeriveValue | PricingService |

Workflow should call PricingService before final totals calculation.

---

## 7.10 Discount Rules

### Rule Set: `SO_DISCOUNT_RULES`

| Rule Code | Rule Type | Action | Owner |
|---|---|---|---|
| SO-DISC-PERCENT-VALID | Validation | RaiseError | Rule Engine |
| SO-DISC-AMOUNT-VALID | Validation | RaiseError | Rule Engine |
| SO-DISC-AMOUNT-MATCH | Validation | RaiseError / Warning | Rule Engine |
| SO-DISC-LIMIT-CHECK | Approval Trigger | RequireApproval | Rule Engine |
| SO-DISC-PRICE-IMPACT | Derivation | DeriveValue | DiscountService |
| SO-DISC-APPROVAL-CATEGORY | Approval Trigger | RequireApproval | Rule Engine |

Approval trigger should not directly assign a hardcoded approver.

Correct design:

```text
Rule Engine:
    approvalCategory = DISCOUNT_EXCEPTION
    approvalReason = Discount exceeds configured limit

ApprovalService:
    decide ASM / Service Manager / HQ / Branch Manager based on matrix
```

---

## 7.11 Tax Rules

### Rule Set: `SO_TAX_RULES`

| Rule Code | Field | Rule Type | Action | Owner |
|---|---|---|---|---|
| SO-TAX-JURISDICTION-REQ | Tax Jurisdiction | Validation | RaiseError | Rule Engine |
| SO-TAX-CLASSIFICATION-REQ | Tax Classification Code | Validation | RaiseError | Rule Engine |
| SO-TAX-PARTY-ID-CHECK | Party Tax Identifier | Conditional Validation | RaiseError | Rule Engine |
| SO-TAX-CALCULATE | Tax Summary / Breakdown | Service Rule | CallService | TaxService |
| SO-TAX-ENGINE-REFERENCE | Tax Engine Reference | Derivation | DeriveValue | TaxService |
| SO-TAX-LOCALIZATION-ROUTE | Geography Extension | Routing | RouteToExtension | TaxService |

India GST fields such as GSTIN, HSN/SAC, and Place of Supply semantics belong to India GST Localization Extension.

---

## 7.12 Charge Rules

### Rule Set: `SO_CHARGE_RULES`

| Rule Code | Rule Type | Action | Owner |
|---|---|---|---|
| SO-CHARGE-APPLICABILITY | Eligibility | DeriveValue | ChargeService |
| SO-CHARGE-CALCULATE | Calculation | CallService | ChargeService |
| SO-CHARGE-VALIDATE | Validation | RaiseError / Warning | Rule Engine |
| SO-CHARGE-ENGINE-REFERENCE | Derivation | DeriveValue | ChargeService |

---

## 7.13 Total Calculation Rules

### Rule Set: `SO_TOTAL_CALCULATION_RULES`

| Rule Code | Field | Rule Type | Owner |
|---|---|---|---|
| SO-CALC-TOTAL-QTY | Total Quantity | Derivation | CalculationService |
| SO-CALC-TOTAL-BASE-AMOUNT | Total Base Amount | Derivation | CalculationService |
| SO-CALC-TOTAL-DISCOUNT | Total Discount Amount | Derivation | CalculationService |
| SO-CALC-TOTAL-TAX | Total Tax Amount | Derivation | TaxService / CalculationService |
| SO-CALC-TOTAL-AMOUNT | Total Amount | Derivation | CalculationService |
| SO-CALC-NET-AMOUNT | Net Amount | Derivation | CalculationService |
| SO-CALC-ROUNDING | Rounding Policy | Derivation | CurrencyService |

---

## 7.14 Approval Trigger Rules

### Rule Set: `SO_APPROVAL_TRIGGER_RULES`

| Rule Code | Trigger | Action | Approval Category |
|---|---|---|---|
| SO-APR-DISCOUNT-EXCEPTION | Discount exceeds configured threshold | RequireApproval | DISCOUNT_EXCEPTION |
| SO-APR-PRICE-OVERRIDE | Price override beyond tolerance | RequireApproval | PRICE_EXCEPTION |
| SO-APR-CREDIT-EXCEPTION | Customer credit policy exception | RequireApproval | CREDIT_EXCEPTION |
| SO-APR-TAX-EXCEPTION | Tax exception/manual override | RequireApproval | TAX_EXCEPTION |
| SO-APR-EXPIRED-ORDER | Validity expired but submit attempted | RequireApproval | EXPIRED_ORDER_EXCEPTION |
| SO-APR-PROCESSED-AMENDMENT | Amendment after downstream processing | RequireApproval | PROCESSED_SCOPE_EXCEPTION |
| SO-APR-CANCELLATION | Cancellation after partial processing | RequireApproval | CANCELLATION_EXCEPTION |

Rule Engine output should be:

```json
{
  "approvalRequired": true,
  "approvalRequests": [
    {
      "approvalCategory": "DISCOUNT_EXCEPTION",
      "approvalReason": "Discount exceeds configured threshold",
      "triggerRule": "SO-APR-DISCOUNT-EXCEPTION"
    }
  ]
}
```

Workflow should then call ApprovalService.

---

## 7.15 Lifecycle Rules

### Rule Set: `SO_LIFECYCLE_RULES`

| Rule Code | Status / Action | Rule Type | Owner |
|---|---|---|---|
| SO-LC-DRAFT-STATUS | Create | Status Derivation | Workflow / SaleOrderService |
| SO-LC-OPEN-STATUS | Successful submit | Status Derivation | Workflow |
| SO-LC-PENDING-APPROVAL | Approval required | Status Control | Workflow / ApprovalService |
| SO-LC-APPROVED | Approval completed | Status Control | Workflow |
| SO-LC-REJECTED | Approval rejected | Status Control | Workflow |
| SO-LC-HOLD | Hold action | Status Control | Workflow |
| SO-LC-RELEASE | Release action | Status Control | Workflow |
| SO-LC-CANCELLED | Cancel action | Status Control | Workflow |
| SO-LC-CLOSED | Close action | Status Control | Workflow |
| SO-LC-REOPENED | Reopen action | Status Control | Workflow |
| SO-LC-EXPIRED | Validity expired | Status Derivation | LifecycleService |

---

## 7.16 Hold / Release Rules

### Rule Set: `SO_HOLD_RELEASE_RULES`

| Rule Code | Action | Rule Type | Owner |
|---|---|---|---|
| SO-HOLD-TYPE-REQ | Hold | Validation | Rule Engine |
| SO-HOLD-REASON-REQ | Hold | Validation | Rule Engine |
| SO-HOLD-AUTHORITY | Hold | Access / Validation | RBACService / Rule Engine |
| SO-HOLD-BLOCKED-ACTIONS | Runtime | Field/Action Behavior | Rule Engine |
| SO-REL-REASON-REQ | Release | Validation | Rule Engine |
| SO-REL-AUTHORITY | Release | Access / Validation | RBACService / Rule Engine |

---

## 7.17 Cancellation Rules

### Rule Set: `SO_CANCELLATION_RULES`

| Rule Code | Action | Rule Type | Owner |
|---|---|---|---|
| SO-CAN-REASON-REQ | Cancel | Validation | Rule Engine |
| SO-CAN-NOT-IF-FULLY-PROCESSED | Cancel | Validation | Rule Engine / SourceLineLedgerService |
| SO-CAN-QTY-NOT-GT-PENDING | Cancel Line | Validation | Rule Engine |
| SO-CAN-APPROVAL-IF-PROCESSED | Cancel | Approval Trigger | Rule Engine |
| SO-CAN-STATUS-ASSIGN | Cancel | Status Control | Workflow |

---

## 7.18 Amendment / Revision Rules

### Rule Set: `SO_AMENDMENT_RULES`

| Rule Code | Action | Rule Type | Owner |
|---|---|---|---|
| SO-AMD-REASON-REQ | Amend | Validation | Rule Engine |
| SO-AMD-REVISION-NO-DERIVE | Amend | Derivation | RevisionService |
| SO-AMD-PROCESSED-SCOPE-CHECK | Amend | Validation | SourceLineLedgerService |
| SO-AMD-APPROVAL-IF-PROCESSED | Amend | Approval Trigger | Rule Engine |
| SO-AMD-AUDIT-BEFORE-AFTER | Amend | Audit | AuditService |

---

## 7.19 Downstream Protection Rules

### Rule Set: `SO_DOWNSTREAM_PROTECTION_RULES`

| Rule Code | Field / Area | Rule Type | Owner |
|---|---|---|---|
| SO-DS-ALLOCATION-READONLY | Allocation fields | Field Behavior | Rule Engine / UI |
| SO-DS-INVOICE-READONLY | Invoice fields | Field Behavior | Rule Engine / UI |
| SO-DS-DELIVERY-READONLY | Delivery fields | Field Behavior | Rule Engine / UI |
| SO-DS-RETURN-READONLY | Return fields | Field Behavior | Rule Engine / UI |
| SO-DS-CONSUMED-QTY-READONLY | Consumed Quantity | Field Behavior | Rule Engine / UI |
| SO-DS-PENDING-QTY-NONNEGATIVE | Pending Quantity | Validation | SourceLineLedgerService |
| SO-DS-REVERSAL-EVENT-ONLY | Reversal | Boundary Rule | IntegrationEventService |
| SO-DS-TRACEABILITY-REQ | Downstream Update | Validation | SourceLineLedgerService |

---

## 7.20 Shortcut Eligibility Rules

### Rule Set: `SO_SHORTCUT_ELIGIBILITY_RULES`

| Rule Code | Shortcut | Rule Type | Owner |
|---|---|---|---|
| SO-SC-ALLOCATION-REQ-ELIGIBLE | Sale Allocation Requisition | Validation | Rule Engine |
| SO-SC-ALLOCATION-ELIGIBLE | Sale Allocation | Validation | Rule Engine |
| SO-SC-INVOICE-ELIGIBLE | Sale Invoice | Validation | Rule Engine |
| SO-SC-DELIVERY-ELIGIBLE | Delivery | Validation | Rule Engine |
| SO-SC-RETURN-ELIGIBLE | Sale Return | Validation | Rule Engine |
| SO-SC-CHILD-REVALIDATE-SOURCE | Child Document | Validation | Rule Engine / SourceLineLedgerService |

---

# 8. Workflow Design

## 8.1 Main Workflow: `WF_SO_CREATE_SUBMIT`

### Purpose

Create and submit a Sale Order using configurable services and rules.

### Workflow Steps

| Seq | Step Code | Step Type | Calls | Failure Behavior |
|---:|---|---|---|---|
| 10 | START | Start | - | - |
| 20 | RESOLVE_CONTEXT | ServiceTask | ContextService.resolve | Stop on failure |
| 30 | PRE_VALIDATE | RuleTask | SO_PRE_VALIDATION_RULES | ValidationFailed |
| 40 | GENERATE_DOCUMENT_NUMBER | ServiceTask | NumberingService.generate | Stop on failure |
| 50 | CREATE_DRAFT | ServiceTask | SaleOrderService.createDraft | Stop on failure |
| 60 | SYSTEM_DERIVATION | ServiceTask | SaleOrderService.deriveSystemFields | Stop on failure |
| 70 | HEADER_VALIDATE | RuleTask | SO_HEADER_VALIDATION_RULES | ValidationFailed |
| 80 | PARTY_VALIDATE | RuleTask | SO_PARTY_RULES | ValidationFailed |
| 90 | LINE_VALIDATE | RuleTask | SO_LINE_VALIDATION_RULES | ValidationFailed |
| 100 | PAYMENT_VALIDATE | RuleTask | SO_PAYMENT_RULES | ValidationFailed |
| 110 | FULFILLMENT_VALIDATE | RuleTask | SO_FULFILLMENT_RULES | ValidationFailed |
| 120 | PRICING_SERVICE | ServiceTask | PricingService.calculate | PricingFailed |
| 130 | PRICING_RULES | RuleTask | SO_PRICING_RULES | ValidationFailed |
| 140 | DISCOUNT_SERVICE | ServiceTask | DiscountService.calculate | DiscountFailed |
| 150 | DISCOUNT_RULES | RuleTask | SO_DISCOUNT_RULES | ValidationFailed |
| 160 | TAX_CONTEXT | ServiceTask | TaxService.deriveContext | TaxFailed |
| 170 | TAX_RULES | RuleTask | SO_TAX_RULES | ValidationFailed |
| 180 | TAX_SERVICE | ServiceTask | TaxService.calculate | TaxFailed |
| 190 | CHARGE_SERVICE | ServiceTask | ChargeService.calculate | ChargeFailed |
| 200 | TOTAL_CALCULATION | ServiceTask | CalculationService.calculateTotals | CalculationFailed |
| 210 | APPROVAL_TRIGGER_RULES | RuleTask | SO_APPROVAL_TRIGGER_RULES | ValidationFailed |
| 220 | APPROVAL_REQUIRED_DECISION | Decision | result.approvalRequired | - |
| 230 | CREATE_APPROVAL_CASE | ServiceTask | ApprovalService.createCase | ApprovalFailed |
| 240 | WAIT_FOR_APPROVAL | UserTask | ApprovalService.wait | PendingApproval |
| 250 | APPROVAL_OUTCOME_DECISION | Decision | Approved / Rejected / Returned | - |
| 260 | FINAL_DOWNSTREAM_PROTECTION | RuleTask | SO_DOWNSTREAM_PROTECTION_RULES | ValidationFailed |
| 270 | MARK_DOWNSTREAM_READY | ServiceTask | SaleOrderService.markDownstreamReady | Stop on failure |
| 280 | SUBMIT_OR_OPEN | ServiceTask | SaleOrderService.submitOrOpen | Stop on failure |
| 290 | WRITE_AUDIT | ServiceTask | AuditService.writeEvent | Non-blocking / configurable |
| 300 | PUBLISH_EVENT | IntegrationTask | IntegrationEventService.publish | Retry / Outbox |
| 310 | NOTIFY | NotificationTask | NotificationService.send | Non-blocking / configurable |
| 320 | END | End | - | - |

---

## 8.2 Workflow Diagram

```text
START
  |
  v
RESOLVE_CONTEXT
  |
  v
PRE_VALIDATE
  |
  v
GENERATE_DOCUMENT_NUMBER
  |
  v
CREATE_DRAFT
  |
  v
SYSTEM_DERIVATION
  |
  v
HEADER_VALIDATE
  |
  v
PARTY_VALIDATE
  |
  v
LINE_VALIDATE
  |
  v
PAYMENT_VALIDATE
  |
  v
FULFILLMENT_VALIDATE
  |
  v
PRICING_SERVICE
  |
  v
PRICING_RULES
  |
  v
DISCOUNT_SERVICE
  |
  v
DISCOUNT_RULES
  |
  v
TAX_CONTEXT
  |
  v
TAX_RULES
  |
  v
TAX_SERVICE
  |
  v
CHARGE_SERVICE
  |
  v
TOTAL_CALCULATION
  |
  v
APPROVAL_TRIGGER_RULES
  |
  v
APPROVAL_REQUIRED_DECISION
  |------------------------------|
  | Yes                          | No
  v                              v
CREATE_APPROVAL_CASE             FINAL_DOWNSTREAM_PROTECTION
  |                              |
  v                              v
WAIT_FOR_APPROVAL                MARK_DOWNSTREAM_READY
  |                              |
  v                              v
APPROVAL_OUTCOME_DECISION        SUBMIT_OR_OPEN
  |                              |
  | Approved                     v
  v                              WRITE_AUDIT
FINAL_DOWNSTREAM_PROTECTION       |
  |                              v
  v                              PUBLISH_EVENT
MARK_DOWNSTREAM_READY             |
  |                              v
  v                              NOTIFY
SUBMIT_OR_OPEN                    |
  |                              v
  v                              END
WRITE_AUDIT
  |
  v
PUBLISH_EVENT
  |
  v
NOTIFY
  |
  v
END
```

---

## 8.3 Approval Flow

```text
APPROVAL_TRIGGER_RULES
        |
        v
Rule Engine returns approvalRequests
        |
        v
CREATE_APPROVAL_CASE
        |
        v
ApprovalService reads approval matrix
        |
        v
ApprovalService creates approval tasks
        |
        v
WAIT_FOR_APPROVAL
        |
        |-- Approved  → Continue workflow
        |-- Rejected  → Move to Rejected
        |-- Returned  → Move to ReturnedForCorrection
        |-- Escalated → Reassign based on escalation matrix
```

---

# 9. Approval Service Design

## 9.1 Approval Matrix Inputs

ApprovalService shall determine approver using:

```text
Tenant
Legal Entity
Branch
Department
Sales Owner
Customer Category
Order Type
Product Type
Approval Category
Discount %
Amount
Price Override %
Credit Exception
Tax Exception
Processed Scope Flag
Workflow Code
ViewCode
```

---

## 9.2 Approval Matrix Example

| Approval Category | Condition | Level | Role | Escalation |
|---|---|---:|---|---|
| DISCOUNT_EXCEPTION | Discount > 10% and <= 15% | 1 | ASM | 24 hours |
| DISCOUNT_EXCEPTION | Discount > 15% | 1 | ASM | 12 hours |
| DISCOUNT_EXCEPTION | Discount > 15% | 2 | HQ_MANAGER | 24 hours |
| PRICE_EXCEPTION | Price override > tolerance | 1 | Branch Manager | 24 hours |
| CREDIT_EXCEPTION | Credit limit exceeded | 1 | Finance Manager | 24 hours |
| CANCELLATION_EXCEPTION | Processed order cancellation | 1 | Sales Manager | 12 hours |
| PROCESSED_SCOPE_EXCEPTION | Amendment after downstream processing | 1 | Regional Manager | 24 hours |

---

## 9.3 Workflow Should Not Hardcode Approver

Bad:

```text
If discount > 10%, assign SalesManager.
```

Good:

```text
Rule Engine:
    discount exception detected

Workflow Engine:
    call ApprovalService.createCase

ApprovalService:
    determine approver from approval matrix
```

---

# 10. Workflow Variants

## 10.1 Draft Save Workflow

Workflow Code:

```text
WF_SO_DRAFT_SAVE
```

Purpose:

```text
Save draft without submit.
```

Steps:

```text
Start
Resolve Context
Pre Validate
Generate Document Number
Create Draft
System Derivation
Basic Header Validation
Basic Line Validation
Calculate Draft Totals
Write Audit
Publish DraftCreated Event
End
```

---

## 10.2 Submit Workflow

Workflow Code:

```text
WF_SO_SUBMIT
```

Purpose:

```text
Submit saved draft for downstream readiness.
```

Steps:

```text
Start
Load Sale Order
Validate Row Version
Header Validate
Party Validate
Line Validate
Payment Validate
Pricing
Discount
Tax
Charges
Totals
Approval Trigger Rules
Approval Decision
Approval Case / Wait if required
Downstream Protection
Mark Downstream Ready
Open / Submit Status
Audit
Publish Event
End
```

---

## 10.3 Approval Workflow

Workflow Code:

```text
WF_SO_APPROVAL
```

Purpose:

```text
Manage approval case and resume sale order workflow.
```

Steps:

```text
Start
Load Approval Case
Validate Approver
Capture Decision
If Approved → Resume Parent Workflow
If Rejected → Reject Sale Order
If Returned → Return For Correction
If Escalated → Create Escalation Task
Audit
Notify
End
```

---

## 10.4 Hold Workflow

Workflow Code:

```text
WF_SO_HOLD
```

Steps:

```text
Start
Load Sale Order
Validate Hold Rules
Validate Permission
Create Hold
Update Status
Audit
Notify
End
```

---

## 10.5 Release Workflow

Workflow Code:

```text
WF_SO_RELEASE
```

Steps:

```text
Start
Load Sale Order
Validate Release Rules
Validate Permission
Release Hold
Restore Previous Status / Open
Audit
Notify
End
```

---

## 10.6 Cancel Workflow

Workflow Code:

```text
WF_SO_CANCEL
```

Steps:

```text
Start
Load Sale Order
Validate Cancellation Rules
Validate Processed Scope
Approval Trigger Rules
Approval Decision
Cancel Order
Update Source Line Ledger
Audit
Publish Cancelled Event
Notify
End
```

---

## 10.7 Amendment Workflow

Workflow Code:

```text
WF_SO_AMEND
```

Steps:

```text
Start
Load Sale Order
Validate Amendment Rules
Validate Processed Scope
Create Revision
Apply Changes
Recalculate Pricing/Tax/Charges/Totals
Approval Trigger Rules
Approval Decision
Audit
Publish Amended Event
Notify
End
```

---

# 11. Service Call Contract

Every service called by Workflow Engine shall follow a standard contract.

## 11.1 Request Contract

```json
{
  "tenantId": "T001",
  "entityName": "SaleOrder",
  "entityId": "SO-1001",
  "viewCode": "SO_ADD",
  "workflowInstanceId": "WFI-1001",
  "stepCode": "CALCULATE_TAX",
  "action": "Submit",
  "header": {},
  "lines": [],
  "context": {},
  "derivedValues": {},
  "ruleResults": {},
  "correlationId": "CORR-1001",
  "idempotencyKey": "SO-1001-CALCULATE_TAX-1"
}
```

---

## 11.2 Response Contract

```json
{
  "success": true,
  "status": "Completed",
  "errors": [],
  "warnings": [],
  "derivedValues": {},
  "serviceReference": "TAX-RUN-1001",
  "nextAction": "CONTINUE",
  "requiresUserIntervention": false
}
```

---

## 11.3 Failure Response

```json
{
  "success": false,
  "status": "Failed",
  "errors": [
    {
      "code": "TAX_CONTEXT_MISSING",
      "message": "Tax jurisdiction is required before tax calculation.",
      "field": "TaxJurisdiction"
    }
  ],
  "warnings": [],
  "nextAction": "STOP",
  "requiresUserIntervention": true
}
```

---

# 12. Rule Engine Call Contract

## 12.1 Request

```json
{
  "ruleSetCode": "SO_HEADER_VALIDATION_RULES",
  "facts": {
    "header": {},
    "lines": [],
    "totals": {},
    "downstream": {}
  },
  "context": {
    "tenantId": "T001",
    "entityName": "SaleOrder",
    "viewCode": "SO_ADD",
    "action": "Submit",
    "workflowCode": "WF_SO_SUBMIT",
    "workflowInstanceId": "WFI-1001"
  }
}
```

---

## 12.2 Response

```json
{
  "isValid": true,
  "hasErrors": false,
  "errors": [],
  "warnings": [],
  "derivedValues": {},
  "approvalRequired": false,
  "approvalRequests": [],
  "uiActions": [],
  "dataSourceFilters": []
}
```

---

# 13. Workflow Decision Rules

Workflow decisions should use standardized output properties.

| Decision | Input |
|---|---|
| Validation failed? | result.hasErrors |
| Approval required? | result.approvalRequired |
| User intervention required? | serviceResult.requiresUserIntervention |
| Retry allowed? | serviceResult.retryable |
| Downstream ready? | derivedValues.downstreamReady |
| Hold active? | header.holdStatus |
| Processed scope exists? | downstream.consumedQuantity > 0 |

---

# 14. Configuration Objects Required

## 14.1 Rule Configuration

```text
RuleSet
RuleDefinition
RuleCondition
RuleAction
RuleVersion
RuleExecutionLog
RuleSimulationLog
```

---

## 14.2 Workflow Configuration

```text
WorkflowDefinition
WorkflowVersion
WorkflowStep
WorkflowTransition
WorkflowAssignment
WorkflowInstance
WorkflowStepExecution
```

---

## 14.3 Service Configuration

```text
ServiceDefinition
ServiceAction
ServiceEndpoint
ServiceContract
ServiceTimeout
ServiceRetryPolicy
ServiceFallbackPolicy
ServiceExecutionLog
```

---

## 14.4 Approval Configuration

```text
ApprovalCategory
ApprovalMatrix
ApprovalLevel
ApprovalRole
ApprovalEscalation
ApprovalDelegation
ApprovalTask
ApprovalActionLog
```

---

## 14.5 Sale Order Configuration

```text
SaleOrderDocumentType
SaleOrderView
SaleOrderLifecycleConfig
SaleOrderReasonCode
SaleOrderFieldPolicy
SaleOrderExtensionActivation
SaleOrderDownstreamReadModelConfig
```

---

# 15. Runtime Sequence

## 15.1 Create / Submit Sale Order

```text
1. UI submits Sale Order data.
2. API builds facts and context.
3. Workflow Resolver selects workflow using ViewCode + Action + Tenant + Context.
4. Workflow Engine starts workflow instance.
5. Rule Engine executes pre-validation.
6. NumberingService generates document number.
7. SaleOrderService creates draft.
8. Header, party, payment, fulfillment, and line rule sets execute.
9. PricingService calculates price.
10. DiscountService calculates discount.
11. TaxService calculates tax.
12. ChargeService calculates charges.
13. CalculationService calculates totals.
14. Approval trigger rule set executes.
15. If approval is required, Workflow calls ApprovalService.
16. Workflow pauses at UserTask.
17. Approver completes approval task.
18. ApprovalService returns decision.
19. Workflow resumes.
20. Downstream protection rules execute.
21. SaleOrderService marks order open / downstream ready.
22. AuditService writes audit event.
23. IntegrationEventService publishes event.
24. NotificationService sends configured notification.
25. Workflow completes.
```

---

# 16. Codex Implementation Instructions

## 16.1 Goal

Implement Sale Order configurable core using Rule Engine, Workflow Engine, and Business Services.

## 16.2 Required Implementation Order

```text
1. Read Sale Order specification.
2. Read existing Rule and Workflow Engine implementation.
3. Create service definition model.
4. Create service registry.
5. Create approval service and approval matrix.
6. Create rule sets from Sale Order specification.
7. Create workflow definitions for draft, submit, approval, hold, release, cancel, amend.
8. Map workflow steps to rule sets and services.
9. Add execution logs for rules, workflows, and services.
10. Add simulation utilities for rule and workflow testing.
11. Add APIs to configure service actions and approval matrix.
12. Add tests for each rule set, workflow path, service success, service failure, approval path, and retry path.
```

---

## 16.3 Codex Prompt

```text
Implement configurable Sale Order processing using Rule Engine, Workflow Engine, and Business Services.

Use the Sale Order Specification v2.0 as the source of truth.

Break the specification into:
1. Rule sets
2. Workflow definitions
3. Service definitions
4. Approval matrix
5. Configuration metadata

Important rules:
- Do not hardcode pricing, tax, discount, approval routing, charge calculation, lifecycle exceptions, or downstream eligibility.
- Workflow Engine shall orchestrate.
- Rule Engine shall validate, derive, warn, and trigger approval.
- Services shall execute actual business operations.
- ApprovalService shall determine approver using configurable approval matrix.
- Rule Engine shall not directly assign a hardcoded approver.
- Workflow shall call ApprovalService when approval is required.
- All service calls shall return a standard response contract.
- All rule, workflow, service, and approval executions shall be logged.
- Existing rules and workflow engine patterns must be reused where possible.
- Add simulation support for rule set and workflow execution.
- Add tests for success, validation failure, service failure, approval required, approval rejected, returned for correction, cancel, hold, release, and amendment.

Deliver:
- Rule set seed data
- Workflow seed data
- Service registry
- Approval matrix configuration
- APIs for configuration
- Runtime execution changes
- Tests
- Documentation
```

---

# 17. Final Summary

The correct design is:

```text
Rule Engine:
    decides validation, derivation, warning, approval trigger, eligibility

Workflow Engine:
    decides step sequence, branching, pause/resume, lifecycle movement

Services:
    execute actual operations such as pricing, tax, charge, approval assignment, sale order persistence, audit, event publishing
```

The most important correction is approval.

Do not do this:

```text
Discount > 10% → SalesManager
```

Do this:

```text
Discount > 10%
    → Rule Engine returns approvalCategory = DISCOUNT_EXCEPTION
    → Workflow calls ApprovalService
    → ApprovalService checks approval matrix
    → ApprovalService creates task for ASM / Service Manager / HQ / Branch Manager based on configuration
    → Workflow waits
    → Approval outcome resumes workflow
```

This makes Sale Order configurable at runtime and suitable for different tenants, geographies, domains, and business processes.
