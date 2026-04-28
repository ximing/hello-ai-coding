import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

/**
 * Agent 输出组件属性
 */
export interface AgentOutputProps {
  thinking?: string;
  currentAction?: string;
  results?: string[];
  completed: boolean;
  error?: string;
}

/**
 * Agent 输出显示组件
 */
export const AgentOutput: React.FC<AgentOutputProps> = ({
  thinking,
  currentAction,
  results,
  completed,
  error,
}) => {
  return (
    <Box flexDirection="column">
      {thinking && (
        <Box marginBottom={1}>
          <Text color="cyan">💭 Thinking: </Text>
          <Text>{thinking}</Text>
        </Box>
      )}

      {currentAction && !completed && (
        <Box marginBottom={1}>
          <Text color="yellow">⏳ Executing: {currentAction}</Text>
        </Box>
      )}

      {results && results.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="green">✅ Results:</Text>
          {results.map((result, idx) => (
            <Box key={idx} marginLeft={2}>
              <Text>• {result}</Text>
            </Box>
          ))}
        </Box>
      )}

      {error && (
        <Box marginBottom={1}>
          <Text color="red">❌ Error: {error}</Text>
        </Box>
      )}

      {completed && !error && (
        <Box marginTop={1}>
          <Text color="green" bold>
            ✨ Task completed!
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * 工具执行状态属性
 */
export interface ToolExecutionProps {
  toolName: string;
  status: "running" | "success" | "error";
  result?: string;
}

/**
 * 工具执行状态组件
 */
export const ToolExecution: React.FC<ToolExecutionProps> = ({
  toolName,
  status,
  result,
}) => {
  const getStatusIndicator = () => {
    switch (status) {
      case "running":
        return <Text color="yellow">⏳ Running</Text>;
      case "success":
        return <Text color="green">✅ Success</Text>;
      case "error":
        return <Text color="red">❌ Error</Text>;
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold>[{toolName}] </Text>
        {getStatusIndicator()}
      </Box>
      {result && (
        <Box marginLeft={2} marginTop={1}>
          <Text dimColor>{result}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * 会话信息属性
 */
export interface SessionInfoProps {
  sessionId: string;
  workingDirectory: string;
  showDetails?: boolean;
}

/**
 * 会话信息组件
 */
export const SessionInfo: React.FC<SessionInfoProps> = ({
  sessionId,
  workingDirectory,
  showDetails = true,
}) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      padding={1}
      marginBottom={1}
    >
      <Text bold color="blue">
        🤖 AI Coding Agent
      </Text>
      {showDetails && (
        <>
          <Text dimColor>Session: {sessionId}</Text>
          <Text dimColor>Working Dir: {workingDirectory}</Text>
        </>
      )}
    </Box>
  );
};

/**
 * 消息组件属性
 */
export interface MessageProps {
  role: "user" | "assistant" | "system" | "completion";
  content: string;
  /** 完成耗时（毫秒），仅 completion 角色使用 */
  durationMs?: number;
  /** 错误信息，仅 completion 角色使用 */
  error?: string;
}

/**
 * 消息显示组件
 */
export const Message: React.FC<MessageProps> = ({
  role,
  content,
  durationMs,
  error,
}) => {
  // completion 角色使用专门的 CompletionIndicator
  if (role === "completion") {
    return (
      <Box marginBottom={1}>
        <CompletionIndicator
          error={error}
          durationMs={durationMs ?? 0}
        />
      </Box>
    );
  }

  const getIcon = () => {
    switch (role) {
      case "user":
        return "👤";
      case "assistant":
        return "🤖";
      case "system":
        return "⚙️";
      default:
        return "";
    }
  };

  const getColor = () => {
    switch (role) {
      case "user":
        return "cyan";
      case "assistant":
        return "green";
      case "system":
        return "gray";
      default:
        return "white";
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={getColor()} bold>
        {getIcon()} {role.charAt(0).toUpperCase() + role.slice(1)}:
      </Text>
      <Box marginLeft={2}>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
};

/**
 * 进度指示器属性
 */
export interface ProgressProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * 进度指示器组件
 */
export const Progress: React.FC<ProgressProps> = ({
  current,
  total,
  label,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Box marginBottom={1}>
      {label && <Text>{label}: </Text>}
      <Text color="cyan">
        [{current}/{total}] {percentage}%
      </Text>
    </Box>
  );
};

/**
 * 帮助信息组件
 */
export const HelpInfo: React.FC = () => {
  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text bold>Commands:</Text>
      <Text>  • Type your coding task and press Enter</Text>
      <Text>  • Press Ctrl+C to exit</Text>
      <Text>  • Type 'help' for more information</Text>
      <Text>  • Type 'clear' to clear the screen</Text>
      <Text>  • Type 'status' to see session information</Text>
    </Box>
  );
};

/**
 * Loading 随机文案列表
 */
const LOADING_MESSAGES = [
  "Thinking...",
  "Working on it...",
  "Doing my thing...",
  "Crunching...",
  "Processing...",
  "Hang tight...",
  "Be right back...",
  "Gears turning...",
  "Almost there...",
  "On it...",
  "Figuring it out...",
  "Give me a sec...",
  "Brewing something up...",
  "Connecting the dots...",
  "Wrangling bits...",
  "Stirring the pot...",
  "Spinning up...",
  "Making progress...",
  "Pondering...",
  "Chugging along...",
];

/**
 * 旋转动画帧
 */
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Loading 指示器属性
 */
export interface LoadingIndicatorProps {
  /** 当前执行的工具/动作名称 */
  currentAction?: string;
}

/**
 * Loading 指示器组件
 * 显示旋转动画 + 随机轮播文案，类似 Claude Code 风格
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  currentAction,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(
    Math.floor(Math.random() * LOADING_MESSAGES.length)
  );

  // 旋转动画：每 80ms 切换一帧
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // 随机文案：每 3 秒切换一条
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => {
        let next: number;
        do {
          next = Math.floor(Math.random() * LOADING_MESSAGES.length);
        } while (next === prev);
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{SPINNER_FRAMES[frameIndex]} </Text>
        <Text color="cyan">{LOADING_MESSAGES[messageIndex]}</Text>
      </Box>
      {currentAction && (
        <Box marginLeft={2}>
          <Text color="yellow">↳ 使用工具: {currentAction}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * 完成提示属性
 */
export interface CompletionIndicatorProps {
  /** 是否有错误 */
  error?: string;
  /** 执行耗时（毫秒） */
  durationMs: number;
}

/**
 * 完成提示组件
 * 灰色字体显示已完成 + 耗时
 */
export const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({
  error,
  durationMs,
}) => {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(0);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (error) {
    return (
      <Box>
        <Text dimColor>✗ 执行失败 · {formatDuration(durationMs)}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text dimColor>✓ 已完成 · {formatDuration(durationMs)}</Text>
    </Box>
  );
};
