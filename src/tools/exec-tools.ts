import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import type { SecurityValidator } from "../utils/security.js";
import type { AppConfig } from "../utils/config.js";

const execAsync = promisify(exec);

/**
 * 创建终端执行工具
 */
export function createExecTools(
  workingDirectory: string,
  security: SecurityValidator,
  config: AppConfig
) {
  /**
   * 执行命令工具
   */
  const executeCommandTool = tool(
    async ({
      command,
      workingDir,
    }: {
      command: string;
      workingDir?: string;
    }) => {
      try {
        // 安全验证
        const validation = security.validateCommand(command);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        // 验证工作目录
        const cwd = workingDir || workingDirectory;
        const pathValidation = security.validatePath(cwd);
        if (!pathValidation.valid) {
          return `Error: ${pathValidation.reason}`;
        }

        // 执行命令
        const { stdout, stderr } = await execAsync(command, {
          cwd,
          timeout: config.tools.terminal.timeout,
          maxBuffer: 1024 * 1024, // 1MB
        });

        let result = `Command: ${command}\n`;
        result += `Working directory: ${cwd}\n\n`;

        if (stdout) {
          result += `Output:\n${stdout}\n`;
        }

        if (stderr) {
          result += `\nStderr:\n${stderr}`;
        }

        return result;
      } catch (error: any) {
        let errorMsg = `Error executing command '${command}':\n`;

        if (error.killed) {
          errorMsg += `Command was killed (timeout: ${config.tools.terminal.timeout}ms)`;
        } else if (error.code) {
          errorMsg += `Exit code: ${error.code}\n`;
          if (error.stdout) errorMsg += `Stdout: ${error.stdout}\n`;
          if (error.stderr) errorMsg += `Stderr: ${error.stderr}`;
        } else {
          errorMsg += error.message;
        }

        return errorMsg;
      }
    },
    {
      name: "execute_command",
      description:
        "Execute a shell command in the working directory. Use this to run npm install, tests, linting, or other terminal commands. Only whitelisted commands are allowed.",
      schema: z.object({
        command: z
          .string()
          .describe(
            "Shell command to execute (must be from allowed commands list)"
          ),
        workingDir: z
          .string()
          .optional()
          .describe(
            "Working directory for command execution (defaults to project root)"
          ),
      }),
    }
  );

  return {
    executeCommandTool,
  };
}
