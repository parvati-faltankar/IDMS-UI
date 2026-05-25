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
];

export function getHelpTopic(topicId?: string): HelpTopic | undefined {
  if (!topicId) return undefined;
  return helpTopics.find((topic) => topic.id === topicId);
}
