import 'server-only';
import type { PremiereConfig } from './types';
import { parsePremiereTime, type PremiereState } from './premiere';
export function getPremiereState(config?: PremiereConfig, now = Date.now()): PremiereState {
  const state: PremiereState = {
    enabled: !!config && config.enabled !== false,
    status: 'open',
    serverNow: now,
    opensAt: null,
    timeZone: config?.timeZone || 'Asia/Shanghai',
    preview: false,
  };
  if (!config || config.enabled === false) return state;
  const epoch = parsePremiereTime(config.opensAt);
  let validZone = true;
  try {
    new Intl.DateTimeFormat('en', { timeZone: state.timeZone }).format(now);
  } catch {
    validZone = false;
  }
  if (config.enabled !== true || epoch === null || !validZone)
    return { ...state, status: 'invalid', timeZone: validZone ? state.timeZone : 'UTC' };
  state.opensAt = config.opensAt;
  state.preview = process.env.PREMIERE_PREVIEW === '1';
  state.status = state.preview || now >= epoch ? 'open' : 'locked';
  return state;
}
