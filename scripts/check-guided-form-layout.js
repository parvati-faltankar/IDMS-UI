/**
 * check-guided-form-layout.js
 *
 * Enforces layout quality rules specific to guided workflow forms in src/admin/masters/.
 *
 * These rules prevent common regressions that waste vertical space and break
 * the "compact, guided, productivity-first" UX standard.
 *
 * Checks:
 *
 *   1. (WARN) Save Draft duplicated in header and footer.
 *      A file that passes "Save Draft" to secondaryActions AND also renders a
 *      Save Draft button elsewhere has duplicate save actions. Save Draft must
 *      live only in the footer.
 *
 *   2. (WARN) Sticky/position:sticky footer without flex-column workspace.
 *      A guided form that uses `position: 'sticky'` for its footer but does NOT
 *      have a proper `display: 'flex'` + `flexDirection: 'column'` + `overflow: 'hidden'`
 *      outer wrapper is likely producing footer-overlap bugs. Prefer flex-column
 *      container with a `flexShrink: 0` footer.
 *
 *   3. (WARN) Large disabled/locked auto-generated field (e.g. Policy Code).
 *      A guided form that renders a full-width input component for a policyCode
 *      or auto-generated code with a `disabled` or `locked` prop should use a
 *      compact metadata row instead.
 *
 *   4. (WARN) Guided form uses full PageHeader via AdminPageShell + large toolbar.
 *      A file that renders a guided step workflow (has CGP_FORM_STEPS or similar)
 *      AND passes its step nav as a `toolbar` prop to AdminPageShell is using the
 *      old tall-header pattern. Use a compact form workspace shell instead.
 *
 *   5. (WARN) Guided form with Activate button but no activation confirmation dialog.
 *      A file that has an Activate-labelled button inside renderForm but does not
 *      define a renderActivateConfirm function is missing the confirmation safety net.
 *
 *   6. (WARN) Guided renderForm has no footer action bar.
 *      A file with renderForm defined but no footer-style flex container (flexShrink: 0,
 *      height: '60px') inside that function likely has a missing action bar.
 *
 * Severity model:
 *   FAILURE — process.exit(1), blocks governance.
 *   WARNING — printed to stdout, does NOT block governance.
 *             Used for soft quality issues that are worth flagging but not blocking.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const mastersDir = path.join(ROOT, 'src', 'admin', 'masters');

const warnings = [];

function toRel(full) {
  return full.replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/') + '/', '');
}

if (!fs.existsSync(mastersDir)) {
  console.log('check-guided-form-layout: src/admin/masters/ not found, skipping.');
  process.exit(0);
}

const masterFiles = fs.readdirSync(mastersDir).filter((f) => f.endsWith('.tsx'));

for (const filename of masterFiles) {
  const filePath = path.join(mastersDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const rel = `src/admin/masters/${filename}`;

  // ── Check 1: Save Draft duplicated in header secondaryActions and footer ──
  // Pattern A: secondaryActions array contains 'Save Draft'
  const hasSaveDraftInSecondaryActions =
    /secondaryActions\s*=\s*\{?\s*\[[\s\S]{0,300}Save Draft/.test(content);
  // Pattern B: a footer button renders 'Save Draft' (outside of secondaryActions)
  // We look for 'Save Draft' appearing at least twice, which strongly suggests duplication
  const saveDraftMatches = (content.match(/Save Draft/g) || []).length;
  if (hasSaveDraftInSecondaryActions && saveDraftMatches > 1) {
    warnings.push(
      `${rel}: "Save Draft" appears in secondaryActions (header) and likely also in the ` +
      `footer. Remove it from secondaryActions — it belongs only in the footer action bar.`,
    );
  }

  // ── Check 2: Sticky footer without flex-column workspace ──────────────────
  // A guided form (has renderForm) using position:'sticky' for footer without
  // a flex-column overflow:hidden outer container is the old problematic pattern.
  const hasRenderForm = /const\s+renderForm\s*=/.test(content);
  const hasStickyFooter = /position:\s*['"]sticky['"]/.test(content);
  const hasFlexColumnWorkspace =
    /display:\s*['"]flex['"][\s\S]{0,80}flexDirection:\s*['"]column['"]/.test(content) &&
    /overflow:\s*['"]hidden['"]/.test(content);

  if (hasRenderForm && hasStickyFooter && !hasFlexColumnWorkspace) {
    warnings.push(
      `${rel}: guided form uses \`position: 'sticky'\` for footer but lacks a ` +
      `flex-column + overflow:hidden outer workspace container. This can cause ` +
      `footer overlap. Use a flex-column workspace with \`flexShrink: 0\` footer instead ` +
      `(see docs/admin-page-structure-standard.md §3).`,
    );
  }

  // ── Check 3: Large disabled/locked input for auto-generated code ──────────
  // Pattern: FInput or similar with locked/disabled prop referencing policyCode
  // Look for a disabled or locked FInput field that likely renders an auto-generated code
  const hasLargeLockedCodeInput =
    /FInput[\s\S]{0,60}(disabled|locked)[\s\S]{0,60}(policyCode|autoCode|generatedCode|codeValue)/.test(content) ||
    /(policyCode|autoCode|generatedCode)[\s\S]{0,60}FInput[\s\S]{0,60}(disabled|locked)/.test(content);

  if (hasLargeLockedCodeInput) {
    warnings.push(
      `${rel}: renders a full-width input (FInput) for an auto-generated code field ` +
      `with a locked/disabled state. Use a compact metadata row instead — e.g. ` +
      `"Policy Code: AUTO · Generated on first save" (see docs/admin-page-structure-standard.md §3).`,
    );
  }

  // ── Check 4: Guided step form still uses AdminPageShell toolbar pattern ───
  // A file with a multi-step workflow passed as `toolbar` prop to AdminPageShell
  // should be migrated to the compact form workspace layout.
  const hasFormSteps =
    /CGP_FORM_STEPS|FORM_STEPS|formSteps|stepNav/.test(content) &&
    /const\s+renderForm\s*=/.test(content);
  const usesAdminPageShellToolbarProp =
    /import\s+\{[^}]*AdminPageShell[^}]*\}/.test(content) &&
    /toolbar\s*=\s*\{/.test(content);

  if (hasFormSteps && usesAdminPageShellToolbarProp) {
    warnings.push(
      `${rel}: multi-step guided form passes step navigation as \`toolbar\` prop to ` +
      `AdminPageShell. This produces a tall header+toolbar area (~220px+). ` +
      `Migrate to the compact form workspace layout with inline workflow bar ` +
      `(see docs/admin-page-structure-standard.md §10).`,
    );
  }

  // ── Check 5: Activate button without activation confirmation dialog ────────
  // A file that renders an "Activate" or "Activate Policy" button inside renderForm
  // but has no renderActivateConfirm function is missing the confirmation safety net.
  const hasActivateButton =
    hasRenderForm &&
    /Activate\s+(Policy|Record|this)?\s*['"<]/.test(content) ||
    (hasRenderForm && /label:\s*['"]Activate/.test(content));
  const hasActivateConfirm = /renderActivateConfirm|activateConfirmOpen/.test(content);

  if (hasRenderForm && hasActivateButton && !hasActivateConfirm) {
    warnings.push(
      `${rel}: guided form has an Activate button but no activation confirmation dialog ` +
      `(renderActivateConfirm / activateConfirmOpen not found). ` +
      `Add a confirmation dialog with a policy summary grid and consequence warning ` +
      `before activating (see docs/admin-page-structure-standard.md §10f).`,
    );
  }

  // ── Check 6: renderForm with no footer action bar ─────────────────────────
  // A guided form renderForm should include a fixed footer (flexShrink + height:60px).
  // If none is found, the form likely has no action bar at the bottom.
  const hasFooterInForm =
    /flexShrink:\s*0[\s\S]{0,120}height:\s*['"]60px['"]/.test(content) ||
    /height:\s*['"]60px['"][\s\S]{0,120}flexShrink:\s*0/.test(content);

  if (hasRenderForm && !hasFooterInForm) {
    warnings.push(
      `${rel}: guided form renderForm appears to have no fixed footer action bar ` +
      `(no \`flexShrink: 0\` + \`height: '60px'\` combination found). ` +
      `Add a fixed footer flex-child with Previous/Save Draft/Continue/Activate actions ` +
      `(see docs/admin-page-structure-standard.md §10a).`,
    );
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

if (warnings.length) {
  console.warn(`\n⚠  Guided form layout warnings (${warnings.length}):`);
  warnings.forEach((w) => console.warn(`   - ${w}`));
} else {
  console.log('✓ Guided form layout checks passed.');
}

// Warnings do not block governance — exit 0
process.exit(0);
