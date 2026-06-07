# Enterprise WMS-ready Warehouse Master Functional Requirement Document

**Version:** Final Functional Draft  
**Document Type:** Functional Requirement Document  
**Scope:** Warehouse Master and Location/BIN Governance  
**Design Mode:** Functional requirement only  

---

## 1. Purpose

The Warehouse Master shall provide an enterprise-ready functional foundation to create, configure, govern, and maintain warehouses, warehouse locations, BINs, inventory control rules, and transaction behavior across organization-level and branch-level warehouse operations.

The Warehouse Master shall govern:

1. Who owns or controls a warehouse.
2. Which branches can use a warehouse.
3. Whether inventory is tracked at warehouse level or BIN/location level.
4. How warehouse locations are structured.
5. Where inventory is allowed.
6. Which items are eligible for storage.
7. Which transactions are allowed.
8. How inbound putaway and outbound picking behave.
9. How capacity, hazard, temperature, mixed item, and mixed lot restrictions are enforced.
10. How warehouse setup changes are controlled, approved, and audited.

The Warehouse Master shall support simple warehouse-level inventory where required, but the enterprise standard shall be BIN/location-level inventory governance.

---

## 2. Business Objective

The business objective is to design a world-class **Enterprise WMS-ready Warehouse Master** that supports:

1. Organization-level shared warehouses.
2. Branch-level owned warehouses.
3. Multiple warehouses under a branch.
4. Shared warehouses assigned to multiple branches.
5. Dynamic location hierarchy such as Warehouse -> Zone -> Aisle -> Rack -> BIN.
6. BIN-managed and non-BIN-managed warehouse operations.
7. Warehouse-level inventory for simple warehouses.
8. BIN/location-level inventory as the enterprise standard.
9. Configurable item eligibility.
10. Auto Putaway and Auto Picking as separate capabilities.
11. Capacity and storage restriction governance.
12. Transaction behavior governance.
13. Bulk creation of hierarchy and BINs.
14. Import/export of warehouse setup data.
15. Audit, reason code, approval, and change-control governance.
16. Future scalability for advanced warehouse execution.

---

## 3. Product Direction

The Warehouse Master shall be designed as an enterprise inventory-location governance master, not as a basic warehouse list.

| Design Area | Functional Direction |
|---|---|
| Product ambition | Enterprise WMS-ready Warehouse Master |
| Inventory control standard | BIN/location-level inventory as enterprise standard |
| Simple warehouse support | Warehouse-level inventory allowed where detailed location tracking is not required |
| Location hierarchy | Dynamic, configurable, template-based hierarchy |
| Hierarchy behavior | Flexible paths with valid inventory leaf endpoints |
| Item eligibility | Configurable by warehouse, location, item, category, and operational rules |
| Transaction behavior | Governed by warehouse, location, status, item, capacity, and stock status rules |
| Audit maturity | Basic audit, field-level audit, reason codes, approval, and source tracking |
| Change control | Critical fields controlled after activation, stock creation, transaction history, or dependency creation |

---

## 4. Functional Scope

The Warehouse Master shall include:

1. Warehouse ownership model.
2. Organization-level warehouse creation.
3. Branch-level warehouse creation.
4. Shared warehouse assignment to branches.
5. Default warehouse per branch.
6. Warehouse lifecycle control.
7. Inventory ownership context.
8. Warehouse classification.
9. Inventory Control Mode.
10. BIN-managed and non-BIN-managed behavior.
11. Dynamic hierarchy templates.
12. Actual location and BIN creation.
13. Inventory Allowed derivation.
14. Location Type and BIN Type controls.
15. Capacity and storage constraints.
16. Item eligibility.
17. Auto Putaway.
18. Auto Picking.
19. Purpose-specific default locations.
20. Stock status governance.
21. Return, QC, damage, and scrap routing.
22. Reservation and allocation.
23. Cycle count governance.
24. Bulk creation.
25. Import/export.
26. Audit, reason codes, approvals, and change control.

---

## 5. Out of Scope

The following are not covered by this FRD:

1. UI wireframes.
2. API contracts.
3. Database schema.
4. Technical architecture.
5. Development task breakdown.
6. QA test cases.
7. Integration design.
8. Labor planning.
9. Robotics integration.
10. AI/ML design.
11. Slotting optimization logic.
12. Wave picking execution.
13. Warehouse task execution engine.

---

## 6. Functional Assumptions

| Assumption | Description |
|---|---|
| Organization, Branch, Company, and Item Master exist | Warehouse Master shall reference these masters. |
| Warehouse Master is a governance master | It shall control setup and transaction eligibility, not execute warehouse work tasks. |
| BIN/location-level inventory is the enterprise standard | Warehouse-level inventory shall remain available for simple warehouses. |
| Inventory Allowed is derived | Users shall not manually edit Inventory Allowed. |
| Auto Putaway and Auto Picking are separate | One generic Auto BIN setting shall not be used. |
| Default locations are purpose-specific | A single Default BIN shall not be overloaded for all transactions. |
| Dynamic hierarchy is configurable | Users shall define levels such as Zone, Aisle, Rack, BIN based on active template rules. |
| Critical changes are controlled | Changes after activation, stock, transaction history, or dependency creation shall be locked or governed. |

---

## 7. Benchmark Influence

The design is benchmarked conceptually against enterprise ERP/WMS platforms.

| Benchmark Source | Influence on Warehouse Master |
|---|---|
| Microsoft Dynamics 365 Supply Chain | WMS enablement, warehouse configuration, location types, location profiles, location directives, putaway, and picking behavior. |
| Oracle Fusion | Inventory organization, business unit, legal entity, inventory ownership, and warehouse/facility schedule concepts. |
| SAP WM/EWM | Warehouse structure, storage type, storage section, storage bin, and BIN-level governance. |

Benchmark concepts are used as design references. Vendor-specific terminology shall not be copied directly unless it fits the product model.

---

## 8. User Roles

| Role | Functional Responsibility |
|---|---|
| Organization Administrator | Create and govern organization-level warehouses. |
| Branch Administrator | Create and manage branch-level warehouses. |
| Warehouse Administrator | Maintain warehouse hierarchy, locations, BINs, eligibility, and operational rules. |
| Inventory Manager | Govern inventory control, putaway, picking, reservation, allocation, and transaction rules. |
| Approver | Approve sensitive warehouse/location changes where approval is configured. |
| Auditor | Review audit history, reason codes, approvals, and configuration history. |
| Inventory User | Perform transactions using valid warehouse/location setup. |

---

## 9. Warehouse Ownership Model

### 9.1 Ownership Scopes

The system shall support two warehouse ownership scopes.

| Ownership Scope | Meaning |
|---|---|
| Organization-level Warehouse | A centrally created warehouse that may be assigned to one or more branches. |
| Branch-level Warehouse | A warehouse created for and owned by one branch only. |

### 9.2 Organization-Level Warehouse Rules

The system shall:

1. Require Owning Organization.
2. Allow assignment to one or more active branches.
3. Prevent unassigned branches from transacting in the warehouse.
4. Allow the same organization-level warehouse to be default for multiple branches if assigned to those branches.
5. Prevent branch assignment removal when stock, open transactions, reservations, allocations, or pending movements exist for that branch.
6. Maintain assignment history for shared warehouse access changes.

### 9.3 Branch-Level Warehouse Rules

The system shall:

1. Require Owning Branch.
2. Prevent sharing with other branches.
3. Allow transactions only for the owning branch.
4. Allow the warehouse to be default only for the owning branch.

---

## 10. Inventory Ownership Model

The system shall support inventory ownership governance through:

1. Organization.
2. Branch.
3. Company.
4. Business Unit.
5. Legal Entity.
6. Inventory Owner.
7. Company-owned stock.
8. Branch-owned stock.
9. Vendor-owned stock.
10. Customer-owned stock.
11. Consignment stock.
12. Shared physical facility.

The system shall validate transactions based on configured ownership rules.

---

## 11. Warehouse Governance

### 11.1 Core Warehouse Rules

The system shall:

1. Allow warehouse creation at organization level or branch level.
2. Require Warehouse Code and Warehouse Name.
3. Require Warehouse Ownership Scope.
4. Validate warehouse code uniqueness within the governing scope.
5. Maintain default warehouse per branch.
6. Support Draft, Active, Blocked, and Inactive statuses.
7. Prevent hard deletion when stock, transactions, assignments, or audit dependencies exist.
8. Capture audit history for warehouse creation and changes.
9. Require reason and approval for sensitive changes where configured.

### 11.2 Warehouse Code Uniqueness

