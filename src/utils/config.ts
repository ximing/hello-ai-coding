import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 应用配置接口
 */
export interface AppConfig {
  // LLM 配置
  llm: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    apiKey?: string;
    baseURL?: string;
  };

  // 工作目录
  workingDirectory: string;

  // 安全设置
  security: {
    allowedCommands: string[];
    restrictedPaths: string[];
    requireConfirmation: string[];
  };

  // 工具配置
  tools: {
    fileSystem: {
      maxFileSize: number;
      ignorePatterns: string[];
    };
    terminal: {
      timeout: number;
    };
  };

  // UI 配置
  ui: {
    showThinking: boolean;
    verboseMode: boolean;
    colorScheme: string;
  };
}

/**
 * 默认配置
 */
export const defaultConfig: AppConfig = {
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
  },

  workingDirectory: process.cwd(),

  security: {
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
    ],
    restrictedPaths: ["/etc", "/sys", "/root", "/boot"],
    requireConfirmation: ["rm", "delete", "format", "git push"],
  },

  tools: {
    fileSystem: {
      maxFileSize: 1024 * 1024, // 1MB
      ignorePatterns: ["node_modules", ".git", "dist", "build", ".next"],
    },
    terminal: {
      timeout: 30000, // 30 seconds
    },
  },

  ui: {
    showThinking: true,
    verboseMode: false,
    colorScheme: "default",
  },
};

/**
 * 加载用户配置文件
 */
export async function loadUserConfig(
  configPath?: string
): Promise<Partial<AppConfig>> {
  try {
    const configFilePath =
      configPath ||
      path.join(process.cwd(), ".ai-code.config.js");

    const configExists = await fs
      .access(configFilePath)
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      return {};
    }

    // 动态导入配置文件
    const configModule = await import(
      `file://${path.resolve(configFilePath)}`
    );
    return configModule.default || {};
  } catch (error) {
    console.warn("Failed to load user config:", error);
    return {};
  }
}

/**
 * 从环境变量加载配置
 */
export function loadEnvConfig(): Partial<AppConfig> {
  const envConfig: Partial<AppConfig> = {};

  // LLM 配置
  if (process.env.ANTHROPIC_API_KEY) {
    envConfig.llm = {
      ...(envConfig.llm || defaultConfig.llm),
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  if (process.env.ANTHROPIC_BASE_URL) {
    envConfig.llm = {
      ...(envConfig.llm || defaultConfig.llm),
      baseURL: process.env.ANTHROPIC_BASE_URL,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    envConfig.llm = {
      ...(envConfig.llm || defaultConfig.llm),
      apiKey: process.env.OPENAI_API_KEY,
      provider: "openai",
    };
  }

  return envConfig;
}

/**
 * 合并配置
 */
export function mergeConfig(
  ...configs: Array<Partial<AppConfig>>
): AppConfig {
  return configs.reduce((merged: AppConfig, config: Partial<AppConfig>) => {
    return {
      ...merged,
      ...config,
      llm: { ...merged.llm, ...(config.llm || {}) },
      security: { ...merged.security, ...(config.security || {}) },
      tools: {
        ...merged.tools,
        ...(config.tools || {}),
        fileSystem: {
          ...merged.tools.fileSystem,
          ...(config.tools?.fileSystem || {}),
        },
        terminal: { ...merged.tools.terminal, ...(config.tools?.terminal || {}) },
      },
      ui: { ...merged.ui, ...(config.ui || {}) },
    } as AppConfig;
  }, defaultConfig);
}

/**
 * 加载完整配置
 */
export async function loadConfig(
  configPath?: string,
  overrides?: Partial<AppConfig>
): Promise<AppConfig> {
  const userConfig = await loadUserConfig(configPath);
  const envConfig = loadEnvConfig();

  return mergeConfig(defaultConfig, userConfig, envConfig, overrides || {});
}
