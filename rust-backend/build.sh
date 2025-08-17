#!/bin/bash

# Neptunium Rust WASM 构建脚本

set -e

echo "🦀 Building Neptunium Rust WASM module..."

# 检查 wasm-pack 是否安装
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# 检查 Rust 工具链
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust not found. Please install Rust first."
    echo "Visit: https://rustup.rs/"
    exit 1
fi

# 添加 wasm32 目标
echo "📦 Adding wasm32-unknown-unknown target..."
rustup target add wasm32-unknown-unknown

# 构建 WASM 包
echo "🔨 Building WASM package..."
wasm-pack build --target web --out-dir ../src/lib/wasm --scope neptunium

# 检查构建结果
if [ -f "../src/lib/wasm/neptunium_core.js" ]; then
    echo "✅ WASM build successful!"
    echo "📁 Output files:"
    ls -la ../src/lib/wasm/
else
    echo "❌ WASM build failed!"
    exit 1
fi

# 生成 TypeScript 类型定义
echo "📝 Generating TypeScript definitions..."
if [ -f "../src/lib/wasm/neptunium_core.d.ts" ]; then
    echo "✅ TypeScript definitions generated!"
else
    echo "⚠️  TypeScript definitions not found, but build completed."
fi

echo "🎉 Rust WASM module build complete!"
echo ""
echo "Next steps:"
echo "1. Import the WASM module in your TypeScript code"
echo "2. Initialize the module before using it"
echo "3. Call Rust functions from your Netlify Functions"
echo ""
echo "Example usage:"
echo "import init, { generate_file_id, hash_password } from '@/lib/wasm/neptunium_core';"
echo "await init();"
echo "const fileId = generate_file_id();"
