import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import type { SecurityValidator } from "../utils/security.js";

const execAsync = promisify(exec);

/**
 * 创建 Git 操作工具
 */
export function createGitTools(
  workingDirectory: string,
  security: SecurityValidator
) {
  /**
   * Git Status 工具
   */
  const gitStatusTool = tool(
    async ({ workingDir }: { workingDir?: string }) => {
      try {
        const cwd = workingDir || workingDirectory;

        // 安全验证
        const validation = security.validatePath(cwd);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const { stdout, stderr } = await execAsync("git status --short", {
          cwd,
        });

        if (!stdout && !stderr) {
          return "Git status: Working tree clean (no changes)";
        }

        let result = "Git status:\n\n";
        if (stdout) {
          result += stdout;
        }
        if (stderr) {
          result += `\nWarnings:\n${stderr}`;
        }

        return result;
      } catch (error: any) {
        if (error.message.includes("not a git repository")) {
          return "Error: Not a git repository. Initialize git first with 'git init'.";
        }
        return `Error getting git status: ${error.message}`;
      }
    },
    {
      name: "git_status",
      description:
        "Get the current git status showing modified, staged, and untracked files. Use this before committing changes.",
      schema: z.object({
        workingDir: z
          .string()
          .optional()
          .describe(
            "Git repository directory (defaults to project root, relative or absolute)"
          ),
      }),
    }
  );

  /**
   * Git Diff 工具
   */
  const gitDiffTool = tool(
    async ({
      workingDir,
      file,
      staged,
    }: {
      workingDir?: string;
      file?: string;
      staged?: boolean;
    }) => {
      try {
        const cwd = workingDir || workingDirectory;

        // 安全验证
        const validation = security.validatePath(cwd);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        // 构建命令
        let cmd = "git diff";
        if (staged) {
          cmd += " --staged";
        }
        if (file) {
          cmd += ` ${file}`;
        }

        const { stdout, stderr } = await execAsync(cmd, { cwd });

        if (!stdout && !stderr) {
          return staged
            ? "No staged changes to show."
            : "No unstaged changes to show.";
        }

        let result = `Git diff${staged ? " (staged)" : ""}${file ? ` for ${file}` : ""}:\n\n`;
        if (stdout) {
          result += stdout;
        }
        if (stderr) {
          result += `\nWarnings:\n${stderr}`;
        }

        return result;
      } catch (error: any) {
        if (error.message.includes("not a git repository")) {
          return "Error: Not a git repository.";
        }
        return `Error getting git diff: ${error.message}`;
      }
    },
    {
      name: "git_diff",
      description:
        "Show git diff for changes. Use this to review what has changed before committing.",
      schema: z.object({
        workingDir: z
          .string()
          .optional()
          .describe("Git repository directory (defaults to project root)"),
        file: z
          .string()
          .optional()
          .describe(
            "Specific file to show diff for (optional, shows all changes if not specified)"
          ),
        staged: z
          .boolean()
          .optional()
          .describe(
            "Show staged changes instead of unstaged (default: false)"
          ),
      }),
    }
  );

  /**
   * Git Add 工具
   */
  const gitAddTool = tool(
    async ({
      workingDir,
      files,
    }: {
      workingDir?: string;
      files: string | string[];
    }) => {
      try {
        const cwd = workingDir || workingDirectory;

        // 安全验证
        const validation = security.validatePath(cwd);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const fileList = Array.isArray(files) ? files.join(" ") : files;
        const { stdout, stderr } = await execAsync(`git add ${fileList}`, {
          cwd,
        });

        let result = `Successfully staged: ${fileList}\n`;
        if (stdout) result += stdout;
        if (stderr) result += `\nWarnings:\n${stderr}`;

        return result;
      } catch (error: any) {
        return `Error staging files: ${error.message}`;
      }
    },
    {
      name: "git_add",
      description:
        "Stage files for commit. Use this to prepare files for committing.",
      schema: z.object({
        workingDir: z
          .string()
          .optional()
          .describe("Git repository directory (defaults to project root)"),
        files: z
          .union([z.string(), z.array(z.string())])
          .describe(
            "File(s) to stage. Can be a single file, multiple files, or '.' for all changes"
          ),
      }),
    }
  );

  return {
    gitStatusTool,
    gitDiffTool,
    gitAddTool,
  };
}
