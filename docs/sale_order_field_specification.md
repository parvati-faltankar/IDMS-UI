# Sales Order Field Specification

## 1. Overview
This document specifies fields currently implemented in the Sales Order create/edit UI from:
- `src/pages/sale-order/CreateSaleOrder.tsx`
- `src/pages/sale-order/saleOrderData.ts`

It covers header/meta fields, tab/section fields, line-item fields, calculated/derived values, validations, conditional behavior, dropdown/lookup sources, and save/submit behavior.

If any detail is not explicitly defined in code, it is marked as **Not specified in current UI/code**.

## 2. Field Classification
- Header/System fields
- Customer lookup & customer details card fields
- Tab/section form fields
- Product line grid fields
- Calculated summary fields
- Hidden/not-rendered fields present in form model

## 3. Header-Level Fields
| Field Level | Tab Name | Section Name | Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default Value | Placeholder | Tooltip | Validation Rule | Validation Message | Conditional Display Logic | Conditional Enable/Disable Logic | Dependency | Allowed Values | Format | Source of Data | Save/Submit Behavior | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| System | Global header | Title area | Sale Order Status badge | `status` | Enum | Badge (read-only display) | Not specified in current UI/code | Read-only in visible UI | `Draft` for new document | NA | NA | Not specified in current UI/code | Not specified in current UI/code | Always visible | NA | `formData.status` | `Draft`, `Pending Approval`, `Approved`, `Rejected`, `Cancelled` | Text enum | Default/init from mapped document | Saved with form state only | No direct edit control in current screen |
| System | Global header | Metadata | Document Number | `number` | Text | Read-only text display | Not specified in current UI/code | Read-only in visible UI | `SO-2026-00021` for new | NA | NA | Not specified in current UI/code | Not specified in current UI/code | Always visible | NA | `formData.number` | Free text in model | Pattern not validated in UI | Generated default or mapped from document | Included in success summary | No editable input shown |
| System | Global header | Metadata | Document Date | `documentDate` | Date (YYYY-MM-DD in state) | Read-only formatted text display | Not specified in current UI/code | Read-only in visible UI | `new Date().toISOString().slice(0,10)` for new | NA | NA | Not specified in current UI/code | Not specified in current UI/code | Always visible | NA | `formData.documentDate` | Date string | Display format uses `formatDate()` | Generated default or mapped from document | Included in header display | No editable input shown |
| Summary | Bottom sticky bar | Amount summary | Total amount | Derived from lines | Number | Read-only summary text | Auto | Read-only | Calculated | NA | NA | Derived calculation only | NA | Always visible | NA | `lines[]` | NA | Currency formatted (2 decimals, Indian grouping) | Calculated | Display-only | Uses gross amount formula |
| Summary | Bottom sticky bar | Amount summary | Net order amount | Derived from lines | Number | Read-only summary text + drawer trigger | Auto | Read-only | Calculated | NA | NA | Derived calculation only | NA | Always visible | NA | `lines[]` | NA | Currency formatted | Calculated | Display-only | Uses taxable+tax per line |
| Summary | Bottom sticky bar | Amount summary | Discount badge | Derived from lines | Number | Read-only badge | Auto | Read-only | Hidden when 0 | NA | NA | Shown only if > 0 | NA | Displayed if `totalDiscountAmount > 0` | NA | `lines[]` | NA | Currency formatted | Calculated | Display-only | Conditional visibility |

