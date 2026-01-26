#!/usr/bin/env node

// 导入并运行 CLI
import("../dist/cli.js").catch((error) => {
  console.error("Failed to start AI Coding Agent:", error);
  process.exit(1);
});
