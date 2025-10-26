/* eslint-disable @typescript-eslint/no-var-requires */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs'); // 导入文件系统模块

// 检查是否是生产环境 (即是否已打包成 .exe)
const isProd = app.isPackaged;
const port = 30001; // 我们本地服务器的端口

let serverProcess;
let mainWindow;

function createServerProcess() {
  if (isProd) {
    // --- 生产环境 ---
    // 1. 定义数据库应该存放在哪
    // app.getPath('appData') 会获取一个安全的用户目录, 比如 C:\Users\YourName\AppData\Roaming
    const dbDir = path.join(app.getPath('appData'), 'LunaTV');

    // 2. 确保这个目录存在
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      console.error('创建数据库目录失败:', e);
    }

    // 3. 数据库文件的完整路径
    const dbPath = path.join(dbDir, 'lunatv.db');
    console.log(`数据库路径设置为: ${dbPath}`);

    // 4. 找到我们打包进来的 Next.js 服务器启动脚本
    //
    const serverPath = path.join(
      __dirname,
      'resources',
      'app.asar.unpacked',
      'start.js'
    );

    console.log(`正在启动服务器: ${serverPath}`);

    // 5. 启动服务器进程，并注入环境变量
    serverProcess = fork(serverPath, {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port,
        HOSTNAME: '127.0.0.1', // 只允许本地访问

        // --- 关键：注入 SQLite 路径 ---
        SQLITE_PATH: dbPath,

        // --- 关键：设置管理员账号和密码 ---
        USERNAME: 'admin',
        PASSWORD: 'admin', // 与数据库默认密码保持一致

        // --- 关键：禁用所有 Redis 变量 ---
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
        REDIS_URL: undefined,
        KVROCKS_URL: undefined,
      },
    });

    serverProcess.on('error', (err) => {
      console.error('服务器启动失败:', err);
    });

  } else {
    // --- 开发环境 ---
    // 我们什么也不做，因为 package.json 脚本会帮我们启动 `pnpm dev`
    // 环境变量也会由 package.json 脚本注入
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    // 使用 public/logo.png 作为图标
    // electron-builder 会在打包时自动处理这个
    icon: path.join(__dirname, 'resources', 'public', 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 根据环境加载不同的 URL
  const appUrl = isProd
    ? `http://127.0.0.1:${port}` // 生产：加载本地服务器
    : 'http://localhost:30001'; // 开发：加载 dev 服务器

  console.log(`正在加载 URL: ${appUrl}`);
  mainWindow.loadURL(appUrl);

  // 开发环境下自动打开 F12 开发者工具
  if (!isProd) {
    mainWindow.webContents.openDevTools();
  }
}

// --- Electron 应用生命周期 ---

app.on('ready', () => {
  // 1. 先启动后端服务器
  createServerProcess();
  // 2. 再创建浏览器窗口
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 退出应用前，确保把后端服务器也关掉
app.on('before-quit', () => {
  if (serverProcess) {
    console.log('正在关闭服务器进程...');
    serverProcess.kill();
    serverProcess = null;
  }
});