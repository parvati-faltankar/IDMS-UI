const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TARGET_DIRS = ["docs", "src/experience", "scripts"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".md"]);
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

const files = TARGET_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)))
  .filter((file) => EXTENSIONS.has(path.extname(file)));

const failures = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const trimmed = content.trim();

  if (trimmed.length < 80) {
    failures.push(`${rel}: too small to be meaningful`);
    continue;
  }

  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(content)) {
      failures.push(`${rel}: contains placeholder/empty pattern ${pattern}`);
      break;
    }
  }
}

if (failures.length) {
  console.error("Empty/placeholder file check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Empty/placeholder file check passed for ${files.length} files.`);