| Warehouse Ownership | Code Uniqueness Scope |
|---|---|
| Organization-level Warehouse | Unique within organization |
| Branch-level Warehouse | Unique within branch |

### 11.3 Default Warehouse Rules

The system shall:

1. Allow only one default warehouse per branch.
2. Allow a branch-level warehouse to be default only for its owning branch.
3. Allow an organization-level warehouse to be default only for branches assigned to that warehouse.
4. Auto-unset the previous default warehouse for the branch when a new default is selected, where configured.
5. Prevent inactivation or unassignment of a default warehouse unless another valid default is selected or the dependency is cleared.

### 11.4 Warehouse Lifecycle

| From Status | To Status | Rule |
|---|---|---|
| Draft | Active | Allowed only when mandatory setup is valid. |
| Draft | Inactive | Not allowed. |
| Draft | Deleted | Allowed only before activation and before dependencies exist. |
| Active | Blocked | Allowed when open transaction rules permit. |
| Active | Inactive | Blocked if stock exists. |
| Blocked | Active | Allowed for authorized users. |
| Blocked | Inactive | Blocked if stock exists. |
| Inactive | Active | Allowed only through controlled reactivation policy where configured. |

---

## 12. Warehouse Classification

### 12.1 Standard Warehouse Types

The system shall support standard warehouse types such as:

1. Sales.
2. Service.
3. Spares.
4. Mixed.
5. Returns.

### 12.2 Enterprise Warehouse Types

The system shall support expanded warehouse classifications such as:

1. Main.
2. QC / Inspection.
3. Quarantine.
4. Damage.
5. Scrap.
6. Transit.
7. Virtual.
8. Technician Van.
9. Consignment.
10. Cross-dock.
11. Staging.

Warehouse classification shall be used to determine allowed stock statuses, transactions, and operational behavior where configured.

---

## 13. Inventory Control Mode

The system shall use **Inventory Control Mode** as the primary field to determine inventory posting level.

| Inventory Control Mode | Meaning |
|---|---|
| Warehouse-level | Inventory is posted directly at warehouse level. |
| Location/BIN-level | Inventory is posted at valid inventory-allowed locations. |

### 13.1 Warehouse-Level Mode

The system shall:

1. Allow inventory at warehouse level.
2. Not require location/BIN selection.
3. Allow GRN at warehouse level.
4. Allow Issue from warehouse-level stock.
5. Not allow BIN-to-BIN movement.
6. Not require location hierarchy before warehouse activation.

### 13.2 Location/BIN-Level Mode

The system shall:

1. Require an active hierarchy template before warehouse activation.
2. Require valid source or destination locations for relevant transactions.
3. Allow inventory only at inventory-allowed leaf endpoints.
4. Allow BIN-to-BIN movement.
5. Derive BIN Managed as true.
6. Prevent conversion to warehouse-level mode when BIN stock or BIN transaction history exists.

---

## 14. Dynamic Location Hierarchy

The system shall support dynamic, template-based location hierarchy.

Example:

```text
Warehouse -> Zone -> Aisle -> Rack -> BIN
```

The system shall allow:

1. Multiple zones under a warehouse.
2. Multiple aisles under a zone.
3. Multiple racks under an aisle.
4. Multiple BINs under a rack.
5. Bulk creation at valid levels.
6. Different hierarchy paths to end at different valid leaf levels.
7. Higher-level inventory storage only when that node is a valid leaf endpoint.

### 14.1 Hierarchy Template Rules

The system shall:

1. Allow one active template per warehouse unless advanced multi-template governance is configured.
2. Require Template Code and Template Name.
3. Require controlled Level Sequence.
4. Support Mandatory Level.
5. Support Leaf Eligible.
6. Support Allow Skip Level.
7. Prevent skipping mandatory levels.
8. Allow multiple Leaf Eligible levels when Flexible Path Enabled is true.
9. Require new template version for active structural changes.
10. Support template effective dates, retirement, and migration where configured.

---

## 15. Leaf and Inventory Allowed Governance

The system shall distinguish between the following concepts.

| Concept | Meaning |
|---|---|
| Leaf Eligible | Template-level rule defining whether a level can end a valid path. |
| Is Leaf Endpoint | Derived value on the actual location node. |
| Inventory Allowed | Derived value determining whether stock can be posted to the location. |

The system shall:

1. Derive Inventory Allowed at actual location-node level.
2. Prevent manual editing of Inventory Allowed.
3. Allow inventory only at valid leaf endpoints.
4. Prevent more than one inventory-allowed node in one physical path.
5. Allow a higher-level node to hold inventory only if it is the valid leaf endpoint of that path.
6. Block inventory posting to any location where Inventory Allowed is false.

---

## 16. Location / BIN Master

The system shall allow actual location and BIN creation under an active hierarchy template.

The system shall:

1. Validate parent-child rules.
2. Derive Full Location Code from the actual path.
3. Derive Location Level.
4. Derive Is Leaf Endpoint.
5. Derive Inventory Allowed.
6. Require Location Type for inventory-allowed locations.
7. Support Location Status.
8. Support capacity and storage constraints.
9. Support barcode identification.
10. Support QR identification and advanced metadata where configured.

### 16.1 Location Lifecycle

| From Status | To Status | Rule |
|---|---|---|
| Draft | Active | Allowed when parent and template rules are valid. |
| Active | Blocked | Allowed when operationally required. |
| Active | Inactive | Blocked if stock exists. |
| Blocked | Active | Allowed for authorized users. |
| Blocked | Inactive | Blocked if stock exists. |
| Inactive | Active | Allowed only through controlled reactivation policy where configured. |

---

## 17. Location Type and BIN Type

Location Type shall be a transaction control, not only a descriptive field.

### 17.1 Location Types

The system shall support location types such as:

1. Storage.
2. Picking.
3. QC.
4. Returns.
5. Staging.
6. Dock.
7. Damage.
8. Scrap.
9. Transit.
10. Cross-dock.

### 17.2 BIN Types

The system shall support BIN types such as:

1. Sales.
2. Service.
3. Spares.
4. Mixed.
5. QA.
6. Returns.

The system shall use Location Type and BIN Type to validate transaction eligibility, putaway, picking, stock status, reservation, allocation, and return routing where configured.

---

## 18. Capacity and Storage Constraints

### 18.1 Warehouse-Level Capacity

Warehouse-level capacity shall be used as soft control for planning and reporting.

Warehouse-level capacity may include:

1. Total Square Footage.
2. Usable Space.
3. Clear Height.
4. Floor Load Capacity.
5. Rack Load Capacity.
6. Dock Capacity.
7. Material Handling Equipment Capacity.

### 18.2 Location/BIN-Level Capacity

The system shall support:

1. Max Units.
2. Max Weight.
3. Max Volume.
4. Pallet Positions where configured.

Capacity shall be validated for:

1. GRN into location.
2. Putaway.
3. Transfer In.
4. Positive Stock Adjustment.
5. BIN-to-BIN destination.
6. Return In where configured.

Capacity shall normally not be validated for:

1. Issue.
2. Picking.
3. Transfer Out.
4. Negative Stock Adjustment.
5. Cycle Count.
6. Reservation.
7. Allocation.

### 18.3 Storage Constraints

The system shall support:

1. Temperature Zone.
2. Hazard Allowed.
3. Allow Mixed Items.
4. Allow Mixed Lots.
5. Compliance Requirements.
6. Storage Restriction Notes.
7. Location Profile / Location Policy.

The system shall block putaway where configured constraints are violated.

---

## 19. Item Eligibility

### 19.1 Eligibility Preconditions

The system shall allow item eligibility setup only when:

1. Location is active.
2. Location is inventory-allowed.
3. Location is a valid leaf endpoint.
4. Warehouse is Location/BIN-level controlled.

### 19.2 Eligibility Modes

| Eligibility Mode | Meaning |
|---|---|
| Open | All otherwise-valid active items are allowed unless blocked by another rule. |
| Restricted | Only explicitly assigned items are allowed. |
| Basic Hybrid | Explicit items are allowed; if no explicit item exists, configured default behavior applies. |
| Category-based | Items are allowed by category, group, brand, model, or inventory class. |
| Advanced Hybrid | Combination of explicit item, category, group, attribute, and compatibility rules. |

The system shall prevent duplicate item eligibility records for the same item and location.

---

## 20. Auto Putaway

Auto Putaway shall determine destination location for inbound inventory.

The system shall:

