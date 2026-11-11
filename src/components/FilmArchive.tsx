'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { gsap } from 'gsap';
import type { ArchiveContent, Chapter } from '@/lib/types';
import { useArchiveProgress } from '@/hooks/useArchiveProgress';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { OpeningScene } from './OpeningScene';
import { FilmWorkbench } from './FilmWorkbench';
import { FilmUnroll } from './FilmUnroll';
import { MusicPlayer } from './MusicPlayer';
import { MemoryPlayer } from './MemoryPlayer';
import { ChapterTransition } from './ChapterTransition';

type Selection = { chapter: Chapter; origin: DOMRect };
const subscribe = () => () => {};
export function FilmArchive({ content }: { content: ArchiveContent }) {
  const [entered, setEntered] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [screen, setScreen] = useState<'unroll' | 'player' | 'transition'>('unroll');
  const [replaying, setReplaying] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const progress = useArchiveProgress();
  const playable = content.chapters.filter((c) => c.memories.some((m) => m.photos.length > 0));
  const allWatched =
    playable.length > 0 && playable.every((c) => progress.completed.includes(c.id));
  const unlocked = content.chapters.findIndex(
    (c) => c.memories.some((m) => m.photos.length > 0) && !progress.completed.includes(c.id),
  );
  const selectedIndex = content.chapters.findIndex((c) => c.id === selection?.chapter.id);
  const canPlay = allWatched || selectedIndex <= unlocked;
  const nextPlayable = content.chapters
    .slice(selectedIndex + 1)
    .find((c) => c.memories.some((m) => m.photos.length > 0));
  const source = !entered
    ? content.music.opening || content.music.archive
    : selection?.chapter.music || content.music.archive;
  const music = useMusicPlayer(source);
  const activateMusic = music.activate;
  const completeChapter = progress.completeChapter;
  const root = useRef<HTMLElement>(null);
  const entrance = useRef<gsap.core.Tween | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(
    () => () => {
      entrance.current?.kill();
    },
    [],
  );
  const begin = useCallback(
    (replay = false) => {
      if (entrance.current?.isActive()) return;
      activateMusic();
      setReplaying(replay);
      const arrive = () => {
        setEntered(true);
        entrance.current = null;
        const first = content.chapters.find((c) => c.memories.some((m) => m.photos.length > 0));
        if (replay && first) {
          setSelection({
            chapter: first,
            origin: new DOMRect(innerWidth / 2 - 120, innerHeight / 2 - 70, 240, 140),
          });
          setScreen('unroll');
        }
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        arrive();
        return;
      }
      entrance.current = gsap.to(root.current!.querySelector('.opening'), {
        opacity: 0,
        scale: 1.015,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: arrive,
      });
    },
    [activateMusic, content.chapters],
  );
  const open = useCallback((chapter: Chapter, origin: DOMRect) => {
    opener.current =
      root.current?.querySelector<HTMLElement>(
        `[data-chapter="${CSS.escape(chapter.id)}"] .roll-button`,
      ) ?? null;
    setSelection((current) => current ?? { chapter, origin });
    setScreen('unroll');
  }, []);
  const close = useCallback(() => {
    setSelection(null);
    setMusicOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  }, []);
  const finishChapter = useCallback(() => {
    if (!selection) return;
    completeChapter(selection.chapter.id);
    setScreen('transition');
  }, [selection, completeChapter]);
  const nextChapter = useCallback(() => {
    const next = nextPlayable;
    if (!next) {
      close();
      return;
    }
    const button = root.current?.querySelector<HTMLElement>(
      `[data-chapter="${CSS.escape(next.id)}"] .roll-button`,
    );
    const rect =
      button?.getBoundingClientRect() ??
      new DOMRect(innerWidth / 2 - 120, innerHeight / 2 - 70, 240, 140);
    opener.current = button ?? null;
    setSelection({ chapter: next, origin: rect });
    setScreen('unroll');
  }, [nextPlayable, close]);
  const musicControls = <MusicPlayer controller={music} onPanelChange={setMusicOpen} />;
  return (
    <main ref={root} className={`archive-app ${entered ? 'has-entered' : ''}`}>
      <div className="grain" aria-hidden="true" />
      {!entered ? (
        <>
          <OpeningScene
            content={content}
            ready={hydrated}
            completed={allWatched}
            onBegin={() => begin(false)}
            onReplay={() => begin(true)}
          />
          <div className="opening-music">{musicControls}</div>
        </>
      ) : (
        <>
          <div className="archive-shell" inert={!!selection}>
            <header className="archive-header">
              <button
                className="wordmark"
                onClick={() => setEntered(false)}
                aria-label="OUR STORY，重看片头"
              >
                OUR <em>STORY</em>
                <span>{content.workbench.title}</span>
              </button>
              <div className="header-center">
                A PRIVATE COLLECTION
                <br />
                <span>OF OUR DAYS TOGETHER</span>
              </div>
              {!selection && musicControls}
            </header>
            <FilmWorkbench content={content} onOpen={open} completed={progress.completed} />
          </div>
          {selection && screen === 'unroll' && (
            <>
              <FilmUnroll
                key={selection.chapter.id}
                chapter={selection.chapter}
                origin={selection.origin}
                onClose={close}
                backLabel={content.workbench.back}
                onPlay={() => setScreen('player')}
                canPlay={canPlay}
                beginLabel={content.player.begin}
                demo={content.demo}
                music={musicControls}
              />
            </>
          )}
          {selection && screen === 'player' && (
            <MemoryPlayer
              key={selection.chapter.id}
              chapter={selection.chapter}
              content={content}
              startKey={
                !replaying && progress.resume?.chapterId === selection.chapter.id
                  ? progress.resume.frameKey
                  : undefined
              }
              music={musicControls}
              interacting={musicOpen}
              onClose={close}
              onComplete={finishChapter}
              onFrame={progress.saveResume}
            />
          )}
          {selection && screen === 'transition' && (
            <ChapterTransition
              chapter={selection.chapter}
              next={nextPlayable}
              content={content}
              music={musicControls}
              onNext={nextChapter}
              onClose={close}
            />
          )}
        </>
      )}
    </main>
  );
}