## 4. Line-Level Fields
| Field Level | Tab Name | Section Name | Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default Value | Placeholder | Validation Rule | Validation Message | Conditional Display Logic | Dependency | Allowed Values | Min/Max / Format | Calculation Logic | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Line | Product detail | Product grid | Product Code | `lines[].productCode` | Text | Dropdown | Required for line completion | Editable | `''` | Select product | Required for add-next-line rule | Not specified in current UI/code | Always visible | Product lookup list | `SP-1001`…`SP-1004` | Code text | Drives product autofill | User select |
| Line | Product detail | Product grid | Product Name | `lines[].productName` | Text | Text input (read-only) | Auto | Read-only | `''` | NA | NA | NA | Always visible | Product Code | From lookup | Text | Filled from selected product | Derived from lookup |
| Line | Product detail | Product grid | HSN/SAC | `lines[].hsnSac` | Text | Text input (read-only) | Auto | Read-only | `''` | NA | NA | NA | Always visible | Product Code | From lookup | Text | Filled from selected product | Derived from lookup |
| Line | Product detail | Product grid | UOM | `lines[].uom` | Text | Dropdown | Not specified in current UI/code | Editable | `''` | Select UOM | Not specified in current UI/code | Not specified in current UI/code | Always visible | Product Code | UOMs of selected product | Text | Defaults to first UOM on product select | User select / derived default |
| Line | Product detail | Product grid | Requested Date | `lines[].requestedDate` | Date | Date input | Not specified in current UI/code | Editable | `''` | Browser default | Not specified | Not specified | Always visible | None | Any date | Date format from browser input | NA | User input |
| Line | Product detail | Product grid | Fulfillment Date | `lines[].fulfillmentDate` | Date | Date input | Not specified in current UI/code | Editable | `''` | Browser default | Not specified | Not specified | Always visible | None | Any date | Date format from browser input | NA | User input |
| Line | Product detail | Product grid | Priority | `lines[].priority` | Enum | Dropdown | Not specified in current UI/code | Editable | `''` | Select priority | Not specified | Not specified | Always visible | None | `Low`, `Medium`, `High` | Enum text | NA | User select |
| Line | Product detail | Product grid | Rate | `lines[].rate` | Numeric text | Text input | Required for line completion | Editable | `''` (or from product) | NA | Required for add-next-line rule | Not specified in current UI/code | Always visible | None | Free numeric text | Numeric parsing via `parseFloat` | `baseAmount = rate * qty` | User input / product default |
| Line | Product detail | Product grid | Order Qty | `lines[].orderQuantity` | Numeric text | Text input | Required for line completion | Editable | `''` | NA | Required for add-next-line rule | Not specified in current UI/code | Always visible | None | Free numeric text | Numeric parsing via `parseFloat` | Used in all amount calcs | User input |
| Line | Product detail | Product grid | Converted Qty | `lines[].convertedQuantity` | Numeric text | Text input (read-only) | Auto | Read-only | `0.00` | NA | NA | NA | Always visible | None | Numeric text | 2-decimal display | Used for pending qty | Default/mapped data |
| Line | Product detail | Product grid | Pending Qty | Derived | Number | Text input (read-only) | Auto | Read-only | Calculated | NA | NA | NA | Always visible | `orderQuantity`, `convertedQuantity` | NA | 2 decimals | `max(orderQty - convertedQty, 0)` | Calculated |
| Line | Product detail | Product grid | Base Amount | Derived | Number | Text input (read-only) | Auto | Read-only | Calculated | NA | NA | NA | Always visible | `rate`, `orderQuantity` | NA | 2 decimals | `rate * orderQty` | Calculated |
| Line | Product detail | Product grid | Discount % | `lines[].discountPercent` | Numeric text | Text input | Optional | Editable | `''` | NA | Not specified | Not specified | Always visible | None | Free numeric text | Parsed as percentage | Used if discount amount is not > 0 | User input |
| Line | Product detail | Product grid | Discount Amount | `lines[].discountAmount` | Numeric text | Text input | Optional | Editable | `''` | NA | Not specified | Not specified | Always visible | None | Free numeric text | Parsed as decimal | Overrides discount% when > 0 | User input |
| Line | Product detail | Product grid | Taxable Amount | Derived | Number | Text input (read-only) | Auto | Read-only | Calculated | NA | NA | NA | Always visible | Base Amount, Discount fields | NA | 2 decimals | `max(base - discount, 0)` | Calculated |
| Line | Product detail | Product grid | Taxation Column | Derived | Text | Text input (read-only) | Auto | Read-only | From product | NA | NA | NA | Always visible | Product Code | Product tax label (`GST 18%`) | Text | Lookup projection | Derived from lookup |
| Line | Product detail | Product grid | Total Amount | Derived | Number | Text input (read-only) | Auto | Read-only | Calculated | NA | NA | NA | Always visible | Taxable amount, product taxRate | NA | 2 decimals | `taxable + taxable * taxRate/100` | Calculated |
| Line | Product detail | Product grid | Remark | `lines[].remark` | Text | Text input | Optional | Editable | `''` | NA | Not specified | Not specified | Always visible | None | Free text | Not specified in current UI/code | NA | User input |
| Line | Product detail | Product grid | Delete line action | `lines[]` row action | Action | Icon button | Optional | Editable | NA | NA | None | None | Always visible | Row exists | NA | NA | Removes row from state | User action |

