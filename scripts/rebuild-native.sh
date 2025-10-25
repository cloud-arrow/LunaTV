#!/bin/bash
# 重新编译 better-sqlite3 原生模块

echo "🔨 重新编译 better-sqlite3 原生模块..."

cd node_modules/.pnpm/better-sqlite3@12.4.1/node_modules/better-sqlite3

if npm run build-release; then
    echo "✅ better-sqlite3 编译成功 ($(uname -s) $(uname -m))"
else
    echo "❌ better-sqlite3 编译失败"
    exit 1
fi

cd - > /dev/null
echo "✨ 完成！现在可以运行 pnpm dev:electron 了"

