# AI Coding Agent CLI

🤖 **AI Coding Assistant CLI** - 基于 LangChain 和 LangGraph 的智能编码助手命令行工具

## 特性

✨ **智能编码助手**
- 理解自然语言需求，自主规划和执行编码任务
- 支持文件操作（读取、编写、修改）
- 执行终端命令（npm、git、测试等）
- 代码搜索和分析
- Git 操作集成

🎨 **丰富的交互界面**
- 基于 Ink (React for CLI) 的美观界面
- 实时流式输出反馈
- 对话式交互和上下文记忆

🔒 **安全可靠**
- 命令白名单机制
- 路径安全验证
- 危险操作确认

⚡ **高性能**
- 智能文件缓存
- 并行工具执行
- 会话持久化

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件并配置 API Key：

```bash
# Anthropic Claude
export ANTHROPIC_API_KEY=your-api-key-here
export ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选

# 或者使用 OpenAI
export OPENAI_API_KEY=your-api-key-here
```

### 构建项目

```bash
pnpm build
```

### 运行

```bash
# 交互式会话
pnpm start

# 或直接使用命令
node bin/ai-code.js

# 单次任务执行
node bin/ai-code.js "创建一个 React 组件用于显示用户列表"

# 指定工作目录
node bin/ai-code.js --working-dir ./src "重构这个模块"

# 详细输出模式
node bin/ai-code.js --verbose "分析代码质量"
```

## 命令行选项

### 基础命令

```bash
# 启动交互式会话
ai-code

# 单次任务执行
ai-code "task description"

# 继续之前的会话（未来版本）
ai-code --continue <session-id>

# 列出所有会话（未来版本）
ai-code --list-sessions

# 初始化配置文件
ai-code init

# 清理缓存
ai-code clean
```

### 选项

- `--model <model>` - 指定 LLM 模型（如 `anthropic:claude-3-5-sonnet-20241022`）
- `--working-dir <dir>` - 指定工作目录（默认：当前目录）
- `--verbose` - 启用详细输出模式
- `--dry-run` - 预览模式，不实际执行操作
- `--config <path>` - 指定配置文件路径

## 配置

### 创建配置文件

```bash
ai-code init
```

这将在当前目录创建 `.ai-code.config.js` 配置文件。

### 配置示例

```javascript
export default {
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
  },
  
  workingDirectory: "./",
  
  security: {
    allowedCommands: ["npm", "git", "node", "tsc"],
    restrictedPaths: ["/etc", "/sys"],
    requireConfirmation: ["rm", "delete"],
  },
  
  tools: {
    fileSystem: {
      maxFileSize: 1024 * 1024, // 1MB
      ignorePatterns: ["node_modules", ".git"],
    },
    terminal: {
      timeout: 30000, // 30秒
    },
  },
  
  ui: {
    showThinking: true,
    verboseMode: false,
  },
};
```

完整配置选项请参考 `.ai-code.config.example.js`。

## 使用示例

### 1. 创建新组件

```bash
ai-code "创建一个 React 组件 UserCard，显示用户头像、名称和邮箱"
```

### 2. 重构代码

```bash
ai-code "重构 src/utils/api.ts，使用 async/await 替代 Promise"
```

### 3. 添加测试

```bash
ai-code "为 src/components/Button.tsx 添加单元测试"
```

### 4. 分析和优化

```bash
ai-code "分析 src/ 目录下的代码，找出性能问题并提供优化建议"
```

### 5. Git 操作

```bash
ai-code "检查 git 状态，提交所有更改并推送"
```

### 6. 安装依赖

```bash
ai-code "安装 axios 和 lodash 依赖"
```

## 交互式命令

在交互模式下，你可以使用以下命令：

- `help` - 显示帮助信息
- `clear` - 清空屏幕
- `status` - 显示会话信息和缓存统计
- `exit` 或 `quit` - 退出程序
- `Ctrl+C` - 退出程序

## 可用工具

Agent 可以使用以下工具：

### 文件系统工具
- `read_file` - 读取文件内容
- `write_file` - 写入文件
- `edit_file` - 编辑文件（字符串替换）
- `list_directory` - 列出目录内容

### 终端执行工具
- `execute_command` - 执行 shell 命令

### 代码分析工具
- `search_code` - 在代码中搜索模式

### Git 操作工具
- `git_status` - 获取 git 状态
- `git_diff` - 显示 git diff
- `git_add` - 暂存文件

## 技术栈

- **框架**: LangChain + LangGraph
- **运行时**: Node.js (TypeScript)
- **LLM**: Anthropic Claude / OpenAI GPT
- **CLI**: Commander.js
- **UI**: Ink (React for CLI)
- **类型**: TypeScript

## 架构

```
src/
├── agent/          # Agent 核心逻辑
│   ├── agent.ts    # ReAct Agent 实现
│   ├── prompt.ts   # System prompts
│   └── state.ts    # 状态定义
├── tools/          # 工具系统
│   ├── file-tools.ts    # 文件操作工具
│   ├── exec-tools.ts    # 命令执行工具
│   ├── code-tools.ts    # 代码分析工具
│   └── git-tools.ts     # Git 操作工具
├── ui/             # UI 组件
│   ├── components.tsx   # Ink 组件
│   └── cli.tsx         # CLI 主界面
├── utils/          # 工具函数
│   ├── config.ts   # 配置管理
│   ├── security.ts # 安全验证
│   └── file-cache.ts    # 文件缓存
└── cli.ts          # CLI 入口
```

## 安全性

### 命令白名单
只有配置中 `allowedCommands` 列表中的命令可以执行。

### 路径限制
Agent 只能访问工作目录内的文件，无法访问 `restrictedPaths` 中的路径。

### 操作确认
包含 `requireConfirmation` 关键词的操作需要用户确认（未来版本实现）。

## 开发

### 开发模式

```bash
# 监听文件变化并自动编译
pnpm dev

# 在另一个终端运行
pnpm start
```

### 代码格式化

```bash
pnpm format
```

### 代码检查

```bash
pnpm lint
pnpm lint:fix
```

## 未来计划

- [ ] 会话持久化到磁盘
- [ ] 会话恢复和列表功能
- [ ] Human-in-the-Loop 确认机制
- [ ] 多 Agent 协作
- [ ] 插件系统
- [ ] 代码审查工具
- [ ] 测试生成工具
- [ ] 文档生成工具

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关资源

- [LangChain 文档](https://docs.langchain.com/)
- [LangGraph 文档](https://langchain-ai.github.io/langgraphjs/)
- [Anthropic Claude](https://www.anthropic.com/)
- [OpenAI API](https://openai.com/api/)
