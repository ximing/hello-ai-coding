import path from "path";
import type { AppConfig } from "./config.js";

/**
 * 验证命令是否在白名单中
 */
export function validateCommand(
  command: string,
  allowedCommands: string[]
): { valid: boolean; reason?: string } {
  const cmd = command.trim().split(/\s+/)[0];

  // 检查是否在白名单中
  const isAllowed = allowedCommands.some(
    (allowed) => cmd === allowed || cmd.startsWith(`${allowed}/`)
  );

  if (!isAllowed) {
    return {
      valid: false,
      reason: `Command '${cmd}' is not in the allowed commands list. Allowed: ${allowedCommands.join(", ")}`,
    };
  }

  // 检查危险模式
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /sudo\s+rm/,
    /:\(\)\{\s*:\|:&\s*\};:/, // fork bomb
    /mkfs/,
    /dd\s+if=/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        valid: false,
        reason: `Command contains dangerous pattern and is blocked for safety`,
      };
    }
  }

  return { valid: true };
}

/**
 * 验证文件路径是否安全
 */
export function validatePath(
  filePath: string,
  workingDirectory: string,
  restrictedPaths: string[]
): { valid: boolean; reason?: string } {
  try {
    // 解析为绝对路径
    const absolutePath = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(workingDirectory, filePath);

    // 检查是否在工作目录内
    const relative = path.relative(workingDirectory, absolutePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return {
        valid: false,
        reason: `Path '${filePath}' is outside the working directory '${workingDirectory}'`,
      };
    }

    // 检查是否在受限路径中
    for (const restrictedPath of restrictedPaths) {
      if (absolutePath.startsWith(restrictedPath)) {
        return {
          valid: false,
          reason: `Path '${filePath}' is in restricted area '${restrictedPath}'`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `Invalid path: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * 检查操作是否需要用户确认
 */
export function requiresConfirmation(
  operation: string,
  requireConfirmationList: string[]
): boolean {
  const lowerOp = operation.toLowerCase();
  return requireConfirmationList.some((keyword) =>
    lowerOp.includes(keyword.toLowerCase())
  );
}

/**
 * 检查文件大小是否超过限制
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number
): { valid: boolean; reason?: string } {
  if (fileSize > maxSize) {
    return {
      valid: false,
      reason: `File size ${fileSize} bytes exceeds maximum allowed size ${maxSize} bytes`,
    };
  }
  return { valid: true };
}

/**
 * 安全包装器：在执行操作前进行安全检查
 */
export class SecurityValidator {
  constructor(private config: AppConfig) {}

  validateCommand(command: string) {
    return validateCommand(command, this.config.security.allowedCommands);
  }

  validatePath(filePath: string) {
    return validatePath(
      filePath,
      this.config.workingDirectory,
      this.config.security.restrictedPaths
    );
  }

  requiresConfirmation(operation: string) {
    return requiresConfirmation(
      operation,
      this.config.security.requireConfirmation
    );
  }

  validateFileSize(fileSize: number) {
    return validateFileSize(
      fileSize,
      this.config.tools.fileSystem.maxFileSize
    );
  }
}
