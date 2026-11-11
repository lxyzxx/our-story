'use client';
import { useRef, type ReactNode } from 'react';
import type { ArchiveContent, Chapter } from '@/lib/types';
import { useScreeningDialog } from '@/hooks/useScreeningDialog';
import { Icon } from './Icons';
export function ChapterTransition({
  chapter,
  next,
  content,
  onNext,
  music,
  onClose,
}: {
  chapter: Chapter;
  next?: Chapter;
  content: ArchiveContent;
  onNext: () => void;
  music: ReactNode;
  onClose: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useScreeningDialog(root, onClose);
  return (
    <section
      ref={root}
      className="chapter-transition"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transition-title"
    >
      <div className="transition-music">{music}</div>
      <div className="transition-rule" aria-hidden="true" />
      <span className="transition-roll">
        ROLL {chapter.number} · {chapter.title}
      </span>
      <h1 id="transition-title">{next ? content.player.chapterEnd : content.player.allWatched}</h1>
      <p>{next ? '一卷回忆，在这里轻轻停一下。' : '这一场放映结束了，故事还在继续。'}</p>
      {next ? (
        <button data-autofocus className="begin-button" onClick={onNext}>
          <span>
            {content.player.nextChapter}
            <small>
              {next.number} — {next.title}
            </small>
          </span>
          <Icon name="arrow" />
        </button>
      ) : (
        <button data-autofocus className="begin-button" onClick={onClose}>
          {content.player.returnArchive}
          <Icon name="arrow" />
        </button>
      )}
      {next && (
        <button className="text-button transition-back" onClick={onClose}>
          {content.workbench.back}
        </button>
      )}
      <span className="transition-foot">TAKE YOUR TIME. WE HAVE A LIFETIME.</span>
    </section>
  );
}
