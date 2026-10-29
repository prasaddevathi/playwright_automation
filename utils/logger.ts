import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  meta?: unknown;
}

function parseLevel(raw: string | undefined, fallback: LogLevel): LogLevel {
  const value = raw?.toLowerCase();
  return value && value in LEVEL_WEIGHT ? (value as LogLevel) : fallback;
}

/**
 * LOG_LEVEL controls what reaches the log files / report attachments.
 * LOG_CONSOLE_LEVEL controls what is echoed to the terminal. They are
 * separate on purpose: with parallel workers, step-level console output
 * interleaves and buries the reporter, while the files keep full detail.
 */
const FILE_LEVEL = parseLevel(process.env.LOG_LEVEL, 'debug');
const CONSOLE_LEVEL = parseLevel(process.env.LOG_CONSOLE_LEVEL, 'warn');

export const LOG_DIR = path.resolve(__dirname, '..', 'reports', 'logs');
const EXECUTION_LOG = path.join(LOG_DIR, 'execution.log');

function formatMeta(meta: unknown): string {
  if (meta === undefined) return '';
  if (meta instanceof Error) return ` | ${meta.stack ?? meta.message}`;
  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch {
    return ` | ${String(meta)}`;
  }
}

export function formatEntry(entry: LogEntry): string {
  const workerIndex = process.env.TEST_WORKER_INDEX ?? '-';
  return (
    `${entry.timestamp} [${entry.level.toUpperCase().padEnd(5)}] [w${workerIndex}] ` +
    `[${entry.scope}] ${entry.message}${formatMeta(entry.meta)}`
  );
}

/**
 * Small structured logger, deliberately dependency-free.
 *
 * Every entry goes to three places:
 *  - an in-memory buffer shared by a logger and all of its children, which
 *    the test fixture attaches to that test's HTML report entry
 *  - reports/logs/execution.log, one chronological file for the whole run
 *    (all workers append; each line carries its worker index)
 *  - the console, filtered by LOG_CONSOLE_LEVEL
 *
 * `child(scope)` lets page objects log under their own name
 * ("test > InventoryPage") while still writing into the owning test's buffer.
 */
export class Logger {
  private constructor(
    private readonly scope: string,
    private readonly buffer: LogEntry[],
  ) {}

  static create(scope: string): Logger {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    return new Logger(scope, []);
  }

  child(scope: string): Logger {
    return new Logger(`${this.scope} > ${scope}`, this.buffer);
  }

  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.write('error', message, meta);
  }

  /** Full text of everything logged through this logger tree. */
  dump(): string {
    return this.buffer.map(formatEntry).join('\n');
  }

  private write(level: LogLevel, message: string, meta?: unknown): void {
    const entry: LogEntry = { timestamp: new Date().toISOString(), level, scope: this.scope, message, meta };
    const line = formatEntry(entry);

    if (LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[FILE_LEVEL]) {
      this.buffer.push(entry);
      try {
        fs.appendFileSync(EXECUTION_LOG, line + '\n');
      } catch {
        // Logging must never be the reason a test fails.
      }
    }

    if (LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[CONSOLE_LEVEL]) {
      // stderr for warn/error so CI log viewers highlight them.
      (level === 'warn' || level === 'error' ? process.stderr : process.stdout).write(line + '\n');
    }
  }
}
