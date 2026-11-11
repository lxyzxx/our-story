'use client';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useScreeningDialog } from '@/hooks/useScreeningDialog';
import Image from 'next/image';
import { gsap } from 'gsap';
import type { Chapter } from '@/lib/types';
import { motion } from '@/lib/motion';
import { FilmRoll } from './FilmRoll';
import { Icon } from './Icons';

type Props = {
  chapter: Chapter;
  origin: DOMRect;
  onClose: () => void;
  backLabel: string;
  onPlay: () => void;
  canPlay: boolean;
  beginLabel: string;
  demo: boolean;
  music: ReactNode;
};
export function FilmUnroll({
  chapter,
  origin,
  onClose,
  backLabel,
  onPlay,
  canPlay,
  beginLabel,
  demo,
  music,
}: Props) {
  const root = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const photos = chapter.memories.flatMap((m) => m.photos);
  const photo = photos[active];
  const photoCount = photos.length;
  const visibleStart =
    photos.length <= 6 ? 0 : Math.max(0, Math.min(active - 2, photos.length - 6));
  const previewPhotos = photos.slice(visibleStart, visibleStart + 6);

  const swipe = useRef(0);
  const navigate = useCallback(
    (direction: number) =>
      setActive((current) => (photoCount ? (current + direction + photoCount) % photoCount : 0)),
    [photoCount],
  );
  useScreeningDialog(root, onClose);
  useLayoutEffect(() => {
    closeRef.current?.focus();
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setReady(true);
        return;
      }
      const reel = root.current!.querySelector<HTMLElement>('.unroll-reel')!;
      const box = reel.getBoundingClientRect();
      const tl = gsap.timeline({ onComplete: () => setReady(true) });
      timeline.current = tl;
      tl.from('.unroll-background', { opacity: 0, duration: 0.35 })
        .from(
          reel,
          {
            x: origin.left + origin.width / 2 - box.left - box.width / 2,
            y: origin.top + origin.height / 2 - box.top - box.height / 2,
            rotation: -70,
            scale: 0.7,
            duration: motion.lift,
            ease: 'power3.inOut',
          },
          0,
        )
        .from('.unroll-film', { scaleX: 0, duration: motion.unroll, ease: 'power3.inOut' }, 0.32)
        .fromTo(
          '.negative',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.12, duration: 0.5, clearProps: 'opacity,transform' },
          0.8,
        )
        .from(
          '.preview-viewer',
          { y: 35, opacity: 0, rotation: 3, duration: 0.7, ease: 'power3.out' },
          1.08,
        )
        .from(
          '.unroll-heading, .preview-controls, .unroll-caption',
          { opacity: 0, y: 8, stagger: 0.06, duration: 0.45 },
          1.3,
        );
    }, root);
    return () => {
      timeline.current = null;
      ctx.revert();
    };
  }, [origin]);
  useLayoutEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return (
    <section
      className="unroll-scene"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unroll-title"
      ref={root}
      data-ready={ready}
    >
      <div className="unroll-background" />
      <button data-autofocus ref={closeRef} className="text-button unroll-back" onClick={onClose}>
        <Icon name="back" />
        {backLabel}
      </button>
      <div className="unroll-music">{music}</div>
      <div className="unroll-heading">
        <span className="chapter-number" aria-label={`胶卷 ${chapter.number}`}>
          {chapter.number}
        </span>
        <h2 id="unroll-title">{chapter.title}</h2>
        <p>{chapter.introduction}</p>
      </div>
      <div className="unroll-stage">
        <div className="unroll-film">
          <div className="negative-track">
            {[...previewPhotos, ...previewPhotos].map((p, index) => (
              <button
                className={`negative ${visibleStart + (index % previewPhotos.length) === active ? 'negative--active' : ''}`}
                key={`${p.id}-${index}`}
                tabIndex={index >= previewPhotos.length ? -1 : 0}
                aria-hidden={index >= previewPhotos.length || undefined}
                aria-label={`预览第 ${visibleStart + (index % previewPhotos.length) + 1} 张照片`}
                onClick={() => setActive(visibleStart + (index % previewPhotos.length))}
              >
                <span>OUR STORY · {chapter.number}</span>
                <Image src={p.src} alt={p.alt} width={230} height={160} loading="eager" />
                <span>
                  {String(index + 1).padStart(2, '0')} A <b>35 MM</b>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="unroll-reel">
          <FilmRoll chapter={chapter} decorative />
        </div>
        <div
          className="preview-viewer"
          onTouchStart={(e) => {
            swipe.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const delta = e.changedTouches[0].clientX - swipe.current;
            if (Math.abs(delta) > 45) navigate(delta < 0 ? 1 : -1);
          }}
        >
          <div className="viewer-top">
            <span>MEMORY VIEWER</span>
            <span>35 mm</span>
          </div>
          <div className="viewer-aperture">
            {!photo && <span className="empty-film-message">这一卷还没有照片。</span>}
            {photo && (
              <Image
                key={photo.id}
                src={photo.src}
                alt={photo.alt}
                width={460}
                height={330}
                priority
              />
            )}
          </div>
          <div className="viewer-bottom">
            <span>OUR STORY</span>
            <span>
              {String(active + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
            </span>
          </div>
          <div className="viewer-lever" aria-hidden="true" />
        </div>
      </div>
      <div className="unroll-caption">
        <p>{chapter.subtitle}</p>
        {demo && <span>演示素材 · 你的照片将在这里被珍藏</span>}
      </div>
      <div className="unroll-play">
        <button
          className="begin-button"
          disabled={!ready || !canPlay || !photos.length}
          onClick={onPlay}
        >
          <span>{canPlay ? beginLabel : '先看完前面的章节'}</span>
          <Icon name="play" size={16} />
        </button>
        {!canPlay && <p>首次放映按胶卷顺序展开，预览照片不受限制。</p>}
      </div>
      <div className="preview-controls">
        <button
          className="circle-button"
          disabled={!photos.length}
          onClick={() => navigate(-1)}
          aria-label="上一张演示照片"
        >
          <Icon name="back" />
        </button>
        <span>
          FRAME {String(active + 1).padStart(2, '0')}
          <i />
          视觉预览
        </span>
        <button
          className="circle-button"
          disabled={!photos.length}
          onClick={() => navigate(1)}
          aria-label="下一张演示照片"
        >
          <Icon name="arrow" />
        </button>
      </div>
    </section>
  );
}
