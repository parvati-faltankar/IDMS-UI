import fs from 'node:fs';
import path from 'node:path';

const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
const storybookInstalled = Object.keys(allDeps).some((k) => k.startsWith('@storybook/'));

const contractsFile = path.join(process.cwd(), 'docs', 'component-contracts.md');
const componentRoot = path.join(process.cwd(), 'src', 'experience', 'components');

// ─── Governance doc must always be present ────────────────────────────────────

if (!fs.existsSync(contractsFile)) {
  console.error('✗ Missing docs/component-contracts.md — governance doc is required.');
  process.exit(1);
}

// ─── Skip if experience package not yet integrated ────────────────────────────

if (!fs.existsSync(componentRoot)) {
  console.warn('⚠ src/experience/components not yet present — skipping file structure check.');
  console.warn('  Integrate the experience package to enable full contract verification.');
  process.exit(0);
}

const contractsContent = fs.readFileSync(contractsFile, 'utf8');
const componentDirs = fs
  .readdirSync(componentRoot)
  .map((name) => ({ name, full: path.join(componentRoot, name) }))
  .filter(({ full }) => fs.statSync(full).isDirectory());

const failures = [];

for (const { name, full } of componentDirs) {
  const files = fs.readdirSync(full);

  // ── Required files ──────────────────────────────────────────────────────────

  // 1. Component implementation file
  if (!files.includes(`${name}.tsx`)) {
    failures.push(`${name}: missing ${name}.tsx (component implementation)`);
  }

  // 2. TypeScript types file
  if (!files.includes(`${name}.types.ts`)) {
    failures.push(`${name}: missing ${name}.types.ts (prop types)`);
  }

  // 3. Storybook story file — required when Storybook is installed.
  //    Warning (not failure) for components with "Shell", "Provider", or "Context" in
  //    their name — these are infrastructure components that are typically not
  //    story-able in isolation.
  if (storybookInstalled && !files.includes(`${name}.stories.tsx`)) {
    const isInfrastructure = /Shell|Provider|Context/i.test(name);
    if (isInfrastructure) {
      console.warn(`⚠  ${name}: missing ${name}.stories.tsx (infrastructure component — warning only)`);
    } else {
      failures.push(`${name}: missing ${name}.stories.tsx (Storybook stories)`);
    }
  }

  // 4. Barrel export file
  if (!files.includes('index.ts')) {
    failures.push(`${name}: missing index.ts (barrel export)`);
  } else {
    const indexContent = fs.readFileSync(path.join(full, 'index.ts'), 'utf8');

    // 4a. index.ts must contain at least one export statement
    if (!indexContent.includes('export')) {
      failures.push(`${name}: index.ts has no export statements`);
    }

    // 4b. index.ts must re-export from the component file itself (barrel completeness).
    //     Accept either: export * from './Name'  OR  export { Name } from './Name'
    //     OR  export * from './Name.types'  etc. — we just check the folder name appears.
    if (!indexContent.includes(`./${name}`)) {
      failures.push(
        `${name}: index.ts does not re-export from './${name}' — ` +
        `barrel export must reference the component by its folder name ` +
        `(e.g. export * from './${name}')`,
      );
    }
  }

  // ── Contracts documentation check ──────────────────────────────────────────

  // Component must have a dedicated ## heading in component-contracts.md
  if (!contractsContent.includes(`## ${name}`)) {
    failures.push(`${name}: not documented in docs/component-contracts.md (missing "## ${name}" heading)`);
  }
}

if (failures.length) {
  console.error(`✗ Component contract violations (${failures.length}):`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log(`✓ Component contract check passed (${componentDirs.length} components verified).`);

