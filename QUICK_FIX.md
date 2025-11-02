# 🚀 快速修復 AI Proxy - 3 步驟

## 當前狀態
✅ Supabase 已連結
⏳ 需要部署 Edge Function
⏳ 需要設置 API Key

---

## 📝 執行步驟

### 1️⃣ 部署 AI Proxy 函數

在**您的終端**（非 IDE）中執行：

```bash
cd /Users/v/Desktop/mind-brain/mind-brain
./deploy-ai-proxy.sh
```

這個腳本會自動：
- ✅ 檢查 Supabase CLI
- ✅ 確認專案連結
- ✅ 部署 `ai-proxy` 函數

---

### 2️⃣ 設置 OpenAI API Key

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

**或者**在 Supabase Dashboard 設置：
👉 https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw/settings/functions

---

### 3️⃣ 測試

```bash
./test-ai-proxy.sh
```

如果看到 `✅ Supabase Edge Function 可訪問`，就成功了！

---

## ❓ 常見問題

### Q: 如果沒有 OpenAI API Key？
A: 前往 https://platform.openai.com/api-keys 創建一個

### Q: 部署失敗？
A: 確保：
1. 已經執行 `supabase login`
2. 網絡連接正常
3. 有專案的訪問權限

### Q: 測試失敗？
A: 檢查：
1. Edge Function 是否部署成功
2. OPENAI_API_KEY 是否設置
3. API Key 是否有效

---

## 📞 需要更多幫助？

查看詳細文檔：
- [SUPABASE_DEPLOY_GUIDE.md](./SUPABASE_DEPLOY_GUIDE.md) - 完整部署指南
- [test-ai-proxy.sh](./test-ai-proxy.sh) - 測試腳本
- [deploy-ai-proxy.sh](./deploy-ai-proxy.sh) - 部署腳本