1. Treat Auto Putaway separately from Auto Picking.
2. Allow Auto Putaway only for Location/BIN-level warehouses.
3. Require Auto Putaway Strategy if enabled.
4. Support Default Putaway Location.
5. Validate destination location status.
6. Validate Inventory Allowed.
7. Validate Location Type.
8. Validate item eligibility.
9. Validate capacity.
10. Validate hazard, temperature, mixed item, and mixed lot rules.
11. Support advanced strategy sequence such as Empty Location First, Same Item, Same Lot, Capacity-Based, Zone Priority, Temperature-Compatible, Hazard-Compatible, and Location Profile-Based.
12. Block putaway when no valid destination is found.
13. Allow putaway override only with permission, reason, and audit where configured.

---

## 21. Auto Picking

Auto Picking shall determine source location for outbound inventory.

The system shall:

1. Treat Auto Picking separately from Auto Putaway.
2. Allow Auto Picking only for Location/BIN-level warehouses.
3. Require Auto Picking Strategy if enabled.
4. Support Manual, FIFO, FEFO, Priority, Fixed Picking Location, Zone Priority, Pick Location Priority, and Stock Status Filter where configured.
5. Validate source location status.
6. Validate Inventory Allowed.
7. Validate Location Type.
8. Validate available stock.
9. Exclude restricted stock statuses from normal picking where configured.
10. Block picking when no valid source is found.
11. Allow picking override only with permission, reason, and audit where configured.

---

## 22. Purpose-Specific Default Locations

The system shall support purpose-specific default locations.

| Default Location | Purpose |
|---|---|
| Default Putaway Location | Default/fallback inbound location. |
| Default Picking Location | Default outbound source location where configured. |
| Default Return Location | Default return destination. |
| Default QC Location | Default inspection destination. |
| Default Staging Location | Default temporary movement location. |
| Default Scrap/Damage Location | Default damaged or scrap stock destination. |

Each default location shall belong to the same warehouse and shall be active, valid, and compatible with its purpose.

---

## 23. Stock Status Governance

The system shall support Stock Status as an inventory control dimension.

Supported stock statuses may include:

1. Available.
2. Reserved.
3. Allocated.
4. Picked.
5. Packed.
6. In Transit.
7. QC Hold.
8. Damaged.
9. Blocked.
10. Returned.
11. Scrap.

The system shall:

1. Define allowed stock statuses by warehouse type.
2. Define allowed stock statuses by location type.
3. Exclude unavailable statuses from normal picking.
4. Exclude restricted statuses from normal reservation and allocation.
5. Allow restricted stock movement only with permission and reason.
6. Control whether each stock status is included in availability.

---

## 24. Return, QC, Damage, and Scrap Routing

The system shall:

1. Validate return destination where return transactions are used.
2. Route customer returns to Returns, QC, Storage, Damage, or Scrap based on condition and configuration.
3. Route service returns based on inspection requirement.
4. Route vendor returns through valid return-to-vendor process.
5. Require QC location when inspection is needed.
6. Prevent returned stock from becoming available until disposition permits it.
7. Allow return-to-stock only after inspection or validation.
8. Route damaged stock to Damage or Scrap location.
9. Maintain disposition status for returned stock.

---

## 25. Reservation and Allocation

The system shall:

1. Allow reservation at warehouse level for warehouse-level inventory mode.
2. Allow reservation at warehouse or BIN level for Location/BIN-level warehouses based on configuration.
3. Prevent reservation from inactive, blocked, damaged, QC, scrap, or unavailable stock unless allowed.
4. Validate branch access for shared warehouses.
5. Validate stock status before reservation.
6. Allow allocation at warehouse or BIN level based on configuration.
7. Prevent allocation from locations not eligible for picking or fulfillment.
8. Allow allocation release or reallocation where configured.

---

## 26. Cycle Count Governance

The system shall:

1. Support cycle count eligibility by warehouse, zone, location type, location profile, or BIN.
2. Allow count at warehouse level for warehouse-level inventory mode.
3. Allow count at BIN/location level for Location/BIN-level warehouses.
4. Support count freeze to prevent conflicting movements.
5. Allow blocked locations to be counted with permission.
6. Require variance review where counted quantity differs from system quantity.
7. Require approval where variance exceeds tolerance.
8. Support count calendar or schedule assignment.

---

## 27. Bulk Creation and Import/Export

### 27.1 Bulk Creation

The system shall support bulk creation of:

1. Warehouses where controlled admin permission is available.
2. Templates.
3. Zones.
4. Aisles.
5. Racks.
6. BINs.
7. Other valid location nodes under the active template.

The system shall:

1. Require valid parent context.
2. Derive level and parent entity.
3. Require Code Prefix.
4. Require Name Prefix.
5. Require Start Sequence.
6. Require Count.
7. Require Sequence Length.
8. Generate preview before create.
9. Make preview read-only.
10. Invalidate preview when input changes.
11. Detect duplicate codes within batch.
12. Detect duplicate codes against existing records.
13. Prevent partial creation.
14. Create all records or zero records.
15. Revalidate parent status, permission, and duplicates before create.
16. Store Creation Method as Bulk.

### 27.2 Import / Export

The system shall support:

1. Import template download.
2. Upload validation.
3. Error file generation.
4. Warehouse import.
5. Location/BIN import.
6. Item eligibility import.
7. Warehouse hierarchy export.
8. Location/BIN setup export.
9. Configuration export.
10. Import/export audit.

---

## 28. Audit, Reason Codes, and Approval

### 28.1 Basic Audit

The system shall capture:

1. Created By.
2. Created Date.
3. Last Updated By.
4. Last Updated Date.
5. Creation Source.

### 28.2 Field-Level Audit

The system shall capture:

1. Field changed.
2. Old value.
3. New value.
4. Changed by.
5. Changed date/time.
6. Source.
7. Reason code.
8. Approval reference.
9. Version reference where applicable.

### 28.3 Reason Codes

The system shall support reason codes for:

1. Warehouse block/unblock.
2. Warehouse inactivation.
3. Branch assignment removal.
4. Inventory Control Mode change attempt.
5. Default warehouse change.
6. Default location change.
7. Location block/unblock.
8. Location inactivation.
9. Capacity override.
10. Putaway override.
11. Picking override.
12. Item eligibility removal.
13. Stock adjustment.
14. Template version change.

### 28.4 Approval Workflow

The system shall support approval for:

1. Warehouse inactivation.
2. Shared warehouse branch unassignment.
3. Inventory Control Mode change.
4. Template version activation.
5. Capacity override.
6. Picking override.
7. Putaway override.
8. Eligibility removal with stock.
9. Stock adjustment above tolerance.

---

## 29. Detailed Functional Field Specification

### 29.1 Warehouse Header Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Warehouse Code | Unique warehouse identifier | Alphanumeric | Mandatory | No | The system shall use this as the primary business identifier. | Must be unique within governing scope. Cannot be blank. | Editable in Draft only; locked after activation. | Ownership Scope |
| Warehouse Name | Business display name | Text | Mandatory | No | The system shall display this name in warehouse selection and reporting. | Cannot be blank. Name uniqueness is configurable. | Editable in Draft and Active; controlled when stock/history exists. | None |
| Warehouse Description | Additional explanation | Text | Optional | No | The system shall allow descriptive notes. | Max length configurable. | Editable unless warehouse is Inactive. | None |
| Warehouse Ownership Scope | Defines Organization-level or Branch-level warehouse | List of Values | Mandatory | No | The system shall classify every warehouse by ownership scope. | Must be Organization-level or Branch-level. | Editable in Draft; locked after activation if dependency exists. | None |
| Owning Organization | Organization that owns/governs the warehouse | Lookup | Conditional | No | Required when warehouse is Organization-level. | Must be active organization. | Editable in Draft; controlled after activation; locked with stock/history. | Ownership Scope |
| Owning Branch | Branch that owns the warehouse | Lookup | Conditional | No | Required when warehouse is Branch-level. | Must be active branch. | Editable in Draft; controlled after activation; locked with stock/history. | Ownership Scope |
| Company | Company associated with warehouse | Lookup / Derived | Derived or Conditional | No | The system shall derive or assign company from ownership context. | Must align with owning branch or organization. | Read-only where derived. | Ownership model |
| Business Unit | Business unit associated with warehouse | Lookup | Conditional | No | The system shall support business unit governance where enabled. | Required where enterprise ownership is enabled. | Controlled; changes require validation. | Enterprise ownership |
| Legal Entity | Legal entity for inventory ownership | Lookup | Conditional | No | The system shall support accounting ownership where enabled. | Must be valid for selected business unit/company. | Controlled; changes require approval where configured. | Business Unit / Company |
| Inventory Owner | Defines stock ownership | List of Values / Lookup | Conditional | No | The system shall classify stock ownership. | Required where owner segregation is enabled. | Controlled after stock exists. | Ownership model |
| Physical Facility Reference | Links warehouse to physical facility | Lookup | Optional | No | The system shall allow multiple logical warehouses under one physical facility. | Must reference active facility. | Controlled after usage. | Shared facility model |
| Warehouse Type | Basic warehouse classification | List of Values | Mandatory | No | The system shall classify warehouse for operational behavior. | Must be valid configured type. | Controlled after activation. | None |
| Enterprise Warehouse Type | Extended classification | List of Values | Optional | No | The system shall support QC, Quarantine, Damage, Scrap, Transit, Virtual, and other enterprise types. | Must be valid configured type. | Controlled after stock/history exists. | Warehouse Type |
| Warehouse Management Enabled | Enables WMS-ready behavior | Boolean | Mandatory | No | The system shall enable advanced warehouse governance when true. | Must be Yes for Location/BIN-level warehouses. | Controlled after activation; locked when stock/history exists. | Inventory Control Mode |
| Inventory Control Mode | Determines inventory posting level | List of Values | Mandatory | No | The system shall support Warehouse-level and Location/BIN-level modes. | Cannot be blank. Cannot switch to warehouse-level mode if BIN stock/history exists. | Controlled after activation; locked with stock/history. | Warehouse Management Enabled |
| BIN Managed | Indicates BIN-level control | Derived Boolean | Derived | No | The system shall derive this from Inventory Control Mode. | True when mode is Location/BIN-level. | Read-only. | Inventory Control Mode |
| Warehouse Status | Controls lifecycle and transaction use | List of Values | Mandatory | No | The system shall support Draft, Active, Blocked, and Inactive. | Status transition must follow lifecycle rules. | Controlled by lifecycle. | Stock / transactions |
| Creation Source | Source of creation | System List | System | No | The system shall capture Manual, Bulk, Import, or Integration. | Captured at creation. | Read-only. | Creation method |

