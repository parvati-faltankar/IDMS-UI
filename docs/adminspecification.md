# IDMS-UI Admin Panel — Technical Specification

**Version:** 1.0  
**Date:** June 7, 2026  
**Scope:** Frontend specification — UI architecture, navigation, page patterns, design system, and component contracts. Backend API contracts are not yet implemented.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Navigation Structure](#3-navigation-structure)
4. [Route Reference](#4-route-reference)
5. [Admin Dashboard](#5-admin-dashboard)
6. [Page Shell Patterns](#6-page-shell-patterns)
7. [Generic Master Pages](#7-generic-master-pages)
8. [Specialized Master Pages](#8-specialized-master-pages)
9. [Engine Configuration Section](#9-engine-configuration-section)
10. [Shared Experience Components](#10-shared-experience-components)
11. [Design System](#11-design-system)
12. [Component Governance](#12-component-governance)
13. [Data Persistence](#13-data-persistence)

---

## 1. Overview

The IDMS-UI admin panel is the system configuration hub for the iDMS enterprise application. It provides role-restricted access to all master data, business rules, workflow definitions, service registries, and operational configuration.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | React Router DOM v7 (HashRouter — all URLs start with `/#/`) |
| Styling | CSS custom properties (no Tailwind in admin) |
| Icons | Lucide React |
| State | Local component state (`useState`, `useCallback`) — no global store in admin |
| Persistence | `localStorage` (favorites, recently visited, offline engine config) |

### Entry Points

| File | Purpose |
|---|---|
| `src/admin/AdminShell.tsx` | Layout wrapper for all admin pages |
| `src/admin/adminNavConfig.ts` | Navigation structure — all 13 groups and ~76 masters |
| `src/admin/adminStorage.ts` | localStorage helpers for favorites and recent visits |
| `src/routes/adminRoutes.tsx` | React Router route definitions for all admin paths |
| `src/admin/AdminDashboard.tsx` | Admin home page |
| `src/admin/MasterListPage.tsx` | Generic list page (used by all unmapped masters) |
| `src/admin/MasterFormPage.tsx` | Generic form page (4-tab create/edit form) |

### URL Convention

All admin routes are prefixed with `/#/admin`. The HashRouter is configured in `src/App.tsx`. Direct navigation to `/admin` loads `AdminDashboard`. All master list pages follow the pattern `/#/admin/master/:masterKey` or a dedicated path for specialized masters.

---

## 2. Architecture

### Shell Layering

```
┌─────────────────────────────────────────────────────────┐
│  AppTopHeader (52px, dark #1f2025)                      │
│  Logo · Search · Theme Toggle · Language · User Menu    │
├──────────────┬──────────────────────────────────────────┤
│              │  app-shell__main                         │
│ AdminSidebar │  ┌────────────────────────────────────┐  │
│ (~260px      │  │  Page Component                    │  │
│  expanded /  │  │  (wrapped in AdminListPageShell    │  │
│  ~60px       │  │   or AdminPageShell)               │  │
│  collapsed)  │  └────────────────────────────────────┘  │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│  [Command Palette — Ctrl+K — floating overlay]          │
│  [Help Drawer — contextual — floating right panel]      │
└─────────────────────────────────────────────────────────┘
```

### AdminShell Props

```typescript
interface AdminShellProps {
  children: React.ReactNode;
  contentClassName?: string; // Applied to .app-shell__content
}
```

### AdminShell CSS Classes

| Class | Description |
|---|---|
| `.app-shell` | Root container, `display: flex; flex-direction: column` |
| `.app-shell__body` | Flex row — sidebar + main |
| `.app-shell__overlay` | Mobile backdrop (transparent, click closes mobile nav) |
| `.app-shell__main` | Main content scrollable column |
| `.app-shell__content` | Direct child of main; receives `contentClassName` |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Toggle Command Palette |
| `Escape` | Close mobile nav |

### Sidebar Collapse

- **Desktop:** Toggle button. State persisted in session.
- **Mobile:** Auto-closes when viewport > 1024px on resize. Controlled via `isMobileNavOpen` state.

### Command Palette

- Triggered via keyboard shortcut only (not exposed as a menu item).
- Shows recently visited masters as "Continue" items.
- Searches all admin masters by label, description, and group name.
- Navigates to the selected master path on selection.

### Global Help Drawer

- Opened via the `?` help button present on each page.
- Each page passes a `helpTopicId` string that maps to content in `src/experience/components/HelpDrawer/helpTopics.ts`.
- Initial admin-dashboard topic: `admin-dashboard`.

---

## 3. Navigation Structure

### Source File

`src/admin/adminNavConfig.ts`

### Key Exports

```typescript
export interface AdminMasterItem {
  key: string;        // Unique master identifier
  label: string;      // Display label
  description: string; // One-line description
  path: string;       // Route path (absolute, without /#)
}

export interface AdminNavGroup {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;     // Hex — background of icon container
  iconColor: string;  // Hex — icon stroke color
  masters: AdminMasterItem[];
}

export const adminNavGroups: AdminNavGroup[]  // 13 groups
export const allAdminMasters: (AdminMasterItem & { groupKey, groupLabel, groupIcon, groupIconBg, groupIconColor })[]

export function findMasterByKey(key: string): AdminMasterItem | null
export function findGroupForMasterKey(masterKey: string): AdminNavGroup | null
```

### Navigation Groups

| # | Key | Label | Icon | Icon BG | Icon Color | Masters |
|---|---|---|---|---|---|---|
| 1 | `organisation` | Organisation | Building2 | `#EFF6FF` | `#2563EB` | 8 |
| 2 | `user-access` | Users & Roles | Shield | `#F5F3FF` | `#7C3AED` | 5 |
| 3 | `location` | Location & Territory | MapPin | `#F0FDF4` | `#16A34A` | 4 |
| 4 | `business-partners` | Business Partners | Users2 | `#FFFBEB` | `#D97706` | 2 |
| 5 | `product-catalogue` | Products & Catalogue | Package | `#FFF7ED` | `#EA580C` | 10 |
| 6 | `warehouse` | Warehouse & Inventory | Warehouse | `#ECFEFF` | `#0891B2` | 3 |
| 7 | `service` | Service Config | Wrench | `#EEF2FF` | `#4F46E5` | 10 |
| 8 | `complaint` | Complaints & Cases | AlertCircle | `#FEF2F2` | `#DC2626` | 8 |
| 9 | `finance` | Finance & Pricing | CreditCard | `#F0FDF4` | `#059669` | 11 |
| 10 | `document-code` | Documents & Templates | FileCode2 | `#F8FAFC` | `#475569` | 3 |
| 11 | `process-checklist` | Process & Checklists | ClipboardCheck | `#FDF4FF` | `#A21CAF` | 5 |
| 12 | `workshop` | Workshop Operations | Factory | `#FFF1F2` | `#E11D48` | 1 |
| 13 | `engine-config` | Engine Configuration | Settings2 | `#F0F9FF` | `#0284C7` | 4 |

**Total: 76 masters across 13 groups.**

### Complete Master Inventory

#### Group: Organisation (8)

| Key | Label | Description | Path |
|---|---|---|---|
| `organisation-master` | Organisation Master | Define company profile and legal entity details | `/admin/master/organisation-master` |
| `branch-master` | Branch Master | Manage branches, outlets and office locations | `/admin/master/branch-master` |
| `department-master` | Department Master | Configure departments and cost centres | `/admin/master/department-master` |
| `employee-master` | Employee Master | Manage employee records and profiles | `/admin/master/employee-master` |
| `designation-master` | Designation Master | Define job titles and designations | `/admin/master/designation-master` |
| `reporting-structure` | Reporting Structure | Set up hierarchical reporting relationships | `/admin/master/reporting-structure` |
| `working-hours` | Working Hours / Break Management | Configure shift timings and break schedules | `/admin/master/working-hours` |
| `holiday-master` | Holiday Master | Define public and company holidays | `/admin/master/holiday-master` |

#### Group: Users & Roles (5)

| Key | Label | Description | Path |
|---|---|---|---|
| `user-master` | User Master | Create and manage system user accounts | `/admin/master/user-master` |
| `role-master` | Role Master | Define user roles and access levels | `/admin/master/role-master` |
| `rbac` | RBAC | Role-based access control configuration | `/admin/master/rbac` |
| `approval-workflow` | Approval Workflow Master | Design approval chains and escalation rules | `/admin/master/approval-workflow` |
| `notification-engine` | Notification Engine | Configure notifications, alerts and triggers | `/admin/master/notification-engine` |

#### Group: Location & Territory (4)

| Key | Label | Description | Path |
|---|---|---|---|
| `area-master` | Area Master | Define geographic areas and regions | `/admin/area-dashboard` |
| `territory` | Territory | Configure sales and service territories | `/admin/master/territory` |
| `beat-route` | Beat Route | Set up field service routes and schedules | `/admin/master/beat-route` |
| `slot-master` | Slot Master | Configure time slots for scheduling | `/admin/master/slot-master` |

#### Group: Business Partners (2)

| Key | Label | Description | Path |
|---|---|---|---|
| `supplier-master` | Supplier Master | Manage vendor and supplier profiles | `/admin/supplier-master` |
| `customer-master` | Customer Master | Manage customer profiles and preferences | `/admin/master/customer-master` |

#### Group: Products & Catalogue (10)

| Key | Label | Description | Path |
|---|---|---|---|
| `product-master` | Product Master | Define product catalog and specifications | `/admin/product-master` |
| `category-catalogue` | Category / Catalogue | Set up product categories and catalogues | `/admin/master/category-catalogue` |
| `sub-category` | Sub Category | Configure product sub-categories | `/admin/master/sub-category` |
| `product-group` | Product Group | Group related products together | `/admin/master/product-group` |
| `attribute` | Attribute | Define product attributes and variants | `/admin/master/attribute` |
| `brand` | Brand | Manage product brands and manufacturers | `/admin/master/brand` |
| `unit-of-measurement` | Unit of Measurement | Configure measurement units for products | `/admin/master/unit-of-measurement` |
| `chassis-master` | Chassis Master | Manage chassis numbers and vehicle specifics | `/admin/master/chassis-master` |
| `installbase-master` | Installbase Master | Track installed base and equipment records | `/admin/master/installbase-master` |
| `hex-file-master` | Hex File Master | Manage firmware and hex file versions | `/admin/master/hex-file-master` |

#### Group: Warehouse & Inventory (3)

| Key | Label | Description | Path |
|---|---|---|---|
| `warehouse-master` | Warehouse Master | Define warehouse locations and zones | `/admin/master/warehouse-master` |
| `barcode-qr-process` | Barcode / QR Code Process | Configure barcode and QR code workflows | `/admin/master/barcode-qr-process` |
| `item-return-policy` | Item Return Policy | Set up return and refund rules | `/admin/master/item-return-policy` |

#### Group: Service Config (10)

| Key | Label | Description | Path |
|---|---|---|---|
| `service-type-master` | Service Type | Define categories of services offered | `/admin/master/service-type-master` |
| `service-package` | Service Package | Configure bundled service packages | `/admin/master/service-package` |
| `service-labour` | Service Labour | Define labour tasks and standard rates | `/admin/master/service-labour` |
| `service-contract` | Service Contract | Manage service agreements and AMCs | `/admin/master/service-contract` |
| `service-group` | Service Group | Group related services together | `/admin/master/service-group` |
| `service-campaign` | Service Campaign | Configure seasonal or promotional campaigns | `/admin/master/service-campaign` |
| `service-bom` | Service BOM | Bill of materials for service operations | `/admin/master/service-bom` |
| `pms` | PMS (Periodic Maintenance Services) | Configure scheduled maintenance schedules | `/admin/master/pms` |
| `pickup-drop-setup` | Pickup & Drop Setup | Configure vehicle pickup and delivery | `/admin/master/pickup-drop-setup` |
| `recall-master` | Recall Master | Manage product recall campaigns and notices | `/admin/master/recall-master` |

#### Group: Complaints & Cases (8)

| Key | Label | Description | Path |
|---|---|---|---|
| `complaint-master` | Complaint Master | Define complaint categories and handling | `/admin/master/complaint-master` |
| `complaint-group` | Complaint Group | Group complaints by type or department | `/admin/master/complaint-group` |
| `complaint-type` | Complaint Type | Configure specific complaint classifications | `/admin/master/complaint-type` |
| `case-category-master` | Case Category Master | Define case types and workflows | `/admin/master/case-category-master` |
| `activity-escalation` | Activity & Escalation Master | Set escalation rules and timelines | `/admin/master/activity-escalation` |
| `follow-up-master` | Follow Up Master | Configure follow-up actions and reminders | `/admin/master/follow-up-master` |
| `delay-master` | Delay Master | Define acceptable delay thresholds | `/admin/master/delay-master` |
| `decline-master` | Decline Master | Configure decline reasons and handling | `/admin/master/decline-master` |

#### Group: Finance & Pricing (11)

| Key | Label | Description | Path |
|---|---|---|---|
| `currency-master` | Currency Master | Define currencies and exchange rates | `/admin/master/currency-master` |
| `kyc-setup` | KYC Setup | Configure KYC requirements and verification | `/admin/master/kyc-setup` |
| `invoice-setup` | Invoice Setup | Define invoice formats and settings | `/admin/master/invoice-setup` |
| `invoice-generation-templates` | Invoice Generation Templates | Configure service invoice templates | `/admin/master/invoice-generation-templates` |
| `charge-master` | Charge Master | Define charges, fees and penalties | `/admin/master/charge-master` |
| `charge-rule-master` | Charge Rule Master | Set up charge calculation rules | `/admin/master/charge-rule-master` |
| `pricing-module` | Pricing Module | Configure pricing tiers and rules | `/admin/master/pricing-module` |
| `claim-master` | Claim Master | Manage warranty and insurance claims setup | `/admin/master/claim-master` |
| `coupon-management` | Coupon Management | Create and manage discount coupons | `/admin/master/coupon-management` |
| `terms-master` | Terms Master | Define payment and delivery terms | `/admin/master/terms-master` |
| `cancellation-master` | Cancellation Master | Set up cancellation rules and policies | `/admin/master/cancellation-master` |

#### Group: Documents & Templates (3)

| Key | Label | Description | Path |
|---|---|---|---|
| `numbering-code-setup` | Numbering & Code Setup | Configure document numbering and auto-code generation | `/admin/master/numbering-code-setup` |
| `code-generation-policy` | Code Generation Policy | Define how codes and numbers are generated for each entity | `/admin/master/code-generation-policy` |
| `print-engine` | Print Engine | Configure print layouts and document templates | `/admin/master/print-engine` |

#### Group: Process & Checklists (5)

| Key | Label | Description | Path |
|---|---|---|---|
| `checklist-master` | Checklist Master | Create quality and compliance checklists | `/admin/master/checklist-master` |
| `picklist-master` | Picklist Master | Define dropdown values and picklists | `/admin/master/picklist-master` |
| `dependant-picklist` | Dependant Picklist | Configure cascaded dropdown dependencies | `/admin/master/dependant-picklist` |
| `ffr-process` | FFR Process | Set up fault, failure and resolution workflows | `/admin/master/ffr-process` |
| `inspection-master` | Inspection Master | Define vehicle and equipment inspection forms | `/admin/master/inspection-master` |

#### Group: Workshop Operations (1)

| Key | Label | Description | Path |
|---|---|---|---|
| `bay-master` | Bay Master | Configure workshop bays and service stations | `/admin/master/bay-master` |

#### Group: Engine Configuration (4)

| Key | Label | Description | Path |
|---|---|---|---|
| `rule-engine-config` | Rule Engine | Manage rule sets and business validation logic | `/admin/engine-config/rule-sets` |
| `workflow-config` | Workflow Configuration | Define workflow orchestration steps and transitions | `/admin/engine-config/workflows` |
| `service-registry` | Service Registry | Configure service endpoints, retries, and action codes | `/admin/engine-config/services` |
| `approval-matrix` | Approval Matrix | Set up approval levels and escalation rules | `/admin/engine-config/approval-matrix` |

---

## 4. Route Reference

**Source file:** `src/routes/adminRoutes.tsx`

All paths below are relative to the HashRouter root. Prepend `/#` in the browser.

### Core Admin Routes

| Path | Component | Notes |
|---|---|---|
| `/admin` | `AdminDashboard` | Home — search, favorites, setup assistant, module grid |
| `/admin/master/:masterKey` | `MasterListPage` | Generic list (mock data) for all unmapped masters |
| `/admin/master/:masterKey/new` | `MasterFormPage` | Generic create form (4 tabs) |
| `/admin/master/:masterKey/:recordId` | `MasterFormPage` | Generic edit form |

### Specialized Master Routes

| Path | Component |
|---|---|
| `/admin/master/organisation-master/new` | `OrgMasterFormPage` |
| `/admin/master/organisation-master/:recordId` | `OrgMasterFormPage` |
| `/admin/master/numbering-code-setup` | `NumberingSettingsPage` |
| `/admin/master/picklist-master` | `PicklistMasterPage` |
| `/admin/master/code-generation-policy` | `CodeGenerationPolicyPage` |
| `/admin/master/kyc-setup` | `KycSetupPage` |

### Area Master Routes

| Path | Component |
|---|---|
| `/admin/area-dashboard` | `AreaDashboardPage` |
| `/admin/area-levels` | `AreaLevelListPage` |
| `/admin/area-levels/new` | `AreaLevelFormPage` |
| `/admin/area-levels/:id` | `AreaLevelFormPage` |
| `/admin/areas` | `AreaListPage` |
| `/admin/areas/new` | `AreaFormPage` |
| `/admin/areas/:id` | `AreaFormPage` |
| `/admin/area-tree` | `AreaTreePage` |
| `/admin/area-import` | `AreaImportPage` |

### Business Partner Routes

| Path | Component |
|---|---|
| `/admin/supplier-master` | `SupplierListPage` |
| `/admin/supplier-master/new` | `SupplierFormPage` |
| `/admin/supplier-master/:id` | `SupplierFormPage` |
| `/admin/master/customer-master` | `CustomerListPage` |
| `/admin/master/customer-master/new` | `CustomerFormPage` |
| `/admin/master/customer-master/:id` | `CustomerFormPage` |

### Product Catalogue Routes

| Path | Component |
|---|---|
| `/admin/product-master` | `ProductListPage` |
| `/admin/product-master/new` | `ProductFormPage` |
| `/admin/product-master/:id` | `ProductFormPage` |
| `/admin/master/unit-of-measurement` | `UomListPage` |
| `/admin/master/unit-of-measurement/new` | `UomFormPage` |
| `/admin/master/unit-of-measurement/:recordId` | `UomFormPage` |

### Service & Location Routes

| Path | Component |
|---|---|
| `/admin/master/slot-master` | `SlotListPage` |
| `/admin/master/slot-master/new` | `SlotFormPage` |
| `/admin/master/slot-master/:recordId` | `SlotFormPage` |
| `/admin/master/service-type-master` | `ServiceTypeListPage` |
| `/admin/master/service-type-master/new` | `ServiceTypeFormPage` |
| `/admin/master/service-type-master/:recordId` | `ServiceTypeFormPage` |

### Engine Configuration Routes

| Path | Component |
|---|---|
| `/admin/engine-config/rule-sets` | `RuleEngineConfigList` |
| `/admin/engine-config/rule-sets/new` | `RuleSetEditor` |
| `/admin/engine-config/rule-sets/:ruleSetCode` | `RuleSetEditor` |
| `/admin/engine-config/workflows` | `WorkflowConfigList` |
| `/admin/engine-config/workflows/new` | `WorkflowStepEditor` |
| `/admin/engine-config/workflows/:workflowCode` | `WorkflowStepEditor` |
| `/admin/engine-config/services` | `ServiceRegistryList` |
| `/admin/engine-config/services/new` | `ServiceDefinitionEditor` |
| `/admin/engine-config/services/:serviceCode` | `ServiceDefinitionEditor` |
| `/admin/engine-config/approval-matrix` | `ApprovalMatrixList` |
| `/admin/engine-config/approval-matrix/new` | `ApprovalMatrixEditor` |
| `/admin/engine-config/approval-matrix/:entryId` | `ApprovalMatrixEditor` |

---

## 5. Admin Dashboard

**File:** `src/admin/AdminDashboard.tsx`

### Summary Counts

- `TOTAL_MASTERS` = `allAdminMasters.length` (76 at time of writing)
- `TOTAL_GROUPS` = `adminNavGroups.length` (13 at time of writing)

### Page Header

- Title: **"System Configuration"**
- Description: *"{TOTAL_MASTERS} masters across {TOTAL_GROUPS} modules"*
- Breadcrumb: `['Admin']`
- Help topic ID: `admin-dashboard`

### Hero Search

- Placeholder: *"Search any master, e.g. Customer, Service, Invoice…"*
- Shows top 8 matches (fuzzy match on label, description, group label)
- Clear button when query is non-empty
- Navigates to master path on selection
- Keyboard: up/down to navigate results, Enter to select, Escape to close

### Setup Assistant

Five recommended setup items (hardcoded, statuses reflect setup progress):

| ID | Label | Status |
|---|---|---|
| `org-setup` | Organisation Setup | `needs-attention` |
| `numbering-codes` | Numbering & Codes | `not-started` |
| `picklist-config` | Picklist Configuration | `not-started` |
| `kyc-rules` | KYC Rules | `needs-attention` |
| `roles-access` | Roles & Access | `not-started` |

### Pending Alerts (Dismissible)

| Severity | Message |
|---|---|
| `warning` | "Organisation Master is not fully configured — tax identifiers are missing" |
| `error` | "No active KYC rules found — party verification will fail for new records" |
| `warning` | "Picklist values for Delivery Mode and Payment Terms are not yet defined" |

### Favorites & Recently Visited

- Two-column grid on md+ screens, stacked on mobile
- **Favorites:** Top 5 favorited masters (from `admin-favorites:v1` localStorage key)
- **Recently Visited:** Top 5 recent visits (from `admin-recent:v1` localStorage key)
- Each card: group icon, master label, group label, action button (Go / Open)

### Module Groups Grid

- 4-column grid (≥xl), 3-col (≥lg), 2-col (≥sm), 1-col (xs)
- Each card: group icon, label, description, top 3 master names as links
- Click card → navigates to first master in group

---

## 6. Page Shell Patterns

There are **four** approved shell patterns. Each is mutually exclusive — do not combine them on the same page.

---

### 6.1 AdminListPageShell

**File:** `src/experience/components/AdminListPageShell/`

**Use for:** All list and table pages (collection browsing, search and filter, bulk action).

#### Visual Layout

```
┌──────────────────────────────────────────────────┐
│ PageBar (compact ~44px)                          │
│  Breadcrumb · Title · Summary chips · Actions   │
├──────────────────────────────────────────────────┤
│ SmartToolbar (~40px)                             │
│  Search input · Quick filter chips · Toolbar    │
├──────────────────────────────────────────────────┤
│ Table / Content (fills remaining viewport)       │
│  Above fold on 1366×768 without scrolling        │
└──────────────────────────────────────────────────┘
```

**Max vertical overhead:** ~184px (24% of 768px viewport height).  
**Goal:** Table header visible without scrolling on a standard 1366×768 laptop.

#### Props

```typescript
interface AdminListPageShellProps {
  title: string;
  description?: string;
  breadcrumbs: string[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  quickFilterItems: Array<{ key: string; label: string; count?: number }>;
  activeQuickFilter: string;
  onQuickFilterChange: (key: string) => void;
  summaryItems?: Array<{ label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'error' }>;
  toolbarActions?: React.ReactNode;  // Right-side toolbar (e.g., Filters button)
  helpTopicId?: string;
  onHelpClick?: () => void;
  children: React.ReactNode; // Table content
}
```

#### Rules

- Use `AdminListPageShell`, NOT `AdminPageShell`, for list views
- Do NOT add a duplicate `<PageHeader>` inside — the shell includes one
- Table must be visible above fold on a 1366×768 display
- No page-level `CommandPalette` (global only, via `AdminShell`)

---

### 6.2 AdminPageShell

**File:** `src/experience/components/AdminPageShell/`

**Use for:** Form pages, settings pages, simple config pages (not multi-section).

#### Visual Layout

```
┌──────────────────────────────────────────────────┐
│ PageHeader (~60px)                               │
│  Breadcrumb · Title · Description · Status ·    │
│  Primary Action · Help                           │
├──────────────────────────────────────────────────┤
│ [Setup Health strip — optional]                  │
├──────────────────────────────────────────────────┤
│ [Summary strip — optional, 4–6 metrics]          │
├──────────────────────────────────────────────────┤
│ [Toolbar — optional]                             │
├──────────────────────────────────────────────────┤
│ Children                                         │
└──────────────────────────────────────────────────┘
```

#### Props

```typescript
interface AdminPageShellProps {
  title: string;
  description?: string;
  breadcrumbs: string[];
  statusLabel?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryActions?: Array<{ label: string; onClick: () => void; variant?: 'default' | 'danger' }>;
  summaryItems?: Array<{ label: string; value: string | number }>;
  setupHealth?: { message: string; tone: 'warning' | 'error' };
  maxContentWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  toolbar?: React.ReactNode;
  helpTopicId?: string;
  onHelpClick?: () => void;
  children: React.ReactNode;
}
```

---

### 6.3 AdminConfigShell

**File:** `src/experience/components/AdminConfigShell/`

**Use for:** Multi-section configuration forms with left navigation (e.g., KYC Setup, Picklist Master, Invoice Setup).

#### Visual Layout

```
┌──────────────────────────────────────────────────────────┐
│ PageHeader (full width)                                  │
├────────────────────────┬─────────────────────────────────┤
│ Left Nav (~200px)      │ Section Content                 │
│  • Section 1 ✓        │  Form fields for active section │
│  • Section 2          │                                 │
│  • Section 3          │                                 │
│                        │                                 │
└────────────────────────┴─────────────────────────────────┘
```

- Each section shows a completion indicator (checkmark when all required fields present)
- Left nav is sticky while section content scrolls
- NOT for use in list pages

---

### 6.4 Compact Form Workspace

**Use for:** Multi-step activation workflows, guided create flows (e.g., `CodeGenerationPolicyPage`).

#### Visual Layout

```
┌────────────────────────────────────────┐
│ Fixed Header (~52px)                   │
│  Title · Step label · Cancel           │
├────────────────────────────────────────┤
│ Step Indicator Bar (~32px)             │
├────────────────────────────────────────┤
│ Scrollable Body                        │
│  (flex: 1; overflow-y: auto)          │
├────────────────────────────────────────┤
│ Fixed Footer (~56px)                   │
│  [Back] [Save Draft]  [Next / Finish] │
└────────────────────────────────────────┘
```

- Self-contained layout — **no `AdminPageShell` wrapper**
- Outer container: `display: flex; flex-direction: column; height: 100%; overflow: hidden`
- Combined header + step bar overhead must not exceed 136px

---

## 7. Generic Master Pages

### 7.1 MasterListPage

**File:** `src/admin/MasterListPage.tsx`

Used by all 50+ masters that do not have a dedicated page component.

#### Features

| Feature | Detail |
|---|---|
| Mock data | Auto-generated by `masterKey` — 12–20 rows per page |
| Search | Searches `id`, `name` fields |
| Quick Filters | All · Active · Inactive · Draft (when applicable) |
| Sort | Clickable column headers: id, name, status, createdDate (toggle asc/desc) |
| Pagination | 10 / 25 / 50 per page selector |
| Bulk Actions | Select rows → Activate, Deactivate, Delete buttons appear |
| Row Actions | View (preview drawer), Edit (navigate), Delete (confirm dialog) |

#### Table Columns

| Column | Type | Notes |
|---|---|---|
| Checkbox | `<input type="checkbox">` | Select all / individual |
| ID | Monospace string | Auto-generated (e.g., `ORG-001`) |
| Name | String | Primary identifier |
| Status | Badge | Green = Active, Red = Inactive, Gray = Draft |
| Created Date | `DD/MM/YYYY` | |
| Updated Date | `DD/MM/YYYY` | |
| Actions | Row menu `⋮` | View · Edit · Delete |

#### Summary Strip (top of page)

Chips showing counts: **Total** · **Active** · **Inactive** · **Draft** (if > 0)

---

### 7.2 MasterFormPage (Generic)

**File:** `src/admin/MasterFormPage.tsx`

Used by all masters without a dedicated form component.

#### Title Modes

| Mode | Title |
|---|---|
| Create | "New {master.label}" |
| Edit | "Edit {master.label}" |
| View | "View {master.label}" (all fields read-only) |

#### Tab Structure (4 tabs)

**Tab 1 — Basic Information**

| Field | Type | Required |
|---|---|---|
| Code | Text (auto-hint) | No |
| Name | Text | Yes |
| Short Name | Text | No |
| Status | Select: Active / Inactive / Draft | Yes |
| Description | Textarea | No |

**Tab 2 — Additional Details**

| Field | Type |
|---|---|
| Sort Order | Number |
| External Code | Text |
| Parent Code | Text |

**Tab 3 — Configuration**

| Field | Type |
|---|---|
| Effective From | Date |
| Effective To | Date |

*Note shown: "Record will be auto-inactivated after Effective To date."*

**Tab 4 — Notes & Remarks**

| Field | Type |
|---|---|
| Remarks | Textarea (6 rows) |

#### Action Buttons (non-view mode)

| Button | Behavior |
|---|---|
| Cancel | Navigate back to list |
| Save Draft | Saves without completing activation |
| Save & New *(Create only)* | Saves and opens blank form |
| Save *(primary)* | Saves and returns to list |

#### State Tracking

- `isDirty` flag triggers navigation guards (unsaved changes warning)
- Status label in `PageHeader` reflects current save state
- 600ms simulated API delay (mock, no real backend call)

---

## 8. Specialized Master Pages

### 8.1 Area Master

**Location:** `src/admin/masters/area-master/pages/`

Six sub-pages accessible from `AreaDashboardPage` (hub):

| Sub-page | Route | Component |
|---|---|---|
| Dashboard | `/admin/area-dashboard` | `AreaDashboardPage` |
| Area Levels | `/admin/area-levels` | `AreaLevelListPage` |
| Areas | `/admin/areas` | `AreaListPage` |
| Tree View | `/admin/area-tree` | `AreaTreePage` |
| Import | `/admin/area-import` | `AreaImportPage` |

#### AreaListPage — Table Columns

| Column | Description |
|---|---|
| Code | Short unique code (mono) |
| Name | Area name |
| Area Level | Linked level (e.g., "State", "City") |
| Parent Area | Parent area in hierarchy |
| Hierarchy Path | Full breadcrumb path (e.g., India > Maharashtra > Pune) |
| Usage Tags | Comma-separated badges |
| Category | Area category |
| Status | Active / Inactive / Draft |
| Actions | Preview, Edit, Activate, Inactivate, Delete |

#### Advanced Filters

- Status (All / Active / Inactive / Draft)
- Area Level
- Usage Tags (multi-select)
- Category

#### Key Types

```typescript
type AreaStatus = 'Draft' | 'Active' | 'Inactive'

type AreaLevelRole = 
  | 'Structural' 
  | 'Operational' 
  | 'Structural + Operational' 
  | 'Reporting Only' 
  | 'Geo Only'

type UsageTag = 
  | 'Geographic' | 'Sales' | 'Service' | 'Delivery' | 'Collection' 
  | 'Reporting' | 'Access Control' | 'Beat / Route' 
  | 'Dealer / Distributor Territory' | 'Geo Boundary' | 'Postal / Pin Code'

type GeoBoundaryType = 
  | 'Not Applicable' | 'Radius' | 'Polygon' 
  | 'Postal / Pin Code Based' | 'External Map Reference'
```

#### Preview Drawer Sections

1. **Basic Information** — Area Code, Name, Display Name, External/Legacy Code
2. **Hierarchy** — Level, Category, Classification, Path
3. **Usage Tags** — Comma-separated list
4. **Geo & Postal** — Postal Code, Boundary Type

---

### 8.2 Supplier Master (Business Partner)

**Location:** `src/admin/masters/supplier-master/pages/`

#### SupplierListPage — Table Columns

| Column | Description |
|---|---|
| Code | Supplier code (mono) |
| Legal Name | Official registered name |
| Type | BP Type badge (see types below) |
| Category | BP Category |
| Country | Country of registration |
| Contacts | Count badge |
| Status | Active / Inactive badge |
| Actions | Preview, Edit, Activate/Inactivate, Delete |

#### Advanced Filters

- BP Type (Supplier / Transporter / Insurance Provider / Financier / Customer / Broker / Agent / Contractor)
- Status (All / Active / Inactive)

#### Key Types

```typescript
type BPType = 
  | 'Supplier' | 'Transporter' | 'Insurance Provider' | 'Financier' 
  | 'Customer' | 'Broker' | 'Agent' | 'Contractor'

type BPStatus = 'Draft' | 'Active' | 'Inactive'

type BPCategory = 
  | 'Manufacturer' | 'Distributor' | 'Retailer' | 'Service Provider' 
  | 'Consultant' | 'Government' | 'NGO' | 'Individual' | 'Other'
```

#### Sub-Entities

| Sub-entity | Contact Types / Notes |
|---|---|
| Contacts | Primary, Secondary, Accounts, Technical, Operations, Legal, Emergency |
| Addresses | Registered, Corporate, Billing, Shipping, Warehouse, Branch, Other |
| Bank Details | Current, Savings, Overdraft, Cash Credit, Escrow |
| Org Mappings | Association with organisation, effective date range |
| Compliance Documents | KYC-driven proof types |
| Item Mappings | Cross-reference to Product Master |

#### Preview Drawer Sections

1. **General Details** — Code, Legal Name, Type, Category, Country, Business Type, Industry, Employees, Founded, Website, Effective From
2. **Primary Contact** — Name, Designation, Department, Phone, Email
3. **Default Address** — Type, Address, City, State, PIN, Country
4. **Tax & Compliance** — Tax Registered, Tax Jurisdiction, Compliance Docs count
5. **Default Bank Account** — Bank, Branch, Account Holder, Account No (masked), Account Type, Currency
6. **Item Mapping** — Count + top 3 items

---

### 8.3 Product Master

**Location:** `src/admin/masters/product-master/pages/`

#### ProductListPage — Table Columns

| Column | Description |
|---|---|
| Code | Product code (mono) |
| Product | Product name |
| Type | Product Type badge |
| Category | Product category |
| Brand | Brand name |
| UOMs | Count badge |
| Status | Active / Inactive / Discontinued |
| Actions | Preview, Edit, Activate/Inactivate, Delete |

#### Advanced Filters

- Product Type
- Status
- Search (code, name, type, category, sub-category, SKU)

#### Key Types

```typescript
type ProductType = 
  | 'Finished Good' | 'Raw Material' | 'Spare Part' 
  | 'Service' | 'Consumable' | 'Kit'

type ProductStatus = 'Draft' | 'Active' | 'Inactive' | 'Discontinued'

type ScopeType = 'Global' | 'Local'
type ScopeDimension = 'Organization' | 'Branch' | 'Warehouse' | 'Channel'

type PackType = 
  | 'Box' | 'Carton' | 'Drum' | 'Can' | 'Bottle' 
  | 'Crate' | 'Pallet' | 'Loose' | 'Set'

type IdentifierType = 
  | 'GTIN' | 'HS Code' | 'HSN' | 'OEM Part No.' 
  | 'Manufacturer Part No.' | 'UPC' | 'EAN' | 'Other'

type AssociationType = 'Alternate' | 'Supersedes' | 'Kit Component'
```

#### Sub-Entities

| Sub-entity | Description |
|---|---|
| Scope Mappings | Global/Local scope per Organization/Branch/Warehouse/Channel |
| UOM Rows | Applicable UOMs with conversion reference |
| Packaging Rows | Pack Type, Size, Material, Purchase/Sales Qty, Org Type |
| Identifier Rows | GTIN, HS Code, HSN, OEM Part, etc. |
| Association Rows | Alternate/Supersedes/Kit Component relationships |
| Sales Channel Eligibility | List of eligible sales channels |

#### Preview Drawer Sections

1. **Product Definition** — Code, Name, Type, Manufacturer, Country of Origin, Description
2. **Classification & Hierarchy** — Class, Category, Sub-category, Brand, SKU, Model
3. **Unit of Measurement** — Base UOM, Applicable UOMs list, Scope Mappings count
4. **Operational Indicators** — Stockable, Sellable, Purchasable, Batch Tracking, Warranty, Sales Channels
5. **Status & Availability** — Status, Effective From/To, Identifiers count, Associations count, Discontinuation Date

---

### 8.4 Other Specialized Masters (Summary)

| Master | Location | Notable Features |
|---|---|---|
| Customer Master | `src/admin/masters/customer-master/` | Full CRUD, similar structure to Supplier |
| UOM Master | `src/admin/masters/uom/` | Unit code, name, base unit, conversion factor |
| Slot Master | `src/admin/masters/slot-master/` | Time slot configuration for scheduling |
| Service Type Master | `src/admin/masters/service-type/` | Service category definitions |
| KYC Setup | `src/admin/masters/kyc-setup/` | Settings-pattern page (no list); country-grouped proof grid |
| Numbering & Code Setup | Direct settings page | No list view; flat form for numbering scheme config |
| Picklist Master | `src/admin/masters/picklist-master/` | Multi-section settings for all picklist values |
| Code Generation Policy | `src/admin/masters/code-gen-policy/` | Full CRUD with guided compact form workflow |

---

## 9. Engine Configuration Section

All engine config pages are under the `Engine Configuration` group in the admin panel.  
**Base path:** `/#/admin/engine-config/`

> **Offline Mode:** When the backend API is not reachable, all four pages automatically fall back to seed data. An "Engine is offline" banner is displayed. Any edits made in offline mode are persisted to `localStorage` and survive page refresh. See [Section 13](#13-data-persistence) for details.

---

### 9.1 Rule Engine Configuration

**Files:**
- List: `src/admin/masters/engine-config/rule-sets/pages/RuleEngineConfigList.tsx`
- Editor: `src/admin/masters/engine-config/rule-sets/pages/RuleSetEditor.tsx`
- Service: `src/admin/masters/engine-config/rule-sets/services/ruleSetService.ts`

#### List Page Columns

| Column | Type | Notes |
|---|---|---|
| Rule Set Code | Mono + primary color | Unique identifier |
| Entity | Text | e.g., `SaleOrder`, `PurchaseOrder` |
| Name | Text | Human-readable name |
| Version | Text | Displayed as `v1`, `v2`, etc. |
| Rules | Count badge | Total rules in the set |
| Active | Status badge | Green = Active, Red = Inactive |
| Actions | Edit, Delete | |

#### Filters

- Entity dropdown (distinct from loaded records)
- Active status chip (All / Active / Inactive)
- Text search (searches code, name, entity)

#### TypeScript Types

```typescript
type RuleType =
  | 'Validation' | 'ConditionalValidation' | 'Derivation'
  | 'ApprovalTrigger' | 'FieldBehavior' | 'Eligibility'
  | 'BoundaryRule' | 'StatusDerivation' | 'SystemInvariant';

type RuleAction =
  | 'RaiseError' | 'RaiseWarning' | 'DeriveValue' | 'RequireApproval'
  | 'CallService' | 'RouteToExtension' | 'ApplyMaskingPolicy' | 'SetFieldBehavior';

type RuleOwner = 'RuleEngine' | 'PricingService' | 'DiscountService' | 'TaxService'
  | 'ChargeService' | 'ApprovalService' | 'NumberingService' | 'SaleOrderService'
  | 'SourceLineLedgerService' | 'CalculationService' | 'RevisionService'
  | 'IntegrationEventService' | 'LifecycleService' | 'RBACService' | 'PrivacyService'
  | 'Workflow' | string;

type RuleDefinition = {
  ruleCode: string;
  field?: string;
  ruleType: RuleType;
  action: RuleAction;
  owner: RuleOwner;
  description?: string;
  conditionExpression?: string;
  executionCondition?: string;
  isActive: boolean;
  order: number;
};

type RuleSetConfig = {
  ruleSetCode: string;
  ruleSetName: string;
  entityName: string;
  description: string;
  version: number;
  isActive: boolean;
  rules: RuleDefinition[];
};
```

#### Seed Rule Sets (21 total — `src/engine/seed/ruleSets.ts`)

| Rule Set Code | Name | Rules |
|---|---|---|
| `SO_PRE_VALIDATION_RULES` | Sale Order Pre Validation | 3 |
| `SO_HEADER_VALIDATION_RULES` | Sale Order Header Validation | 12 |
| `SO_PARTY_RULES` | Sale Order Party Rules | 7 |
| `SO_FULFILLMENT_RULES` | Sale Order Fulfillment Rules | 4 |
| `SO_PAYMENT_RULES` | Sale Order Payment Rules | 5 |
| `SO_FINANCE_EXTENSION_RULES` | Sale Order Finance Extension Rules | 6 |
| `SO_INSURANCE_EXTENSION_RULES` | Sale Order Insurance Extension Rules | 4 |
| `SO_LINE_VALIDATION_RULES` | Sale Order Line Validation | 13 |
| `SO_PRICING_RULES` | Sale Order Pricing Rules | 5 |
| `SO_DISCOUNT_RULES` | Sale Order Discount Rules | 6 |
| `SO_TAX_RULES` | Sale Order Tax Rules | 6 |
| `SO_CHARGE_RULES` | Sale Order Charge Rules | 4 |
| `SO_TOTAL_CALCULATION_RULES` | Sale Order Total Calculation Rules | 7 |
| `SO_APPROVAL_TRIGGER_RULES` | Sale Order Approval Trigger Rules | 7 |
| `SO_LIFECYCLE_RULES` | Sale Order Lifecycle Rules | 11 |
| `SO_HOLD_RELEASE_RULES` | Sale Order Hold / Release Rules | 6 |
| `SO_CANCELLATION_RULES` | Sale Order Cancellation Rules | 5 |
| `SO_AMENDMENT_RULES` | Sale Order Amendment Rules | 5 |
| `SO_DOWNSTREAM_PROTECTION_RULES` | Sale Order Downstream Protection Rules | 8 |
| `SO_SHORTCUT_ELIGIBILITY_RULES` | Sale Order Shortcut Eligibility Rules | 6 |
| `SO_SECURITY_FIELD_BEHAVIOR_RULES` | Sale Order Security Field Behavior Rules | 3 |

**Total rule definitions in seed: 132**

#### Preview Drawer Sections

1. **Rule Set Details** — Code, Entity, Version, Status, Description
2. **Rules Summary** — Count per `ruleType` (e.g., Validation: 8, Derivation: 4)

---

### 9.2 Workflow Configuration

**Files:**
- List: `src/admin/masters/engine-config/workflows/pages/WorkflowConfigList.tsx`
- Editor: `src/admin/masters/engine-config/workflows/pages/WorkflowStepEditor.tsx`
- Service: `src/admin/masters/engine-config/workflows/services/workflowConfigService.ts`

#### List Page Columns

| Column | Type |
|---|---|
| Workflow Code | Mono + primary color |
| Entity | Text |
| Name | Text |
| Version | `v1` etc. |
| Steps | Count badge |
| Active | Status badge |
| Actions | Edit, Delete |

#### TypeScript Types

```typescript
type WorkflowStepConfigType =
  | 'RuleTask' | 'ServiceTask' | 'Decision' | 'UserTask'
  | 'NotificationTask' | 'IntegrationTask' | 'Start' | 'End';

type WorkflowStepFailureMode =
  | 'Stop' | 'ValidationFailed' | 'PendingApproval' | 'Retry' | 'NonBlocking';

type WorkflowStepConfig = {
  seq: number;
  stepCode: string;
  stepType: WorkflowStepConfigType;
  calls: string;                          // Service or rule set code called
  failureBehavior: WorkflowStepFailureMode;
  description?: string;
  isActive: boolean;
};

type WorkflowTransitionConfig = {
  fromStep: string;
  toStep: string;
  condition?: string;
  label?: string;
};

type WorkflowConfig = {
  workflowCode: string;
  workflowName: string;
  entityName: string;
  version: number;
  description: string;
  isActive: boolean;
  steps: WorkflowStepConfig[];
  transitions: WorkflowTransitionConfig[];
};
```

#### Seed Workflows (7 total — `src/engine/seed/workflowDefinitions.ts`)

| Workflow Code | Name | Steps | Key Rule/Service Calls |
|---|---|---|---|
| `WF_SO_DRAFT_SAVE` | Sale Order Draft Save | 12 | PRE_VALIDATION, HEADER_VALIDATION, LINE_VALIDATION |
| `WF_SO_SUBMIT` | Sale Order Submit | 32 | All validation rule sets + pricing/tax/charge/totals |
| `WF_SO_APPROVAL` | Sale Order Approval | 8 | ApprovalService, NotificationService |
| `WF_SO_HOLD` | Sale Order Hold | 9 | HOLD_RELEASE_RULES, AuditService |
| `WF_SO_RELEASE` | Sale Order Release | — | HOLD_RELEASE_RULES |
| `WF_SO_CANCEL` | Sale Order Cancel | — | CANCELLATION_RULES |
| `WF_SO_AMEND` | Sale Order Amend | — | AMENDMENT_RULES |

---

### 9.3 Service Registry

**Files:**
- List: `src/admin/masters/engine-config/service-registry/pages/ServiceRegistryList.tsx`
- Editor: `src/admin/masters/engine-config/service-registry/pages/ServiceDefinitionEditor.tsx`
- Service: `src/admin/masters/engine-config/service-registry/services/serviceRegistryService.ts`

#### List Page Columns

| Column | Type |
|---|---|
| Service Code | Mono |
| Category | Text |
| Name | Text |
| Endpoint URL | Text |
| Timeout | Milliseconds (displayed) |
| Active | Status badge |
| Actions | Edit, Delete |

#### TypeScript Types

```typescript
type ServiceRetryPolicy = {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
};

type ServiceConfig = {
  serviceCode: string;
  serviceName: string;
  endpointUrl: string;
  timeoutMs: number;
  retryPolicy: ServiceRetryPolicy;
  fallbackPolicy: 'ReturnError' | 'UseLastKnown' | 'UseDefault';
  isActive: boolean;
  actionCodes: string[];  // Actions this service handles
};
```

#### Seed Services (12 total — `src/engine/seed/serviceRegistry.ts`)

All services use default retry policy: `maxRetries: 3, retryDelayMs: 500, backoffMultiplier: 2`.

| Service Code | Name | Endpoint | Timeout | Fall-back | Action Codes |
|---|---|---|---|---|---|
| `SaleOrderService` | Sale Order Service | `/api/services/sale-order` | 10s | ReturnError | CREATE_DRAFT, UPDATE_DRAFT, SUBMIT_ORDER, CANCEL_ORDER, HOLD_ORDER, RELEASE_ORDER, AMEND_ORDER, CLOSE_ORDER, REOPEN_ORDER |
| `NumberingService` | Numbering Service | `/api/services/numbering` | 5s | ReturnError | GENERATE_DOCUMENT_NUMBER |
| `PricingService` | Pricing Service | `/api/services/pricing` | 8s | ReturnError | CALCULATE_PRICING, VALIDATE_PRICE_OVERRIDE, REPRICE_ORDER |
| `DiscountService` | Discount Service | `/api/services/discount` | 5s | ReturnError | CALCULATE_DISCOUNT, VALIDATE_DISCOUNT |
| `TaxService` | Tax Service | `/api/services/tax` | 8s | ReturnError | DERIVE_TAX_CONTEXT, VALIDATE_TAX_CONTEXT, CALCULATE_TAX |
| `ChargeService` | Charge Service | `/api/services/charge` | 5s | ReturnError | CALCULATE_CHARGES, VALIDATE_CHARGES |
| `CurrencyService` | Currency Service | `/api/services/currency` | 5s | UseLastKnown | FETCH_EXCHANGE_RATE |
| `ApprovalService` | Approval Service | `/api/services/approval` | 10s | ReturnError | CREATE_APPROVAL_CASE, GET_APPROVAL_STATUS, APPROVE, REJECT |
| `SourceLineLedgerService` | Source Line Ledger Service | `/api/services/source-line-ledger` | 8s | ReturnError | VALIDATE_PENDING_QTY, UPDATE_CONSUMED_QTY |
| `AuditService` | Audit Service | `/api/services/audit` | 3s | ReturnError | WRITE_EVENT |
| `IntegrationEventService` | Integration Event Service | `/api/services/integration-events` | 5s | ReturnError | PUBLISH |
| `NotificationService` | Notification Service | `/api/services/notifications` | 3s | ReturnError | SEND |

---

### 9.4 Approval Matrix

**Files:**
- List: `src/admin/masters/engine-config/approval-matrix/pages/ApprovalMatrixList.tsx`
- Editor: `src/admin/masters/engine-config/approval-matrix/pages/ApprovalMatrixEditor.tsx`
- Service: `src/admin/masters/engine-config/approval-matrix/services/approvalMatrixService.ts`

#### List Page Columns

| Column | Type |
|---|---|
| Entry ID | Mono |
| Category | Approval category badge |
| Entity | Text |
| Condition | Human-readable condition label |
| Levels | Count badge |
| Active | Status badge |
| Actions | Edit, Delete |

#### TypeScript Types

```typescript
type ApprovalCategoryCode =
  | 'DISCOUNT_EXCEPTION' | 'PRICE_EXCEPTION' | 'CREDIT_EXCEPTION'
  | 'TAX_EXCEPTION' | 'EXPIRED_ORDER_EXCEPTION'
  | 'PROCESSED_SCOPE_EXCEPTION' | 'CANCELLATION_EXCEPTION';

type ApprovalRole =
  | 'ASM' | 'HQ_MANAGER' | 'BRANCH_MANAGER' | 'SALES_MANAGER'
  | 'REGIONAL_MANAGER' | 'FINANCE_MANAGER' | 'SERVICE_MANAGER' | string;

type ApprovalLevel = {
  level: number;
  role: ApprovalRole;
  escalationHours: number;
  escalationRole?: ApprovalRole;
  autoActionOnTimeout?: 'Approve' | 'Reject' | 'Escalate';
};

type ApprovalMatrixEntry = {
  entryId: string;
  approvalCategory: ApprovalCategoryCode;
  conditionExpression: string;   // e.g. "discountPercent > 10 && discountPercent <= 15"
  conditionLabel: string;        // Human-readable version of condition
  entityName: string;
  tenantId?: string;
  levels: ApprovalLevel[];
  isActive: boolean;
};
```

#### Seed Entries (6 total — `src/engine/seed/approvalMatrix.ts`)

| Entry ID | Category | Condition | Levels | Roles |
|---|---|---|---|---|
| `APM-001` | DISCOUNT_EXCEPTION | Discount between 10% and 15% | 1 | ASM → HQ_MANAGER (escalate 24h) |
| `APM-002` | DISCOUNT_EXCEPTION | Discount above 15% | 2 | ASM (12h) → HQ_MANAGER |
| `APM-003` | PRICE_EXCEPTION | Price override beyond tolerance | 1 | BRANCH_MANAGER → REGIONAL_MANAGER |
| `APM-004` | CREDIT_EXCEPTION | Customer credit limit exceeded | 1 | FINANCE_MANAGER → HQ_MANAGER |
| `APM-005` | CANCELLATION_EXCEPTION | Cancellation after partial processing | 1 | SALES_MANAGER → REGIONAL_MANAGER (12h) |
| `APM-006` | PROCESSED_SCOPE_EXCEPTION | Amendment after downstream processing | 1 | REGIONAL_MANAGER |

---

## 10. Shared Experience Components

**Location:** `src/experience/components/`

### Component Overview

| Component | Width | Purpose |
|---|---|---|
| `AdminListPageShell` | Full page | Layout for list/table pages |
| `AdminPageShell` | Full page | Layout for form/settings pages |
| `AdminConfigShell` | Full page | Multi-section form with left nav |
| `SmartPreviewDrawer` | `lg` (680px) | Read-only record details |
| `SmartFormDrawer` | `md` (520px) | Quick create/edit in drawer |
| `SmartReviewDrawer` | `lg` (680px) | Activation confirmation + checklist |
| `SmartDrawer` | Configurable | Base drawer shell |
| `PageHeader` | Full width | Page title bar |
| `CommandPalette` | Floating | Ctrl+K navigation |
| `HelpDrawer` | `md` (448px) | Contextual help |
| `AdminSetupAssistant` | Panel | Setup progress tracker |
| `EmptyStateGuide` | Inline | "No data" placeholder with CTA |
| `FieldHelpPopover` | Inline popover | Field-level "?" help |
| `ValidationChecklist` | Inline | Requirements list with status |
| `SmartSidebar` | ~260px | Navigation sidebar with favorites |

---

### 10.1 SmartPreviewDrawer

**Contract:**
- Width: always `lg` (680px) — do NOT narrow
- Summary fields: top 2–4 fields in 2-column grid above sections
- Sections: 3–5 expandable groups of fields
- Footer: Primary (Edit), Secondary (optional), Danger (Delete)
- No form fields — preview is always read-only

```typescript
interface SmartPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: 'success' | 'warning' | 'error' | 'default';
  summaryFields?: Array<{ label: string; value: string }>;
  sections: PreviewSection[];
  primaryAction?: { label: string; onClick: () => void };
  secondaryActions?: Array<{ label: string; onClick: () => void }>;
  dangerAction?: { label: string; onClick: () => void };
  loading?: boolean;
  emptyLabel?: string;
}

interface PreviewSection {
  title: string;
  fields: Array<{
    label: string;
    value: string;
    span?: 1 | 2;  // Column span (default 1)
    mono?: boolean; // Monospace font
  }>;
}
```

---

### 10.2 SmartFormDrawer

**Contract:**
- Width: `md` (520px) or `sm` (400px) for single-field edits
- Close button shows warning when `isDirty` is true
- Disabled Save button when `saveDisabled` is true
- Inline `validationErrors` strip above footer

```typescript
interface SmartFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSave: () => void | Promise<void>;
  validationErrors?: string[];
  isDirty?: boolean;
  saveDisabled?: boolean;
  children: React.ReactNode;
  footerActions?: React.ReactNode;  // Additional footer buttons
}
```

---

### 10.3 SmartReviewDrawer

**Contract:**
- Width: `lg` (680px)
- All checklist items must have `passed: true` before Confirm is enabled
- `consequenceNote` is required — describes what happens on confirm

```typescript
interface SmartReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  checklistItems: Array<{
    label: string;
    passed: boolean;
    detail?: string;
  }>;
  summaryFields: Array<{ label: string; value: string }>;
  consequenceNote: string;
  confirmLabel?: string;  // Default: "Confirm & Activate"
  onConfirm: () => void | Promise<void>;
}
```

---

### 10.4 PageHeader

**Contract:**
- Exactly one per page (inside AdminListPageShell or AdminPageShell)
- Single primary action CTA
- `helpTopicId` must map to a real topic in `helpTopics.ts`

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
  statusLabel?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean; icon?: LucideIcon };
  secondaryActions?: Array<{ label: string; onClick: () => void; variant?: 'default' | 'danger' }>;
  helpTopicId?: string;
  onHelpClick?: () => void;
}
```

---

## 11. Design System

**Source:** `src/styles/excellon-brand-guidelines.css`

### Color Tokens (Light Mode)

| CSS Variable | Value | Usage |
|---|---|---|
| `--color-primary` | `#eb6a2c` | Primary brand action color (Excellon Orange) |
| `--color-primary-hover` | `#c44b1b` | Hover state for primary |
| `--color-primary-active` | `#9e320e` | Active/pressed state |
| `--color-primary-contrast` | `#ffffff` | Text on primary buttons |
| `--color-text` | `#1f2937` | Main body text |
| `--color-text-muted` | `#6b7280` | Secondary/muted text |
| `--color-border` | `#d9dee5` | Light dividers and input borders |
| `--color-border-strong` | `#c7ced8` | Stronger dividers |
| `--color-surface` | `#ffffff` | Card, modal, drawer backgrounds |
| `--color-surface-subtle` | `#f8fafc` | Alternate row / subtle panel background |
| `--color-surface-hover` | `#f5f7fa` | Row hover state |
| `--color-surface-elevated` | `#ffffff` | Elevated surface (dropdowns, overlays) |
| `--color-surface-panel` | `#e5edff` | Panel-specific background |
| `--color-table-header` | `#eff2f5` | Table header row background |
| `--color-danger` | `#d14343` | Error, destructive action, required indicator |
| `--color-focus-ring` | `rgb(235 106 44 / 22%)` | Focus ring on interactive elements |
| `--color-brand-surface` | `#fff7f0` | Brand-tinted background (info panels) |
| `--color-brand-surface-strong` | `#ffe7d4` | Stronger brand tint |
| `--color-brand-border` | `#ffceab` | Brand-colored border |
| `--color-brand-text` | `#9e320e` | Brand-colored text |
| `--color-topbar-bg` | `#1f2025` | App top header background |
| `--color-topbar-text` | `rgb(255 255 255 / 92%)` | App top header text |

### Typography Tokens

| CSS Variable | Value | Usage |
|---|---|---|
| `--font-family-base` | `"Noto Sans", sans-serif` | All UI text |
| `--font-weight-regular` | `400` | Normal weight |
| `--font-weight-medium` | `500` | Emphasis, labels |
| `--font-weight-semibold` | `600` | Headings, buttons |
| `--font-size-10` | `10px` | Smallest badges, fine print |
| `--font-size-12` | `12px` | Column headers, secondary labels |
| `--font-size-14` | `14px` | App default body text |
| `--font-size-16` | `16px` | Page titles |
| `--font-size-24` | `24px` | Section headings |
| `--line-height-20` | `20px` | Body text leading |
| `--line-height-24` | `24px` | Heading/label leading |

### Spacing Tokens

| CSS Variable | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |

### Border Radius & Shadow Tokens

| CSS Variable | Value | Usage |
|---|---|---|
| `--radius-sm` | `8px` | Buttons, small inputs |
| `--radius-md` | `12px` | Cards, drawers |
| `--radius-lg` | `16px` | Modals, large panels |
| `--shadow-soft` | `0 1px 2px rgb(15 23 42 / 8%)` | Cards, inline elevation |
| `--shadow-dropdown` | `0 20px 40px rgb(15 23 42 / 12%)` | Dropdowns, command palette, drawers |

### Multi-Brand Theme Support

The app supports 5 brand themes. Theme is applied via `data-theme` attribute on `:root`. The Excellon brand is the default (no attribute needed).

| `data-theme` | Brand | Primary Color | Notes |
|---|---|---|---|
| *(none)* | Excellon | `#eb6a2c` | Orange, Noto Sans |
| `bajaj` | Bajaj | `#0052ff` | Blue |
| `tata-motors` | Tata Motors | `#0a0a5f` | Dark Navy |
| `ola` | Ola | `#000000` | Black |
| `eka` | EKA | `#000000` | Black, Gentona font |
| `hero` | Hero | `#ee2326` | Red, Transducer font |

### Status Badge Color Convention

Used consistently across all list pages:

| Status | Background | Text |
|---|---|---|
| Active | `#DCFCE7` | `#15803D` |
| Inactive | `#FEF2F2` | `#DC2626` |
| Draft | `#F1F5F9` | `#64748B` |
| Discontinued | `#FFF7ED` | `#C2410C` |

---

## 12. Component Governance

### Shell Type Decision Table

| Page Type | Required Shell |
|---|---|
| List / table / collection browsing | `AdminListPageShell` |
| Create / edit form (simple, ≤ 4 sections) | `AdminPageShell` |
| Configuration (multi-section with nav) | `AdminConfigShell` |
| Multi-step activation / guided workflow | Compact Form Workspace |

### Drawer vs Full Page Decision

| Scenario | Use |
|---|---|
| Quick contextual preview | `SmartPreviewDrawer` |
| Small form (≤ 8 fields), reversible | `SmartFormDrawer` |
| Activation confirmation / checklist | `SmartReviewDrawer` |
| Binary yes/no confirmation | Dialog (inline) |
| Long/complex form | Full page |
| Draft → Active lifecycle | Full page |
| Multi-step workflow | Full page |
| Content would exceed 80vh | Full page |

### Drawer Width Standards

| Drawer Type | Width | Component |
|---|---|---|
| Preview | `lg` (680px) | `SmartPreviewDrawer` |
| Quick Create / Edit | `md` (520px) | `SmartFormDrawer` |
| Single field edit | `sm` (400px) | `SmartFormDrawer` |
| Review / Activation | `lg` (680px) | `SmartReviewDrawer` |
| Help | `md` (448px) | `HelpDrawer` |
| Filters | `sm` (400px) | `SmartFormDrawer` |

### Mandatory Drawer Elements

Every drawer component (regardless of type) must include:

- [ ] Header with title + close (×) button
- [ ] Scrollable body (`overflow-y: auto`)
- [ ] Fixed footer with clear actions
- [ ] Loading state (skeleton or spinner)
- [ ] Empty state (icon + message)
- [ ] Error state (inline error strip at top of body)
- [ ] Dirty-state guard (for form drawers — warn before close)

### Hard FAIL Rules (must not violate)

- Duplicate admin header on any page
- Page-level `CommandPalette` instantiation (only in `AdminShell`)
- `AdminConfigShell` used on list/collection pages
- `SmartPreviewDrawer` used with form fields

### WARN Rules (flagged by audit scripts)

- Specialized list page not using `AdminListPageShell`
- Placeholder or "Coming soon" / "TODO" content visible in production
- Table not visible above fold on 1366×768 display
- `helpTopicId` referencing a non-existent topic key

---

## 13. Data Persistence

### Admin Storage (`src/admin/adminStorage.ts`)

| `localStorage` Key | Type | Content | Max Items |
|---|---|---|---|
| `admin-favorites:v1` | `string[]` | Array of master `key` strings | Unlimited |
| `admin-recent:v1` | `RecentMasterEntry[]` | Recently visited master records | 10 |

```typescript
interface RecentMasterEntry {
  key: string;          // Master key
  label: string;        // Master label
  path: string;         // Route path
  groupLabel: string;   // Parent group label
  groupIconBg: string;  // Hex color
  groupIconColor: string; // Hex color
  visitedAt: string;    // ISO 8601 timestamp
}

// API
loadAdminFavorites(): string[]
saveAdminFavorites(keys: string[]): void
toggleAdminFavorite(key: string): string[]
loadRecentAdminMasters(): RecentMasterEntry[]
recordRecentAdminMaster(entry: Omit<RecentMasterEntry, 'visitedAt'>): RecentMasterEntry[]
```

---

### Engine Config Storage (`src/engine/storage/engineConfigStorage.ts`)

Provides typed localStorage helpers for all 4 engine config sections. Used as offline persistence when the backend API is unreachable.

| `localStorage` Key | Section | Primary Key Field |
|---|---|---|
| `idms_engine_rule_sets` | Rule Engine | `ruleSetCode` |
| `idms_engine_workflows` | Workflow Config | `workflowCode` |
| `idms_engine_services` | Service Registry | `serviceCode` |
| `idms_engine_approval_matrix` | Approval Matrix | `entryId` |

```typescript
// One helper per section, all with identical API:
export const ruleSetStorage = {
  load: <T>() => T[],          // Read all
  save: <T>(record: T) => T[], // Upsert by primary key
  remove: <T>(id: string) => T[], // Delete by primary key
  clear: () => void,           // Remove entire key
};
// Equivalent: workflowStorage, serviceStorage, approvalMatrixStorage
```

#### Offline Load Strategy

```
API call
  └── success → return API data (isOffline: false)
  └── failure →
        Load seed data
        Load localStorage records
        Merge: seed entries overwritten by matching local edits
        Append: local-only entries (not in seed)
        Return merged result (isOffline: true)
```

#### Offline Save Strategy

```
API save call
  └── success → also save to localStorage (keep in sync)
                return API data (isOffline: false)
  └── failure → save to localStorage only
                return local data (isOffline: true)
```

#### Offline Delete Strategy

```
API delete call
  └── always → remove from localStorage (cleanup regardless of API result)
```

#### Error Handling

- `localStorage` reads/writes are wrapped in `try/catch` — quota exceeded or private browsing mode fails silently
- API calls that return HTML (e.g., Vite SPA dev server with no backend proxy) are handled by `apiClient.ts` — `response.json()` failure returns `{ success: false }` rather than throwing, allowing the offline fallback to activate
- All 4 list pages use `try/finally` to ensure `setIsLoading(false)` always runs, preventing permanent loading state

---

### API Client (`src/engine/api/apiClient.ts`)

Base HTTP client for all engine API calls.

```typescript
async function engineRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<ServiceResponse<T>>

// Convenience wrappers:
engineGet<T>(path: string)
enginePost<T>(path: string, body: unknown)
enginePut<T>(path: string, body: unknown)
engineDelete<T>(path: string)
```

**Base URL:** `import.meta.env.VITE_API_BASE_URL` — defaults to `''` (same origin)  
**Auth header:** `Authorization: Bearer {token}` from `localStorage.getItem('auth-token')`  
**Correlation ID:** `X-Correlation-Id: crypto.randomUUID()` on every request  

**Error types returned in `ServiceResponse`:**

| Error Code | Cause |
|---|---|
| `NETWORK_ERROR` | `fetch()` threw — server unreachable |
| `HTTP_{status}` | Non-2xx HTTP response (e.g., `HTTP_404`) |
| `INVALID_JSON_RESPONSE` | Response body was not valid JSON (e.g., HTML from Vite dev server) |

```typescript
interface ServiceResponse<T> {
  success: boolean;
  status: 'Ok' | 'Failed' | 'Pending';
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  data: T;
  nextAction: 'Stop' | 'Retry' | 'Continue';
  requiresUserIntervention: boolean;
  retryable: boolean;
}
```

---

*End of Admin Panel Specification*