## 5. Tab-Wise Field Specification

### 5.1 Customer & Order Tab
#### Section: Customer Search and Selection
| Field Level | Tab Name | Section Name | Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default Value | Placeholder | Tooltip | Validation Rule | Validation Message | Conditional Display Logic | Conditional Enable/Disable Logic | Dependency on Other Fields | Allowed Values / Options | Min/Max | Format | Calculation Logic | Source of Data | Save/Submit Behavior | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Header | Customer & Order | Customer picker | Customer search input | UI-only `customerSearch` | Text | Search input | Optional | Editable | `''` | `Search customer by code, name, primary number, etc...` when no selected customer | Not specified in current UI/code | No blocking validation | Not specified in current UI/code | Always visible | NA | Selected customer state | Customer options dataset | Not specified | Text | Filters result list by code/name/email/mobile/GSTIN | In-memory list (`customerOptions`) | Selection updates `formData.customer` | Not directly persisted as model field |
| Header | Customer & Order | Customer picker | Selected Customer | `formData.customer` | Text | Chip + lookup selection | Optional in current UI enforcement | Editable via lookup | `''` | NA | Not specified in current UI/code | No required check in save flow | Not specified in current UI/code | Always visible (chip only when selected) | Clear button shown when selected | Customer selection | Values from lookup | Not specified | Text | NA | User select from lookup | Saved in form state | Customer details card appears when selected |

#### Section: Customer Details Card (Read-only from lookup)
| Field Name | Internal Key | Data Type | Editable | Source |
|---|---|---|---|---|
| Customer Code | `selectedCustomer.code` | Text | Read-only | Lookup dataset |
| Customer Name | `selectedCustomer.label` | Text | Read-only | Lookup dataset |
| Primary Mobile Number | `selectedCustomer.mobileNumber` | Text | Read-only | Lookup dataset |
| Primary Verified Badge | `selectedCustomer.isPrimaryVerified` | Boolean | Read-only | Lookup dataset |
| Secondary Number | `selectedCustomer.secondaryNumber` | Text | Read-only | Lookup dataset |
| Email | `selectedCustomer.email` | Text | Read-only | Lookup dataset |
| Customer Type | `selectedCustomer.customerType` | Text | Read-only | Lookup dataset |
| GSTIN | `selectedCustomer.gstin` | Text | Read-only | Lookup dataset |
| Address | `selectedCustomer.address` | Text | Read-only | Lookup dataset |

#### Section: Order Details
| Field Level | Tab | Section | Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Validation | Validation Message | Options / Allowed Values | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Header | Customer & Order | Order Details | Order Source | `orderSource` | Enum | Dropdown | Optional in current UI enforcement | Editable | `''` | Select order source | Not specified in current UI/code | Not specified in current UI/code | Dealer Portal, Field Sales, Marketplace, Walk-in | Source options hardcoded |
| Header | Customer & Order | Order Details | Sales Executive | `salesExecutive` | Enum | Dropdown | Optional in current UI enforcement | Editable | `''` | Select sales executive | Not specified | Not specified | Aarav Sharma, Neha Kapoor, Rohit Mehta, Ishita Jain | Hardcoded list |
| Header | Customer & Order | Order Details | Requested Delivery Date | `requestedDeliveryDate` | Date | Date input | Optional in current UI enforcement | Editable | `''` | Browser default | Not specified | Not specified | Any browser-valid date | |
| Header | Customer & Order | Order Details | Valid Till Date | `validTillDate` | Date | Date input | Optional in current UI enforcement | Editable | `''` | Browser default | Not specified | Not specified | Any browser-valid date | |
| Header | Customer & Order | Order Details | Place of Supply | `placeOfSupply` | Enum | Dropdown | **Marked required in UI** | Editable | `''` | Select place of supply | Required indicator only; no submit block | Not specified in current UI/code | Maharashtra, Delhi, Karnataka, Tamil Nadu | UI required marker present |
| Header | Customer & Order | Order Details | Promised Delivery Date | `promisedDeliveryDate` | Date | Date input | Optional | Editable | `''` | Browser default | Not specified | Not specified | Any date | |
| Header | Customer & Order | Order Details | Priority | `priority` | Enum | Dropdown | Optional | Editable | `''` | Select priority | Not specified | Not specified | Low, Medium, High | |