### 29.2 Warehouse Sharing and Branch Assignment Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Shared With Branches | Branches allowed to use organization-level warehouse | Multi-lookup | Conditional | Yes | Organization-level warehouses may be assigned to multiple branches. | Only active branches can be selected. Branch-level warehouses cannot use this field. | Controlled after assignment use. Cannot remove branch with stock/open transactions. | Ownership Scope |
| Assigned Branch | Individual branch assigned to shared warehouse | Lookup | Conditional | No | Each assignment shall represent one branch's access to the shared warehouse. | Branch must be active. | Controlled after stock/open transaction exists. | Shared With Branches |
| Assignment Status | Status of branch assignment | List of Values | System / Controlled | No | The system shall support Active, Blocked, and Inactive assignment statuses. | Inactive assignment cannot be used for transactions. | Controlled. | Assigned Branch |
| Is Default for Assigned Branch | Marks shared warehouse as default for branch | Boolean | Optional | No | Only one default warehouse shall be allowed per branch. | Warehouse must be assigned to branch before defaulting. | Controlled. | Assigned Branch |
| Assignment Effective From | Start date for branch usage | Date | Optional | No | The system shall support effective-dated sharing. | Cannot be after Effective To. | Controlled. | Assignment Status |
| Assignment Effective To | End date for branch usage | Date | Optional | No | The system shall stop assignment usage after this date. | Cannot remove active dependency with stock/open transactions. | Controlled. | Assignment Status |
| Assignment Reason | Reason for assignment change | List of Values / Text | Conditional | No | Required where reason governance is enabled. | Cannot be blank when configured as mandatory. | Required on sensitive assignment changes. | Reason code setup |

### 29.3 Default Warehouse and Default Location Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Is Default Warehouse | Marks warehouse as branch default | Boolean | Optional | No | Only one default warehouse shall exist per branch. | Branch-level warehouse can be default only for owning branch. Shared warehouse must be assigned to branch. | Controlled after activation. | Branch context |
| Default For Branch | Branch for which warehouse is default | Lookup | Conditional | No | Required when organization-level warehouse is marked default. | Branch must be assigned to warehouse. | Controlled. | Is Default Warehouse |
| Default Putaway Location | Default inbound location | Lookup | Conditional | No | Used for inbound fallback/putaway. | Must belong to same warehouse, be Active, Inventory Allowed, and valid for putaway. | Controlled after stock/history exists. | Auto Putaway / Inventory Mode |
| Default Picking Location | Default outbound source location | Lookup | Optional | No | Used for outbound picking where configured. | Must be active picking-eligible location. | Controlled. | Location Type |
| Default Return Location | Default return destination | Lookup | Optional | No | Used for return routing. | Must be active and valid for Returns/QC/Storage. | Controlled. | Return configuration |
| Default QC Location | Default inspection location | Lookup | Optional | No | Used for stock requiring inspection. | Must be active QC location. | Controlled. | QC routing |
| Default Staging Location | Default temporary movement location | Lookup | Optional | No | Used for inbound/outbound staging. | Must be active staging location. | Controlled. | Staging setup |
| Default Scrap/Damage Location | Default damaged/scrap destination | Lookup | Optional | No | Used for damaged or scrap stock. | Must be active Damage or Scrap location. | Controlled. | Return/disposition setup |

### 29.4 Inventory Control and Transaction Requirement Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Allow Warehouse-Level Posting | Determines whether posting can happen at warehouse level | Derived Boolean | Derived | No | True only for Warehouse-level mode. | System-derived. | Read-only. | Inventory Control Mode |
| Require Location for GRN | Requires destination location for inbound | Derived Boolean | Derived | No | True only for Location/BIN-level warehouses. | System-derived. | Read-only. | Inventory Control Mode |
| Require Location for Issue | Requires source location for outbound | Derived Boolean | Derived | No | True only for Location/BIN-level warehouses. | System-derived. | Read-only. | Inventory Control Mode |
| Allow BIN-to-BIN Movement | Enables internal BIN movement | Derived Boolean | Derived | No | True only for Location/BIN-level warehouses. | System-derived. | Read-only. | Inventory Control Mode |
| Reservation Level | Determines reservation level | List of Values | Conditional | No | Warehouse-level or BIN-level based on configuration. | Must align with Inventory Control Mode. | Controlled. | Reservation setup |
| Allocation Level | Determines allocation level | List of Values | Conditional | No | Warehouse-level or BIN-level based on configuration. | Must align with Inventory Control Mode. | Controlled. | Allocation setup |

### 29.5 Auto Putaway and Auto Picking Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Auto Putaway Enabled | Enables system-assisted inbound destination selection | Boolean | Optional | No | Allowed only for Location/BIN-level warehouses. | Block if enabled for Warehouse-level mode. | Controlled after activation. | Inventory Control Mode |
| Auto Putaway Strategy | Defines inbound location selection rule | List of Values | Conditional | Conditional | Required if Auto Putaway is enabled. May support ordered multiple strategies where configured. | Must be valid configured strategy. | Controlled after activation. | Auto Putaway Enabled |
| Putaway Strategy Sequence | Priority order of putaway rules | Ordered multi-select | Conditional | Yes | The system shall evaluate strategies in configured sequence. | At least one valid strategy required when advanced putaway is enabled. | Controlled. | Auto Putaway Enabled |
| Auto Picking Enabled | Enables system-assisted outbound source selection | Boolean | Optional | No | Allowed only for Location/BIN-level warehouses. | Block if enabled for Warehouse-level mode. | Controlled after activation. | Inventory Control Mode |
| Auto Picking Strategy | Defines outbound source selection rule | List of Values | Conditional | Conditional | Required if Auto Picking is enabled. May support ordered multiple strategies where configured. | Must be Manual, FIFO, FEFO, Priority, or configured strategy. | Controlled after activation. | Auto Picking Enabled |
| Picking Strategy Sequence | Priority order of picking rules | Ordered multi-select | Conditional | Yes | The system shall evaluate picking strategies in configured sequence. | At least one strategy required when advanced picking is enabled. | Controlled. | Auto Picking Enabled |
| Picking Override Allowed | Allows user override of system-selected pick source | Boolean | Optional | No | Override shall require permission, reason, and audit. | Cannot override without permission. | Controlled. | Auto Picking |
| Putaway Override Allowed | Allows user override of system-selected putaway destination | Boolean | Optional | No | Override shall require permission, reason, and audit. | Cannot override without permission. | Controlled. | Auto Putaway |

