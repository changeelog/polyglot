import chalk from 'chalk'
import { Logger } from '../interfaces'
import { LogLevel } from '../types'

class ConsoleLogger implements Logger {
  private logLevel: LogLevel = 'info'

  constructor(logLevel?: LogLevel) {
    if (logLevel) {
      this.logLevel = logLevel
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  log(level: LogLevel, message: string): void {
    if (this.shouldLog(level)) {
      console.log(this.formatMessage(level, message))
    }
  }

  debug(message: string): void {
    this.log('debug', message)
  }

  info(message: string): void {
    this.log('info', message)
  }

  warn(message: string): void {
    this.log('warn', message)
  }

  error(message: string): void {
    this.log('error', message)
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    const coloredLevel = this.colorLevel(level)
    return `${timestamp} ${coloredLevel}: ${message}`
  }

  private colorLevel(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return chalk.blue('DEBUG')
      case 'info':
        return chalk.green('INFO')
      case 'warn':
        return chalk.yellow('WARN')
      case 'error':
        return chalk.red('ERROR')
      default:
        return String(level).toUpperCase()
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }
}

export const logger = new ConsoleLogger()
