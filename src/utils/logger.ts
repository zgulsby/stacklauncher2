import chalk from 'chalk';

export class Logger {
  static info(message: string): void {
    console.log(chalk.blue('ℹ️  INFO'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✅ SUCCESS'), message);
  }

  static warn(message: string): void {
    console.warn(chalk.yellow('⚠️  WARN'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('❌ ERROR'), message);
  }

  static header(message: string): void {
    console.log(chalk.cyan('🚀'), chalk.bold(message));
  }

  static step(message: string): void {
    console.log(chalk.blue('⚡ STEP'), message);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('🐛 DEBUG'), message);
    }
  }

  // Alias for backward compatibility
  static warning(message: string): void {
    this.warn(message);
  }
} 