### 29.6 Warehouse Timing, Calendar, Capacity, and Storage Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Opening Time | Basic warehouse opening time | Time | Optional | No | Used for informational operation timing. | Must be before Closing Time. | Editable unless Inactive. | Closing Time |
| Closing Time | Basic warehouse closing time | Time | Optional | No | Used for informational operation timing. | Must be after Opening Time. | Editable unless Inactive. | Opening Time |
| Time Zone | Warehouse time zone | List of Values | Optional | No | Used for timing, calendar, and reporting. | Must be valid time zone. | Controlled after activation. | Address / Calendar |
| Warehouse Operating Calendar | Calendar for working days, holidays, receiving, dispatch | Lookup | Optional / Conditional | No | Required where calendar-based operations are enabled. | Must be active calendar. | Controlled. | Operating calendar setup |
| Receiving Availability | Defines receiving windows | Calendar rule | Optional | Yes | Controls receiving transactions by date/time. | Transaction outside window may warn or block. | Controlled. | Operating Calendar |
| Dispatch Availability | Defines dispatch windows | Calendar rule | Optional | Yes | Controls issue/dispatch transactions by date/time. | Transaction outside window may warn or block. | Controlled. | Operating Calendar |
| Total Square Footage | Total warehouse area | Number | Optional | No | Used for planning/reporting. | Cannot be negative. | Controlled after activation. | None |
| Usable Space | Usable warehouse area | Number | Optional | No | Used for planning/reporting. | Cannot exceed Total Square Footage. | Controlled after activation. | Total Square Footage |
| Clear Height | Vertical storage height | Number | Optional | No | Used for storage planning. | Cannot be negative. | Controlled. | None |
| Floor Load Capacity | Floor load capacity | Number | Optional | No | Used for safety/storage control. | Cannot be negative. | Controlled. | None |
| Rack Load Capacity | Rack load capacity | Number | Optional | No | Used for rack safety control. | Cannot be negative. | Controlled. | Rack setup |
| Dock Capacity | Receiving/dispatch dock capacity | Number | Optional | No | Used for operational planning. | Cannot be negative. | Editable/controlled. | None |
| Temperature Controlled | Indicates temperature-managed warehouse | Boolean | Optional | No | When true, temperature rules apply. | Temperature Range required when true. | Controlled after stock exists. | Temperature Range |
| Temperature Range | Allowed temperature range | Text / Numeric range | Conditional | No | Required when Temperature Controlled = Yes. | Must be valid range. | Controlled after stock exists. | Temperature Controlled |
| Hazardous Storage Supported | Allows hazardous item storage | Boolean | Optional | No | Controls hazardous stock eligibility. | Hazardous stock blocked if false. | Controlled after hazardous stock exists. | Item hazard flag |

### 29.7 Contact and Address Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Contact Name | Warehouse contact person | Text | Optional | No | Multiple contact records may exist. | Cannot exceed configured length. | Editable unless warehouse inactive. | Contact record |
| Contact Number | Phone number | Phone | Optional | No | Used for communication. | Must follow configured phone format. | Editable unless warehouse inactive. | Contact record |
| Email Address | Email address | Email | Optional | No | Used for communication. | Must follow email format. | Editable unless warehouse inactive. | Contact record |
| Contact Designation | Role/designation | Text / List | Optional | No | Identifies contact role. | Must be valid if list is used. | Editable unless warehouse inactive. | Contact record |
| Primary Contact | Marks primary contact | Boolean | Optional | No | Only one primary contact per warehouse where configured. | Duplicate primary contacts blocked or auto-corrected. | Controlled. | Contact records |
| Address Type | Type of address | List of Values | Optional / Conditional | No | Multiple address records may exist. | Type uniqueness configurable. | Editable unless warehouse inactive. | Address record |
| Address Line 1 | Primary address line | Text | Conditional | No | Required where address is mandatory. | Cannot be blank if address is required. | Editable/controlled. | Address record |
| Address Line 2 | Additional address line | Text | Optional | No | Additional address detail. | Max length configurable. | Editable. | Address record |
| Address Line 3 | Additional address line | Text | Optional | No | Additional address detail. | Max length configurable. | Editable. | Address record |
| Address Line 4 | Additional address line | Text | Optional | No | Additional address detail. | Max length configurable. | Editable. | Address record |
| Postal Code | Postal or ZIP code | Text / Lookup | Optional | No | May validate against area master. | Must be valid where area validation is enabled. | Editable. | Country / State / City |
| Country | Country | Lookup | Optional / Conditional | No | May be required if address is mandatory. | Must be active country. | Editable. | Address record |
| State | State | Lookup | Optional | No | Depends on country. | Must belong to selected country where validated. | Editable. | Country |
| City | City | Lookup | Optional | No | Depends on state/country. | Must belong to selected state/country where validated. | Editable. | State / Country |
| Address Time Zone | Time zone for address | List of Values | Optional | No | Used for timing and future calendar. | Must be valid time zone. | Editable/controlled. | Address |
| Is Default Address | Marks default address | Boolean | Optional | No | Only one default address per warehouse. | Duplicate default address blocked or auto-corrected. | Controlled. | Address records |

### 29.8 Hierarchy Template Header Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Template Code | Unique hierarchy template code | Alphanumeric | Mandatory | No | Identifies hierarchy template. | Must be unique within configured scope. | Editable in Draft; locked after activation. | Template scope |
| Template Name | Template display name | Text | Mandatory | No | Used for template selection. | Cannot be blank. | Editable unless inactive. | Template record |
| Template Description | Template explanation | Text | Optional | No | Provides business explanation. | Max length configurable. | Editable unless inactive. | None |
| Template Status | Template lifecycle status | List of Values | Mandatory | No | Supports Draft, Active, Blocked, Inactive. | Status transition must follow template lifecycle. | Controlled. | Template usage |
| Template Version | Version number | System Number | System | No | Incremented on structural changes. | System-generated. | Read-only. | Template changes |
| Warehouse Reference | Warehouse using template | Lookup | Conditional | No | One active template per warehouse unless advanced governance is configured. | Required for warehouse-specific template. | Locked if locations exist. | Warehouse |
| Flexible Path Enabled | Allows different valid leaf depths | Boolean | Mandatory | No | Required for flexible hierarchy. | Multiple Leaf Eligible levels require this to be Yes. | Locked when locations exist. | Template design |
| Active Template Indicator | Identifies active template | Boolean/System | System / Controlled | No | Only one active template per warehouse unless advanced governance is enabled. | Activation blocked if another active template exists and multi-template is not allowed. | Controlled. | Warehouse Reference |
| Template Effective From | Template start date | Date | Optional | No | Used for version lifecycle. | Cannot be after Effective To. | Controlled. | Template Version |
| Template Effective To | Template end date | Date | Optional | No | Used for retirement/migration. | Cannot be before Effective From. | Controlled. | Template Version |
| Version Change Reason | Reason for template version change | List/Text | Conditional | No | Required for structural changes where configured. | Cannot be blank when required. | Controlled. | Reason setup |
| Template Approval Status | Approval status for version activation | List | Conditional | No | Supports maker-checker for template changes. | Active only after approval where configured. | System/controlled. | Approval workflow |

### 29.9 Hierarchy Template Level Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Level Sequence | Defines level order | Number / System | Mandatory | No | Sequence shall be continuous. | Missing or duplicate sequence blocked. | Controlled after activation; new version required after use. | Template |
| Parent Level | Defines parent template level | Lookup / Derived | Conditional | No | Child levels shall follow parent level rules. | Invalid parent-child structure blocked. | Controlled after activation. | Level Sequence |
| Level Code | Level identifier | Alphanumeric | Mandatory | No | Must be unique within template. | Duplicate Level Code blocked. | Editable in Draft; locked after use. | Template |
| Level Name | Level display name | Text | Mandatory | No | Used to identify level. | Cannot be blank. | Editable/controlled. | Template |
| Mandatory Level | Defines required level in path | Boolean | Optional | No | Mandatory levels cannot be skipped. | Skip Level cannot be true if Mandatory Level is true. | Controlled after template activation. | Allow Skip Level |
| Leaf Eligible | Defines whether level can end valid path | Boolean | Mandatory | No | Multiple levels may be Leaf Eligible if Flexible Path Enabled is true. | At least one Leaf Eligible level required. | Controlled after template activation; new version required after use. | Flexible Path Enabled |
| Allow Skip Level | Allows level skipping | Boolean | Optional | No | Skip allowed only where configured. | Cannot skip mandatory level. | Controlled after activation. | Mandatory Level |
| Allowed Child Levels | Defines valid next levels | Multi-lookup | Conditional | Yes | Used for advanced flexible hierarchy. | Child level must be allowed. | Controlled. | Flexible hierarchy |
| Default Location Type by Level | Default location type for created nodes | List of Values | Optional | No | Supports defaulting during location creation. | Must be valid Location Type. | Controlled. | Location Type setup |
| Default BIN Type by Level | Default BIN type for created nodes | List of Values | Optional | No | Supports defaulting during BIN creation. | Must be valid BIN Type. | Controlled. | BIN Type setup |

