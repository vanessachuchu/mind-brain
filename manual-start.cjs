#!/usr/bin/env node

// 手動啟動腳本 - 避免 Bus error 問題
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 手動啟動 Mind-Brain 開發伺服器...');
console.log('📍 本地測試網址: http://localhost:3000');
console.log('⏹️  按 Ctrl+C 停止伺服器\n');

// 直接執行 vite
const vite = spawn('./node_modules/.bin/vite', ['--host', '0.0.0.0', '--port', '3000'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

vite.on('error', (err) => {
  console.error('❌ 啟動失敗:', err.message);
});

vite.on('close', (code) => {
  console.log(`\n📴 開發伺服器已停止 (code: ${code})`);
});

// 處理中斷信號
process.on('SIGINT', () => {
  console.log('\n🛑 收到停止信號，正在關閉伺服器...');
  vite.kill('SIGINT');
});