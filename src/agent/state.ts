import { MessagesAnnotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Agent 状态定义
 * 扩展 MessagesAnnotation 以包含额外的状态信息
 */
export interface AgentState {
  // 对话消息历史
  messages: BaseMessage[];

  // 当前工作目录
  workingDirectory: string;

  // 已读取的文件缓存（文件路径 -> 内容）
  fileCache?: Map<string, string>;

  // 执行计划
  executionPlan?: string[];

  // 当前任务状态
  taskStatus: "planning" | "executing" | "completed" | "error";

  // 当前正在执行的工具
  currentTool?: string;

  // 工具执行结果历史
  toolResults?: Array<{
    tool: string;
    timestamp: Date;
    success: boolean;
    result: string;
  }>;
}

/**
 * 创建初始状态
 */
export function createInitialState(workingDirectory: string): AgentState {
  return {
    messages: [],
    workingDirectory,
    fileCache: new Map(),
    executionPlan: [],
    taskStatus: "planning",
    toolResults: [],
  };
}
