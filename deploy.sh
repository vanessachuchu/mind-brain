#!/bin/bash

# Mind Brain 自動部署腳本
echo "🚀 開始部署 Mind Brain 應用..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤: 請在項目根目錄執行此腳本"
    exit 1
fi

# 安裝依賴
echo "📦 安裝依賴..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依賴安裝失敗"
    exit 1
fi

# 測試建置
echo "🔨 測試建置..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 建置失敗，請檢查代碼"
    exit 1
fi

echo "✅ 建置成功!"

# 檢查 git 狀態
if [ ! -d ".git" ]; then
    echo "📝 初始化 git 倉庫..."
    git init
    git remote add origin https://github.com/vanessachuchu/mind-brain.git
fi

# 添加所有更改
echo "📝 添加文件到 git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "Deploy improved mind mapping application

🎯 主要改進:
- 簡化用戶體驗 (無需登入)
- 增強記錄想法按鈕設計
- 修復語音輸入功能
- 智能心智圖分析 (支援離線分析)
- 響應式設計適配所有裝置
- 自動調整視圖大小

🚀 Generated and deployed by Claude Code"

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署腳本執行完成!"
    echo ""
    echo "📋 接下來的步驟:"
    echo "1. 前往 https://github.com/vanessachuchu/mind-brain/actions"
    echo "2. 等待 GitHub Actions 完成部署 (約 2-5 分鐘)"
    echo "3. 訪問您的應用: https://vanessachuchu.github.io/mind-brain/"
    echo ""
    echo "💡 如果是首次部署，記得在 GitHub Pages 設定中選擇 'GitHub Actions' 作為來源"
else
    echo "❌ 推送失敗，請檢查:"
    echo "1. 您的 GitHub 認證是否正確"
    echo "2. 倉庫權限是否足夠"
    echo "3. 網路連接是否正常"
fi