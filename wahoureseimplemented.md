# Warehouse Master Implementation Notes

This document captures the implemented `Warehouse Master` scope in the admin panel, including pages, routes, fields, UI behavior, and core business logic currently reflected in the codebase.

## Module Scope

Warehouse Master is implemented as a dedicated admin module under:

- `src/admin/masters/warehouse-master`

It currently includes:

- warehouse list and draft lifecycle handling
- guided warehouse creation flow
- warehouse configuration workspace
- hierarchy workspace
- locations workspace
- bulk location creation flow
- import workflow
- audit view
- controlled action flows
- help content and UX hardening

## Routes

Implemented warehouse routes:

- `/admin/master/warehouse-master`
- `/admin/master/warehouse-master/new`
- `/admin/master/warehouse-master/:warehouseId/configuration`
- `/admin/master/warehouse-master/:warehouseId/hierarchy`
- `/admin/master/warehouse-master/:warehouseId/locations`
- `/admin/master/warehouse-master/:warehouseId/import`
- `/admin/master/warehouse-master/:warehouseId/audit`

## Main Screens

### 1. Warehouse List

Purpose:

- show warehouse records
- filter/search/sort warehouse master data
- expose controlled actions such as block and inactivate
- open configuration, hierarchy, locations, import, and audit flows

Implemented behaviors:

- mock-backed list loading
- status display
- lifecycle action entry points
- controlled action drawer usage for governed actions
- reason code sourcing through shared governance utilities

### 2. Warehouse Create Workspace

Purpose:

- guided low-click creation flow for new warehouses
- draft save and activation readiness review

Current active step flow:

1. Identity
2. Ownership & Scope
3. Inventory Model
4. Structure
5. Operational Defaults
6. Review & Activate

UX structure:

- rendered inside `AdminShell`
- compact supplier-style header
- left step rail on wider screens
- section selector on narrow screens
- fixed footer actions
- `How this works` help access

### 3. Warehouse Configuration Page

Purpose:

- post-create setup and policy management

Implemented behaviors:

- shell-based admin layout
- responsive section selector for narrow screens
- setup-health guidance
- section linking from issue cards
- advanced warehouse policy sections

### 4. Warehouse Hierarchy Page

Purpose:

- manage hierarchy structure for location/BIN-level warehouses

Implemented behaviors:

- split layout on wider screens
- tree-first pattern with inspector behavior on narrow screens
- hierarchy tree with semantics and keyboard support
- node summary and derived status display

### 5. Warehouse Locations Page

Purpose:

- manage warehouse locations and BIN records

Implemented behaviors:

- list view through admin list shell pattern
- responsive filters
- responsive mobile card rendering
- bulk create entry

### 6. Warehouse Import Page

Purpose:

- governed import workflow for warehouse entities

Implemented behaviors:

- entity selection
- upload metadata display
- validation/review/result steps
- governed submission flow

### 7. Warehouse Audit Page

Purpose:

- display warehouse audit history

Implemented behaviors:

- audit event listing
- source/user/timestamp/reference display
- warehouse-governance visibility

## Warehouse Create Screen: Implemented Fields and Logic

## Step 1. Identity

Implemented active fields:

- `Warehouse Name`
- `Warehouse Code`
- `Description`
- `Warehouse Type`
- `Physical Facility Reference`

Removed from active create flow:

- `Operational Time Zone`

Implemented logic:

- warehouse code auto-suggests from warehouse name until manually edited
- warehouse code uniqueness is checked asynchronously against existing warehouse records
- code becomes effectively immutable after activation
- warehouse type drives downstream context hints for cold-chain and hazardous flows

Validation:

- warehouse name required
- warehouse code required
- warehouse type required
- duplicate warehouse code blocked

## Step 2. Ownership & Scope

Two supported ownership modes:

- `Organization`
- `Branch`

### Organization-Level Ownership

Implemented fields:

- `Owning Organization`
- `Business Unit`
- `Legal Entity`
- `Inventory Owner`

Removed from active organization flow:

- `Company`

Implemented logic:

- shared ownership values are captured once
- optional branch access sharing is handled separately
- branch access does not change inventory ownership

Branch access behaviors:

- `Share with all branches` toggle
- if disabled, specific accessible branches can be selected

Validation:

- owning organization required
- business unit required
- legal entity required
- inventory owner required

### Branch-Level Ownership

Implemented fields:

