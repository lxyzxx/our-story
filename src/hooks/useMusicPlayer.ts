'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useMusicPlayer(source?: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const activated = useRef(false);
  const track = useRef<string | undefined>(undefined);
  const generation = useRef(0);
  const raf = useRef(0);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gain = useRef(0);
  const master = useRef(0.45);
  const mutePreference = useRef(false);
  const [status, setStatus] = useState<'none' | 'playing' | 'blocked' | 'error' | 'loading'>(
    'none',
  );
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.45);
  const fade = useCallback((target: number, seconds: number) => {
    cancelAnimationFrame(raf.current);
    const from = gain.current;
    const start = performance.now();
    const frame = (time: number) => {
      const t = Math.min(1, (time - start) / (seconds * 1000));
      gain.current = from + (target - from) * t;
      if (audio.current)
        audio.current.volume = Math.max(0, Math.min(1, master.current * gain.current));
      if (t < 1) raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, []);
  const start = useCallback(
    (src?: string) => {
      const token = ++generation.current;
      cancelAnimationFrame(raf.current);
      if (delay.current) clearTimeout(delay.current);
      const el = audio.current;
      const play = () => {
        if (token !== generation.current) return;
        if (!src) {
          el?.pause();
          if (el) {
            el.removeAttribute('src');
            el.load();
          }
          track.current = undefined;
          setStatus('none');
          return;
        }
        const next = audio.current ?? new Audio();
        audio.current = next;
        next.muted = mutePreference.current;
        next.loop = true;
        next.preload = 'none';
        if (track.current !== src) {
          next.src = src;
          track.current = src;
        }
        next.volume = 0;
        gain.current = 0;
        next.onerror = () => {
          if (token === generation.current) setStatus('error');
        };
        setStatus('loading');
        const promise = next.play();
        promise
          .then(() => {
            if (token !== generation.current) return;
            setStatus('playing');
            fade(1, 1.25);
          })
          .catch(() => {
            if (token === generation.current) setStatus(next.error ? 'error' : 'blocked');
          });
      };
      if (el && !el.paused && track.current !== src) {
        fade(0, 0.4);
        delay.current = setTimeout(play, 420);
      } else play();
    },
    [fade],
  );
  const activate = useCallback(() => {
    activated.current = true;
    start(source);
  }, [source, start]);
  useEffect(() => {
    if (activated.current && track.current !== source) start(source);
  }, [source, start]);
  useEffect(
    () => () => {
      generation.current++;
      cancelAnimationFrame(raf.current);
      if (delay.current) clearTimeout(delay.current);
      if (audio.current) {
        audio.current.pause();
        audio.current.removeAttribute('src');
        audio.current.load();
      }
    },
    [],
  );
  const toggleMute = () => {
    if (status === 'blocked' || status === 'error') {
      activate();
      return;
    }
    const value = !muted;
    setMuted(value);
    mutePreference.current = value;
    if (audio.current) audio.current.muted = value;
  };
  const setVolume = (value: number) => {
    const v = Math.max(0, Math.min(1, value));
    master.current = v;
    setVolumeState(v);
    if (audio.current) audio.current.volume = v * gain.current;
  };
  return { source, status, muted, volume, activate, toggleMute, setVolume };
}
export type MusicController = ReturnType<typeof useMusicPlayer>;
