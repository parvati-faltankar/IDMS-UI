const { spawnSync } = require("child_process");

const checks = [
  "node scripts/check-empty-files.js",
  "node scripts/check-help-topics.js",
  "node scripts/check-stories.js",
  "node scripts/check-component-contracts.js",
  "node scripts/check-future-feature-standard.js",
];

for (const check of checks) {
  console.log(`\nRunning: ${check}`);
  const result = spawnSync(check, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status);
}

console.log("\nUI governance audit passed.");
