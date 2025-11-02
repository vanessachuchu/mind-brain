# Supabase Edge Function 部署指南

## 問題診斷

您的 AI 功能無法使用是因為 Supabase Edge Function (`ai-proxy`) 尚未部署或配置。

## 解決方案

### 方案 1：部署 Supabase Edge Function（推薦）

#### 步驟 1：安裝 Supabase CLI

在終端機中執行以下命令之一：

```bash
# macOS (使用 Homebrew)
brew install supabase/tap/supabase

# 或使用 npm (需要 sudo 權限)
sudo npm install -g supabase

# 或下載二進制文件
# 訪問: https://github.com/supabase/cli/releases
```

#### 步驟 2：登入 Supabase

```bash
supabase login
```

這會打開瀏覽器讓您登入 Supabase 帳號。

#### 步驟 3：連結專案

```bash
cd /Users/v/Desktop/mind-brain/mind-brain
supabase link --project-ref ajrwyazsbsnuszwzxkuw
```

#### 步驟 4：設置環境變數

在 Supabase Dashboard 中設置 `OPENAI_API_KEY`：

1. 前往 https://supabase.com/dashboard/project/ajrwyazsbsnuszwzxkuw
2. 點擊左側菜單的 "Edge Functions"
3. 點擊 "Manage secrets"
4. 添加密鑰：
   - Key: `OPENAI_API_KEY`
   - Value: 您的 OpenAI API Key

或使用 CLI 設置：

```bash
supabase secrets set OPENAI_API_KEY=您的OpenAI_API_Key
```

#### 步驟 5：部署 Edge Function

```bash
supabase functions deploy ai-proxy
```

#### 步驟 6：測試部署

```bash
curl -X POST https://ajrwyazsbsnuszwzxkuw.supabase.co/functions/v1/ai-proxy \
  -H "Content-Type: application/json" \
  -d '{"type": "deep-dive", "messages": [{"role": "user", "content": "測試"}]}'
```

---

### 方案 2：使用本地 AI Proxy（臨時方案）

如果您暫時無法部署 Supabase Edge Function，可以創建一個本地代理服務器：

#### 步驟 1：創建本地代理

創建文件 `local-ai-proxy/server.js`：

```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = '您的OpenAI_API_Key'; // 替換為您的 API Key

app.post('/ai-proxy', async (req, res) => {
  try {
    const { messages, type } = req.body;

    let systemPrompt = "";
    if (type === 'deep-dive') {
      systemPrompt = "你是脈德小腦瓜的智慧引導者...";
    } else if (type === 'action-plan') {
      systemPrompt = "你是一個專業的行動規劃助手...";
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          ...messages
        ],
        temperature: 0.7,
        max_tokens: type === 'action-plan' ? 1500 : 800
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Local AI Proxy running on http://localhost:3001');
});
```

#### 步驟 2：安裝依賴並啟動

```bash
mkdir local-ai-proxy
cd local-ai-proxy
npm init -y
npm install express cors node-fetch@2
node server.js
```

#### 步驟 3：更新配置

修改 `src/config/ai.ts`：

```typescript
export const AI_CONFIG = {
  AI_PROXY_URL: "http://localhost:3001/ai-proxy",  // 改為本地
  // ...其他配置
};
```

---

### 方案 3：直接使用 OpenAI API（不推薦，API Key 會暴露）

修改 `src/config/ai.ts`：

```typescript
export const AI_CONFIG = {
  OPENAI_API_KEY: "您的OpenAI_API_Key",  // 直接填入
  USE_PROXY: false,  // 新增此選項
  // ...
};
```

然後修改 `src/hooks/useAiDeepDive.ts` 和 `src/hooks/useAiActionGenerator.ts`，直接呼叫 OpenAI API。

⚠️ **警告：此方法會將 API Key 暴露在前端代碼中，不安全！**

---

## 推薦步驟

1. ✅ 使用方案 1 部署 Supabase Edge Function（最安全）
2. 如果急需使用，先用方案 2 作為臨時解決方案
3. 避免使用方案 3

## 需要幫助？

如果遇到問題，請檢查：
1. Supabase 專案是否存在
2. OpenAI API Key 是否有效
3. 網絡連接是否正常
4. Supabase 控制台的 Edge Functions 日誌