### 29.10 Actual Location / BIN Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Location Code | Actual location/BIN code | Alphanumeric | Mandatory | No | Identifies actual location node. | Must be unique within parent/path rule. | Editable in Draft; locked after activation. | Parent Location |
| Location Name | Location display name | Text | Mandatory | No | Business name of location. | Cannot be blank. | Editable/controlled. | None |
| Parent Location | Parent actual location | Lookup | Conditional | No | Must follow active template. | Child location not allowed under invalid parent. | Controlled; locked with stock/history. | Template |
| Warehouse Reference | Warehouse containing location | Derived Lookup | Derived | No | Derived from hierarchy. | Must match parent warehouse. | Read-only. | Parent Location |
| Full Location Code | Full hierarchy path code | Derived Text | Derived | No | Derived from complete path. | Must be unique within warehouse. | Read-only. | Location path |
| Location Level | Actual hierarchy level | Derived | Derived | No | Derived from template/path. | Must align with template. | Read-only. | Template |
| Is Leaf Endpoint | Indicates whether node ends path | Derived Boolean | Derived | No | True when actual node is valid endpoint. | System-derived. | Read-only. | Template/path |
| Inventory Allowed | Allows inventory posting | Derived Boolean | Derived | No | True only for valid inventory leaf endpoint. | Manual edit blocked. | Read-only. | Is Leaf Endpoint / status / mode |
| Location Type | Functional role of location | List of Values | Mandatory for inventory locations | No | Controls transaction eligibility. | Required when Inventory Allowed = true. | Controlled after stock exists. | Inventory Allowed |
| BIN Type | Operational BIN classification | List of Values | Optional | No | Supports Sales, Service, Spares, Mixed, QA, Returns. | Must be valid BIN Type. | Controlled after stock exists. | Location Type |
| Location Status | Lifecycle status | List of Values | Mandatory | No | Supports Draft, Active, Blocked, Inactive. | Inactive location cannot transact. | Controlled by lifecycle. | Stock/history |
| Putaway Blocked | Blocks inbound movement | Boolean | Optional | No | Blocks putaway without blocking picking. | Cannot put away if true. | Controlled. | Location status |
| Picking Blocked | Blocks outbound picking | Boolean | Optional | No | Blocks picking without blocking putaway. | Cannot pick if true. | Controlled. | Location status |
| Barcode Enabled | Enables barcode identification | Boolean | Optional | No | Barcode may identify location. | Barcode Value required if manual mode. | Controlled. | Location/BIN |
| Barcode Generation Mode | Manual or system-generated barcode | List | Conditional | No | Required when barcode is enabled. | Must be valid mode. | Controlled. | Barcode Enabled |
| Barcode Value | Barcode identifier | Text | Conditional | No | Must identify location uniquely. | Unique within warehouse. | Locked if used in transaction/scanning history. | Barcode Enabled |
| QR Enabled | Enables QR identification | Boolean | Optional | No | Advanced location identification. | QR details required where enabled. | Controlled. | QR setup |
| QR Payload Type | Defines QR content type | List | Conditional | No | Used for metadata/routing. | Required if QR advanced payload enabled. | Controlled. | QR Enabled |
| QR Payload | QR encoded data | Text/System | Conditional | No | Encodes location metadata. | Must follow payload rules. | Controlled/system. | QR Payload Type |

### 29.11 Location Capacity and Constraint Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Capacity Tracking Enabled | Enables location capacity checks | Boolean | Optional | No | Capacity checks apply when enabled. | Cannot disable if current stock depends on capacity rules. | Controlled after stock exists. | Inventory Allowed |
| Max Units | Maximum quantity capacity | Number | Conditional | No | Used for quantity-based capacity. | Cannot be less than current quantity. | Controlled after stock exists. | Capacity Tracking Enabled |
| Max Weight | Maximum weight capacity | Number | Conditional | No | Used for weight capacity. | Cannot be less than current weight. | Controlled after stock exists. | Capacity Tracking Enabled |
| Max Volume | Maximum volume capacity | Number | Conditional | No | Used for volume capacity. | Cannot be negative. | Controlled after stock exists. | Capacity Tracking Enabled |
| Pallet Positions | Maximum pallet positions | Number | Optional | No | Used for palletized storage. | Cannot be less than current pallet use. | Controlled. | Pallet handling |
| Temperature Zone | Location temperature classification | List | Optional | No | Used for storage compatibility. | Must be valid zone. | Controlled after stock exists. | Temperature setup |
| Hazard Allowed | Allows hazardous item storage | Boolean | Optional | No | Hazardous items blocked when false. | Cannot set to No if hazardous stock exists. | Controlled after stock exists. | Item hazard |
| Allow Mixed Items | Allows multiple items in same location | Boolean | Optional | No | If false, only one item may exist. | Cannot set to No if multiple items already exist. | Controlled after stock exists. | Current stock |
| Allow Mixed Lots | Allows multiple lots in same location | Boolean | Optional | No | If false, only one lot may exist. | Cannot set to No if multiple lots already exist. | Controlled after stock exists. | Current stock |
| Storage Restriction Notes | Additional restrictions | Text | Optional | No | Used for compliance guidance. | Max length configurable. | Controlled. | Compliance |
| Location Profile | Reusable location policy | Lookup | Optional | No | Applies capacity, mixing, hazard, transaction, and eligibility rules. | Must be active profile. | Controlled. | Location Profile setup |
| Profile Override Allowed | Allows location-level override of profile rules | Boolean | Optional | No | Override allowed only where configured. | Override may require reason/approval. | Controlled. | Location Profile |

### 29.12 Item Eligibility Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Eligibility Mode | Defines item-location eligibility behavior | List of Values | Mandatory for inventory locations | No | Supports Open, Restricted, Basic Hybrid, Category-based, Advanced Hybrid. | Required for inventory-allowed locations. | Controlled after stock exists. | Inventory Allowed |
| Eligible Item | Explicit item allowed in location | Lookup | Conditional | Yes during assignment action; stored as individual records | Required for Restricted or Hybrid item-level eligibility. | Duplicate item-location eligibility blocked. | Controlled; removal controlled if stock exists. | Eligibility Mode |
| Item Code | Item identifier | Derived | Derived | No | Derived from selected item. | Must match item master. | Read-only. | Eligible Item |
| Item Name | Item display name | Derived | Derived | No | Derived from selected item. | Must match item master. | Read-only. | Eligible Item |
| Inventory Type | Serialized/non-serialized indicator | Derived | Derived | No | Derived from item master. | Must match item setup. | Read-only. | Eligible Item |
| Item Status | Active/inactive item status | Derived | Derived | No | Only active items normally allowed. | Inactive item blocked or warned based on configuration. | Read-only. | Eligible Item |
| Eligible Item Category | Category allowed in location | Lookup | Conditional | Yes | Used for category-based eligibility. | Required where Category-based mode is used. | Controlled. | Eligibility Mode |
| Eligible Item Group | Item group allowed in location | Lookup | Optional / Conditional | Yes | Used for group-level eligibility. | Must be active item group. | Controlled. | Eligibility Mode |
| Eligible Brand / Model | Brand/model allowed | Lookup | Optional | Yes | Used where item master supports brand/model. | Must be valid attribute. | Controlled. | Item master |
| Eligibility Status | Status of eligibility rule | List | Mandatory where rule lifecycle is enabled | No | Active, Blocked, Inactive. | Inactive rule cannot be used. | Controlled. | Eligibility record |
| Effective From | Start date of eligibility | Date | Optional | No | Eligibility starts on this date. | Cannot be after Effective To. | Controlled. | Eligibility Status |
| Effective To | End date of eligibility | Date | Optional | No | Eligibility ends on this date. | Cannot be before Effective From. | Controlled. | Eligibility Status |
| Added By | User who added eligibility | System | System | No | Captured automatically. | System-generated. | Read-only. | Add action |
| Added On | Date/time added | System DateTime | System | No | Captured automatically. | System-generated. | Read-only. | Add action |
| Removal Reason | Reason for eligibility removal | List/Text | Conditional | No | Required where stock exists or governance is enabled. | Cannot be blank when required. | Controlled. | Reason setup |
| Approval Status | Approval for eligibility change | List | Conditional | No | Required where eligibility removal affects stock. | Must be approved before effective change. | System/controlled. | Approval workflow |

