# 🎯 在 Supabase Dashboard 上設置 API Key

## 方法 1：使用 Supabase Dashboard（推薦，最簡單）

### 步驟 1：打開 Supabase Dashboard

點擊或複製此連結到瀏覽器：

```
https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw/settings/functions
```

### 步驟 2：找到 Edge Functions Secrets

1. 登入您的 Supabase 帳號
2. 您會看到專案設置頁面
3. 在左側菜單中，確保您在 **Settings** → **Edge Functions**

或者：

1. 前往：https://supabase.com/dashboard
2. 點擊您的專案（ID: ajrwyazsbsnuszwzxkuw）
3. 左側菜單點擊 **Settings** ⚙️
4. 再點擊 **Edge Functions**

### 步驟 3：管理 Secrets

在 Edge Functions 設置頁面：

1. 找到 **"Secrets"** 或 **"Environment Variables"** 部分
2. 點擊 **"Add secret"** 或 **"New secret"** 按鈕

### 步驟 4：添加 OPENAI_API_KEY

填寫：
- **Name/Key**: `OPENAI_API_KEY`
- **Value**: 您的 OpenAI API Key（格式：`sk-xxxxxxxxxx`）

然後點擊 **"Save"** 或 **"Add secret"**

### 步驟 5：部署函數

設置完 Secret 後，在終端執行：

```bash
cd /Users/v/Desktop/mind-brain/mind-brain
supabase functions deploy ai-proxy --no-verify-jwt
```

---

## 方法 2：使用命令行（如果 Dashboard 不好用）

如果您已經登入 Supabase CLI：

```bash
# 設置密鑰
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here

# 查看已設置的密鑰（值會被隱藏）
supabase secrets list

# 部署函數
supabase functions deploy ai-proxy --no-verify-jwt
```

---

## 📸 Dashboard 截圖指引

### 找到 Edge Functions 設置

在 Supabase Dashboard 中，路徑是：
```
Dashboard → [您的專案] → Settings → Edge Functions
```

或直接訪問：
```
https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw/settings/functions
```

### Secrets 部分看起來像這樣：

```
┌─────────────────────────────────────────┐
│  Edge Function Secrets                  │
├─────────────────────────────────────────┤
│  Name              | Value              │
├─────────────────────────────────────────┤
│  [Add new secret]                       │
│  [+ Add secret]                         │
└─────────────────────────────────────────┘
```

點擊 **[+ Add secret]** 後：

```
┌─────────────────────────────────────────┐
│  Add new secret                         │
├─────────────────────────────────────────┤
│  Name:                                  │
│  [OPENAI_API_KEY                     ]  │
│                                         │
│  Value:                                 │
│  [sk-xxxxxxxxxxxxxxxxxx              ]  │
│                                         │
│         [Cancel]  [Add secret]          │
└─────────────────────────────────────────┘
```

---

## 🔑 獲取 OpenAI API Key

### 如果您還沒有 API Key：

1. **前往 OpenAI Platform**
   ```
   https://platform.openai.com/api-keys
   ```

2. **登入您的 OpenAI 帳號**
   - 如果沒有帳號，先註冊一個

3. **創建新的 API Key**
   - 點擊 **"Create new secret key"**
   - 給它一個名稱，例如：`mind-brain-app`
   - 點擊 **"Create secret key"**

4. **複製 API Key**
   - ⚠️ **重要**：API Key 只會顯示一次！
   - 立即複製並保存（格式：`sk-proj-xxxxx` 或 `sk-xxxxx`）

5. **貼到 Supabase**
   - 回到 Supabase Dashboard
   - 將複製的 key 貼到 Value 欄位

---

## ✅ 驗證設置

### 方法 1：在 Dashboard 查看

設置完成後，您應該在 Secrets 列表中看到：
```
┌─────────────────────────────────────────┐
│  Name              | Value              │
├─────────────────────────────────────────┤
│  OPENAI_API_KEY    | sk-••••••••••••   │
└─────────────────────────────────────────┘
```

### 方法 2：使用 CLI 查看

```bash
supabase secrets list
```

應該顯示：
```
OPENAI_API_KEY
```

### 方法 3：測試部署

```bash
# 部署函數
supabase functions deploy ai-proxy --no-verify-jwt

# 測試
./test-ai-proxy.sh
```

---

## ❓ 常見問題

### Q: 找不到 Edge Functions 設置？
**A:** 確保：
1. 您已登入 Supabase
2. 選擇了正確的專案（ajrwyazsbsnuszwzxkuw）
3. 直接訪問：https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw/settings/functions

### Q: 沒有 "Add secret" 按鈕？
**A:** 可能是權限問題，請確保：
1. 您是專案的 Owner 或有適當權限
2. 嘗試重新整理頁面
3. 或使用 CLI 方法

### Q: API Key 格式不對？
**A:** OpenAI API Key 格式：
- 舊格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 新格式：`sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

兩種都可以使用！

### Q: 設置後還是不能用？
**A:** 檢查清單：
1. ✅ Secret 已添加（名稱：OPENAI_API_KEY）
2. ✅ 重新部署了函數：`supabase functions deploy ai-proxy`
3. ✅ API Key 有效（在 OpenAI Platform 查看）
4. ✅ 執行測試：`./test-ai-proxy.sh`

---

## 🎉 完成！

設置完成後：

```bash
# 測試一下
./test-ai-proxy.sh
```

看到 `✅` 就成功了！您的 AI 功能現在可以正常使用了！

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 [DEPLOY_NOW.md](./DEPLOY_NOW.md)
2. 查看 [SUPABASE_DEPLOY_GUIDE.md](./SUPABASE_DEPLOY_GUIDE.md)
3. 查看 Supabase Edge Functions 日誌