### 5.2 Product detail Tab
Fields are documented in **Section 4 (Line-Level Fields)**.  
Additional behavior:
- Add line button enabled only when last line has non-empty `productCode`, `rate`, and `orderQuantity`.
- `Tab` key on last cell (`Remark`) can auto-add line when the current line is complete.

### 5.3 Payment and Finance Tab
#### Section: Payment Detail
| Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Options | Conditional Logic | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Payment Mode | `paymentMode` | Enum (`''`,`Cash`,`Finance`) | Dropdown | Optional in current UI enforcement | Editable | `''` | Select payment mode | Cash, Finance | None in UI; does not conditionally hide/show sections | `Credit` from existing docs is normalized to `Finance` |
| Payment Method | `paymentMethod` | Enum/Text | Dropdown | Optional | Editable | `''` | Select payment method | Bank Transfer, UPI, Cheque | None | |
| Payment Term | `paymentTerm` | Enum/Text | Dropdown | Optional | Editable | `''` | Select payment term | Immediate, Net 15, Net 30 | None | |
| Advance Payment | `advancePayment` | Numeric text | Input | Optional | Editable | `''` | `0.00` | Free text | None | No numeric validation enforced |
| Payment Remarks | `paymentRemarks` | Text | Input | Optional | Editable | `''` | Enter payment remarks | Free text | None | Single-line input control |

#### Section: Finance Details
| Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Options | Calculation / Dependency | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Financier | `financer` | Enum/Text | Dropdown | Optional | Editable | `''` | Select financer | Axis/HDFC/Mahindra Finance | None | |
| Down Payment | `downPayment` | Numeric text | Input | Optional | Editable | `''` | `0.00` | Free text | None | |
| Finance Amount | `financeAmount` | Numeric text | Input | Optional | Editable | `''` | `0.00` | Free text | None | |
| EMI amount | `emiAmount` | Numeric text | Input | Optional | Editable | `''` | `0.00` | Free text | None | |
| EMI Interest Rate | `emiInterestRate` | Numeric text | Input | Optional | Editable | `''` | `0.00` | Free text | None | |
| Balance Amount | `balanceAmount` | Numeric text | Input | Optional | Editable | `''` (or derived on load from document) | `0.00` | Free text | On mapped edit data: initialized as `max(financeAmount-downPayment,0)` | Not auto-recomputed on user edits in current code |
| Tenure | `tenure` | Enum/Text | Dropdown | Optional | Editable | `''` | Select tenure | 3/6/9/12/18/24/36 Months | None | |

#### Section: Insurance Details
| Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Options | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Insurance Provider | `insuranceProvider` | Enum/Text | Dropdown | Optional | Editable | `''` | Select insurance provider | ICICI Lombard, HDFC ERGO, Tata AIG, Bajaj Allianz | |
| Policy Number | `policyNumber` | Text | Input | Optional | Editable | `''` | Enter policy number | Free text | |

### 5.4 Delivery and Shipping Tab
#### Section: Delivery Detail
| Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Options |
|---|---|---|---|---|---|---|---|---|
| Delivery Term | `deliveryTerm` | Enum/Text | Dropdown | Optional | Editable | `''` | Select delivery term | Door Delivery, Branch Delivery, Pickup |
| Delivery Type | `deliveryType` | Enum/Text | Dropdown | Optional | Editable | `''` | Select delivery type | Standard, Express |
| Delivery Slot | `deliverySlot` | Enum/Text | Dropdown | Optional | Editable | `''` | Select delivery slot | Morning, Afternoon, Evening |
| Delivery Address | `deliveryAddress` | Enum/Text | Dropdown | Optional | Editable | `''` | Select address | Galaxy Motors/Pune, Velocity/Delhi, Prime Wheels/Bengaluru |
| Delivery Instruction | `deliveryInstruction` | Text | Input | Optional | Editable | `''` | Enter delivery instruction | Free text |

