/**
 * check-admin-table-design.js
 *
 * Scans specialised admin master pages (src/admin/masters/*.tsx) for table design
 * anti-patterns that violate the Smart Admin Table Standard
 * (docs/admin-page-structure-standard.md §7).
 *
 * This script emits WARNINGS ONLY — it always exits 0.
 * Design risks are surfaced as early feedback, not build blockers.
 * Hard failures (wrong shell, duplicate header, missing help topic) are handled
 * by check-admin-structure.js and check-help-topics.js.
 */

import fs   from 'node:fs';
import path from 'node:path';

const ROOT        = process.cwd();
const MASTERS_DIR = path.join(ROOT, 'src', 'admin', 'masters');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMastersTsxFiles() {
  if (!fs.existsSync(MASTERS_DIR)) return [];
  return fs.readdirSync(MASTERS_DIR)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => ({ file: f, fullPath: path.join(MASTERS_DIR, f) }));
}

/**
 * Count the number of column tracks in a gridTemplateColumns value.
 * Handles minmax(...) and repeat(...) as single tokens.
 */
function countGridColumns(template) {
  const tokens = template.match(/minmax\([^)]+\)|repeat\([^)]+\)|\S+/g) ?? [];
  return tokens.length;
}

// ─── Run checks ───────────────────────────────────────────────────────────────

const warnings = [];
const files    = getMastersTsxFiles();

for (const { file, fullPath } of files) {
  const rel     = path.relative(ROOT, fullPath).replace(/\\/g, '/');
  const content = fs.readFileSync(fullPath, 'utf8');

  // ── Check 1: Overly wide grid (>7 column tracks) ────────────────────────
  // A table with 8+ separate columns is a signal that fields haven't been grouped.
  const gridRegex = /gridTemplateColumns\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = gridRegex.exec(content)) !== null) {
    const colCount = countGridColumns(m[1]);
    if (colCount > 7) {
      warnings.push(
        `${rel}: table has ${colCount} columns (gridTemplateColumns '${m[1].trim()}'). ` +
        `Consider grouping into ≤5 smart columns per admin-page-structure-standard.md §7b.`,
      );
    }
  }

  // ── Check 2: Table rows without an empty state ────────────────────────────
  // Pages with a .map() rendering rows must also handle the zero-record case.
  const hasTableLayout = /gridTemplateColumns|<table\b/.test(content);
  const hasRowMap      = /\.(map)\s*\(\s*\(/.test(content);
  if (hasTableLayout && hasRowMap) {
    const hasEmptyState =
      /EmptyStateGuide/.test(content)          ||
      /length\s*===\s*0/.test(content)         ||
      /\.length\s*===\s*0/.test(content)       ||
      /No .{1,40} found/.test(content)         ||
      /no records/i.test(content);
    if (!hasEmptyState) {
      warnings.push(
        `${rel}: table page has no detectable empty state. ` +
        `Add an empty-state render when the filtered record set is empty.`,
      );
    }
  }

  // ── Check 3: More menu with no backdrop ──────────────────────────────────
  // A floating dropdown menu without a backdrop stays open when the user
  // clicks outside — a common UX defect.
  const hasMoreMenu = /openMoreMenuId|moreMenuId/.test(content);
  if (hasMoreMenu) {
    const hasBackdrop =
      /position\s*:\s*['"]fixed['"]/.test(content) ||
      /inset\s*:\s*0/.test(content);
    if (!hasBackdrop) {
      warnings.push(
        `${rel}: more menu has no backdrop div. ` +
        `Add <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={closeMenu} /> ` +
        `inside the menu conditional to close it on outside click.`,
      );
    }
  }

  // ── Check 4: Status rendering without a health signal ────────────────────
  // A page that renders a status pill but has no secondary health indicator
  // misses an opportunity to surface actionable config quality signals.
  const hasStatusRendering =
    /getStatusStyle|StatusStyle|status.*pill|\.status.*Active|Active.*\.status/i.test(content);
  const hasHealthSignal =
    /health|Health|Healthy|getPolicyHealth|getHealthIndicator|Needs Review|Draft Incomplete/i.test(content);
  if (hasStatusRendering && !hasHealthSignal) {
    warnings.push(
      `${rel}: page renders status but has no health signal. ` +
      `Consider adding a health indicator (e.g. getHealthIndicator()) below the status pill ` +
      `to surface config quality signals per admin-page-structure-standard.md §7a.`,
    );
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.log(
    `⚠  Admin table design check: ${warnings.length} design warning${warnings.length === 1 ? '' : 's'} found:`,
  );
  warnings.forEach((w) => console.log(`   • ${w}`));
} else {
  console.log(
    `✓ Admin table design check passed (${files.length} admin master file${files.length === 1 ? '' : 's'} reviewed, no anti-patterns detected).`,
  );
}

// Always exit 0 — these are design-quality warnings, not hard governance failures.
process.exit(0);
