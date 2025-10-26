#!/bin/bash
# 重新编译 better-sqlite3 原生模块

echo "🔨 重新编译 better-sqlite3 原生模块..."

# 使用 npm 而不是 pnpm，因为 pnpm 的构建脚本可能被禁用
# npm 会自动检测平台并编译正确的原生模块
echo "📦 使用 npm rebuild 重建原生模块..."

if npm rebuild better-sqlite3; then
    echo "✅ better-sqlite3 编译成功 ($(uname -s) $(uname -m))"
    
    # 验证编译结果
    if find node_modules -name "better_sqlite3.node" -type f 2>/dev/null | head -1 | xargs file | grep -q "Mach-O\|ELF"; then
        echo "✅ 原生模块文件验证成功"
        
        # 显示模块类型
        find node_modules -name "better_sqlite3.node" -type f 2>/dev/null | head -1 | xargs file
    else
        echo "⚠️  警告：未找到原生模块文件"
    fi
else
    echo "❌ better-sqlite3 编译失败"
    echo "💡 尝试手动安装..."
    npm install better-sqlite3 --force
    exit 1
fi

echo "✨ 完成！现在可以运行 pnpm dev:electron 了"

