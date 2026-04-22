// src/utils/logger.ts
const isDev = import.meta.env.DEV

export class Logger {
  constructor(private readonly name: string) {}

  debug(...values: unknown[]): void {
    if (isDev) {
      console.debug(`[${this.name}]`, ...values)
    }
  }

  info(...values: unknown[]): void {
    console.info(`[${this.name}]`, ...values)
  }

  warn(...values: unknown[]): void {
    console.warn(`[${this.name}]`, ...values)
  }

  error(...values: unknown[]): void {
    console.error(`[${this.name}]`, ...values)
  }
}

// 导出各模块 logger
export const singleTabLogger = new Logger('SingleTab')
export const conversationsLogger = new Logger('Conversations')
export const userChatLogger = new Logger('UserChat')