### 29.13 Stock Status Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Stock Status | Defines inventory availability state | List | Mandatory when stock status governance is enabled | No | Available, Reserved, Allocated, Picked, Packed, In Transit, QC Hold, Damaged, Blocked, Returned, Scrap. | Must be allowed for warehouse/location type. | Controlled by transaction. | Warehouse Type / Location Type |
| Allowed Stock Status by Warehouse Type | Defines statuses allowed by warehouse type | Configuration table | Conditional | Yes | Controls which statuses may exist in each warehouse type. | Invalid combinations blocked. | Controlled. | Warehouse Type |
| Allowed Stock Status by Location Type | Defines statuses allowed by location type | Configuration table | Conditional | Yes | Controls which statuses may exist in each location type. | Invalid combinations blocked. | Controlled. | Location Type |
| Include in Availability | Determines if stock counts as available | Boolean | Conditional | No | Available stock included; QC/Damaged/Scrap normally excluded. | Must follow stock status rule. | Controlled. | Stock Status |
| Allow Reservation | Determines if stock can be reserved | Boolean | Conditional | No | Restricted stock normally not reservable. | Must follow stock status rule. | Controlled. | Stock Status |
| Allow Allocation | Determines if stock can be allocated | Boolean | Conditional | No | Restricted stock normally not allocatable. | Must follow stock status rule. | Controlled. | Stock Status |
| Allow Picking | Determines if stock can be picked | Boolean | Conditional | No | Unavailable stock normally not pickable. | Must follow stock status rule. | Controlled. | Stock Status |

### 29.14 Return, QC, Damage, and Scrap Routing Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Return Type | Classifies return | List | Conditional | No | Customer Return, Vendor Return, Service Return, Internal Return. | Must be valid return type. | Controlled. | Return process |
| Return Condition | Condition of returned item | List | Conditional | No | Sellable, Damaged, Requires Inspection, Scrap, Rework. | Determines routing. | Controlled. | Return Type |
| Inspection Required | Indicates QC requirement | Boolean | Conditional | No | If true, route to QC. | QC location required if true. | Controlled. | Return Condition |
| Return Routing Rule | Determines destination for return | Configuration | Conditional | Yes where multiple conditions are configured | Routes to Returns, QC, Storage, Damage, or Scrap. | Must resolve to valid destination. | Controlled. | Return Type / Condition |
| Disposition Status | Status after return inspection | List | Conditional | No | Return-to-stock, Repair, Damage, Scrap, Vendor Return. | Must be valid for return condition. | Controlled. | QC outcome |
| Return-to-Stock Allowed | Allows stock to become available | Boolean | Conditional | No | Allowed only after validation/inspection. | Block if disposition not approved. | Controlled. | Disposition Status |

### 29.15 Reservation and Allocation Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Reservation Enabled | Enables reservation for warehouse/location | Boolean | Optional | No | Reservation follows Inventory Control Mode. | Block if warehouse/location is not eligible. | Controlled. | Inventory Control Mode |
| Reservation Level | Defines reservation level | List | Conditional | No | Warehouse-level or BIN-level. | Must align with Inventory Control Mode. | Controlled. | Reservation Enabled |
| Reservation Eligible Location Types | Location types allowed for reservation | Multi-select | Conditional | Yes | Only eligible location types can be reserved. | Invalid location type blocked. | Controlled. | Location Type |
| Allocation Enabled | Enables allocation | Boolean | Optional | No | Allocation follows stock and picking rules. | Block if warehouse/location not eligible. | Controlled. | Inventory Control Mode |
| Allocation Level | Defines allocation level | List | Conditional | No | Warehouse-level or BIN-level. | Must align with Inventory Control Mode. | Controlled. | Allocation Enabled |
| Allocation Eligible Location Types | Location types allowed for allocation | Multi-select | Conditional | Yes | Only eligible location types can be allocated. | Invalid location type blocked. | Controlled. | Location Type |
| Reallocation Allowed | Allows allocation change | Boolean | Optional | No | Permits release/reallocation where configured. | Cannot reallocate restricted stock unless allowed. | Controlled. | Allocation status |

### 29.16 Cycle Count Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Cycle Count Enabled | Enables cycle count governance | Boolean | Optional | No | Enables count planning and controls. | Required before count rules apply. | Controlled. | Warehouse/location setup |
| Cycle Count Scope | Defines count level | List | Conditional | Conditional | Warehouse, Zone, Location Type, Location Profile, BIN. Multiple scopes may be configured where allowed. | Must align with Inventory Control Mode. | Controlled. | Cycle Count Enabled |
| Cycle Count Frequency | Frequency of count | List / Number | Optional | No | Daily, Weekly, Monthly, Quarterly, Custom. | Must be valid frequency. | Controlled. | Cycle Count Enabled |
| Cycle Count Calendar | Calendar for counts | Lookup | Optional | No | Used to schedule counts. | Must be active calendar. | Controlled. | Operating Calendar |
| Count Freeze Enabled | Prevents conflicting movement during count | Boolean | Optional | No | Blocks movements during count where enabled. | Transaction blocked during freeze. | Controlled. | Cycle Count |
| Variance Tolerance | Allowed difference before approval | Number/Percentage | Optional | No | Variance above tolerance requires approval. | Cannot be negative. | Controlled. | Count results |
| Count Approval Required | Requires approval for variance | Boolean | Conditional | No | Required when variance exceeds tolerance. | Cannot post variance without approval. | Controlled. | Variance Tolerance |

### 29.17 Bulk Creation Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Bulk Entity Type | Entity being bulk created | List / Derived | Mandatory | No | Warehouse, Template, Location Node, Leaf BIN. | Must be valid for context. | Selected/derived before preview. | Parent context |
| Parent Entity | Parent under which records are created | Lookup / Derived | Mandatory | No | Parent must be valid and active. | Inactive parent blocked. | Locked after preview until invalidated. | Bulk Entity Type |
| Level | Derived hierarchy level | Derived | Derived | No | Based on parent and template. | Must follow template. | Read-only. | Parent Entity |
| Code Prefix | Generated code prefix | Text | Mandatory | No | Used for generated codes. | Cannot be blank; must follow allowed characters. | Editable before preview. | Bulk generation |
| Name Prefix | Generated name prefix | Text | Mandatory | No | Used for generated names. | Cannot be blank. | Editable before preview. | Bulk generation |
| Start Sequence | Starting sequence number | Number | Mandatory | No | First sequence number. | Must be numeric. | Editable before preview. | Bulk generation |
| Count | Number of records to generate | Number | Mandatory | No | Defines how many records are created. | Must be greater than zero and within limit. | Editable before preview. | Bulk generation |
| Sequence Length | Zero-padding length | Number | Mandatory | No | Controls generated code length. | Must support generated values. | Editable before preview. | Bulk generation |
| Separator | Code separator | Text/List | Optional | No | Used in generated code. | Must be allowed character. | Editable before preview. | Bulk generation |
| Suffix | Optional suffix | Text | Optional | No | Added to generated code. | Must follow code rules. | Editable before preview. | Bulk generation |
| Template Reference | Template used for generation | Lookup | Conditional | No | Required for location/BIN bulk creation. | Must be active template. | Locked after preview. | Bulk Entity Type |
| Preview Generated | Indicates valid preview exists | Boolean/System | System | No | Preview required before create. | Create blocked if preview missing/invalid. | Read-only. | Preview action |
| Preview Result | Generated records | System list | System | Yes as displayed rows; not editable | Must exactly match final create records. | Preview rows read-only. | Read-only. | Preview Generated |
| Validation Status | Result of preview validation | System List | System | No | Valid, Warning, Error. | Create blocked if Error. | Read-only. | Preview validation |
| Conflict Codes | Duplicate/conflicting codes | System list | System | Yes | Displays all conflicts. | Create blocked if conflicts exist. | Read-only. | Validation Status |
| Creation Method | Creation source | System | System | No | Captured as Bulk. | Stored on created records. | Read-only. | Bulk create |

### 29.18 Import / Export Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Import Entity Type | Defines imported entity | List | Mandatory | No | Warehouse, Location, BIN, Item Eligibility, Configuration. | Must be valid import type. | Selected before upload. | Import setup |
| Import Template Version | Defines import template format | List/System | Mandatory | No | Ensures upload format compatibility. | Unsupported version blocked. | Controlled. | Import Entity Type |
| Import File | Uploaded file | File | Mandatory | No | Contains records to validate/import. | File format and structure must be valid. | Controlled until validation. | Import Entity Type |
| Import Validation Status | Validation result | System List | System | No | Valid, Warning, Error. | Import blocked if Error. | Read-only. | Import validation |
| Error File | Rejected records with errors | System file | System | No | Generated when errors exist. | Must include record-level errors. | Read-only. | Import Validation Status |
| Import Mode | Create, Update, or Create + Update | List | Mandatory | No | Defines import behavior. | Must be allowed for selected entity. | Controlled. | Import Entity Type |
| Partial Import Allowed | Allows valid records to import while errors remain | Boolean | Optional | No | Default should be No unless configured. | If No, any error blocks full import. | Controlled. | Import Mode |
| Export Entity Type | Defines exported entity | List | Mandatory | Conditional | Warehouse, Location, BIN, Eligibility, Configuration. Multiple export groups may be selected where allowed. | Must be valid export type. | Selected before export. | Export setup |
| Export Format | Output format | List | Mandatory | No | XLSX, CSV, or configured format. | Must be supported. | Selected before export. | Export Entity Type |

