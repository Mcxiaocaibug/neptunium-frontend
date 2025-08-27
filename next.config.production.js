const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 生产环境优化配置

    // 启用实验性功能
    experimental: {
        // 启用 Turbo
        turbo: {
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                },
            },
        },
        // 启用服务器组件
        serverComponentsExternalPackages: ['@aws-sdk/client-s3'],
    },

    // 编译器优化
    compiler: {
        // 移除 console.log
        removeConsole: process.env.NODE_ENV === 'production',
        // React 编译器优化
        reactRemoveProperties: process.env.NODE_ENV === 'production',
    },

    // ESLint 和 TypeScript 配置
    eslint: {
        ignoreDuringBuilds: false, // 生产环境启用检查
        dirs: ['src', 'app', 'components', 'lib'],
    },
    typescript: {
        ignoreBuildErrors: false, // 生产环境启用类型检查
    },

    // Webpack 配置
    webpack: (config, { isServer, dev }) => {
        // 别名配置
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');

        // WASM 支持
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true,
        };

        // 生产环境优化
        if (!dev) {
            // 代码分割优化
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                        },
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            enforce: true,
                        },
                    },
                },
            };

            // 压缩配置
            config.optimization.minimize = true;
        }

        // Node.js 模块处理
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                url: false,
                zlib: false,
                http: false,
                https: false,
                assert: false,
                os: false,
                path: false,
            };
        }

        return config;
    },

    // 输出配置
    output: 'standalone',

    // 静态优化
    trailingSlash: true,

    // 图片优化
    images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        unoptimized: process.env.NETLIFY === 'true', // Netlify 环境下禁用优化
    },

    // 安全头配置
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                ],
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-API-Key',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                ],
            },
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // 重定向配置
    async redirects() {
        return [
            // 重定向到 HTTPS（如果需要）
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
        ];
    },

    // 重写配置
    async rewrites() {
        return [
            {
                source: '/health',
                destination: '/api/health',
            },
            {
                source: '/docs',
                destination: '/api-docs',
            },
        ];
    },

    // 环境变量
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },

    // 构建时环境变量
    publicRuntimeConfig: {
        APP_NAME: process.env.APP_NAME || 'Neptunium',
        APP_VERSION: process.env.npm_package_version || '1.0.0',
    },

    // 服务器运行时配置
    serverRuntimeConfig: {
        PROJECT_ROOT: __dirname,
    },

    // PoweredByHeader
    poweredByHeader: false,

    // 生成 sitemap
    async generateBuildId() {
        // 使用 git commit hash 作为构建 ID
        return process.env.VERCEL_GIT_COMMIT_SHA || 'development';
    },
};

module.exports = nextConfig;
