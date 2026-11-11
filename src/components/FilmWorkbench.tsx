'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import type { ArchiveContent, Chapter } from '@/lib/types';
import { FilmRoll } from './FilmRoll';
import { Icon } from './Icons';
import { archiveUrl } from '@/lib/urls';

export function FilmWorkbench({
  content,
  onOpen,
  completed,
}: {
  content: ArchiveContent;
  onOpen: (chapter: Chapter, rect: DOMRect) => void;
  completed: string[];
}) {
  const root = useRef<HTMLElement>(null);
  const desk = useRef<HTMLDivElement>(null);
  const playable = content.chapters.filter((c) => c.memories.some((m) => m.photos.length > 0));
  const firstPending = playable.find((c) => !completed.includes(c.id))?.id;
  const [selected, setSelected] = useState<string | null>(null);
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.from('.workbench-heading', { y: 15, opacity: 0, duration: 1, ease: 'power2.out' });
        gsap.from('.roll-object', {
          y: 65,
          opacity: 0,
          rotation: '+=8',
          stagger: 0.09,
          duration: 1.2,
          ease: 'power3.out',
          clearProps: 'all',
        });
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, []);
  function choose(chapter: Chapter, event: React.MouseEvent<HTMLButtonElement>) {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse && selected !== chapter.id) {
      setSelected(chapter.id);
      return;
    }
    const object = event.currentTarget.querySelector('.film-roll')!;
    onOpen(chapter, object.getBoundingClientRect());
  }
  return (
    <section ref={root} className="workbench" aria-labelledby="archive-heading">
      <div className="workbench-heading">
        <h1 id="archive-heading">
          {content.heading}
          <br />
          <em>{content.headingEmphasis}</em>
        </h1>
        <p>{content.dedication}</p>
      </div>
      <div
        ref={desk}
        className="desk"
        onPointerMove={(event) => {
          if (
            event.pointerType !== 'mouse' ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          )
            return;
          const box = event.currentTarget.getBoundingClientRect();
          desk.current?.style.setProperty(
            '--px',
            `${((event.clientX - box.left) / box.width - 0.5) * 10}px`,
          );
          desk.current?.style.setProperty(
            '--py',
            `${((event.clientY - box.top) / box.height - 0.5) * 7}px`,
          );
        }}
        onPointerLeave={() => {
          desk.current?.style.setProperty('--px', '0px');
          desk.current?.style.setProperty('--py', '0px');
        }}
      >
        <div className="desk-mark desk-mark--left" aria-hidden="true">
          ARCHIVE NO. 001
          <br />
          HANDLE WITH LOVE
        </div>
        <div className="desk-objects">
          <div className="loose-print loose-print--back" aria-hidden="true">
            <Image src={archiveUrl('/images/mountains.jpg')} alt="" width={210} height={140} />
          </div>
          <div className="loose-print loose-print--front" aria-hidden="true">
            <Image src={archiveUrl('/images/coast.jpg')} alt="" width={210} height={140} />
            <span>the days we keep.</span>
          </div>
          {content.chapters.map((chapter, index) => (
            <div
              className={`roll-object roll-position-${index % 4} ${selected === chapter.id ? 'is-selected' : ''}`}
              key={chapter.id}
              data-chapter={chapter.id}
              style={{ '--extra-row': Math.floor(index / 4) } as React.CSSProperties}
            >
              <button
                className="roll-button"
                onClick={(e) => choose(chapter, e)}
                aria-label={`展开胶卷 ${chapter.number}：${chapter.title}`}
                aria-describedby={`roll-caption-${chapter.id}`}
              >
                <FilmRoll chapter={chapter} />
                <span className="roll-action">
                  <span>
                    {selected === chapter.id ? content.workbench.touchOpen : 'OPEN THIS ROLL'}
                  </span>
                  <Icon name="arrow" size={15} />
                </span>
              </button>
              <div className="roll-caption" id={`roll-caption-${chapter.id}`}>
                <span className="roll-index">{chapter.number}</span>
                <div>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.subtitle}</p>
                  <span className="chapter-status">
                    {!chapter.memories.some((m) => m.photos.length > 0)
                      ? '待添加照片'
                      : completed.includes(chapter.id)
                        ? '已收藏'
                        : chapter.id === firstPending
                          ? '从这里继续'
                          : '等待下一幕'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className="desk-note" aria-hidden="true">
            <span className="note-pin" />
            <p>{content.workbench.note}</p>
            <em>{content.workbench.signature}</em>
          </div>
          <div className="loupe" aria-hidden="true">
            <div className="loupe-glass" />
            <div className="loupe-foot" />
          </div>
          <div className="pencil" aria-hidden="true" />
          <div className="desk-film" aria-hidden="true">
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>
      <footer className="workbench-footer">
        <p>
          <span className="status-dot" />
          {playable.length > 0 && playable.every((c) => completed.includes(c.id))
            ? '所有胶卷已解锁，随时重访。'
            : content.workbench.select}
        </p>
        <span>
          {String(content.chapters.length).padStart(2, '0')} ROLLS{' '}
          <span className="footer-divider">/</span> A LIFETIME OF US
        </span>
        {content.demo && <span className="demo-mark">演示照片 · 待收藏我们的故事</span>}
      </footer>
    </section>
  );
}