- `Owning Branches` multi-select
- branch chips rendered inside the field
- branch ownership grid with per-row fields:
  - `Branch`
  - `Business Unit`
  - `Legal Entity`
  - `Inventory Owner`

Removed from active branch flow:

- single `Owning Branch`
- `Company`

Implemented logic:

- user can select multiple owning branches
- each selected branch creates one ownership row
- removing a selected branch removes the row from active form state
- row values are cached during the session
- newly selected branch rows inherit values from the last completed row when possible
- branch-specific ownership data is preserved in create payload shaping

Validation:

- at least one owning branch required
- every selected branch must have:
  - business unit
  - legal entity
  - inventory owner

## Step 3. Inventory Model

Supported inventory modes:

- `Warehouse-Level`
- `Location-BIN-Level`

UI behavior:

- both cards render in one row on desktop
- cards stack on narrow screens
- switching is immediate
- no blocking confirmation step in create flow

Derived behavior:

- `BIN Managed` is derived from inventory control mode
- not user-editable directly

Mode change behavior:

- switching to `Warehouse-Level` resets incompatible create-only structure and automation values
- switching to `Location-BIN-Level` enables hierarchy and location-aware setup path
- inline hint explains what was reset or enabled

Rules reflected in create flow:

- warehouse-level mode does not require hierarchy for activation
- location/BIN-level mode requires valid hierarchy path before activation readiness

## Step 4. Structure

Applies when inventory mode is `Location-BIN-Level`.

Supported options:

- `Start from recommended template`
- `Copy from existing warehouse`
- `Build custom hierarchy`
- `Configure later — stay as Draft`

UI behavior:

- four structure cards render in a 2x2 layout on desktop
- stack on narrow screens

Implemented logic:

- recommended path indicates standard hierarchy progression
- copy path allows selection of source warehouse hierarchy model
- configure-later path keeps warehouse in draft-oriented setup path

Rules reflected:

- warehouse-level inventory skips hierarchy requirement
- location/BIN-level inventory requires hierarchy readiness before activation

## Step 5. Operational Defaults

Implemented operational areas:

- quick presets
- putaway defaults
- picking defaults
- reservation defaults
- allocation defaults
- capacity tracking
- mixing restrictions
- hazard control
- temperature control
- cycle count defaults
- WMS enablement

Implemented presets:

- `Simple Warehouse`
- `Standard Distribution`
- `Service & Spares`
- `Returns & QC`
- `Cold Storage`
- `Hazard Controlled`

Preset behavior:

- preview shown before apply
- applying preset merges preset values into working state

Policy-related fields already used by create flow:

- `Auto Putaway Enabled`
- `Putaway Strategy`
- `Putaway Strategy Sequence`
- `Auto Picking Enabled`
- `Picking Strategy`
- `Picking Strategy Sequence`
- `Reservation Level`
- `Allocation Level`
- `Cycle Count Enabled`
- `Cycle Count Frequency`
- `Cycle Count Variance Tolerance`
- `Capacity Tracking Enabled`
- `Owner Mixing Allowed`
- `Mixed Item Allowed`
- `Mixed Lot Allowed`
- `Hazard Controlled`
- `Temperature Controlled`
- `WMS Enabled`

## Step 6. Review & Activate

Purpose:

- review summary values
- show activation checklist
- allow save draft or activate

Summary includes:

- warehouse name
- warehouse code
- ownership scope
- owning entity summary
- warehouse type
- inventory mode
- BIN managed

Activation checklist currently validates:

- warehouse name provided
- warehouse code provided and unique
- warehouse type selected
- ownership scope selected
- owning entity details complete
- branch ownership rows complete when branch scope is used
- inventory mode selected
- hierarchy readiness depending on inventory mode
- inventory-location readiness depending on inventory mode
- permission available

## Create Payload Shaping

The create flow now supports extended create-only ownership fields in the DTO:

- `owningBranchCodes`
- `branchOwnershipRows`
- `businessUnit`
- `legalEntityCode`
- `inventoryOwnerCode`
- `sharedWithAllBranches`
- `sharedBranchCodes`

Backward compatibility preserved:

- `owningBranchCode` still exists for compatibility with older consumers
- branch-level create uses the first selected branch as primary compatibility value

## Mock Adapter Behavior

Warehouse creation currently uses `warehouseMockAdapter`.

Implemented creation behavior:

