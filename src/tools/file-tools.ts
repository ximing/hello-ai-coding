import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import type { FileCache } from "../utils/file-cache.js";
import type { SecurityValidator } from "../utils/security.js";

/**
 * 创建文件系统工具
 */
export function createFileTools(
  workingDirectory: string,
  security: SecurityValidator,
  fileCache: FileCache
) {
  /**
   * 读取文件工具
   */
  const readFileTool = tool(
    async ({ filePath }: { filePath: string }) => {
      try {
        // 安全验证
        const validation = security.validatePath(filePath);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workingDirectory, filePath);

        // 尝试从缓存获取
        const cached = await fileCache.get(absolutePath);
        if (cached !== null) {
          return `File content of ${filePath} (from cache):\n\n${cached}`;
        }

        // 读取文件
        const content = await fs.readFile(absolutePath, "utf-8");

        // 更新缓存
        await fileCache.set(absolutePath, content);

        return `File content of ${filePath}:\n\n${content}`;
      } catch (error) {
        return `Error reading file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "read_file",
      description:
        "Read the contents of a file at the given path. Use this to understand existing code before making changes.",
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file to read (relative or absolute)"),
      }),
    }
  );

  /**
   * 写入文件工具
   */
  const writeFileTool = tool(
    async ({ filePath, content }: { filePath: string; content: string }) => {
      try {
        // 安全验证
        const validation = security.validatePath(filePath);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workingDirectory, filePath);

        // 确保目录存在
        const dir = path.dirname(absolutePath);
        await fs.mkdir(dir, { recursive: true });

        // 写入文件
        await fs.writeFile(absolutePath, content, "utf-8");

        // 使缓存失效
        fileCache.invalidate(absolutePath);

        return `Successfully wrote to ${filePath} (${content.length} characters)`;
      } catch (error) {
        return `Error writing file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "write_file",
      description:
        "Write content to a file at the given path. Creates the file and any necessary directories if they don't exist.",
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file to write (relative or absolute)"),
        content: z.string().describe("Content to write to the file"),
      }),
    }
  );

  /**
   * 编辑文件工具
   */
  const editFileTool = tool(
    async ({
      filePath,
      oldString,
      newString,
    }: {
      filePath: string;
      oldString: string;
      newString: string;
    }) => {
      try {
        // 安全验证
        const validation = security.validatePath(filePath);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const absolutePath = path.isAbsolute(filePath)
          ? filePath
          : path.join(workingDirectory, filePath);

        // 读取文件
        const content = await fs.readFile(absolutePath, "utf-8");

        // 检查 oldString 是否存在
        if (!content.includes(oldString)) {
          return `Error: Could not find the specified text in ${filePath}.\nMake sure the oldString exactly matches the content in the file.`;
        }

        // 替换内容
        const updated = content.replace(oldString, newString);

        // 写回文件
        await fs.writeFile(absolutePath, updated, "utf-8");

        // 使缓存失效
        fileCache.invalidate(absolutePath);

        return `Successfully edited ${filePath}. Replaced ${oldString.length} characters with ${newString.length} characters.`;
      } catch (error) {
        return `Error editing file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "edit_file",
      description:
        "Edit a file by replacing an exact string with a new string. Use this for precise modifications to existing files.",
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file to edit (relative or absolute)"),
        oldString: z
          .string()
          .describe(
            "Exact string to find and replace (must match exactly including whitespace)"
          ),
        newString: z.string().describe("New string to replace with"),
      }),
    }
  );

  /**
   * 列出目录工具
   */
  const listDirectoryTool = tool(
    async ({ dirPath }: { dirPath: string }) => {
      try {
        // 安全验证
        const validation = security.validatePath(dirPath);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const absolutePath = path.isAbsolute(dirPath)
          ? dirPath
          : path.join(workingDirectory, dirPath);

        // 读取目录
        const entries = await fs.readdir(absolutePath, { withFileTypes: true });

        // 格式化输出
        const list = entries
          .map((entry) => {
            const type = entry.isDirectory()
              ? "[DIR] "
              : entry.isSymbolicLink()
                ? "[LINK]"
                : "[FILE]";
            return `${type} ${entry.name}`;
          })
          .join("\n");

        return `Contents of ${dirPath}:\n\n${list}\n\nTotal: ${entries.length} items`;
      } catch (error) {
        return `Error listing directory ${dirPath}: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "list_directory",
      description:
        "List all files and directories in the given path. Use this to explore the project structure.",
      schema: z.object({
        dirPath: z
          .string()
          .describe("Path to the directory to list (relative or absolute)"),
      }),
    }
  );

  return {
    readFileTool,
    writeFileTool,
    editFileTool,
    listDirectoryTool,
  };
}
