'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { FilmFrame } from '@/lib/frames';
import type { ArchiveContent } from '@/lib/types';
import { Icon } from './Icons';
export function MemoryStory({
  frame,
  content,
  onClose,
  music,
}: {
  frame: FilmFrame;
  content: ArchiveContent;
  onClose: () => void;
  music: ReactNode;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => close.current?.focus(), []);
  return (
    <aside className="story-reading" aria-label="完整回忆故事">
      <div className="story-paper">
        <header>
          <span>{content.demo ? '演示排版 · 非私人回忆' : 'A NOTE TO REMEMBER'}</span>
          <div className="story-header-actions">
            {music}
            <button
              ref={close}
              className="icon-button"
              onClick={onClose}
              aria-label={content.player.closeStory}
            >
              <Icon name="close" />
            </button>
          </div>
        </header>
        <article>
          <h2>{frame.memory.title}</h2>
          {(frame.memory.date || frame.memory.place) && (
            <p className="story-meta">
              {[frame.memory.date, frame.memory.place].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="story-prose">
            {frame.memory.story ? (
              frame.memory.story.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)
            ) : (
              <p>{content.player.noStory}</p>
            )}
          </div>
          {frame.memory.quote && <blockquote>{frame.memory.quote}</blockquote>}
          <footer>慢慢读，放映已暂停。</footer>
        </article>
        <button className="story-return text-button" onClick={onClose}>
          <Icon name="back" size={16} />
          {content.player.closeStory}
        </button>
      </div>
    </aside>
  );
}
