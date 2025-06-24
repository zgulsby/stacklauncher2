import { FileLoader } from './utils/fileLoader';
import { StackSchema, validateStack } from './schema';
import { Logger } from './utils/logger';

export async function validateCommand(options: { file: string }): Promise<void> {
  const fileResult = FileLoader.loadYaml(options.file);

  if (!fileResult.success) {
    Logger.error(`Failed to load ${options.file}: ${fileResult.error}`);
    process.exit(1); // invalid config
  }

  const validationResult = validateStack(fileResult.data);

  if (!validationResult.success) {
    Logger.error('Stack configuration validation failed:');
    validationResult.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    process.exit(1); // invalid config
  }

  Logger.success('Stack configuration is valid');
  process.exit(0);
} 