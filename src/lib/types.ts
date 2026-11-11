export type FilmColor = 'cream' | 'olive' | 'rust' | 'charcoal';
export interface ArchivePhoto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}
export interface Memory {
  id: string;
  title: string;
  date?: string;
  place?: string;
  story: string;
  quote?: string;
  photos: ArchivePhoto[];
}
export interface Chapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  introduction: string;
  color: FilmColor;
  memories: Memory[];
  music?: string;
}
export interface FinaleCopy {
  sceneTitle: string;
  question: string;
  answer: string;
  continued: string;
  title: string;
  dedication: string;
  letterTitle: string;
  letterLabel: string;
  emptyLetter: string;
  viewCredits: string;
  viewLetter: string;
  creditsTitle: string;
  byLabel: string;
  starringLabel: string;
  loveLine: string;
  unsigned: string;
  returnArchive: string;
  skipIntro: string;
  pauseIntro: string;
  resumeIntro: string;
  footer: string;
}
export interface FinaleContent {
  letter: string;
  credit: string;
  starring: string;
  signature?: string;
  date?: string;
  copy?: Partial<FinaleCopy>;
}
export interface PremiereCopy {
  invitation: string;
  waiting: string;
  checking: string;
  connectionError: string;
  retry: string;
  enter: string;
  locked: string;
  unscheduled: string;
  footer: string;
}
export interface PremiereConfig {
  enabled: boolean;
  opensAt: string;
  timeZone: string;
  copy?: Partial<PremiereCopy>;
}
export interface ArchiveContent {
  title: string;
  subtitle: string;
  starring: string;
  heading: string;
  headingEmphasis: string;
  dedication: string;
  opening: { begin: string; skip: string; invitation: string; rotate: string; portrait: string };
  workbench: {
    title: string;
    select: string;
    touchOpen: string;
    back: string;
    note: string;
    signature: string;
  };
  music: { opening?: string; archive?: string; finale?: string };
  finale: FinaleContent;
  chapters: Chapter[];
  player: {
    frameSeconds: number;
    begin: string;
    pause: string;
    resume: string;
    read: string;
    closeStory: string;
    noStory: string;
    nextChapter: string;
    chapterEnd: string;
    allWatched: string;
    returnArchive: string;
    replay: string;
    freeBrowse: string;
  };
  demo: boolean;
  premiere?: PremiereConfig;
}
export interface ContentRepository {
  getArchive(): Promise<ArchiveContent>;
}
