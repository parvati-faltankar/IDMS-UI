import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['docs', 'src/experience'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.md']);
const BAD_PATTERNS = [
  /^\s*$/,
  /lorem ipsum/i,
  /coming soon/i,
  /placeholder only/i,
  /todo only/i,
  /^\s*export\s*\{\s*\}\s*;?\s*$/,
  /return\s+null\s*;?\s*$/,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).filter(
  (file) => EXTENSIONS.has(path.extname(file)),
);

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js']);
const BARREL_FILENAME = /^index\.(ts|js)$/;
const failures = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const trimmed = content.trim();
  const ext = path.extname(file);
  const basename = path.basename(file);

  // Barrel (index) files are intentionally small — skip size check.
  if (!BARREL_FILENAME.test(basename) && trimmed.length < 80) {
    failures.push(`${rel}: too small to be meaningful`);
    continue;
  }

  // Content-pattern checks apply to code files only.
  // Markdown governance docs legitimately reference these anti-patterns.
  if (CODE_EXTENSIONS.has(ext)) {
    for (const pattern of BAD_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`${rel}: contains placeholder/empty pattern ${pattern}`);
        break;
      }
    }
  }
}

if (failures.length) {
  console.error('✗ Empty/placeholder file check FAILED:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`✓ Empty/placeholder check passed (${files.length} files checked).`);
