# Phase 0 — Warehouse Master Recovery Audit

## 1. Executive Summary

Overall implementation readiness rating: `5.5 / 10`

Current implementation status: `Not Ready`

The current Warehouse Master is a strong mock-backed foundation, not a production-ready enterprise WMS-ready module. It already includes a specialized list, guided create, configuration workspace, hierarchy workspace, locations workspace, import/audit screens, derived location identifiers, hierarchy template activation, actual node creation, and bulk node creation. However, the current design only partially matches the FRD and the now-locked product decisions.

Top 5 critical gaps:

1. The hierarchy domain is only partially generic. Templates are editable, but downstream logic still hardcodes `Zone`, `Aisle`, `Rack`, `Shelf`, and `BIN` assumptions in multiple places.
2. Level capability governance is missing. There is no template-level support for `Capacity Applicable`, `Item Eligibility Applicable`, or `Responsibility Applicable`.
3. Operational responsibility is not implemented. There is no Employee Master-based responsible employee model, inheritance, override, or audit flow.
4. Item mapping by scope is not implemented. Eligibility exists as a policy concept, but item-location mapping records, overlap rules, and multi-location item assignment are missing.
5. Branch-level ownership is currently modeled incorrectly in the active create flow. The code allows multiple owning branches, while the locked decision requires exactly one owning branch for branch-level warehouses.

Safest next phase:

- `Phase 1 — Core Hierarchy Domain Model Upgrade`

This is the safest next phase because the current module already has enough UI surface area that further feature work without a domain correction will keep reintroducing hardcoded hierarchy assumptions.

## 2. Source Documents Reviewed

| Source | Found? | Path | Notes |
| ------ | -----: | ---- | ----- |
| `Enterprise-WMS-Ready-Warehouse-Master-FRD.md` | Yes | [docs/enterprise_wms_ready_warehouse_master_frd.md](/D:/iDMS-UI/IDMS-UI/docs/enterprise_wms_ready_warehouse_master_frd.md) | Found under a different filename than requested. Used as primary functional source of truth. |
| `adminspecification.md` | Yes | [docs/adminspecification.md](/D:/iDMS-UI/IDMS-UI/docs/adminspecification.md) | Used for shell, route, and component-governance audit. |
| `wahoureseimplemented.md` | Yes | [wahoureseimplemented.md](/D:/iDMS-UI/IDMS-UI/wahoureseimplemented.md) | Used as current implementation note only; code took precedence where it conflicted. |
| `docs/warehouse-master-recovery-scope.md` | No | — | File not present in repository. |

## 3. Existing Warehouse Master File Inventory

### Pages

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Pages | [pages/WarehouseListPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseListPage.tsx) | Specialized warehouse list with preview and controlled actions | Modify | Uses list shell and preview/review patterns correctly. |
| Pages | [pages/WarehouseCreateWorkspace.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseCreateWorkspace.tsx) | Guided create flow with identity, ownership, inventory model, structure, defaults, review | Modify | Contains stale branch-level multi-owner behavior and stale timezone/company fields in code. |
| Pages | [pages/WarehouseConfigurationPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseConfigurationPage.tsx) | Sectioned post-create configuration workspace | Modify | Custom config shell, not `AdminConfigShell`. |
| Pages | [pages/WarehouseHierarchyPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseHierarchyPage.tsx) | Hierarchy tree, inspector, template designer, node creation, bulk create | Modify | Strong foundation but still partially hardcoded around example level types. |
| Pages | [pages/WarehouseLocationsPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseLocationsPage.tsx) | Location list, filtering, bulk create entry | Modify | Uses list shell, but model is still location-type-centric rather than capability-centric. |
| Pages | [pages/WarehouseImportPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseImportPage.tsx) | Governed import review flow | Modify | Generic import surface, not aligned to future hierarchy capability model. |
| Pages | [pages/WarehouseAuditPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseAuditPage.tsx) | Warehouse audit listing | Keep | Good audit shell entry point. |

### Components

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Components | [components/ConfigurationImpactBanner.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/ConfigurationImpactBanner.tsx) | Inline warning/impact banner | Keep | Reusable helper. |
| Components | [components/DerivedValueDisplay.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/DerivedValueDisplay.tsx) | Shows derived read-only values | Keep | Important for preserving derived-field governance. |
| Components | [components/HierarchyNodeInspector.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyNodeInspector.tsx) | Selected node summary and derived values | Modify | Needs responsibility, capability, and completion-state support. |
| Components | [components/HierarchyTemplateDesigner.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTemplateDesigner.tsx) | Template header + level-row designer | Modify | Core recovery target; currently generic only in part. |
| Components | [components/HierarchyTree.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTree.tsx) | Tree rendering with keyboard access and compact actions | Modify | Accessible foundation, but node type rendering still assumes known names. |
| Components | [components/LocationBulkCreateDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/LocationBulkCreateDrawer.tsx) | Bulk node creation preview/commit workflow | Modify | Uses template context, but still translates through fixed level-name assumptions. |
| Components | [components/LocationNodeCreateDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/LocationNodeCreateDrawer.tsx) | Single node creation drawer | Modify | Good workflow shell; still hardcodes child level -> location type mapping. |
| Components | [components/RuleExplanationPopover.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/RuleExplanationPopover.tsx) | Rule explanation helper popover | Keep | Reusable guidance component. |
| Components | [components/ValidationIssuePanel.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/ValidationIssuePanel.tsx) | Validation issue display | Keep | Generic support component. |
| Components | [components/WarehouseActivationReview.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseActivationReview.tsx) | Activation readiness checklist model and display | Modify | Needs new activation checks for responsibility, item mapping, and capability completeness. |
| Components | [components/WarehouseControlledActionDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseControlledActionDrawer.tsx) | Controlled action wrapper on SmartReviewDrawer | Keep | Good approved pattern. |
| Components | [components/WarehouseModeBadge.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseModeBadge.tsx) | Inventory mode badge | Keep | Lightweight view helper. |
| Components | [components/WarehousePreviewDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehousePreviewDrawer.tsx) | SmartPreviewDrawer-backed warehouse preview | Keep | Correct preview pattern. |
| Components | [components/WarehouseScopeBadge.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseScopeBadge.tsx) | Scope badge | Keep | Lightweight view helper. |
| Components | [components/WarehouseSectionNav.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseSectionNav.tsx) | Configuration left navigation with statuses | Modify | Works, but not tied to a formal AdminConfigShell contract. |
| Components | [components/WarehouseSetupHealth.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseSetupHealth.tsx) | Setup health summary display | Modify | Needs new hierarchy/domain checks. |
| Components | [components/WarehouseStatusBadge.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseStatusBadge.tsx) | Status badge | Keep | View helper. |

