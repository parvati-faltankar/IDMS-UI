# Final Product Master Field Structure

*Updated field structure after review comments*

Design basis: Product Type is kept in Product Definition, Product Authenticity is separate, Product Scope & Applicability is retained, UOM conversion is read-only from UOM Conversion Master, Packaging includes purchase/sales set quantity, Compliance & Regulatory is handled through vertical-specific attributes/extensions, and Governance & Audit is excluded.

## Section Index

| # | Section | Purpose |
| --- | --- | --- |
| 1 | Product Definition | Basic identity, operational product type, authenticity, brand, manufacturer, and country origin/assembly. |
| 2 | Product Classification | Business grouping of the product: Product Class -> Product Category -> Product Sub-category. |
| 3 | Product Hierarchy | Catalog-to-SKU structure: Product Catalog -> Product Family -> Product Line/Series -> Model/Base Product -> Variant/Configuration -> SKU. |
| 4 | Product Scope & Applicability | Defines where the product is globally or locally applicable and whether it is active for that scope. Recommended as a grid/matrix because one product can be active for multiple organizations, branches, warehouses, or channels. |
| 5 | Unit of Measurement | Base UOM, applicable UOMs, and read-only conversion reference. Conversion logic is maintained in the UOM Conversion Master; Product Master displays Conversion to Base UOM as read-only. |
| 6 | Packaging | Commercial packaging details. Includes purchase and sales set quantity where packaging differs by business context. Does not duplicate UOM conversion. |
| 7 | Product Dimensions | Physical weight, size, and volume details. |
| 8 | Inventory Configuration | Stock, tracking, storage, inspection, shelf-life, and consumption behavior. |
| 9 | Sales Configuration | Sales eligibility and sales-specific behavior. |
| 10 | Purchase Configuration | Purchase eligibility and purchase-specific behavior. |
| 11 | Service & Warranty Configuration | Serviceability and warranty applicability. |
| 12 | Product Identifiers | Controlled identifier attributes such as GTIN, HS Code, HSN, OEM Part Number, and manufacturer references. Identifiers should not be repeated in Inventory, Sales, Purchase, or compliance attributes. |
| 13 | Product Associations | Product-to-product relationships such as alternate products and kit/bundle components. Replacement/supersession can be introduced later if active old-to-new lifecycle redirection is required. |
| 14 | Status & Availability | Product usability status, validity, and discontinuation. Lifecycle stage is excluded for DMS MVP because product transaction eligibility is controlled through Product Status and operational indicators. |

## 1. Product Definition

Basic identity, operational product type, authenticity, brand, manufacturer, and country origin/assembly.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Product Code | Core | SKU / Product record | Unique internal product identity used across transactions and reporting. | PRD-PAINT-RA-20L-101 | Must be unique and should not change after transactions exist. |
| Product Name | Core | SKU / Model | Business-readable product name used for search, selection, and documents. | Royale Aspira 20L Shade 101 | Should follow naming convention and include meaningful variant details. |
| Product Description | Core | SKU / Model | Detailed product explanation. | Premium interior emulsion paint, Shade 101, 20L drum | Avoid vague or duplicate descriptions. |
| Product Type | Core | Product / SKU | Defines operational nature of product. | Finished Good / Raw Material / Spare Part / Service / Consumable / Kit | Should drive operational behavior such as stockable, sellable, purchasable, or serviceable. |
| Product Authenticity | Conditional / Recommended | Product / SKU | Defines whether the product is genuine, aftermarket, refurbished, counterfeit, etc. | Genuine / OEM | Recommended especially for spare parts, accessories, refurbished goods, aftermarket products, and service items. |
| Brand / Make | Core | Model / SKU | Commercial brand or make of the product. | Asian Paints | Prefer controlled master/picklist. |
| Manufacturer / OEM | Conditional | Model / SKU | Actual manufacturer or OEM. | Asian Paints Ltd. | Required where OEM, warranty, authenticity, or compliance control applies. |
| Country of Origin | Conditional | Product / SKU | Country where product originates or is manufactured. | India | Useful for trade, compliance, procurement, and origin declaration. |
| Country of Assembly | Conditional | Product / SKU | Country where product is assembled. | India | Useful for assembled products, machinery, vehicles, and trade declarations. |

