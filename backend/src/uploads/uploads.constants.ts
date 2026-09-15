import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Single source of truth for where uploaded media lives on disk,
// shared between the upload controller (writes) and main.ts (serves
// the folder statically at /uploads).
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export function ensureUploadsDirExists() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
