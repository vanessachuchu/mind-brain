#!/bin/bash

echo "==================================="
echo "  🚀 部署 AI Proxy Edge Function"
echo "==================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查是否在正確的目錄
if [ ! -d "supabase/functions/ai-proxy" ]; then
  echo -e "${RED}❌ 錯誤：找不到 supabase/functions/ai-proxy 目錄${NC}"
  echo "請確保在專案根目錄執行此腳本"
  exit 1
fi

# 步驟 1: 檢查 Supabase CLI
echo -e "${YELLOW}步驟 1/4: 檢查 Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI 未安裝${NC}"
    echo ""
    echo "請先安裝 Supabase CLI："
    echo "  brew install supabase/tap/supabase"
    echo "  或"
    echo "  npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI 已安裝${NC}"
echo ""

# 步驟 2: 檢查連結狀態
echo -e "${YELLOW}步驟 2/4: 檢查專案連結...${NC}"
if supabase status &> /dev/null; then
    echo -e "${GREEN}✅ 專案已連結${NC}"
else
    echo -e "${YELLOW}⚠️  專案未連結，正在連結...${NC}"
    supabase link --project-ref ajrwyazsbsnuszwzxkuw
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 連結失敗${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 專案連結成功${NC}"
fi
echo ""

# 步驟 3: 部署函數
echo -e "${YELLOW}步驟 3/4: 部署 ai-proxy 函數...${NC}"
supabase functions deploy ai-proxy --no-verify-jwt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 部署失敗${NC}"
    echo ""
    echo "常見問題："
    echo "1. 確保已登入：supabase login"
    echo "2. 檢查網絡連接"
    echo "3. 查看錯誤訊息"
    exit 1
fi
echo -e "${GREEN}✅ 函數部署成功！${NC}"
echo ""

# 步驟 4: 檢查環境變數
echo -e "${YELLOW}步驟 4/4: 檢查環境變數...${NC}"
echo ""
echo -e "${YELLOW}⚠️  重要：請確保已設置 OPENAI_API_KEY${NC}"
echo ""
echo "設置方法："
echo "  supabase secrets set OPENAI_API_KEY=your_openai_api_key_here"
echo ""
echo "或在 Supabase Dashboard 中設置："
echo "  https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw/settings/functions"
echo ""

# 測試部署
echo "==================================="
echo "  ✅ 部署完成！"
echo "==================================="
echo ""
echo "執行測試："
echo "  ./test-ai-proxy.sh"
echo ""
echo "如果測試通過，您的 AI 功能就可以正常使用了！"
echo ""
