import type { ArchiveContent } from '@/lib/types';
import { finaleCopy } from '@/lib/finale';
import { Icon } from './Icons';
export function OpeningScene({
  content,
  onBegin,
  ready,
  completed = false,
  onReplay,
  onLetter,
}: {
  content: ArchiveContent;
  onBegin: () => void;
  ready: boolean;
  completed?: boolean;
  onReplay?: () => void;
  onLetter?: () => void;
}) {
  const copy = finaleCopy(content.finale);
  return (
    <section className="opening" aria-labelledby="opening-title">
      <div className="opening-light" />
      <div className="opening-frame" aria-hidden="true">
        <span>35 MM</span>
        <span>PRIVATE SCREENING</span>
      </div>
      <div className="opening-top">
        <span>THE FILM ARCHIVE</span>
        <button className="text-button" disabled={!ready} onClick={onBegin}>
          {content.opening.skip}
          <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="opening-titles">
        <h1 id="opening-title">{content.title}</h1>
        <p className="opening-subtitle">{content.subtitle}</p>
        <div className="opening-cast">
          <span>Starring</span>
          <em>{content.starring}</em>
        </div>
        <p className="opening-invitation">{content.opening.invitation}</p>
        <button className="begin-button" disabled={!ready} onClick={onBegin}>
          <span>{content.opening.begin}</span>
          <Icon name="arrow" size={20} />
        </button>
        {completed && (
          <div className="opening-revisit">
            <button className="text-button" disabled={!ready} onClick={onReplay}>
              {content.player.replay}
            </button>
            <span>/</span>
            <button className="text-button" disabled={!ready} onClick={onBegin}>
              {content.player.freeBrowse}
            </button>
            {onLetter && (
              <>
                <span>/</span>
                <button
                  data-finale-entry
                  className="text-button"
                  disabled={!ready}
                  onClick={onLetter}
                >
                  {copy.viewLetter}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="portrait-invitation">
        <Icon name="rotate" size={25} />
        <p>
          FOR THE BEST EXPERIENCE
          <br />
          ROTATE YOUR PHONE
        </p>
        <span>{content.opening.rotate}</span>
        <button className="text-button" disabled={!ready} onClick={onBegin}>
          {content.opening.portrait}
          <Icon name="arrow" size={14} />
        </button>
      </div>
      <div className="opening-bottom">
        <span>A PRIVATE COLLECTION OF OUR DAYS</span>
        <span>MADE WITH LOVE</span>
      </div>
    </section>
  );
}