#### Section: Shipping Detail
| Field Name | Internal Key | Data Type | Control Type | Mandatory | Editable | Default | Placeholder | Options |
|---|---|---|---|---|---|---|---|---|
| Shipping Address | `shippingAddress` | Enum/Text | Dropdown | Optional | Editable | `''` | Select address | Same address options as delivery |
| Shipping Term | `shippingTerm` | Enum/Text | Dropdown | Optional | Editable | `''` | Select shipping term | FOB, Ex Works, CIF |
| Shipping Method | `shippingMethod` | Enum/Text | Dropdown | Optional | Editable | `''` | Select shipping method | Road Transport, Courier, Pickup |
| Shipping Instructions | `shippingInstructions` | Text | Input | Optional | Editable | `''` | Enter shipping instructions | Free text |

## 6. Validation Rules
| Field Name | Field Level | Validation Rule | Validation Message | Trigger Point |
|---|---|---|---|---|
| Product Code | Line | Required for line completeness when adding next line | Not specified in current UI/code | `Add line` click / tab flow on last cell |
| Rate | Line | Required for line completeness when adding next line | Not specified in current UI/code | `Add line` click / tab flow on last cell |
| Order Qty | Line | Required for line completeness when adding next line | Not specified in current UI/code | `Add line` click / tab flow on last cell |
| Place of Supply | Header | Marked `required` in label only | Not specified in current UI/code | Visual marker only |
| All other fields | All | Not specified in current UI/code | Not specified in current UI/code | Not specified in current UI/code |

## 7. Conditional Logic
| Field Name | Condition | Behavior | Dependent Field | Notes |
|---|---|---|---|---|
| Customer details card | `selectedCustomer != null` | Card is shown/hidden | `formData.customer` | Read-only lookup card |
| Customer chip in search box | `formData.customer` present | Chip shown with remove action | `formData.customer` | Clearing chip resets selected customer |
| Customer result popup | `isCustomerResultsOpen && matchingCustomers.length > 0` | List displayed | `customerSearch`, focus/blur | Filtered list from local dataset |
| Discount badge in bottom summary | `totalDiscountAmount > 0` | Badge shown | Line discount values | Hidden when 0 |
| Add line action | Last line complete (`productCode`,`rate`,`orderQuantity`) | Allows adding next line | Current last row values | Uses `hasRequiredGridValues` |
| Tab key add-line behavior | Last cell + complete line | Auto-add line | Row completion state | Via `handleGridLastCellTab` |
| Quick links menu | `isQuickLinkMenuOpen` | Menu visible | Quick link button | Closed by outside click/Esc |

## 8. Calculated Fields
| Field Name | Formula / Calculation Logic | Trigger | Editable or Read-only | Notes |
|---|---|---|---|---|
| Base Amount (line) | `rate * orderQuantity` | On line value change | Read-only | Parsed via `parseFloat` with fallback 0 |
| Discount Amount effective (line) | `discountAmount` if > 0 else `(baseAmount * discountPercent / 100)` | On line value change | Read-only result | Manual discount overrides percentage |
| Taxable Amount (line) | `max(baseAmount - discountAmountEffective, 0)` | On line value change | Read-only | |
| Line Total Amount | `taxableAmount + taxableAmount * taxRate/100` | On line/product change | Read-only | Tax rate from product lookup |
| Pending Qty | `max(orderQuantity - convertedQuantity, 0)` | On line qty changes | Read-only | |
| Total Amount (net) | `sum(lineAmount)` | On any line change | Read-only | Bottom summary + drawer |
| Gross Order Amount | `sum(baseAmount + baseAmount*taxRate/100)` | On line change | Read-only | Bottom summary |
| Total Discount Amount | `sum(discountAmountEffective)` | On line change | Read-only | |
| Total Taxable Amount | `sum(taxableAmount)` | On line change | Read-only | |
| Total Tax Amount | `max(totalAmount - totalTaxableAmount, 0)` | On line change | Read-only | |
| Total Line Count | Count of lines with productCode | On line change | Read-only | Used in success dialog |
| Balance Amount (initial edit mapping only) | `max(financeAmount - downPayment, 0)` | On edit-document load mapping | Editable afterwards | Not auto-updated after user edit |

