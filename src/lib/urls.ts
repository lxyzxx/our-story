// Next.js embeds basePath at build time; use the same prefix for public media and fetch.
export function archiveUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_ARCHIVE_BASE_PATH || '';
  if (!base || !path.startsWith('/') || path.startsWith('//')) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}
