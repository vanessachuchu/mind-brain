# 🚀 立即部署 - 在您已登入的終端執行

## ⚠️ 重要
由於您已經在某個終端連結了 Supabase，請在**那個終端**執行以下命令：

---

## 📝 執行這 3 個命令

### 1️⃣ 進入專案目錄
```bash
cd /Users/v/Desktop/mind-brain/mind-brain
```

### 2️⃣ 部署 AI Proxy 函數
```bash
supabase functions deploy ai-proxy --no-verify-jwt
```

預期輸出：
```
Deploying function ai-proxy...
Function deployed successfully!
```

### 3️⃣ 設置 OpenAI API Key
```bash
supabase secrets set OPENAI_API_KEY=your_actual_openai_api_key_here
```

**替換 `your_actual_openai_api_key_here` 為您的真實 API Key**

---

## ✅ 驗證部署

執行測試腳本：
```bash
./test-ai-proxy.sh
```

應該看到：
```
✅ Supabase Edge Function 可訪問
```

---

## 🎯 完整步驟（複製貼上）

```bash
cd /Users/v/Desktop/mind-brain/mind-brain
supabase functions deploy ai-proxy --no-verify-jwt
supabase secrets set OPENAI_API_KEY=sk-xxx  # 替換為您的 API Key
./test-ai-proxy.sh
```

---

## ❓ 如果遇到錯誤

### 錯誤：未登入
```bash
supabase login
```

### 錯誤：未連結專案
```bash
supabase link --project-ref ajrwyazsbsnuszwzxkuw
```

### 錯誤：找不到 supabase 命令
安裝 Supabase CLI：
```bash
brew install supabase/tap/supabase
```

---

## 📞 獲取 OpenAI API Key

如果您還沒有 OpenAI API Key：
1. 前往：https://platform.openai.com/api-keys
2. 登入您的 OpenAI 帳號
3. 點擊 "Create new secret key"
4. 複製 key（格式：sk-xxxxxx）
5. 使用上面的 `supabase secrets set` 命令設置

---

## 🎉 完成後

AI 功能就可以正常使用了！包括：
- 💬 AI 深度對話
- 📋 AI 行動計劃生成
- ✨ 智慧建議
