import archive from '@/content/archive.json';
import { readFile } from 'node:fs/promises';
import type { ArchiveContent, ContentRepository } from './types';
import { archiveUrl } from './urls';
// Server-side adapter: an optional local content file also supports isolated acceptance fixtures.
// The path is deployment configuration, never accepted from a public request.
export const contentRepository: ContentRepository = {
  async getArchive() {
    const content: ArchiveContent = process.env.ARCHIVE_CONTENT_FILE
      ? JSON.parse(await readFile(process.env.ARCHIVE_CONTENT_FILE, 'utf8'))
      : (archive as ArchiveContent);
    return {
      ...content,
      music: Object.fromEntries(
        Object.entries(content.music).map(([key, value]) => [
          key,
          value ? archiveUrl(value) : value,
        ]),
      ),
      chapters: content.chapters.map((chapter) => ({
        ...chapter,
        music: chapter.music ? archiveUrl(chapter.music) : chapter.music,
        memories: chapter.memories.map((memory) => ({
          ...memory,
          photos: memory.photos.map((photo) => ({ ...photo, src: archiveUrl(photo.src) })),
        })),
      })),
    };
  },
};
