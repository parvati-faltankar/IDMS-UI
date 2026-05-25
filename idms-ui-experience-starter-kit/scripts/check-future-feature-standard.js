const fs = require("fs");
const path = require("path");

const requiredDocs = [
  "docs/ui-experience-constitution.md",
  "docs/future-feature-standard.md",
  "docs/ui-audit-checklist.md",
  "docs/component-contracts.md",
];

const missing = requiredDocs.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length) {
  console.error("Missing future feature governance docs:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log("Future feature standard check passed.");
