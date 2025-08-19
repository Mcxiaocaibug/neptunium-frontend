const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 在 Netlify 环境下跳过 ESLint 和 TypeScript 检查以加速构建
  eslint: {
    ignoreDuringBuilds: process.env.NETLIFY === 'true',
    dirs: ['src', 'app', 'components'],
  },
  typescript: {
    ignoreBuildErrors: process.env.NETLIFY === 'true',
  },

  webpack: (config, { isServer }) => {
    // 别名兜底，确保 @ 指向 src
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');

    // WASM 支持
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // 处理 Node.js 模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // 静态导出配置
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
