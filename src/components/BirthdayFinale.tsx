'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import type { ArchiveContent, Chapter } from '@/lib/types';
import { chapterFrames } from '@/lib/frames';
import { finaleCopy, finaleMotion } from '@/lib/finale';
import { useScreeningDialog } from '@/hooks/useScreeningDialog';
import { FilmRoll } from './FilmRoll';
import { Icon } from './Icons';

type Stage = 'intro' | 'letter' | 'credits';
type Beat = 'rewind' | 'question' | 'answer' | 'continued';
type Props = {
  content: ArchiveContent;
  chapter: Chapter;
  entry: 'intro' | 'letter';
  music: ReactNode;
  interacting: boolean;
  onClose: () => void;
};

export function BirthdayFinale({ content, chapter, entry, music, interacting, onClose }: Props) {
  const copy = finaleCopy(content.finale);
  const [stage, setStage] = useState<Stage>(() =>
    entry === 'letter' ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? 'letter'
      : 'intro',
  );
  const [beat, setBeat] = useState<Beat>('rewind');
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const frames = useMemo(() => chapterFrames(chapter).slice(-3), [chapter]);
  const introPaused = paused || hidden || interacting;
  useScreeningDialog(root, onClose);

  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => {
      if (media.matches) setStage((current) => (current === 'intro' ? 'letter' : current));
    };
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', reduce);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', reduce);
    };
  }, []);

  useLayoutEffect(() => {
    if (stage !== 'intro') return;
    const context = gsap.context(() => {
      const sequence = gsap.timeline();
      timeline.current = sequence;
      sequence
        .fromTo(
          '.rewind-stage',
          { y: 18, scale: 1.025 },
          { y: 0, scale: 1, duration: 0.65, ease: 'power3.out' },
        )
        .to('.rewind-strip', { scaleX: 0, duration: 1.45, ease: 'power3.inOut' }, 0.2)
        .to(
          '.rewind-reel',
          { x: 10, rotation: '-=5', duration: 0.8, yoyo: true, repeat: 1, ease: 'power2.inOut' },
          0,
        )
        .to('.finale-lamp', { opacity: 0, duration: 1.05, ease: 'power2.inOut' }, 0.65)
        .to('.rewind-stage', { opacity: 0, scale: 0.93, y: 20, duration: 0.7 }, 1.1)
        .call(() => setBeat('question'), [], finaleMotion.questionAt)
        .fromTo(
          '.finale-question',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5 },
          finaleMotion.questionAt,
        )
        .to('.finale-question', { opacity: 0, y: -8, duration: 0.35 }, 2.25)
        .call(() => setBeat('answer'), [], finaleMotion.answerAt)
        .fromTo(
          '.finale-answer',
          { opacity: 0, scale: 0.97 },
          { opacity: 1, scale: 1, duration: 0.4 },
          finaleMotion.answerAt,
        )
        .to('.finale-answer', { opacity: 0, duration: 0.3 }, 3.35)
        .call(() => setBeat('continued'), [], finaleMotion.continuedAt)
        .fromTo(
          '.finale-continued',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' },
          finaleMotion.continuedAt,
        )
        .to('.finale-continued', { opacity: 0, duration: 0.45 }, 5.55)
        .call(() => setStage('letter'), [], finaleMotion.letterAt);
    }, root);
    return () => {
      timeline.current = null;
      context.revert();
    };
  }, [stage]);

  useEffect(() => {
    timeline.current?.paused(introPaused);
  }, [introPaused, stage]);

  useLayoutEffect(() => {
    if (stage === 'intro') return;
    if (!document.activeElement?.closest('.music-control')) {
      heading.current?.focus({ preventScroll: true });
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      if (stage === 'letter') {
        gsap.fromTo(
          '.birthday-greeting',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8 },
        );
        gsap.fromTo(
          '.birthday-paper',
          { opacity: 0, y: 25, rotation: 1 },
          { opacity: 1, y: 0, rotation: 0, duration: 1, ease: 'power3.out' },
        );
      } else {
        gsap.fromTo(
          '.credit-block',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.75, stagger: 0.2, ease: 'power3.out' },
        );
        gsap.fromTo(
          '.credits-actions',
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, delay: 0.8, duration: 0.6 },
        );
      }
    }, root);
    return () => context.revert();
  }, [stage]);

  const author = content.finale.credit.trim();
  const starring = content.finale.starring.trim() || content.starring;
  const letter = content.finale.letter.trim();
  return (
    <section
      ref={root}
      className={`birthday-finale finale-state-${stage}`}
      role="dialog"
      aria-modal="true"
      aria-label={copy.sceneTitle}
      data-stage={stage}
      data-beat={beat}
      data-intro-paused={introPaused}
    >
      <div className="birthday-backdrop" aria-hidden="true" />
      <header className="finale-header">
        <button data-autofocus className="text-button" onClick={onClose}>
          <Icon name="back" />
          <span>{content.workbench.back}</span>
        </button>
        <span className="finale-brand">{content.title}</span>
        <div className="finale-music">{music}</div>
      </header>

      {stage === 'intro' && (
        <div className="finale-intro">
          <h1 className="finale-semantic-title">{copy.sceneTitle}</h1>
          <div className="finale-lamp" aria-hidden="true" />
          <div className="rewind-anchor" aria-hidden="true">
            <div className="rewind-stage">
              <div className="rewind-strip">
                {frames.map((frame) => (
                  <div className="rewind-frame" key={frame.key}>
                    <span>
                      {content.title} · {chapter.number}
                    </span>
                    <Image src={frame.photo.src} alt="" width={280} height={180} />
                    <span>35 MM · COLOR NEGATIVE</span>
                  </div>
                ))}
              </div>
              <div className="rewind-reel">
                <FilmRoll chapter={chapter} decorative />
              </div>
            </div>
          </div>
          <p className="finale-title finale-question" aria-hidden={beat !== 'question'}>
            {copy.question}
          </p>
          <p className="finale-title finale-answer" aria-hidden={beat !== 'answer'}>
            {copy.answer}
          </p>
          <p className="finale-title finale-continued" aria-hidden={beat !== 'continued'}>
            {copy.continued}
          </p>
          <div className="finale-intro-controls">
            <button
              className="text-button"
              aria-label={paused ? copy.resumeIntro : copy.pauseIntro}
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              <Icon name={paused ? 'play' : 'pause'} size={16} />
              {paused ? copy.resumeIntro : copy.pauseIntro}
            </button>
            <button className="text-button" onClick={() => setStage('letter')}>
              {copy.skipIntro}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}

      {stage === 'letter' && (
        <div className="birthday-letter-layout">
          <div className="birthday-greeting">
            <h1 ref={heading} tabIndex={-1}>
              {copy.title}
            </h1>
            <p>{copy.dedication}</p>
            <div className="birthday-greeting-rule" aria-hidden="true" />
            <span>{copy.footer}</span>
          </div>
          <div className="birthday-paper">
            <header>
              <span>{copy.letterLabel}</span>
              {content.finale.date && <span>{content.finale.date}</span>}
            </header>
            <article className="birthday-letter-text" tabIndex={0} aria-label={copy.letterTitle}>
              <h2>{copy.letterTitle}</h2>
              {letter ? (
                <div className="birthday-letter-prose">
                  {letter.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="birthday-letter-empty">
                  <Icon name="book" size={25} />
                  <p>{copy.emptyLetter}</p>
                </div>
              )}
              {(content.finale.signature || author) && (
                <p className="birthday-signature">{content.finale.signature || author}</p>
              )}
            </article>
            <footer>
              <button className="text-button" onClick={() => setStage('credits')}>
                {copy.viewCredits}
                <Icon name="arrow" size={17} />
              </button>
            </footer>
          </div>
        </div>
      )}

      {stage === 'credits' && (
        <div className="birthday-credits">
          <div className="credits-frame" aria-hidden="true" />
          <div className="credits-scroll" tabIndex={0} aria-label={copy.creditsTitle}>
            <h1 className="credit-block" ref={heading} tabIndex={-1}>
              {copy.creditsTitle}
            </h1>
            <div className="credit-block credit-names">
              <p>{copy.byLabel}</p>
              <span>{author || copy.unsigned}</span>
            </div>
            <div className="credit-block credit-names">
              <p>{copy.starringLabel}</p>
              <span>{starring}</span>
            </div>
            <p className="credit-block credit-love">{copy.loveLine}</p>
          </div>
          <div className="credits-actions">
            <button className="begin-button" onClick={onClose}>
              {copy.returnArchive}
              <Icon name="arrow" />
            </button>
            <button className="text-button" onClick={() => setStage('letter')}>
              {copy.viewLetter}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
