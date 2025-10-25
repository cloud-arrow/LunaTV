# 📦 使用 GitHub Actions 打包发布

## 🚀 方式 1: 手动触发构建（推荐）

1. 进入你的 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Build Electron App** 工作流
4. 点击右侧的 **Run workflow** 按钮
5. 点击绿色的 **Run workflow** 确认

等待 15-30 分钟后，构建完成！

## 📥 下载构建产物

构建完成后：

1. 在 Actions 页面找到你刚才运行的工作流
2. 滚动到页面底部的 **Artifacts** 部分
3. 下载对应平台的安装包：
   - **windows-installer** - Windows 安装程序 (.exe)
   - **macos-installer** - macOS 安装包 (.dmg)
   - **linux-installer** - Linux 安装包 (.AppImage)

## 🏷️ 方式 2: 通过 Git Tag 自动发布

```bash
# 1. 创建一个新版本标签
git tag v1.0.0

# 2. 推送标签到 GitHub
git push origin v1.0.0
```

这会：
- ✅ 自动触发构建
- ✅ 创建 GitHub Release
- ✅ 自动上传所有安装包到 Release

然后在 GitHub 仓库的 **Releases** 页面就能看到发布的版本！

## 📋 支持的平台

| 平台 | 架构 | 输出文件 |
|------|------|----------|
| Windows | x64 | `LunaTV Setup 0.1.0.exe` |
| macOS | Apple Silicon (M1/M2) | `LunaTV-0.1.0-arm64.dmg` |
| macOS | Intel | `LunaTV-0.1.0.dmg` |
| Linux | x64 | `LunaTV-0.1.0.AppImage` |

## 🎯 构建时间

- Windows: ~10 分钟
- macOS: ~15 分钟
- Linux: ~8 分钟

总计约 **30 分钟**并行构建完成所有平台！

## 🐛 故障排除

### 构建失败？

1. 检查 Actions 页面的构建日志
2. 确保 `package.json` 中的配置正确
3. 确保所有依赖都在 `package.json` 中声明

### 找不到 Artifacts？

- 等待所有构建任务完成（绿色的✓）
- 刷新页面
- 确保登录了 GitHub 账号