- validates create input before save
- generates warehouse id and timestamps
- maps inventory control rules from selected mode
- stores branch assignments into `assignmentProfile`
- stores branch-level or org-level ownership values into assignment metadata
- creates draft warehouses by default
- records audit event for create

## Advanced Policies Already Implemented

Advanced warehouse policy UI and logic has been implemented across configuration sections.

Implemented policy areas:

- capacity and constraints
- item eligibility
- putaway strategy builder
- picking strategy builder
- reservation and allocation
- stock governance
- cycle count
- purpose-specific default locations

### Capacity and Constraints

Implemented rules:

- warehouse-level capacity treated as soft
- location/BIN-level capacity treated as hard where enabled
- validation surfaces restrictions for:
  - hazard
  - temperature
  - mixed item
  - mixed lot
  - mixed owner
  - compliance restrictions

### Item Eligibility

Supported modes:

- open
- restricted
- hybrid
- category
- advanced

Implemented rules:

- deny rules apply before allow rules
- eligibility setup restricted to active inventory-allowed leaf locations

### Putaway Strategy Builder

Implemented controls:

- add strategy
- move up
- move down
- remove
- restore recommended order
- test strategy

Rules:

- ordered builder, not unordered multi-select
- simulation is marked as configuration preview
- candidate filtering occurs before sorting

### Picking Strategy Builder

Implemented controls:

- add strategy
- move up
- move down
- remove
- restore recommended order
- test strategy

Rules:

- ordered builder, not unordered multi-select
- simulation is marked as configuration preview
- candidate filtering occurs before sorting

### Reservation and Allocation

Implemented concepts:

- reservation protects quantity
- allocation locks source scope
- reservation/allocation validation in stock governance logic

### Stock Governance

Implemented rule separation:

- `Stock Availability Status`
- `Movement State`
- `Commitment State`

Explicitly handled:

- reserved, allocated, picked, packed are not treated as stock availability status values

### Cycle Count

Implemented support:

- enablement toggle
- frequency selection
- variance tolerance

### Purpose-Specific Default Locations

Implemented behavior:

- default-location selection filtered by eligible purpose/location state

## Hierarchy and Location/BIN Workspace

## Hierarchy Workspace

Implemented components:

- `WarehouseHierarchyPage.tsx`
- `HierarchyTree.tsx`
- `HierarchyNodeInspector.tsx`
- `DerivedValueDisplay.tsx`
- `RuleExplanationPopover.tsx`

Implemented UI behaviors:

- split layout on wide screens
- tree-first and inspector-drawer behavior on narrow screens
- search
- expand/collapse interaction
- active node display
- node status and type cues
- keyboard navigation

Implemented rules reflected in logic:

- warehouse-level mode does not require hierarchy
- location/BIN-level mode requires valid hierarchy for activation
- only valid parent-child combinations allowed
- cycle prevention
- duplicate full location code prevention
- inventory allowed derived
- leaf endpoint derived
- posting blocked on non-leaf or non-inventory-allowed nodes
- parent status affects effective child status
- re-parenting blocked when dependencies exist

## Location Workspace

Implemented components:

- `WarehouseLocationsPage.tsx`
- `LocationBulkCreateDrawer.tsx`

Implemented list columns:

- `Location Code`
- `Location Name`
- `Full Path`
- `Level`
- `Location Type`
- `BIN Type`
- `Inventory Allowed`
- `Capacity Utilization`
- `Eligibility Mode`
- `Putaway Status`
- `Picking Status`
- `Effective Status`
- `Stock/Dependency Indicator`
- `Actions`

Implemented filters:

- hierarchy level
- parent
- location type
- BIN type
- status
- inventory allowed
- capacity warning
- putaway blocked
- picking blocked
- eligibility mode
- issues only

## Bulk Location Creation

Implemented workflow:

1. Configure
2. Generate preview
3. Validate
4. Review conflicts
5. Commit

Implemented input fields:

- parent
- level
- code prefix
- name prefix
- start sequence
- count
- sequence length
- separator
- suffix
- default location type
- default BIN type
- optional location profile

Implemented rules:

- parent and level read-only from context where required
- preview required before commit
- preview is read-only
- input changes invalidate preview
- duplicates inside batch block progress
- duplicates against existing records block progress
- commit revalidates
- all-or-nothing behavior by default
- created records default to draft
- no audit on preview
- audit on commit

## Import Workflow

