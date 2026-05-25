import fs from 'node:fs';
import path from 'node:path';

const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
const storybookInstalled = Object.keys(allDeps).some((k) => k.startsWith('@storybook/'));

if (!storybookInstalled) {
  console.warn('⚠ Storybook not installed — skipping stories check.');
  console.warn('  Install @storybook/react to enable this check.');
  process.exit(0);
}

const componentRoot = path.join(process.cwd(), 'src', 'experience', 'components');

if (!fs.existsSync(componentRoot)) {
  console.warn('⚠ src/experience/components not yet present — skipping stories check.');
  console.warn('  Integrate the experience package to enable this check.');
  process.exit(0);
}

const componentDirs = fs
  .readdirSync(componentRoot)
  .map((name) => ({ name, full: path.join(componentRoot, name) }))
  .filter(({ full }) => fs.statSync(full).isDirectory());

const missing = [];

for (const { name, full } of componentDirs) {
  const files = fs.readdirSync(full);
  const hasComponent = files.some((f) => f.endsWith('.tsx') && !f.endsWith('.stories.tsx'));
  const hasStory = files.some((f) => f.endsWith('.stories.tsx'));
  if (hasComponent && !hasStory) {
    missing.push(`src/experience/components/${name}`);
  }
}

if (missing.length) {
  console.error(`✗ Missing .stories.tsx for ${missing.length} component(s):`);
  missing.forEach((dir) => console.error(`  - ${dir}`));
  process.exit(1);
}

console.log(`✓ Story check passed (${componentDirs.length} component directories verified).`);
