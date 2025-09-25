# Notion OAuth 設定指南

## 🎯 概覽

本應用現在支援 **Notion OAuth 一鍵授權**，用戶無需手動複製 API Token，只需點擊按鈕即可完成授權。

## 🔧 開發者設定步驟

### 1. 創建 Notion OAuth 應用

1. 訪問 [Notion Integrations](https://www.notion.so/my-integrations)
2. 點擊 "New integration"
3. 填寫基本信息：
   - **Name**: Mind Brain App
   - **Logo**: 選擇應用圖標
   - **Associated workspace**: 選擇工作空間

### 2. 配置 OAuth 設定

在 Integration 設定頁面中：

1. **Capabilities** 部分：
   - ✅ Read content
   - ✅ Update content  
   - ✅ Insert content

2. **OAuth Domain & URIs** 部分：
   - **Redirect URIs**: 
     - `http://localhost:5173/auth/notion/callback` (開發環境)
     - `https://vanessachuchu.github.io/mind-brain/auth/notion/callback` (生產環境)

3. **Client Information** 部分：
   - 記錄 **OAuth client ID**
   - 記錄 **OAuth client secret**

### 3. 環境變數設定

#### 本地開發環境 (.env.local)
```bash
VITE_NOTION_CLIENT_ID=your_notion_oauth_client_id
VITE_NOTION_CLIENT_SECRET=your_notion_oauth_client_secret
```

#### Supabase Edge Functions 環境變數
在 Supabase Dashboard > Project Settings > Edge Functions 中設定：
```bash
NOTION_CLIENT_ID=your_notion_oauth_client_id
NOTION_CLIENT_SECRET=your_notion_oauth_client_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. 部署 Supabase Functions

```bash
# 部署 OAuth 回調處理函數
supabase functions deploy notion-oauth-callback --project-ref YOUR_PROJECT_REF

# 如果需要，也更新現有的 notion-sync 函數
supabase functions deploy notion-sync --project-ref YOUR_PROJECT_REF
```

## 🚀 用戶使用流程

### OAuth 方式（推薦）
1. 用戶進入「設定」頁面
2. 選擇「一鍵連接（推薦）」模式
3. 點擊「一鍵連接 Notion」按鈕
4. 跳轉到 Notion 授權頁面
5. 用戶確認授權後自動返回應用
6. ✅ 完成設定，可以開始同步

### 手動設定方式（備選）
1. 用戶選擇「手動設定」模式
2. 按照原有流程手動輸入 API Token 和資料庫 ID
3. 測試連接並保存設定

## 🔒 安全性

- OAuth Token 安全存儲在 Supabase 資料庫中
- 支援 Row Level Security (RLS)
- 所有 API 調用都經過授權驗證
- 支援 Token 自動更新機制

## 🎨 UI/UX 特色

- **雙模式選擇**：OAuth vs 手動設定
- **漸層按鈕**：一鍵連接 Notion 使用吸睛的漸層設計
- **實時狀態**：連接狀態、錯誤處理、載入動畫
- **響應式設計**：適配各種裝置螢幕

## 🐛 故障排除

### 常見問題

1. **授權失敗**：檢查 Redirect URI 是否正確配置
2. **環境變數錯誤**：確認所有必要的環境變數都已設定
3. **CORS 錯誤**：確認 Edge Function 已正確部署

### 調試工具

```bash
# 檢查 Supabase Functions 日誌
supabase functions logs --project-ref YOUR_PROJECT_REF

# 本地測試 Edge Functions
supabase functions serve --env-file .env.local
```

## ✨ 未來優化

- [ ] 支援多個 Notion 工作空間
- [ ] 自動創建標準化資料庫模板
- [ ] 批次操作和衝突解決
- [ ] 更精細的欄位映射設定