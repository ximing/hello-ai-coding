# AI Agent Coding CLI 工具技术方案

## 1. 项目概述

### 1.1 目标
构建一个类似 Claude Code CLI 的 AI 智能编码助手命令行工具，能够：
- 理解用户的自然语言编码需求
- 自主规划和执行编码任务
- 操作文件系统（读取、编写、修改代码文件）
- 执行终端命令
- 提供实时流式输出反馈
- 支持对话式交互和上下文记忆

### 1.2 技术栈选择
- **核心框架**: LangChain + LangGraph
- **运行时**: Node.js (TypeScript)
- **LLM 提供商**: 支持 Anthropic Claude、OpenAI GPT 等
- **CLI 框架**: Commander.js / Yargs
- **交互界面**: Ink (React for CLI)
- **代码处理**: @babel/parser, typescript

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Interface                         │
│  (用户输入、流式输出显示、进度反馈)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   LangGraph Agent Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ReAct Agent (Reasoning + Acting)                    │   │
│  │  - 任务规划与推理                                     │   │
│  │  - 工具选择与调用                                     │   │
│  │  - 结果验证与迭代                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (MessagesAnnotation)               │   │
│  │  - 对话历史                                           │   │
│  │  - 文件上下文                                         │   │
│  │  - 执行结果                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Checkpointer (MemorySaver)                          │   │
│  │  - 会话持久化                                         │   │
│  │  - 断点续传                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      Tool Layer                              │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ File System    │ │ Code Analysis  │ │ Terminal Exec   │  │
│  │ - read_file    │ │ - parse_code   │ │ - run_command   │  │
│  │ - write_file   │ │ - search_code  │ │ - install_deps  │  │
│  │ - edit_file    │ │ - lint_check   │ └─────────────────┘  │
│  │ - list_dir     │ └────────────────┘                      │
│  └────────────────┘                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ Git Operations │ │ Web Search     │ │ Documentation   │  │
│  │ - git_status   │ │ - search_docs  │ │ - read_docs     │  │
│  │ - git_diff     │ │ - fetch_url    │ │ - api_reference │  │
│  │ - git_commit   │ └────────────────┘ └─────────────────┘  │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

#### 2.2.1 ReAct Agent (基于 LangGraph)
使用 LangGraph 的 `createReactAgent` 实现，遵循 ReAct 模式：
- **Thought**: LLM 分析任务，形成假设
- **Action**: 选择并调用工具执行操作
- **Observation**: 观察工具执行结果
- 循环迭代直到任务完成

**关键实现**:
```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { initChatModel } from "langchain/chat_models/universal";
import { MemorySaver } from "@langchain/langgraph-checkpoint";

const llm = await initChatModel("anthropic:claude-3-5-sonnet-latest");
const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm,
  tools: [
    readFileTool,
    writeFileTool,
    editFileTool,
    listDirectoryTool,
    executeCommandTool,
    searchCodeTool,
    // ... 其他工具
  ],
  checkpointer,
  prompt: systemPrompt,
});
```

#### 2.2.2 状态管理
使用 LangGraph 的 `MessagesAnnotation` 管理状态：

```typescript
import { MessagesAnnotation } from "@langchain/langgraph";

interface AgentState extends typeof MessagesAnnotation.State {
  // 对话消息历史
  messages: BaseMessage[];
  
  // 当前工作目录
  workingDirectory: string;
  
  // 已读取的文件缓存
  fileCache: Map<string, string>;
  
  // 执行计划
  executionPlan?: string[];
  
  // 当前任务状态
  taskStatus: "planning" | "executing" | "completed" | "error";
}
```

#### 2.2.3 会话持久化
使用 `MemorySaver` 实现会话持久化：

```typescript
import { MemorySaver } from "@langchain/langgraph-checkpoint";

const checkpointer = new MemorySaver();

// 启动会话
const config = { 
  configurable: { 
    thread_id: "session-123" 
  } 
};

// 后续可以用相同 thread_id 恢复会话
```

#### 2.2.4 流式输出
使用 LangGraph 的 streaming API 实现实时反馈：

```typescript
for await (const chunk of await agent.stream(
  { messages: [{ role: "user", content: userInput }] },
  { 
    streamMode: "updates",
    configurable: { thread_id: sessionId }
  }
)) {
  // 实时更新 CLI 显示
  console.log(chunk);
}
```

## 3. 工具系统设计

### 3.1 文件系统工具