### Section Components

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Components | [components/sections/BranchAccessSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/BranchAccessSection.tsx) | Branch assignment profile management | Modify | Must remain org-level only and not conflict with inventory ownership. |
| Components | [components/sections/CapacityPolicySection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/CapacityPolicySection.tsx) | Warehouse-level capacity and constraints | Modify | Not yet multi-level capability-driven. |
| Components | [components/sections/CycleCountSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/CycleCountSection.tsx) | Cycle count settings | Keep | Independent of hierarchy recovery. |
| Components | [components/sections/EligibilityPolicySection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/EligibilityPolicySection.tsx) | Warehouse eligibility policy setup | Modify | Policy exists, but item mapping scope is missing. |
| Components | [components/sections/GovernanceSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/GovernanceSection.tsx) | Governance summary | Keep | Useful shell content. |
| Components | [components/sections/HierarchyTemplateSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/HierarchyTemplateSection.tsx) | Config page summary of hierarchy templates | Modify | Good summary surface, but not enough for recovery alone. |
| Components | [components/sections/InventoryControlSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/InventoryControlSection.tsx) | Inventory mode and related controls | Modify | Needs stricter alignment to activation and ownership rules. |
| Components | [components/sections/LocationDefaultsSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/LocationDefaultsSection.tsx) | Purpose-specific defaults | Keep | Good FRD-aligned direction. |
| Components | [components/sections/OwnershipSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/OwnershipSection.tsx) | Ownership data section | Modify | Must align with locked one-owner branch rule. |
| Components | [components/sections/PickingPolicySection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/PickingPolicySection.tsx) | Picking strategy builder | Keep | Independent foundation. |
| Components | [components/sections/PutawayPolicySection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/PutawayPolicySection.tsx) | Putaway strategy builder | Keep | Independent foundation. |
| Components | [components/sections/sectionStyles.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/sectionStyles.tsx) | Shared section styles | Keep | Styling helper. |
| Components | [components/sections/sectionTypes.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/sectionTypes.ts) | Shared section prop types | Modify | May need capability-aware payloads. |
| Components | [components/sections/StockGovernanceSection.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/sections/StockGovernanceSection.tsx) | Reservation/allocation/stock governance | Keep | Good phase-6/7 foundation. |

### Services

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Services | [services/warehouseApiAdapter.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/services/warehouseApiAdapter.ts) | Production adapter placeholder | Modify | Must eventually match recovered domain. |
| Services | [services/warehouseMapper.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/services/warehouseMapper.ts) | Projection mapping for summaries | Modify | Will need domain expansion. |
| Services | [services/warehouseMockAdapter.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/services/warehouseMockAdapter.ts) | In-memory implementation of service contract | Modify | Main recovery service boundary. |
| Services | [services/warehouseService.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/services/warehouseService.ts) | Service interface | Modify | Must expand for responsibility, mapping, capability, and wizard flows. |

### Types

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Types | [types/warehouse.dto.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.dto.ts) | Input/query DTOs | Modify | Needs new hierarchy capability, mapping, and responsibility shapes. |
| Types | [types/warehouse.enums.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.enums.ts) | Domain enums | Modify | Likely needs responsibility and mapping enums. |
| Types | [types/warehouse.permissions.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.permissions.ts) | Permission model | Modify | Employee lookup and mapping governance permissions may be needed. |
| Types | [types/warehouse.types.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.types.ts) | Core domain types | Modify | Primary recovery target. |

### Validation

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Validation | [validation/activationValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/activationValidation.ts) | Activation guard logic | Modify | Must include new readiness requirements. |
| Validation | [validation/hierarchyValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/hierarchyValidation.ts) | Template validation | Modify | Needs capability and lifecycle rules. |
| Validation | [validation/locationValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/locationValidation.ts) | Location/node validation | Modify | Needs generic level semantics and mapping/capacity applicability. |
| Validation | [validation/policyValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/policyValidation.ts) | Policy validation | Modify | Good base, but not enough for mapping/responsibility scope. |
| Validation | [validation/warehouseValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/warehouseValidation.ts) | Core warehouse validation | Modify | Branch-level multi-owner issue and stale create assumptions exist. |

