# IDMS-UI — Project Architecture & Feature Overview

> **Audience:** Development Team · Product Stakeholders  
> **Status:** UI Prototype / Design Showcase — not production-connected  
> **Last Updated:** May 2026

---

## Quick Stats

| Metric | Count |
|--------|-------|
| Transaction Modules | 9 (PR · PO · Receipt · Invoice · SO · SAR · SA · Sale Invoice · Delivery) |
| Admin Master Groups | 12 |
| Admin Masters Defined | 72 |
| Specialized Admin Pages | 5 (fully built with section navigation) |
| Built-in Brand Themes | 7 |
| Supported Languages | 5 (with Arabic RTL) |
| Common Components | 25+ |
| Routes | 30+ |
| Seeded Translations | 200+ keys |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.4 |
| Language | TypeScript | 6.0.2 |
| Build Tool | Vite | 8.0.4 |
| UI Components | Material UI (MUI) | 9.0.0 |
| Styling | Tailwind CSS + PostCSS | 4.2.2 |
| Routing | React Router | 7.14.2 |
| Charting | Recharts | — |
| CSS-in-JS | Emotion (via MUI) | — |
| Testing | Vitest | — |
| Package Manager | npm (ES module project) | — |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Routing System](#2-routing-system)
3. [Feature Modules](#3-feature-modules)
4. [Admin Panel](#4-admin-panel)
   - 4a. [Admin Infrastructure](#4a-admin-infrastructure)
   - 4b. [All 12 Master Groups](#4b-all-12-master-groups)
   - 4c. [5 Specialized Admin Pages](#4c-5-specialized-admin-pages)
5. [Theme & Brand System](#5-theme--brand-system)
6. [Localization System](#6-localization-system)
7. [AI Document Module](#7-ai-document-module)
8. [Global Search & Voice](#8-global-search--voice)
9. [Component Library](#9-component-library)
10. [State & Persistence](#10-state--persistence)
11. [Summary Statistics](#11-summary-statistics)

---

## 1. Architecture Overview

### Folder Structure

```
src/
├── App.tsx                   # Root: catalogue filter state, query param parsing
├── main.tsx                  # Bootstrap: HashRouter → providers chain
├── index.css                 # Global styles
├── assets/images/            # Static brand assets
│
├── components/
│   ├── app/                  # AppButton, AppDialog, AppDrawer, AppFormPrimitives
│   └── common/               # 25+ shared UI components (DataGrid, Catalogue, Search…)
│
├── pages/                    # Feature pages grouped by module
│   ├── purchase-requisition/
│   ├── purchase-order/
│   ├── purchase-receipt/
│   ├── purchase-invoice/
│   ├── sale-order/
│   ├── sale-allocation-requisition/
│   ├── sale-allocation/
│   ├── sale-invoice/
│   ├── delivery/
│   ├── approval-studio/
│   ├── profile/              # ThemeBuilder, MenuBuilder, PrintBuilder, BusinessSettings…
│   └── form-layout/
│
├── admin/                    # Full admin panel (master CRUD + dashboard)
│   ├── AdminShell.tsx
│   ├── AdminSidebar.tsx
│   ├── AdminDashboard.tsx
│   ├── MasterListPage.tsx    # Generic list CRUD
│   ├── MasterFormPage.tsx    # Generic form CRUD
│   ├── adminNavConfig.ts     # 12 groups × 72 masters definition
│   ├── adminStorage.ts       # Recently visited masters
│   └── masters/              # 5 specialized full-CRUD pages
│
├── features/ai-document/     # AI document generation engine
├── routes/                   # AppRoutes + sub-route files + path config
├── search/                   # Global search engine + voice commands
├── stores/                   # documentStore (SO + PO localStorage)
├── localization/             # i18n system (5 languages)
├── theme/                    # Theme registry, provider, MUI integration
├── print-builder/            # Print template engine
├── hooks/                    # useDialogFocusTrap, usePublishedMenu
├── utils/                    # Catalogue, menu, form layout, datagrid helpers
└── styles/                   # excellon-brand-guidelines.css (CSS variables)
```

### Bootstrap Chain

```
index.html
  └── Loads theme from localStorage (app-theme, app-theme-mode)
      └── main.tsx
            HashRouter
              └── LocalizationProvider   (language + translations)
                    └── ThemeProvider    (brand theme + MUI palette)
                          └── MenuBuilderProvider  (nav menu config)
                                └── App.tsx
                                      └── AppRoutes (lazy-loaded pages)
```

### Data Flow

```
Static Mock Data Files  (purchaseOrderData.ts, saleOrderData.ts…)
        ↓
  useState / useMemo   (in-memory filtering, sorting, aggregation)
        ↓
  React Context        (ThemeProvider, LocalizationProvider, MenuBuilderContext)
        ↓
  Props + Callbacks    (parent → child navigation, form state)
        ↓
  localStorage         (theme, catalogue views, translations, doc state)
        ↓
  Custom Events        (cross-component document store updates)
```

> **Note:** There is no Redux, Zustand, or MobX. All state is managed with React Context + `useState`. This is intentional for a prototype — the pattern can be migrated to a state management library for production.

---

## 2. Routing System

React Router v7 with **HashRouter** (`/#/path`) — chosen for prototype/demo hosting compatibility.

### Route Files

| File | Purpose |
|------|---------|
| `AppRoutes.tsx` | Root component combining all route renderers |
| `routeConfig.ts` | Central `paths` object — all path strings defined once |
| `routeScreens.ts` | All `React.lazy()` imports for code splitting |
| `createRoutes.tsx` | Create/edit form routes for all 9 document types |
| `listRoutes.tsx` | Catalogue/list routes for all 9 document types |
| `profileRoutes.tsx` | Admin/config pages (ThemeBuilder, MenuBuilder, PrintBuilder…) |
| `redirectRoutes.tsx` | Legacy URL redirects (e.g. `/approvalstudio` → `/approval-studio`) |
| `adminRoutes.tsx` | All `/admin/*` routes with specialized page overrides |

### Key Route Patterns

| Path | Component | Notes |
|------|-----------|-------|
| `/` | Redirects → `/purchase-requisition` | Default home |
| `/purchase-requisition` | PurchaseRequisitionCatalogueView | List/catalogue |
| `/purchase-requisition/new` | CreatePurchaseRequisition | Create form |
| `/purchase-order` | purchaseorderlist | List |
| `/purchase-order/new` | CreatePurchaseOrder | Create form |
| `/sale-order` | saleorderlist | List |
| `/sale-order/new` | CreateSaleOrder | Create form |
| `/approval-studio` | ApprovalStudioList | Workflow management |
| `/admin` | AdminDashboard | Admin home |
| `/admin/master/numbering-code-setup` | NumberingSettingsPage | ✅ Specialized |
| `/admin/master/picklist-master` | PicklistMasterPage | ✅ Specialized |
| `/admin/master/code-generation-policy` | CodeGenerationPolicyPage | ✅ Specialized |
| `/admin/master/kyc-setup` | KycSetupPage | ✅ Specialized |
| `/admin/master/organisation-master/:id` | OrgMasterFormPage | ✅ Specialized |
| `/admin/master/:masterKey` | MasterListPage | Generic list |
| `/admin/master/:masterKey/new` | MasterFormPage | Generic create |
| `/admin/master/:masterKey/:recordId` | MasterFormPage | Generic edit/view |
| `/theme-builder` | ThemeBuilder | Brand theme config |
| `/menu-builder` | MenuBuilder | Nav menu config |
| `/print-builder` | PrintBuilder | Print template config |

> **Admin route precedence:** Specialized routes are registered *before* the generic `:masterKey` catch-all, so they take priority.

---

## 3. Feature Modules

All 9 transaction modules follow a consistent structure: a **catalogue/list view** and a **create/edit form**.

### Module Summary

| Module | List Path | Create Path | Data File | Key Features |
|--------|-----------|-------------|-----------|-------------|
| **Purchase Requisition** | `/purchase-requisition` | `/purchase-requisition/new` | purchaseRequisitionCatalogueData.ts | Catalogue with saved views, filter drawer, insight cards |
| **Purchase Order** | `/purchase-order` | `/purchase-order/new` | purchaseOrderData.ts | Line items, supplier selection, localStorage persistence |
| **Purchase Receipt** | `/purchasereceiptlist` | `/purchase-receipt/new` | purchaseReceiptData.ts | GRN workflow, receipt against PO |
| **Purchase Invoice** | `/purchaseinvoicelist` | `/purchase-invoice/new` | purchaseInvoiceData.ts | 3-way matching, tax calculation |
| **Sale Order** | `/sale-order` | `/sale-order/new` | saleOrderData.ts · saleOrderViews.ts | Custom views, document store, full SO lifecycle |
| **Sale Allocation Requisition** | `/sale-allocation-requisition` | SAR create | — | SAR against SO |
| **Sale Allocation** | `/sale-allocation` | SA create | saleAllocationData.ts | Allocation to fulfilment |
| **Sale Invoice** | `/sale-invoice` | SI create | saleInvoiceData.ts | Invoice against SA |
| **Delivery** | `/delivery` | Delivery create | deliveryData.ts | Delivery tracking and dispatch |
| **Approval Studio** | `/approval-studio` | CreateApprovalWorkflow | approvalStudioData.ts | Multi-step approval chains, escalation rules |

### Catalogue / List View Features (common across all modules)

- **CommonDataGrid** — sortable columns, configurable density, saved column preferences
- **CatalogueInsightCards** — summary totals (total records, pending, approved, value)
- **CatalogueFilterDrawer** — filter by date range, status, supplier/customer, priority, amount
- **CatalogueViewSelector** — switch between saved custom views
- **DataGridChartDrawer** — visualize data as bar/line charts (Recharts)
- **DocumentPreviewDrawer** — side panel document detail preview
- **GlobalSearchPanel** — cross-module full-text search

### Data File Pattern

Each module has a `*Data.ts` file containing:
- Document interface (e.g. `PurchaseOrderDocument`)
- Mock seeded records array
- Getter functions (`getPurchaseOrderById`, etc.)
- Line item structures for complex documents

---

## 4. Admin Panel

The admin panel is a fully self-contained section accessible at `/admin`. It has its own layout shell, sidebar navigation, and a mix of generic and specialized CRUD pages.

### 4a. Admin Infrastructure

| File | Role |
|------|------|
| `AdminShell.tsx` | Layout wrapper: AppTopHeader + AdminSidebar + content area |
| `AdminSidebar.tsx` | Left navigation — renders groups and master entries from `adminNavConfig.ts` |
| `AdminDashboard.tsx` | Home page (`/admin`) — recently visited, quick links |
| `adminNavConfig.ts` | Source of truth: 12 groups, 72 master definitions (key, label, description) |
| `adminStorage.ts` | `recordRecentAdminMaster()` — tracks recently visited masters in localStorage |
| `MasterListPage.tsx` | Generic list page for masters that don't have a specialized page |
| `MasterFormPage.tsx` | Generic form page (add/edit/view) for standard masters |

**Generic CRUD pattern:** Masters without a specialized page use `MasterListPage` + `MasterFormPage`. The page renders fields dynamically based on the master's `key`. This covers ~67 of the 72 masters.

**Specialized page pattern:** 5 masters have hand-crafted full-CRUD pages with sidebar section navigation, section completion tracking, Draft → Active lifecycle, and in-page drawers. These are registered as dedicated routes before the generic `:masterKey` catch-all.

---

### 4b. All 12 Master Groups

#### 1. Organisation — 8 masters

| Key | Label | Description |
|-----|-------|-------------|
| `organisation-master` | Organisation Master | Define company profile and legal entity details |
| `branch-master` | Branch Master | Manage branches, outlets and office locations |
| `department-master` | Department Master | Configure departments and cost centres |
| `employee-master` | Employee Master | Manage employee records and profiles |
| `designation-master` | Designation Master | Define job titles and designations |
| `reporting-structure` | Reporting Structure | Set up hierarchical reporting relationships |
| `working-hours` | Working Hours / Break Management | Configure shift timings and break schedules |
| `holiday-master` | Holiday Master | Define public and company holidays |

#### 2. Users & Roles — 5 masters

| Key | Label | Description |
|-----|-------|-------------|
| `user-master` | User Master | Create and manage system user accounts |
| `role-master` | Role Master | Define user roles and access levels |
| `rbac` | RBAC | Role-based access control configuration |
| `approval-workflow` | Approval Workflow Master | Design approval chains and escalation rules |
| `notification-engine` | Notification Engine | Configure notifications, alerts and triggers |

#### 3. Location & Territory — 4 masters

| Key | Label | Description |
|-----|-------|-------------|
| `area-master` | Area Master | Define geographic areas and regions |
| `territory` | Territory | Configure sales and service territories |
| `beat-route` | Beat Route | Set up field service routes and schedules |
| `slot-master` | Slot Master | Configure time slots for scheduling |

#### 4. Business Partners — 5 masters

| Key | Label | Description |
|-----|-------|-------------|
| `supplier-master` | Supplier Master | Manage vendor and supplier profiles |
| `transporter-master` | Transporter Master | Configure logistics and transport partners |
| `insurance-provider` | Insurance Provider Master | Manage insurance company records |
| `financier-master` | Financier Master | Configure financing partners and banks |
| `customer-master` | Customer Master | Manage customer profiles and preferences |

#### 5. Products & Catalogue — 10 masters

| Key | Label | Description |
|-----|-------|-------------|
| `product-master` | Product Master | Define product catalog and specifications |
| `category-catalogue` | Category / Catalogue | Set up product categories and catalogues |
| `sub-category` | Sub Category | Configure product sub-categories |
| `product-group` | Product Group | Group related products together |
| `attribute` | Attribute | Define product attributes and variants |
| `brand` | Brand | Manage product brands and manufacturers |
| `unit-of-measurement` | Unit of Measurement | Configure measurement units for products |
| `chassis-master` | Chassis Master | Manage chassis numbers and vehicle specifics |
| `installbase-master` | Installbase Master | Track installed base and equipment records |
| `hex-file-master` | Hex File Master | Manage firmware and hex file versions |

#### 6. Warehouse & Inventory — 3 masters

| Key | Label | Description |
|-----|-------|-------------|
| `warehouse-master` | Warehouse Master | Define warehouse locations and zones |
| `barcode-qr-process` | Barcode / QR Code Process | Configure barcode and QR code workflows |
| `item-return-policy` | Item Return Policy | Set up return and refund rules |

#### 7. Service Config — 10 masters

| Key | Label | Description |
|-----|-------|-------------|
| `service-type` | Service Type | Define categories of services offered |
| `service-package` | Service Package | Configure bundled service packages |
| `service-labour` | Service Labour | Define labour tasks and standard rates |
| `service-contract` | Service Contract | Manage service agreements and AMCs |
| `service-group` | Service Group | Group related services together |
| `service-campaign` | Service Campaign | Configure seasonal or promotional campaigns |
| `service-bom` | Service BOM | Bill of materials for service operations |
| `pms` | PMS (Periodic Maintenance Services) | Configure scheduled maintenance schedules |
| `pickup-drop-setup` | Pickup & Drop Setup | Configure vehicle pickup and delivery |
| `recall-master` | Recall Master | Manage product recall campaigns and notices |

#### 8. Complaints & Cases — 8 masters

| Key | Label | Description |
|-----|-------|-------------|
| `complaint-master` | Complaint Master | Define complaint categories and handling |
| `complaint-group` | Complaint Group | Group complaints by type or department |
| `complaint-type` | Complaint Type | Configure specific complaint classifications |
| `case-category-master` | Case Category Master | Define case types and workflows |
| `activity-escalation` | Activity & Escalation Master | Set escalation rules and timelines |
| `follow-up-master` | Follow Up Master | Configure follow-up actions and reminders |
| `delay-master` | Delay Master | Define acceptable delay thresholds |
| `decline-master` | Decline Master | Configure decline reasons and handling |

#### 9. Finance & Pricing — 11 masters

| Key | Label | Description |
|-----|-------|-------------|
| `currency-master` | Currency Master | Define currencies and exchange rates |
| `kyc-setup` | KYC Setup | Configure KYC requirements and verification ✅ Specialized |
| `invoice-setup` | Invoice Setup | Define invoice formats and settings |
| `invoice-generation-templates` | Invoice Generation Templates | Configure service invoice templates |
| `charge-master` | Charge Master | Define charges, fees and penalties |
| `charge-rule-master` | Charge Rule Master | Set up charge calculation rules |
| `pricing-module` | Pricing Module | Configure pricing tiers and rules |
| `claim-master` | Claim Master | Manage warranty and insurance claims setup |
| `coupon-management` | Coupon Management | Create and manage discount coupons |
| `terms-master` | Terms Master | Define payment and delivery terms |
| `cancellation-master` | Cancellation Master | Set up cancellation rules and policies |

#### 10. Documents & Templates — 3 masters

| Key | Label | Description |
|-----|-------|-------------|
| `numbering-code-setup` | Numbering & Code Setup | Configure document numbering and auto-code generation ✅ Specialized |
| `code-generation-policy` | Code Generation Policy | Define how codes and numbers are generated for each entity ✅ Specialized |
| `print-engine` | Print Engine | Configure print layouts and document templates |

#### 11. Process & Checklists — 5 masters

| Key | Label | Description |
|-----|-------|-------------|
| `checklist-master` | Checklist Master | Create quality and compliance checklists |
| `picklist-master` | Picklist Master | Define dropdown values and picklists ✅ Specialized |
| `dependant-picklist` | Dependant Picklist | Configure cascaded dropdown dependencies |
| `ffr-process` | FFR Process | Set up fault, failure and resolution workflows |
| `inspection-master` | Inspection Master | Define vehicle and equipment inspection forms |

#### 12. Workshop Operations — 1 master

| Key | Label | Description |
|-----|-------|-------------|
| `bay-master` | Bay Master | Configure workshop bays and service stations |

---

### 4c. 5 Specialized Admin Pages

All 5 pages share a common UX pattern:
- **Left sidebar** (240px) — section navigation with completion state (✅ Complete / ● In progress / ○ Not started) + progress bar
- **Right main panel** — one section at a time, scrollable
- **Draft → Activate** lifecycle — save as draft first, then activate with full validation
- **Deactivation modal** — reason required + optional remark, produces Inactive state

---

#### Page 1: Organisation Master ✅

**Route:** `/admin/master/organisation-master/:recordId`  
**File:** `src/admin/masters/OrgMasterFormPage.tsx`  
**Purpose:** Full company / legal entity profile for the top-level organisation record.

| # | Section Key | Label | Key Fields |
|---|-------------|-------|-----------|
| 1 | `identity` | Company Identity | `code` (AUTO), `companyName`*, `legalName`*, `shortName`, `status`*, `description` |
| 2 | `address` | Address & Contact | `addressLine1`*, `addressLine2`, `city`*, `state`, `country`, `pinCode`, `phone`, `email`, `website` |
| 3 | `legal` | Legal & Tax | `gstNumber`, `panNumber`, `cinNumber`, `taxCategory`, `fiscalYearStart` |
| 4 | `branding` | Branding | `logoUrl`, `tagline`, `primaryColour` |
| 5 | `settings` | Notes & Settings | `effectiveFrom`, `effectiveTo`, `sortOrder`, `externalCode`, `remarks` |

*\* = Required for section completion*

---

#### Page 2: Numbering & Code Setup ✅

**Route:** `/admin/master/numbering-code-setup`  
**File:** `src/admin/masters/NumberingSettingsPage.tsx`  
**Purpose:** Two-in-one settings page for document code prefixes and code generation policies. Manages the raw building blocks that `CodeGenerationPolicyPage` consumes.

**Section 1 — Code Prefix Master**

| Field | Purpose |
|-------|---------|
| `prefixCode` | Unique prefix identifier |
| `prefixName` | Descriptive name |
| `displayName` | Display label (auto-synced from name) |
| `applicableFor` | Scope: Masters / Transactions / Configuration |
| `module` | Business module (Purchase, Sales, Inventory…) |
| `entity` | Entity type (Purchase Order, Sale Order…) |
| `entityType` | Sub-type within entity |
| `prefixValue` | The actual prefix characters |
| `defaultPrefix` | Toggle — is this the default for its scope |
| `activeStatus` | Active / Inactive toggle |
| Metadata | `createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate` |

**Section 2 — Code Generation Policy**

| Field | Purpose |
|-------|---------|
| `settingCode` | Policy code (AUTO) |
| `settingName`, `displayName`, `description` | Identity |
| `applicableFor`, `module`, `entity`, `entityType` | Scope |
| `prefix` | Reference to a Code Prefix Master entry |
| `seriesType` | Continuous / Calendar Year / Financial Year / Monthly / Daily |
| `seriesYearBasis`, `seriesYearLength` | Year format options |
| `numberLength` | Digit count (e.g. 5 → 00001) |
| `startingNumber`, `currentNumber`, `nextNumber`, `incrementBy` | Counter config |
| `paddingRequired`, `paddingCharacter`, `alignmentType` | Padding rules |
| `concatenationCharacter` | Separator between prefix and number |
| `resetRequired`, `resetFrequency`, `resetNumberTo` | Auto-reset schedule |
| `numberConsumptionEvent` | When number is consumed (on Save / on Submit) |
| `activeStatus`, `effectiveFrom`, `effectiveTo` | Validity |
| Metadata | `createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate` |

---

#### Page 3: Picklist Master ✅

**Route:** `/admin/master/picklist-master`  
**File:** `src/admin/masters/PicklistMasterPage.tsx`  
**Purpose:** Define and manage system-wide dropdown options. Supports flat, 2-level dependent, and 3-level dependent hierarchies with parent-child value mapping.

| # | Section Key | Label | Purpose |
|---|-------------|-------|---------|
| 1 | `config` | Picklist Configuration | Define picklist type and activation |
| 2 | `levels` | Picklist Levels | Configure hierarchy depth and level names |
| 3 | `values` | Picklist Values | Add values per level with sort order |
| 4 | `mapping` | Dependency Mapping | Map which child values appear under which parent |

**Section 1 — Configuration Fields**

| Field | Purpose |
|-------|---------|
| `code` | Unique picklist identifier |
| `name`, `displayName`, `description` | Identity |
| `configurationType` | Independent / Dependent / Multi-Level Dependent |
| `isActive` | Active status toggle |
| Metadata | `createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate` |

**Section 2 — Level Fields** *(repeated per hierarchy level)*

| Field | Purpose |
|-------|---------|
| `levelSequence` | Order in hierarchy (1 = root) |
| `parentLevelId` | Reference to parent level (empty for root) |
| `picklistName`, `displayName` | Level identity |
| `allowMultipleParentMapping` | One child can map to multiple parents |
| `allowValueReuse` | Same value can appear under different parents |

**Section 3 — Value Fields** *(repeated per value entry)*

| Field | Purpose |
|-------|---------|
| `code`, `name`, `displayName`, `description` | Value identity |
| `displaySequence` | Sort order in dropdown |
| `levelId` | Which level this value belongs to |
| `isActive` | Include in runtime dropdowns |
| `isDefault` | Pre-select in forms |

**Section 4 — Dependency Mapping Fields** *(repeated per mapping rule)*

| Field | Purpose |
|-------|---------|
| `parentLevelId`, `parentValueId` | Source of the dependency rule |
| `childLevelId`, `childValueId` | Target that becomes available |
| `isActive` | Enable / disable this mapping |

---

#### Page 4: Code Generation Policy ✅

**Route:** `/admin/master/code-generation-policy`  
**File:** `src/admin/masters/CodeGenerationPolicyPage.tsx`  
**Purpose:** Full-lifecycle policy management for automatic code generation. Each policy targets a specific module + entity + entity type combination and defines the full numbering scheme from prefix to format. Policies transition from Draft → Active → Inactive.

**Supported Entities:** Masters, Transactions, Configuration  
**Series Types:** Continuous · Calendar Year · Financial Year · Monthly · Daily · Custom

| # | Section Key | Label | Key Fields |
|---|-------------|-------|-----------|
| 1 | `basic` | Basic Details | `policyName`*, `displayName` (auto-sync), `description`, `status` toggle |
| 2 | `applicability` | Applicability | `applicableFor`*, `module`*, `entity`*, `entityType` (cascade) |
| 3 | `prefix` | Prefix Selection | `prefixId` — selects from Code Prefix Master; shows preview of `prefixValue` |
| 4 | `series` | Series & Pattern | `seriesType`*, `calendarYearFormat`, `financialYearFormat`, `customResetBasis`, `codePattern` preview |
| 5 | `format` | Number Format | `numberLength`*, `startingNumber`, `paddingCharacter`, `alignmentType`, `separator`, `caseFormat` |
| 6 | `history` | Usage & History | Read-only: current counter, last generated code, deactivation log, created/modified metadata |

*\* = Required for activation*

**Lifecycle:** Save as Draft (partial data ok) → Activate (runs full validation) → Deactivate (reason required)  
**Preview bar:** Sticky right-column preview renders a live sample code as fields are filled.

---

#### Page 5: KYC Setup ✅

**Route:** `/admin/master/kyc-setup`  
**File:** `src/admin/masters/KycSetupPage.tsx`  
**Purpose:** Configure Know-Your-Customer (KYC) proof document requirements per entity type and country. Defines what documents must be submitted, what format the document number must match, what attachments are required, and runtime validation rules.

**Supported Entities:** Customer · Supplier · Employee · Vendor · Partner  
**Supported Countries:** India 🇮🇳 · UAE 🇦🇪 · USA 🇺🇸 · UK 🇬🇧 · Australia 🇦🇺  
**Proof Categories:** Identity Proof · Address Proof · Financial Proof · Business Proof · Other

| # | Section Key | Label | Purpose |
|---|-------------|-------|---------|
| 1 | `overview` | Overview | Configuration identity, entity scoping and active status |
| 2 | `kyc-grid` | KYC Grid | Country-grouped accordion of proof requirement rows |
| 3 | `checklist` | Activation Checklist | 3 validation items; Activate button enabled when all pass |

**Section 1 — Overview Fields**

| Field | Purpose |
|-------|---------|
| `code` | AUTO-generated on first save |
| `isActive` | Configuration status toggle |
| `name`* | Config name (e.g. "Individual Customer KYC — India") |
| `displayName` | Auto-synced from name; editable ("Synced with Name ↗" badge while untouched) |
| `entity`* | Customer / Supplier / Employee / Vendor / Partner |
| `entityType`* | Cascades from entity (e.g. Customer → Individual / Corporate / Government) |
| `description` | Optional notes (500 char) |

**Section 2 — KYC Grid**

Country-grouped accordion. Each country group shows a table of proof rows with columns: Proof Category · Proof Type · Mandatory · Doc# · Attachment · Active (inline toggle) · Edit / Delete. An **Add Proof** button inside each group pre-fills that country.

Each proof row is configured via a **side drawer** (520px) with 5 progressive-disclosure groups:

**Drawer Group 1 — Proof Identity** *(always visible)*

| Field | Purpose |
|-------|---------|
| `country`* | Country this proof applies to |
| `proofCategory`* | Identity / Address / Financial / Business / Other |
| `proofType`* | Specific document (cascades from category) |

**Drawer Group 2 — Document Number Rules** *(toggle: `documentNumberRequired`)*

| Field | Purpose |
|-------|---------|
| `tooltip` | Helper text shown next to the document number input |
| `placeholderText` | Placeholder in the document number field |
| `isCharAllowed` | Allow alphabetic characters |
| `isNumberAllowed` | Allow numeric digits |
| `isSpecialCharAllowed` | Allow special characters |
| `allowedSpecialCharacters` | Which special chars (required if special chars enabled) |
| `minLength` | Minimum document number length |
| `maxLength` | Maximum document number length |

**Drawer Group 3 — Regex Validation** *(toggle: `mustMatchRegex`, accent: purple)*

| Field | Purpose |
|-------|---------|
| `regexPattern`* | Regex the document number must satisfy (live syntax validation) |
| `regexErrorMessage`* | Message shown to user when validation fails |

> Regex overrides Character/Number/Special Char and Min/Max Length rules at runtime.

**Drawer Group 4 — Attachment Settings** *(toggle: `isAttachmentEnabled`, accent: green)*

| Field | Purpose |
|-------|---------|
| `isAttachmentMandatory` | Transaction blocked without file upload |
| `allowedFileTypes` | Multi-select chips: PDF · JPG · PNG · XLSX · DOCX · CSV |
| `minFileSize` | Minimum file size in KB |
| `maxFileSize` | Maximum file size in KB |
| `maximumFileCount` | Maximum number of files allowed |

**Drawer Group 5 — Proof Status** *(always visible)*

| Field | Purpose |
|-------|---------|
| `isMandatory` | Transaction cannot proceed without submitting this proof |
| `isActive` | Inactive proofs excluded from all runtime validation |

**Section 3 — Activation Checklist**

Three clickable checklist items. Clicking any item navigates to the relevant section. The Activate button glows green when all 3 pass.

| # | Item | Pass Condition |
|---|------|---------------|
| 1 | Overview Complete | `name`, `entity`, and `entityType` all filled |
| 2 | At least 1 active proof | At least one proof row with `isActive = true` |
| 3 | All proof rows are valid | Every row has country, category, type, and no rule conflicts |

---

## 5. Theme & Brand System

### Built-in Themes

| Key | Brand | Notes |
|-----|-------|-------|
| `excellon` | Excellon (default) | Blue primary, clean enterprise |
| `bajaj` | Bajaj | Brand blue |
| `tata-motors` | Tata Motors | Tata blue |
| `ola` | Ola | Green/dark |
| `eka` | Eka | Orange accent |
| `hero` | Hero MotoCorp | Red primary |
| `royal-enfield` | Royal Enfield | Dark/forest green |

### Theme Architecture

| File | Role |
|------|------|
| `themeRegistry.ts` | All 7 theme color scales defined as objects |
| `ThemeProvider.tsx` | React context provider; manages theme + appearance mode state |
| `materialTheme.ts` | Converts brand theme object → MUI ThemeOptions (palette, typography, shadows…) |
| `themeContext.ts` | Context API type definitions |
| `useTheme.ts` | Consumer hook |
| `customThemeBuilder.ts` | Build, save and publish custom user-created themes |

### CSS Variable System

Themes are applied as CSS custom properties on `:root`. Key variables used across all admin pages:

| Variable | Purpose |
|----------|---------|
| `--color-primary` | Brand accent (buttons, active states, links) |
| `--color-primary-rgb` | RGB triplet for `rgba()` usage (e.g. `rgba(var(--color-primary-rgb), 0.06)`) |
| `--color-surface` | Card / panel background |
| `--color-surface-subtle` | Page background, subtle sections |
| `--color-border` | All border colors |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary / hint text |
| `--font-family-base` | Font family override per theme |
| `--radius-md` | Border radius |

### Features

- **Appearance modes:** Light and Dark — toggled via `ThemeSwitcher` component; persisted in `localStorage (app-theme-mode)`
- **Custom Theme Builder:** UI at `/theme-builder` allows users to define a custom color scale, preview it live, and save it — stored via `customThemeBuilder.ts`
- **MUI Integration:** MUI palette, typography, component overrides (button, input, card, etc.) all derive from the active theme
- **Direction:** LTR/RTL applied per language (Arabic → RTL flips the full layout)

---

## 6. Localization System

### Supported Languages

| Code | Language | RTL | Status |
|------|----------|-----|--------|
| `en` | English | No | Default |
| `hi` | Hindi | No | Seeded |
| `ar` | Arabic | Yes | Seeded (triggers full RTL layout flip) |
| `ta` | Tamil | No | Seeded |
| `mr` | Marathi | No | Seeded |

### Architecture

| File | Role |
|------|------|
| `i18nConfig.ts` | 200+ seeded translation key-value pairs for all 5 languages |
| `LocalizationProvider.tsx` | Context provider — current language, translations, direction |
| `languageService.ts` | Load, save, switch language |
| `translationService.ts` | `t('key', params)` lookup with parameter substitution |
| `localizationStorage.ts` | Read/write translations to `localStorage` |
| `useLocalization.ts` | Consumer hook used in components |
| `types.ts` | `Language`, `TranslationDictionary`, `LocalizationContext` interfaces |

### Translation Key Structure

Keys follow a namespace pattern: `namespace.subKey`

```
common.save          → "Save"
common.cancel        → "Cancel"
header.selectLanguage → "Select Language"
status.approved      → "Approved"
```

**Dynamic parameters:** `t('messages.count', { count: 5 })` → "5 items"

**Import/Export:** Translations can be exported as JSON and re-imported, allowing external translators to work offline.

**Persistence:** Translation overrides stored in `localStorage (localization:translations:v1)`.

---

## 7. AI Document Module

Located in `src/features/ai-document/`.

| File | Role |
|------|------|
| `AIDocumentDrawer.tsx` | Drawer UI — user types or speaks a request; AI generates a draft document |
| `aiDocumentService.ts` | Service layer for AI operation coordination |
| `documentCreationEngine.ts` | Core logic — assembles a structured document from AI-parsed input |
| `entityExtractor.ts` | Extracts entities (supplier name, quantity, product code) from free text |
| `intentParser.ts` | Parses intent (create PR / create PO / raise SO) from natural language |
| `types.ts` | Domain types: `AIDocumentRequest`, `ParsedIntent`, `ExtractedEntity` |

### Features

- **Natural language input** — user describes the document in plain text
- **Voice input support** — integrates with the voice command system
- **Intent detection** — distinguishes between PR, PO, SO, and other document types
- **Entity extraction** — pulls supplier, product, quantity, date from unstructured text
- **Draft pre-fill** — opens the relevant create form with extracted fields pre-populated

---

## 8. Global Search & Voice

Located in `src/search/`.

### Search Engine (`globalSearch.ts`)

| Feature | Detail |
|---------|--------|
| Searchable entities | All 9 document types (PR, PO, Receipt, Invoice, SO, SAR, SA, Sale Invoice, Delivery) |
| Match types | Exact · startsWith · contains · token (multi-word) |
| Field scoring | Primary fields score higher than secondary fields; exact match scores highest |
| Result grouping | Results returned grouped by entity type |
| Field indexing | Each entity type declares exactFields, primaryFields, secondaryFields |

### Supporting Files

| File | Role |
|------|------|
| `searchExperience.ts` | Search UI/UX state — debounce, history, recent queries |
| `searchInsights.ts` | Analytics: most searched terms, zero-result queries |
| `voiceCommand.ts` | Web Speech API integration — parses spoken commands into search queries or navigation intents |

### Voice Commands

The voice command system (`voiceCommand.ts`) accepts spoken input and converts it to:
- **Search queries** — "show me purchase orders from last week"
- **Navigation intents** — "go to sale orders" / "open approval studio"
- **AI document creation** — passed to `intentParser.ts` for document drafting

---

## 9. Component Library

### App Components (`src/components/app/`)

| Component | Purpose |
|-----------|---------|
| `AppButton.tsx` | Styled button — tone variants (primary, secondary, outline, ghost) + sizes (md, sm) |
| `AppDialog.tsx` | MUI dialog wrapper with consistent header/footer layout |
| `AppDrawer.tsx` | MUI side drawer with consistent header + scrollable body |
| `AppFormPrimitives.tsx` | Basic controlled form field components |

### Common Components (`src/components/common/`)

| Component | Purpose |
|-----------|---------|
| `AppShell.tsx` | Main layout — top header + collapsible sidebar + content area |
| `AppSidebar.tsx` | Navigation sidebar with menu builder integration |
| `AppTopHeader.tsx` | Top bar — theme switcher, language selector, global search, settings |
| `CommonDataGrid.tsx` | Advanced table — sort, filter, column config, density, aggregations, chart view |
| `CatalogueViewSelector.tsx` | Switch between named saved views |
| `CatalogueFilterDrawer.tsx` | Filter side panel — date range, status, supplier, priority, amount |
| `CatalogueInsightCards.tsx` | Summary KPI cards above catalogue list |
| `DataGridChartDrawer.tsx` | Recharts visualization of current data grid data |
| `DocumentPreviewDrawer.tsx` | Side panel showing document detail without navigating away |
| `GlobalSearchPanel.tsx` | Full-screen search with cross-module results grouped by type |
| `FormControls.tsx` | Controlled input, date picker, select fields for forms |
| `StatusBadge.tsx` | Colored pill badge for document status (Draft · Pending · Approved · etc.) |
| `ConfirmationDialog.tsx` | Delete / irreversible action confirmation modal |
| `CompactFormDialog.tsx` | Inline modal form for quick data entry |
| `GuidedTour.tsx` | In-app onboarding tour with step-by-step highlights |
| `ThemeSwitcher.tsx` | Toggle between light/dark mode + theme picker |
| `SortableTableHeader.tsx` | Column header with sort direction indicator |
| `DataGridConfigurator.tsx` | Panel for choosing visible columns, density, sort |

---

## 10. State & Persistence

### State Architecture

| Concern | Where |
|---------|-------|
| Brand theme + mode | `ThemeProvider` context |
| Active language + translations | `LocalizationProvider` context |
| Navigation menu config | `MenuBuilderContext` |
| Catalogue filter state | `App.tsx` props (passed down to route components) |
| Form state (all pages) | Component-level `useState` |
| Document records (SO, PO) | `documentStore.ts` + localStorage |
| Recently visited admin masters | `adminStorage.ts` + localStorage |

> No Redux / Zustand / MobX. Pure React Context + useState. Suitable for prototype; a state library should be evaluated for production.

### localStorage Key Reference

| Key | Stores |
|-----|--------|
| `app-theme` | Active theme key (e.g. `tata-motors`) |
| `app-theme-mode` | `light` or `dark` |
| `catalogue-custom-views:*` | User-saved catalogue view definitions |
| `catalogue-view-state:*` | Current active view per module |
| `catalogue-recently-viewed:*` | Recently opened document IDs per module |
| `documents:so:v1` | Sale Order records (CRUD state) |
| `documents:po:v1` | Purchase Order records (CRUD state) |
| `business-settings:v1` | Document action configuration |
| `localization:language` | Active language code |
| `localization:translations:v1` | Translation overrides dictionary |
| `data-grid-preferences:*` | Column visibility + order per grid |
| `admin-recently-visited` | Recently visited admin master keys |
| `print-templates:*` | Saved print template definitions |
| `custom-menus:*` | Published menu configurations |

### Custom Events

`documentStore.ts` dispatches custom DOM events when records change, allowing decoupled components to react without prop drilling:

```
DOCUMENT_STORE_EVENTS.SO_UPDATED   → Sale Order changed
DOCUMENT_STORE_EVENTS.PO_UPDATED   → Purchase Order changed
```

---

## 11. Summary Statistics

| Area | Count |
|------|-------|
| Transaction document types | 9 |
| Catalogue / list views | 9 |
| Create / edit form views | 9 |
| Admin master groups | 12 |
| Admin masters defined | 72 |
| Specialized admin pages (full CRUD + sections) | 5 |
| Generic admin masters (list + form) | 67 |
| Built-in brand themes | 7 |
| Supported UI languages | 5 |
| Seeded translation keys | 200+ |
| Common UI components | 25+ |
| Route definitions | 30+ |
| Print template entity types | 9 |
| localStorage persistence keys | 13+ |
| AI document feature files | 6 |
| Search match types | 4 (exact, startsWith, contains, token) |

---

*Generated from codebase analysis — May 2026*
