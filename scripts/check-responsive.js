import fs from 'node:fs';
import path from 'node:path';

/*
 * Responsive audit (advisory).
 * Flags inline fixed pixel widths likely to overflow a phone viewport
 * (>= 480px on width / min-width in style props or JSX), so the per-screen
 * responsive pass can find and fix them. Advisory by default (exit 0);
 * pass --strict to fail the process when any are found.
 */

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const EXTENSIONS = new Set(['.tsx', '.ts']);
const WIDTH_THRESHOLD = 480;
const STRICT = process.argv.includes('--strict');

// Flags fixed `width` only (the pattern that overflows). `min-width` /
// `minWidth` is intentionally NOT flagged — it's the correct pattern for
// wide data tables that scroll horizontally inside an overflow-x container.
// Matches: width: '520px' | width: 600 | width:"480px"  (not minWidth/maxWidth/min-width)
const FIXED_WIDTH = /(?<![-\w])width\s*:\s*['"]?(\d{3,})(?:px)?['"]?/gi;

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(full))) files.push(full);
  }
  return files;
}

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Only inspect lines that look like inline styles, not CSS-in-comments.
    if (!/style\s*=|width\s*:/.test(line)) return;
    let match;
    FIXED_WIDTH.lastIndex = 0;
    while ((match = FIXED_WIDTH.exec(line)) !== null) {
      const value = Number(match[1]);
      if (value >= WIDTH_THRESHOLD) {
        findings.push({ file: path.relative(ROOT, file), line: index + 1, value });
      }
    }
  });
}

const byFile = new Map();
for (const f of findings) {
  byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1);
}

const sorted = [...byFile.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\nResponsive audit — inline fixed widths >= ${WIDTH_THRESHOLD}px`);
console.log(`Scanned ${files.length} files · ${findings.length} occurrences in ${byFile.size} files\n`);
for (const [file, count] of sorted.slice(0, 40)) {
  console.log(`  ${String(count).padStart(3)}  ${file}`);
}
if (sorted.length > 40) console.log(`  … and ${sorted.length - 40} more files`);
console.log('');

if (STRICT && findings.length > 0) {
  process.exit(1);
}
