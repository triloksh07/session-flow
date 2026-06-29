// setup.js
// Run: node setup.js

const fs = require("fs");
const path = require("path");

const root = process.cwd();

const directories = ["src", "src/nodes", "src/memory", "src/utils"];

const files = [
  "src/index.ts",
  "src/config.ts",
  "src/llm.ts",
  "src/graph.ts",
  "src/state.ts",
  "src/schemas.ts",

  "src/nodes/chat.ts",
  "src/nodes/extractor.ts",

  "src/memory/semantic-store.ts",
  "src/memory/checkpointer.ts",

  "src/utils/prompts.ts",

  ".env",
  ".env.example",
];

console.log("🚀 Creating SessionFlow project structure...\n");

// Create directories
for (const dir of directories) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  console.log(`📁 ${dir}`);
}

// Create empty files
for (const file of files) {
  const filePath = path.join(root, file);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
    console.log(`📄 ${file}`);
  } else {
    console.log(`⏭️  ${file} (already exists)`);
  }
}

console.log("\n✅ SessionFlow base structure created.");
