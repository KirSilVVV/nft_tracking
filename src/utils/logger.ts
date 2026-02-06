export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const level = process.env.LOG_LEVEL || 'info';
    this.logLevel = LogLevel[level.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
  }

  debug(message: string, data?: any) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    if (this.logLevel <= LogLevel.INFO) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  error(message: string, error?: any) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
  }
}

export const logger = new Logger();