## 2. Product Classification

Business grouping of the product: Product Category -> Product Sub-category.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Product Category | Core | Classification | Main business category. | Interior Wall Paint | Must belong to selected Product Class. |
| Product Sub-category | Core | Classification | Specific business grouping under category. | Interior Emulsion | Must belong to selected Product Category. |

## 3. Product Hierarchy

Catalog-to-SKU structure: Brand -> Product Family -> Product Line/Series -> Model/Base Product -> Variant/Configuration -> SKU.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Brand | Core | Hierarchy Level 1 | Top-level product universe. | Paints | Should not duplicate Product Class blindly; purpose is catalog structure. |
| Product Family | Core | Hierarchy Level 2 | Major family under catalog. | Decorative Paint Family | Used for product grouping, reporting, and navigation. |
| Product Line / Series | Core | Hierarchy Level 3 | Commercial product line or series. | Royale Series | Useful for commercial product-line management. |
| Model / Base Product | Core | Hierarchy Level 4 | Base product before variant/SKU. | Royale Aspira | Should not be directly used for transactions if SKU exists. |
| Variant / Configuration | Conditional | Hierarchy Level 5 | Specific variant or configuration. | 20L Pack / Shade 101 / Matte Finish | Required where product varies by pack, shade, size, color, configuration, etc. |
| SKU / Trade Item | Core | Hierarchy Leaf | Final sellable, purchasable, or stockable item. | Royale Aspira 20L Shade 101 | Transaction-level product. |

## 4. Product Scope & Applicability

Defines where the product is globally or locally applicable and whether it is active for that scope. Recommended as a grid/matrix because one product can be active for multiple organizations, branches, warehouses, or channels.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Scope Type | Core | Scope Matrix | Defines whether scope is global or local. | Global / Local | A product may have one global definition and multiple local scope rows. |
| Scope Dimension | Core | Scope Matrix | Defines the applicability dimension. | Organization | Use controlled values to avoid inconsistent local activation setup. |
| Scope Value | Core | Scope Matrix | Actual applicable entity or market. | Organization Name | Must be valid for selected Scope Dimension. |
| Scope Activation Status | Core | Scope Matrix | Defines whether product is active for that scope. | Active / Inactive / Blocked | Should control product availability for that scope only. |
| Scope Effective From Date | Conditional | Scope Matrix | Local/global activation start date. | 01-Apr-2026 | Should not allow usage before effective date if enforced. |
| Scope Effective To Date | Conditional | Scope Matrix | Local/global activation end date. | - | Should not affect historical transactions. |

## 5. Unit of Measurement

Base UOM, applicable UOMs, and read-only conversion reference. Conversion logic is maintained in the UOM Conversion Master; Product Master displays Conversion to Base UOM as read-only.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Base UOM | Core | Header | Primary anchor UOM for the product. | Litre | Mandatory. Base UOM must be included in Applicable UOM grid. |
| Applicable UOM | Core | Applicable UOM Grid | Allowed UOM for the product. | Litre / 1L Can / 4L Can / 20L Drum | Each applicable UOM must have conversion reference and rounding rule. Transaction UOM must be selected from applicable UOMs. |
| Conversion Reference | Core | Applicable UOM Grid | Reference selected from UOM Conversion Master. | CONV-DRUM20-LTR | Conversion logic is maintained outside UOM master |
| Conversion to Base UOM | Core | Applicable UOM Grid - Read-only | Read-only display fetched from UOM Conversion Master. | 1 Drum = 20 Litres | Must not be editable in Product Master. |

## 6. Packaging