### Utils

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Utils | [utils/governanceUtils.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/governanceUtils.ts) | Reason/approval helper rules | Keep | Good support utility. |
| Utils | [utils/hierarchyUtils.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/hierarchyUtils.ts) | Tree/path/level derivation utilities | Modify | Central recovery point for generic hierarchy behavior. |
| Utils | [utils/policyWorkbench.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/policyWorkbench.ts) | Policy simulation and summaries | Modify | May later absorb mapping/responsibility reasoning. |
| Utils | [utils/routeUtils.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/routeUtils.ts) | Warehouse route helpers | Keep | Stable helper. |
| Utils | [utils/rulePrecedence.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/rulePrecedence.ts) | Eligibility precedence helpers | Keep | Useful for deny-before-allow behavior. |
| Utils | [utils/warehouseDerivations.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/warehouseDerivations.ts) | Pure derived business rules | Modify | Needs capability, completion, and responsibility derivations. |
| Utils | [utils/warehouseStatusRules.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/warehouseStatusRules.ts) | Status rules | Keep | Auxiliary logic. |

### Fixtures

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Fixtures | [fixtures/warehouseFixtures.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/fixtures/warehouseFixtures.ts) | Seed warehouses, templates, locations, audit | Modify | Current seeds are still built around example hierarchies. |

### Tests

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Tests | [tests/GovernanceImport.test.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/GovernanceImport.test.ts) | Import/governance tests | Keep | Good governance baseline. |
| Tests | [tests/HierarchyCreationFlow.test.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/HierarchyCreationFlow.test.ts) | Template activation and multi-level node creation | Modify | Good base, but not generic-level capable yet. |
| Tests | [tests/HierarchyTree.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/HierarchyTree.test.tsx) | Tree behavior tests | Modify | Needs completion and generic-level coverage. |
| Tests | [tests/LocationBulkCreateDrawer.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/LocationBulkCreateDrawer.test.tsx) | Bulk create workflow tests | Modify | Needs custom-level and coding-policy coverage. |
| Tests | [tests/PolicyWorkbench.test.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/PolicyWorkbench.test.ts) | Policy domain tests | Modify | Needs capability-aware tests. |
| Tests | [tests/WarehouseConfigurationPage.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/WarehouseConfigurationPage.test.tsx) | Config-page statuses and rendering | Modify | Needs updated activation and section rules. |
| Tests | [tests/WarehouseCreateWorkspace.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/WarehouseCreateWorkspace.test.tsx) | Create-flow tests | Modify | Contains drift risk because active code and prior notes diverged. |
| Tests | [tests/warehouseDomain.test.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/warehouseDomain.test.ts) | General domain logic | Modify | Must absorb new domain model. |
| Tests | [tests/WarehouseHierarchyPage.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/WarehouseHierarchyPage.test.tsx) | Hierarchy-page rendering/tests | Modify | Needs completion state and generic path coverage. |
| Tests | [tests/WarehouseListPage.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/WarehouseListPage.test.tsx) | List page behavior | Keep | Mostly stable. |
| Tests | [tests/WarehouseLocationsPage.test.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/tests/WarehouseLocationsPage.test.tsx) | Locations-page rendering/tests | Modify | Needs identifier and capability coverage. |

### Other

| Area | File | Purpose Observed | Keep / Modify / Replace | Notes |
| ---- | ---- | ---------------- | ----------------------- | ----- |
| Other | [index.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/index.ts) | Public barrel exports | Modify | Must track domain changes. |

## 4. Route and Navigation Audit

| Route | Component | Status | Issue | Recommendation |
| ----- | --------- | ------ | ----- | -------------- |
| `/admin/master/warehouse-master` | `WarehouseListPage` | OK | None | Keep specialized route. |
| `/admin/master/warehouse-master/new` | `WarehouseCreateWorkspace` | OK | None | Keep specialized route before generic form routes. |
| `/admin/master/warehouse-master/:warehouseId/configuration` | `WarehouseConfigurationPage` | OK | None | Keep specialized route before generic `:masterKey` route. |
| `/admin/master/warehouse-master/:warehouseId/hierarchy` | `WarehouseHierarchyPage` | OK | None | Keep. |
| `/admin/master/warehouse-master/:warehouseId/locations` | `WarehouseLocationsPage` | OK | None | Keep. |
| `/admin/master/warehouse-master/:warehouseId/import` | `WarehouseImportPage` | OK | None | Keep. |
| `/admin/master/warehouse-master/:warehouseId/audit` | `WarehouseAuditPage` | OK | None | Keep. |
| Generic `/admin/master/:masterKey` swallowing warehouse routes | `MasterListPage` | Safe Currently | Specialized warehouse routes are declared earlier than generic routes, so React Router matches correctly | Preserve route order during future edits. |
| Direct refresh / deep links under HashRouter | `HashRouter` app-wide | Safe | URLs require `/#/` form | Keep hash-based deep links; document this for QA/UAT. |

Navigation behavior audit:

- Warehouse Master is registered in [adminNavConfig.ts](/D:/iDMS-UI/IDMS-UI/src/admin/adminNavConfig.ts) under `Warehouse & Inventory`.
- The master nav path is `/admin/master/warehouse-master`, which correctly lands on the specialized list page because the specialized route exists.
- Deep-link refresh is safe under `HashRouter` because the browser only reloads the pre-hash root document and the client router resolves the fragment.

## 5. Shell and Component Governance Audit

