import archive from '@/content/archive.json';
import { readFile } from 'node:fs/promises';
import type { ArchiveContent, ContentRepository } from './types';
// Server-side adapter: an optional local content file also supports isolated acceptance fixtures.
// The path is deployment configuration, never accepted from a public request.
export const contentRepository: ContentRepository = {
  async getArchive() {
    if (process.env.ARCHIVE_CONTENT_FILE)
      return JSON.parse(await readFile(process.env.ARCHIVE_CONTENT_FILE, 'utf8')) as ArchiveContent;
    return archive as ArchiveContent;
  },
};
