const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;
  const projectDir = context.packager.projectDir;
  
  console.log('Running afterPack hook...');
  console.log('Platform:', platform);
  console.log('App out dir:', appOutDir);
  console.log('Project dir:', projectDir);
  
  let resourcesPath;
  if (platform === 'darwin') {
    resourcesPath = path.join(appOutDir, 'LunaTV.app/Contents/Resources/app.asar.unpacked');
  } else if (platform === 'win32') {
    resourcesPath = path.join(appOutDir, 'resources/app.asar.unpacked');
  } else {
    resourcesPath = path.join(appOutDir, 'resources/app.asar.unpacked');
  }
  
  try {
    console.log('Installing dependencies with npm in:', resourcesPath);
    
    // 使用 npm install 重新安装依赖，这会创建一个扁平化的 node_modules
    execSync('npm install --production --legacy-peer-deps --ignore-scripts', {
      cwd: resourcesPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    
    console.log('Dependencies installed successfully!');
  } catch (error) {
    console.error('Error installing dependencies:', error);
    throw error;
  }
};