| Requirement | Current Evidence | Status | Gap | Fix Phase |
| ----------- | ---------------- | ------ | --- | --------- |
| Warehouse list uses `AdminListPageShell` | [WarehouseListPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseListPage.tsx) | Pass | None | — |
| Guided create uses Compact Form Workspace | [WarehouseCreateWorkspace.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseCreateWorkspace.tsx) | Pass | Custom implementation, but matches intent | — |
| Configuration uses `AdminConfigShell` | [WarehouseConfigurationPage.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/pages/WarehouseConfigurationPage.tsx) | Gap | Uses `AdminShell` + custom section layout, not `AdminConfigShell` | Phase 5 |
| Preview uses `SmartPreviewDrawer` | [WarehousePreviewDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehousePreviewDrawer.tsx) | Pass | None | — |
| Activation/review uses `SmartReviewDrawer` or approved pattern | [WarehouseControlledActionDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseControlledActionDrawer.tsx), [WarehouseActivationReview.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/WarehouseActivationReview.tsx) | Pass | Inline activation panel is acceptable because review model is SmartReviewDrawer-compatible | — |
| No duplicate `PageHeader` | Warehouse pages use custom headers or shell headers; no duplicate page-level `PageHeader` found in warehouse pages | Pass | None observed | — |
| No page-level `CommandPalette` | No warehouse page imports or renders `CommandPalette` | Pass | None | — |
| No Tailwind | Warehouse pages use inline styles / CSS variables, not Tailwind utility classes | Pass | None | — |
| No production `TODO` / `Coming Soon` | Search did not find production-visible TODO/Coming Soon strings in warehouse pages/components | Pass | None observed | — |

## 6. Functional Gap Audit Against FRD

| Capability Area | Current Implementation | FRD / Target Requirement | Gap | Impact | Fix Phase |
| --------------- | ---------------------- | ------------------------ | --- | ------ | --------- |
| Warehouse ownership | Organization and branch ownership modeled in create/config | Branch-level must be one owning branch only; org-level can be shared | Current create flow allows multiple owning branches | Ownership rules are inconsistent with locked product decision | Phase 1 |
| Branch access | Assignment profile exists and org-level sharing is modeled | Org-level sharing through branch assignment profile | Mostly aligned | Low gap; needs stronger ownership separation enforcement | Phase 1 |
| Inventory control mode | Warehouse-level and Location/BIN-level supported | BIN managed derived from mode and activation must honor mode | Mostly aligned | Low gap; activation and create drift still exist | Phase 9 |
| BIN Managed derivation | Derived via `deriveBinManaged` | Must remain derived | Aligned | Low risk | Phase 9 |
| Configurable hierarchy templates | Template designer, activation, versions exist | Dynamic configurable hierarchy template | Partially aligned | Capability metadata and genericity missing | Phase 2 |
| User-defined levels | Level rows editable | User-defined levels without hardcoded business assumptions | Partial only | Custom level names break downstream assumptions | Phase 1 |
| Valid parent-child paths | Allowed parent/child levels supported | Template-driven valid path model | Mostly aligned | Needs broader validation and non-hardcoded semantics | Phase 2 |
| Flexible leaf endpoints | `leafEligible` and `allowSkipLevel` exist | Flexible valid leaf depths | Partial | No explicit inventory endpoint eligibility model | Phase 2 |
| Full location identifier | `fullCode` derived and displayed | Full identifier derived from warehouse code + hierarchy path | Aligned in core logic | Needs broader surface coverage and naming consistency | Phase 3 |
| Actual location-node creation | Add Child and bulk create exist | Active-template-driven actual node creation | Partial | Still assumes named location types | Phase 5 |
| Inventory Allowed derivation | Derived and read-only | Must remain derived and read-only | Aligned | Must preserve through domain upgrade | Phase 9 |
| Is Leaf Endpoint derivation | Derived and read-only | Must remain derived and read-only | Aligned | Must preserve through domain upgrade | Phase 9 |
| Location lifecycle | Draft/Active/Blocked/Inactive modeled | Controlled lifecycle with stock/history constraints | Partial | Needs broader node-level activation/readiness rules | Phase 9 |
| Capacity at any level | Capacity exists on locations | Capacity can apply at any configured level | Missing | Major domain mismatch | Phase 6 |
| Item mapping at any level | No explicit mapping model | Mapping allowed at warehouse/profile/node scopes | Missing | Major functional gap | Phase 7 |
| Item mapping duplicate rules | No mapping records exist | Duplicate blocked only for same item + same scope + direction + overlap | Missing | Major functional gap | Phase 7 |
| Responsible employee / operational responsibility | Not implemented | Employee Master-based responsibility separate from Inventory Owner | Missing | Major functional gap | Phase 8 |
| Responsibility inheritance | Not implemented | Inherit/override model by level | Missing | Major functional gap | Phase 8 |
| Putaway | Advanced section and ordered builder exist | Filter-then-sort strategy builder | Largely aligned | Independent of hierarchy recovery | Phase 6 |
| Picking | Advanced section and ordered builder exist | Filter-then-sort strategy builder | Largely aligned | Independent of hierarchy recovery | Phase 6 |
| Reservation | Policy exists | Governed reservation behavior | Partial | Not yet tied to future capability model | Phase 6 |
| Allocation | Policy exists | Governed allocation behavior | Partial | Not yet tied to future capability model | Phase 6 |
| Stock status governance | Governance section exists | Separate stock availability/movement/commitment concepts | Largely aligned | Low gap | Phase 6 |
| Cycle count | Policy exists | Cycle count governance | Aligned baseline | Low gap | Phase 6 |
| Default locations | Purpose-specific defaults exist | Purpose-specific defaults | Aligned baseline | Must remain capability-aware | Phase 6 |
| Import | Guided import exists | Import/export must align to recovered model | Partial | Current import is generic, not domain-complete | Phase 10 |
| Audit | Audit page and events exist | Field/action/import approval audit | Aligned baseline | Extend to mapping/responsibility/template versioning | Phase 10 |
| Controlled actions | Drawer and reasons exist | Controlled lifecycle/governed actions | Aligned baseline | Extend to new domain actions | Phase 9 |
| Activation readiness | Setup health and activation review exist | Block invalid activation comprehensively | Partial | Missing ownership correction, responsibility, mapping, and capability checks | Phase 9 |

