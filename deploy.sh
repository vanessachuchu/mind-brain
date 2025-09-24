#!/bin/bash

# Mind Brain 自動部署腳本
echo "🚀 開始部署 Mind Brain 應用..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤: 請在項目根目錄執行此腳本"
    exit 1
fi

# 檢查 GitHub 認證
echo "🔐 檢查 GitHub 認證..."

# 檢查是否已設置遠端倉庫
if ! git remote get-url origin &> /dev/null; then
    echo "📝 設置遠端倉庫..."
    
    # 檢查是否有 GitHub CLI
    if command -v gh &> /dev/null; then
        echo "✅ 使用 GitHub CLI 設置..."
        gh repo set-default vanessachuchu/mind-brain
        git remote add origin https://github.com/vanessachuchu/mind-brain.git
    else
        echo "⚠️  請先設置 GitHub 認證:"
        echo "方法1: Personal Access Token"
        echo "git remote add origin https://用戶名:TOKEN@github.com/vanessachuchu/mind-brain.git"
        echo ""
        echo "方法2: SSH Key" 
        echo "git remote add origin git@github.com:vanessachuchu/mind-brain.git"
        echo ""
        echo "方法3: 安裝 GitHub CLI"
        echo "brew install gh && gh auth login"
        exit 1
    fi
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
fi

# 添加所有更改
echo "📝 添加文件到 git..."
git add .

# 檢查是否有變更
if git diff --cached --quiet; then
    echo "ℹ️  沒有檔案變更，跳過提交"
else
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
- 修復 GitHub Pages 部署配置

🚀 Generated and deployed by Claude Code"
fi

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署腳本執行完成!"
    echo ""
    echo "📋 接下來的步驟:"
    echo "1. 等待 GitHub Actions 完成部署 (約 2-5 分鐘)"
    echo "   查看進度: https://github.com/vanessachuchu/mind-brain/actions"
    echo "2. 訪問您的應用: https://vanessachuchu.github.io/mind-brain/"
    echo ""
    echo "🔍 如果部署失敗，請檢查:"
    echo "- Actions 頁面的錯誤日誌"
    echo "- GitHub Pages 設定是否正確"
    echo ""
    echo "💡 提示: GitHub Pages 會自動使用 gh-pages 分支"
else
    echo ""
    echo "❌ 推送失敗，可能的原因:"
    echo "1. GitHub 認證未正確設置"
    echo "2. 倉庫權限不足"
    echo "3. 網路連接問題"
    echo ""
    echo "🔧 建議解決方案:"
    echo "1. 設置 Personal Access Token:"
    echo "   git remote set-url origin https://用戶名:TOKEN@github.com/vanessachuchu/mind-brain.git"
    echo "2. 或安裝並登入 GitHub CLI:"
    echo "   brew install gh && gh auth login"
    exit 1
fi