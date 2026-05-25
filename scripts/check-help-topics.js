import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const helpFile    = path.join(ROOT, 'src', 'experience', 'help', 'helpTopics.ts');
const mastersDir  = path.join(ROOT, 'src', 'admin', 'masters');
const navConfigFile = path.join(ROOT, 'src', 'admin', 'adminNavConfig.ts');

// ─── Hard-required topics ─────────────────────────────────────────────────────
// These must appear verbatim in helpTopics.ts. Absence is a blocking failure.

const REQUIRED_TOPICS = [
  'admin-dashboard',
  'organisation-master',
  'numbering-code-setup',
  'picklist-master',
  'code-generation-policy',
  'kyc-setup',
  'generic-master-list',
  'generic-master-form',
];

// ─── Bail early if helpTopics.ts is absent ────────────────────────────────────

if (!fs.existsSync(helpFile)) {
  console.warn('⚠ src/experience/help/helpTopics.ts not yet present — skipping help topic check.');
  console.warn('  Integrate the experience package to enable this check.');
  process.exit(0);
}

const helpContent = fs.readFileSync(helpFile, 'utf8');

function topicExists(id) {
  return helpContent.includes(`id: "${id}"`) || helpContent.includes(`id: '${id}'`);
}

const failures = [];
const warnings = [];

// ─── Check 1: Hard-required topics must exist ─────────────────────────────────

const missingRequired = REQUIRED_TOPICS.filter((t) => !topicExists(t));
if (missingRequired.length) {
  missingRequired.forEach((t) =>
    failures.push(`Required help topic "${t}" not found in helpTopics.ts`),
  );
}

// ─── Check 2: Every specialized master page has a matching help topic ─────────
// Read each .tsx file in src/admin/masters/, extract the MASTER_KEY constant,
// and verify an exact help topic id exists for it.

if (fs.existsSync(mastersDir)) {
  const masterFiles = fs.readdirSync(mastersDir).filter((f) => f.endsWith('.tsx'));

  for (const filename of masterFiles) {
    const content = fs.readFileSync(path.join(mastersDir, filename), 'utf8');

    // Primary: const MASTER_KEY = '...'
    const masterKeyMatch = content.match(/const\s+MASTER_KEY\s*=\s*['"]([^'"]+)['"]/);
    // Fallback: findMasterByKey('...') — used in some pages instead of a constant
    const findKeyMatch = content.match(/findMasterByKey\(\s*['"]([^'"]+)['"]\s*\)/);

    const key = masterKeyMatch?.[1] ?? findKeyMatch?.[1];

    if (!key) {
      warnings.push(
        `src/admin/masters/${filename}: could not detect master key ` +
        `(no MASTER_KEY constant or findMasterByKey('...') call found) — ` +
        `cannot verify help topic. Add a MASTER_KEY constant to this file.`,
      );
      continue;
    }

    if (!topicExists(key)) {
      failures.push(
        `src/admin/masters/${filename}: master key "${key}" has no help topic ` +
        `in helpTopics.ts — add a HelpTopic with id: '${key}'`,
      );
    }
  }
}

// ─── Check 3: Generic masters in adminNavConfig — warning if no exact topic ───
// Parse adminNavConfig.ts to get all master keys. For each key that does NOT
// have a specialized page AND has no exact topic in helpTopics.ts, emit a warning.
// This is a WARNING (not failure) because generic masters fall back to the
// admin-dashboard help topic, which is acceptable for now.

if (fs.existsSync(navConfigFile)) {
  const navContent = fs.readFileSync(navConfigFile, 'utf8');

  // Extract all keys from m('key', ...) calls in adminNavConfig.ts
  const allKeys = [...navContent.matchAll(/\bm\(\s*['"]([a-z][a-z0-9-]*)['"]/g)].map(
    (m) => m[1],
  );

  // Which keys have a specialized page in src/admin/masters/?
  const specializedKeys = new Set();
  if (fs.existsSync(mastersDir)) {
    const masterFiles = fs.readdirSync(mastersDir).filter((f) => f.endsWith('.tsx'));
    for (const filename of masterFiles) {
      const content = fs.readFileSync(path.join(mastersDir, filename), 'utf8');
      const masterKeyMatch = content.match(/const\s+MASTER_KEY\s*=\s*['"]([^'"]+)['"]/);
      const findKeyMatch   = content.match(/findMasterByKey\(\s*['"]([^'"]+)['"]\s*\)/);
      const key = masterKeyMatch?.[1] ?? findKeyMatch?.[1];
      if (key) specializedKeys.add(key);
    }
  }

  // Generic masters without an exact help topic → warning
  let warnCount = 0;
  for (const key of allKeys) {
    if (specializedKeys.has(key)) continue; // covered by check 2
    if (REQUIRED_TOPICS.includes(key)) continue; // already hard-checked
    if (!topicExists(key)) {
      warnCount++;
      if (warnCount <= 5) {
        warnings.push(
          `Generic master "${key}" in adminNavConfig.ts has no exact help topic ` +
          `(falls back to admin-dashboard). Add a HelpTopic with id: '${key}' ` +
          `before this master ships.`,
        );
      }
    }
  }
  if (warnCount > 5) {
    warnings.push(
      `... and ${warnCount - 5} more generic masters without exact help topics ` +
      `(run check-help-topics.js directly to see all).`,
    );
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────

if (warnings.length) {
  warnings.forEach((w) => console.warn(`⚠  ${w}`));
}

if (failures.length) {
  console.error(`✗ Help topic violations (${failures.length}):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`✓ Help topic check passed (${REQUIRED_TOPICS.length} required topics verified).`);

