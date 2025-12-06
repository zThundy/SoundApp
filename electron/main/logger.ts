import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.ELECTRON_ENV === 'development'

class Logger {
  private logFilePath: string
  private errorLogFilePath: string
  private logStream: fs.WriteStream | null = null
  private errorStream: fs.WriteStream | null = null
  private originalConsole: {
    log: typeof console.log
    error: typeof console.error
    warn: typeof console.warn
    info: typeof console.info
    debug: typeof console.debug
  }

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    }

    // Get the user data path for logs
    const logsDir = path.join(app.getPath('userData'), 'logs')
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Create log file paths with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    this.logFilePath = path.join(logsDir, `app-${timestamp}.log`)
    this.errorLogFilePath = path.join(logsDir, `error-${timestamp}.log`)

    // Create write streams
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' })
    this.errorStream = fs.createWriteStream(this.errorLogFilePath, { flags: 'a' })

    // Clean old log files (keep only last 10 logs)
    this.cleanOldLogs(logsDir)
  }

  private cleanOldLogs(logsDir: string) {
    try {
      const files = fs.readdirSync(logsDir)
      const logFiles = files
        .filter(f => f.startsWith('app-') || f.startsWith('error-'))
        .map(f => ({
          name: f,
          path: path.join(logsDir, f),
          time: fs.statSync(path.join(logsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)

      // Keep only the 10 most recent files
      if (logFiles.length > 10) {
        logFiles.slice(10).forEach(file => {
          try {
            fs.unlinkSync(file.path)
          } catch (err) {
            // Ignore errors when deleting old logs
          }
        })
      }
    } catch (err) {
      // Ignore errors in cleanup
    }
  }

  private formatMessage(level: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return util.inspect(arg, { depth: 3, colors: false })
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    return `[${timestamp}] [${level}] ${message}\n`
  }

  private writeToFile(stream: fs.WriteStream | null, message: string) {
    if (stream && !stream.destroyed) {
      try {
        stream.write(message)
      } catch (err) {
        // If we can't write to log, at least output to original console
        this.originalConsole.error('Failed to write to log file:', err)
      }
    }
  }

  public log(...args: any[]) {
    this.originalConsole.log(...args)
    const message = this.formatMessage('LOG', ...args)
    this.writeToFile(this.logStream, message)
  }

  public error(...args: any[]) {
    this.originalConsole.error(...args)
    const message = this.formatMessage('ERROR', ...args)
    this.writeToFile(this.logStream, message)
    this.writeToFile(this.errorStream, message)
  }

  public warn(...args: any[]) {
    this.originalConsole.warn(...args)
    const message = this.formatMessage('WARN', ...args)
    this.writeToFile(this.logStream, message)
  }

  public info(...args: any[]) {
    this.originalConsole.info(...args)
    const message = this.formatMessage('INFO', ...args)
    this.writeToFile(this.logStream, message)
  }

  public debug(...args: any[]) {
    if (!isDevelopment) return;
    this.originalConsole.debug(...args)
    const message = this.formatMessage('DEBUG', ...args)
    this.writeToFile(this.logStream, message)
  }

  public initialize() {
    // Override console methods
    console.log = this.log.bind(this)
    console.error = this.error.bind(this)
    console.warn = this.warn.bind(this)
    console.info = this.info.bind(this)
    console.debug = this.debug.bind(this)

    // Log initialization
    this.log('Logger initialized')
    this.log('Log file:', this.logFilePath)
    this.log('Error log file:', this.errorLogFilePath)
    this.log('App version:', app.getVersion())
    this.log('Electron version:', process.versions.electron)
    this.log('Chrome version:', process.versions.chrome)
    this.log('Node version:', process.versions.node)
    this.log('Platform:', process.platform, process.arch)
  }

  public close() {
    this.log('Closing logger...')
    
    if (this.logStream) {
      this.logStream.end()
      this.logStream = null
    }
    
    if (this.errorStream) {
      this.errorStream.end()
      this.errorStream = null
    }

    // Restore original console methods
    console.log = this.originalConsole.log
    console.error = this.originalConsole.error
    console.warn = this.originalConsole.warn
    console.info = this.originalConsole.info
    console.debug = this.originalConsole.debug
  }

  public getLogFilePath(): string {
    return this.logFilePath
  }

  public getErrorLogFilePath(): string {
    return this.errorLogFilePath
  }
}

// Create singleton instance
let loggerInstance: Logger | null = null

export function initializeLogger() {
  if (!loggerInstance) {
    loggerInstance = new Logger()
    loggerInstance.initialize()

    // Handle process errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      console.error(error.stack)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise)
      console.error('Reason:', reason)
    })
  }
  return loggerInstance
}

export function closeLogger() {
  if (loggerInstance) {
    loggerInstance.close()
    loggerInstance = null
  }
}

export function getLogger(): Logger | null {
  return loggerInstance
}

export default {
  initialize: initializeLogger,
  close: closeLogger,
  getLogger,
}
