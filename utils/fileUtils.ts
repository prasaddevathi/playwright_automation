import fs from 'fs';
import path from 'path';

export function downloadsDir(): string {
  const dir = path.resolve(__dirname, '..', 'downloads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function assertFileNameMatches(fileName: string, expectedPattern: RegExp): void {
  if (!expectedPattern.test(fileName)) {
    throw new Error(`Downloaded file name "${fileName}" did not match pattern ${expectedPattern}`);
  }
}
