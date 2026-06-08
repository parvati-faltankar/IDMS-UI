# Phase 1.5 — Typecheck Stabilization Summary

## 1. Status
- Complete

## 2. Reason for Phase 1.5
- Phase 2 was blocked because npx tsc -b --pretty false failed, as documented in docs/warehouse-master/phase-2-entry-gate-blocker-report.md.

## 3. Error Baseline
- Baseline capture command:
  - npx tsc -b --pretty false > docs/warehouse-master/phase-1-5-typecheck-errors-before.txt 2>&1
- Total TypeScript errors before: 68
- Warehouse vs non-warehouse split:
  - Warehouse Master: 47
  - Non-warehouse: 21
- Error categories identified:
  - Warehouse Master errors caused by Phase 1 domain changes:
    - SectionHealth property name drift in preview rendering.
    - ControlledActionRequest payload missing required action.
    - strategy typing regressions (string[] vs PutawayStrategy[] / PickingStrategy[]).
    - WarehouseStatus argument mismatch in location filtering.
  - Warehouse Master pre-existing integration errors:
    - unused imports/variables under noUnusedLocals/noUnusedParameters.
  - Non-warehouse project errors:
    - unused imports/variables in area/service-registry/product/sale-order files.
    - component prop mismatches.
    - nullable argument mismatches in route document lookups.
  - Unused imports/variables:
    - TS6133 and TS6196 dominated baseline.
  - DTO/request shape mismatches:
    - missing action in activateWarehouse request payload.
  - enum/string literal mismatches:
    - drawer action tone mismatch and status tone union mismatch.
  - component prop mismatches:
    - SmartPreviewDrawer prop usage mismatch in ProductListPage.

## 4. Files Changed
| File | Change Type | Reason | Warehouse Related? |
|---|---|---|---|
| src/admin/masters/warehouse-master/components/RuleExplanationPopover.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/WarehouseControlledActionDrawer.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/WarehousePreviewDrawer.tsx | type fix + cleanup | fix SectionHealth field names; remove unused symbols | Yes |
| src/admin/masters/warehouse-master/components/sections/BranchAccessSection.tsx | import cleanup | remove unused style imports and React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/CapacityPolicySection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/CycleCountSection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/EligibilityPolicySection.tsx | type fix + cleanup | remove unused React default import; pass typed summary payload | Yes |
| src/admin/masters/warehouse-master/components/sections/GovernanceSection.tsx | cleanup | remove unused icon and dead helper/constants | Yes |
| src/admin/masters/warehouse-master/components/sections/HierarchyTemplateSection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/InventoryControlSection.tsx | import cleanup | remove unused style imports and React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/LocationDefaultsSection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/OwnershipSection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/PickingPolicySection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/PutawayPolicySection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/components/sections/StockGovernanceSection.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/pages/WarehouseAuditPage.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/pages/WarehouseConfigurationPage.tsx | cleanup | remove unused variable/prop and unused helper | Yes |
| src/admin/masters/warehouse-master/pages/WarehouseCreateWorkspace.tsx | request shape fix + cleanup | add action to activation request; remove unused symbols | Yes |
| src/admin/masters/warehouse-master/pages/WarehouseImportPage.tsx | import cleanup | remove unused React default import | Yes |
| src/admin/masters/warehouse-master/pages/WarehouseLocationsPage.tsx | type fix | enforce WarehouseStatus type in filter function | Yes |
| src/admin/masters/warehouse-master/services/warehouseService.ts | import cleanup | remove unused Warehouse type import | Yes |
| src/admin/masters/warehouse-master/utils/policyWorkbench.ts | type fix | enforce typed fallback strategies | Yes |
| src/admin/masters/warehouse-master/utils/rulePrecedence.ts | cleanup | remove unused import and unused destructured vars | Yes |
| src/admin/masters/warehouse-master/validation/hierarchyValidation.ts | import cleanup | remove unused UpdateHierarchyTemplateInput import | Yes |
| src/admin/masters/area-master/services/areaService.ts | cleanup | remove unused placeholder locals | No |
| src/admin/masters/engine-config/service-registry/pages/ServiceRegistryList.tsx | cleanup | remove unused toast helper/state | No |
| src/admin/masters/product-master/pages/ProductFormPage.tsx | type fix + cleanup | remove unused imports/types; safe field error key deletion | No |
| src/admin/masters/product-master/pages/ProductListPage.tsx | prop/type fix | align SmartPreviewDrawer props with API | No |
| src/admin/masters/service-type-master/pages/ServiceTypeFormPage.tsx | type fix | align operator value typing and import OperatorType | No |
| src/admin/masters/service-type-master/pages/ServiceTypeListPage.tsx | literal fix | use valid SmartPreviewDrawer action tone | No |
| src/admin/masters/uom-master/pages/UomListPage.tsx | literal fix | align statusTone union to drawer types | No |
| src/pages/sale-order-v2/CreateSaleOrderV2.tsx | cleanup + type fix | remove unused import; source approvalCaseId from workflow instance | No |
| src/routes/createRoutes.tsx | nullability fix | align helper argument null/undefined expectations | No |
| docs/warehouse-master/phase-1-5-typecheck-errors-before.txt | artifact | baseline error capture file | N/A |
| docs/warehouse-master/phase-1-5-typecheck-errors-after.txt | artifact | post-fix error capture file | N/A |

