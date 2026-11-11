import { FilmArchive } from '@/components/FilmArchive';
import { contentRepository } from '@/lib/content';
import { getPremiereState } from '@/lib/premiere-server';
import { PremiereGate } from '@/components/PremiereGate';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const content = await contentRepository.getArchive();
  const premiere = getPremiereState(content.premiere);
  if (premiere.status !== 'open')
    return (
      <PremiereGate
        key={`${premiere.opensAt}:${premiere.status}`}
        title={content.title}
        subtitle={content.subtitle}
        initial={premiere}
        copy={content.premiere?.copy}
      />
    );
  return <FilmArchive content={content} />;
}
