import { FileLoader } from './utils/fileLoader';
import { validateStack } from './schema';
import { Logger } from './utils/logger';
import chalk from 'chalk';

export async function envListCommand(options: { file: string }): Promise<void> {
  Logger.info('Reading environment variables from stack configuration...');

  const fileResult = FileLoader.loadYaml(options.file);
  if (!fileResult.success) {
    Logger.error(`Failed to load ${options.file}: ${fileResult.error}`);
    process.exit(1);
  }

  const validationResult = validateStack(fileResult.data);
  if (!validationResult.success) {
    Logger.error('Stack configuration validation failed:');
    validationResult.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    process.exit(1);
  }

  const stack = validationResult.data;
  
  if (!stack.env || stack.env.length === 0) {
    Logger.info('No environment variables defined in this stack.');
    process.exit(0);
  }

  Logger.info('ENVIRONMENT VARIABLES REQUIRED BY THIS STACK:');
  
  stack.env.forEach(envVar => {
    const status = envVar.required ? 'required' : 'optional';
    const color = envVar.required ? chalk.red : chalk.green;
    const icon = envVar.required ? '🔴' : '🟢';
    
    console.log(`- ${envVar.name} (${color(status)}) ${icon}`);
  });

  const requiredCount = stack.env.filter(env => env.required).length;
  const optionalCount = stack.env.filter(env => !env.required).length;
  
  console.log('\n' + chalk.blue('📊 Summary:'));
  console.log(`  Required: ${chalk.red(requiredCount)}`);
  console.log(`  Optional: ${chalk.green(optionalCount)}`);
  console.log(`  Total: ${stack.env.length}`);

  process.exit(0);
} 