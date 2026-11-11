import type { PremiereCopy } from './types';
export interface PremiereState {
  enabled: boolean;
  status: 'open' | 'locked' | 'invalid';
  serverNow: number;
  opensAt: string | null;
  timeZone: string;
  preview: boolean;
}
export const premiereCopy: PremiereCopy = {
  invitation: '一场只属于你的生日首映。',
  waiting: '等时针走到这一刻，再一起打开。',
  checking: '正在确认首映时间…',
  connectionError: '连接暂时中断，首映时间还在等待确认。',
  retry: '重新确认时间',
  enter: '进入放映室',
  locked: '首映尚未开始',
  unscheduled: '首映时间正在安排',
  footer: 'A PRIVATE SCREENING. JUST FOR YOU.',
};
// An explicit UTC offset is required. Local dates without an offset never inherit the server timezone.
export function parsePremiereTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
  if (!match) return null;
  const [, year, month, day, hour, minute, second, , zone, sign, zoneHour, zoneMinute] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  if (
    parts[0] < 1970 ||
    parts[1] < 1 ||
    parts[1] > 12 ||
    parts[2] < 1 ||
    parts[2] > 31 ||
    parts[3] > 23 ||
    parts[4] > 59 ||
    parts[5] > 59
  )
    return null;
  if (
    zone !== 'Z' &&
    (Number(zoneHour) > 14 ||
      Number(zoneMinute) > 59 ||
      (Number(zoneHour) === 14 && Number(zoneMinute) !== 0))
  )
    return null;
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) return null;
  const offset =
    zone === 'Z' ? 0 : (Number(zoneHour) * 60 + Number(zoneMinute)) * (sign === '+' ? 1 : -1);
  const local = new Date(epoch + offset * 60000);
  const actual = [
    local.getUTCFullYear(),
    local.getUTCMonth() + 1,
    local.getUTCDate(),
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
  ];
  return actual.every((v, i) => v === parts[i]) ? epoch : null;
}
export function formatPremiereTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).format(new Date(value));
}
