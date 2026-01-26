# 使用指南

本文档提供 AI Coding Agent CLI 的详细使用指南和最佳实践。

## 目录

- [安装和配置](#安装和配置)
- [基本使用](#基本使用)
- [高级用法](#高级用法)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 安装和配置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# 使用 Anthropic Claude
export ANTHROPIC_API_KEY=your-api-key-here
export ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选

# 或使用 OpenAI
export OPENAI_API_KEY=your-api-key-here
```

### 3. 初始化配置（可选）

```bash
pnpm build
node bin/ai-code.js init
```

这将创建 `.ai-code.config.js` 配置文件，你可以根据需要自定义。

### 4. 构建项目

```bash
pnpm build
```

## 基本使用

### 启动交互式会话

```bash
pnpm start
# 或
node bin/ai-code.js
```

启动后，你会看到类似的界面：

```
┌─────────────────────────────────────────────┐
│ 🤖 AI Coding Agent                          │
│ Session: session-xxxx-1234567890            │
│ Working Dir: /your/project/path             │
└─────────────────────────────────────────────┘

➤ _
```

### 单次任务执行

如果你只需要执行一个任务，可以直接在命令行传递：

```bash
node bin/ai-code.js "创建一个 TypeScript 工具函数用于深度克隆对象"
```

## 高级用法

### 指定不同的模型

```bash
# 使用 Claude 3 Opus
node bin/ai-code.js --model anthropic:claude-3-opus-20240229 "重构代码"

# 使用 GPT-4
node bin/ai-code.js --model openai:gpt-4 "添加注释"
```

### 指定工作目录

```bash
node bin/ai-code.js --working-dir ./src "分析这个目录的代码结构"
```

### 详细输出模式

```bash
node bin/ai-code.js --verbose "创建一个 Express 服务器"
```

### 预览模式（Dry Run）

查看配置但不执行任何操作：

```bash
node bin/ai-code.js --dry-run "任务描述"
```

### 使用自定义配置文件

```bash
node bin/ai-code.js --config ./my-config.js "任务描述"
```

## 任务示例

### 1. 创建文件和组件

```
➤ 创建一个 React 组件 UserProfile，包含以下功能：
  - 显示用户头像、名称、邮箱
  - 支持编辑模式
  - 使用 TypeScript
  - 添加样式
```

Agent 会：
1. 分析需求
2. 创建组件文件
3. 编写 TypeScript 代码
4. 添加必要的类型定义
5. 创建样式文件

### 2. 重构代码

```
➤ 重构 src/utils/api.ts：
  - 使用 async/await 替代 Promise
  - 添加错误处理
  - 提取公共逻辑
  - 添加 TypeScript 类型
```

### 3. 添加测试

```
➤ 为 src/components/Button.tsx 添加完整的单元测试，包括：
  - 渲染测试
  - 点击事件测试
  - Props 测试
  - 边界情况测试
```

### 4. 代码分析

```
➤ 分析 src/ 目录下的代码，找出：
  - 性能问题
  - 潜在的 bug
  - 代码重复
  - 可优化的地方
```

### 5. 依赖管理

```
➤ 安装 react-query 和 axios，并配置基础的 API 客户端
```

### 6. Git 操作

```
➤ 查看 git 状态，提交所有更改，commit message 为 "feat: add user profile component"
```

## 交互式命令

在交互模式下，可以使用以下特殊命令：

| 命令 | 说明 |
|------|------|
| `help` | 显示/隐藏帮助信息 |
| `clear` | 清空消息历史 |
| `status` | 显示会话信息和缓存统计 |
| `exit` 或 `quit` | 退出程序 |
| `Ctrl+C` | 强制退出 |

## 最佳实践

### 1. 明确的任务描述

❌ 不好的示例：
```
➤ 修改代码
```

✅ 好的示例：
```
➤ 重构 src/utils/api.ts 中的 fetchUser 函数，使用 async/await 替代 .then()，并添加适当的错误处理
```

### 2. 分步骤执行复杂任务

对于复杂任务，可以分多个步骤执行：

```
步骤 1:
➤ 分析 src/components/ 目录的结构，列出所有组件

步骤 2:
➤ 为 Button 组件添加 TypeScript 类型定义

步骤 3:
➤ 为 Button 组件添加单元测试
```

### 3. 让 Agent 先分析再执行

```
➤ 先分析 src/api/users.ts 的代码，列出可以优化的地方，不要修改代码
```

等 Agent 分析完后，再根据建议执行修改。

### 4. 使用 status 查看缓存效率

```
➤ status
```

输出示例：
```
Session: session-abc123-1234567890
Working Directory: /Users/you/project
Cache: 15 hits, 3 misses (83.3%)
```

高缓存命中率意味着 Agent 正在有效地重用已读取的文件。

### 5. 合理配置安全选项

在 `.ai-code.config.js` 中：

```javascript
security: {
  // 只允许必要的命令
  allowedCommands: ["npm", "git", "node", "tsc", "eslint"],
  
  // 保护重要路径
  restrictedPaths: ["/etc", "/sys", "/root", "~/.ssh"],
  
  // 标记危险操作
  requireConfirmation: ["rm", "delete", "drop", "truncate"],
}
```

## 故障排除

### Agent 无法访问文件

**问题**: `Error: Path '/path/to/file' is outside the working directory`

**解决**:
- 确保文件在工作目录内
- 使用 `--working-dir` 指定正确的目录
- 检查 `restrictedPaths` 配置

### 命令执行失败

**问题**: `Error: Command 'xxx' is not in the allowed commands list`

**解决**:
- 在 `.ai-code.config.js` 的 `allowedCommands` 中添加该命令
- 或使用 `execute_command` 时指定完整路径

### API 错误

**问题**: `Error: API key not found`

**解决**:
- 检查 `.env` 文件是否正确配置
- 确保环境变量已导出（`export` 命令）
- 验证 API key 是否有效

### 性能问题

**问题**: Agent 响应很慢

**解决**:
- 减小 `maxTokens` 配置
- 使用更快的模型（如 GPT-3.5-turbo）
- 检查文件缓存是否工作（使用 `status` 命令）
- 减少单次任务的复杂度

### 内存占用过高

**问题**: 进程占用大量内存

**解决**:
- 定期使用 `clear` 命令清空消息历史
- 重启 Agent 会话
- 减小 `maxFileSize` 配置
- 添加更多 `ignorePatterns`

## 高级配置示例

### 前端项目配置

```javascript
export default {
  llm: {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
  },
  
  security: {
    allowedCommands: [
      "npm", "pnpm", "yarn",
      "node",
      "tsc", "eslint", "prettier",
      "git",
    ],
  },
  
  tools: {
    fileSystem: {
      ignorePatterns: [
        "node_modules",
        ".next",
        "dist",
        "build",
        "coverage",
      ],
    },
  },
};
```

### 后端项目配置

```javascript
export default {
  llm: {
    provider: "openai",
    model: "gpt-4-turbo",
  },
  
  security: {
    allowedCommands: [
      "npm", "node",
      "docker", "docker-compose",
      "prisma",
      "git",
    ],
    requireConfirmation: [
      "docker rm",
      "docker stop",
      "prisma migrate",
    ],
  },
};
```

### 严格安全模式

```javascript
export default {
  security: {
    allowedCommands: [
      "npm install",
      "npm test",
      "git status",
      "git diff",
    ],
    restrictedPaths: [
      "/",
      "/etc",
      "/sys",
      "/root",
      "~/.ssh",
      "~/.aws",
    ],
    requireConfirmation: [
      "rm", "delete", "drop",
      "git push", "git force",
      "npm publish",
    ],
  },
  
  tools: {
    fileSystem: {
      maxFileSize: 512 * 1024, // 512KB
    },
    terminal: {
      timeout: 15000, // 15秒
    },
  },
};
```

## 总结

AI Coding Agent CLI 是一个强大的编码助手，能够大大提高开发效率。通过：

1. ✅ 明确的任务描述
2. ✅ 合理的配置
3. ✅ 安全的实践
4. ✅ 分步骤执行

你可以充分发挥它的能力，让 AI 成为你的得力助手！

如有问题或建议，欢迎提交 Issue。
