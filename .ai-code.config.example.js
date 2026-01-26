/**
 * AI Coding Agent Configuration Example
 * 
 * Copy this file to .ai-code.config.js and customize as needed.
 */

export default {
  // ==================== LLM 配置 ====================
  llm: {
    // LLM 提供商: "anthropic" 或 "openai"
    provider: "anthropic",

    // 模型名称
    // Anthropic: "claude-3-5-sonnet-20241022", "claude-3-opus-20240229", etc.
    // OpenAI: "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", etc.
    model: "claude-3-5-sonnet-20241022",

    // Temperature (0.0 - 1.0)
    // 较低的值使输出更确定，较高的值使输出更有创造性
    temperature: 0.7,

    // 最大 token 数
    maxTokens: 4096,

    // API Key (可选，推荐使用环境变量)
    // apiKey: "your-api-key-here",

    // API Base URL (可选)
    // baseURL: "https://api.anthropic.com",
  },

  // ==================== 工作目录 ====================
  // 默认工作目录（相对于当前目录或绝对路径）
  workingDirectory: "./",

  // ==================== 安全设置 ====================
  security: {
    // 允许执行的命令列表
    // 只有这些命令可以通过 execute_command 工具执行
    allowedCommands: [
      "npm",
      "pnpm",
      "yarn",
      "git",
      "node",
      "tsc",
      "eslint",
      "prettier",
      "ls",
      "cat",
      "pwd",
      "mkdir",
      "touch",
      "cp",
      "mv",
      // 添加其他需要的命令...
    ],

    // 受限路径列表
    // Agent 无法访问这些路径
    restrictedPaths: [
      "/etc",
      "/sys",
      "/root",
      "/boot",
      // 添加其他需要保护的路径...
    ],

    // 需要用户确认的操作关键词
    // 包含这些关键词的操作将提示用户确认
    requireConfirmation: [
      "rm",
      "delete",
      "format",
      "git push",
      // 添加其他需要确认的操作...
    ],
  },

  // ==================== 工具配置 ====================
  tools: {
    // 文件系统工具配置
    fileSystem: {
      // 单个文件最大大小（字节）
      maxFileSize: 1024 * 1024, // 1MB

      // 忽略的文件/目录模式
      ignorePatterns: [
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        "coverage",
        ".DS_Store",
        // 添加其他需要忽略的模式...
      ],
    },

    // 终端执行工具配置
    terminal: {
      // 命令执行超时时间（毫秒）
      timeout: 30000, // 30 seconds
    },
  },

  // ==================== UI 配置 ====================
  ui: {
    // 是否显示 Agent 的思考过程
    showThinking: true,

    // 详细输出模式
    verboseMode: false,

    // 颜色方案
    colorScheme: "default",
  },
};
