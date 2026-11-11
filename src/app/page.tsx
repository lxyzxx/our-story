import { FilmArchive } from '@/components/FilmArchive';
import { contentRepository } from '@/lib/content';
export const dynamic = 'force-dynamic';
export default async function Home() {
  return <FilmArchive content={await contentRepository.getArchive()} />;
}
