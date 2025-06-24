import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { Logger } from './logger.js';

export interface FileLoadResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FileLoader {
  static loadYaml<T = unknown>(filePath: string): FileLoadResult<T> {
    try {
      if (!existsSync(filePath)) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const fileContent = readFileSync(filePath, 'utf8');
      const data = parseYaml(fileContent) as T;

      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Logger.debug(`Failed to load YAML file ${filePath}: ${errorMessage}`);
      
      return {
        success: false,
        error: `Failed to parse YAML file: ${errorMessage}`,
      };
    }
  }

  static fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }
} 