## 7. Hierarchy Model Audit

| Question | Current Answer | Evidence / File | Gap | Recommendation |
| -------- | -------------- | --------------- | --- | -------------- |
| 1. Can users define arbitrary hierarchy level names? | `Partially` | [HierarchyTemplateDesigner.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTemplateDesigner.tsx) allows editing names/codes | Downstream logic still assumes known names | Make all node creation/rendering depend on level metadata, not name matching |
| 2. Are Zone/Rack/BIN hardcoded anywhere? | `Yes` | [HierarchyTemplateDesigner.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTemplateDesigner.tsx), [LocationNodeCreateDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/LocationNodeCreateDrawer.tsx), [LocationBulkCreateDrawer.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/LocationBulkCreateDrawer.tsx), [HierarchyTree.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTree.tsx) | Violates locked decision | Remove hardcoded business assumptions; keep them only as presets/examples |
| 3. Can users define level sequence? | `Yes` | `sequence` editable in [HierarchyTemplateDesigner.tsx](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/components/HierarchyTemplateDesigner.tsx) | Sequence continuity not enforced strongly enough | Strengthen validation |
| 4. Can users define allowed parent-child relationships? | `Yes` | `allowedParentLevels` and `allowedChildLevels` in [warehouse.types.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.types.ts) and designer | Good baseline | Keep and harden |
| 5. Can users mark any level as Leaf Eligible? | `Yes` | `leafEligible` is editable | Good baseline | Keep |
| 6. Can users mark any level as Inventory Endpoint Eligible? | `No` | No separate field exists; system reuses leaf/inventory derivation only | Missing explicit capability | Add capability flag or clearly formalize leaf-based endpoint rule |
| 7. Can users configure Capacity Applicable by level? | `No` | No level capability field | Missing | Add to hierarchy level model |
| 8. Can users configure Item Eligibility Applicable by level? | `No` | No level capability field | Missing | Add to hierarchy level model |
| 9. Can users configure Responsibility Applicable by level? | `No` | No responsibility capability field | Missing | Add to hierarchy level model |
| 10. Can users create Warehouse → BIN? | `Yes` | Root BIN path now supported in validation and hierarchy flow | Works only through current hardcoded level-to-type translation | Preserve behavior after generic upgrade |
| 11. Can users create Warehouse → Zone → BIN? | `Yes` | Active-template path rules support it | Still name-assumption-based | Generalize |
| 12. Can users create Warehouse → Zone → Aisle → Rack → BIN? | `Yes` | Template + node creation flow supports it | Still name-assumption-based | Generalize |
| 13. Can users create a custom path such as Warehouse → Floor → Room → Shelf? | `Not Reliably` | Designer can edit names, but creation utilities do not map arbitrary levels cleanly | Custom paths are not truly first-class | Move from named location types to generic hierarchy node semantics |
| 14. Does quick hierarchy creation create/use a template? | `No` | Create step only records a hierarchy choice | Advisory only | Build actual quick wizard |
| 15. Does quick hierarchy creation create actual nodes after preview? | `No` | No create-step node generation workflow exists | Missing | Build actual template + node generation workflow |
| 16. Does actual node creation validate against active template? | `Yes` | [locationValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/locationValidation.ts) and [warehouseMockAdapter.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/services/warehouseMockAdapter.ts) | Good baseline | Keep and generalize |

## 8. Location Coding and Full Identifier Audit

| Requirement | Current Implementation | Gap | Fix Phase |
| ----------- | ---------------------- | --- | --------- |
| Node code exists | `locationCode` exists on `WarehouseLocation` | None | Phase 3 |
| Node code can be generated | Bulk create generates codes from prefix/sequence/suffix | Single-node generation helper not explicit | Phase 3 |
| Node code can be manually entered where allowed | Single-node drawer accepts manual code | None | Phase 3 |
| Per-level prefix exists | Bulk create uses `codePrefix`, but not as template-level coding policy | Missing persistent policy | Phase 3 |
| Per-level sequence length exists | Bulk create supports `sequenceLength` | Missing template-level coding policy | Phase 3 |
| Separator is configurable | Bulk create supports `separator` | Missing reusable coding-policy model | Phase 3 |
| Full location identifier is derived | `buildFullLocationCodeFromParent` derives path | None | Phase 3 |
| Full identifier includes warehouse code | Yes | None | Phase 3 |
| Full identifier includes ancestor node codes | Yes | None | Phase 3 |
| Full identifier is read-only | Yes in UI and domain usage | None | Phase 3 |
| Uniqueness is enforced within warehouse | Duplicate full path blocked in location validation and bulk preview | Good baseline | Phase 3 |
| Full identifier appears in tree | Yes | None | Phase 3 |
| Full identifier appears in inspector | Yes | None | Phase 3 |
| Full identifier appears in location list | Yes | None | Phase 3 |
| Full identifier appears in bulk preview | Indirectly used for conflict detection; not visibly displayed as full path in preview rows | Visibility gap | Phase 3 |
| Full identifier appears in item mapping | No item mapping UI exists | Missing | Phase 7 |
| Full identifier appears in import/export | Import/export not modeled at that fidelity | Missing | Phase 10 |
| Full identifier appears in audit | Audit events do not explicitly show full identifier fields | Partial | Phase 10 |
| Barcode/QR can use full identifier | Barcode field exists, but no explicit policy ties barcode/QR to full identifier | Missing policy linkage | Phase 10 |