Commercial packaging details. Includes purchase and sales set quantity where packaging differs by business context. Does not duplicate UOM conversion.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Pack Type | Conditional | SKU / Packaging row | Defines the physical or commercial packaging format of the product. | Box / Carton / Drum / Can / Bottle / Crate / Pallet / Loose / Set | Mandatory if packaging details are applicable. Should be selected from Pack Type LOV. |
| Pack Size | Conditional | SKU / Packaging row | Defines the commercial pack size or pack capacity. | 1L / 4L / 20L / Box of 10 / Set of 4 / Carton of 12 | Mandatory where product is packed, sold, or purchased in a defined pack. Should not be used for UOM conversion calculation directly. |
| Pack Material | Conditional | SKU / Packaging row | Captures the material used for packaging, useful for handling, compliance, storage, return, and disposal. | Plastic / Metal / Cardboard / Wooden / Glass / Composite | More relevant for paints, oils, chemicals, fragile goods, heavy equipment, export packaging, and returnable packaging. |
| Packaging Description | Conditional | SKU / Packaging row | Provides user-friendly packaging details for business users. | 20L sealed metal drum / Supplier box containing 10 spark plugs | Optional but recommended. Should be descriptive, not used for calculation. |
| Purchase Set Quantity | Conditional | SKU / Packaging row | Defines how many base units or saleable units are included in the purchase pack/set received from supplier. | 10 spark plugs per box / 12 oil bottles per carton / 20L per drum | Mandatory if product is purchased in pack/set quantity different from base unit. Must be greater than 0. Should align with Applicable UOM conversion where transaction UOM is used. |
| Sales Set Quantity | Conditional / Optional | SKU / Packaging row | Defines how many units are sold together as one sales set/pack. | Set of 4 tyres / Pair of brake pads / Pack of 2 wipers | Optional. Required only if product is sold as a defined set/pack. Must be greater than 0 when entered. |
| Organization Type | Conditional | Scope-aware packaging | Defines for which organization/business context the packaging setup is applicable. | OEM / Distributor / Dealer / Retailer / Warehouse / Service Center / Export Unit | Required if packaging differs by organization type. Should be selected from Organization Type LOV. |

## 7. Product Dimensions

Physical weight, size, and volume details.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Net Weight | Conditional | SKU | Product weight excluding packaging. | 24.5 kg | Required for freight/logistics where relevant. |
| Gross Weight | Conditional | SKU | Product weight including packaging. | 25.8 kg | Should not be less than Net Weight. |
| Length | Conditional | SKU | Product length. | 320 mm | Dimension UOM should be consistent. |
| Width | Conditional | SKU | Product width. | 320 mm | Dimension UOM should be consistent. |
| Height | Conditional | SKU | Product height. | 390 mm | Dimension UOM should be consistent. |
| Volume | Conditional | SKU | Cubic space occupied by product. | 0.040 m3 | May be derived or manually maintained. |

## 8. Inventory Configuration

Stock, tracking, storage, inspection, shelf-life, and consumption behavior.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Stockable Indicator | Core | SKU | Defines whether inventory is maintained. | Yes | If No, product should not create stock ledger. |
| Serialized Tracking Required | Conditional | SKU | Tracks individual units. | No | Use for vehicles, machinery, equipment, and high-value serialized goods. |
| Batch Tracking Required | Conditional | SKU | Tracks production or receipt batch. | Yes | Useful for paint, chemicals, consumables, and recall control. |
| Lot Tracking Required | Conditional | SKU | Tracks lot grouping where applicable. | No | Separate from Batch Tracking to support businesses that distinguish lot from batch. |
| Consumption Strategy | Conditional | SKU / Local inventory setup | Defines stock issue/consumption logic. | FIFO / FEFO / LIFO / Manual | May be local/site-specific in advanced setup. |
| Shelf Life | Conditional | SKU / Batch-controlled product | Controls expiry-sensitive products. | 24 months | Relevant for paints, chemicals, tyres, rubber goods, oils, and perishables. |
| Storage Condition | Conditional | SKU / Classification | Defines storage requirement. | Store in cool, dry place | Can affect warehouse placement and handling. |

## 9. Sales Configuration

Sales eligibility and sales-specific behavior.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Sellable Indicator | Core | SKU | Defines whether product can be sold. | Yes | If No, block sales document selection. |
| Sales Channel Eligibility | Conditional | SKU / Scope | Defines allowed sales channels. | Dealer / Retail / Online | Should align with Product Scope where channel-specific activation exists. |
| Sales Return Eligibility | Conditional | SKU | Defines whether sales return is allowed. | Yes | Can be controlled by product, lifecycle, or policy. |
| Sales Discontinuation Behavior | Conditional | Model / SKU | Defines sales behavior after discontinuation. | Allow sell-through existing stock | Useful for discontinued products. |

