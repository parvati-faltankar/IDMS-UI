const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src", "experience", "help", "helpTopics.ts");
const requiredTopics = [
  "admin-dashboard",
  "kyc-setup",
  "picklist-master",
  "numbering-code-setup",
  "code-generation-policy",
];

if (!fs.existsSync(file)) {
  console.error("Missing src/experience/help/helpTopics.ts");
  process.exit(1);
}

const content = fs.readFileSync(file, "utf8");
const missing = requiredTopics.filter((topic) => !content.includes(`id: "${topic}"`) && !content.includes(`id: '${topic}'`));

if (missing.length) {
  console.error("Missing required help topics:", missing.join(", "));
  process.exit(1);
}

console.log("Help topic check passed.");
