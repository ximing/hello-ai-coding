import React from "react";
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
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * 消息显示组件
 */
export const Message: React.FC<MessageProps> = ({ role, content }) => {
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
