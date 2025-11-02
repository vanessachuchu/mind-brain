#!/bin/bash

echo "====================================="
echo "  🔑 設置 OpenAI API Key"
echo "====================================="
echo ""

# 檢查參數
if [ -z "$1" ]; then
  echo "使用方法："
  echo "  ./set-openai-key.sh your_openai_api_key_here"
  echo ""
  echo "或者直接執行此命令："
  echo "  SUPABASE_ACCESS_TOKEN=sbp_86020419533584b94762c60a5082b39eec8498fb \\"
  echo "  npx supabase@latest secrets set OPENAI_API_KEY=your_key_here \\"
  echo "  --project-ref ajrwyazsbsnuszwzxkuw"
  exit 1
fi

API_KEY="$1"

echo "正在設置 OPENAI_API_KEY..."
echo ""

SUPABASE_ACCESS_TOKEN=sbp_86020419533584b94762c60a5082b39eec8498fb \
npx supabase@latest secrets set OPENAI_API_KEY="$API_KEY" \
--project-ref ajrwyazsbsnuszwzxkuw

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ API Key 設置成功！"
  echo ""
  echo "現在重新部署函數..."
  SUPABASE_ACCESS_TOKEN=sbp_86020419533584b94762c60a5082b39eec8498fb \
  npx supabase@latest functions deploy ai-proxy \
  --project-ref ajrwyazsbsnuszwzxkuw

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 重新部署成功！"
    echo ""
    echo "執行測試："
    ./test-ai-proxy.sh
  fi
else
  echo "❌ 設置失敗，請檢查錯誤訊息"
fi
