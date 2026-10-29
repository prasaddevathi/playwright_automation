import fs from 'fs';
import { LOG_DIR } from '../utils/logger';

/**
 * Runs once before any worker starts. Starting each run with an empty log
 * directory keeps reports/logs/execution.log scoped to a single run.
 */
export default function globalSetup(): void {
  fs.rmSync(LOG_DIR, { recursive: true, force: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
