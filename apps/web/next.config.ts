import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 16: cacheComponents replaces the experimental PPR flag.
  // Enables component-level caching for App Router pages.
  cacheComponents: true,
}

export default nextConfig
