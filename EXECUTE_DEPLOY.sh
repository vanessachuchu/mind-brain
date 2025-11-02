#!/bin/bash

echo "======================================"
echo "  🚀 執行 AI Proxy 部署"
echo "======================================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}正在部署 ai-proxy Edge Function...${NC}"
echo ""

# 執行部署
supabase functions deploy ai-proxy --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "  ✅ 部署成功！"
    echo "======================================${NC}"
    echo ""
    echo "接下來："
    echo "1. 確保已在 Dashboard 設置 OPENAI_API_KEY"
    echo "2. 執行測試："
    echo "   ./test-ai-proxy.sh"
    echo ""
else
    echo ""
    echo -e "${RED}======================================"
    echo "  ❌ 部署失敗"
    echo "======================================${NC}"
    echo ""
    echo "可能的原因："
    echo "1. 未登入 Supabase (執行: supabase login)"
    echo "2. 未連結專案 (執行: supabase link --project-ref ajrwyazsbsnuszwzxkuw)"
    echo "3. 網絡問題"
    echo ""
    echo "請檢查錯誤訊息並重試"
fi
