/**
 * Admin setup guides: setup sequence, lifecycle states, and common mistakes.
 * Used by AdminDashboard and help surfaces — not placed directly in forms.
 */

export type AdminGuideStep = {
  order: number;
  /** Human-readable master name for display. */
  master: string;
  /** Nav key used to link to the master page. */
  masterKey: string;
  /** Route path for navigation. */
  path: string;
  /** Why this step must come before the next one. */
  reason: string;
};

export type AdminGuide = {
  id: string;
  title: string;
  summary: string;
  steps?: AdminGuideStep[];
  tips?: string[];
  warnings?: string[];
};

export const adminGuides: AdminGuide[] = [
  {
    id: 'setup-sequence',
    title: 'Recommended Setup Sequence',
    summary:
      'Follow this order to avoid configuration dependencies causing activation failures or empty dropdowns during go-live.',
    steps: [
      {
        order: 1,
        master: 'Organisation Master',
        masterKey: 'organisation-master',
        path: '/admin/master/organisation-master',
        reason:
          'Foundation of all configuration. Legal entity details, financial year, and tax identifiers must be in place before anything else.',
      },
      {
        order: 2,
        master: 'Location Setup',
        masterKey: 'country-master',
        path: '/admin/master/country-master',
        reason:
          'Address fields, KYC country-wise rules, and branch location references all depend on country and region records.',
      },
      {
        order: 3,
        master: 'Picklist Configuration',
        masterKey: 'picklist-master',
        path: '/admin/master/picklist-master',
        reason:
          'All dropdown values used in forms must exist and be active before users open any transaction or master form.',
      },
      {
        order: 4,
        master: 'Numbering & Code Setup',
        masterKey: 'numbering-code-setup',
        path: '/admin/master/numbering-code-setup',
        reason:
          'Document and entity codes must be configured and active before any transaction is created. Cannot be changed retroactively.',
      },
      {
        order: 5,
        master: 'KYC Setup',
        masterKey: 'kyc-setup',
        path: '/admin/master/kyc-setup',
        reason:
          'Proof requirements must be defined and active before onboarding customers, suppliers, or partners.',
      },
      {
        order: 6,
        master: 'User Roles & Access',
        masterKey: 'role-master',
        path: '/admin/master/role-master',
        reason:
          'Access controls and approval hierarchies should be finalised before business users are given access to transaction screens.',
      },
    ],
    tips: [
      'Complete each step fully before moving to the next — partial configuration causes dependency errors.',
      'Use Save as Draft to stage incomplete records and return later.',
      'Test with a sample transaction before allowing business users in.',
    ],
  },
  {
    id: 'lifecycle-states',
    title: 'Draft, Active, and Inactive Explained',
    summary:
      'Every admin master record moves through three lifecycle states. Understanding these states prevents configuration mistakes that block transactions or cause empty dropdowns at go-live.',
    steps: [
      {
        order: 1,
        master: 'Draft',
        masterKey: '',
        path: '',
        reason:
          'The record is saved but not yet published. Changes can be made freely at any time. Draft records are invisible to transaction forms, dropdowns, code generation, and validation rules. Use Draft to stage configuration before a planned go-live.',
      },
      {
        order: 2,
        master: 'Active',
        masterKey: '',
        path: '',
        reason:
          'The record is published and available for use system-wide. It appears in form dropdowns, triggers validation rules, and is used for code generation. Changes to Active records immediately affect live transactions — always test the impact before editing.',
      },
      {
        order: 3,
        master: 'Inactive',
        masterKey: '',
        path: '',
        reason:
          'The record is disabled but its history and references are preserved. Hidden from all dropdowns — no new transactions can reference it. Existing transactions that already reference the record continue to display the value but cannot be updated to use it again.',
      },
    ],
    tips: [
      'Keep at least one active record per required category to avoid validation failures in transaction forms.',
      'Activate only after all validation checklist items are resolved.',
      'Use Draft to stage configuration ahead of a planned go-live date.',
      'Activate one record at a time and test with a sample transaction before activating the full set.',
    ],
    warnings: [
      'Inactivating a master that is referenced in open or pending transactions will block those transactions from progressing.',
      'Active numbering policies cannot have their prefix or series type changed — deactivate and create a new policy instead.',
      'You cannot delete a record that has ever been used in a transaction — deactivate it and archive the reference.',
      'Active picklist values that are removed from a list still appear on existing transaction records — coordinate any value changes with the business team.',
    ],
  },
  {
    id: 'common-mistakes',
    title: 'Common Configuration Mistakes',
    summary:
      'These setup errors frequently cause support issues after go-live. Review this list before activating your configuration.',
    tips: [
      'Creating transaction documents before numbering policies are active — codes are not assigned and cannot be backfilled.',
      'Skipping picklist setup — users encounter empty dropdowns in transaction forms and cannot proceed.',
      'Activating code generation policies without first activating the selected prefix.',
      'Configuring KYC rules but leaving individual proof rows in Draft — runtime validation does not apply inactive rows.',
      'Using the same prefix for multiple entity types — causes numbering conflicts when both entities are used in the same period.',
      'Not setting a reset frequency — the sequence grows indefinitely and does not align with annual audit numbering conventions.',
      'Uploading the organisation logo after the first print run — early invoices are printed without branding and cannot be reprinted with a different number.',
      'Configuring number consumption as OnSave when transaction volumes are high — gaps appear from abandoned drafts.',
    ],
  },
];

/**
 * Returns a guide by its ID, or undefined if not found.
 */
export function getAdminGuide(id: string): AdminGuide | undefined {
  return adminGuides.find((g) => g.id === id);
}
