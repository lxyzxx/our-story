import type { Chapter } from '@/lib/types';
export function FilmRoll({
  chapter,
  decorative = false,
}: {
  chapter: Chapter;
  decorative?: boolean;
}) {
  return (
    <div className={`film-roll film-roll--${chapter.color}`} aria-hidden={decorative || undefined}>
      <div className="roll-tail">
        <span>OUR STORY · {chapter.number}</span>
      </div>
      <div className="roll-spindle" />
      <div className="roll-body">
        <div className="roll-label">
          <div className="roll-label-top">
            <span>OUR STORY</span>
            <span>35 mm</span>
          </div>
          <span className="roll-name">{chapter.title}</span>
          <div className="roll-rule" />
          <div className="roll-label-bottom">
            <span>ROLL {chapter.number}</span>
            <span>COLOR NEGATIVE</span>
          </div>
        </div>
        <span className="roll-code">|||| ||| || |||| ||| | ||||</span>
      </div>
      <div className="roll-rim roll-rim--left" />
      <div className="roll-rim roll-rim--right" />
      <div className="roll-end" />
    </div>
  );
}
