import type { HelpTopic } from './helpTypes';

export const helpTopics: HelpTopic[] = [
  {
    id: 'admin-dashboard',
    title: 'How Admin Setup Works',
    summary:
      'Use Admin Setup to configure the foundation of the application before business users start working with transactions.',
    steps: [
      {
        title: 'Start with organisation setup',
        description:
          'Confirm the legal entity, branch, contact, tax, and branding information first.',
      },
      {
        title: 'Configure numbering',
        description:
          'Set prefixes and numbering policies before users create documents or master records.',
      },
      {
        title: 'Prepare picklists',
        description:
          'Define dropdown values and dependent selections used across forms.',
      },
      {
        title: 'Configure KYC rules',
        description:
          'Define country-wise proof requirements for customers, suppliers, employees, vendors, and partners.',
      },
      {
        title: 'Review roles and templates',
        description:
          'Set access roles and print templates after the core setup is ready.',
      },
    ],
    tips: [
      'Use Save as Draft when a configuration is incomplete.',
      'Activate only after validation checks pass.',
      'Use Recently Visited to resume configuration quickly.',
    ],
    commonMistakes: [
      'Activating code policies before selecting a valid prefix.',
      'Creating transaction data before required picklists are ready.',
      'Leaving KYC proof rules inactive after configuration.',
    ],
    relatedTopics: ['organisation-master', 'numbering-code-setup', 'picklist-master', 'kyc-setup'],
  },
  {
    id: 'organisation-master',
    title: 'How Organisation Master Works',
    summary:
      'Organisation Master defines your legal entity details, including company name, registration numbers, tax identifiers, branches, and contact information. This is the foundation all other configuration depends on.',
    steps: [
      {
        title: 'Enter legal entity details',
        description:
          'Add the registered company name, registration number, and incorporation details.',
      },
      {
        title: 'Configure address and contact information',
        description:
          'Set the primary address, phone, email, and website for the organisation.',
      },
      {
        title: 'Add tax identifiers',
        description:
          'Enter GST, VAT, or other applicable tax registration numbers.',
      },
      {
        title: 'Set up branches',
        description:
          'Define physical branches or virtual locations if the organisation operates from multiple sites.',
      },
      {
        title: 'Upload branding assets',
        description:
          'Add the company logo used on printed documents and the application header.',
      },
      {
        title: 'Activate the organisation record',
        description:
          'Complete the validation checklist and activate before proceeding to other setup areas.',
      },
    ],
    tips: [
      'Complete organisation setup before configuring numbering or KYC rules.',
      'Branch setup is required if documents need to be tagged to specific locations.',
      'Tax identifiers are used on printed invoices — ensure accuracy before activation.',
    ],
    commonMistakes: [
      'Activating before entering required tax identification numbers.',
      'Skipping branch setup when multiple locations are in use.',
      'Uploading a low-resolution logo that appears blurred on printed documents.',
    ],
    relatedTopics: ['admin-dashboard', 'numbering-code-setup'],
  },
  {
    id: 'kyc-setup',
    title: 'How KYC Setup Works',
    summary:
      'KYC Setup defines which proof documents are required for each entity type and country, including document number and attachment rules.',
    steps: [
      {
        title: 'Select entity and entity type',
        description:
          'Choose the entity (Customer, Supplier, Employee, Partner) and the sub-type (Individual, Corporate, Domestic, Foreign). KYC rules are applied per entity type during onboarding.',
      },
      {
        title: 'Add country-wise proof rules',
        description:
          'For each country, add one or more accepted proof types. Multiple proof types per country give users a choice of which document to submit.',
      },
      {
        title: 'Configure document number validation',
        description:
          'Set minimum and maximum length for the document number. Optionally add a regex pattern for strict format enforcement — for example, to require a specific letter-digit structure.',
      },
      {
        title: 'Configure attachment requirements',
        description:
          'Mark attachment as Required to force a file upload during onboarding, or Optional to allow submission without an attachment. Required is recommended for identity and tax proofs.',
      },
      {
        title: 'Resolve validation checklist items',
        description:
          'Check the validation panel for warnings such as missing length rules or inactive proof types. All checklist items must pass before activation.',
      },
      {
        title: 'Activate the setup',
        description:
          'Once activated, proof rules apply immediately to new entity onboarding. Existing entities are not retroactively validated — update their KYC records manually if needed.',
      },
    ],
    tips: [
      'Use regex only when the document number must follow a strict format.',
      'Attachment rules should mention allowed file types and maximum file count.',
      'Inactive proof rows are not used for runtime validation.',
      'After activation, test with a sample entity to confirm the proof rules trigger correctly.',
    ],
    commonMistakes: [
      'Adding proof rows without activating them — validation never applies to inactive rows.',
      'Using a regex pattern and also setting a maximum length that contradicts the pattern.',
      'Forgetting to add at least one active proof per entity type before going live.',
      'Configuring proofs for only one country when the organisation operates in multiple countries.',
    ],
    relatedTopics: ['admin-dashboard', 'organisation-master'],
  },
  {
    id: 'picklist-master',
    title: 'How Picklist Master Works',
    summary:
      'Picklist Master defines dropdown values used across the application, including dependent and multi-level dependent lists. All form dropdowns pull their values from here.',
    steps: [
      {
        title: 'Choose the configuration type',
        description:
          'Select Simple for a single-level list, Dependent for a two-level parent-child list, or Multi-level for three or more linked levels.',
      },
      {
        title: 'Define one or more levels',
        description:
          'Name each level clearly — for example, Country and State for a location hierarchy.',
      },
      {
        title: 'Add values for each level',
        description:
          'Enter display names and sort order. Display names appear in the dropdown exactly as entered.',
      },
      {
        title: 'Map parent and child values when dependencies exist',
        description:
          'For dependent lists, link each child value to its parent so the second dropdown filters automatically.',
      },
      {
        title: 'Activate only valid values',
        description:
          'Only active values appear in transaction form dropdowns. Draft or inactive values are hidden from users.',
      },
    ],
    tips: [
      'Keep display names user-friendly — they appear directly in forms without translation.',
      'Use sort order to control dropdown ordering rather than relying on alphabetical sorting.',
      'Avoid duplicate values unless intentional reuse across multiple parent values is required.',
      'Complete picklist setup before configuring any form that references these values.',
    ],
    commonMistakes: [
      'Saving values but not activating them — the dropdown appears empty for users.',
      'Changing display names after transactions are created — existing records retain the old label.',
      'Creating dependent lists without mapping parent-child relationships — child dropdown shows all values regardless of parent selection.',
    ],
    relatedTopics: ['admin-dashboard'],
  },
  {
    id: 'numbering-code-setup',
    title: 'How Numbering & Code Setup Works',
    summary:
      'Numbering setup controls prefixes and sequence rules used to generate document and master record codes. Every entity that needs a system-assigned code must have a numbering configuration before any records are created.',
    steps: [
      {
        title: 'Create a prefix for the entity',
        description:
          'Enter a short alphabetic code such as INV for invoices or SO for sales orders. The prefix is permanent once assigned to a transaction.',
      },
      {
        title: 'Define series type and number length',
        description:
          'Choose Numeric for sequential integers or Alphanumeric if letters are needed after a threshold. Set the minimum number length — shorter numbers will be zero-padded.',
      },
      {
        title: 'Choose reset behaviour if required',
        description:
          'Never keeps the sequence running indefinitely. Financial Year resets to 1 on the start of each financial year. Calendar Year resets on January 1.',
      },
      {
        title: 'Set the number consumption event',
        description:
          'OnSave assigns the number as soon as a draft is saved. OnSubmit assigns only when the document is formally submitted — use this to avoid gaps in numbering.',
      },
      {
        title: 'Preview the generated sample',
        description:
          'Review the example code shown in the preview before activation to confirm it matches your organisation\u2019s numbering convention.',
      },
      {
        title: 'Activate the configuration',
        description:
          'Resolve all validation checklist items and activate. Numbering cannot be changed after the first document is generated using this policy.',
      },
    ],
    tips: [
      'Configure numbering before any transaction documents are created — codes cannot be retroactively reassigned.',
      'Use the preview to confirm the generated format matches your requirement.',
      'Reset behaviour applies per financial year or calendar year — confirm with the accounts team before activation.',
      'OnSubmit consumption prevents gaps from abandoned drafts — prefer this for audit-sensitive documents.',
    ],
    commonMistakes: [
      'Activating a numbering policy before confirming the prefix — the prefix cannot be changed after first use.',
      'Using the same prefix for two different entity types — causes numbering conflicts.',
      'Setting reset frequency to Financial Year without aligning the financial year start date in Organisation Master.',
    ],
    relatedTopics: ['admin-dashboard', 'code-generation-policy'],
  },
  {
    id: 'code-generation-policy',
    title: 'How Code Generation Policy Works',
    summary:
      'A code generation policy combines prefix, series type, reset frequency, padding, and case rules to define exactly how codes are generated for a specific entity type.',
    steps: [
      {
        title: 'Fill basic policy details',
        description:
          'Name the policy and add a description that explains the numbering convention — for example, "Annual sales order sequence, resets per financial year".',
      },
      {
        title: 'Select applicability',
        description:
          'Choose which entity type or document type this policy applies to. Each entity can have only one active policy at a time.',
      },
      {
        title: 'Choose prefix',
        description:
          'Select from the active prefixes created in Numbering & Code Setup. A policy cannot be activated without an active prefix.',
      },
      {
        title: 'Define series type, padding, and reset frequency',
        description:
          'Numeric or Alphanumeric series, minimum code length with zero-padding, and when the counter resets (Never / Financial Year / Calendar Year).',
      },
      {
        title: 'Set allowed special characters if needed',
        description:
          'Only add separators such as - or / if your downstream systems and print formats can handle them.',
      },
      {
        title: 'Review preview and activate',
        description:
          'Confirm the sample code shown in the preview. Activate once all checklist items are resolved.',
      },
    ],
    tips: [
      'A policy must have an active prefix before it can be activated.',
      'Padding ensures consistent code length — a length of 5 produces 00001, 00002.',
      'Only one policy per entity type can be active at any time.',
    ],
    commonMistakes: [
      'Selecting a prefix that is still in Draft — the policy activation will fail.',
      'Setting number length shorter than the expected transaction volume — codes overflow the padding after the limit.',
      'Adding special characters that are not supported by external integrations or ERP systems.',
    ],
    relatedTopics: ['numbering-code-setup'],
  },

  {
    id: 'generic-master-list',
    title: 'Working with Admin Master Lists',
    summary:
      'Admin master list pages let you view, search, filter, and manage records for any configuration master. Use this page to find existing records, track their status, and navigate to create or edit a record.',
    steps: [
      {
        title: 'Search or filter to find records',
        description:
          'Use the search bar to filter by name or code. Use status filters to see only Draft, Active, or Inactive records. Adjust page size for large datasets.',
      },
      {
        title: 'Check record status before editing',
        description:
          'Draft records are safe to edit freely. Active records may be referenced by transactions — changes affect live behaviour. Inactive records are preserved but no longer used.',
      },
      {
        title: 'Use row actions for quick edits',
        description:
          'Each row has a menu with View, Edit, Duplicate, and Deactivate options. Use Duplicate to create a new record based on an existing one.',
      },
      {
        title: 'Bulk-select for export or status updates',
        description:
          'Tick the header checkbox to select all visible records. Use the bulk action bar to export selected rows or change status for multiple records at once.',
      },
      {
        title: 'Add a new record',
        description:
          'Click Add New to open a blank form. The new record starts as Draft — complete all required fields and activate when ready.',
      },
    ],
    tips: [
      'Sort by Created Date to find recently added records quickly.',
      'Use Export to produce a spreadsheet for review or audit before activation.',
      'Draft records do not affect transactions — keep them in Draft until ready to go live.',
    ],
    commonMistakes: [
      'Activating a record before completing all required fields.',
      'Deleting a record that is referenced by another master or transaction — deactivate instead.',
      'Editing an Active record without checking whether open transactions depend on it.',
    ],
    relatedTopics: ['admin-dashboard'],
  },
  {
    id: 'generic-master-form',
    title: 'Creating and Editing Admin Records',
    summary:
      'Admin master forms are used to create, edit, or view individual configuration records. Each record moves through Draft → Active → Inactive states. Use Save Draft to stage incomplete work and activate only when the record is fully configured.',
    steps: [
      {
        title: 'Fill required fields first',
        description:
          'Required fields are marked with an asterisk. The record cannot be activated until all required fields have valid values.',
      },
      {
        title: 'Use tabs to navigate sections',
        description:
          'Large forms split across multiple tabs — Basic Information, Additional Details, Configuration, and Notes. Validation errors on inactive tabs are shown as a badge on the tab label.',
      },
      {
        title: 'Save as Draft to preserve partial work',
        description:
          'Save Draft stores the record without activating it. You can return later, make further changes, and activate when ready. Draft records are not visible in transaction dropdowns.',
      },
      {
        title: 'Resolve the validation checklist',
        description:
          'The checklist panel shows items that must be resolved before activation. Each item describes the missing configuration and links to the relevant field.',
      },
      {
        title: 'Activate when ready',
        description:
          'Once all checklist items pass, activate the record. It immediately becomes available in transaction forms, dropdowns, and validation rules.',
      },
      {
        title: 'Deactivate instead of deleting',
        description:
          'If a record is no longer needed, deactivate it. Deactivated records are hidden from dropdowns but their history and references are preserved.',
      },
    ],
    tips: [
      'Use Save & New after creating a record to immediately start the next one — useful for batch setup.',
      'The status badge in the header shows Draft, Unsaved changes, or Saved so you always know the current state.',
      'Add a meaningful description — it appears in the list view and helps other admins understand the record\'s purpose.',
    ],
    commonMistakes: [
      'Navigating away without saving — unsaved changes are lost.',
      'Activating without testing — activate in a non-production environment first when possible.',
      'Leaving the description blank — descriptions appear in dropdowns and help users pick the correct value.',
    ],
    relatedTopics: ['generic-master-list', 'admin-dashboard'],
  },

  {
    id: 'area-master',
    title: 'How Area Master Works',
    summary:
      'Area Master lets you define geographic areas such as countries, states, cities, and zones. Each area belongs to an area level that determines its position in the hierarchy. Areas can carry usage tags, geo-coordinates, postal codes, and alternate name aliases.',
    steps: [
      {
        title: 'Set up area levels first',
        description:
          'Before creating areas, define your hierarchy levels in Area Level Configuration — for example, Country, State, City, and Area. Assign a level sequence and role to each level.',
      },
      {
        title: 'Create a new area',
        description:
          'Click New Area to open the area form. Fill in the area name and select its area level. The area code is generated automatically.',
      },
      {
        title: 'Assign a parent area',
        description:
          'If the area level requires a parent, select the parent from the allowed parent areas. The hierarchy path is calculated automatically.',
      },
      {
        title: 'Configure usage tags',
        description:
          'Usage tags control where an area can be selected — for shipping, billing, service zones, or other purposes. Mandatory tags are pre-selected and cannot be removed.',
      },
      {
        title: 'Add geo and postal details',
        description:
          'Optionally enter a postal code, geo-coordinates, or boundary type. These are used for location-based matching and mapping integrations.',
      },
      {
        title: 'Add alternate name aliases',
        description:
          'Use the Aliases section to add local-language names, short names, or legacy names. Aliases with Search Enabled are included in search results.',
      },
      {
        title: 'Activate the area',
        description:
          'Once the form is complete, activate the area to make it available in transactions and downstream lookups.',
      },
    ],
    tips: [
      'Activate area levels before creating areas that depend on them.',
      'Use the hierarchy tree view to verify that parent-child relationships are correctly set up.',
      'Usage tags on the area level restrict which tags are selectable on individual areas.',
      'Areas in Draft status are not visible in transaction dropdowns.',
    ],
    commonMistakes: [
      'Creating areas before the corresponding area level is activated.',
      'Leaving parent area blank when the level requires a parent — activation will fail.',
      'Assigning incorrect usage tags — areas may not appear in the expected form dropdowns.',
      'Duplicating an area name within the same parent — use different names or add a distinguishing alias.',
    ],
    relatedTopics: ['area-level-setup', 'admin-dashboard'],
  },

  {
    id: 'area-level-setup',
    title: 'How Area Level Configuration Works',
    summary:
      'Area Level Configuration defines the tiers in your geographic hierarchy — for example, Country, State, City, and Area. Each level has a sequence number, a role (Root, Branch, or Leaf), and rules for which parent levels are allowed.',
    steps: [
      {
        title: 'Define your hierarchy levels',
        description:
          'Plan the levels before creating them. A typical hierarchy has 3–5 levels: a root level such as Country, mid-levels such as State and City, and a leaf level such as Pincode or Zone.',
      },
      {
        title: 'Set the level sequence',
        description:
          'Assign a level sequence number (1 = topmost). Sequences must be unique across all levels. Lower numbers represent higher levels in the hierarchy.',
      },
      {
        title: 'Choose the level role',
        description:
          'Root levels have no parent. Branch levels sit in the middle and can have both parents and children. Leaf levels are at the bottom and cannot have child areas.',
      },
      {
        title: 'Configure parent rules',
        description:
          'Enable Parent Required if all areas at this level must have a parent. Select the Allowed Parent Level IDs to restrict which levels can be parents for this level.',
      },
      {
        title: 'Set usage tag applicability',
        description:
          'Assign allowed, default, and mandatory usage tags. Mandatory tags will always be applied to areas at this level. Default tags are pre-selected but can be changed.',
      },
      {
        title: 'Activate the level',
        description:
          'Resolve the validation checklist and activate. Activated levels are available for use when creating area records.',
      },
    ],
    tips: [
      'Activate area levels in top-down order — activate Country before State before City.',
      'Use meaningful short codes — they appear in hierarchical path displays and reports.',
      'Level sequence determines visual depth in the hierarchy tree view.',
      'You cannot change the level sequence once areas exist that use this level.',
    ],
    commonMistakes: [
      'Using duplicate level sequences — each level must have a unique sequence.',
      'Setting a Leaf role but also enabling Parent Required — leaf levels should not require a parent in a well-designed hierarchy.',
      'Forgetting to set allowed parent levels — areas cannot be created without a valid parent if Parent Required is on.',
      'Activating area levels after areas have already been created in draft — always activate levels first.',
    ],
    relatedTopics: ['area-master', 'admin-dashboard'],
  },

  {
    id: 'supplier-master',
    title: 'How Business Partner Master Works',
    summary:
      'Business Partner Master lets you configure all external parties your organisation works with — suppliers, transporters, financiers, insurance providers, and customers. Each record captures identity, contacts, addresses, compliance documents, bank details, and item mappings in a single place.',
    steps: [
      {
        title: 'Select the business partner type',
        description:
          'Start by selecting the Business Partner Type in General Details — Supplier, Transporter, Insurance Provider, Financier, or Customer. The type highlights which tabs are most relevant for that partner category.',
      },
      {
        title: 'Complete general details',
        description:
          'Fill in the legal name, marketing name, display name, category, and business registration details. The BP Code is auto-generated but can be overridden. Set the effective date range and description.',
      },
      {
        title: 'Add contacts',
        description:
          'Go to the Contacts tab and add at least one Primary contact. Include department, designation, phone, and email. Multiple contacts of different types can be added per partner.',
      },
      {
        title: 'Add addresses',
        description:
          'Add at least one address and mark it as the default. Multiple address types (Registered, Billing, Shipping, Warehouse) can be added for the same partner.',
      },
      {
        title: 'Configure organisation mapping',
        description:
          'Map the partner to specific organisation units or enable Apply to All for global access. Set effective and expiry dates to control time-bound access.',
      },
      {
        title: 'Add compliance documents',
        description:
          'On the Tax & Compliance tab, toggle Tax Registered if applicable and add compliance documents like GST certificates, PAN, or trade licences. Set expiry dates and whether transactions are allowed after expiry.',
      },
      {
        title: 'Add bank and payment details',
        description:
          'Add bank accounts on the Bank & Payment tab. Mark one as the default account. Configure payment terms — credit days, credit limit, payment mode, and settlement type.',
      },
      {
        title: 'Map items (for suppliers)',
        description:
          'On the Item Mapping tab, link the items that this supplier can supply. Set order quantities, lead times, and returnable policy per item.',
      },
      {
        title: 'Activate the partner',
        description:
          'Once all required sections are complete, activate the partner to make it available in transactions such as purchase orders, invoices, and logistics.',
      },
    ],
    tips: [
      'A Primary contact is mandatory for activation — add it in the Contacts tab before activating.',
      'Mark at least one address as default — this is used as the billing/shipping address in transactions.',
      'The BP Type you select highlights the most relevant tabs, but all tabs remain accessible.',
      'Use the Draft status while setting up a partner — it will not appear in transaction dropdowns until activated.',
      'Item mappings define the vendor catalogue — use them to control which items can be ordered from each supplier.',
    ],
    commonMistakes: [
      'Activating without adding a Primary contact — activation will fail the validation checklist.',
      'Forgetting to mark an address as default — required for transaction auto-population.',
      'Leaving bank details empty for a financier partner — payment integration requires at least one bank account.',
      'Setting Max Order Qty lower than Min Order Qty in item mapping — validation will block the save.',
      'Adding duplicate item codes in item mapping — each item can only be mapped once per partner.',
    ],
    relatedTopics: ['admin-dashboard'],
  },

  // ─── Warehouse Master ──────────────────────────────────────────────────────
  {
    id: 'warehouse-master-overview',
    title: 'How Warehouse Master Works',
    summary:
      'Warehouse Master lets you define physical and virtual warehouses, configure inventory control mode (Warehouse-Level or Location/BIN-Level), assign branches, and set up operational policies including putaway, picking, eligibility, and cycle count.',
    steps: [
      {
        title: 'Create a warehouse record',
        description:
          'Click New Warehouse to open the warehouse form. Enter the warehouse code, name, and select the ownership scope. Organisation-scope warehouses are shared across all branches; Branch-scope warehouses are scoped to a single branch.',
      },
      {
        title: 'Choose an inventory control mode',
        description:
          'Warehouse-Level tracks stock at the warehouse level without individual bin locations. Location/BIN-Level enables granular BIN-managed tracking. This choice cannot be changed once the warehouse has open stock.',
      },
      {
        title: 'Set up the hierarchy template (BIN-Level only)',
        description:
          'For Location/BIN-Level warehouses, create a hierarchy template that defines the levels of your storage structure — for example, Zone > Aisle > Rack > Shelf > BIN. Activate the template before activating the warehouse.',
      },
      {
        title: 'Create and activate locations',
        description:
          'Add at least one inventory-allowed active location before activating the warehouse. Locations can be created individually or via bulk import.',
      },
      {
        title: 'Configure branch assignments',
        description:
          'Assign branches that should have access to this warehouse. Set a default warehouse per branch to auto-populate transactions.',
      },
      {
        title: 'Activate the warehouse',
        description:
          'Resolve all setup issues shown in the Setup Health indicator, then activate. Once active, the warehouse is available for inventory transactions.',
      },
    ],
    tips: [
      'BIN-Level warehouses require an active hierarchy template and at least one active inventory-allowed BIN before activation.',
      'Warehouse-Level warehouses cannot use auto-putaway or auto-picking — these are disabled automatically.',
      'BIN-to-BIN transfer is only available in Location/BIN-Level mode.',
      'The Setup Health indicator shows any blocking issues that must be resolved before activation.',
      'You can block a warehouse temporarily without losing any data — unblock it to resume operations.',
    ],
    commonMistakes: [
      'Trying to activate a BIN-Level warehouse without an active hierarchy template.',
      'Enabling auto-putaway in Warehouse-Level mode — this is automatically prevented.',
      'Forgetting to assign at least one branch to a Branch-scope warehouse.',
      'Attempting to change the inventory control mode after stock exists in the warehouse.',
      'Leaving the warehouse in Draft status without resolving Setup Health issues.',
    ],
    relatedTopics: ['admin-dashboard'],
  },
  {
    id: 'warehouse-create',
    title: 'How Warehouse Creation Works',
    summary:
      'Warehouse creation is a staged setup flow. Complete the left-side steps in order, save Draft when information is still pending, and use the activation review to resolve every blocking issue before go-live.',
    steps: [
      { title: 'Start with identity', description: 'Capture warehouse name, code, type, facility reference, and operating timezone first.' },
      { title: 'Confirm ownership and scope', description: 'Choose Organisation or Branch scope, then fill the owning entity and access context correctly.' },
      { title: 'Select inventory control mode carefully', description: 'Warehouse-Level is simpler, while Location/BIN-Level requires hierarchy, leaf locations, and operational rules before activation.' },
      { title: 'Decide structure and defaults', description: 'For BIN-level warehouses, define hierarchy intent now so downstream location and policy setup is aligned.' },
      { title: 'Use activation review as the final gate', description: 'Activation stays blocked until every required check passes with a clear, actionable reason.' },
    ],
    tips: [
      'Save Draft whenever dependent data such as hierarchy or access assignments will be completed later.',
      'Do not activate until ownership, mode, hierarchy, and at least one valid inventory endpoint are aligned.',
    ],
    commonMistakes: [
      'Choosing Location/BIN-Level without planning the hierarchy and inventory-allowed leaf structure.',
      'Using a warehouse code that does not match the naming convention expected by operations teams.',
    ],
    relatedTopics: ['warehouse-master-overview', 'warehouse-activation'],
  },
  {
    id: 'warehouse-ownership',
    title: 'Warehouse Ownership and Scope',
    summary:
      'Ownership determines who governs the warehouse and who can transact through it. Scope affects whether the warehouse is organisation-wide or tied to a single branch.',
    steps: [
      { title: 'Choose the ownership scope', description: 'Organisation scope supports shared warehouse usage. Branch scope ties the warehouse to one owning branch.' },
      { title: 'Set the owning entity', description: 'Provide the owning organisation or branch code that is operationally responsible for the warehouse.' },
      { title: 'Review access implications', description: 'Shared warehouses need branch-access review before activation so transactions route correctly.' },
    ],
    tips: [
      'Organisation-scope warehouses usually need shared branch access or explicit branch assignments before activation.',
      'Branch-scope warehouses should clearly identify the operational owner to avoid approval ambiguity later.',
    ],
    commonMistakes: [
      'Selecting Branch scope without an owning branch.',
      'Treating organisation ownership as open access without setting branch-level access rules.',
    ],
    relatedTopics: ['warehouse-branch-access', 'warehouse-create'],
  },
  {
    id: 'warehouse-branch-access',
    title: 'Warehouse Branch Access',
    summary:
      'Branch access controls which branches can use a warehouse and whether the warehouse is globally shared or selectively assigned.',
    steps: [
      { title: 'Review sharing mode', description: 'Decide whether all branches can access the warehouse or only explicitly assigned branches.' },
      { title: 'Assign active branches', description: 'Create or confirm active branch assignments before operations begin.' },
      { title: 'Validate defaults', description: 'Check default warehouse behavior for the branches that should auto-route transactions here.' },
    ],
    tips: [
      'Use explicit assignments for controlled warehouses where not every branch should transact.',
      'Review access again before inactivating or revoking assignments because open work may depend on them.',
    ],
    commonMistakes: [
      'Leaving an organisation-scope warehouse with no active sharing or branch assignment.',
      'Removing branch access without checking open dependency or approval requirements.',
    ],
    relatedTopics: ['warehouse-ownership'],
  },
  {
    id: 'warehouse-inventory-control',
    title: 'Warehouse Inventory Control',
    summary:
      'Inventory Control Mode drives how stock is posted, how locations behave, and which advanced warehouse policies are available.',
    steps: [
      { title: 'Choose Warehouse-Level or Location/BIN-Level', description: 'Warehouse-Level keeps stock at warehouse scope. Location/BIN-Level requires valid hierarchy and location endpoints.' },
      { title: 'Review downstream impacts', description: 'Auto putaway, auto picking, detailed capacity, and inventory endpoint rules depend on BIN-level control.' },
      { title: 'Treat the mode as a governance choice', description: 'Changing mode later can be blocked by stock, history, approvals, and operational dependencies.' },
    ],
    tips: [
      'Use Warehouse-Level only when detailed location control is intentionally out of scope.',
      'Choose BIN-level early if the warehouse needs directed movement, slotting, or stock segregation.',
    ],
    commonMistakes: [
      'Expecting directed putaway or BIN allocation in Warehouse-Level mode.',
      'Trying to switch mode after the warehouse has started operational use.',
    ],
    relatedTopics: ['warehouse-hierarchy', 'warehouse-putaway', 'warehouse-picking'],
  },
  {
    id: 'warehouse-hierarchy',
    title: 'Warehouse Hierarchy Workspace',
    summary:
      'The hierarchy workspace is where you build and govern the tree of storage nodes used by Location/BIN-Level warehouses.',
    steps: [
      { title: 'Use the tree to inspect structure', description: 'Search, expand, collapse, and select nodes to review path, status, capacity, and child-node detail.' },
      { title: 'Create only valid parent-child combinations', description: 'Hierarchy validation prevents invalid node types, cycles, and duplicate full paths.' },
      { title: 'Resolve issues before activation', description: 'Blocked, non-leaf, or inventory-disallowed endpoints will stop BIN-level activation and posting.' },
    ],
    tips: [
      'Use the issue filter to focus on nodes that need action first.',
      'Inventory posting is allowed only at valid leaf endpoints where Inventory Allowed = Yes.',
    ],
    commonMistakes: [
      'Adding child nodes under blocked or inactive parents.',
      'Assuming every node can receive stock even when it is not a leaf endpoint.',
    ],
    relatedTopics: ['warehouse-locations', 'warehouse-activation'],
  },
  {
    id: 'warehouse-locations',
    title: 'Warehouse Locations and BINs',
    summary:
      'The locations workspace provides the operational list view for storage nodes, filters, status review, and bulk creation.',
    steps: [
      { title: 'Filter to the operational slice you need', description: 'Use level, parent, type, status, capacity, and issue filters to isolate the right records.' },
      { title: 'Check derived operational fields', description: 'Review full path, inventory allowed, effective status, and stock dependency indicators before editing.' },
      { title: 'Use bulk creation carefully', description: 'Preview, validate, and commit in an all-or-nothing flow so duplicates and conflicts are caught early.' },
    ],
    tips: [
      'Preview is read-only and becomes stale when source inputs change.',
      'Capacity warnings and blocked movement flags are better triaged from the filtered list before editing individual nodes.',
    ],
    commonMistakes: [
      'Committing a bulk batch without regenerating a stale preview.',
      'Treating derived fields such as inventory-allowed or full path as directly editable.',
    ],
    relatedTopics: ['warehouse-hierarchy', 'warehouse-import'],
  },
  {
    id: 'warehouse-capacity',
    title: 'Warehouse Capacity and Constraints',
    summary:
      'Capacity and constraint rules control soft warehouse limits, hard BIN/location limits, and operational restrictions such as hazard, temperature, and compliance locks.',
    steps: [
      { title: 'Configure warehouse and location expectations separately', description: 'Warehouse-level capacity is informational, while location/BIN hard limits can block storage decisions when enabled.' },
      { title: 'Set storage restrictions clearly', description: 'Hazard, temperature, mixed item, mixed lot, mixed owner, and compliance rules should match real operational policy.' },
      { title: 'Review downstream validation', description: 'Putaway, eligibility, and manual overrides should all respect the same restrictions.' },
    ],
    tips: [
      'Use hard enforcement only where the business is ready for operational blocking behavior.',
      'Explain compliance lock usage clearly so approval reviewers understand why restricted storage is required.',
    ],
    commonMistakes: [
      'Enabling hard limits at BIN level without usable override governance.',
      'Allowing mixed storage rules that conflict with temperature or owner segregation policy.',
    ],
    relatedTopics: ['warehouse-putaway', 'warehouse-stock-governance'],
  },
  {
    id: 'warehouse-item-eligibility',
    title: 'Warehouse Item Eligibility',
    summary:
      'Eligibility rules determine which items are allowed or blocked in specific storage endpoints and which rule wins when conditions overlap.',
    steps: [
      { title: 'Choose the eligibility mode', description: 'Open, Restricted, Hybrid, Category, and Advanced modes support increasing levels of control.' },
      { title: 'Define allow and deny behavior intentionally', description: 'Deny rules are evaluated before allow rules and should describe the strongest operational restriction.' },
      { title: 'Apply eligibility only to valid endpoints', description: 'Eligibility setup is meaningful only on active, inventory-allowed leaf nodes.' },
    ],
    tips: [
      'Use restricted or hybrid mode when operational segregation matters more than broad storage flexibility.',
      'Write rule descriptions so auditors can understand why a category or item is blocked.',
    ],
    commonMistakes: [
      'Expecting allow rules to override deny rules.',
      'Configuring eligibility on blocked, non-leaf, or inventory-disallowed locations.',
    ],
    relatedTopics: ['warehouse-locations', 'warehouse-stock-governance'],
  },
  {
    id: 'warehouse-putaway',
    title: 'Warehouse Putaway Policy',
    summary:
      'Putaway strategy is an ordered decision flow. Candidate locations are filtered first, then sorted according to strategy priority, with simulation available for configuration review.',
    steps: [
      { title: 'Build the strategy in order', description: 'Use move up and move down controls to place the most important strategy criteria first.' },
      { title: 'Validate restrictions before ranking', description: 'Eligibility, capacity, hazard, owner, and other filters should narrow the candidate list before sorting is applied.' },
      { title: 'Use simulation as configuration preview', description: 'The test result explains filters, exclusions, tie-breakers, and warnings, but it is not a production stock decision.' },
    ],
    tips: [
      'Restore recommended order when experimentation leaves the strategy sequence unclear.',
      'Prefer a shorter, explainable sequence over a long chain that is hard to audit.',
    ],
    commonMistakes: [
      'Treating strategy configuration as an unordered multi-select.',
      'Assuming the simulation output is an actual production allocation result.',
    ],
    relatedTopics: ['warehouse-capacity', 'warehouse-picking'],
  },
  {
    id: 'warehouse-picking',
    title: 'Warehouse Picking Policy',
    summary:
      'Picking strategy is also an ordered decision flow. Stock candidates are filtered first, then sorted according to the configured picking priority.',
    steps: [
      { title: 'Order the picking rules intentionally', description: 'Strategy order changes which source stock wins when multiple candidates remain after filtering.' },
      { title: 'Keep stock state concepts separate', description: 'Availability, movement state, and commitment state should not be mixed together as one status.' },
      { title: 'Use simulation to explain the decision path', description: 'Review candidates, exclusions, selected result, and warnings before approving the policy.' },
    ],
    tips: [
      'Use a stable first strategy that the operations team can explain and trust.',
      'Check how allocation scope and commitment state affect source availability before adjusting strategy order.',
    ],
    commonMistakes: [
      'Using picking sequence as if it were a set instead of a priority list.',
      'Treating reserved or allocated as stock availability statuses.',
    ],
    relatedTopics: ['warehouse-stock-governance', 'warehouse-putaway'],
  },
  {
    id: 'warehouse-defaults',
    title: 'Warehouse Default Locations',
    summary:
      'Default locations route common operational purposes such as putaway, picking, returns, QC, staging, and scrap to the right endpoints.',
    steps: [
      { title: 'Map each purpose to an eligible location', description: 'Defaults should point to active locations whose purpose and operational profile match the intended use.' },
      { title: 'Prefer purpose-specific endpoints', description: 'Avoid broad catch-all defaults when dedicated returns, QC, or staging locations exist.' },
      { title: 'Review downstream routing behavior', description: 'Defaults influence where work starts when a transaction or warehouse action does not specify a location explicitly.' },
    ],
    tips: [
      'Keep default routing simple and operationally predictable.',
      'Review defaults again after changing hierarchy or location purpose design.',
    ],
    commonMistakes: [
      'Assigning a default to an inactive or inventory-disallowed location.',
      'Using one location for every purpose without checking process separation needs.',
    ],
    relatedTopics: ['warehouse-locations'],
  },
  {
    id: 'warehouse-stock-governance',
    title: 'Warehouse Stock Governance',
    summary:
      'Stock governance defines how reservation, allocation, availability, movement, and commitment states are interpreted and validated.',
    steps: [
      { title: 'Keep state concepts separate', description: 'Stock Availability Status, Movement State, and Commitment State represent different meanings and should not be merged.' },
      { title: 'Set reservation and allocation rules deliberately', description: 'Reservation protects quantity, while allocation locks source scope.' },
      { title: 'Validate operational consequences', description: 'Picking, overrides, and source selection should all respect reservation and allocation constraints.' },
    ],
    tips: [
      'Use governance text that operations teams can explain back during issue review.',
      'Check how blocked picking or putaway states interact with commitment and movement states.',
    ],
    commonMistakes: [
      'Using Reserved, Allocated, Picked, or Packed as if they were stock availability values.',
      'Assuming allocation and reservation mean the same thing.',
    ],
    relatedTopics: ['warehouse-picking', 'warehouse-item-eligibility'],
  },
  {
    id: 'warehouse-cycle-count',
    title: 'Warehouse Cycle Count Policy',
    summary:
      'Cycle count policy controls whether the warehouse participates in periodic counting, how often counting happens, and the tolerance used for variance governance.',
    steps: [
      { title: 'Enable counting only where operations are ready', description: 'Cycle count policy should reflect real counting cadence and resourcing.' },
      { title: 'Choose the right frequency and tolerance', description: 'Set cadence and tolerance values that are strict enough for control but realistic for execution.' },
      { title: 'Review impact on audit and exceptions', description: 'Variance handling and count review should align with governance expectations.' },
    ],
    tips: [
      'Start with a practical tolerance and tighten it after process maturity improves.',
      'Frequency should match stock criticality, movement volume, and audit expectation.',
    ],
    commonMistakes: [
      'Enabling cycle count without agreeing on operational ownership.',
      'Using an unrealistically low tolerance that floods the team with exceptions.',
    ],
    relatedTopics: ['warehouse-stock-governance'],
  },
  {
    id: 'warehouse-import',
    title: 'Warehouse Import Workflow',
    summary:
      'Warehouse import is a governed workflow with validation, change review, duplicate-submission protection, controlled approval, and final result tracking.',
    steps: [
      { title: 'Select the entity type and template version', description: 'Always validate against the intended template version before reviewing records.' },
      { title: 'Upload and validate before commit', description: 'Validate Only does not mutate data. Derived fields are rejected and commit always revalidates.' },
      { title: 'Review errors, warnings, and change counts', description: 'Check create, update, unchanged, valid, warning, and error counts before submitting.' },
      { title: 'Capture reason and approval where required', description: 'Controlled changes require reason capture and may route for approval instead of direct mutation.' },
    ],
    tips: [
      'Use idempotency and file-hash review to avoid duplicate submissions.',
      'Download the error file when available so record-level issues can be corrected offline.',
    ],
    commonMistakes: [
      'Trying to import derived fields such as computed path or derived inventory flags.',
      'Submitting without regenerating validation after the source file changes.',
    ],
    relatedTopics: ['warehouse-audit', 'warehouse-locations'],
  },
  {
    id: 'warehouse-activation',
    title: 'Warehouse Activation Review',
    summary:
      'Activation is blocked until every required identity, ownership, inventory model, structure, and permission check passes with an actionable reason.',
    steps: [
      { title: 'Use the review step as the final blocker list', description: 'Every failed check should explain what is missing and where to fix it.' },
      { title: 'Follow section links instead of guessing', description: 'Use the fix action to jump directly to the step or configuration area that needs attention.' },
      { title: 'Activate only when the warehouse is truly ready', description: 'Do not treat Draft save as a successful go-live substitute.' },
    ],
    tips: [
      'Warehouse-Level activation is simpler because hierarchy and BIN endpoints are not required.',
      'BIN-level activation usually fails on hierarchy or inventory endpoint readiness first, so clear those early.',
    ],
    commonMistakes: [
      'Trying to activate with no active hierarchy template in BIN-level mode.',
      'Ignoring permission or ownership blockers and focusing only on form completeness.',
    ],
    relatedTopics: ['warehouse-create', 'warehouse-master-overview'],
  },
  {
    id: 'warehouse-audit',
    title: 'Warehouse Audit Trail',
    summary:
      'The audit page shows field-level changes, controlled actions, approvals, imports, correlation IDs, and version information so warehouse governance can be reconstructed end to end.',
    steps: [
      { title: 'Filter by action, entity, or search text', description: 'Use action and entity filters to narrow the audit trail to the exact governance event you need.' },
      { title: 'Review correlation and version context', description: 'Correlation IDs, reference IDs, and record versions help connect a change to its upstream workflow.' },
      { title: 'Inspect field-level changes and reason capture', description: 'Use the event detail to understand what changed, who changed it, and why the action was approved or submitted.' },
    ],
    tips: [
      'Audit becomes more useful when controlled actions always capture a clear explanation, not just a code.',
      'Import and bulk events are easier to trace when the same correlation or reference ID is reused consistently.',
    ],
    commonMistakes: [
      'Reading only status changes and missing the underlying field-level differences.',
      'Ignoring approval route and effective date context when reviewing governance actions.',
    ],
    relatedTopics: ['warehouse-import', 'warehouse-stock-governance'],
  },
];

export function getHelpTopic(topicId?: string): HelpTopic | undefined {
  if (!topicId) return undefined;
  return helpTopics.find((topic) => topic.id === topicId);
}