基于 LangChain 的 `FileManagementToolkit`，扩展以下工具：

#### 3.1.1 read_file
```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";

const readFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return `File content of ${filePath}:\n${content}`;
    } catch (error) {
      return `Error reading file: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "Read the contents of a file at the given path",
    schema: z.object({
      filePath: z.string().describe("Path to the file to read"),
    }),
  }
);
```

#### 3.1.2 write_file
```typescript
const writeFileTool = tool(
  async ({ filePath, content }: { filePath: string; content: string }) => {
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error writing file: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "Write content to a file at the given path",
    schema: z.object({
      filePath: z.string().describe("Path to the file to write"),
      content: z.string().describe("Content to write to the file"),
    }),
  }
);
```

#### 3.1.3 edit_file
```typescript
const editFileTool = tool(
  async ({ 
    filePath, 
    oldString, 
    newString 
  }: { 
    filePath: string; 
    oldString: string; 
    newString: string;
  }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const updated = content.replace(oldString, newString);
      await fs.writeFile(filePath, updated, "utf-8");
      return `Successfully edited ${filePath}`;
    } catch (error) {
      return `Error editing file: ${error.message}`;
    }
  },
  {
    name: "edit_file",
    description: "Edit a file by replacing old string with new string",
    schema: z.object({
      filePath: z.string().describe("Path to the file to edit"),
      oldString: z.string().describe("String to find and replace"),
      newString: z.string().describe("New string to replace with"),
    }),
  }
);
```

#### 3.1.4 list_directory
```typescript
const listDirectoryTool = tool(
  async ({ dirPath }: { dirPath: string }) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const list = entries.map(entry => 
        `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`
      ).join("\n");
      return `Contents of ${dirPath}:\n${list}`;
    } catch (error) {
      return `Error listing directory: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "List all files and directories in the given path",
    schema: z.object({
      dirPath: z.string().describe("Path to the directory to list"),
    }),
  }
);
```

### 3.2 终端执行工具

#### 3.2.1 execute_command
```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const executeCommandTool = tool(
  async ({ 
    command, 
    workingDir 
  }: { 
    command: string; 
    workingDir?: string;
  }) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir || process.cwd(),
        timeout: 30000, // 30 秒超时
      });
      return `Command output:\n${stdout}\n${stderr ? `Errors:\n${stderr}` : ""}`;
    } catch (error) {
      return `Error executing command: ${error.message}`;
    }
  },
  {
    name: "execute_command",
    description: "Execute a shell command in the working directory",
    schema: z.object({
      command: z.string().describe("Shell command to execute"),
      workingDir: z.string().optional().describe("Working directory (defaults to current)"),
    }),
  }
);
```

### 3.3 代码分析工具

#### 3.3.1 search_code
```typescript
import { globby } from "globby";

const searchCodeTool = tool(
  async ({ 
    pattern, 
    directory,
    filePattern 
  }: { 
    pattern: string; 
    directory: string;
    filePattern?: string;
  }) => {
    try {
      const files = await globby(filePattern || "**/*.{ts,tsx,js,jsx}", {
        cwd: directory,
        ignore: ["**/node_modules/**"],
      });
      
      const results: string[] = [];
      for (const file of files) {
        const content = await fs.readFile(path.join(directory, file), "utf-8");
        if (content.includes(pattern)) {
          results.push(file);
        }
      }
      
      return `Files containing "${pattern}":\n${results.join("\n")}`;
    } catch (error) {
      return `Error searching code: ${error.message}`;
    }
  },
  {
    name: "search_code",
    description: "Search for a pattern in code files",
    schema: z.object({
      pattern: z.string().describe("Pattern to search for"),
      directory: z.string().describe("Directory to search in"),
      filePattern: z.string().optional().describe("File glob pattern (e.g., '**/*.ts')"),
    }),
  }
);
```

### 3.4 Git 操作工具

```typescript
const gitStatusTool = tool(
  async ({ workingDir }: { workingDir: string }) => {
    const { stdout } = await execAsync("git status --short", { cwd: workingDir });
    return `Git status:\n${stdout}`;
  },
  {
    name: "git_status",
    description: "Get the current git status",
    schema: z.object({
      workingDir: z.string().describe("Git repository directory"),
    }),
  }
);

const gitDiffTool = tool(
  async ({ workingDir, file }: { workingDir: string; file?: string }) => {
    const cmd = file ? `git diff ${file}` : "git diff";
    const { stdout } = await execAsync(cmd, { cwd: workingDir });
    return `Git diff:\n${stdout}`;
  },
  {
    name: "git_diff",
    description: "Show git diff for changes",
    schema: z.object({
      workingDir: z.string().describe("Git repository directory"),
      file: z.string().optional().describe("Specific file to diff (optional)"),
    }),
  }
);
```

## 4. 交互设计

### 4.1 CLI 命令结构

```bash
# 基础命令
ai-code                           # 启动交互式会话
ai-code "task description"        # 单次任务执行
ai-code --continue <session-id>   # 继续之前的会话
ai-code --list-sessions           # 列出所有会话

# 配置选项
ai-code --model anthropic:claude-3-5-sonnet  # 指定模型
ai-code --working-dir ./src                  # 指定工作目录
ai-code --verbose                            # 详细输出模式
ai-code --dry-run                            # 预览模式（不实际执行）
```

### 4.2 交互流程

```
┌─────────────────────────────────────────┐
│ 1. 用户输入任务                          │
│    "创建一个 React 组件用于显示用户列表"  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 2. Agent 规划 (Thinking)                │
│    - 分析任务需求                        │
│    - 确定所需工具                        │
│    - 制定执行计划                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 3. 执行阶段 (Acting)                     │
│    ├─ list_directory 查看项目结构        │
│    ├─ read_file 读取相关文件             │
│    ├─ write_file 创建新组件              │
│    └─ execute_command 运行 lint          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 4. 结果展示 (Observation)                │
│    - 显示创建的文件                      │
│    - 显示执行结果                        │
│    - 询问是否需要调整                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 5. 用户确认/反馈                         │
│    - 接受结果                            │
│    - 提供修改建议                        │
│    - 请求额外任务                        │
└─────────────────────────────────────────┘
```

### 4.3 实时流式显示

使用 Ink (React for CLI) 创建丰富的 UI：

```typescript
import React from "react";
import { Box, Text, Spinner } from "ink";

interface AgentOutputProps {
  thinking?: string;
  currentAction?: string;
  results?: string[];
  completed: boolean;
}

const AgentOutput: React.FC<AgentOutputProps> = ({
  thinking,
  currentAction,
  results,
  completed,
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
          <Spinner type="dots" />
          <Text color="yellow"> Executing: {currentAction}</Text>
        </Box>
      )}
      
      {results && results.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color="green">✅ Results:</Text>
          {results.map((result, idx) => (
            <Text key={idx}>  • {result}</Text>
          ))}
        </Box>
      )}
      
      {completed && (
        <Text color="green">✨ Task completed!</Text>
      )}
    </Box>
  );
};
```

## 5. System Prompt 设计

```typescript
const systemPrompt = `You are an expert AI coding assistant CLI tool. Your role is to help users with coding tasks by:

1. **Understanding Requirements**: Carefully analyze user requests and ask clarifying questions if needed.

2. **Planning**: Break down complex tasks into smaller steps. Explain your plan before execution.

3. **Tool Usage**: Use the available tools effectively:
   - read_file: Read existing code to understand context
   - write_file: Create new files
   - edit_file: Modify existing files
   - list_directory: Explore project structure
   - execute_command: Run commands (npm install, tests, etc.)
   - search_code: Find specific patterns in codebase
   - git_status/git_diff: Check changes before committing

4. **Best Practices**: 
   - Always read relevant files before making changes
   - Maintain consistent code style with existing codebase
   - Write clean, well-documented code
   - Run tests/linting when appropriate
   - Explain significant changes

5. **Safety**:
   - Never delete files without explicit user confirmation
   - Ask before running potentially destructive commands
   - Validate file paths before operations

6. **Communication**:
   - Provide clear progress updates
   - Explain your reasoning
   - Show what you're doing in real-time
   - Ask for feedback after significant actions

Current working directory: {workingDirectory}
Available tools: {tools}

Remember: You are autonomous but collaborative. Make decisions confidently but seek user input for important choices.`;
```

## 6. 安全性考虑

### 6.1 沙箱限制
- 限制文件操作范围在指定工作目录内
- 禁止访问敏感系统路径（/etc, /sys, etc.）
- 命令执行白名单机制

```typescript
const SAFE_COMMANDS = [
  "npm", "pnpm", "yarn",
  "git",
  "node",
  "tsc", "eslint", "prettier",
  "ls", "cat", "pwd",
];

function validateCommand(command: string): boolean {
  const cmd = command.split(" ")[0];
  return SAFE_COMMANDS.includes(cmd);
}
```

### 6.2 用户确认机制
对于危险操作需要用户确认：

```typescript
import { interrupt } from "@langchain/langgraph";

const deleteFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const response = interrupt(
      `About to delete file: ${filePath}. Confirm? (yes/no)`
    );
    
    if (response === "yes") {
      await fs.unlink(filePath);
      return `Deleted ${filePath}`;
    }
    return "Operation cancelled by user";
  },
  {
    name: "delete_file",
    description: "Delete a file (requires confirmation)",
    schema: z.object({
      filePath: z.string(),
    }),
  }
);
```

## 7. 性能优化

### 7.1 文件缓存
避免重复读取相同文件：

```typescript
class FileCache {
  private cache = new Map<string, { content: string; mtime: Date }>();
  
  async get(filePath: string): Promise<string | null> {
    const cached = this.cache.get(filePath);
    if (!cached) return null;
    
    const stats = await fs.stat(filePath);
    if (stats.mtime > cached.mtime) {
      // 文件已修改，缓存失效
      this.cache.delete(filePath);
      return null;
    }
    
    return cached.content;
  }
  
  set(filePath: string, content: string, mtime: Date): void {
    this.cache.set(filePath, { content, mtime });
  }
}
```

### 7.2 并行工具执行
LangGraph 支持并行执行独立工具：

```typescript
// Agent 自动识别可以并行执行的工具
// 例如：同时读取多个文件
const results = await Promise.all([
  readFileTool.invoke({ filePath: "src/app.ts" }),
  readFileTool.invoke({ filePath: "src/config.ts" }),
  readFileTool.invoke({ filePath: "package.json" }),
]);
```

## 8. 错误处理与恢复

### 8.1 工具执行错误
所有工具需要优雅处理错误：

```typescript
try {
  const result = await tool.invoke(params);
  return result;
} catch (error) {
  return {
    success: false,
    error: error.message,
    suggestion: "建议检查文件路径或权限",
  };
}
```

### 8.2 会话恢复
使用 checkpointer 自动保存状态：

```typescript
// 会话崩溃后恢复
const lastCheckpoint = await checkpointer.get(config);
if (lastCheckpoint) {
  console.log("Found previous session, resuming...");
  const stream = agent.stream(
    { messages: [] }, // 空输入，从检查点恢复
    { 
      configurable: { thread_id: sessionId },
    }
  );
}
```

## 9. 测试策略

### 9.1 单元测试
- 每个工具独立测试
- Mock LLM 响应
- 验证工具输入输出格式

### 9.2 集成测试
- 完整 Agent 工作流测试
- 使用真实 LLM（小任务）
- 验证会话持久化

### 9.3 端到端测试
```typescript
describe("AI Coding Agent", () => {
  it("should create a simple React component", async () => {
    const agent = createAgent();
    const result = await agent.invoke({
      messages: [{
        role: "user",
        content: "Create a Button component in src/components/Button.tsx"
      }]
    });
    
    // 验证文件是否创建
    expect(fs.existsSync("src/components/Button.tsx")).toBe(true);
    
    // 验证文件内容
    const content = await fs.readFile("src/components/Button.tsx", "utf-8");
    expect(content).toContain("export const Button");
  });
});
```

## 10. 部署与发布

### 10.1 包结构
```
ai-code-cli/
├── bin/
│   └── ai-code.js          # CLI 入口
├── src/
│   ├── agent/
│   │   ├── agent.ts        # Agent 核心逻辑
│   │   └── prompt.ts       # System prompts
│   ├── tools/
│   │   ├── file-tools.ts   # 文件系统工具
│   │   ├── exec-tools.ts   # 命令执行工具
│   │   └── code-tools.ts   # 代码分析工具
│   ├── ui/
│   │   └── components.tsx  # CLI UI 组件
│   └── cli.ts              # CLI 主程序
├── package.json
└── tsconfig.json
```

### 10.2 NPM 包发布
```json
{
  "name": "@your-org/ai-code-cli",
  "version": "0.1.0",
  "bin": {
    "ai-code": "./bin/ai-code.js"
  },
  "dependencies": {
    "@langchain/core": "^1.1.16",
    "@langchain/langgraph": "^1.1.1",
    "@langchain/anthropic": "^0.3.29",
    "langchain": "^1.2.11",
    "commander": "^12.0.0",
    "ink": "^4.4.1",
    "react": "^18.2.0",
    "zod": "^3.22.0"
  }
}
```

## 11. 配置管理

### 11.1 配置文件
支持 `.ai-code.config.js` 配置文件：

```javascript
export default {
  // LLM 配置
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    temperature: 0.7,
    maxTokens: 4096,
  },
  
  // 工作目录
  workingDirectory: "./",
  
  // 安全设置
  security: {
    allowedCommands: ["npm", "git", "node"],
    restrictedPaths: ["/etc", "/sys"],
    requireConfirmation: ["delete", "rm", "format"],
  },
  
  // 工具配置
  tools: {
    fileSystem: {
      maxFileSize: 1024 * 1024, // 1MB
      ignorePatterns: ["node_modules", ".git"],
    },
    terminal: {
      timeout: 30000, // 30秒
    },
  },
  
  // UI 配置
  ui: {
    showThinking: true,
    verboseMode: false,
    colorScheme: "default",
  },
};
```

## 12. 未来扩展

### 12.1 多 Agent 协作
使用 LangGraph 的 Swarm 模式实现专业化 Agent：

```typescript
const swarm = createSwarm({
  agents: [
    frontendAgent,  // 专注前端开发
    backendAgent,   // 专注后端开发
    testAgent,      // 专注测试编写
    reviewAgent,    // 代码审查
  ],
  defaultActiveAgent: "frontendAgent",
}).compile();
```

### 12.2 Human-in-the-Loop
关键决策点引入人工干预：

```typescript
const response = interrupt(
  `About to refactor ${fileName}. The changes are:\n${diff}\nApprove? (yes/edit/no)`
);

if (response.type === "edit") {
  // 用户提供修改意见
  const userEdits = response.args.modifications;
  // 应用用户修改
}
```

### 12.3 插件系统
支持第三方工具扩展：

```typescript
// 插件接口
interface ToolPlugin {
  name: string;
  tools: Tool[];
  initialize?: () => Promise<void>;
}

// 注册插件
agent.registerPlugin({
  name: "docker-plugin",
  tools: [dockerBuildTool, dockerRunTool],
});
```

## 13. 关键依赖版本

```json
{
  "@langchain/core": "^1.1.16",
  "@langchain/langgraph": "^1.1.1",
  "@langchain/langgraph-checkpoint": "^1.0.0",
  "@langchain/anthropic": "^0.3.29",
  "@langchain/openai": "^0.3.29",
  "langchain": "^1.2.11",
  "commander": "^12.0.0",
  "ink": "^4.4.1",
  "react": "^18.2.0",
  "zod": "^3.22.0",
  "globby": "^14.0.0"
}
```

## 14. 参考资源

### 14.1 LangChain 文档
- Agent 系统: https://docs.langchain.com/oss/javascript/langchain/agents
- 工具创建: https://docs.langchain.com/oss/javascript/integrations/tools
- 文件系统工具: https://docs.langchain.com/oss/python/integrations/tools/filesystem

### 14.2 LangGraph 文档
- ReAct Agent: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/agents/
- 状态管理: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/concepts/low_level.md
- 持久化: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/concepts/persistence.md
- Streaming: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/agents/streaming.md
- Human-in-the-Loop: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/agents/human-in-the-loop.md
- Multi-Agent: https://github.com/langchain-ai/langgraphjs/blob/main/docs/docs/agents/multi-agent.md

## 15. 总结

本技术方案基于 **LangChain** 和 **LangGraph** 框架，充分利用其提供的：

1. ✅ **ReAct Agent**: 无需自己实现推理循环，使用 `createReactAgent`
2. ✅ **工具系统**: 使用 `tool()` 装饰器定义工具，自动处理工具调用
3. ✅ **状态管理**: 使用 `MessagesAnnotation` 管理对话状态
4. ✅ **持久化**: 使用 `MemorySaver` checkpointer 实现会话持久化
5. ✅ **流式输出**: 使用内置的 `stream()` API 实现实时反馈
6. ✅ **Multi-Agent**: 可选使用 Swarm 模式实现专业化 Agent 协作
7. ✅ **Human-in-the-Loop**: 使用 `interrupt()` 在关键点引入人工确认

这个方案避免了重复造轮子，最大化利用 LangChain/LangGraph 的生态系统，可以快速构建一个功能完整、可靠的 AI 编码助手 CLI 工具。