## 5. Warehouse Master Fixes
- DTO/request shape fixes:
  - Added required action: 'Activate' in WarehouseCreateWorkspace activateWarehouse request.
- section prop fixes:
  - Corrected section health usage in WarehousePreviewDrawer from key/completedCount/totalCount to section/completedFields/totalFields.
- utility type fixes:
  - policyWorkbench fallback strategy arrays are now typed as PutawayStrategy[] and PickingStrategy[].
- validation type fixes:
  - Removed unused validation DTO import in hierarchyValidation.
- enum/literal fixes:
  - Enforced WarehouseStatus parameter in location filtering.
- unused import/variable cleanup:
  - Removed unused React/default imports and dead locals across warehouse section/page/component files.

## 6. Non-Warehouse Fixes
- Minimal compile-safe fixes only:
  - Removed unused placeholders/imports in area/service-registry/product/sale-order files.
  - Fixed ProductList SmartPreviewDrawer prop contract.
  - Fixed ServiceType/UOM tone and operator type unions.
  - Fixed route document lookup nullability mismatches in createRoutes.

## 7. Typecheck Result
- Command:
  - npx tsc -b --pretty false
- Result:
  - Pass
- Snapshot file:
  - docs/warehouse-master/phase-1-5-typecheck-errors-after.txt

## 8. Test Result
- Command:
  - npm run test -- src/admin/masters/warehouse-master/tests/Phase1HierarchyDomainUpgrade.test.ts src/admin/masters/warehouse-master/tests/warehouseDomain.test.ts src/admin/masters/warehouse-master/tests/HierarchyCreationFlow.test.ts
- Result:
  - Pass
- Totals:
  - 3 test files passed
  - 96 tests passed
  - 0 failed

## 9. Preserved Phase 1 Guarantees
- branch-level warehouse has one owning branch only: preserved.
- generic hierarchy level capabilities still exist: preserved.
- full location identifier derivation still works: preserved.
- arbitrary level names remain supported: preserved.
- capacity applicability remains level-driven: preserved.
- item eligibility applicability remains level-driven: preserved.
- responsibility applicability remains level-driven: preserved.

## 10. Readiness for Phase 2
- Ready for Phase 2

## 11. Remaining Risks
- Workspace had pre-existing dirty changes in multiple warehouse files before this phase; Phase 1.5 touched only compile blockers and did not normalize broader UX behavior.
- Future feature work should continue to validate with full tsc -b and targeted warehouse tests after each batch.