Implemented pages and governance:

- `WarehouseImportPage.tsx`
- governed submit flow
- approval/reason code integration

Implemented workflow:

1. Select entity type
2. Download template
3. Upload file
4. Validate
5. Review errors and warnings
6. Review changes
7. Submit or submit for approval
8. View import result

Displayed import metadata:

- filename
- file size
- template version
- total records
- valid records
- warning records
- error records
- create count
- update count
- unchanged count

Implemented rules:

- validate-only does not mutate
- all-or-nothing by default
- derived fields must not be imported
- controlled field changes require reason/approval
- revalidation before commit
- duplicate submission detection support through stored validation/commit keys

## Controlled Actions and Governance

Implemented governed action pattern includes:

- action summary
- impact summary
- reason code capture
- explanation
- approval requirement display
- approver route display
- effective date where applicable
- validation checklist
- consequence note

Implemented action coverage includes:

- activate
- block
- unblock
- inactivate
- reactivate
- import submission approval path
- governed warehouse lifecycle operations

Current list-page controlled actions explicitly wired:

- block
- inactivate

## Audit

Implemented audit visibility includes:

- controlled actions
- import events
- create/update events
- bulk-related history sources where supported by adapter

Audit event fields surfaced in the module include:

- source
- user
- timestamp
- record version
- correlation/reference id
- field-level changes where available

## UX Hardening and Help Content

Implemented UX hardening includes:

- required warehouse help topics
- field help popovers for complex areas
- inline hints
- stronger validation microcopy
- non-color-only state cues in key areas
- help drawer support
- keyboard access improvements
- responsive create layout
- responsive configuration layout
- responsive hierarchy layout
- responsive locations layout

Required warehouse help topics implemented:

- `warehouse-master-overview`
- `warehouse-create`
- `warehouse-ownership`
- `warehouse-branch-access`
- `warehouse-inventory-control`
- `warehouse-hierarchy`
- `warehouse-locations`
- `warehouse-capacity`
- `warehouse-item-eligibility`
- `warehouse-putaway`
- `warehouse-picking`
- `warehouse-defaults`
- `warehouse-stock-governance`
- `warehouse-cycle-count`
- `warehouse-import`
- `warehouse-activation`
- `warehouse-audit`

## Key Derived and Business Rules Reflected Across the Module

- warehouse-level inventory does not require hierarchy
- location/BIN-level inventory requires valid hierarchy for activation readiness
- BIN managed is derived from inventory control mode
- inventory allowed is derived in hierarchy/location logic
- leaf endpoint is derived in hierarchy/location logic
- non-leaf or non-inventory-allowed nodes cannot be inventory posting endpoints
- deny eligibility rules apply before allow rules
- putaway and picking strategy builders are ordered
- simulation/test output is configuration preview, not live stock decision
- reservation and allocation are separate from stock availability
- branch access does not imply stock ownership
- branch-level ownership can vary by selected branch through row-level ownership data

## Current Backend / Data Mode

Current module mode:

- primarily mock-backed through `warehouseMockAdapter`

Implication:

- workflows and UI behaviors are implemented
- persistence and API integration are partially prepared but not fully switched to live API usage

## Files Most Relevant for Future Continuation

- `src/admin/masters/warehouse-master/pages/WarehouseCreateWorkspace.tsx`
- `src/admin/masters/warehouse-master/pages/WarehouseConfigurationPage.tsx`
- `src/admin/masters/warehouse-master/pages/WarehouseHierarchyPage.tsx`
- `src/admin/masters/warehouse-master/pages/WarehouseLocationsPage.tsx`
- `src/admin/masters/warehouse-master/pages/WarehouseImportPage.tsx`
- `src/admin/masters/warehouse-master/pages/WarehouseAuditPage.tsx`
- `src/admin/masters/warehouse-master/components/WarehouseActivationReview.tsx`
- `src/admin/masters/warehouse-master/services/warehouseMockAdapter.ts`
- `src/admin/masters/warehouse-master/validation/warehouseValidation.ts`
- `src/admin/masters/warehouse-master/types/warehouse.dto.ts`

## Notes

- This document describes the implemented state of the module in the current workspace.
- Some legacy fallback code still exists alongside newer create-step renderers, but the active warehouse create experience is using the modernized path.
- The module is feature-rich at UI and mock-domain level, and the next likely continuation area is cleanup, compile-time alignment, or live API integration.
