'use client';
import { useMemo, useSyncExternalStore } from 'react';
const KEY = 'our-story:progress:v1';
const EVENT = 'our-story:progress';
let fallback = '';
export interface WatchProgress {
  completed: string[];
  resume?: { chapterId: string; frameKey: string };
}
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(EVENT, listener);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(KEY) || fallback;
  } catch {
    return fallback;
  }
}
function decode(raw: string): WatchProgress {
  try {
    const v = JSON.parse(raw);
    return {
      completed: Array.isArray(v.completed)
        ? v.completed.filter((id: unknown) => typeof id === 'string')
        : [],
      resume:
        typeof v.resume?.chapterId === 'string' && typeof v.resume?.frameKey === 'string'
          ? v.resume
          : undefined,
    };
  } catch {
    return { completed: [] };
  }
}
function update(change: (current: WatchProgress) => WatchProgress) {
  const value = JSON.stringify(change(decode(snapshot())));
  if (value === snapshot()) return;
  fallback = value;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* Viewing preferences remain usable when browser storage is unavailable. */
  }
  window.dispatchEvent(new Event(EVENT));
}
const completeChapter = (id: string) =>
  update((current) => ({ ...current, completed: [...new Set([...current.completed, id])] }));
const saveResume = (chapterId: string, frameKey: string) =>
  update((current) => ({ ...current, resume: { chapterId, frameKey } }));
export function useArchiveProgress() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '');
  const progress = useMemo(() => decode(raw), [raw]);
  return { ...progress, completeChapter, saveResume };
}
