import { validateStack } from './schema.js';
import { FileLoader } from './utils/fileLoader.js';
import { Logger } from './utils/logger.js';

export interface ValidateOptions {
  file: string;
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  Logger.header('Validating Stack Configuration');
  
  // Load the YAML file
  const fileResult = FileLoader.loadYaml(options.file);
  
  if (!fileResult.success) {
    Logger.error(`Failed to load ${options.file}: ${fileResult.error}`);
    return;
  }

  Logger.step(`Loaded ${options.file}`);

  // Validate against schema
  const validationResult = validateStack(fileResult.data);

  if (validationResult.success) {
    Logger.success('Stack configuration is valid!');
    
    // Display key information about the stack
    const stack = validationResult.data;
    Logger.info(`Stack: ${stack.name} (${stack.id})`);
    Logger.info(`Version: ${stack.version}`);
    Logger.info(`Author: ${stack.author}`);
    Logger.info(`Container: ${stack.containerImage}`);
    Logger.info(`GPU: ${stack.gpu.count}x ${stack.gpu.type}`);
    Logger.info(`Memory: ${stack.memory}GB`);
    
    if (stack.ports && stack.ports.length > 0) {
      Logger.info(`Ports: ${stack.ports.map(p => `${p.containerPort}${p.exposedPort ? `:${p.exposedPort}` : ''}`).join(', ')}`);
    }
    
    if (stack.env && stack.env.length > 0) {
      Logger.info(`Environment variables: ${stack.env.length} defined`);
    }
  } else {
    Logger.error('Stack configuration validation failed:');
    validationResult.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    
    throw new Error('Validation failed');
  }
} 