Examples that should pass under the target model:

- `WM02-B01`
- `WM02-Z01-B01`
- `WM02-Z01-A01-R01-B01`

Current observed model can support equivalent outputs when the active template and parent path permit them.

## 9. Capacity Model Audit

| Requirement | Current Implementation | Gap | Recommendation |
| ----------- | ---------------------- | --- | -------------- |
| Capacity Applicable is configurable by level | No | Missing level capability field | Add template-level capability |
| Capacity fields show only where applicable | No | No applicability logic | Gate location capacity UI by level capability |
| Capacity can exist at warehouse level | Yes via warehouse capacity policy | Low gap | Keep |
| Capacity can exist at any structural level | Partially because any location can carry capacity data | No formal rule says where it applies | Add capability-aware enablement |
| Capacity can exist at inventory endpoint level | Yes technically | No special rule or applicability model | Formalize in domain |
| Enforcement mode supports Informational / Warning / Hard Block / Approval Required | No | Missing enforcement model | Add structured enforcement mode |
| Rollup from child nodes is supported or planned | No explicit support | Missing | Add to roadmap and derivation helpers |
| Capacity override is governed | Partial at warehouse policy level only | Location/node override governance missing | Add controlled override model |
| Capacity is revalidated before posting | Not visible in current warehouse master flow | Missing | Add activation/posting contract requirement |
| Capacity is not limited only to BIN | Technically true in current loose model | Not intentionally governed | Replace accidental flexibility with explicit capability-based flexibility |

## 10. Item Eligibility / Item Mapping Audit

| Requirement | Current Implementation | Gap | Recommendation |
| ----------- | ---------------------- | --- | -------------- |
| Item eligibility can be defined at warehouse level | Yes via warehouse `eligibilityPolicy` | Good baseline | Keep |
| Item eligibility can be defined at any hierarchy level where applicable | Partially via location-level `eligibilityPolicy` | No applicability-by-level rule | Add level capability flag |
| Item eligibility can be defined at leaf/location endpoint | Yes technically | No formal endpoint gating beyond guidance | Enforce capability + readiness |
| Item eligibility can be defined by item | Partial via `EligibilityRule` rule type `ItemCode` | No dedicated mapping records | Add explicit mapping model |
| Item eligibility can be defined by category/group/brand/model/attribute | Partial via `Category` and `Attribute`; no group/brand/model-specific shapes seen | Partial domain | Extend rule taxonomy |
| Same item can be mapped to multiple locations | No explicit mapping model | Missing | Add item-location mapping records |
| Duplicate is blocked only for same item + same scope + same rule direction + overlapping effective period | No | Missing | Add overlap-aware validator |
| Deny rules apply before allow rules | Yes in policy logic direction | Good baseline | Preserve |
| Inherited parent rules are evaluated | Not clearly implemented in hierarchy/location flow | Missing | Add inheritance evaluation |
| Local overrides are evaluated | Not clearly implemented as override stack | Missing | Add override model |
| Final posting eligibility is evaluated at transaction endpoint | Not represented in current warehouse master module | Missing contract | Add explicit posting-evaluation model |
| Mapping UI supports searchable item lookup | No | Missing | Add mapping workspace |
| Mapping UI supports multi-select | No | Missing | Add mapping workspace |
| Mapping UI supports add/remove | No | Missing | Add mapping workspace |
| Mapping UI supports pagination | No | Missing | Add mapping workspace |
| Mapping UI displays Added On / Added By | No | Missing | Add mapping audit fields |
| Inactive item handling exists | No evidence in warehouse module | Missing | Add lookup-state validation |
| Audit exists | Only general audit exists, not mapping audit | Missing | Extend audit model |

## 11. Operational Responsibility Audit

| Requirement | Current Implementation | Gap | Recommendation |
| ----------- | ---------------------- | --- | -------------- |
| Responsible Employee lookup from Employee Master | No | Missing | Add employee lookup dependency and reference type |
| Responsibility Mode: Inherit / Assign Directly / Not Applicable | No | Missing | Add responsibility mode to node/profile |
| Responsibility Role | No | Missing | Add role field |
| Effective From / Effective To | No | Missing | Add temporal fields |
| Escalation Employee | No | Missing | Add escalation reference |
| Effective Responsible Employee derived | No | Missing | Add derivation helper |
| Responsibility Source derived | No | Missing | Add derivation helper |
| Responsibility Status derived | No | Missing | Add derivation helper |
| Responsibility can apply to any configured level | No | Missing | Add level capability |
| Responsibility inheritance works | No | Missing | Add parent-based inheritance logic |
| Inactive employee is blocked | No | Missing | Add lookup/validation rule |
| Responsibility change is audited | No | Missing | Extend audit model |
| Responsibility does not change Inventory Owner | Not modeled because responsibility is absent | Missing concept | Add separate responsibility domain |

## 12. Ownership and Branch Access Audit

| Requirement | Current Implementation | Gap | Recommendation |
| ----------- | ---------------------- | --- | -------------- |
| Branch-level warehouse has one owning branch only | Current create flow and DTO allow `owningBranchCodes` and `branchOwnershipRows` | Violates locked decision | Revert branch-level ownership to one owning branch |
| Organization-level warehouse can be shared with multiple branches | Yes via assignment profile and shared branch handling | Aligned | Keep |
| Branch access does not change inventory ownership | Intended in notes and partial logic | Needs stronger separation in create/config model | Clarify in domain and UI |
| Inventory Owner remains separate | Yes at warehouse ownership level | Low gap | Preserve |
| Branch assignment profile controls transaction rights | Yes conceptually via assignment profile | Needs stronger activation/validation enforcement | Add to activation checks |

