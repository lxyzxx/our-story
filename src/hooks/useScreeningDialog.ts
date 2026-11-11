'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
export function useScreeningDialog(root: RefObject<HTMLElement | null>, onEscape: () => void) {
  const escape = useRef(onEscape);
  useLayoutEffect(() => {
    escape.current = onEscape;
  }, [onEscape]);
  useLayoutEffect(() => {
    const body = document.body;
    const y = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    Object.assign(body.style, {
      position: 'fixed',
      top: `-${y}px`,
      width: '100%',
      overflow: 'hidden',
    });
    root.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        escape.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) ?? [],
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          el.getClientRects().length &&
          getComputedStyle(el).visibility !== 'hidden' &&
          !el.closest('[hidden],[inert]'),
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || !root.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !root.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      Object.assign(body.style, previous);
      window.scrollTo(0, y);
    };
  }, [root]);
}
