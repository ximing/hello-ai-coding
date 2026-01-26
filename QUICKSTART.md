# 快速开始

5 分钟快速启动 AI Coding Agent CLI！

## 前置条件

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Anthropic Claude API Key 或 OpenAI API Key

## 步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 API Key

创建 `.env` 文件：

```bash
# 使用 Anthropic Claude（推荐）
export ANTHROPIC_API_KEY=your-api-key-here

# 或使用 OpenAI
# export OPENAI_API_KEY=your-api-key-here
```

**获取 API Key:**
- Anthropic: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys

### 3. 构建项目

```bash
pnpm build
```

### 4. 启动！

```bash
pnpm start
```

你会看到：

```
┌─────────────────────────────────────────────┐
│ 🤖 AI Coding Agent                          │
│ Session: session-xxxx-1234567890            │
│ Working Dir: /your/project/path             │
└─────────────────────────────────────────────┘

➤ _
```

### 5. 试试第一个任务

输入以下任务并按回车：

```
创建一个 TypeScript 函数 add，接受两个数字参数并返回它们的和，包含类型定义和注释
```

Agent 会：
1. 💭 思考如何完成任务
2. 🛠️ 选择合适的工具
3. ✍️ 创建文件并写入代码
4. ✅ 显示结果

## 更多示例

### 创建 React 组件

```
创建一个 Button 组件在 src/components/Button.tsx，支持不同大小和颜色
```

### 重构代码

```
重构 src/utils/helpers.ts 中的代码，使用更现代的 ES6+ 语法
```

### 添加测试

```
为 src/utils/add.ts 添加单元测试
```

### 安装依赖

```
安装 axios 依赖并创建一个简单的 HTTP 客户端
```

## 交互式命令

在会话中输入：

- `help` - 查看帮助
- `status` - 查看会话状态
- `clear` - 清空屏幕
- `exit` - 退出

或按 `Ctrl+C` 退出。

## 单次任务执行

不想进入交互模式？直接执行：

```bash
node bin/ai-code.js "创建一个简单的 Express 服务器"
```

## 高级选项

```bash
# 指定模型
node bin/ai-code.js --model anthropic:claude-3-opus-20240229 "任务"

# 指定工作目录
node bin/ai-code.js --working-dir ./src "任务"

# 详细输出
node bin/ai-code.js --verbose "任务"

# 预览配置（不执行）
node bin/ai-code.js --dry-run "任务"
```

## 自定义配置

初始化配置文件：

```bash
node bin/ai-code.js init
```

这会创建 `.ai-code.config.js`，你可以自定义：

- LLM 模型和参数
- 安全设置（允许的命令、限制的路径）
- 工具配置
- UI 设置

## 下一步

- 📖 阅读 [README.md](./README.md) 了解完整功能
- 📚 查看 [USAGE.md](./USAGE.md) 学习最佳实践
- 🔧 查看 [.ai-code.config.example.js](./.ai-code.config.example.js) 了解配置选项

## 需要帮助？

- 查看 [故障排除](./USAGE.md#故障排除)
- 提交 Issue: https://github.com/your-repo/issues

开始享受 AI 辅助编码吧！🚀
