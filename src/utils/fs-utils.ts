import fs from "fs";
import path from "path";

/**
 * Ensures that a directory exists, creating it if it doesn't
 * Replacement for fs-extra's ensureDirSync
 * @param dirPath - Directory path to ensure exists
 */
export function ensureDirSync(dirPath: string): void {
  try {
    // Check if directory already exists
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      if (stats.isDirectory()) {
        return; // Directory already exists
      }
      throw new Error(`Path exists but is not a directory: ${dirPath}`);
    }

    // Create directory and any parent directories
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(
      `Error ensuring directory exists at ${dirPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Checks if a path exists
 * Replacement for fs-extra's pathExist
 * @param filePath - Path to check
 * @returns Promise that resolves to true if path exists, false otherwise
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronous version of pathExists
 * @param filePath - Path to check
 * @returns true if path exists, false otherwise
 */
export function pathExistsSync(filePath: string): boolean {
  return fs.existsSync(filePath);
}
