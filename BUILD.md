# 构建和运行指南

本文档详细说明如何构建和运行 AI Coding Agent CLI 项目。

## 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0（推荐使用 pnpm@10.22.0）
- **操作系统**: macOS / Linux / Windows（WSL）

## 步骤详解

### 1. 克隆或定位到项目目录

```bash
cd /path/to/hello-ai-coding
```

### 2. 安装依赖

```bash
pnpm install
```

这将安装所有必需的依赖，包括：
- LangChain 和 LangGraph 核心库
- Anthropic 和 OpenAI 客户端
- Commander.js（CLI 框架）
- Ink（React for CLI）
- TypeScript 和类型定义

**预期结果**: 
- `node_modules/` 目录被创建
- `pnpm-lock.yaml` 被更新（如果依赖有变化）

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# 创建 .env 文件
touch .env

# 编辑并添加以下内容
cat > .env << 'EOF'
# 使用 Anthropic Claude（推荐）
export ANTHROPIC_API_KEY=your-anthropic-api-key-here
export ANTHROPIC_BASE_URL=https://api.anthropic.com

# 或使用 OpenAI
# export OPENAI_API_KEY=your-openai-api-key-here
EOF
```

**获取 API Key**:
- **Anthropic**: https://console.anthropic.com/settings/keys
- **OpenAI**: https://platform.openai.com/api-keys

**验证配置**:
```bash
# 加载环境变量
source .env

# 验证
echo $ANTHROPIC_API_KEY
```

### 4. 构建项目

```bash
pnpm build
```

这会执行 `tsc` 命令，将 TypeScript 源代码编译为 JavaScript。

**编译过程**:
- 读取 `tsconfig.json` 配置
- 编译 `src/**/*.ts` 和 `src/**/*.tsx` 文件
- 输出到 `dist/` 目录
- 生成类型声明文件（.d.ts）
- 生成 source map

**预期结果**:
```
dist/
├── agent/
│   ├── agent.js
│   ├── agent.d.ts
│   ├── prompt.js
│   ├── state.js
│   └── ...
├── tools/
├── ui/
├── utils/
├── cli.js
└── index.js
```

**常见问题**:

❌ **错误**: `Cannot find module ...`
- 检查所有导入是否使用 `.js` 扩展名（ESM 要求）
- 检查 `tsconfig.json` 的 `moduleResolution` 设置

❌ **错误**: `Type errors`
- 运行 `pnpm install` 确保所有类型定义已安装
- 检查 TypeScript 版本是否匹配

### 5. 运行程序

#### 方式 1: 使用 npm script（推荐）

```bash
pnpm start
```

#### 方式 2: 直接运行

```bash
node bin/ai-code.js
```

#### 方式 3: 单次任务执行

```bash
node bin/ai-code.js "创建一个 Hello World 函数"
```

#### 方式 4: 带选项运行

```bash
# 详细输出
node bin/ai-code.js --verbose "任务描述"

# 指定模型
node bin/ai-code.js --model anthropic:claude-3-opus-20240229 "任务"

# 预览配置（不执行）
node bin/ai-code.js --dry-run "任务"
```

### 6. 开发模式（可选）

在开发过程中，可以使用 watch 模式：

```bash
# 终端 1: 监听文件变化并自动编译
pnpm dev

# 终端 2: 运行程序
pnpm start
```

`pnpm dev` 会执行 `tsc --watch`，自动重新编译修改的文件。

## 验证安装

### 检查 1: 版本信息

```bash
node bin/ai-code.js --help
```

应该看到:
```
Usage: ai-code [options] [task]

AI Coding Assistant CLI - Your intelligent coding companion

Options:
  -V, --version           output the version number
  --model <model>         LLM model to use
  --working-dir <dir>     Working directory (default: current)
  --verbose               Enable verbose output
  --dry-run               Preview mode
  --config <path>         Path to config file
  -h, --help              display help for command
```

### 检查 2: Dry-run 模式

```bash
node bin/ai-code.js --dry-run "test"
```

应该看到配置信息而不执行任何操作。

### 检查 3: 初始化配置

```bash
node bin/ai-code.js init
```

应该在当前目录创建 `.ai-code.config.js` 文件。

## 故障排除

### 问题 1: 模块未找到

```
Error: Cannot find module 'xxx'
```

**解决**:
```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### 问题 2: TypeScript 编译错误

```
error TS2307: Cannot find module ...
```

**解决**:
```bash
# 安装类型定义
pnpm add -D @types/node @types/react

# 重新构建
pnpm build
```

### 问题 3: 环境变量未加载

```
Error: API key not found
```

**解决**:
```bash
# 确保 .env 文件存在并正确配置
cat .env

# 在当前 shell 加载
source .env

# 验证
echo $ANTHROPIC_API_KEY
```

### 问题 4: 权限错误（Unix/Linux）

```
Permission denied: bin/ai-code.js
```

**解决**:
```bash
chmod +x bin/ai-code.js
```

### 问题 5: Ink 渲染问题

```
Error: process.stdin is not a TTY
```

**原因**: 在非交互式环境（如 CI/CD）中运行

**解决**: 使用单次任务模式而不是交互模式
```bash
node bin/ai-code.js "task" # 不要使用交互式会话
```

## 性能优化

### 优化编译速度

使用增量编译:
```bash
pnpm dev  # tsc --watch
```

### 优化运行时性能

1. **使用文件缓存**: Agent 会自动缓存读取的文件
2. **合理设置超时**: 在配置中调整 `tools.terminal.timeout`
3. **限制文件大小**: 在配置中调整 `tools.fileSystem.maxFileSize`

### 监控性能

在交互模式中使用 `status` 命令查看缓存统计:
```
➤ status

Session: session-abc123-1234567890
Working Directory: /Users/you/project
Cache: 15 hits, 3 misses (83.3%)
```

## 生产部署（未来）

虽然当前版本主要用于本地开发，但如需全局安装：

```bash
# 方式 1: 本地链接
pnpm link --global

# 方式 2: 发布到 npm
pnpm publish

# 方式 3: 从 tarball 安装
pnpm pack
pnpm install -g osg-fe-ai-tools-0.1.0.tgz
```

安装后可以直接使用 `ai-code` 命令。

## 清理

### 清理构建产物

```bash
rm -rf dist
```

### 清理依赖

```bash
rm -rf node_modules
```

### 完全清理

```bash
pnpm run rm:node_modules  # 清理所有 node_modules
rm -rf dist pnpm-lock.yaml
```

## 持续开发工作流

推荐的开发工作流：

```bash
# 1. 修改源代码
vim src/agent/agent.ts

# 2. 自动编译（如果运行了 pnpm dev）
# 或手动编译
pnpm build

# 3. 测试
pnpm start

# 4. 代码检查和格式化
pnpm lint:fix
pnpm format

# 5. 提交更改
git add .
git commit -m "feat: add new feature"
```

## 集成到现有项目

如果你想在其他项目中使用 AI Coding Agent：

```bash
# 1. 在其他项目中安装（未发布前使用本地路径）
cd /path/to/other-project
pnpm add /path/to/hello-ai-coding

# 2. 在代码中使用
import { createAgent, loadConfig } from 'osg-fe-ai-tools';

const config = await loadConfig();
const { agent } = await createAgent(config);
```

## 总结

构建和运行流程：

1. ✅ `pnpm install` - 安装依赖
2. ✅ 配置 `.env` - 设置 API Key
3. ✅ `pnpm build` - 编译 TypeScript
4. ✅ `pnpm start` - 运行程序

就这么简单！🚀

如有问题，请查看 `USAGE.md` 的故障排除部分或提交 Issue。
