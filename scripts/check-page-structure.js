/**
 * check-page-structure.js
 *
 * Verifies that admin pages follow the approved structural conventions:
 *
 *   1. Every admin page file imports PageHeader or AdminConfigShell (no custom
 *      one-off headers).
 *   2. Every admin master page wires up a helpTopicId (help is mandatory for
 *      config pages).
 *   3. No file outside the approved location redefines a protected shell
 *      component (GlobalHeader, SmartSidebar, AdminShell).
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ─── Files that are intentionally not pages ───────────────────────────────────
// These are shells, nav config, or storage utilities — not rendered pages.
const SKIP_FILES = new Set([
  'AdminShell.tsx',
  'AdminSidebar.tsx',
]);

// ─── Patterns that confirm the file uses an approved page shell ───────────────
const SHELL_PATTERNS = [
  /import\s+\{[^}]*PageHeader[^}]*\}\s+from/,
  /import\s+\{[^}]*AdminConfigShell[^}]*\}\s+from/,
  /import\s+\{[^}]*AdminPageShell[^}]*\}\s+from/,
  /import\s+\{[^}]*AdminListPageShell[^}]*\}\s+from/,
  /<PageHeader[\s/]/,
  /<AdminConfigShell[\s/]/,
  /<AdminPageShell[\s/]/,
  /<AdminListPageShell[\s/]/,
];

// ─── Help wiring pattern ──────────────────────────────────────────────────────
// Admin master pages must contain `helpTopicId` to wire the help drawer.
const HELP_WIRED_PATTERN = /helpTopicId/;

// ─── Protected component names ────────────────────────────────────────────────
// These are the canonical implementations. Any redefinition outside the allowed
// path is flagged — it means a one-off duplicate was created.
const PROTECTED_COMPONENTS = [
  {
    name: 'GlobalHeader',
    allowedPrefix: 'src/experience/components/GlobalHeader',
  },
  {
    name: 'SmartSidebar',
    allowedPrefix: 'src/experience/components/SmartSidebar',
  },
  {
    name: 'AdminShell',
    allowedPrefix: 'src/admin/AdminShell',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    fs.statSync(full).isDirectory() ? walk(full, results) : results.push(full);
  }
  return results;
}

function toForwardSlash(p) {
  return p.replace(/\\/g, '/');
}

// ─── Check 1: Admin page files use an approved shell ─────────────────────────

const failures = [];
const adminDir = path.join(ROOT, 'src/admin');

if (fs.existsSync(adminDir)) {
  const topLevelPages = fs
    .readdirSync(adminDir)
    .filter((f) => f.endsWith('.tsx') && !SKIP_FILES.has(f));

  for (const file of topLevelPages) {
    const content = fs.readFileSync(path.join(adminDir, file), 'utf8');
    const usesShell = SHELL_PATTERNS.some((p) => p.test(content));
    if (!usesShell) {
      failures.push(
        `src/admin/${file}: does not import PageHeader or AdminConfigShell — use an approved page shell`,
      );
    }
  }
}

// ─── Check 2: Admin master pages wire a help topic ───────────────────────────

const mastersDir = path.join(ROOT, 'src/admin/masters');

if (fs.existsSync(mastersDir)) {
  const masterFiles = fs
    .readdirSync(mastersDir)
    .filter((f) => f.endsWith('.tsx'));

  for (const file of masterFiles) {
    const content = fs.readFileSync(path.join(mastersDir, file), 'utf8');
    if (!HELP_WIRED_PATTERN.test(content)) {
      failures.push(
        `src/admin/masters/${file}: no helpTopicId found — admin master pages must wire up a help topic`,
      );
    }
  }
}

// ─── Check 3: Protected components not redefined outside approved paths ────────

const allTsxFiles = walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.tsx'));

for (const { name, allowedPrefix } of PROTECTED_COMPONENTS) {
  // Match export function, export const, or plain function declaration
  const defPattern = new RegExp(
    `(export\\s+(default\\s+)?(function|const)\\s+${name}\\b|^function\\s+${name}\\s*\\()`,
    'm',
  );
  const normalizedAllowed = toForwardSlash(allowedPrefix);

  for (const file of allTsxFiles) {
    const rel = toForwardSlash(path.relative(ROOT, file));
    if (rel.startsWith(normalizedAllowed)) continue; // approved location
    const content = fs.readFileSync(file, 'utf8');
    if (defPattern.test(content)) {
      failures.push(
        `${rel}: defines "${name}" outside its approved location (${allowedPrefix})`,
      );
    }
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

if (failures.length) {
  console.error(`✗ Page structure violations (${failures.length}):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('✓ Page structure check passed.');
