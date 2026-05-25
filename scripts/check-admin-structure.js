/**
 * check-admin-structure.js
 *
 * Enforces structural rules specific to the admin area:
 *
 *   1. No admin page imports both AdminPageShell AND PageHeader (duplicate header).
 *      AdminPageShell already renders PageHeader internally — importing both is a
 *      sign that a manual header was left in.
 *
 *   2. CommandPalette is rendered only inside AdminShell.tsx (no page-level duplicate).
 *      Admin page components must never render <CommandPalette — AdminShell owns it.
 *
 *   3. MasterListPage.tsx and MasterFormPage.tsx (the generic page shells) must use
 *      AdminPageShell. These files are the default experience for all generic masters
 *      and must follow the approved shell.
 *
 *   4. No file in src/admin/masters/ still imports AdminConfigShell.
 *      All specialized master pages have been migrated to AdminPageShell. Any file
 *      still importing AdminConfigShell is migration residue and must be cleaned up.
 *
 *   5. (WARN) Specialised list pages should use AdminListPageShell.
 *      A file in src/admin/masters/ that implements a list view (has renderList) but
 *      still uses AdminPageShell without AdminListPageShell generates a warning.
 *      This is a warning, not a failure, to allow incremental migration.
 *
 *   6. (WARN) No placeholder content.
 *      Files containing known placeholder strings in JSX context signal unfinished
 *      work that is not production-ready.
 *
 * Severity model:
 *   FAILURE — process.exit(1), blocks governance.
 *   WARNING — printed to stdout, does NOT block governance.
 *             Used for soft quality issues that are worth flagging but not blocking.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readTsx(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

function toRel(full) {
  return full.replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/') + '/', '');
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

// Import pattern for AdminPageShell
const IMPORTS_ADMIN_PAGE_SHELL = /import\s+\{[^}]*AdminPageShell[^}]*\}\s+from/;
// Import pattern for AdminListPageShell
const IMPORTS_ADMIN_LIST_PAGE_SHELL = /import\s+\{[^}]*AdminListPageShell[^}]*\}\s+from/;
// Import pattern for PageHeader (from experience layer)
const IMPORTS_PAGE_HEADER = /import\s+\{[^}]*PageHeader[^}]*\}\s+from\s+['"][^'"]*experience[^'"]*['"]/;
// JSX usage of CommandPalette
const RENDERS_COMMAND_PALETTE = /<CommandPalette[\s/]/;
// Import of AdminConfigShell
const IMPORTS_ADMIN_CONFIG_SHELL = /import\s+\{[^}]*AdminConfigShell[^}]*\}\s+from/;
// Presence of a renderList function — marks a file as having a list view
const HAS_RENDER_LIST = /const\s+renderList\s*=/;
// Placeholder content patterns
const PLACEHOLDER_PATTERNS = [
  /["'`]Help coming soon["'`]/,
  /["'`]Coming soon["'`]/i,
  /helpTopicId["'`\s]*:\s*["'`]placeholder["'`]/i,
  />\s*TODO\s*</,
  />\s*Placeholder\s*</i,
];

// ─── Files to skip for certain checks ────────────────────────────────────────

// These files are infrastructure, not pages.
const SKIP_DUPLICATES_CHECK = new Set([
  'AdminShell.tsx',
  'AdminSidebar.tsx',
  'adminNavConfig.ts',
  'adminStorage.ts',
]);

// CommandPalette is approved only in AdminShell.tsx
const COMMAND_PALETTE_APPROVED_FILE = 'AdminShell.tsx';

// ─── Collect files ────────────────────────────────────────────────────────────

const adminDir   = path.join(ROOT, 'src', 'admin');
const mastersDir = path.join(ROOT, 'src', 'admin', 'masters');

const failures = [];
const warnings = [];

// ─── Check 1: No page imports both AdminPageShell and PageHeader ──────────────

if (fs.existsSync(adminDir)) {
  const allAdminTsx = walk(adminDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

  for (const file of allAdminTsx) {
    const filename = path.basename(file);
    if (SKIP_DUPLICATES_CHECK.has(filename)) continue;

    const content = fs.readFileSync(file, 'utf8');

    if (IMPORTS_ADMIN_PAGE_SHELL.test(content) && IMPORTS_PAGE_HEADER.test(content)) {
      failures.push(
        `${toRel(file)}: imports both AdminPageShell and PageHeader — AdminPageShell ` +
        `already renders PageHeader internally. Remove the PageHeader import and any ` +
        `direct <PageHeader usage from this file.`,
      );
    }
  }
}

// ─── Check 2: CommandPalette only rendered in AdminShell.tsx ─────────────────

if (fs.existsSync(adminDir)) {
  const allAdminTsx = walk(adminDir).filter((f) => f.endsWith('.tsx'));

  for (const file of allAdminTsx) {
    if (path.basename(file) === COMMAND_PALETTE_APPROVED_FILE) continue;

    const content = fs.readFileSync(file, 'utf8');

    if (RENDERS_COMMAND_PALETTE.test(content)) {
      failures.push(
        `${toRel(file)}: renders <CommandPalette outside AdminShell.tsx — ` +
        `AdminShell is the only approved location for CommandPalette. Remove the ` +
        `CommandPalette render from this file.`,
      );
    }
  }
}

// ─── Check 3: MasterListPage uses AdminListPageShell, MasterFormPage uses AdminPageShell ──────

const masterPageShellChecks = [
  { file: 'MasterListPage.tsx', pattern: IMPORTS_ADMIN_LIST_PAGE_SHELL, shell: 'AdminListPageShell' },
  { file: 'MasterFormPage.tsx', pattern: IMPORTS_ADMIN_PAGE_SHELL,      shell: 'AdminPageShell'     },
];

for (const { file, pattern, shell } of masterPageShellChecks) {
  const filePath = path.join(adminDir, file);
  const content = readTsx(filePath);

  if (content === null) {
    warnings.push(
      `src/admin/${file}: file not found — cannot verify ${shell} usage.`,
    );
    continue;
  }

  if (!pattern.test(content)) {
    failures.push(
      `src/admin/${file}: does not import ${shell} — the generic master ` +
      `pages must use the approved page shell. See docs/admin-page-structure-standard.md.`,
    );
  }
}

// ─── Check 4: No file in src/admin/masters/ still imports AdminConfigShell ────

if (fs.existsSync(mastersDir)) {
  const masterFiles = fs
    .readdirSync(mastersDir)
    .filter((f) => f.endsWith('.tsx'));

  for (const filename of masterFiles) {
    const filePath = path.join(mastersDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    if (IMPORTS_ADMIN_CONFIG_SHELL.test(content)) {
      failures.push(
        `src/admin/masters/${filename}: still imports AdminConfigShell — this file ` +
        `has not been fully migrated to AdminPageShell. Remove the AdminConfigShell ` +
        `import and replace all <AdminConfigShell usages with AdminPageShell.`,
      );
    }
  }
}

// ─── Check 5: Specialised list pages should use AdminListPageShell ─────────────
// A file in masters/ that has a renderList function but still uses AdminPageShell
// without AdminListPageShell is a candidate for migration — warn, don't fail.

if (fs.existsSync(mastersDir)) {
  const masterFiles = fs
    .readdirSync(mastersDir)
    .filter((f) => f.endsWith('.tsx'));

  for (const filename of masterFiles) {
    const filePath = path.join(mastersDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    if (
      IMPORTS_ADMIN_PAGE_SHELL.test(content) &&
      HAS_RENDER_LIST.test(content) &&
      !IMPORTS_ADMIN_LIST_PAGE_SHELL.test(content)
    ) {
      warnings.push(
        `src/admin/masters/${filename}: list view uses AdminPageShell — consider migrating ` +
        `renderList to AdminListPageShell for better vertical efficiency ` +
        `(see docs/admin-page-structure-standard.md §1a).`,
      );
    }
  }
}

// ─── Check 6: No placeholder content ─────────────────────────────────────────
// Files containing known placeholder strings are not production-ready.

if (fs.existsSync(mastersDir)) {
  const masterFiles = fs
    .readdirSync(mastersDir)
    .filter((f) => f.endsWith('.tsx'));

  for (const filename of masterFiles) {
    const filePath = path.join(mastersDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const hit = PLACEHOLDER_PATTERNS.find((p) => p.test(content));
    if (hit) {
      warnings.push(
        `src/admin/masters/${filename}: contains placeholder content — replace with real ` +
        `content before shipping (matched: ${hit}).`,
      );
    }
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

if (warnings.length) {
  console.warn(`⚠  Admin structure warnings (${warnings.length}):`);
  warnings.forEach((w) => console.warn(`   - ${w}`));
}

if (failures.length) {
  console.error(`✗ Admin structure violations (${failures.length}):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

const checkedCount = fs.existsSync(adminDir)
  ? walk(adminDir).filter((f) => f.endsWith('.tsx')).length
  : 0;

console.log(`✓ Admin structure check passed (${checkedCount} admin TSX files verified).`);
