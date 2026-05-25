const fs = require("fs");
const path = require("path");

const componentRoot = path.join(process.cwd(), "src", "experience", "components");

if (!fs.existsSync(componentRoot)) {
  console.error("Missing src/experience/components directory");
  process.exit(1);
}

const componentDirs = fs.readdirSync(componentRoot)
  .map((name) => path.join(componentRoot, name))
  .filter((full) => fs.statSync(full).isDirectory());

const missing = [];

for (const dir of componentDirs) {
  const files = fs.readdirSync(dir);
  const hasComponent = files.some((file) => file.endsWith(".tsx") && !file.endsWith(".stories.tsx"));
  const hasStory = files.some((file) => file.endsWith(".stories.tsx"));
  if (hasComponent && !hasStory) missing.push(path.relative(process.cwd(), dir));
}

if (missing.length) {
  console.error("Missing Storybook stories for:");
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Story check passed for ${componentDirs.length} component directories.`);
