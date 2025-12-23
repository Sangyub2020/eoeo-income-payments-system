import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack 설정 (Next.js 16 기본)
  turbopack: {},
  // 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ca.slack-edge.com',
      },
    ],
  },
  // webpack 설정 (xlsx 라이브러리 지원)
  webpack: (config, { isServer }) => {
    // xlsx 라이브러리가 클라이언트에서도 작동하도록 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        perf_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;


