import chalk from 'chalk';

export class Logger {
  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('DEBUG:'), message);
    }
  }

  static step(message: string): void {
    console.log(chalk.cyan('→'), message);
  }

  static header(message: string): void {
    console.log('\n' + chalk.bold.blue(message));
    console.log(chalk.blue('─'.repeat(message.length)));
  }
} 