import type { NextConfig } from 'next';
const config: NextConfig = {
  output: process.env.ARCHIVE_STANDALONE === '1' ? 'standalone' : undefined,
  basePath: process.env.NEXT_PUBLIC_ARCHIVE_BASE_PATH || '',
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1'],
};
export default config;