## 13. Activation Readiness Audit

| Activation Check | Current Implementation | Status | Missing Fix |
| ---------------- | ---------------------- | ------ | ----------- |
| Identity complete | Yes | Pass | — |
| Ownership valid | Partial | Partial | Must correct branch-level one-owner rule |
| One owning branch for branch-level warehouse | No | Fail | Update create, DTO, validation, activation checks |
| Branch assignments valid for organization-level warehouse | Partial | Partial | Strengthen config/activation validation |
| Inventory mode selected | Yes | Pass | — |
| BIN Managed derived | Yes | Pass | — |
| Active template exists for Location/BIN-level | Yes | Pass | — |
| Valid hierarchy path exists | Partial | Partial | Validate full template/node coherence more strongly |
| At least one active inventory endpoint exists | Yes | Pass | — |
| At least one Inventory Allowed location exists | Yes | Pass | — |
| Full location identifier uniqueness valid | Yes in create/bulk flows | Partial | Extend across import/export and future mapping |
| Required responsible employee exists | No | Fail | Add responsibility model and activation check |
| Required capacity rules valid | Partial | Partial | Add level capability and enforcement validation |
| Required item eligibility/mapping rules valid | Partial for policy, no for mapping | Fail | Add mapping model and validation |
| Operational time zone exists where required | Partial | Partial | Current create code still has timezone field, but product direction is inconsistent; clarify requirement by operating calendar policy |
| Permissions valid | Partial | Partial | Mock permissions exist; production contract missing |
| Reason/approval requirements handled | Partial | Partial | Good warehouse-level pattern; extend to new hierarchy/model governance |

## 14. Mock/API Boundary Audit

| Area | Current Implementation | Production Gap | Required API / Backend Contract |
| ---- | ---------------------- | -------------- | ------------------------------- |
| Templates | Mock adapter supports create + activate | No real API contract aligned to new domain | Template CRUD with version lifecycle and approval state |
| Levels | Stored inside template levels array | No capability-rich level contract | Level schema with capability flags and governance metadata |
| Actual nodes | Mock supports create and bulk create | No real API contract for generic level semantics | Node create/update/list contract with active-template validation |
| Coding policy | Emergent through bulk-create form fields | No stored policy model | Level coding policy and identifier preview contract |
| Capacity | Warehouse and location capacity fields exist | No capability-aware backend contract | Level applicability + enforcement/override contract |
| Item eligibility | Policy objects exist | No mapping-scope backend model | Eligibility + explicit item-mapping contracts |
| Responsibility | Not implemented | Entire backend contract missing | Employee lookup + responsibility inheritance contract |
| Activation validation | Mock adapter validates basic activation | Missing full enterprise readiness contract | Server-side activation-readiness API |
| Bulk preview | Mock preview exists | No real API | Bulk preview API with template + coding + conflict reasoning |
| Bulk commit | Mock commit exists | No real API | Bulk commit API with audit and atomicity guarantees |
| Import validation | Mock import validation exists | Domain-specific import contracts missing | Import validate/commit APIs for template/node/mapping/responsibility |
| Audit | Mock audit exists | No real backend contract | Audit feed contract with field/action/source correlation |
| Permissions | Mock-all permissions used in config page | No integrated authorization contract | Permission claims by action/section |
| Employee lookup | Not present | Missing | Employee Master lookup endpoint and status contract |

## 15. Test Coverage Audit

| Test Area | Existing Tests? | Missing Scenarios | Priority |
| --------- | --------------: | ----------------- | -------- |
| User-defined hierarchy levels | Partial | Arbitrary level names, capability flags, non-example paths | Critical |
| Full location identifier | Partial | Explicit display coverage across all surfaces | High |
| Duplicate identifier blocking | Partial | Import, item mapping, and nonstandard custom path conflicts | High |
| Quick hierarchy wizard | No | Template + node creation from create flow | Critical |
| Template activation | Yes | Version transitions with capability changes and lifecycle locks | High |
| Actual node creation | Yes | Custom named levels and non-example paths | Critical |
| Capacity at any level | No | Level applicability, enforcement modes, rollups | Critical |
| Item mapping at any level | No | Entire capability missing | Critical |
| Same item in multiple locations | No | Entire capability missing | Critical |
| Duplicate item mapping prevention | No | Entire capability missing | Critical |
| Responsibility inheritance | No | Entire capability missing | Critical |
| Branch ownership correction | No | Must verify one owning branch rule | Critical |
| Activation blocking | Partial | Responsibility, capacity, mapping, assignment-profile correctness | High |
| Import derived field rejection | Partial | Domain-rich imports for hierarchy and mapping | High |

## 16. Critical Findings

| ID | Severity | Finding | Impact | Recommended Fix Phase |
| -- | -------- | ------- | ------ | --------------------- |
| CF-01 | Blocker | Branch-level ownership currently allows multiple owning branches | Violates locked product decision and distorts downstream ownership logic | Phase 1 |
| CF-02 | Blocker | Hierarchy model is not truly generic because downstream logic still hardcodes example level names | Custom enterprise hierarchies cannot be trusted | Phase 1 |
| CF-03 | Critical | No level capability model exists for capacity, item eligibility, or responsibility | Core FRD capabilities cannot be enforced correctly | Phase 1 |
| CF-04 | Critical | Operational Responsible Employee model is missing entirely | Accountability and operational governance are absent | Phase 8 |
| CF-05 | Critical | Item-location mapping by scope is missing entirely | Major WMS allocation/eligibility use cases cannot be modeled | Phase 7 |
| CF-06 | Major | Quick hierarchy creation in create flow is advisory, not operational | Users still need manual template and node setup after create | Phase 4 |
| CF-07 | Major | Configuration page does not use `AdminConfigShell` | Admin-spec consistency is weaker than expected | Phase 5 |
| CF-08 | Major | Current implementation note document is out of sync with active create code | Recovery work can be misdirected if notes are treated as truth | Phase 1 |

