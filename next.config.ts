import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_ARCHIVE_BASE_PATH || '',
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1'],
};
export default config;
