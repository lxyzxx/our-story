import type { FinaleContent, FinaleCopy } from './types';
export const defaultFinaleCopy: FinaleCopy = {
  sceneTitle: '生日终幕',
  question: 'THE END?',
  answer: 'NO.',
  continued: 'TO BE CONTINUED...',
  title: 'Happy birthday.',
  dedication: '愿接下来的每一帧，都有你。',
  letterTitle: 'A letter for you.',
  letterLabel: 'A LETTER TO KEEP',
  emptyLetter: '这封信，等你亲手写下。',
  viewCredits: '看看片尾字幕',
  viewLetter: '重读生日信',
  creditsTitle: 'Our story continues.',
  byLabel: 'A FILM BY',
  starringLabel: 'STARRING',
  loveLine: 'MADE WITH LOVE',
  unsigned: '待填写署名',
  returnArchive: 'REVISIT OUR MEMORIES',
  skipIntro: '跳过终幕片头',
  pauseIntro: '暂停终幕片头',
  resumeIntro: '继续终幕片头',
  footer: 'FOR ALL THE YEARS TO COME.',
};
// Optional copy keeps previously saved content files compatible; all defaults are public gift copy.
export function finaleCopy(finale: FinaleContent): FinaleCopy {
  return { ...defaultFinaleCopy, ...finale.copy };
}
export const finaleMotion = {
  questionAt: 1.5,
  answerAt: 2.75,
  continuedAt: 3.85,
  letterAt: 6.1,
} as const;
