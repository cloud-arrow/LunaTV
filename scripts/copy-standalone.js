const fs = require('fs-extra');
const path = require('path');

const source = path.join(__dirname, '..', '.next', 'standalone');
const target = path.join(__dirname, '..', '.next', 'standalone-copy');

async function copyStandalone() {
  try {
    console.log('🗑️  Removing old standalone-copy...');
    await fs.remove(target);
    
    console.log('📂 Copying standalone to standalone-copy...');
    await fs.copy(source, target, {
      dereference: true, // 类似 rsync -L，解析符号链接
      preserveTimestamps: true
    });
    
    console.log('✅ Standalone copied successfully!');
  } catch (error) {
    console.error('❌ Failed to copy standalone:', error);
    process.exit(1);
  }
}

copyStandalone();
