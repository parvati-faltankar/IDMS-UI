/**
 * check-drawer-usage.js
 *
 * Governance check for smart drawer usage in admin pages.
 * Warns when admin list pages do not follow the drawer usage standard.
 * See docs/admin-drawer-usage-standard.md for the full standard.
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import path from 'node:path';

const ADMIN_MASTERS = globSync('src/admin/masters/*.tsx');
const ADMIN_ROOT    = globSync('src/admin/*.tsx').filter(f => !f.includes('AdminShell'));

const ALL_ADMIN = [...ADMIN_MASTERS, ...ADMIN_ROOT];

const warnings = [];

// ─── Helper ────────────────────────────────────────────────────────────────────

function readFile(filePath) {
  return readFileSync(filePath, 'utf-8');
}

function rel(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

// ─── Check 1: List page row click navigates instead of opening a drawer ────────
//
// An admin list page (uses AdminListPageShell + has onClick navigate) should offer
// a preview drawer for view-only row interactions. If the page has both:
//   1. AdminListPageShell usage
//   2. A row onClick that calls navigate() with a record ID
//   3. No preview drawer state (previewOpen / previewPolicy / SmartPreviewDrawer)
// then warn.

for (const file of ALL_ADMIN) {
  const src = readFile(file);
  const hasListShell = src.includes('AdminListPageShell');
  if (!hasListShell) continue;

  // Look for onClick navigate patterns to record-level routes
  // e.g.  onClick={() => navigate(`/admin/master/${masterKey}/${record.id}`)}
  const hasNavigateOnRowClick = /onClick\s*=\s*\{[^}]*navigate\([^)]*record[^)]*\)\s*\}/.test(src);
  if (!hasNavigateOnRowClick) continue;

  // Does the page have any preview drawer mechanism?
  const hasPreviewDrawer =
    src.includes('SmartPreviewDrawer') ||
    src.includes('previewOpen') ||
    src.includes('previewPolicy') ||
    src.includes('previewRecord') ||
    src.includes('renderPreviewDrawer');

  if (!hasPreviewDrawer) {
    warnings.push(
      `${rel(file)}: list page row onClick navigates to full page for view-only details. ` +
      `Consider adding a SmartPreviewDrawer — see docs/admin-drawer-usage-standard.md §2a.`,
    );
  }
}

// ─── Check 2: Custom inline drawer (position: fixed panel) with no overflowY ──
//
// Bespoke preview drawers (using position:fixed div as a slide-in panel) must have
// overflowY: 'auto' on the body region, otherwise content clips on small screens.

for (const file of ALL_ADMIN) {
  const src = readFile(file);

  // Detect a bespoke fixed-position drawer panel (must have a drawer-sized width ≥ 200px)
  const hasFixedDrawerPanel =
    /position:\s*['"]?fixed['"]?/.test(src) &&
    /width:\s*['"]?([2-9]\d{2}|\d{4})px['"]?/.test(src) &&
    (/right:\s*0/.test(src) || /right:\s*['"]0['"]/.test(src));

  if (!hasFixedDrawerPanel) continue;

  // Check that it has overflowY: 'auto' somewhere in the body region
  const hasOverflowY = /overflowY:\s*['"]auto['"]/.test(src);

  if (!hasOverflowY) {
    warnings.push(
      `${rel(file)}: custom inline drawer panel detected but no overflowY: 'auto' found. ` +
      `Add overflow scrolling to the drawer body — see docs/admin-drawer-usage-standard.md §4.`,
    );
  }
}

// ─── Check 3: SmartDrawer/SmartPreviewDrawer/SmartFormDrawer used without close btn
//
// Any component file that imports SmartDrawer but doesn't include a close mechanism
// is a structural violation.  (SmartDrawer itself has the close button built in —
// this check targets one-off custom drawer wrappers that may bypass it.)

const COMPONENT_FILES = globSync('src/experience/components/**/*.tsx');

for (const file of COMPONENT_FILES) {
  const src = readFile(file);

  // Only check files that render a drawer but are not the canonical SmartDrawer itself
  const isCanonical =
    file.endsWith('SmartDrawer.tsx') ||
    file.endsWith('SmartPreviewDrawer.tsx') ||
    file.endsWith('SmartFormDrawer.tsx') ||
    file.endsWith('SmartReviewDrawer.tsx');
  if (isCanonical) continue;

  const hasDrawerUsage =
    src.includes('<SmartDrawer') ||
    src.includes('<SmartPreviewDrawer') ||
    src.includes('<SmartFormDrawer') ||
    src.includes('<AppDrawer') ||
    (src.includes('position: \'fixed\'') && src.includes('role="dialog"'));

  if (!hasDrawerUsage) continue;

  const hasCloseButton =
    src.includes('aria-label="Close"') ||
    src.includes("aria-label='Close'") ||
    src.includes('onClose');

  if (!hasCloseButton) {
    warnings.push(
      `${rel(file)}: drawer component detected but no close button (aria-label="Close" or onClose prop). ` +
      `See docs/admin-drawer-usage-standard.md §4.`,
    );
  }
}

// ─── Report ────────────────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.warn(`⚠  Drawer usage warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.warn(`   - ${w}`);
  }
} else {
  console.log('✔ Drawer usage check passed.');
}

// Warnings are advisory — governance does not fail on warnings.
process.exit(0);
