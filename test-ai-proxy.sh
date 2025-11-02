#!/bin/bash

echo "=== AI Proxy 測試腳本 ==="
echo ""

# 測試 Supabase Edge Function
echo "1. 測試 Supabase Edge Function..."
echo "URL: https://ajrwyazsbsnuszwzxkuw.supabase.co/functions/v1/ai-proxy"
echo ""

response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  https://ajrwyazsbsnuszwzxkuw.supabase.co/functions/v1/ai-proxy 2>&1)

if [ "$response" = "200" ] || [ "$response" = "204" ]; then
  echo "✅ Supabase Edge Function 可訪問"
  echo ""
  echo "2. 測試 POST 請求..."
  curl -X POST https://ajrwyazsbsnuszwzxkuw.supabase.co/functions/v1/ai-proxy \
    -H "Content-Type: application/json" \
    -d '{"type": "deep-dive", "messages": [{"role": "user", "content": "測試"}]}' \
    | jq '.' || echo "回應不是 JSON 格式"
else
  echo "❌ Supabase Edge Function 無法訪問"
  echo "HTTP 狀態碼: $response"
  echo ""
  echo "可能的原因："
  echo "1. Edge Function 未部署"
  echo "2. 專案 ID 不正確"
  echo "3. 網絡問題"
  echo ""
  echo "請參考 SUPABASE_DEPLOY_GUIDE.md 進行部署"
fi

echo ""
echo "=== 測試完成 ==="