## 9. Dropdown / Lookup Values
| Field Name | Source | Allowed Values | Default Value | Notes |
|---|---|---|---|---|
| Customer | `customerOptions` (local constant) | 4 customer records with code/name/email/mobile/gstin | `''` | Searchable lookup |
| Order Source | Local constant | Dealer Portal, Field Sales, Marketplace, Walk-in | `''` | |
| Sales Executive | Local constant | Aarav Sharma, Neha Kapoor, Rohit Mehta, Ishita Jain | `''` | |
| Place of Supply | Local constant | Maharashtra, Delhi, Karnataka, Tamil Nadu | `''` | |
| Priority (header/line) | Local constant | Low, Medium, High | `''` | Shared options |
| Payment Mode | Local constant | Cash, Finance | `''` | `Credit` maps to `Finance` when loading existing record |
| Payment Method | Local constant | Bank Transfer, UPI, Cheque | `''` | |
| Payment Term | Local constant | Immediate, Net 15, Net 30 | `''` | |
| Financier | Local constant | Axis Finance, HDFC Finance, Mahindra Finance | `''` | |
| Tenure | Local constant | 3/6/9/12/18/24/36 Months | `''` | |
| Insurance Provider | Local constant | ICICI Lombard, HDFC ERGO, Tata AIG, Bajaj Allianz | `''` | |
| Delivery Term | Local constant | Door Delivery, Branch Delivery, Pickup | `''` | |
| Delivery Type | Local constant | Standard, Express | `''` | |
| Delivery Slot | Local constant | Morning, Afternoon, Evening | `''` | |
| Delivery/Shipping Address | Local constant | 3 preset addresses | `''` | Shared set |
| Shipping Term | Local constant | FOB, Ex Works, CIF | `''` | |
| Shipping Method | Local constant | Road Transport, Courier, Pickup | `''` | |
| Product Code | `productLookupOptions` (local constant) | SP-1001 to SP-1004 | `''` | Select drives line autofill |
| UOM | Product-specific `uoms` array | Based on selected product | First UOM on product selection | Dependent dropdown |

## 10. Save, Submit, and Error Handling
- **Save action**: Clicking `Save` opens `SuccessSummaryDialog` (`isSaveSuccessDialogOpen = true`).
- **No API save call is present in current UI/code** for Sales Order create/edit.
- **Discard action**: Opens confirmation dialog. Confirm navigates to Sale Order list.
- **Success dialog actions**:
  - Go to homepage/list
  - Print summary (`window.print()`)
  - Share summary (`navigator.share` if available; fallback clipboard copy)
- **Validation failure blocking save**: Not specified in current UI/code (no central blocking validation before showing success dialog).
- **API failure handling**: Not specified in current UI/code.

## 11. Assumptions and Gaps
1. Many fields are present in `SaleOrderFormData` but not rendered in UI:
   - `exchangeCategory`, `exchangeProductCode`, `exchangeProductName`, `exchangeBrand`, `exchangeModel`, `exchangeVariant`, `exchangeSerialNumber`, `exchangeCondition`, `exchangeQuantity`, `exchangeInspectionDate`, `exchangeAssessedBy`, `exchangeExpectedValue`, `exchangeApprovedValue`, `exchangePickupLocation`, `exchangePickupDate`, `exchangeSettlementMode`, `exchangeReferenceNotes`, `exchangeRemarks`.
   - These are treated as **hidden/not-rendered fields** in current UI.
2. Field-level validation messages are generally not implemented; required markers are mostly visual.
3. Tooltip/help text for Sales Order fields is largely **Not specified in current UI/code**.
4. Internal field keys are mapped from `SaleOrderFormData` and `SaleOrderLineForm`; API names are **Not specified in current UI/code**.
5. Save/submit persistence behavior is mock/UI-only in current implementation.
6. No explicit min/max lengths, numeric ranges, or regex constraints are defined for most inputs.

