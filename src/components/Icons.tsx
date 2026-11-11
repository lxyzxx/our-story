import type { CSSProperties } from 'react';
type Props = {
  name:
    | 'arrow'
    | 'back'
    | 'sound'
    | 'muted'
    | 'close'
    | 'rotate'
    | 'expand'
    | 'play'
    | 'pause'
    | 'book'
    | 'settings';
  size?: number;
  style?: CSSProperties;
};
export function Icon({ name, size = 18, style }: Props) {
  const paths: Record<Props['name'], React.ReactNode> = {
    play: <path d="m8 4 12 8-12 8V4Z" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v15M3 4c3-1 6 0 9 2 3-2 6-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2V4Z" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h15M13 5l7 7-7 7" />
      </>
    ),
    back: (
      <>
        <path d="M20 12H5M11 5l-7 7 7 7" />
      </>
    ),
    sound: (
      <>
        <path d="m11 4-6 5H2v6h3l6 5V4Z" />
        <path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
      </>
    ),
    muted: (
      <>
        <path d="m11 4-6 5H2v6h3l6 5V4Z" />
        <path d="m16 9 6 6m0-6-6 6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    rotate: (
      <>
        <rect x="8" y="4" width="9" height="16" rx="1" transform="rotate(30 12 12)" />
        <path d="M20 7V3h-4M4 17v4h4M20 3l-3 1M4 21l3-1" />
      </>
    ),
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
