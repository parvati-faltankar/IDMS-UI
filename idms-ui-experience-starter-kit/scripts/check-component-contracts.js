const fs = require("fs");
const path = require("path");

const contractsFile = path.join(process.cwd(), "docs", "component-contracts.md");
const componentRoot = path.join(process.cwd(), "src", "experience", "components");

if (!fs.existsSync(contractsFile)) {
  console.error("Missing docs/component-contracts.md");
  process.exit(1);
}

if (!fs.existsSync(componentRoot)) {
  console.error("Missing src/experience/components directory");
  process.exit(1);
}

const contracts = fs.readFileSync(contractsFile, "utf8");
const componentNames = fs.readdirSync(componentRoot)
  .filter((name) => fs.statSync(path.join(componentRoot, name)).isDirectory());

const missing = componentNames.filter((name) => !contracts.includes(name));

if (missing.length) {
  console.error("Components missing from component contracts:", missing.join(", "));
  process.exit(1);
}

console.log("Component contract check passed.");
