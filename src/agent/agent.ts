import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initChatModel } from "langchain/chat_models/universal";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import type { AppConfig } from "../utils/config.js";
import { SecurityValidator } from "../utils/security.js";
import { FileCache } from "../utils/file-cache.js";
import { createSystemPrompt } from "./prompt.js";
import { createFileTools } from "../tools/file-tools.js";
import { createExecTools } from "../tools/exec-tools.js";
import { createCodeTools } from "../tools/code-tools.js";
import { createGitTools } from "../tools/git-tools.js";
import type { CompiledStateGraph } from "@langchain/langgraph";
import { randomBytes } from "crypto";

/**
 * Agent 配置
 */
export interface AgentConfig {
  sessionId?: string;
  workingDirectory?: string;
  verbose?: boolean;
}

/**
 * 创建 AI Coding Agent
 */
export async function createAgent(
  appConfig: AppConfig,
  agentConfig: AgentConfig = {}
) {
  // 初始化组件
  const workingDirectory =
    agentConfig.workingDirectory || appConfig.workingDirectory;
  const security = new SecurityValidator(appConfig);
  const fileCache = new FileCache();

  // 创建工具
  const fileTools = createFileTools(workingDirectory, security, fileCache);
  const execTools = createExecTools(workingDirectory, security, appConfig);
  const codeTools = createCodeTools(workingDirectory, security, appConfig);
  const gitTools = createGitTools(workingDirectory, security);

  const tools = [
    fileTools.readFileTool,
    fileTools.writeFileTool,
    fileTools.editFileTool,
    fileTools.listDirectoryTool,
    execTools.executeCommandTool,
    codeTools.searchCodeTool,
    gitTools.gitStatusTool,
    gitTools.gitDiffTool,
    gitTools.gitAddTool,
  ];

  // 初始化 LLM
  const llmConfig: any = {
    temperature: appConfig.llm.temperature,
    maxTokens: appConfig.llm.maxTokens,
  };

  // 添加 API Key 和 Base URL（如果有）
  if (appConfig.llm.apiKey) {
    llmConfig.apiKey = appConfig.llm.apiKey;
  }
  if (appConfig.llm.baseURL) {
    llmConfig.configuration = {
      baseURL: appConfig.llm.baseURL,
    };
  }

  const llm = await initChatModel(
    `${appConfig.llm.provider}:${appConfig.llm.model}`,
    llmConfig
  );

  // 创建 system prompt
  const systemPrompt = createSystemPrompt(
    workingDirectory,
    tools.map((t) => t.name)
  );

  // 创建 checkpointer（会话持久化）
  const checkpointer = new MemorySaver();

  // 创建 ReAct Agent
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: checkpointer,
    messageModifier: systemPrompt,
  });

  return {
    agent,
    sessionId: agentConfig.sessionId || generateSessionId(),
    workingDirectory,
    fileCache,
    tools,
  };
}

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
  return `session-${randomBytes(8).toString("hex")}-${Date.now()}`;
}

/**
 * 格式化配置为可读字符串
 */
export function getThreadConfig(sessionId: string) {
  return {
    configurable: {
      thread_id: sessionId,
    },
  };
}

/**
 * Agent 实例包装器
 */
export class AgentRunner {
  private agent: CompiledStateGraph<any, any, any, any>;
  private sessionId: string;
  private workingDirectory: string;
  private fileCache: FileCache;
  private verbose: boolean;

  constructor(
    agent: CompiledStateGraph<any, any, any, any>,
    sessionId: string,
    workingDirectory: string,
    fileCache: FileCache,
    verbose: boolean = false
  ) {
    this.agent = agent;
    this.sessionId = sessionId;
    this.workingDirectory = workingDirectory;
    this.fileCache = fileCache;
    this.verbose = verbose;
  }

  /**
   * 执行单次查询
   */
  async invoke(input: string) {
    const config = getThreadConfig(this.sessionId);
    const result = await this.agent.invoke(
      {
        messages: [{ role: "user", content: input }],
      },
      config
    );
    return result;
  }

  /**
   * 流式执行查询
   */
  async *stream(input: string) {
    const config = getThreadConfig(this.sessionId);

    const stream = await this.agent.stream(
      {
        messages: [{ role: "user", content: input }],
      },
      {
        ...config,
        streamMode: "updates",
      }
    );

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * 获取会话信息
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      workingDirectory: this.workingDirectory,
      cacheStats: this.fileCache.getStats(),
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.fileCache.clear();
  }
}
