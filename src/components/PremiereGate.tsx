'use client';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PremiereCopy } from '@/lib/types';
import { formatPremiereTime, premiereCopy, type PremiereState } from '@/lib/premiere';
import { Icon } from './Icons';
import { archiveUrl } from '@/lib/urls';
type Props = {
  title: string;
  subtitle: string;
  initial: PremiereState;
  copy?: Partial<PremiereCopy>;
};
export function PremiereGate({ title, subtitle, initial, copy: customCopy }: Props) {
  const copy = { ...premiereCopy, ...customCopy };
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useState(initial);
  const [remaining, setRemaining] = useState(() =>
    initial.opensAt ? Math.max(0, Date.parse(initial.opensAt) - initial.serverNow) : 0,
  );
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const syncRef = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);
  useEffect(() => {
    let anchor = {
      now: initial.serverNow,
      at: performance.now(),
      target: initial.opensAt ? Date.parse(initial.opensAt) : null,
    };
    let controller: AbortController | null = null;
    let stopped = false;
    let lastAttempt = -Infinity;
    let notified = false;
    const sync = async () => {
      if (controller || stopped) return;
      lastAttempt = performance.now();
      controller = new AbortController();
      try {
        const response = await fetch(archiveUrl('/api/premiere'), {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('unavailable');
        const next = (await response.json()) as PremiereState;
        if (
          !['open', 'locked', 'invalid'].includes(next.status) ||
          !Number.isFinite(next.serverNow)
        )
          throw new Error('invalid response');
        if (stopped) return;
        setState(next);
        setError(false);
        anchor = {
          now: next.serverNow,
          at: performance.now(),
          target: next.opensAt ? Date.parse(next.opensAt) : null,
        };
        if (next.status === 'open') {
          setReady(true);
          setRemaining(0);
          if (!notified) {
            notified = true;
            refresh();
          }
        }
      } catch (err) {
        if (!stopped && !(err instanceof DOMException && err.name === 'AbortError')) setError(true);
      } finally {
        controller = null;
      }
    };
    const tick = () => {
      const value =
        anchor.target === null
          ? 0
          : Math.max(0, anchor.target - anchor.now - (performance.now() - anchor.at));
      setRemaining(value);
      if (anchor.target !== null && value === 0 && performance.now() - lastAttempt > 1100)
        void sync();
    };
    const visible = () => {
      if (!document.hidden) void sync();
    };
    syncRef.current = () => void sync();
    void sync();
    const clock = setInterval(tick, 1000);
    const poll = setInterval(() => void sync(), 30000);
    document.addEventListener('visibilitychange', visible);
    return () => {
      stopped = true;
      controller?.abort();
      clearInterval(clock);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', visible);
      syncRef.current = null;
    };
  }, [initial, refresh]);
  const total = Math.ceil(remaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor(total / 3600) % 24;
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  const valid = state.status !== 'invalid' && state.opensAt !== null;
  const values = [days, hours, minutes, seconds];
  const labels = ['天', '时', '分', '秒'];
  return (
    <main className="premiere-gate">
      <div className="grain" aria-hidden="true" />
      <div className="premiere-glow" aria-hidden="true" />
      <div className="premiere-frame" aria-hidden="true" />
      <header>
        <span>THE FILM ARCHIVE</span>
        <span>PRIVATE PREMIERE</span>
      </header>
      <section className="premiere-invitation" aria-labelledby="premiere-title">
        <h1 id="premiere-title">{title}</h1>
        <p className="premiere-subtitle">{subtitle}</p>
        <p className="premiere-for-you">{copy.invitation}</p>
        <dl className="premiere-countdown" role="timer" aria-label="距离生日首映的倒计时">
          {values.map((value, i) => (
            <div key={labels[i]}>
              <dd>{valid ? String(value).padStart(i === 0 ? 3 : 2, '0') : '—'}</dd>
              <dt>{labels[i]}</dt>
            </div>
          ))}
        </dl>
        <p className="premiere-date">
          {valid ? formatPremiereTime(state.opensAt!, state.timeZone) : copy.unscheduled}
        </p>
        <p className="premiere-waiting">{copy.waiting}</p>
        <button className="begin-button premiere-enter" disabled={!ready} onClick={refresh}>
          <span>{ready ? copy.enter : copy.locked}</span>
          <Icon name={ready ? 'arrow' : 'book'} size={18} />
        </button>
        <div className="premiere-status" role="status">
          {error ? (
            <>
              <p>{copy.connectionError}</p>
              <button className="text-button" onClick={() => syncRef.current?.()}>
                {copy.retry}
                <Icon name="arrow" size={14} />
              </button>
            </>
          ) : remaining === 0 && valid && !ready ? (
            <p>{copy.checking}</p>
          ) : null}
        </div>
      </section>
      <footer>{copy.footer}</footer>
    </main>
  );
}
