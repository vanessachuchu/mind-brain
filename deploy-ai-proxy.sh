#!/bin/bash

echo "🚀 部署 AI 代理服務到 Supabase Edge Functions"
echo "=============================================="

# 檢查是否安裝了 Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安裝"
    echo "請先安裝 Supabase CLI: https://supabase.com/docs/guides/cli"
    echo ""
    echo "安裝命令："
    echo "npm install -g supabase"
    echo "或"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI 已安裝"

# 檢查是否已登入
echo ""
echo "📝 檢查登入狀態..."
if ! supabase projects list >/dev/null 2>&1; then
    echo "⚠️  請先登入 Supabase："
    echo "supabase login"
    exit 1
fi

echo "✅ 已登入 Supabase"

# 部署 Edge Function
echo ""
echo "🔧 部署 ai-proxy Edge Function..."
supabase functions deploy ai-proxy --project-ref ajrwyazsbsnuszwzxkuw

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ AI 代理服務部署成功！"
    echo ""
    echo "📋 接下來需要設定環境變數："
    echo "1. 前往 Supabase Dashboard: https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw"
    echo "2. 選擇 Edge Functions > ai-proxy"
    echo "3. 在 Settings 中添加環境變數："
    echo "   OPENAI_API_KEY=您的OpenAI_API_Key"
    echo ""
    echo "🌐 API 端點："
    echo "https://ajrwyazsbsnuszwzxkuw.supabase.co/functions/v1/ai-proxy"
else
    echo "❌ 部署失敗，請檢查錯誤訊息"
    exit 1
fi