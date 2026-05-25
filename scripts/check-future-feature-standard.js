import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_DOCS = [
  'docs/ui-experience-constitution.md',
  'docs/future-feature-standard.md',
  'docs/ui-audit-checklist.md',
  'docs/component-contracts.md',
  // Admin structure docs — required so AI tools and developers can find the
  // authoritative guide before building any new admin master or page.
  'docs/admin-page-structure-standard.md',
  'docs/admin-master-factory.md',
];

// ─── Required section headings ────────────────────────────────────────────────
// Each section must be present as a heading in the doc.
const REQUIRED_SECTIONS = {
  'docs/future-feature-standard.md': [
    '## Feature gate checklist',
    '## Before implementation',
    '## During implementation',
    '## After implementation',
    '## Acceptance checklist',
    '## Table design checklist',
  ],
  'docs/ui-audit-checklist.md': [
    '## New feature gate',
  ],
  'docs/admin-page-structure-standard.md': [
    '## 1. Two approved admin page shell types',
    '## 2a. Vertical efficiency rules for list pages',
    '## 3. When to use this default structure',
    '## 4. When tabs or section switchers are allowed',
    '## 7. Smart Admin Table Standard',
  ],
  'docs/admin-master-factory.md': [
    '## 1. How to add a new generic admin master',
    '## 2. How to add a new specialised admin master',
    '## 6. Generator',
    '## 7. Smart Column Design',
  ],
};

// ─── Required checklist items ─────────────────────────────────────────────────
// Verify that the gate checklist explicitly covers all 10 required definitions.
// Each entry is a keyword that must appear in future-feature-standard.md.
const REQUIRED_CHECKLIST_KEYWORDS = [
  'UX intent',
  'Route placement',
  'Page shell',
  'Reused components',
  'Help topic',
  'Empty state',
  'Loading state',
  'Error state',
  'Storybook stor',         // matches "Storybook story" and "Storybook stories"
  'Governance',
  // Admin-specific cross-references — future-feature-standard.md must link to both
  // admin structure guides so developers see them before implementing any admin page.
  'admin-page-structure-standard',
  'admin-master-factory',
  // Smart table checklist — future admin list pages must address these design decisions.
  'Table design checklist',
  'Table intent',
  'Smart column',
  'Preview drawer strategy',
  'Row action strategy',
];

// ─── Doc existence check ──────────────────────────────────────────────────────

const missing = REQUIRED_DOCS.filter((file) => !fs.existsSync(path.join(ROOT, file)));

if (missing.length) {
  console.error(`✗ Missing governance docs (${missing.length}):`);
  missing.forEach((file) => console.error(`  - ${file}`));
  process.exit(1);
}

// ─── Section heading check ────────────────────────────────────────────────────

const contentFailures = [];

for (const [docPath, sections] of Object.entries(REQUIRED_SECTIONS)) {
  const content = fs.readFileSync(path.join(ROOT, docPath), 'utf8');
  const missingSections = sections.filter((s) => !content.includes(s));
  if (missingSections.length) {
    missingSections.forEach((s) => contentFailures.push(`${docPath}: missing section "${s}"`));
  }
}

// ─── Checklist keyword check ──────────────────────────────────────────────────

const standardContent = fs.readFileSync(
  path.join(ROOT, 'docs/future-feature-standard.md'),
  'utf8',
);
const missingKeywords = REQUIRED_CHECKLIST_KEYWORDS.filter(
  (kw) => !standardContent.includes(kw),
);
if (missingKeywords.length) {
  missingKeywords.forEach((kw) =>
    contentFailures.push(`docs/future-feature-standard.md: feature gate checklist missing "${kw}"`),
  );
}

if (contentFailures.length) {
  console.error(`✗ Governance doc content violations (${contentFailures.length}):`);
  contentFailures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`✓ Future feature governance check passed (${REQUIRED_DOCS.length} docs verified).`);