## 17. Recommended Recovery Phases

| Phase | Name | Objective | Key Files Likely Affected | Exit Criteria |
| ----: | ---- | --------- | ------------------------- | ------------- |
| 1 | Core Hierarchy Domain Model Upgrade | Support configurable levels, capabilities, identifiers, responsibility, capacity, item scope | `types/warehouse.types.ts`, `types/warehouse.dto.ts`, `validation/warehouseValidation.ts`, `validation/locationValidation.ts`, `utils/hierarchyUtils.ts`, `utils/warehouseDerivations.ts` | Domain supports user-defined levels, level capabilities, single branch owner rule, and future responsibility/mapping hooks |
| 2 | Hierarchy Template Designer | Enable user-defined template levels and valid paths | `components/HierarchyTemplateDesigner.tsx`, `validation/hierarchyValidation.ts`, `services/warehouseMockAdapter.ts` | Template designer supports generic levels, capability fields, valid paths, and lifecycle-safe versioning |
| 3 | Location Coding and Full Identifier | Derive and display full location identifiers | `utils/hierarchyUtils.ts`, `components/LocationNodeCreateDrawer.tsx`, `components/LocationBulkCreateDrawer.tsx`, `pages/WarehouseLocationsPage.tsx`, `components/HierarchyNodeInspector.tsx` | Full identifier is centrally derived, unique, read-only, and visible across tree/list/preview flows |
| 4 | Quick Hierarchy Wizard | Generate template plus actual nodes after preview | `pages/WarehouseCreateWorkspace.tsx`, `pages/WarehouseHierarchyPage.tsx`, `services/warehouseMockAdapter.ts` | User can choose a hierarchy path in create, generate/use a template, and create initial actual nodes without manual mock edits |
| 5 | Tree Completion View and Node Inspector | Show actual hierarchy, completion, and node details | `components/HierarchyTree.tsx`, `components/HierarchyNodeInspector.tsx`, `pages/WarehouseHierarchyPage.tsx`, `pages/WarehouseConfigurationPage.tsx` | Tree shows actual hierarchy with completion/readiness status and inspector shows capability/responsibility details |
| 6 | Multi-Level Capacity and Constraints | Apply capacity to any configured level | `types/warehouse.types.ts`, `components/sections/CapacityPolicySection.tsx`, `validation/policyValidation.ts`, `validation/locationValidation.ts` | Capacity applicability and enforcement work at any configured level |
| 7 | Item Eligibility and Mapping by Scope | Apply item mapping at warehouse/profile/node scopes | `types/warehouse.types.ts`, `types/warehouse.dto.ts`, `components/sections/EligibilityPolicySection.tsx`, new mapping components/services/tests | Explicit item mapping exists with duplicate-overlap prevention and multi-location support |
| 8 | Operational Responsibility | Add Employee Master based responsibility and inheritance | `types/warehouse.types.ts`, `pages/WarehouseConfigurationPage.tsx`, `components/HierarchyNodeInspector.tsx`, `services/warehouseService.ts`, `services/warehouseMockAdapter.ts` | Responsibility can be assigned/inherited per level using Employee Master lookup |
| 9 | Activation Readiness and Guided Fix Flow | Block invalid activation and link to fixes | `components/WarehouseActivationReview.tsx`, `validation/activationValidation.ts`, `utils/warehouseDerivations.ts`, `pages/WarehouseConfigurationPage.tsx` | Activation blocks all invalid states with actionable section-level guidance |
| 10 | Import/Export/API Alignment | Align imports and backend contracts with new model | `pages/WarehouseImportPage.tsx`, `services/warehouseApiAdapter.ts`, `services/warehouseService.ts`, `types/warehouse.dto.ts` | Import/export and API contracts match recovered hierarchy domain |
| 11 | Tests, UAT, and Release Readiness | Prove complete behavior | `tests/*` across warehouse module | Automated coverage and UAT confirm hierarchy, ownership, capacity, mapping, responsibility, and activation correctness |

## 18. Final Recommendation

Recommended immediate next phase:

- `Phase 1 — Core Hierarchy Domain Model Upgrade`

Should coding start now?

- `Yes, but only with Phase 1 domain correction first.`
- `No further feature-layer implementation should be added on top of the current hierarchy assumptions before that correction.`

Top 3 files to modify first:

1. [src/admin/masters/warehouse-master/types/warehouse.types.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/types/warehouse.types.ts)
2. [src/admin/masters/warehouse-master/utils/hierarchyUtils.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/utils/hierarchyUtils.ts)
3. [src/admin/masters/warehouse-master/validation/warehouseValidation.ts](/D:/iDMS-UI/IDMS-UI/src/admin/masters/warehouse-master/validation/warehouseValidation.ts)

Top 3 risks to avoid:

1. Do not keep building on hardcoded `Zone/Aisle/Rack/BIN` assumptions while calling the hierarchy model “user-defined”.
2. Do not preserve the current branch-level multi-owner create behavior, because it conflicts directly with the locked ownership decision.
3. Do not introduce responsibility or item-mapping UI before the domain types and validation rules exist, or the module will split further between notes, UI, and actual runtime behavior.
