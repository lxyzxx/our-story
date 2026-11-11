'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { chapterFrames } from '@/lib/frames';
import type { ArchiveContent, Chapter } from '@/lib/types';
import { useScreeningDialog } from '@/hooks/useScreeningDialog';
import { MemoryStory } from './MemoryStory';
import { Icon } from './Icons';

type Props = {
  chapter: Chapter;
  content: ArchiveContent;
  startKey?: string;
  music: ReactNode;
  interacting: boolean;
  onClose: () => void;
  onComplete: () => void;
  onFrame: (chapterId: string, key: string) => void;
};
export function MemoryPlayer({
  chapter,
  content,
  startKey,
  music,
  interacting,
  onClose,
  onComplete,
  onFrame,
}: Props) {
  const frames = useMemo(() => chapterFrames(chapter), [chapter]);
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      frames.findIndex((f) => f.key === startKey),
    ),
  );
  const [paused, setPaused] = useState(false);
  const [reading, setReading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [controls, setControls] = useState(true);
  const [loaded, setLoaded] = useState('');
  const [broken, setBroken] = useState('');
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const storyTrigger = useRef<HTMLButtonElement>(null);
  const ended = useRef(false);
  const frame = frames[index];
  const duration = Math.max(4, Math.min(60, content.player.frameSeconds || 8)) * 1000;
  const closeStory = useCallback(() => {
    setReading(false);
    requestAnimationFrame(() => storyTrigger.current?.focus());
  }, []);
  const escape = useCallback(() => {
    if (reading) closeStory();
    else onClose();
  }, [reading, closeStory, onClose]);
  useScreeningDialog(root, escape);
  const next = useCallback(() => {
    if (ended.current) return;
    if (index >= frames.length - 1) {
      ended.current = true;
      onComplete();
    } else setIndex(index + 1);
  }, [index, frames.length, onComplete]);
  const previous = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);
  useEffect(() => {
    elapsed.current = 0;
    if (frame) onFrame(chapter.id, frame.key);
    if (progress.current) {
      progress.current.style.transform = 'scaleX(0)';
      progress.current.parentElement?.setAttribute('aria-valuenow', '0');
    }
  }, [frame, chapter.id, onFrame]);
  const running = !paused && !reading && !hidden && !interacting && loaded === frame?.key;
  useEffect(() => {
    if (!running || !frame) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      elapsed.current += Math.min(now - last, 250);
      last = now;
      const fraction = Math.min(1, elapsed.current / duration);
      if (progress.current) {
        progress.current.style.transform = `scaleX(${fraction})`;
        progress.current.parentElement?.setAttribute(
          'aria-valuenow',
          String(Math.round(fraction * 100)),
        );
      }
      if (elapsed.current >= duration) {
        clearInterval(timer);
        next();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [running, frame, duration, next]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        reading ||
        interacting ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === ' ' && e.target instanceof HTMLElement && e.target.closest('button,a')) return;
      if (['ArrowRight', 'ArrowLeft', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') previous();
      if (e.key === ' ') {
        setPaused((v) => !v);
        setControls(true);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [reading, interacting, next, previous]);
  const showStory = () => {
    setPaused(true);
    setControls(true);
    setReading(true);
  };
  if (!frame)
    return (
      <section
        className="screening empty-screening"
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={chapter.title}
      >
        <h1>{chapter.title}</h1>
        <p>这一卷，还在等待被收藏。</p>
        <button data-autofocus className="text-button" onClick={onClose}>
          {content.workbench.back}
          <Icon name="back" />
        </button>
      </section>
    );
  return (
    <section
      ref={root}
      className="screening"
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.title} · 记忆放映`}
      data-frame={index}
      data-playing={running}
    >
      <div className="screening-base" inert={reading}>
        <header className="screening-header">
          <button data-autofocus className="text-button" onClick={onClose}>
            <Icon name="back" />
            {content.workbench.back}
          </button>
          <div>
            <span>ROLL {chapter.number}</span>
            <h1>{chapter.title}</h1>
          </div>
          <div className="screening-sound">{!reading && music}</div>
        </header>
        <div
          className={`screening-theatre ${frame.photo.height > frame.photo.width ? 'is-portrait' : 'is-landscape'}`}
        >
          <button
            className="screening-photo"
            aria-label={controls ? '隐藏播放控件' : '显示播放控件'}
            onClick={() => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              setControls((v) => !v);
            }}
            onTouchStart={(e) => {
              start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              swiped.current = false;
            }}
            onTouchEnd={(e) => {
              if (!start.current) return;
              const dx = e.changedTouches[0].clientX - start.current.x;
              const dy = e.changedTouches[0].clientY - start.current.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                swiped.current = true;
                if (dx < 0) next();
                else previous();
              }
              start.current = null;
            }}
          >
            <div
              className="screening-image"
              key={frame.key}
              style={
                {
                  '--frame-duration': `${duration / 1000}s`,
                  animationPlayState: running ? 'running' : 'paused',
                } as React.CSSProperties
              }
            >
              <Image
                src={frame.photo.src}
                alt={frame.photo.alt}
                fill
                sizes="(max-width: 700px) 100vw, 88vw"
                priority
                onLoad={() => setLoaded(frame.key)}
                onError={() => {
                  setBroken(frame.key);
                  setLoaded(frame.key);
                  setPaused(true);
                }}
              />
            </div>
            {broken === frame.key && (
              <span className="photo-failure">这张照片暂时无法加载，可前往下一张。</span>
            )}
          </button>
          <span className="frame-edge" aria-hidden="true">
            OUR STORY · {chapter.number} / {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className={`screening-lower ${controls ? '' : 'controls-hidden'}`}>
          <div className="screening-caption" key={frame.memory.id}>
            <div>
              <h2>{frame.memory.title}</h2>
              {(frame.memory.date || frame.memory.place) && (
                <p className="screening-meta">
                  {[frame.memory.date, frame.memory.place].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="screening-words">
              {frame.memory.story && frame.memory.story.length <= 80 ? (
                <p>{frame.memory.story}</p>
              ) : (
                <p>
                  {frame.memory.quote || (content.demo ? '演示素材 · 等待收藏我们的真实故事' : '')}
                </p>
              )}
              <button ref={storyTrigger} className="text-button read-story" onClick={showStory}>
                <Icon name="book" size={16} />
                {content.player.read}
              </button>
            </div>
          </div>
          <div className="screening-controls">
            <button
              className="circle-button"
              disabled={index === 0}
              onClick={previous}
              aria-label="上一张照片"
            >
              <Icon name="back" />
            </button>
            <button
              className="play-button"
              onClick={() => setPaused((v) => !v)}
              aria-label={paused ? content.player.resume : content.player.pause}
            >
              <Icon name={paused ? 'play' : 'pause'} />
              <span>{paused ? content.player.resume : content.player.pause}</span>
            </button>
            <button
              className="circle-button"
              onClick={next}
              aria-label={index === frames.length - 1 ? '结束本章' : '下一张照片'}
            >
              <Icon name="arrow" />
            </button>
            <span className="screening-count">
              {String(index + 1).padStart(2, '0')}
              <i /> {String(frames.length).padStart(2, '0')}
            </span>
            <label className="frame-picker">
              跳至照片
              <select
                aria-label="跳至照片"
                value={index}
                onChange={(e) => {
                  setPaused(true);
                  setIndex(Number(e.target.value));
                }}
              >
                {frames.map((f, i) => (
                  <option key={f.key} value={i}>
                    {String(i + 1).padStart(2, '0')} · {f.memory.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <button
          className="controls-toggle icon-button"
          aria-label={controls ? '隐藏播放控件' : '显示播放控件'}
          onClick={() => setControls((v) => !v)}
        >
          <Icon name="expand" size={17} />
        </button>
        <div
          className="screening-progress"
          role="progressbar"
          aria-label="当前照片放映进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <div ref={progress} />
        </div>
      </div>
      {reading && (
        <MemoryStory frame={frame} content={content} music={music} onClose={closeStory} />
      )}
    </section>
  );
}
