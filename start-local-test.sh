#!/bin/bash

echo "🧠 Mind Brain 本地測試站啟動腳本"
echo "================================"

# 檢查 Node.js 版本
echo "檢查 Node.js 版本..."
node --version

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo "安裝專案依賴..."
    npm install
fi

# 檢查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ 缺少 .env 文件，正在創建..."
    cp .env.example .env
    echo "✅ 已創建 .env 文件，請編輯並添加你的 OpenAI API Key"
else
    echo "✅ 找到 .env 文件"
fi

# 檢查 OpenAI API Key
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  請在 .env 文件中設置你的 OpenAI API Key"
    echo "   編輯 .env 文件，將 VITE_OPENAI_API_KEY 設為你的實際 API Key"
    echo "   沒有 API Key？請到 https://platform.openai.com/api-keys 申請"
fi

echo ""
echo "🚀 正在啟動開發服務器..."
echo "   本地測試站將在以下網址啟動："
echo "   - http://localhost:3000"
echo "   - http://127.0.0.1:3000"
echo "   按 Ctrl+C 停止服務器"
echo ""

# 啟動開發服務器
exec npm run dev