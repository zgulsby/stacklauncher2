#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { validateCommand } from './validate';
import { testCommand } from './test';
import { submitCommand } from './submit';
import { initCommand } from './init';
import { launchCommand } from './launch';
import { terminateCommand } from './terminate';
import { envListCommand } from './env';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('runpod-stack')
  .description('CLI tool for defining, testing, and publishing GPU-based deployment stacks to RunPod')
  .version('1.0.0');

program
  .command('init')
  .description('Scaffold a new stack folder with a starter stack.yaml')
  .argument('<name>', 'Name of the stack to create')
  .option('-d, --directory <dir>', 'Directory to create the stack in', '.')
  .action(async (name: string, options: { directory: string }) => {
    try {
      await initCommand(name, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate the contents of the stack.yaml using Zod schema')
  .option('-f, --file <file>', 'Path to stack.yaml file', './stack.yaml')
  .action(async (options: { file: string }) => {
    try {
      await validateCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Launch a pod using RunPod API to test the stack deployment')
  .option('-f, --file <file>', 'Path to stack.yaml file', './stack.yaml')
  .option('--dry-run', 'Validate and show what would be deployed without actually launching')
  .action(async (options: { file: string; dryRun?: boolean }) => {
    try {
      await testCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('submit')
  .description('Package and submit validated stack to catalog backend')
  .option('-f, --file <file>', 'Path to stack.yaml file', './stack.yaml')
  .option('--endpoint <url>', 'Custom submission endpoint URL')
  .action(async (options: { file: string; endpoint?: string }) => {
    try {
      await submitCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('launch')
  .description('Launch a pod using Tetra-style resource configuration')
  .option('-i, --image <image>', 'Docker image to deploy', 'runpod/tensorflow')
  .option('-n, --name <name>', 'Pod name', 'tetra-pod')
  .option('-g, --gpu <gpu>', 'GPU type (RTX 4090, A100, etc.)', 'RTX 4090')
  .option('-c, --gpu-count <count>', 'Number of GPUs', '1')
  .option('-m, --memory <gb>', 'Memory in GB', '16')
  .option('-p, --preset <preset>', 'Resource preset (development, production, training, highPerformance)', 'development')
  .action(async (options: { image: string; name: string; gpu: string; gpuCount: string; memory: string; preset: string }) => {
    try {
      await launchCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('terminate')
  .description('Terminate a running pod')
  .argument('<podId>', 'Pod ID to terminate')
  .action(async (podId: string) => {
    try {
      await terminateCommand({ podId });
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('env:list')
  .description('List environment variables defined in the stack configuration')
  .option('-f, --file <file>', 'Path to stack.yaml file', './stack.yaml')
  .action(async (options: { file: string }) => {
    try {
      await envListCommand(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command:'), program.args.join(' '));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse CLI arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 