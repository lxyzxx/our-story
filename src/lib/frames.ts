import type { Chapter, Memory, ArchivePhoto } from './types';
export interface FilmFrame {
  key: string;
  photo: ArchivePhoto;
  memory: Memory;
}
export function chapterFrames(chapter: Chapter): FilmFrame[] {
  return chapter.memories.flatMap((memory) =>
    memory.photos.map((photo, index) => ({
      key: `${memory.id}:${photo.id}:${index}`,
      photo,
      memory,
    })),
  );
}