## 10. Purchase Configuration

Purchase eligibility and purchase-specific behavior.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Purchasable Indicator | Core | SKU | Defines whether product can be purchased. | Yes | If No, block purchase document selection. |
| Purchase Return Eligibility | Conditional | SKU | Defines whether purchase return is allowed. | Yes | Useful for supplier return process. |
| Purchase Discontinuation Behavior | Conditional | Model / SKU | Defines purchase behavior after discontinuation. | Block new purchase orders | Useful for obsolete/discontinued items. |

## 11. Service & Warranty Configuration

Serviceability and warranty applicability.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Serviceable Indicator | Conditional | SKU / Model | Defines whether product can be serviced. | No | Relevant for vehicles, machines, equipment, durable goods, and high-value parts. |
| Warranty Applicable | Conditional | SKU / Model | Defines whether warranty applies. | No | Warranty details may be controlled outside Product Master if separate warranty rules exist. |

## 12. Product Identifiers

Controlled identifier attributes such as GTIN, HS Code, HSN, OEM Part Number, and manufacturer references. Identifiers should not be repeated in Inventory, Sales, Purchase, or compliance attributes.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Identifier Type | Conditional | Identifier attribute grid | Defines identifier category. | GTIN / HS Code / HSN / OEM Part No. | Controlled LOV. |
| Identifier Value | Conditional | Identifier attribute grid | Actual identifier value. | 8901234567890 | Validation depends on identifier type. |

## 13. Product Associations

Product-to-product relationships such as alternate products and kit/bundle components. Replacement/supersession can be introduced later if active old-to-new lifecycle redirection is required.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Alternate Product | Conditional | Product relationship | Alternative product usable when original is unavailable. | Royale Aspira 20L Shade 102 | Optional. Not the same as supersession; alternate usage can be one-way or two-way based on business rules. |
| Supersedes | Conditional | Product relationship | Successor product replacing old/discontinued product. | Royale Aspira Advanced 20L Shade 101 | Usually old -> new relationship. |

## 14. Status & Availability

Product usability status, validity, and discontinuation. Lifecycle stage is excluded for DMS MVP because product transaction eligibility is controlled through Product Status and operational indicators.

| Field | Core / Conditional | Recommended Level | Business Purpose | Example / Value | Validation / Design Note |
| --- | --- | --- | --- | --- | --- |
| Product Status | Core | Product / SKU | Controls whether product is usable in transactions. | Draft / Active / Inactive / Discontinued | Only Active products should be eligible for normal transactions. Blocked can be handled through specific restrictions/attributes if required. |
| Effective From Date | Core | Product / Scope / SKU | Date of activation. | 01-Apr-2026 | Product should not be usable before this date if enforced. |
| Effective To Date | Conditional | Product / Scope / SKU | Date of deactivation. | - | Should preserve historical transaction validity. |
| Discontinuation Date | Conditional | Model / SKU | Date of discontinuation. | 31-Dec-2026 | Used for discontinuation planning and sales/purchase discontinuation behavior. |

## Appendix A. Suggested Product Authenticity Values

These values are suggested for the Product Authenticity field. The field is separate from Product Type and Product Scope.

