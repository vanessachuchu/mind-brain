# 🔑 如何獲取 Supabase 訪問令牌

## 方法 1：使用 Supabase CLI 登入（最簡單）

### 在您的終端執行：

```bash
supabase login
```

這會：
1. 打開瀏覽器
2. 要求您登入 Supabase
3. 自動保存訪問令牌到本地
4. 之後所有命令都會自動使用這個令牌

**完成後直接執行部署：**
```bash
supabase functions deploy ai-proxy --no-verify-jwt
```

---

## 方法 2：從 Supabase Dashboard 獲取令牌

### 步驟 1：前往 Access Tokens 頁面

打開瀏覽器，訪問：
```
https://supabase.com/dashboard/account/tokens
```

或手動導航：
1. 前往 https://supabase.com/dashboard
2. 點擊右上角您的頭像
3. 選擇 **"Access Tokens"**

### 步驟 2：生成新令牌

1. 點擊 **"Generate new token"** 或 **"Create token"**
2. 給令牌一個名稱，例如：`mind-brain-deploy`
3. 設置過期時間（建議：不過期或長期有效）
4. 點擊 **"Generate token"**

### 步驟 3：複製令牌

⚠️ **重要**：令牌只會顯示一次！立即複製並保存。

格式類似：`sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 步驟 4：使用令牌

#### 選項 A：設置環境變數（推薦）

在您的終端執行：

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_actual_token_here
```

然後執行部署：
```bash
supabase functions deploy ai-proxy --no-verify-jwt
```

#### 選項 B：直接在命令中使用

```bash
SUPABASE_ACCESS_TOKEN=sbp_your_token supabase functions deploy ai-proxy --no-verify-jwt
```

#### 選項 C：保存到配置文件（長期使用）

編輯您的 shell 配置文件：

```bash
# 如果使用 bash
echo 'export SUPABASE_ACCESS_TOKEN=sbp_your_token' >> ~/.bashrc
source ~/.bashrc

# 如果使用 zsh
echo 'export SUPABASE_ACCESS_TOKEN=sbp_your_token' >> ~/.zshrc
source ~/.zshrc
```

---

## 方法 3：檢查是否已經登入

### 查看當前登入狀態：

```bash
supabase projects list
```

如果能看到專案列表，說明已經登入。

### 查看本地保存的令牌位置：

```bash
# macOS/Linux
cat ~/.supabase/access-token

# 或查看配置
ls -la ~/.supabase/
```

---

## 🚀 快速開始（推薦流程）

### 最簡單的方式：

```bash
# 1. 登入（會自動打開瀏覽器）
supabase login

# 2. 確認連結專案
supabase link --project-ref ajrwyazsbsnuszwzxkuw

# 3. 部署
supabase functions deploy ai-proxy --no-verify-jwt

# 4. 測試
./test-ai-proxy.sh
```

---

## 📸 Dashboard 截圖指引

### 找到 Access Tokens 頁面：

```
Dashboard → 右上角頭像 → Access Tokens
```

或直接訪問：
```
https://supabase.com/dashboard/account/tokens
```

### 頁面看起來像這樣：

```
┌──────────────────────────────────────────┐
│  Access Tokens                           │
├──────────────────────────────────────────┤
│  Personal access tokens for API and CLI  │
│                                          │
│  [+ Generate new token]                  │
│                                          │
│  Name          | Created    | Expires   │
│  ─────────────────────────────────────  │
│  (your tokens) | (dates)    | (dates)   │
└──────────────────────────────────────────┘
```

---

## ❓ 常見問題

### Q: `supabase login` 沒有打開瀏覽器？
**A:** 手動訪問顯示的 URL，完成授權後複製令牌。

### Q: 令牌過期了怎麼辦？
**A:** 重新執行 `supabase login` 或生成新令牌。

### Q: 忘記保存令牌了？
**A:** 需要重新生成一個新令牌（舊令牌無法再次查看）。

### Q: 可以用專案 API Key 嗎？
**A:** 不可以。部署需要**個人訪問令牌**，不是專案的 API Key。

---

## ✅ 驗證令牌是否有效

執行以下命令測試：

```bash
# 方法 1：使用環境變數
export SUPABASE_ACCESS_TOKEN=your_token_here
supabase projects list

# 方法 2：直接使用
SUPABASE_ACCESS_TOKEN=your_token supabase projects list
```

如果能看到專案列表，令牌就是有效的！

---

## 🎯 現在就開始

### 最快的方式（2 分鐘）：

1. 在終端執行：
   ```bash
   supabase login
   ```

2. 在打開的瀏覽器中授權

3. 回到終端執行：
   ```bash
   supabase functions deploy ai-proxy --no-verify-jwt
   ```

就這麼簡單！🚀
