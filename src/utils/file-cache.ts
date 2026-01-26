import fs from "fs/promises";

/**
 * 文件缓存条目
 */
interface CacheEntry {
  content: string;
  mtime: Date;
  size: number;
}

/**
 * 文件缓存类
 * 用于避免重复读取相同文件，提高性能
 */
export class FileCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  /**
   * 获取缓存的文件内容
   * 如果文件已修改，返回 null
   */
  async get(filePath: string): Promise<string | null> {
    const cached = this.cache.get(filePath);
    if (!cached) {
      this.misses++;
      return null;
    }

    try {
      const stats = await fs.stat(filePath);

      // 检查文件是否被修改
      if (stats.mtime > cached.mtime) {
        // 文件已修改，缓存失效
        this.cache.delete(filePath);
        this.misses++;
        return null;
      }

      // 缓存命中
      this.hits++;
      return cached.content;
    } catch (error) {
      // 文件可能已被删除
      this.cache.delete(filePath);
      this.misses++;
      return null;
    }
  }

  /**
   * 设置文件缓存
   */
  async set(filePath: string, content: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      this.cache.set(filePath, {
        content,
        mtime: stats.mtime,
        size: stats.size,
      });
    } catch (error) {
      // 忽略错误，不缓存
    }
  }

  /**
   * 使指定文件的缓存失效
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * 获取缓存大小（字节）
   */
  getSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * 检查文件是否在缓存中
   */
  has(filePath: string): boolean {
    return this.cache.has(filePath);
  }
}

/**
 * 全局文件缓存实例
 */
export const globalFileCache = new FileCache();