| Value | Meaning | Example | Recommended Behavior |
| --- | --- | --- | --- |
| Genuine / OEM | Original OEM/brand-approved product. | Bajaj genuine spare part; Asian Paints original sealed pack. | Allow normal sale, purchase, service, and warranty if active. |
| Authorized Supplier / OES | Made or supplied by authorized original equipment supplier. | Authorized brake pad supplier. | Allow subject to supplier/source approval. |
| Aftermarket | Legitimate third-party product, not OEM-approved. | Third-party brake pad compatible with Pulsar. | Allow only if business permits aftermarket products. |
| Compatible | Works as an alternative but is not original/OEM-approved. | Compatible industrial filter. | Allow with clear disclosure and alternate/compatibility control if needed. |
| Refurbished | Used product restored for resale/use. | Refurbished machinery component. | Allow only with inspection/condition control. |
| Remanufactured | Rebuilt product to defined quality/process standard. | Remanufactured engine part. | Allow with quality and warranty rules if applicable. |
| Grey Market | Original product sourced outside authorized channel. | Imported genuine part through unauthorized source. | Warning or approval recommended. |
| Counterfeit / Blocked | Fake or unauthorized product pretending to be genuine. | Fake OEM-labelled spare part. | Block purchase, sale, service, and warranty. |
| Unknown / Pending Verification | Authenticity not confirmed. | Product awaiting verification. | Require approval before activation or transaction usage. |

## Appendix B. Unique Field Register

| Section | Unique Fields |
| --- | --- |
| Product Definition | Product Code, Product Name, Product Description, Product Type, Product Authenticity, Brand / Make, Manufacturer / OEM, Country of Origin, Country of Assembly |
| Product Classification | Product Class, Product Category, Product Sub-category |
| Product Hierarchy | Product Catalog, Product Family, Product Line / Series, Model / Base Product, Variant / Configuration, SKU / Trade Item |
| Product Scope & Applicability | Scope Type, Scope Dimension, Scope Value, Scope Activation Status, Scope Effective From Date, Scope Effective To Date |
| Unit of Measurement | Base UOM, Applicable UOM, Conversion Reference, Conversion to Base UOM, Rounding Rule |
| Packaging | Pack Type, Pack Size, Pack Material, Packaging Description, Purchase Set Quantity, Sales Set Quantity, Organization Type |
| Product Dimensions | Net Weight, Gross Weight, Length, Width, Height, Volume |
| Inventory Configuration | Stockable Indicator, Serialized Tracking Required, Batch Tracking Required, Lot Tracking Required, Consumption Strategy, Shelf Life, Storage Condition, Quality Inspection Required |
| Sales Configuration | Sellable Indicator, Sales Channel Eligibility, Sales Return Eligibility, Sales Discontinuation Behavior |
| Purchase Configuration | Purchasable Indicator, Purchase Return Eligibility, Purchase Discontinuation Behavior |
| Service & Warranty Configuration | Serviceable Indicator, Warranty Applicable |
| Product Identifiers | Identifier Type, Identifier Value, Identifier Issuer / Source, Identifier Market / Jurisdiction, Identifier Valid From, Identifier Valid To, Primary Identifier Flag |
| Product Associations | Alternate Product, Kit / Bundle Components |
| Status & Availability | Product Status, Effective From Date, Effective To Date, Discontinuation Date |

## Appendix C. Removed / Moved Outside Product Master

These fields or concepts are intentionally excluded from the finalized Product Master field structure to prevent duplication and keep the master lean.

| Field / Concept | Decision / Reason |
| --- | --- |
| Product Level Type | Removed; hierarchy levels are handled through Product Hierarchy masters/configuration. |
| Product Nature | Removed; covered by Product Type. |
| Sales UOM / Purchase UOM / Inventory UOM | Removed from Product Master; transaction UOM is selected from Applicable UOM and validated through UOM Conversion Master. |
| Sales Status / Purchase Status / Inventory Status | Removed as separate fields; operational behavior is covered by Sellable, Purchasable, Stockable indicators and Product Status. |
| Lifecycle Stage | Removed for DMS MVP; Product Status controls transaction eligibility and discontinuation behavior handles withdrawal. |
| Compliance & Regulatory dedicated section | Moved to vertical-specific attributes/extensions. Core Product Master should not carry a heavy manufacturing-style compliance section. |
| Hazardous / Flammable / Fragile fixed indicators | Recommended to handle through Handling Nature attribute where required. |
| Warranty Policy Reference | Removed from Product Master; warranty policy can be handled outside the master. |
| Fitment Required / Compatible Product / Accessory / Attachment Product | Removed for MVP; can be handled as vertical-specific attributes/extensions if needed. |
| Replacement / Supersession Product | Moved to future phase; only required if active old-to-new lifecycle redirection is operationally needed. |
| Import Purchase Applicable | Moved to procurement/trade compliance rules if needed. |
| Supplier Part Number / Customer Part Number | Moved to Supplier-Product or Customer-Product Mapping. |
| MOQ / Lead Time / Approved Supplier | Moved to Supplier-Product Mapping or procurement configuration. |
| Min Quantity / Max Quantity / Reorder Quantity / Safety Stock | Moved to inventory planning/replenishment by warehouse/node. |
| Serial Number / Chassis Number / Engine Number | Inventory/asset/transaction level, not Product Master. |
| UOM Conversion Maintenance | Owned by UOM Conversion Master; Product Master displays conversion read-only. |
| Governance & Audit Section | Removed as per decision. |

