# 📝 提交并使用 GitHub Actions 打包指南

## 🚀 第一步：在 macOS 上提交代码

在你的 **macOS 终端**中运行：

```bash
cd ~/Code/node/LunaTV

# 查看更改
git status

# 提交代码
git commit -m "feat: 添加 Electron 桌面应用支持和 SQLite 数据库

- 添加 SQLite 数据库支持（better-sqlite3 + knex）
- 添加 Electron 桌面应用框架
- 添加 GitHub Actions 自动打包工作流
- 修复 Next.js Webpack 配置以支持 Knex
- 添加密码哈希功能
- 添加原生模块重新编译脚本

支持平台：Windows, macOS, Linux
使用 GitHub Actions 自动构建"

# 推送到 GitHub
git push
```

## 🎯 第二步：触发 GitHub Actions 构建

### 方式 1: 手动触发（推荐，简单快速）

1. 打开你的 GitHub 仓库页面
2. 点击顶部的 **Actions** 标签
3. 在左侧选择 **Build Electron App** 工作流
4. 点击右侧的 **Run workflow** 下拉按钮
5. 点击绿色的 **Run workflow** 确认

### 方式 2: 通过 Git Tag 自动触发

```bash
cd ~/Code/node/LunaTV

# 创建版本标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

这会自动触发构建并创建 GitHub Release！

## ⏰ 第三步：等待构建完成

构建大约需要 **20-30 分钟**（三个平台并行构建）

你可以在 Actions 页面实时查看进度：
- ✅ macOS 构建（最慢，~15 分钟）
- ✅ Windows 构建（~12 分钟）
- ✅ Linux 构建（~8 分钟）

## 📥 第四步：下载安装包

构建完成后：

### 如果使用方式 1（手动触发）：

1. 在 Actions 页面找到你的构建任务
2. 滚动到页面底部的 **Artifacts** 部分
3. 下载对应的安装包：
   - `windows-installer` - Windows 安装程序
   - `macos-installer` - macOS 安装包（.dmg）
   - `linux-installer` - Linux 安装包

### 如果使用方式 2（Git Tag）：

1. 进入仓库的 **Releases** 页面
2. 找到你刚创建的版本（如 v1.0.0）
3. 下载 **Assets** 中的安装包

## 🎉 第五步：安装和测试

### macOS:
- 下载 `.dmg` 文件
- 双击打开
- 拖动 LunaTV 到 Applications 文件夹
- 打开应用（首次可能需要右键→打开）

### Windows:
- 下载 `.exe` 文件
- 双击安装
- 运行 LunaTV

### Linux:
- 下载 `.AppImage` 文件
- 添加执行权限：`chmod +x LunaTV-*.AppImage`
- 运行：`./LunaTV-*.AppImage`

## 📊 生成的文件

| 平台 | 文件名 | 大小（约） |
|------|--------|-----------|
| macOS ARM64 | `LunaTV-0.1.0-arm64.dmg` | ~300MB |
| macOS Intel | `LunaTV-0.1.0.dmg` | ~300MB |
| Windows x64 | `LunaTV Setup 0.1.0.exe` | ~250MB |
| Linux x64 | `LunaTV-0.1.0.AppImage` | ~400MB |

## ✨ 完成！

现在你有了一个完全离线运行的桌面应用，使用本地 SQLite 数据库！

---

**注意事项：**
- 首次构建可能需要更长时间（需要下载依赖）
- 确保你的 GitHub 仓库是公开的，或者你有 GitHub Actions 权限
- 免费 GitHub 账号每月有 2000 分钟的 Actions 时间额度

