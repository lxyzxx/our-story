import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { CSSProperties } from 'react';
import { archiveUrl } from '@/lib/urls';
import './globals.css';
const cinema = localFont({
  src: [
    { path: '../../public/fonts/archive-font-0.ttf', weight: '400', style: 'italic' },
    { path: '../../public/fonts/archive-font-1.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/archive-font-2.ttf', weight: '500', style: 'normal' },
  ],
  variable: '--font-cinema',
  display: 'swap',
});
const interfaceFont = localFont({
  src: [
    { path: '../../public/fonts/archive-font-3.ttf', weight: '400' },
    { path: '../../public/fonts/archive-font-4.ttf', weight: '500' },
    { path: '../../public/fonts/archive-font-5.ttf', weight: '600' },
  ],
  variable: '--font-interface',
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'OUR STORY — The Film Archive',
  description: '一间私人的胶片档案室，一部由我们共同主演的电影。',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#25191d',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-CN"
      className={`${cinema.variable} ${interfaceFont.variable}`}
      style={{ '--archive-grain': `url("${archiveUrl('/images/grain.png')}")` } as CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