## Final Design Rules

| Rule Area | Final Rule |
| --- | --- |
| Product Type vs Product Authenticity | Product Type defines what the product is. Product Authenticity defines whether it is genuine, aftermarket, refurbished, counterfeit, etc. |
| Product Classification | Product Classification contains Product Class, Product Category, and Product Sub-category only. Product Type is not repeated here. |
| Product Hierarchy | Product Hierarchy contains Product Catalog, Product Family, Product Line/Series, Model/Base Product, Variant/Configuration, and SKU/Trade Item. Product Category and Sub-category are not repeated here. |
| Product Scope | Product Scope & Applicability defines where the product is applicable or activated. It should not contain sales, purchase, inventory, compliance, or identifier fields. |
| UOM | UOM Conversion Master owns conversion logic. Product Master stores Base UOM and Applicable UOM selection and displays Conversion to Base UOM as read-only. |
| Packaging | Packaging captures pack format, pack size, pack material, packaging description, purchase set quantity, sales set quantity, and organization type. It must not duplicate UOM conversion. |
| Identifiers | GTIN, HS Code, HSN, OEM Part Number, Manufacturer Part Number, and similar identifiers belong only to Product Identifiers. |
| Compliance | Compliance-heavy details are handled through vertical-specific attributes/extensions rather than a dedicated core section. |
| Inventory Planning | Min/max quantity, reorder quantity, and safety stock are not Product Master core fields; they belong to warehouse/node-level replenishment configuration. |

---

## Source DOCX Footer

Generated for Product Master design discussion

---

## Source DOCX Comments

| Comment ID | Author | Date | Anchored Text | Comment |
| --- | --- | --- | --- | --- |
| 0 | Kushal Ratnaparkhi | 2026-05-28T14:26:00Z | Product AuthenticityConditional / RecommendedProduct / SKUDefines whether the product is genuine, aftermarket, refurbished, counterfeit, etc.Genuine / OEMRecommended especially for spare parts, accessories, refurbished goods, aftermarket products, and service items. | Not required |
| 1 | Kushal Ratnaparkhi | 2026-05-28T14:32:00Z | Brand / MakeCoreModel / SKUCommercial brand or make of the product.Asian PaintsPrefer controlled master/picklist. | Not required here. Will be captured as part of either classification or hierarchy |
| 2 | Kushal Ratnaparkhi | 2026-05-28T14:26:00Z | Shelf LifeConditionalSKU / Batch-controlled productControls expiry-sensitive products.24 monthsRelevant for paints, chemicals, tyres, rubber goods, oils, and perishables. | To be managed as atrribute |
| 3 | Kushal Ratnaparkhi | 2026-05-28T14:25:00Z | Sales Return EligibilityConditionalSKUDefines whether sales return is allowed.YesCan be controlled by product, lifecycle, or policy. | To be managed by Return Policy Configuration |
| 4 | Kushal Ratnaparkhi | 2026-05-28T14:33:00Z | Purchase Return EligibilityConditionalSKUDefines whether purchase return is allowed.YesUseful for supplier return process. | To be managed by Return Policy Configuration |
| 5 | Kushal Ratnaparkhi | 2026-05-28T14:34:00Z | Serviceable IndicatorConditionalSKU / ModelDefines whether product can be serviced.NoRelevant for vehicles, machines, equipment, durable goods, and high-value parts. | To be managed as Extension |