### 29.19 Audit, Reason Code, and Approval Fields

| Field Name | Field Purpose | Field Type | Required Rule | Multi-Selection Allowed | Rules | Validations | Editable / Locking Rule | Dependency |
|---|---|---|---|---|---|---|---|---|
| Created By | Creator user | System User | System | No | Captured once. | System-generated. | Read-only. | Record creation |
| Created Date | Creation date/time | System DateTime | System | No | Captured once. | System-generated. | Read-only. | Record creation |
| Last Updated By | Last modifying user | System User | System | No | Updated on save. | System-generated. | Read-only. | Record update |
| Last Updated Date | Last modified date/time | System DateTime | System | No | Updated on save. | System-generated. | Read-only. | Record update |
| Creation Source | Source of record creation | System List | System | No | Manual, Bulk, Import, Integration. | System-generated. | Read-only. | Creation method |
| Last Change Source | Source of last change | System List | System | No | Manual, Bulk, Import, Integration. | System-generated. | Read-only. | Record update |
| Reason Code | Reason for sensitive change | List | Conditional | No | Required for configured events. | Action blocked if missing. | Required before action completion. | Reason setup |
| Reason Description | Additional explanation | Text | Optional / Conditional | No | May be required for selected reason codes. | Cannot be blank where configured. | Editable during action. | Reason Code |
| Approval Required | Indicates approval requirement | Derived Boolean | Derived | No | Derived from event setup. | Sensitive action blocked until approved. | Read-only. | Approval setup |
| Approval Status | Approval state | List/System | Conditional | No | Pending, Approved, Rejected, Cancelled. | Change effective only after approval where required. | System/controlled. | Approval Required |
| Requested By | User requesting change | System User | System | No | Captured when approval requested. | System-generated. | Read-only. | Approval workflow |
| Requested Date | Request date/time | System DateTime | System | No | Captured when approval requested. | System-generated. | Read-only. | Approval workflow |
| Approved By | Approver user | System User | System | No | Captured on approval. | Maker-checker rule applies where enabled. | Read-only. | Approval Status |
| Approved Date | Approval date/time | System DateTime | System | No | Captured on approval. | System-generated. | Read-only. | Approval Status |
| Field Changed | Field name changed | System | System | No | Captured for field-level audit. | System-generated. | Read-only. | Field-level audit |
| Previous Value | Old value | System | System | No | Captured before change. | System-generated. | Read-only. | Field-level audit |
| New Value | New value | System | System | No | Captured after change. | System-generated. | Read-only. | Field-level audit |
| Version Reference | Related template/config version | System | System | No | Captures version impact. | System-generated. | Read-only. | Versioned configuration |

---

## 30. Field-Level Change Control Summary

The system shall control changes to critical fields after activation, stock creation, transaction history, branch assignment, or dependency creation.

| Field / Area | Control Rule |
|---|---|
| Warehouse Ownership Scope | Locked after stock/history; reason and approval required where change is supported. |
| Owning Organization | Locked after stock/history; reason and approval required where change is supported. |
| Owning Branch | Locked after stock/history; reason and approval required where change is supported. |
| Shared Branch Assignment | Cannot remove if dependencies exist; effective dates, reason, and approval may apply. |
| Warehouse Code | Locked after activation. |
| Inventory Control Mode | Locked with stock/history; migration workflow required if change is supported. |
| Warehouse Management Enabled | Controlled after activation; approval required where configured. |
| Template Structure | New version required. |
| Level Sequence | New version required after use. |
| Leaf Eligible | New version required after use. |
| Allow Skip Level | New version required after use. |
| Location Code | Locked after activation. |
| Parent Location | Locked after stock/history. |
| Inventory Allowed | Always derived; never manually editable. |
| Location Type | Controlled after stock exists. |
| Hazard Allowed | Cannot disable if hazardous stock exists. |
| Allow Mixed Items | Cannot disable if mixed items exist. |
| Allow Mixed Lots | Cannot disable if mixed lots exist. |
| Default Putaway Location | Controlled after use. |
| Auto Putaway Strategy | Controlled after activation. |
| Auto Picking Strategy | Controlled after activation. |

---

## 31. Rules and Validation Summary

The system shall block save, activation, transaction, or lifecycle change when:

1. Required ownership fields are missing.
2. Warehouse code is duplicate within governing scope.
3. Branch attempts to use an unassigned shared warehouse.
4. Branch attempts to use another branch's warehouse.
5. Default warehouse rule creates multiple defaults for the same branch.
6. Warehouse is Draft or Inactive for inventory transaction.
7. Warehouse is Blocked for normal GRN, Issue, Putaway, or Picking.
8. Inventory Control Mode is missing.
9. BIN-managed warehouse transaction lacks required source/destination location.
10. Hierarchy template is missing for Location/BIN-level warehouse activation.
11. Parent-child hierarchy rule is violated.
12. Inventory is posted to a non-inventory-allowed location.
13. Location is inactive.
14. Location Type does not allow the transaction.
15. Item is not eligible for the destination location.
16. Capacity would be exceeded.
17. Hazard rule fails.
18. Temperature rule fails.
19. Mixed item rule fails.
20. Mixed lot rule fails.
21. Bulk generation has duplicate codes.
22. Preview is missing or invalid before bulk create.
23. Critical field change would invalidate stock or history.
24. Required reason code is missing.
25. Required approval is not completed.

---

## 32. Transaction Behavior Matrix

### 32.1 Inventory Control Mode Matrix

| Transaction | Warehouse-Level Mode | Location/BIN-Level Mode |
|---|---|---|
| GRN | Post at warehouse level. | Destination location required. |
| Issue | Issue from warehouse stock. | Source location required. |
| Transfer | Source/destination warehouse required. | Source/destination location required where applicable. |
| BIN-to-BIN Movement | Not applicable. | Source and destination locations required. |
| Putaway | Not applicable or simple placement. | Destination location required. |
| Picking | Not applicable or simple issue. | Source location required. |
| Stock Adjustment Increase | Destination warehouse required. | Destination location required. |
| Stock Adjustment Decrease | Source warehouse stock required. | Source location stock required. |
| Return | Basic destination validation if required. | Destination validation and return routing based on configuration. |
| Reservation | Warehouse-level reservation. | Warehouse or BIN-level by configuration. |
| Allocation | Warehouse-level allocation. | Warehouse or BIN-level by configuration. |
| Cycle Count | Warehouse-level count. | Location/BIN-level count. |

### 32.2 Warehouse Status Matrix

| Transaction | Draft | Active | Blocked | Inactive |
|---|---|---|---|---|
| GRN | Blocked | Allowed | Blocked | Blocked |
| Issue | Blocked | Allowed | Blocked | Blocked |
| Transfer Out | Blocked | Allowed | Conditional | Blocked |
| Transfer In | Blocked | Allowed | Conditional | Blocked |
| BIN-to-BIN Movement | Blocked | Allowed | Conditional | Blocked |
| Putaway | Blocked | Allowed | Blocked | Blocked |
| Picking | Blocked | Allowed | Blocked | Blocked |
| Stock Adjustment | Blocked | Allowed | Conditional | Blocked |
| Return | Blocked | Conditional | Conditional | Blocked |
| Reservation | Blocked | Allowed | Blocked | Blocked |
| Allocation | Blocked | Allowed | Blocked | Blocked |
| Cycle Count | Blocked | Allowed | Conditional | View Only |
| Reporting | Allowed | Allowed | Allowed | Allowed |

Conditional behavior requires configuration, permission, reason, or approval.

---

## 33. Final Functional Baseline Statement

The Warehouse Master shall be designed as an enterprise inventory-location governance foundation.

It shall support organization-level shared warehouses, branch-level warehouses, branch-specific default warehouse, inventory control mode, dynamic hierarchy, valid inventory-allowed locations, Location Type transaction control, item eligibility, Auto Putaway, Auto Picking, purpose-specific default locations, stock status governance, return routing, reservation, allocation, cycle count governance, bulk creation, import/export, lifecycle governance, auditability, approval, and future WMS scalability.

No UI, API, database, development, or QA design shall proceed until this functional baseline is reviewed and accepted.
