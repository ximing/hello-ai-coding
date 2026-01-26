#!/usr/bin/env node

import dotenv from "dotenv";
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { loadConfig } from "./utils/config.js";
import { createAgent, AgentRunner } from "./agent/agent.js";
import { CliApp } from "./ui/cli.js";
import type { AppConfig } from "./utils/config.js";
import fs from "fs/promises";
import path from "path";

// 加载 .env 文件
dotenv.config({ path: path.join(process.cwd(), ".env") });

/**
 * 主程序
 */
async function main() {
  const program = new Command();

  program
    .name("ai-code")
    .description("AI Coding Assistant CLI - Your intelligent coding companion")
    .version("0.1.0");

  // 默认命令：交互式会话或单次任务
  program
    .argument("[task]", "Task description for single execution")
    .option(
      "--model <model>",
      "LLM model to use (e.g., anthropic:claude-3-5-sonnet-20241022)"
    )
    .option("--working-dir <dir>", "Working directory", process.cwd())
    .option("--verbose", "Enable verbose output", false)
    .option("--dry-run", "Preview mode (no actual execution)", false)
    .option("--config <path>", "Path to config file")
    .action(async (task, options) => {
      try {
        // 加载配置
        const configOverrides: Partial<AppConfig> = {};

        if (options.model) {
          const [provider, model] = options.model.split(":");
          configOverrides.llm = {
            provider,
            model,
            temperature: 0.7,
            maxTokens: 4096,
          };
        }

        if (options.workingDir) {
          configOverrides.workingDirectory = path.resolve(options.workingDir);
        }

        if (options.verbose) {
          configOverrides.ui = {
            showThinking: true,
            verboseMode: true,
            colorScheme: "default",
          };
        }

        const config = await loadConfig(options.config, configOverrides);

        // 创建 agent
        const { agent, sessionId, workingDirectory, fileCache } =
          await createAgent(config, {
            workingDirectory: config.workingDirectory,
            verbose: options.verbose,
          });

        const agentRunner = new AgentRunner(
          agent,
          sessionId,
          workingDirectory,
          fileCache,
          options.verbose
        );

        // 如果是 dry-run 模式，显示配置并退出
        if (options.dryRun) {
          console.log("🔍 Dry-run mode - Configuration:");
          console.log(`  Model: ${config.llm.provider}:${config.llm.model}`);
          console.log(`  Working Directory: ${config.workingDirectory}`);
          console.log(`  Session ID: ${sessionId}`);
          console.log(
            `  Allowed Commands: ${config.security.allowedCommands.join(", ")}`
          );
          console.log("\nNo actions will be performed in dry-run mode.");
          return;
        }

        // 渲染 Ink UI
        render(
          React.createElement(CliApp, {
            agent: agentRunner,
            initialMessage: task,
            verbose: options.verbose,
          })
        );
      } catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // 继续之前的会话
  program
    .command("continue")
    .description("Continue a previous session")
    .argument("<session-id>", "Session ID to continue")
    .option("--verbose", "Enable verbose output", false)
    .action(async (sessionId, options) => {
      console.log(
        "⚠️  Session restoration is not yet fully implemented in this version."
      );
      console.log(`Would continue session: ${sessionId}`);
      // TODO: 实现从持久化存储恢复会话
    });

  // 列出所有会话
  program
    .command("list-sessions")
    .description("List all saved sessions")
    .action(async () => {
      console.log(
        "⚠️  Session listing is not yet fully implemented in this version."
      );
      console.log(
        "Sessions are currently stored in memory and lost when the program exits."
      );
      // TODO: 实现从持久化存储列出会话
    });

  // 清理命令
  program
    .command("clean")
    .description("Clean up cached data and temporary files")
    .action(async () => {
      console.log("🧹 Cleaning up...");
      // TODO: 清理缓存
      console.log("✅ Cleanup complete");
    });

  // 配置向导
  program
    .command("init")
    .description("Initialize configuration file")
    .action(async () => {
      const configPath = path.join(process.cwd(), ".ai-code.config.js");

      try {
        // 检查配置文件是否已存在
        await fs.access(configPath);
        console.log("⚠️  Configuration file already exists at:", configPath);
        console.log(
          "Delete it first if you want to create a new one, or edit it directly."
        );
        return;
      } catch {
        // 文件不存在，继续创建
      }

      // 创建示例配置文件
      const exampleConfig = `export default {
  // LLM 配置
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
  },

  // 工作目录
  workingDirectory: "./",

  // 安全设置
  security: {
    allowedCommands: ["npm", "pnpm", "yarn", "git", "node", "tsc", "eslint", "prettier"],
    restrictedPaths: ["/etc", "/sys", "/root"],
    requireConfirmation: ["rm", "delete", "format", "git push"],
  },

  // 工具配置
  tools: {
    fileSystem: {
      maxFileSize: 1024 * 1024, // 1MB
      ignorePatterns: ["node_modules", ".git", "dist", "build"],
    },
    terminal: {
      timeout: 30000, // 30 seconds
    },
  },

  // UI 配置
  ui: {
    showThinking: true,
    verboseMode: false,
    colorScheme: "default",
  },
};
`;

      await fs.writeFile(configPath, exampleConfig, "utf-8");
      console.log("✅ Created configuration file at:", configPath);
      console.log("\nEdit this file to customize your AI coding assistant.");
    });

  await program.parseAsync(process.argv);
}

// 运行主程序
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
