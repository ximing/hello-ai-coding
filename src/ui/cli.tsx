import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import type { Key } from "ink";
import { SessionInfo, Message, HelpInfo, LoadingIndicator } from "./components.js";
import type { AgentRunner } from "../agent/agent.js";

/**
 * CLI 应用属性
 */
export interface CliAppProps {
  agent: AgentRunner;
  initialMessage?: string;
  verbose?: boolean;
}

/**
 * 消息类型
 */
interface ChatMessage {
  role: "user" | "assistant" | "system" | "completion";
  content: string;
  timestamp: Date;
  /** 完成耗时（毫秒），仅 completion 类型使用 */
  durationMs?: number;
  /** 错误信息，仅 completion 类型使用 */
  error?: string;
}

/**
 * Agent 状态
 */
interface AgentState {
  thinking?: string;
  currentAction?: string;
  results: string[];
  completed: boolean;
  error?: string;
  /** 任务开始时间 */
  startTime?: number;
}

/**
 * CLI 主应用组件
 */
export const CliApp: React.FC<CliAppProps> = ({
  agent,
  initialMessage,
  verbose = false,
}) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    results: [],
    completed: false,
  });
  const [showHelp, setShowHelp] = useState(false);

  const sessionInfo = agent.getSessionInfo();

  // 处理用户输入
  useInput((input: string, key: Key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (isProcessing) {
      return; // 正在处理时忽略输入
    }

    if (key.return) {
      handleSubmit();
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input.length > 0) {
      setInput((prev) => prev + input);
    }
  });

  // 处理提交
  const handleSubmit = async () => {
    const userInput = input.trim();
    if (!userInput) return;

    // 处理特殊命令
    if (userInput === "help") {
      setShowHelp(!showHelp);
      setInput("");
      return;
    }

    if (userInput === "clear") {
      setMessages([]);
      setInput("");
      return;
    }

    if (userInput === "status") {
      const info = agent.getSessionInfo();
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Session: ${info.sessionId}\nWorking Directory: ${info.workingDirectory}\nCache: ${info.cacheStats.hits} hits, ${info.cacheStats.misses} misses (${(info.cacheStats.hitRate * 100).toFixed(1)}%)`,
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }

    if (userInput === "exit" || userInput === "quit") {
      exit();
      return;
    }

    // 添加用户消息
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userInput,
        timestamp: new Date(),
      },
    ]);

    setInput("");
    setIsProcessing(true);
    const startTime = Date.now();
    setAgentState({
      results: [],
      completed: false,
      startTime,
    });

    try {
      // 流式处理 agent 响应
      let fullResponse = "";
      const results: string[] = [];

      for await (const chunk of agent.stream(userInput)) {
        if (verbose) {
          console.log("Chunk:", chunk);
        }

        // 处理不同类型的 chunk
        if (chunk.agent) {
          const messages = chunk.agent.messages;
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            if (lastMessage.content) {
              if (typeof lastMessage.content === "string") {
                fullResponse = lastMessage.content;
              } else if (Array.isArray(lastMessage.content)) {
                fullResponse = lastMessage.content
                  .map((c: any) => (typeof c === "string" ? c : c.text || ""))
                  .join("\n");
              }
            }

            // 检测工具调用
            if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
              const toolCall = lastMessage.tool_calls[0];
              setAgentState((prev) => ({
                ...prev,
                currentAction: toolCall.name,
              }));
            }
          }
        }

        // 处理工具结果
        if (chunk.tools) {
          const toolMessages = chunk.tools.messages;
          if (toolMessages && toolMessages.length > 0) {
            const toolResult = toolMessages[toolMessages.length - 1];
            if (toolResult.content) {
              results.push(
                `${toolResult.name || "Tool"}: ${toolResult.content.substring(0, 100)}...`
              );
              setAgentState((prev) => ({
                ...prev,
                results: [...results],
              }));
            }
          }
        }
      }

      // 添加助手响应
      if (fullResponse) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
          },
        ]);
      }

      // 计算耗时
      const durationMs = Date.now() - startTime;

      setAgentState((prev) => ({
        ...prev,
        completed: true,
        currentAction: undefined,
      }));

      // 添加完成提示消息
      setMessages((prev) => [
        ...prev,
        {
          role: "completion",
          content: "done",
          timestamp: new Date(),
          durationMs,
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const durationMs = Date.now() - startTime;

      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      ]);
      setAgentState({
        results: [],
        completed: true,
        error: errorMessage,
      });

      // 添加失败提示消息
      setMessages((prev) => [
        ...prev,
        {
          role: "completion",
          content: "error",
          timestamp: new Date(),
          durationMs,
          error: errorMessage,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage);
      // 延迟提交以确保 UI 已渲染
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  }, [initialMessage]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* 会话信息 */}
      <SessionInfo
        sessionId={sessionInfo.sessionId}
        workingDirectory={sessionInfo.workingDirectory}
      />

      {/* 帮助信息 */}
      {showHelp && <HelpInfo />}

      {/* 消息历史 */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, idx) => (
          <Message
            key={idx}
            role={msg.role}
            content={msg.content}
            durationMs={msg.durationMs}
            error={msg.error}
          />
        ))}
      </Box>

      {/* Loading 指示器 */}
      {isProcessing && (
        <Box marginBottom={1}>
          <LoadingIndicator currentAction={agentState.currentAction} />
        </Box>
      )}

      {/* 输入框 */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan">➤ </Text>
        <Text>{input}</Text>
        {!isProcessing && <Text color="gray">█</Text>}
      </Box>

      {/* 提示信息 */}
      {!isProcessing && (
        <Box marginTop={1}>
          <Text dimColor>Type your task or 'help' for commands</Text>
        </Box>
      )}
    </Box>
  );
};
