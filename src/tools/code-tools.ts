import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { globby } from "globby";
import fs from "fs/promises";
import path from "path";
import type { SecurityValidator } from "../utils/security.js";
import type { AppConfig } from "../utils/config.js";

/**
 * 创建代码分析工具
 */
export function createCodeTools(
  workingDirectory: string,
  security: SecurityValidator,
  config: AppConfig
) {
  /**
   * 搜索代码工具
   */
  const searchCodeTool = tool(
    async ({
      pattern,
      directory,
      filePattern,
    }: {
      pattern: string;
      directory?: string;
      filePattern?: string;
    }) => {
      try {
        const searchDir = directory || workingDirectory;

        // 安全验证
        const validation = security.validatePath(searchDir);
        if (!validation.valid) {
          return `Error: ${validation.reason}`;
        }

        const absoluteDir = path.isAbsolute(searchDir)
          ? searchDir
          : path.join(workingDirectory, searchDir);

        // 默认文件模式
        const globPattern =
          filePattern || "**/*.{ts,tsx,js,jsx,json,md,css,html}";

        // 搜索文件
        const files = await globby(globPattern, {
          cwd: absoluteDir,
          ignore: config.tools.fileSystem.ignorePatterns,
          absolute: false,
        });

        // 在文件中搜索模式
        const results: Array<{ file: string; matches: number; lines: string[] }> = [];

        for (const file of files) {
          const filePath = path.join(absoluteDir, file);
          const content = await fs.readFile(filePath, "utf-8");

          if (content.includes(pattern)) {
            // 找到匹配的行
            const lines = content.split("\n");
            const matchingLines: string[] = [];
            let matchCount = 0;

            lines.forEach((line, index) => {
              if (line.includes(pattern)) {
                matchCount++;
                matchingLines.push(`  Line ${index + 1}: ${line.trim()}`);
              }
            });

            results.push({
              file,
              matches: matchCount,
              lines: matchingLines.slice(0, 5), // 最多显示5行
            });
          }
        }

        if (results.length === 0) {
          return `No files found containing pattern "${pattern}" in ${searchDir}`;
        }

        // 格式化结果
        let output = `Found pattern "${pattern}" in ${results.length} file(s):\n\n`;

        for (const result of results) {
          output += `${result.file} (${result.matches} matches):\n`;
          output += result.lines.join("\n");
          if (result.matches > 5) {
            output += `\n  ... and ${result.matches - 5} more matches`;
          }
          output += "\n\n";
        }

        return output;
      } catch (error) {
        return `Error searching code: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "search_code",
      description:
        "Search for a text pattern in code files. Use this to find where specific functions, variables, or patterns are used in the codebase.",
      schema: z.object({
        pattern: z.string().describe("Text pattern to search for"),
        directory: z
          .string()
          .optional()
          .describe(
            "Directory to search in (defaults to project root, relative or absolute)"
          ),
        filePattern: z
          .string()
          .optional()
          .describe(
            "Glob pattern for files to search (e.g., '**/*.ts', defaults to common code files)"
          ),
      }),
    }
  );

  return {
    searchCodeTool,
  };
}
