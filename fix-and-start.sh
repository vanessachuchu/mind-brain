#!/bin/bash

echo "🔧 Mind-Brain 修復與啟動腳本"
echo "================================"

# 檢查系統資訊
echo "📋 系統資訊："
echo "   - 架構: $(uname -m)"
echo "   - macOS: $(sw_vers -productVersion)"
echo "   - Node.js: $(node --version)"

# 清理可能的問題
echo ""
echo "🧹 清理暫存檔案..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# 重新安裝依賴 (使用較少的並發)
echo ""
echo "📦 重新安裝依賴..."
npm cache clean --force
npm install --no-optional --legacy-peer-deps

# 嘗試建構專案
echo ""
echo "🔨 嘗試建構專案..."
npm run build

# 如果建構成功，使用 preview 模式
if [ -d "dist" ]; then
    echo ""
    echo "✅ 建構成功！使用預覽模式啟動..."
    echo "📍 測試網址: http://localhost:4173"
    echo "⏹️  按 Ctrl+C 停止伺服器"
    echo ""
    npm run preview
else
    echo ""
    echo "❌ 建構失敗，嘗試開發模式替代方案..."
    
    # 嘗試使用不同的 Vite 配置
    echo "🔄 使用基本配置啟動..."
    npx vite --config /dev/null --host localhost --port 3000
fi